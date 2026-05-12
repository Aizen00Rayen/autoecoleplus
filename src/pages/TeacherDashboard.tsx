import { useState, useEffect, useRef } from 'react';
import { LanguageProvider, useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import {
  Calendar, Users, Clock, CheckCircle, FileText, TrendingUp,
  Info, User, Mail, Phone, IdCard, RefreshCw, Loader2, Upload,
  Camera, Video, Play, Trash2, Plus, Star, Eye, Heart, MessageCircle,
  X, ChevronRight, BookOpen, Award
} from 'lucide-react';
import { supabase } from '../supabase';
import WorkDaysSelector from '../components/WorkDaysSelector';
import { getDefaultWorkDays } from '../utils/scheduleGenerator';
import type { WorkDays } from '../utils/scheduleGenerator';
import '../components/style/theme.css';

// ─────────────────────────────────────────────────────────────
// Reusable modal overlay
// ─────────────────────────────────────────────────────────────
const Overlay = ({
  children,
  onClose,
  maxWidth = 640,
}: {
  children: React.ReactNode;
  onClose: () => void;
  maxWidth?: number;
}) => (
  <div
    style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '16px',
    }}
    onClick={onClose}
  >
    <div
      style={{
        background: 'var(--bg-card, #1a1a2e)', borderRadius: 16,
        width: '100%', maxWidth, maxHeight: '90vh', overflowY: 'auto',
        padding: 24, position: 'relative',
        boxShadow: '0 25px 60px rgba(0,0,0,0.4)',
        border: '1px solid rgba(255,255,255,0.08)',
      }}
      onClick={e => e.stopPropagation()}
    >
      {children}
    </div>
  </div>
);

const ModalHeader = ({ title, onClose }: { title: string; onClose: () => void }) => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
    <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: 'var(--text-primary, #fff)' }}>{title}</h2>
    <button
      onClick={onClose}
      style={{
        background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 8,
        width: 32, height: 32, cursor: 'pointer', display: 'flex',
        alignItems: 'center', justifyContent: 'center', color: 'var(--text-primary, #fff)',
      }}
    >
      <X size={16} />
    </button>
  </div>
);

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 14px', borderRadius: 8,
  border: '1px solid rgba(255,255,255,0.15)',
  background: 'rgba(255,255,255,0.05)', color: 'var(--text-primary, #fff)',
  fontSize: 14, outline: 'none', boxSizing: 'border-box',
};

const btnPrimary: React.CSSProperties = {
  padding: '10px 20px', borderRadius: 8, border: 'none',
  background: 'var(--accent-gradient, linear-gradient(135deg,#4f8ef7,#7c3aed))',
  color: '#fff', fontWeight: 600, fontSize: 14, cursor: 'pointer',
};

const btnSecondary: React.CSSProperties = {
  padding: '10px 20px', borderRadius: 8,
  border: '1px solid rgba(255,255,255,0.15)',
  background: 'transparent', color: 'var(--text-primary,#fff)',
  fontWeight: 600, fontSize: 14, cursor: 'pointer',
};

// ─────────────────────────────────────────────────────────────
// Main content
// ─────────────────────────────────────────────────────────────
const TeacherDashboardContent = () => {
  const { language } = useLanguage();
  const { user } = useAuth();

  // ── State ─────────────────────────────────────────────────
  const [teacherData, setTeacherData] = useState<any>(null);
  const [myStudents, setMyStudents] = useState<any[]>([]);
  const [todayBookings, setTodayBookings] = useState<any[]>([]);
  const [pendingBookingsCount, setPendingBookingsCount] = useState(0);
  const [studentsWithUnreadMessages, setStudentsWithUnreadMessages] = useState(0);
  const [bookingMessagesCount, setBookingMessagesCount] = useState(0);
  const [videos, setVideos] = useState<any[]>([]);
  const [workDays, setWorkDays] = useState<WorkDays>(getDefaultWorkDays());
  const [isSavingWorkDays, setIsSavingWorkDays] = useState(false);

  // Modals
  const [showInfo, setShowInfo] = useState(false);
  const [showStudents, setShowStudents] = useState(false);
  const [showVideos, setShowVideos] = useState(false);
  const [showWorkDays, setShowWorkDays] = useState(false);
  const [showProfileUpload, setShowProfileUpload] = useState(false);
  const [showEval, setShowEval] = useState(false);
  const [showReports, setShowReports] = useState(false);
  const [showLicenseChange, setShowLicenseChange] = useState(false);
  const [showVideoUpload, setShowVideoUpload] = useState(false);

  // Eval
  const [evalStudent, setEvalStudent] = useState<any>(null);
  const [evalText, setEvalText] = useState('');
  const [evalRating, setEvalRating] = useState(0);
  const [isSavingEval, setIsSavingEval] = useState(false);

  // License change
  const [licenseForm, setLicenseForm] = useState({ requestedLicenseType: '', reason: '' });
  const [isSubmittingLicense, setIsSubmittingLicense] = useState(false);

  // Profile upload
  const [profileFile, setProfileFile] = useState<File | null>(null);
  const [profilePreview, setProfilePreview] = useState('');
  const [isUploadingProfile, setIsUploadingProfile] = useState(false);
  const profileInputRef = useRef<HTMLInputElement>(null);

  // Video upload
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoTitle, setVideoTitle] = useState('');
  const [videoDescription, setVideoDescription] = useState('');
  const [isUploadingVideo, setIsUploadingVideo] = useState(false);
  const videoInputRef = useRef<HTMLInputElement>(null);

  // Reports
  const [reportData, setReportData] = useState<any>(null);
  const [loadingReport, setLoadingReport] = useState(false);

  // Feedback
  const [flashMsg, setFlashMsg] = useState('');
  const [flashErr, setFlashErr] = useState('');

  const CLOUDINARY_CLOUD_NAME = 'dpjclv2nb';
  const CLOUDINARY_UPLOAD_PRESET = 'preset';

  const flash = (msg: string, isErr = false) => {
    if (isErr) { setFlashErr(msg); setTimeout(() => setFlashErr(''), 4000); }
    else { setFlashMsg(msg); setTimeout(() => setFlashMsg(''), 4000); }
  };

  // ── Fetch teacher data ─────────────────────────────────────
  useEffect(() => {
    if (!user?.uid) return;
    (async () => {
      const { data } = await supabase.from('users').select('*').eq('id', user.uid).single();
      if (data) {
        setTeacherData(data);
        if (data.workDays) setWorkDays(data.workDays);
      }
    })();
  }, [user?.uid]);

  // ── Fetch students ────────────────────────────────────────
  useEffect(() => {
    if (!user?.uid) return;
    (async () => {
      const { data } = await supabase.from('users').select('*').eq('role', 'student').eq('teacherId', user.uid);
      setMyStudents(data || []);
    })();
  }, [user?.uid]);

  // ── Fetch videos ──────────────────────────────────────────
  useEffect(() => {
    if (!user?.uid) return;
    (async () => {
      const { data } = await supabase.from('educationalVideos').select('*').eq('teacherId', user.uid);
      const sorted = (data || []).sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setVideos(sorted);
    })();
  }, [user?.uid]);

  // ── Today's bookings ──────────────────────────────────────
  useEffect(() => {
    if (!user?.uid) return;
    (async () => {
      const today = new Date();
      const todayStr = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;
      const { data } = await supabase.from('bookings').select('*').eq('teacherId', user.uid).eq('date', todayStr).eq('status', 'approved');
      setTodayBookings((data || []).sort((a: any, b: any) => a.time.localeCompare(b.time)));
    })();
  }, [user?.uid]);

  // ── Pending bookings (real-time) ──────────────────────────
  useEffect(() => {
    if (!user?.uid) return;
    const fetch = async () => {
      const { count } = await supabase.from('bookings').select('*', { count: 'exact', head: true }).eq('teacherId', user.uid).eq('status', 'pending');
      setPendingBookingsCount(count || 0);
    };
    fetch();
    const ch = supabase.channel('pending-bookings-t').on('postgres_changes', { event: '*', schema: 'public', table: 'bookings', filter: `teacherId=eq.${user.uid}` }, fetch).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user?.uid]);

  // ── Booking messages (real-time) ──────────────────────────
  useEffect(() => {
    if (!user?.uid) return;
    const fetch = async () => {
      const { data: rows } = await supabase.from('messages').select('senderId').eq('receiverId', user.uid).eq('read', false).eq('chatType', 'booking');
      setBookingMessagesCount(rows?.length || 0);
    };
    fetch();
    const ch = supabase.channel('booking-msgs-t').on('postgres_changes', { event: '*', schema: 'public', table: 'messages', filter: `receiverId=eq.${user.uid}` }, fetch).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user?.uid]);

  // ── Unread messages from students (real-time) ─────────────
  useEffect(() => {
    if (!user?.uid || myStudents.length === 0) return;
    const fetch = async () => {
      const { data: rows } = await supabase.from('messages').select('senderId').eq('receiverId', user.uid).eq('read', false).eq('chatType', 'general');
      const uniq = new Set((rows || []).map((r: any) => r.senderId));
      setStudentsWithUnreadMessages(uniq.size);
    };
    fetch();
  }, [user?.uid, myStudents]);

  // ── Handlers ──────────────────────────────────────────────
  const handleSaveWorkDays = async () => {
    if (!user?.uid) return;
    setIsSavingWorkDays(true);
    await supabase.from('users').update({ workDays, updatedAt: new Date().toISOString() }).eq('id', user.uid);
    setIsSavingWorkDays(false);
    setShowWorkDays(false);
    flash(language === 'ar' ? 'تم حفظ أيام العمل' : language === 'fr' ? 'Jours de travail sauvegardés' : 'Work days saved');
  };

  const handleProfileImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { flash(language === 'ar' ? 'يرجى اختيار صورة' : 'Please select an image', true); return; }
    setProfileFile(file);
    setProfilePreview(URL.createObjectURL(file));
  };

  const handleUploadProfile = async () => {
    if (!profileFile || !user?.uid) return;
    setIsUploadingProfile(true);
    try {
      const fd = new FormData();
      fd.append('file', profileFile);
      fd.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
      fd.append('folder', 'profile_pictures');
      const resp = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, { method: 'POST', body: fd });
      const result = await resp.json();
      if (result.secure_url) {
        await supabase.from('users').update({ profileImage: result.secure_url, updatedAt: new Date().toISOString() }).eq('id', user.uid);
        setTeacherData((prev: any) => ({ ...prev, profileImage: result.secure_url }));
        setShowProfileUpload(false);
        setProfileFile(null);
        setProfilePreview('');
        flash(language === 'ar' ? 'تم رفع الصورة بنجاح' : language === 'fr' ? 'Photo téléchargée avec succès' : 'Profile photo uploaded');
      }
    } catch { flash(language === 'ar' ? 'فشل رفع الصورة' : 'Upload failed', true); }
    setIsUploadingProfile(false);
  };

  const handleVideoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('video/')) { flash(language === 'ar' ? 'يرجى اختيار فيديو' : 'Please select a video file', true); return; }
    setVideoFile(file);
  };

  const handleUploadVideo = async () => {
    if (!videoFile || !videoTitle || !user?.uid) { flash(language === 'ar' ? 'يرجى ملء جميع الحقول' : 'Please fill all fields', true); return; }
    setIsUploadingVideo(true);
    try {
      const fd = new FormData();
      fd.append('file', videoFile);
      fd.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
      fd.append('folder', 'educational_videos');
      const resp = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/video/upload`, { method: 'POST', body: fd });
      const result = await resp.json();
      if (result.secure_url) {
        const { data: newVideo } = await supabase.from('educationalVideos').insert({
          teacherId: user.uid,
          teacherName: teacherData?.fullName || '',
          title: videoTitle,
          description: videoDescription,
          videoUrl: result.secure_url,
          thumbnail: result.secure_url.replace('/upload/', '/upload/w_300,h_200,c_fill/').replace('.mp4', '.jpg'),
          views: 0,
          likes: 0,
          createdAt: new Date().toISOString(),
        }).select().single();
        if (newVideo) setVideos(prev => [newVideo, ...prev]);
        setShowVideoUpload(false);
        setVideoFile(null);
        setVideoTitle('');
        setVideoDescription('');
        flash(language === 'ar' ? 'تم رفع الفيديو بنجاح' : language === 'fr' ? 'Vidéo téléchargée' : 'Video uploaded');
      }
    } catch { flash(language === 'ar' ? 'فشل رفع الفيديو' : 'Video upload failed', true); }
    setIsUploadingVideo(false);
  };

  const handleDeleteVideo = async (videoId: string) => {
    await supabase.from('educationalVideos').delete().eq('id', videoId);
    setVideos(prev => prev.filter(v => v.id !== videoId));
  };

  const handleSaveEval = async () => {
    if (!evalStudent || !evalText || evalRating === 0) { flash(language === 'ar' ? 'يرجى ملء جميع الحقول' : 'Please fill all fields', true); return; }
    setIsSavingEval(true);
    await supabase.from('evaluations').upsert({
      studentId: evalStudent.id,
      teacherId: user?.uid,
      comment: evalText,
      rating: evalRating,
      updatedAt: new Date().toISOString(),
    }, { onConflict: 'studentId,teacherId' });
    setIsSavingEval(false);
    setShowEval(false);
    setEvalText('');
    setEvalRating(0);
    setEvalStudent(null);
    flash(language === 'ar' ? 'تم حفظ التقييم' : language === 'fr' ? 'Évaluation sauvegardée' : 'Evaluation saved');
  };

  const openEval = async (student: any) => {
    setEvalStudent(student);
    const { data } = await supabase.from('evaluations').select('*').eq('studentId', student.id).eq('teacherId', user?.uid).single();
    if (data) { setEvalText(data.comment || ''); setEvalRating(data.rating || 0); }
    else { setEvalText(''); setEvalRating(0); }
    setShowEval(true);
  };

  const handleLoadReport = async () => {
    if (!user?.uid) return;
    setLoadingReport(true);
    const { count: totalStudents } = await supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'student').eq('teacherId', user.uid);
    const { count: totalBookings } = await supabase.from('bookings').select('*', { count: 'exact', head: true }).eq('teacherId', user.uid);
    const { count: completedBookings } = await supabase.from('bookings').select('*', { count: 'exact', head: true }).eq('teacherId', user.uid).eq('status', 'approved');
    const { count: totalVideos } = await supabase.from('educationalVideos').select('*', { count: 'exact', head: true }).eq('teacherId', user.uid);
    setReportData({ totalStudents, totalBookings, completedBookings, totalVideos });
    setLoadingReport(false);
  };

  const handleLicenseChangeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!licenseForm.requestedLicenseType || !licenseForm.reason) { flash(language === 'ar' ? 'يرجى ملء جميع الحقول' : 'Please fill all fields', true); return; }
    setIsSubmittingLicense(true);
    await supabase.from('licenseChangeRequests').insert({
      teacherId: user?.uid,
      teacherName: teacherData?.fullName,
      currentLicenseType: teacherData?.licenseType,
      requestedLicenseType: licenseForm.requestedLicenseType,
      reason: licenseForm.reason,
      status: 'pending',
      createdAt: new Date().toISOString(),
    });
    setIsSubmittingLicense(false);
    setShowLicenseChange(false);
    setLicenseForm({ requestedLicenseType: '', reason: '' });
    flash(language === 'ar' ? 'تم إرسال طلب تغيير الرخصة' : language === 'fr' ? 'Demande envoyée' : 'License change request sent');
  };

  // ── Labels ────────────────────────────────────────────────
  const t = {
    greeting: language === 'ar' ? 'أهلاً بك،' : language === 'fr' ? 'Bienvenue,' : 'Welcome,',
    myInfo: language === 'ar' ? 'معلوماتي' : language === 'fr' ? 'Mes Infos' : 'My Info',
    students: language === 'ar' ? 'طلابي' : language === 'fr' ? 'Mes Étudiants' : 'My Students',
    videos: language === 'ar' ? 'الفيديوهات' : language === 'fr' ? 'Vidéos' : 'Videos',
    workDays: language === 'ar' ? 'أيام العمل' : language === 'fr' ? 'Jours de Travail' : 'Work Days',
    reports: language === 'ar' ? 'التقارير' : language === 'fr' ? 'Rapports' : 'Reports',
    licenseChange: language === 'ar' ? 'طلب تغيير الرخصة' : language === 'fr' ? 'Changer le Permis' : 'Change License',
    todayTitle: language === 'ar' ? 'حصص اليوم' : language === 'fr' ? "Cours d'aujourd'hui" : "Today's Sessions",
    noSessions: language === 'ar' ? 'لا توجد حصص اليوم' : language === 'fr' ? 'Aucun cours aujourd\'hui' : 'No sessions today',
    pending: language === 'ar' ? 'طلبات معلقة' : language === 'fr' ? 'En attente' : 'Pending',
    messages: language === 'ar' ? 'رسائل' : language === 'fr' ? 'Messages' : 'Messages',
    upload: language === 'ar' ? 'رفع فيديو' : language === 'fr' ? 'Téléverser' : 'Upload Video',
    save: language === 'ar' ? 'حفظ' : language === 'fr' ? 'Enregistrer' : 'Save',
    cancel: language === 'ar' ? 'إلغاء' : language === 'fr' ? 'Annuler' : 'Cancel',
    evaluate: language === 'ar' ? 'تقييم' : language === 'fr' ? 'Évaluer' : 'Evaluate',
    delete: language === 'ar' ? 'حذف' : language === 'fr' ? 'Supprimer' : 'Delete',
    noStudents: language === 'ar' ? 'لا يوجد طلاب بعد' : language === 'fr' ? 'Aucun étudiant' : 'No students yet',
    noVideos: language === 'ar' ? 'لا توجد فيديوهات' : language === 'fr' ? 'Aucune vidéo' : 'No videos yet',
    changePhoto: language === 'ar' ? 'تغيير الصورة' : language === 'fr' ? 'Changer la photo' : 'Change Photo',
    selectPhoto: language === 'ar' ? 'اختر صورة' : language === 'fr' ? 'Choisir une photo' : 'Select Photo',
    uploadPhoto: language === 'ar' ? 'رفع الصورة' : language === 'fr' ? 'Téléverser' : 'Upload Photo',
    selectVideo: language === 'ar' ? 'اختر فيديو' : language === 'fr' ? 'Choisir une vidéo' : 'Select Video',
    titleLabel: language === 'ar' ? 'العنوان' : language === 'fr' ? 'Titre' : 'Title',
    descLabel: language === 'ar' ? 'الوصف' : language === 'fr' ? 'Description' : 'Description',
    rating: language === 'ar' ? 'التقييم' : language === 'fr' ? 'Note' : 'Rating',
    comment: language === 'ar' ? 'التعليق' : language === 'fr' ? 'Commentaire' : 'Comment',
    requestedType: language === 'ar' ? 'نوع الرخصة المطلوب' : language === 'fr' ? 'Type de permis demandé' : 'Requested License Type',
    reason: language === 'ar' ? 'السبب' : language === 'fr' ? 'Raison' : 'Reason',
    send: language === 'ar' ? 'إرسال الطلب' : language === 'fr' ? 'Envoyer' : 'Send Request',
    currentLicense: language === 'ar' ? 'الرخصة الحالية' : language === 'fr' ? 'Permis actuel' : 'Current License',
    totalStudents: language === 'ar' ? 'إجمالي الطلاب' : language === 'fr' ? 'Total étudiants' : 'Total Students',
    totalBookings: language === 'ar' ? 'إجمالي الحجوزات' : language === 'fr' ? 'Total réservations' : 'Total Bookings',
    completedSessions: language === 'ar' ? 'الحصص المكتملة' : language === 'fr' ? 'Séances complétées' : 'Completed Sessions',
    totalVideosLabel: language === 'ar' ? 'إجمالي الفيديوهات' : language === 'fr' ? 'Total vidéos' : 'Total Videos',
  };

  const profileImg = teacherData?.profileImage || teacherData?.photoURL;

  // ── Render ────────────────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary, #0f0f1a)', color: 'var(--text-primary, #fff)', display: 'flex', flexDirection: 'column' }}>
      <Navbar />

      <main style={{ flex: 1, padding: '24px 16px', maxWidth: 1100, margin: '0 auto', width: '100%' }}>

        {/* Flash messages */}
        {flashMsg && (
          <div style={{ background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.4)', borderRadius: 10, padding: '12px 16px', marginBottom: 16, color: '#22c55e' }}>
            {flashMsg}
          </div>
        )}
        {flashErr && (
          <div style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.4)', borderRadius: 10, padding: '12px 16px', marginBottom: 16, color: '#ef4444' }}>
            {flashErr}
          </div>
        )}

        {/* ── Header card ─────────────────────────────────── */}
        <div style={{ background: 'var(--bg-card, #1a1a2e)', borderRadius: 16, padding: 24, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap', border: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ position: 'relative', cursor: 'pointer' }} onClick={() => setShowProfileUpload(true)}>
            {profileImg ? (
              <img src={profileImg} alt="profile" style={{ width: 72, height: 72, borderRadius: '50%', objectFit: 'cover', border: '3px solid var(--accent, #4f8ef7)' }} />
            ) : (
              <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'linear-gradient(135deg,#4f8ef7,#7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <User size={32} color="#fff" />
              </div>
            )}
            <div style={{ position: 'absolute', bottom: 0, right: 0, background: '#4f8ef7', borderRadius: '50%', width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid var(--bg-card, #1a1a2e)' }}>
              <Camera size={11} color="#fff" />
            </div>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, color: 'var(--text-secondary, #aaa)', marginBottom: 4 }}>{t.greeting}</div>
            <div style={{ fontSize: 22, fontWeight: 700 }}>{teacherData?.fullName || user?.name || '—'}</div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary, #aaa)', marginTop: 4 }}>
              {language === 'ar' ? 'معلم' : language === 'fr' ? 'Enseignant' : 'Teacher'} · {teacherData?.licenseType || '—'}
            </div>
          </div>
          <button onClick={() => setShowInfo(true)} style={{ ...btnPrimary, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Info size={16} /> {t.myInfo}
          </button>
        </div>

        {/* ── Stats row ────────────────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 16, marginBottom: 24 }}>
          {[
            { icon: <Users size={22} color="#4f8ef7" />, label: t.students, value: myStudents.length, bg: 'rgba(79,142,247,0.12)', color: '#4f8ef7' },
            { icon: <Calendar size={22} color="#f59e0b" />, label: t.todayTitle, value: todayBookings.length, bg: 'rgba(245,158,11,0.12)', color: '#f59e0b' },
            { icon: <Clock size={22} color="#f97316" />, label: t.pending, value: pendingBookingsCount, bg: 'rgba(249,115,22,0.12)', color: '#f97316' },
            { icon: <MessageCircle size={22} color="#a78bfa" />, label: t.messages, value: bookingMessagesCount, bg: 'rgba(167,139,250,0.12)', color: '#a78bfa' },
            { icon: <Video size={22} color="#34d399" />, label: t.videos, value: videos.length, bg: 'rgba(52,211,153,0.12)', color: '#34d399' },
          ].map((s, i) => (
            <div key={i} style={{ background: 'var(--bg-card, #1a1a2e)', borderRadius: 14, padding: '18px 20px', border: '1px solid rgba(255,255,255,0.07)' }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>{s.icon}</div>
              <div style={{ fontSize: 26, fontWeight: 700, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary, #aaa)', marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* ── Today's sessions ─────────────────────────────── */}
        <div style={{ background: 'var(--bg-card, #1a1a2e)', borderRadius: 16, padding: 20, marginBottom: 24, border: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <Calendar size={18} color="#f59e0b" />
            <span style={{ fontWeight: 700, fontSize: 16 }}>{t.todayTitle}</span>
          </div>
          {todayBookings.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'var(--text-secondary, #aaa)', padding: '24px 0', fontSize: 14 }}>{t.noSessions}</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {todayBookings.map((b: any) => (
                <div key={b.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 16px', background: 'rgba(245,158,11,0.07)', borderRadius: 10, border: '1px solid rgba(245,158,11,0.15)' }}>
                  <div style={{ width: 44, height: 44, borderRadius: 10, background: 'rgba(245,158,11,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Clock size={20} color="#f59e0b" />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{b.studentName || '—'}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary, #aaa)', marginTop: 2 }}>{b.type || 'Session'} · {b.time}</div>
                  </div>
                  <div style={{ fontSize: 12, padding: '4px 10px', borderRadius: 20, background: 'rgba(34,197,94,0.15)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.3)' }}>
                    {language === 'ar' ? 'مؤكد' : language === 'fr' ? 'Confirmé' : 'Confirmed'}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Quick actions ─────────────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 14 }}>
          {[
            { icon: <Users size={24} color="#4f8ef7" />, label: t.students, bg: 'rgba(79,142,247,0.1)', border: 'rgba(79,142,247,0.25)', action: () => setShowStudents(true) },
            { icon: <Video size={24} color="#34d399" />, label: t.videos, bg: 'rgba(52,211,153,0.1)', border: 'rgba(52,211,153,0.25)', action: () => setShowVideos(true) },
            { icon: <Calendar size={24} color="#f59e0b" />, label: t.workDays, bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.25)', action: () => setShowWorkDays(true) },
            { icon: <TrendingUp size={24} color="#a78bfa" />, label: t.reports, bg: 'rgba(167,139,250,0.1)', border: 'rgba(167,139,250,0.25)', action: () => { setShowReports(true); handleLoadReport(); } },
            { icon: <RefreshCw size={24} color="#f97316" />, label: t.licenseChange, bg: 'rgba(249,115,22,0.1)', border: 'rgba(249,115,22,0.25)', action: () => setShowLicenseChange(true) },
          ].map((item, i) => (
            <button key={i} onClick={item.action} style={{ background: item.bg, border: `1px solid ${item.border}`, borderRadius: 14, padding: '20px 16px', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, transition: 'transform 0.15s', color: 'var(--text-primary,#fff)' }}
              onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-3px)')}
              onMouseLeave={e => (e.currentTarget.style.transform = 'none')}
            >
              <div style={{ width: 50, height: 50, borderRadius: 14, background: 'rgba(0,0,0,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{item.icon}</div>
              <span style={{ fontWeight: 600, fontSize: 13 }}>{item.label}</span>
            </button>
          ))}
        </div>
      </main>

      <Footer />

      {/* ════════════════════════════════════════════════════ */}
      {/* MODAL: My Info                                       */}
      {/* ════════════════════════════════════════════════════ */}
      {showInfo && (
        <Overlay onClose={() => setShowInfo(false)}>
          <ModalHeader title={t.myInfo} onClose={() => setShowInfo(false)} />
          {teacherData ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {[
                { icon: <User size={16} />, label: language === 'ar' ? 'الاسم الكامل' : language === 'fr' ? 'Nom complet' : 'Full Name', value: teacherData.fullName },
                { icon: <Mail size={16} />, label: language === 'ar' ? 'البريد الإلكتروني' : language === 'fr' ? 'Email' : 'Email', value: teacherData.email },
                { icon: <Phone size={16} />, label: language === 'ar' ? 'الهاتف' : language === 'fr' ? 'Téléphone' : 'Phone', value: teacherData.phone },
                { icon: <IdCard size={16} />, label: language === 'ar' ? 'نوع الرخصة' : language === 'fr' ? 'Type de permis' : 'License Type', value: teacherData.licenseType },
              ].map((row, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', background: 'rgba(255,255,255,0.04)', borderRadius: 10 }}>
                  <div style={{ color: '#4f8ef7' }}>{row.icon}</div>
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--text-secondary,#aaa)', marginBottom: 2 }}>{row.label}</div>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{row.value || '—'}</div>
                  </div>
                </div>
              ))}
              <button onClick={() => { setShowInfo(false); setShowProfileUpload(true); }} style={{ ...btnSecondary, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 8 }}>
                <Camera size={16} /> {t.changePhoto}
              </button>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: 32 }}><Loader2 size={28} style={{ animation: 'spin 1s linear infinite' }} /></div>
          )}
        </Overlay>
      )}

      {/* ════════════════════════════════════════════════════ */}
      {/* MODAL: Profile Upload                               */}
      {/* ════════════════════════════════════════════════════ */}
      {showProfileUpload && (
        <Overlay onClose={() => setShowProfileUpload(false)} maxWidth={440}>
          <ModalHeader title={t.changePhoto} onClose={() => setShowProfileUpload(false)} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'center' }}>
            {profilePreview ? (
              <img src={profilePreview} alt="preview" style={{ width: 120, height: 120, borderRadius: '50%', objectFit: 'cover', border: '3px solid #4f8ef7' }} />
            ) : profileImg ? (
              <img src={profileImg} alt="current" style={{ width: 120, height: 120, borderRadius: '50%', objectFit: 'cover', border: '3px solid #4f8ef7' }} />
            ) : (
              <div style={{ width: 120, height: 120, borderRadius: '50%', background: 'linear-gradient(135deg,#4f8ef7,#7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <User size={48} color="#fff" />
              </div>
            )}
            <input ref={profileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleProfileImageChange} />
            <button onClick={() => profileInputRef.current?.click()} style={{ ...btnSecondary, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Upload size={16} /> {t.selectPhoto}
            </button>
            {profileFile && (
              <button onClick={handleUploadProfile} disabled={isUploadingProfile} style={{ ...btnPrimary, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                {isUploadingProfile ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Camera size={16} />}
                {t.uploadPhoto}
              </button>
            )}
          </div>
        </Overlay>
      )}

      {/* ════════════════════════════════════════════════════ */}
      {/* MODAL: My Students                                  */}
      {/* ════════════════════════════════════════════════════ */}
      {showStudents && (
        <Overlay onClose={() => setShowStudents(false)} maxWidth={700}>
          <ModalHeader title={`${t.students} (${myStudents.length})`} onClose={() => setShowStudents(false)} />
          {myStudents.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-secondary,#aaa)' }}>{t.noStudents}</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {myStudents.map((s: any) => (
                <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', background: 'rgba(255,255,255,0.04)', borderRadius: 12 }}>
                  {s.profileImage ? (
                    <img src={s.profileImage} alt="student" style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'linear-gradient(135deg,#4f8ef7,#7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <User size={20} color="#fff" />
                    </div>
                  )}
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{s.fullName}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary,#aaa)', marginTop: 2 }}>{s.email} · {s.licenseType || '—'}</div>
                  </div>
                  <button onClick={() => openEval(s)} style={{ ...btnSecondary, padding: '6px 14px', fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Star size={13} /> {t.evaluate}
                  </button>
                </div>
              ))}
            </div>
          )}
        </Overlay>
      )}

      {/* ════════════════════════════════════════════════════ */}
      {/* MODAL: Evaluate Student                             */}
      {/* ════════════════════════════════════════════════════ */}
      {showEval && evalStudent && (
        <Overlay onClose={() => setShowEval(false)} maxWidth={480}>
          <ModalHeader title={`${t.evaluate}: ${evalStudent.fullName}`} onClose={() => setShowEval(false)} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary,#aaa)', marginBottom: 8 }}>{t.rating}</div>
              <div style={{ display: 'flex', gap: 8 }}>
                {[1,2,3,4,5].map(n => (
                  <button key={n} onClick={() => setEvalRating(n)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                    <Star size={28} fill={n <= evalRating ? '#f59e0b' : 'none'} color={n <= evalRating ? '#f59e0b' : 'rgba(255,255,255,0.3)'} />
                  </button>
                ))}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary,#aaa)', marginBottom: 8 }}>{t.comment}</div>
              <textarea
                value={evalText}
                onChange={e => setEvalText(e.target.value)}
                rows={4}
                style={{ ...inputStyle, resize: 'vertical' }}
                placeholder={language === 'ar' ? 'اكتب تعليقك هنا...' : language === 'fr' ? 'Écrivez votre commentaire...' : 'Write your comment here...'}
              />
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setShowEval(false)} style={btnSecondary}>{t.cancel}</button>
              <button onClick={handleSaveEval} disabled={isSavingEval} style={{ ...btnPrimary, display: 'flex', alignItems: 'center', gap: 8 }}>
                {isSavingEval ? <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> : <CheckCircle size={15} />}
                {t.save}
              </button>
            </div>
          </div>
        </Overlay>
      )}

      {/* ════════════════════════════════════════════════════ */}
      {/* MODAL: Videos                                       */}
      {/* ════════════════════════════════════════════════════ */}
      {showVideos && (
        <Overlay onClose={() => setShowVideos(false)} maxWidth={720}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>{t.videos} ({videos.length})</h2>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <button onClick={() => { setShowVideos(false); setShowVideoUpload(true); }} style={{ ...btnPrimary, display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                <Plus size={15} /> {t.upload}
              </button>
              <button onClick={() => setShowVideos(false)} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 8, width: 32, height: 32, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                <X size={16} />
              </button>
            </div>
          </div>
          {videos.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-secondary,#aaa)' }}>{t.noVideos}</div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 14 }}>
              {videos.map((v: any) => (
                <div key={v.id} style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 12, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.07)' }}>
                  <div style={{ background: 'rgba(52,211,153,0.1)', height: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Play size={32} color="#34d399" />
                  </div>
                  <div style={{ padding: 12 }}>
                    <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 4 }}>{v.title}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-secondary,#aaa)', display: 'flex', gap: 12 }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><Eye size={11} /> {v.views || 0}</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><Heart size={11} /> {v.likes || 0}</span>
                    </div>
                    <button onClick={() => handleDeleteVideo(v.id)} style={{ marginTop: 10, background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 7, padding: '5px 10px', cursor: 'pointer', color: '#ef4444', fontSize: 12, display: 'flex', alignItems: 'center', gap: 5 }}>
                      <Trash2 size={12} /> {t.delete}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Overlay>
      )}

      {/* ════════════════════════════════════════════════════ */}
      {/* MODAL: Upload Video                                 */}
      {/* ════════════════════════════════════════════════════ */}
      {showVideoUpload && (
        <Overlay onClose={() => setShowVideoUpload(false)} maxWidth={480}>
          <ModalHeader title={t.upload} onClose={() => setShowVideoUpload(false)} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary,#aaa)', marginBottom: 8 }}>{t.titleLabel} *</div>
              <input style={inputStyle} value={videoTitle} onChange={e => setVideoTitle(e.target.value)} placeholder={t.titleLabel} />
            </div>
            <div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary,#aaa)', marginBottom: 8 }}>{t.descLabel}</div>
              <textarea style={{ ...inputStyle, resize: 'vertical' }} rows={3} value={videoDescription} onChange={e => setVideoDescription(e.target.value)} placeholder={t.descLabel} />
            </div>
            <input ref={videoInputRef} type="file" accept="video/*" style={{ display: 'none' }} onChange={handleVideoFileChange} />
            <button onClick={() => videoInputRef.current?.click()} style={{ ...btnSecondary, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <Video size={16} /> {videoFile ? videoFile.name : t.selectVideo}
            </button>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setShowVideoUpload(false)} style={btnSecondary}>{t.cancel}</button>
              <button onClick={handleUploadVideo} disabled={isUploadingVideo} style={{ ...btnPrimary, display: 'flex', alignItems: 'center', gap: 8 }}>
                {isUploadingVideo ? <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> : <Upload size={15} />}
                {t.upload}
              </button>
            </div>
          </div>
        </Overlay>
      )}

      {/* ════════════════════════════════════════════════════ */}
      {/* MODAL: Work Days                                    */}
      {/* ════════════════════════════════════════════════════ */}
      {showWorkDays && (
        <Overlay onClose={() => setShowWorkDays(false)} maxWidth={560}>
          <ModalHeader title={t.workDays} onClose={() => setShowWorkDays(false)} />
          <WorkDaysSelector workDays={workDays} onChange={setWorkDays} language={language} />
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
            <button onClick={() => setShowWorkDays(false)} style={btnSecondary}>{t.cancel}</button>
            <button onClick={handleSaveWorkDays} disabled={isSavingWorkDays} style={{ ...btnPrimary, display: 'flex', alignItems: 'center', gap: 8 }}>
              {isSavingWorkDays ? <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> : <CheckCircle size={15} />}
              {t.save}
            </button>
          </div>
        </Overlay>
      )}

      {/* ════════════════════════════════════════════════════ */}
      {/* MODAL: Reports                                      */}
      {/* ════════════════════════════════════════════════════ */}
      {showReports && (
        <Overlay onClose={() => setShowReports(false)} maxWidth={520}>
          <ModalHeader title={t.reports} onClose={() => setShowReports(false)} />
          {loadingReport ? (
            <div style={{ textAlign: 'center', padding: 40 }}><Loader2 size={32} style={{ animation: 'spin 1s linear infinite', color: '#4f8ef7' }} /></div>
          ) : reportData ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              {[
                { label: t.totalStudents, value: reportData.totalStudents, icon: <Users size={20} color="#4f8ef7" />, bg: 'rgba(79,142,247,0.1)' },
                { label: t.totalBookings, value: reportData.totalBookings, icon: <Calendar size={20} color="#f59e0b" />, bg: 'rgba(245,158,11,0.1)' },
                { label: t.completedSessions, value: reportData.completedBookings, icon: <CheckCircle size={20} color="#22c55e" />, bg: 'rgba(34,197,94,0.1)' },
                { label: t.totalVideosLabel, value: reportData.totalVideos, icon: <Video size={20} color="#34d399" />, bg: 'rgba(52,211,153,0.1)' },
              ].map((r, i) => (
                <div key={i} style={{ background: r.bg, borderRadius: 12, padding: '18px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {r.icon}
                  <div style={{ fontSize: 28, fontWeight: 700 }}>{r.value ?? '—'}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary,#aaa)' }}>{r.label}</div>
                </div>
              ))}
            </div>
          ) : null}
        </Overlay>
      )}

      {/* ════════════════════════════════════════════════════ */}
      {/* MODAL: License Change Request                       */}
      {/* ════════════════════════════════════════════════════ */}
      {showLicenseChange && (
        <Overlay onClose={() => setShowLicenseChange(false)} maxWidth={480}>
          <ModalHeader title={t.licenseChange} onClose={() => setShowLicenseChange(false)} />
          <form onSubmit={handleLicenseChangeSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ padding: '10px 14px', background: 'rgba(255,255,255,0.05)', borderRadius: 10, fontSize: 13 }}>
              {t.currentLicense}: <strong>{teacherData?.licenseType || '—'}</strong>
            </div>
            <div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary,#aaa)', marginBottom: 8 }}>{t.requestedType} *</div>
              <select
                style={{ ...inputStyle }}
                value={licenseForm.requestedLicenseType}
                onChange={e => setLicenseForm(prev => ({ ...prev, requestedLicenseType: e.target.value }))}
                required
              >
                <option value="">— {language === 'ar' ? 'اختر' : language === 'fr' ? 'Choisir' : 'Select'} —</option>
                {['A', 'B', 'C', 'D', 'EB', 'EC', 'ED'].map(lt => (
                  <option key={lt} value={lt}>{lt}</option>
                ))}
              </select>
            </div>
            <div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary,#aaa)', marginBottom: 8 }}>{t.reason} *</div>
              <textarea
                style={{ ...inputStyle, resize: 'vertical' }}
                rows={4}
                value={licenseForm.reason}
                onChange={e => setLicenseForm(prev => ({ ...prev, reason: e.target.value }))}
                required
                placeholder={language === 'ar' ? 'اشرح سبب طلبك...' : language === 'fr' ? 'Expliquez votre demande...' : 'Explain your request...'}
              />
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button type="button" onClick={() => setShowLicenseChange(false)} style={btnSecondary}>{t.cancel}</button>
              <button type="submit" disabled={isSubmittingLicense} style={{ ...btnPrimary, display: 'flex', alignItems: 'center', gap: 8 }}>
                {isSubmittingLicense ? <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> : <FileText size={15} />}
                {t.send}
              </button>
            </div>
          </form>
        </Overlay>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// Export wrapped in LanguageProvider
// ─────────────────────────────────────────────────────────────
const TeacherDashboard = () => (
  <LanguageProvider>
    <TeacherDashboardContent />
  </LanguageProvider>
);

export default TeacherDashboard;
