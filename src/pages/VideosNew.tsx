import { useState, useEffect } from 'react';
import { LanguageProvider, useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/dialog';
import { Video, Play, Heart, MessageCircle, Send, User, Loader2, ArrowLeft, Clock, Eye } from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '../supabase';

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

  // جلب بيانات الطالب
  useEffect(() => {
    const fetchStudentData = async () => {
      if (!user?.uid) return;
      
      try {
        const { data: docData } = await supabase.from('users').select('*').eq('id', user.uid).single();
        if (docData) {
          setStudentData(docData);
        }
      } catch (error) {
        console.error('Error fetching student data:', error);
      }
    };

    fetchStudentData();
  }, [user?.uid]);

  // جلب الفيديوهات التعليمية من المعلم
  useEffect(() => {
    const fetchVideos = async () => {
      if (!user?.uid || !studentData?.teacherId) return;

      setLoading(true);
      try {
        const { data: videosList } = await supabase.from('educationalVideos').select('*').eq('teacherId', studentData.teacherId);

        // جلب صورة المعلم
        const { data: teacherDoc } = await supabase.from('users').select('*').eq('id', studentData.teacherId).single();
        const teacherPhotoURL = teacherDoc ? teacherDoc.photoURL : null;

        // جلب عدد التعليقات لكل فيديو
        const videosWithData = await Promise.all((videosList || []).map(async (video) => {
          const { count: commentsCount } = await supabase.from('videoComments').select('*', { count: 'exact', head: true }).eq('videoId', video.id);

          return {
            ...video,
            teacherPhotoURL: teacherPhotoURL,
            commentsCount: commentsCount || 0
          };
        }));
        
        // ترتيب الفيديوهات حسب تاريخ الإنشاء محلياً
        videosWithData.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        
        setVideos(videosWithData);
      } catch (error) {
        console.error('Error fetching videos:', error);
        setError(
          language === 'ar'
            ? 'حدث خطأ أثناء جلب الفيديوهات'
            : language === 'fr'
            ? 'Erreur lors du chargement des vidéos'
            : 'Error loading videos'
        );
      } finally {
        setLoading(false);
      }
    };

    fetchVideos();
  }, [user?.uid, studentData?.teacherId, language]);

  // Video functions
  const handleVideoPlay = async (video: any) => {
    setSelectedVideo(video);
    setShowVideoPlayer(true);
    
    // Increment view count
    try {
      const { data: videoRow } = await supabase.from('educationalVideos').select('views').eq('id', video.id).single();
      await supabase.from('educationalVideos').update({ views: (videoRow?.views || 0) + 1 }).eq('id', video.id);
      
      // Update local state
      setVideos(prev => prev.map(v => 
        v.id === video.id ? { ...v, views: (v.views || 0) + 1 } : v
      ));
      
      // Load comments and likes for this video
      await loadVideoComments(video.id);
      await checkUserLike(video.id);
    } catch (error) {
      console.error('Error updating view count:', error);
    }
  };

  const loadVideoComments = async (videoId: string) => {
    try {
      const { data: commentsList } = await supabase.from('videoComments').select('*').eq('videoId', videoId);
      const sorted = (commentsList || []).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setComments(sorted);
    } catch (error) {
      console.error('Error loading comments:', error);
    }
  };

  const checkUserLike = async (videoId: string) => {
    if (!user?.uid) return;

    try {
      const { data: likeRows } = await supabase.from('videoLikes').select('*').eq('videoId', videoId).eq('userId', user.uid);
      setUserLikes(prev => ({
        ...prev,
        [videoId]: !!(likeRows && likeRows.length > 0)
      }));
    } catch (error) {
      console.error('Error checking user like:', error);
    }
  };

  const handleLike = async (videoId: string) => {
    if (!user?.uid) return;
    
    try {
      const isLiked = userLikes[videoId];
      
      if (isLiked) {
        await supabase.from('videoLikes').delete().eq('videoId', videoId).eq('userId', user.uid);

        const { data: vidRow } = await supabase.from('educationalVideos').select('likes').eq('id', videoId).single();
        await supabase.from('educationalVideos').update({ likes: Math.max((vidRow?.likes || 0) - 1, 0) }).eq('id', videoId);
        
        setUserLikes((prev: any) => ({ ...prev, [videoId]: false }));
        setVideos(prev => prev.map(v => 
          v.id === videoId ? { ...v, likes: Math.max((v.likes || 0) - 1, 0) } : v
        ));
        if (selectedVideo?.id === videoId) {
          setSelectedVideo((prev: any) => ({ ...prev, likes: Math.max((prev.likes || 0) - 1, 0) }));
        }
      } else {
        await supabase.from('videoLikes').insert({
          videoId: videoId,
          userId: user.uid,
          userName: studentData?.fullName || user.name,
          createdAt: new Date().toISOString()
        });

        const { data: vidRow } = await supabase.from('educationalVideos').select('likes').eq('id', videoId).single();
        await supabase.from('educationalVideos').update({ likes: (vidRow?.likes || 0) + 1 }).eq('id', videoId);
        
        setUserLikes((prev: any) => ({ ...prev, [videoId]: true }));
        setVideos(prev => prev.map(v => 
          v.id === videoId ? { ...v, likes: (v.likes || 0) + 1 } : v
        ));
        if (selectedVideo?.id === videoId) {
          setSelectedVideo((prev: any) => ({ ...prev, likes: (prev.likes || 0) + 1 }));
        }
      }
    } catch (error) {
      console.error('Error handling like:', error);
    }
  };

  const handleCommentSubmit = async () => {
    if (!user?.uid || !selectedVideo || !newComment.trim()) return;
    
    setIsSubmittingComment(true);
    
    try {
      const commentData = {
        videoId: selectedVideo.id,
        userId: user.uid,
        userName: studentData?.fullName || user.name,
        userPhoto: studentData?.photoURL || null,
        comment: newComment.trim(),
        createdAt: new Date().toISOString()
      };
      
      await supabase.from('videoComments').insert(commentData);
      
      setComments(prev => [commentData, ...prev]);
      setNewComment('');
      
      setVideos(prev => prev.map(v => 
        v.id === selectedVideo.id ? { ...v, commentsCount: (v.commentsCount || 0) + 1 } : v
      ));
      
      setMessage(
        language === 'ar'
          ? 'تم إضافة التعليق بنجاح!'
          : language === 'fr'
          ? 'Commentaire ajouté avec succès!'
          : 'Comment added successfully!'
      );
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error submitting comment:', error);
      setError(
        language === 'ar'
          ? 'حدث خطأ أثناء إضافة التعليق'
          : language === 'fr'
          ? 'Erreur lors de l\'ajout du commentaire'
          : 'Error adding comment'
      );
      setTimeout(() => setError(''), 3000);
    } finally {
      setIsSubmittingComment(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <Navbar />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-gray-600 text-lg">
              {language === 'ar' ? 'جاري تحميل الفيديوهات...' : language === 'fr' ? 'Chargement...' : 'Loading videos...'}
            </p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="flex items-center justify-center gap-4 mb-6">
            <Button
              onClick={() => navigate(-1)}
              variant="outline"
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              {language === 'ar' ? 'رجوع' : language === 'fr' ? 'Retour' : 'Back'}
            </Button>
            <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
              <Video className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            {language === 'ar' ? 'الفيديوهات التعليمية' : language === 'fr' ? 'Vidéos Éducatives' : 'Educational Videos'}
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            {language === 'ar' 
              ? 'شاهد الفيديوهات التعليمية من معلمك وتفاعل معها'
              : language === 'fr'
              ? 'Regardez et interagissez avec les vidéos de votre instructeur'
              : 'Watch and interact with videos from your instructor'
            }
          </p>
        </motion.div>

        {message && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg text-center"
          >
            {message}
          </motion.div>
        )}

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg text-center"
          >
            {error}
          </motion.div>
        )}

        {videos.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16"
          >
            <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
              <Video className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-2xl font-semibold text-gray-700 mb-4">
              {language === 'ar' ? 'لا توجد فيديوهات متاحة' : language === 'fr' ? 'Aucune vidéo disponible' : 'No videos available'}
            </h3>
            <p className="text-gray-500 max-w-md mx-auto">
              {language === 'ar' 
                ? 'سيقوم معلمك بإضافة فيديوهات تعليمية قريباً'
                : language === 'fr'
                ? 'Votre instructeur ajoutera des vidéos bientôt'
                : 'Your instructor will add videos soon'
              }
            </p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {videos.map((video, index) => (
              <motion.div
                key={video.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card 
                  className="overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer group"
                  onClick={() => handleVideoPlay(video)}
                >
                  <div className="relative h-48 bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
                    <div className="absolute inset-0 bg-black bg-opacity-20 group-hover:bg-opacity-10 transition-all duration-300"></div>
                    <div className="relative z-10 w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                      <Play className="w-8 h-8 text-white ml-1" />
                    </div>
                    
                    {video.teacherPhotoURL && (
                      <div className="absolute top-4 right-4 w-10 h-10 rounded-full border-2 border-white overflow-hidden">
                        <img 
                          src={video.teacherPhotoURL} 
                          alt={video.teacherName}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                  </div>

                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg font-semibold text-gray-800 line-clamp-2 group-hover:text-blue-600 transition-colors leading-tight">
                      {video.title}
                    </CardTitle>
                    {video.description && (
                      <CardDescription className="text-sm text-gray-600 line-clamp-2 mt-2">
                        {video.description}
                      </CardDescription>
                    )}
                  </CardHeader>

                  <CardContent className="pt-0">
                    <div className="flex items-center gap-2 mb-4 text-sm text-gray-600">
                      <span className="font-medium">{video.teacherName}</span>
                    </div>

                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1">
                          <Eye className="w-4 h-4" />
                          <span>{video.views || 0}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Heart className="w-4 h-4" />
                          <span>{video.likes || 0}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <MessageCircle className="w-4 h-4" />
                          <span>{video.commentsCount || 0}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        <span>{new Date(video.createdAt).toLocaleDateString(language === 'ar' ? 'ar-DZ' : language === 'fr' ? 'fr-FR' : 'en-US')}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </main>

      <Footer />

      <Dialog open={showVideoPlayer} onOpenChange={setShowVideoPlayer}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-gray-800 mb-2">
              {selectedVideo?.title}
            </DialogTitle>
            {selectedVideo?.description && (
              <DialogDescription className="text-gray-600 text-base">
                {selectedVideo.description}
              </DialogDescription>
            )}
          </DialogHeader>

          <div className="mt-4">
            {selectedVideo && (
              <>
                <div className="relative rounded-xl overflow-hidden bg-black mb-6">
                  <video
                    controls
                    className="w-full h-auto max-h-[500px]"
                    src={selectedVideo.videoUrl}
                  >
                    {language === 'ar' ? 'متصفحك لا يدعم تشغيل الفيديو' : 'Your browser does not support video'}
                  </video>
                </div>

                <div className="bg-gray-50 rounded-xl p-6 mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white shadow-md">
                        {selectedVideo.teacherPhotoURL ? (
                          <img 
                            src={selectedVideo.teacherPhotoURL} 
                            alt={selectedVideo.teacherName}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
                            <User className="w-6 h-6 text-white" />
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="font-semibold text-gray-800">
                          {selectedVideo.teacherName}
                        </div>
                        <div className="text-sm text-gray-500">
                          {new Date(selectedVideo.createdAt).toLocaleDateString(language === 'ar' ? 'ar-DZ' : 'fr-FR')}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-semibold text-gray-800">
                        {selectedVideo.views || 0} {language === 'ar' ? 'مشاهدة' : 'views'}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 pb-4 border-b border-gray-200 mb-4">
                    <Button
                      onClick={() => handleLike(selectedVideo.id)}
                      variant="outline"
                      className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all ${
                        userLikes[selectedVideo.id] 
                          ? 'bg-red-50 border-red-300 text-red-600 hover:bg-red-100' 
                          : 'hover:bg-gray-100'
                      }`}
                    >
                      <Heart 
                        className={`w-5 h-5 ${userLikes[selectedVideo.id] ? 'fill-red-500 text-red-500' : ''}`}
                      />
                      <span className="font-medium">{selectedVideo.likes || 0}</span>
                      <span>{language === 'ar' ? 'إعجاب' : 'Like'}</span>
                    </Button>
                    
                    <div className="flex items-center gap-2 text-gray-600">
                      <MessageCircle className="w-5 h-5" />
                      <span className="font-medium">{comments.length}</span>
                      <span>{language === 'ar' ? 'تعليق' : 'comments'}</span>
                    </div>
                  </div>

                  <div className="mb-6">
                    <div className="flex gap-3">
                      <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white shadow-sm flex-shrink-0">
                        {studentData?.photoURL ? (
                          <img 
                            src={studentData.photoURL} 
                            alt="Your avatar"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                            <User className="w-5 h-5 text-white" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <textarea
                          value={newComment}
                          onChange={(e) => setNewComment(e.target.value)}
                          placeholder={language === 'ar' ? 'اكتب تعليقاً...' : 'Write a comment...'}
                          rows={3}
                          className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <div className="flex justify-end mt-2">
                          <Button
                            onClick={handleCommentSubmit}
                            disabled={isSubmittingComment || !newComment.trim()}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50"
                          >
                            {isSubmittingComment ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Send className="w-4 h-4" />
                            )}
                            {language === 'ar' ? 'نشر' : 'Post'}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="max-h-96 overflow-y-auto">
                    {comments.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <MessageCircle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                        <p className="text-lg font-medium mb-1">
                          {language === 'ar' ? 'لا توجد تعليقات بعد' : 'No comments yet'}
                        </p>
                        <p className="text-sm">
                          {language === 'ar' ? 'كن أول من يعلق' : 'Be the first to comment'}
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {comments.map((comment, index) => (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="flex gap-3 p-4 bg-white rounded-lg border border-gray-200"
                          >
                            <div className="w-8 h-8 rounded-full overflow-hidden border border-gray-200 flex-shrink-0">
                              {comment.userPhoto ? (
                                <img 
                                  src={comment.userPhoto} 
                                  alt={comment.userName}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                                  <User className="w-4 h-4 text-white" />
                                </div>
                              )}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-semibold text-gray-800 text-sm">
                                  {comment.userName}
                                </span>
                                <span className="text-xs text-gray-500">
                                  {new Date(comment.createdAt).toLocaleDateString(language === 'ar' ? 'ar-DZ' : 'fr-FR')}
                                </span>
                              </div>
                              <p className="text-gray-700 text-sm leading-relaxed">
                                {comment.comment}
                              </p>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>

          <DialogFooter>
            <Button 
              onClick={() => setShowVideoPlayer(false)}
              className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg font-medium"
            >
              {language === 'ar' ? 'إغلاق' : 'Close'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

const VideosNew = () => {
  return (
    <LanguageProvider>
      <VideosContent />
    </LanguageProvider>
  );
};

export default VideosNew;
