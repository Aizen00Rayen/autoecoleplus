import { useState, useEffect } from 'react';
import { LanguageProvider, useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import {
  Video, Play, Heart, MessageCircle, Send, User, Loader2,
  ArrowLeft, Clock, Eye, X
} from 'lucide-react';
import { supabase } from '../supabase';
import '../components/style/theme.css';

const VideosContent = () => {
  const { language } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [videos, setVideos] = useState<any[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<any>(null);
  const [showVideoPlayer, setShowVideoPlayer] = useState(false);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [userLikes, setUserLikes] = useState<{[key: string]: boolean}>({});
  const [studentData, setStudentData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const t = (ar: string, fr: string, en: string) => language === 'ar' ? ar : language === 'fr' ? fr : en;

  useEffect(() => {
    const fetchStudentData = async () => {
      if (!user?.uid) return;
      try {
        const { data } = await supabase.from('users').select('*').eq('id', user.uid).single();
        if (data) setStudentData(data);
      } catch (e) { console.error(e); }
    };
    fetchStudentData();
  }, [user?.uid]);

  useEffect(() => {
    const fetchVideos = async () => {
      if (!user?.uid || !studentData?.teacherId) return;
      setLoading(true);
      try {
        const { data: videosList } = await supabase.from('educationalVideos').select('*').eq('teacherId', studentData.teacherId);
        const { data: teacherDoc } = await supabase.from('users').select('*').eq('id', studentData.teacherId).single();
        const teacherPhotoURL = teacherDoc ? teacherDoc.photoURL : null;
        const videosWithData = await Promise.all((videosList || []).map(async (video) => {
          const { count: commentsCount } = await supabase.from('videoComments').select('*', { count: 'exact', head: true }).eq('videoId', video.id);
          return { ...video, teacherPhotoURL, commentsCount: commentsCount || 0 };
        }));
        videosWithData.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setVideos(videosWithData);
      } catch (e) {
        console.error(e);
        setError(t('حدث خطأ أثناء جلب الفيديوهات', 'Erreur lors du chargement des vidéos', 'Error loading videos'));
      } finally {
        setLoading(false);
      }
    };
    fetchVideos();
  }, [user?.uid, studentData?.teacherId]);

  const handleVideoPlay = async (video: any) => {
    setSelectedVideo(video);
    setShowVideoPlayer(true);
    try {
      const { data: videoRow } = await supabase.from('educationalVideos').select('views').eq('id', video.id).single();
      await supabase.from('educationalVideos').update({ views: (videoRow?.views || 0) + 1 }).eq('id', video.id);
      setVideos(prev => prev.map(v => v.id === video.id ? { ...v, views: (v.views || 0) + 1 } : v));
      await loadVideoComments(video.id);
      await checkUserLike(video.id);
    } catch (e) { console.error(e); }
  };

  const loadVideoComments = async (videoId: string) => {
    try {
      const { data: commentsList } = await supabase.from('videoComments').select('*').eq('videoId', videoId);
      const sorted = (commentsList || []).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setComments(sorted);
    } catch (e) { console.error(e); }
  };

  const checkUserLike = async (videoId: string) => {
    if (!user?.uid) return;
    try {
      const { data: likeRows } = await supabase.from('videoLikes').select('*').eq('videoId', videoId).eq('userId', user.uid);
      setUserLikes(prev => ({ ...prev, [videoId]: !!(likeRows && likeRows.length > 0) }));
    } catch (e) { console.error(e); }
  };

  const handleLike = async (videoId: string) => {
    if (!user?.uid) return;
    try {
      const isLiked = userLikes[videoId];
      if (isLiked) {
        await supabase.from('videoLikes').delete().eq('videoId', videoId).eq('userId', user.uid);
        const { data: vidRow } = await supabase.from('educationalVideos').select('likes').eq('id', videoId).single();
        await supabase.from('educationalVideos').update({ likes: Math.max((vidRow?.likes || 0) - 1, 0) }).eq('id', videoId);
        setUserLikes(prev => ({ ...prev, [videoId]: false }));
        setVideos(prev => prev.map(v => v.id === videoId ? { ...v, likes: Math.max((v.likes || 0) - 1, 0) } : v));
        if (selectedVideo?.id === videoId) setSelectedVideo((prev: any) => ({ ...prev, likes: Math.max((prev.likes || 0) - 1, 0) }));
      } else {
        await supabase.from('videoLikes').insert({ videoId, userId: user.uid, userName: studentData?.fullName || user.name, createdAt: new Date().toISOString() });
        const { data: vidRow } = await supabase.from('educationalVideos').select('likes').eq('id', videoId).single();
        await supabase.from('educationalVideos').update({ likes: (vidRow?.likes || 0) + 1 }).eq('id', videoId);
        setUserLikes(prev => ({ ...prev, [videoId]: true }));
        setVideos(prev => prev.map(v => v.id === videoId ? { ...v, likes: (v.likes || 0) + 1 } : v));
        if (selectedVideo?.id === videoId) setSelectedVideo((prev: any) => ({ ...prev, likes: (prev.likes || 0) + 1 }));
      }
    } catch (e) { console.error(e); }
  };

  const handleCommentSubmit = async () => {
    if (!user?.uid || !selectedVideo || !newComment.trim()) return;
    setIsSubmittingComment(true);
    try {
      const commentData = {
        videoId: selectedVideo.id, userId: user.uid,
        userName: studentData?.fullName || user.name,
        userPhoto: studentData?.photoURL || null,
        comment: newComment.trim(), createdAt: new Date().toISOString(),
      };
      await supabase.from('videoComments').insert(commentData);
      setComments(prev => [commentData, ...prev]);
      setNewComment('');
      setVideos(prev => prev.map(v => v.id === selectedVideo.id ? { ...v, commentsCount: (v.commentsCount || 0) + 1 } : v));
      setMessage(t('تم إضافة التعليق بنجاح!', 'Commentaire ajouté avec succès!', 'Comment added successfully!'));
      setTimeout(() => setMessage(''), 3000);
    } catch (e) {
      console.error(e);
      setError(t('حدث خطأ أثناء إضافة التعليق', 'Erreur lors de l\'ajout', 'Error adding comment'));
      setTimeout(() => setError(''), 3000);
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const cardHover = (enter: boolean) => (e: React.MouseEvent<HTMLDivElement>) => {
    const el = e.currentTarget as HTMLDivElement;
    if (enter) {
      el.style.borderColor = 'var(--border-gold)';
      el.style.transform = 'translateY(-4px)';
      el.style.boxShadow = 'var(--shadow-gold)';
    } else {
      el.style.borderColor = '';
      el.style.transform = '';
      el.style.boxShadow = '';
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg-darkest)' }}>
        <Navbar />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', flexDirection: 'column', gap: 16 }}>
          <div style={{ width: 40, height: 40, border: '3px solid var(--border)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin-slow 0.7s linear infinite' }} />
          <p style={{ color: 'var(--text-muted)' }}>{t('جاري تحميل الفيديوهات...', 'Chargement des vidéos...', 'Loading videos...')}</p>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-darkest)', color: 'var(--text-primary)' }}>
      <Navbar />

      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
        <div style={{ position: 'absolute', top: '10%', left: '5%', width: 500, height: 500, background: 'radial-gradient(circle, rgba(245,166,35,0.07) 0%, transparent 70%)', borderRadius: '50%' }} />
      </div>

      <main style={{ position: 'relative', zIndex: 1, maxWidth: 1280, margin: '0 auto', padding: '100px 1.5rem 4rem' }}>

        {/* Header */}
        <div style={{ marginBottom: '3rem', textAlign: 'center' }}>
          <button
            onClick={() => navigate(-1)}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '8px 16px', marginBottom: '1.5rem',
              background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)',
              borderRadius: 'var(--radius-full)', color: 'var(--text-secondary)',
              cursor: 'pointer', fontSize: '0.875rem', transition: 'all 0.2s ease',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--primary)'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--primary)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = ''; (e.currentTarget as HTMLButtonElement).style.color = ''; }}
          >
            <ArrowLeft size={16} />
            {t('رجوع', 'Retour', 'Back')}
          </button>

          <div className="section-label" style={{ display: 'inline-flex', marginBottom: '1rem' }}>
            <Video size={13} />
            {t('الفيديوهات التعليمية', 'Vidéos éducatives', 'Educational Videos')}
          </div>
          <h1 className="section-title">
            {t('تعلم مع', 'Apprenez avec les', 'Learn with')}{' '}
            <span style={{ background: 'var(--grad-gold)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              {t('الفيديوهات', 'vidéos', 'Videos')}
            </span>
          </h1>
        </div>

        {/* Messages */}
        {message && (
          <div style={{ padding: '12px 20px', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 'var(--radius-md)', color: '#34D399', marginBottom: '1.5rem', textAlign: 'center' }}>
            {message}
          </div>
        )}
        {error && (
          <div style={{ padding: '12px 20px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 'var(--radius-md)', color: '#FCA5A5', marginBottom: '1.5rem', textAlign: 'center' }}>
            {error}
          </div>
        )}

        {/* Videos Grid */}
        {videos.length === 0 ? (
          <div style={{ padding: '5rem 2rem', textAlign: 'center', background: 'var(--grad-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)' }}>
            <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'rgba(245,166,35,0.1)', border: '1px solid var(--border-gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem', color: 'var(--primary)' }}>
              <Video size={32} />
            </div>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-white)', marginBottom: 8 }}>
              {t('لا توجد فيديوهات متاحة', 'Aucune vidéo disponible', 'No videos available')}
            </h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
              {t('سيقوم معلمك بإضافة فيديوهات قريباً', 'Votre instructeur ajoutera des vidéos bientôt', 'Your instructor will add videos soon')}
            </p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
            {videos.map(video => (
              <div
                key={video.id}
                onClick={() => handleVideoPlay(video)}
                style={{
                  background: 'var(--grad-card)', border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-xl)', overflow: 'hidden', cursor: 'pointer',
                  transition: 'all 0.25s ease',
                }}
                onMouseEnter={cardHover(true)}
                onMouseLeave={cardHover(false)}
              >
                {/* Thumbnail */}
                <div style={{
                  height: 180, background: 'linear-gradient(135deg, #111523 0%, #1A1F33 100%)',
                  position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  overflow: 'hidden',
                }}>
                  <div style={{
                    width: 60, height: 60, borderRadius: '50%',
                    background: 'rgba(245,166,35,0.15)', border: '2px solid var(--border-gold)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'var(--primary)', transition: 'transform 0.2s ease',
                  }}>
                    <Play size={26} style={{ marginLeft: 3 }} />
                  </div>
                  {/* Teacher avatar */}
                  <div style={{ position: 'absolute', top: 12, right: 12 }}>
                    <div style={{ width: 36, height: 36, borderRadius: '50%', border: '2px solid var(--border-gold)', overflow: 'hidden', background: video.teacherPhotoURL ? `url(${video.teacherPhotoURL}) center/cover` : 'var(--grad-gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#000' }}>
                      {!video.teacherPhotoURL && <User size={16} />}
                    </div>
                  </div>
                  {/* Duration badge */}
                  <div style={{ position: 'absolute', bottom: 10, left: 12, background: 'rgba(0,0,0,0.7)', padding: '2px 8px', borderRadius: 4, fontSize: '0.7rem', color: '#fff', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Clock size={11} />
                    {new Date(video.createdAt).toLocaleDateString(language === 'ar' ? 'ar-DZ' : language === 'fr' ? 'fr-FR' : 'en-US')}
                  </div>
                </div>

                {/* Info */}
                <div style={{ padding: '1.25rem' }}>
                  <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--text-white)', marginBottom: 6, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as any }}>
                    {video.title}
                  </h3>
                  {video.description && (
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 12, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as any, lineHeight: 1.5 }}>
                      {video.description}
                    </p>
                  )}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    <div style={{ display: 'flex', gap: 14 }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Eye size={13} />{video.views || 0}</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Heart size={13} />{video.likes || 0}</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><MessageCircle size={13} />{video.commentsCount || 0}</span>
                    </div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 600 }}>{video.teacherName}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <Footer />

      {/* ── Video Player Modal ── */}
      {showVideoPlayer && selectedVideo && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 2000,
          background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '1.5rem',
        }}
          onClick={e => { if (e.target === e.currentTarget) setShowVideoPlayer(false); }}
        >
          <div style={{
            width: '100%', maxWidth: 860, maxHeight: '90vh', overflow: 'auto',
            background: 'var(--bg-card)', border: '1px solid var(--border-gold)',
            borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-lg)',
          }}>
            {/* Modal header */}
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <h2 style={{ fontSize: '1.0625rem', fontWeight: 700, color: 'var(--text-white)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {selectedVideo.title}
                </h2>
                {selectedVideo.description && <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: 2 }}>{selectedVideo.description}</p>}
              </div>
              <button onClick={() => setShowVideoPlayer(false)} style={{ padding: 8, background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--text-muted)', cursor: 'pointer', flexShrink: 0 }}>
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: '1.5rem' }}>
              {/* Video */}
              <div style={{ borderRadius: 'var(--radius-lg)', overflow: 'hidden', background: '#000', marginBottom: '1.5rem' }}>
                <video controls style={{ width: '100%', maxHeight: 460, display: 'block' }} src={selectedVideo.videoUrl}>
                  {t('متصفحك لا يدعم الفيديو', 'Votre navigateur ne supporte pas la vidéo', 'Your browser does not support video')}
                </video>
              </div>

              {/* Teacher info + stats */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', background: 'var(--bg-mid)', borderRadius: 'var(--radius-md)', marginBottom: '1.25rem', flexWrap: 'wrap', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 44, height: 44, borderRadius: '50%', overflow: 'hidden', border: '2px solid var(--border-gold)', background: selectedVideo.teacherPhotoURL ? `url(${selectedVideo.teacherPhotoURL}) center/cover` : 'var(--grad-gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#000', flexShrink: 0 }}>
                    {!selectedVideo.teacherPhotoURL && <User size={20} />}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-white)' }}>{selectedVideo.teacherName}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{new Date(selectedVideo.createdAt).toLocaleDateString()}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 16, fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><Eye size={15} />{selectedVideo.views || 0}</span>
                  <button
                    onClick={() => handleLike(selectedVideo.id)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 5,
                      border: 'none', cursor: 'pointer',
                      color: userLikes[selectedVideo.id] ? '#EF4444' : 'var(--text-muted)',
                      padding: '4px 10px', borderRadius: 'var(--radius-full)',
                      background: userLikes[selectedVideo.id] ? 'rgba(239,68,68,0.1)' : 'none',
                      transition: 'all 0.2s ease', fontSize: '0.875rem',
                    } as any}
                  >
                    <Heart size={15} fill={userLikes[selectedVideo.id] ? '#EF4444' : 'none'} />
                    {selectedVideo.likes || 0}
                  </button>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><MessageCircle size={15} />{comments.length}</span>
                </div>
              </div>

              {/* Comment input */}
              <div style={{ marginBottom: '1.25rem' }}>
                <textarea
                  value={newComment}
                  onChange={e => setNewComment(e.target.value)}
                  placeholder={t('اكتب تعليقاً...', 'Écrivez un commentaire...', 'Write a comment...')}
                  rows={3}
                  className="input-pro"
                  style={{ resize: 'none', fontFamily: 'inherit', marginBottom: 8 }}
                />
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button
                    onClick={handleCommentSubmit}
                    disabled={isSubmittingComment || !newComment.trim()}
                    className="btn-primary"
                    style={{ padding: '8px 20px', opacity: (isSubmittingComment || !newComment.trim()) ? 0.5 : 1, cursor: (isSubmittingComment || !newComment.trim()) ? 'not-allowed' : 'pointer', fontSize: '0.875rem' }}
                  >
                    {isSubmittingComment ? <Loader2 size={15} style={{ animation: 'spin-slow 0.6s linear infinite' }} /> : <Send size={15} />}
                    {t('نشر', 'Publier', 'Post')}
                  </button>
                </div>
              </div>

              {/* Comments */}
              <div style={{ maxHeight: 320, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
                {comments.length === 0 ? (
                  <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                    <MessageCircle size={28} style={{ margin: '0 auto 8px', opacity: 0.4 }} />
                    {t('لا توجد تعليقات بعد', 'Aucun commentaire', 'No comments yet')}
                  </div>
                ) : (
                  comments.map((comment, i) => (
                    <div key={i} style={{ display: 'flex', gap: 10, padding: '10px 12px', background: 'var(--bg-mid)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                      <div style={{ width: 34, height: 34, borderRadius: '50%', flexShrink: 0, background: comment.userPhoto ? `url(${comment.userPhoto}) center/cover` : 'var(--grad-gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#000', fontSize: '0.875rem', fontWeight: 700 }}>
                        {!comment.userPhoto && (comment.userName || '?').charAt(0)}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                          <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-white)' }}>{comment.userName}</span>
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{new Date(comment.createdAt).toLocaleDateString()}</span>
                        </div>
                        <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{comment.comment}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const Videos = () => (
  <LanguageProvider>
    <VideosContent />
  </LanguageProvider>
);

export default Videos;
