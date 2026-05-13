import { useState, useEffect } from 'react';
import { LanguageProvider, useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useIsMobile } from '../hooks/use-mobile';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import {
  Calendar, BookOpen, Car, Trophy, Clock, User, FileText, Video,
  Info, Mail, Phone, IdCard, Upload, Camera, Check, Loader2,
  Play, Heart, Eye, List, X, GraduationCap, MessageCircle
} from 'lucide-react';
import { supabase } from '../supabase';
import '../components/style/theme.css';

// ─── Reusable overlay modal ────────────────────────────────────────────────────
const Overlay = ({ children, onClose, maxWidth = 600 }: { children: React.ReactNode; onClose: () => void; maxWidth?: number }) => (
  <div
    style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.8)', padding: '1rem' }}
    onClick={onClose}
  >
    <div
      style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)', width: '100%', maxWidth, maxHeight: '90vh', overflow: 'auto' }}
      onClick={e => e.stopPropagation()}
    >
      {children}
    </div>
  </div>
);

const ModalHeader = ({ title, onClose }: { title: string; onClose: () => void }) => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border)', position: 'sticky', top: 0, background: 'var(--bg-card)', zIndex: 1 }}>
    <h2 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-white)' }}>{title}</h2>
    <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4, display: 'flex', borderRadius: 6 }}>
      <X size={20} />
    </button>
  </div>
);

// ─── Main component ────────────────────────────────────────────────────────────
const StudentDashboardContent = () => {
  const { language, dir } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const t = (ar: string, fr: string, en: string) =>
    language === 'ar' ? ar : language === 'fr' ? fr : en;

  // Data
  const [studentData, setStudentData] = useState<any>(null);
  const [teacherData, setTeacherData] = useState<any>(null);

  const [sessions, setSessions] = useState<any[]>([]);
  const [videos, setVideos] = useState<any[]>([]);
  const [loadingVideos, setLoadingVideos] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Dialogs
  const [showInfo, setShowInfo] = useState(false);
  const [showProfileUpload, setShowProfileUpload] = useState(false);
  const [showTeacher, setShowTeacher] = useState(false);
  const [showSessions, setShowSessions] = useState(false);
  const [showVideos, setShowVideos] = useState(false);
  const [showTest, setShowTest] = useState(false);
  const [showAchievements, setShowAchievements] = useState(false);

  // Profile upload
  const [profileFile, setProfileFile] = useState<File | null>(null);
  const [profilePreview, setProfilePreview] = useState('');
  const [uploading, setUploading] = useState(false);

  // Test
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [testDone, setTestDone] = useState(false);
  const [testResult, setTestResult] = useState<number | null>(null);

  // ── Fetch student data ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!user?.uid) return;
    (async () => {
      const { data } = await supabase.from('users').select('*').eq('id', user.uid).single();
      if (!data) return;
      setStudentData(data);
      if (data.teacherId) {
        const { data: t } = await supabase.from('users').select('*').eq('id', data.teacherId).single();
        if (t) setTeacherData(t);
      }
    })();
  }, [user?.uid]);

  useEffect(() => {
    if (!user?.uid) return;
    supabase.from('bookings').select('*').eq('studentId', user.uid).eq('status', 'approved')
      .then(({ data }) => {
        const sorted = (data || []).sort((a: any, b: any) =>
          new Date(`${a.date}T${a.time}`).getTime() - new Date(`${b.date}T${b.time}`).getTime()
        );
        setSessions(sorted);
      });
  }, [user?.uid]);

  useEffect(() => {
    if (!user?.uid) return;
    supabase.from('messages').select('*', { count: 'exact', head: true })
      .eq('receiverId', user.uid).eq('read', false)
      .then(({ count }) => setUnreadCount(count || 0));
  }, [user?.uid]);

  useEffect(() => {
    if (!showVideos) return;
    setLoadingVideos(true);
    supabase.from('educationalVideos').select('*').order('createdAt', { ascending: false })
      .then(({ data }) => { setVideos(data || []); setLoadingVideos(false); });
  }, [showVideos]);

  // ── Computed ────────────────────────────────────────────────────────────────
  const payments = studentData?.payments || { code: false, creneau: false, circui: false };
  const today = new Date().toISOString().split('T')[0];
  const upcoming = sessions.filter(s => s.date >= today).slice(0, 6);
  const codeCount = sessions.filter(s => (s.sessionType || s.type) === 'code').length;
  const creneauCount = sessions.filter(s => (s.sessionType || s.type) === 'creneau').length;
  const circuiCount = sessions.filter(s => (s.sessionType || s.type) === 'circui').length;
  const testScore = studentData?.testScore ?? null;
  const profileImg = studentData?.photoURL || studentData?.profileImage;

  const formatDate = (d: string) =>
    new Date(`${d}T00:00:00`).toLocaleDateString(
      language === 'ar' ? 'ar-DZ' : language === 'fr' ? 'fr-FR' : 'en-US',
      { weekday: 'short', day: 'numeric', month: 'short' }
    );

  // ── Test questions ──────────────────────────────────────────────────────────
  const questions = [
    { q: t('السرعة القصوى داخل المدينة؟', 'Vitesse maximale en ville?', 'Max speed in city?'), opts: ['40 km/h', '50 km/h', '60 km/h', '70 km/h'], ans: 1 },
    { q: t('الضوء الأحمر يعني؟', 'Le feu rouge signifie?', 'Red light means?'), opts: [t('توقف', 'Arrêt', 'Stop'), t('استعد', 'Préparez-vous', 'Get ready'), t('انطلق', 'Allez', 'Go'), t('تباطأ', 'Ralentir', 'Slow')], ans: 0 },
    { q: t('حزام الأمان يُستخدم؟', 'La ceinture de sécurité s\'utilise?', 'Seatbelt should be worn?'), opts: [t('في الطريق السريع فقط', 'Sur autoroute seulement', 'Highway only'), t('في الرحلات الطويلة', 'Longs trajets', 'Long trips'), t('دائماً', 'Toujours', 'Always'), t('عند السرعة العالية', 'À haute vitesse', 'High speed')], ans: 2 },
    { q: t('إشارة قف تعني؟', 'Panneau STOP signifie?', 'STOP sign means?'), opts: [t('تباطأ', 'Ralentir', 'Slow down'), t('توقف تاماً', 'Arrêt complet', 'Complete stop'), t('استمر بحذر', 'Continuer prudemment', 'Continue carefully'), t('أطلق البوق', 'Klaxonner', 'Honk')], ans: 1 },
    { q: t('المسافة الآمنة بين السيارتين؟', 'Distance de sécurité entre véhicules?', 'Safe distance between vehicles?'), opts: ['1 m', t('ثانيتان', '2 secondes', '2 seconds'), '5 m', '10 m'], ans: 1 },
  ];

  const submitTest = async () => {
    const correct = questions.filter((q, i) => answers[i] === q.ans).length;
    const score = Math.round((correct / questions.length) * 100);
    setTestResult(score);
    setTestDone(true);
    if (user?.uid) {
      await supabase.from('users').update({ testScore: score, lastTestDate: new Date().toISOString() }).eq('id', user.uid);
      setStudentData((p: any) => ({ ...p, testScore: score }));
    }
  };

  // ── Profile upload ──────────────────────────────────────────────────────────
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setProfileFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setProfilePreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const uploadProfile = async () => {
    if (!profileFile || !user?.uid) return;
    setUploading(true);
    try {
      const form = new FormData();
      form.append('file', profileFile);
      form.append('upload_preset', 'preset');
      const res = await fetch('https://api.cloudinary.com/v1_1/dpjclv2nb/image/upload', { method: 'POST', body: form });
      const data = await res.json();
      if (data.secure_url) {
        await supabase.from('users').update({ photoURL: data.secure_url }).eq('id', user.uid);
        setStudentData((p: any) => ({ ...p, photoURL: data.secure_url }));
        setShowProfileUpload(false);
        setProfileFile(null);
        setProfilePreview('');
      }
    } finally {
      setUploading(false);
    }
  };

  // ── Styles ──────────────────────────────────────────────────────────────────
  const card: React.CSSProperties = { background: 'var(--grad-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '1.5rem' };
  const infoRow = (icon: React.ReactNode, label: string, value: string) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '0.75rem 1rem', background: 'var(--bg-mid)', borderRadius: 'var(--radius-md)', marginBottom: 8 }}>
      <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--grad-gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{icon}</div>
      <div><div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: 1 }}>{label}</div><div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-white)' }}>{value || '—'}</div></div>
    </div>
  );

  const sessionTypeDot: Record<string, string> = { code: '#4f8ef7', creneau: '#10b981', circui: '#f59e0b' };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-darkest)', color: 'var(--text-primary)' }} dir={dir}>
      <Navbar />
      <main style={{ maxWidth: 1300, margin: '0 auto', padding: isMobile ? '5rem 1rem 3rem' : '5.5rem 1.5rem 4rem' }}>

        {/* ── Header card ── */}
        <div style={{ ...card, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <div
            onClick={() => setShowProfileUpload(true)}
            style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--grad-gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0, cursor: 'pointer', boxShadow: '0 0 20px rgba(245,166,35,0.35)' }}
          >
            {profileImg ? <img src={profileImg} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <User size={30} color="#000" />}
          </div>
          <div style={{ flex: 1 }}>
            <h1 style={{ margin: 0, fontSize: '1.65rem', fontWeight: 800, color: 'var(--text-white)' }}>
              {t(`مرحباً، ${studentData?.fullName || user?.name || ''}`, `Bienvenue, ${studentData?.fullName || user?.name || ''}`, `Welcome, ${studentData?.fullName || user?.name || ''}`)}
            </h1>
            <p style={{ margin: '4px 0 0', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
              {t('تابع تقدمك في تعلم السياقة', 'Suivez votre progression en conduite', 'Track your driving learning progress')}
            </p>
          </div>
          <button className="btn-outline" style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }} onClick={() => setShowInfo(true)}>
            <Info size={15} /> {t('معلوماتي', 'Mes infos', 'My Info')}
          </button>
        </div>

        {/* ── Stats ── */}
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
          {[
            { icon: <BookOpen size={26} />, label: t('دروس الكود', 'Leçons Code', 'Code Lessons'), value: `${codeCount}/10`, color: payments.code ? '#10b981' : '#ef4444', sub: payments.code ? t('مدفوع', 'Payé', 'Paid') : t('غير مدفوع', 'Non payé', 'Unpaid') },
            { icon: <Car size={26} />, label: t('الكرينو', 'Créneau', 'Creneau'), value: `${creneauCount}/15`, color: payments.creneau ? '#10b981' : '#ef4444', sub: payments.creneau ? t('مدفوع', 'Payé', 'Paid') : t('غير مدفوع', 'Non payé', 'Unpaid') },
            { icon: <Trophy size={26} />, label: t('السيركوي', 'Circui', 'Circui'), value: `${circuiCount}/15`, color: payments.circui ? '#10b981' : '#ef4444', sub: payments.circui ? t('مدفوع', 'Payé', 'Paid') : t('غير مدفوع', 'Non payé', 'Unpaid') },
            { icon: <Clock size={26} />, label: t('ساعات التدريب', "Heures d'entraîn.", 'Training Hours'), value: '0/40', color: '#4f8ef7', sub: t('ساعة', 'heures', 'hours') },
          ].map(({ icon, label, value, color, sub }) => (
            <div key={label} style={{ ...card, textAlign: 'center', padding: '1.25rem 1rem' }}>
              <div style={{ color, marginBottom: 8 }}>{icon}</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-white)' }}>{value}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>{label}</div>
              <div style={{ fontSize: '0.72rem', color, fontWeight: 600, marginTop: 4 }}>{sub}</div>
            </div>
          ))}
        </div>

        {/* ── Two-column layout ── */}
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '1.5rem' }}>

          {/* Upcoming sessions */}
          <div style={card}>
            <h3 style={{ margin: '0 0 1rem', fontSize: '1rem', fontWeight: 700, color: 'var(--text-white)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Calendar size={18} style={{ color: 'var(--primary)' }} />
              {t('الحصص القادمة', 'Séances à venir', 'Upcoming Sessions')}
            </h3>
            {upcoming.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-muted)' }}>
                <Calendar size={36} style={{ opacity: 0.3, marginBottom: 8 }} />
                <p style={{ margin: 0, fontSize: '0.85rem' }}>{t('لا توجد حصص قادمة', 'Aucune séance à venir', 'No upcoming sessions')}</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {upcoming.map((s: any) => {
                  const type = s.sessionType || s.type || 'code';
                  return (
                    <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0.75rem', background: 'var(--bg-mid)', borderRadius: 'var(--radius-md)' }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: sessionTypeDot[type] || '#4f8ef7', flexShrink: 0 }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-white)', textTransform: 'capitalize' }}>{type}</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{formatDate(s.date)} · {s.time}</div>
                      </div>
                      {s.teacherName && <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>{s.teacherName}</div>}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Quick actions */}
          <div style={card}>
            <h3 style={{ margin: '0 0 1rem', fontSize: '1rem', fontWeight: 700, color: 'var(--text-white)' }}>
              {t('الإجراءات السريعة', 'Actions rapides', 'Quick Actions')}
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                { icon: <List size={18} />, label: t('حصصي', 'Mes séances', 'My Sessions'), sub: `${sessions.length} ${t('حصة', 'séances', 'sessions')}`, badge: sessions.length || null, onClick: () => setShowSessions(true) },
                { icon: <Calendar size={18} />, label: t('حجز موعد', 'Réserver un créneau', 'Book Appointment'), sub: t('احجز مع معلمك', 'Réserver avec votre moniteur', 'Book with your instructor'), onClick: () => navigate('/bookings') },
                { icon: <BookOpen size={18} />, label: t('المواد التعليمية', 'Matériel pédagogique', 'Learning Materials'), sub: t('الدروس والمواد', 'Cours et matériel', 'Lessons & materials'), onClick: () => navigate('/learning-materials') },
                { icon: <Video size={18} />, label: t('الفيديوهات', 'Vidéos éducatives', 'Educational Videos'), sub: t('فيديوهات المعلم', 'Vidéos du moniteur', 'Instructor videos'), onClick: () => setShowVideos(true) },
                { icon: <FileText size={18} />, label: t('الاختبارات', 'Tests', 'Tests'), sub: testScore !== null ? `${testScore}%` : t('اختبر معلوماتك', 'Testez vos connaissances', 'Test your knowledge'), badge: testScore !== null ? `${testScore}%` : null, onClick: () => { setCurrentQ(0); setAnswers({}); setTestDone(false); setTestResult(null); setShowTest(true); } },
                { icon: <User size={18} />, label: t('معلمي', 'Mon moniteur', 'My Instructor'), sub: teacherData?.fullName || t('لم يُعيَّن', 'Non assigné', 'Not assigned'), badge: unreadCount || null, onClick: () => setShowTeacher(true) },
                { icon: <Trophy size={18} />, label: t('إنجازاتي', 'Mes réalisations', 'Achievements'), sub: t('الشهادات والإنجازات', 'Certificats et réalisations', 'Certificates & achievements'), onClick: () => setShowAchievements(true) },
              ].map(({ icon, label, sub, badge, onClick }) => (
                <button
                  key={label}
                  onClick={onClick}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0.75rem', background: 'var(--bg-mid)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', cursor: 'pointer', width: '100%', textAlign: 'start', color: 'inherit' }}
                >
                  <span style={{ color: 'var(--primary)', flexShrink: 0 }}>{icon}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-white)' }}>{label}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{sub}</div>
                  </div>
                  {badge != null && <span style={{ background: 'var(--primary)', color: '#000', borderRadius: 20, padding: '2px 8px', fontSize: '0.68rem', fontWeight: 700, flexShrink: 0 }}>{badge}</span>}
                </button>
              ))}
            </div>
          </div>
        </div>
      </main>
      <Footer />

      {/* ═══════════════════════ MODALS ═══════════════════════ */}

      {/* My Info */}
      {showInfo && (
        <Overlay onClose={() => setShowInfo(false)}>
          <ModalHeader title={t('معلومات الطالب', "Informations de l'étudiant", 'Student Information')} onClose={() => setShowInfo(false)} />
          <div style={{ padding: '1.5rem' }}>
            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <div onClick={() => setShowProfileUpload(true)} style={{ width: 80, height: 80, borderRadius: '50%', background: 'var(--grad-gold)', margin: '0 auto 0.75rem', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                {profileImg ? <img src={profileImg} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <User size={36} color="#000" />}
              </div>
              <button className="btn-outline" style={{ fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: 4 }} onClick={() => setShowProfileUpload(true)}>
                <Camera size={12} /> {t('تغيير الصورة', 'Changer la photo', 'Change photo')}
              </button>
            </div>
            {infoRow(<User size={16} color="#000" />, t('الاسم الكامل', 'Nom complet', 'Full Name'), studentData?.fullName || '')}
            {infoRow(<Mail size={16} color="#000" />, t('البريد الإلكتروني', 'Email', 'Email'), studentData?.email || user?.email || '')}
            {infoRow(<Phone size={16} color="#000" />, t('الهاتف', 'Téléphone', 'Phone'), studentData?.phone || '')}
            {infoRow(<IdCard size={16} color="#000" />, t('معرف الطالب', "ID de l'étudiant", 'Student ID'), (user?.uid || '').substring(0, 8).toUpperCase())}
            {infoRow(<Car size={16} color="#000" />, t('نوع الرخصة', 'Type de permis', 'License Type'), studentData?.licenseType || '')}
            {infoRow(<GraduationCap size={16} color="#000" />, t('المعلم', 'Moniteur', 'Instructor'), teacherData?.fullName || t('لم يُعيَّن', 'Non assigné', 'Not assigned'))}
          </div>
        </Overlay>
      )}

      {/* Profile upload */}
      {showProfileUpload && (
        <Overlay onClose={() => setShowProfileUpload(false)} maxWidth={400}>
          <ModalHeader title={t('تغيير الصورة الشخصية', 'Changer la photo', 'Change Profile Photo')} onClose={() => setShowProfileUpload(false)} />
          <div style={{ padding: '1.5rem', textAlign: 'center' }}>
            <div style={{ width: 100, height: 100, borderRadius: '50%', background: 'var(--bg-mid)', margin: '0 auto 1rem', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {profilePreview ? <img src={profilePreview} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : profileImg ? <img src={profileImg} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <Upload size={32} style={{ color: 'var(--text-muted)' }} />}
            </div>
            <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '0.6rem 1.2rem', background: 'var(--bg-mid)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', cursor: 'pointer', fontSize: '0.875rem', color: 'var(--text-primary)' }}>
              <Camera size={15} /> {t('اختر صورة', 'Choisir une image', 'Choose image')}
              <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileChange} />
            </label>
            {profileFile && (
              <button className="btn-primary" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, width: '100%', marginTop: '1rem' }} onClick={uploadProfile} disabled={uploading}>
                {uploading ? <Loader2 size={15} style={{ animation: 'spin 0.8s linear infinite' }} /> : <Check size={15} />}
                {t('حفظ الصورة', 'Enregistrer', 'Save Photo')}
              </button>
            )}
          </div>
        </Overlay>
      )}

      {/* My Teacher */}
      {showTeacher && (
        <Overlay onClose={() => setShowTeacher(false)} maxWidth={480}>
          <ModalHeader title={t('معلمي', 'Mon moniteur', 'My Instructor')} onClose={() => setShowTeacher(false)} />
          <div style={{ padding: '1.5rem' }}>
            {!teacherData ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                <User size={48} style={{ opacity: 0.3, marginBottom: 10 }} />
                <p style={{ margin: 0 }}>{t('لم يُعيَّن معلم بعد', 'Aucun moniteur assigné', 'No instructor assigned yet')}</p>
              </div>
            ) : (
              <>
                <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                  <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'var(--grad-gold)', margin: '0 auto 0.75rem', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {teacherData.photoURL ? <img src={teacherData.photoURL} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <User size={36} color="#000" />}
                  </div>
                  <h3 style={{ margin: 0, color: 'var(--text-white)', fontWeight: 700 }}>{teacherData.fullName}</h3>
                  <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: '0.85rem' }}>{teacherData.email}</p>
                </div>
                {infoRow(<Phone size={15} color="#000" />, t('الهاتف', 'Téléphone', 'Phone'), teacherData.phone || '')}
                {infoRow(<Car size={15} color="#000" />, t('نوع الرخصة', 'Type de permis', 'License'), teacherData.licenseType || '')}
                <button className="btn-primary" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, width: '100%', marginTop: '1rem' }}
                  onClick={() => { setShowTeacher(false); navigate('/chat', { state: { userId: teacherData.id, userName: teacherData.fullName } }); }}>
                  <MessageCircle size={16} /> {t('مراسلة المعلم', 'Envoyer un message', 'Message Instructor')}
                </button>
              </>
            )}
          </div>
        </Overlay>
      )}

      {/* Sessions list */}
      {showSessions && (
        <Overlay onClose={() => setShowSessions(false)}>
          <ModalHeader title={t('جميع حصصي', 'Toutes mes séances', 'All My Sessions')} onClose={() => setShowSessions(false)} />
          <div style={{ padding: '1.5rem' }}>
            {sessions.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                <Calendar size={40} style={{ opacity: 0.3, marginBottom: 10 }} />
                <p style={{ margin: 0 }}>{t('لا توجد حصص', 'Aucune séance', 'No sessions yet')}</p>
              </div>
            ) : sessions.map((s: any) => {
              const type = s.sessionType || s.type || 'code';
              return (
                <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0.75rem 1rem', background: 'var(--bg-mid)', borderRadius: 'var(--radius-md)', marginBottom: 8 }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: sessionTypeDot[type] || '#4f8ef7', flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-white)', textTransform: 'capitalize' }}>{type}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{formatDate(s.date)} · {s.time}</div>
                  </div>
                  {s.teacherName && <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>{s.teacherName}</span>}
                  <span style={{ fontSize: '0.7rem', padding: '2px 8px', borderRadius: 20, background: 'rgba(16,185,129,0.12)', color: '#10b981', fontWeight: 600 }}>✓</span>
                </div>
              );
            })}
          </div>
        </Overlay>
      )}

      {/* Knowledge Test */}
      {showTest && (
        <Overlay onClose={() => setShowTest(false)}>
          <ModalHeader title={t('اختبار المعرفة', 'Test de connaissance', 'Knowledge Test')} onClose={() => setShowTest(false)} />
          <div style={{ padding: '1.5rem' }}>
            {testDone ? (
              <div style={{ textAlign: 'center', padding: '1.5rem 1rem' }}>
                <Trophy size={52} style={{ color: (testResult || 0) >= 50 ? '#10b981' : '#ef4444', marginBottom: 12 }} />
                <div style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--text-white)' }}>{testResult}%</div>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                  {(testResult || 0) >= 50
                    ? t('ممتاز! لقد نجحت في الاختبار', 'Excellent ! Vous avez réussi', 'Excellent! You passed the test')
                    : t('حاول مرة أخرى للحصول على نتيجة أفضل', 'Réessayez pour un meilleur score', 'Try again for a better score')}
                </p>
                <button className="btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }} onClick={() => { setCurrentQ(0); setAnswers({}); setTestDone(false); setTestResult(null); }}>
                  {t('إعادة الاختبار', 'Refaire le test', 'Retake Test')}
                </button>
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 8 }}>
                  <span>{t('سؤال', 'Question', 'Question')} {currentQ + 1} / {questions.length}</span>
                  <span>{Object.keys(answers).length} {t('مُجاب', 'répondu(s)', 'answered')}</span>
                </div>
                <div style={{ height: 4, background: 'var(--bg-mid)', borderRadius: 4, marginBottom: '1.5rem', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${((currentQ + 1) / questions.length) * 100}%`, background: 'var(--primary)', borderRadius: 4, transition: 'width 0.3s ease' }} />
                </div>
                <p style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-white)', marginBottom: '1rem', lineHeight: 1.5 }}>{questions[currentQ].q}</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: '1.5rem' }}>
                  {questions[currentQ].opts.map((opt, i) => (
                    <button key={i} onClick={() => setAnswers(a => ({ ...a, [currentQ]: i }))}
                      style={{ padding: '0.75rem 1rem', background: answers[currentQ] === i ? 'rgba(245,166,35,0.12)' : 'var(--bg-mid)', border: `1.5px solid ${answers[currentQ] === i ? 'var(--primary)' : 'var(--border)'}`, borderRadius: 'var(--radius-md)', color: answers[currentQ] === i ? 'var(--primary)' : 'var(--text-primary)', cursor: 'pointer', textAlign: 'start', fontWeight: answers[currentQ] === i ? 600 : 400, transition: 'all 0.15s' }}>
                      {opt}
                    </button>
                  ))}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                  <button className="btn-outline" onClick={() => setCurrentQ(q => q - 1)} disabled={currentQ === 0}>{t('السابق', 'Précédent', 'Previous')}</button>
                  {currentQ < questions.length - 1
                    ? <button className="btn-primary" onClick={() => setCurrentQ(q => q + 1)} disabled={answers[currentQ] === undefined}>{t('التالي', 'Suivant', 'Next')}</button>
                    : <button className="btn-primary" onClick={submitTest} disabled={Object.keys(answers).length < questions.length}>{t('إرسال الاختبار', 'Soumettre', 'Submit Test')}</button>}
                </div>
              </>
            )}
          </div>
        </Overlay>
      )}

      {/* Videos */}
      {showVideos && (
        <Overlay onClose={() => setShowVideos(false)}>
          <ModalHeader title={t('الفيديوهات التعليمية', 'Vidéos éducatives', 'Educational Videos')} onClose={() => setShowVideos(false)} />
          <div style={{ padding: '1.5rem' }}>
            {loadingVideos ? (
              <div style={{ textAlign: 'center', padding: '2rem' }}><Loader2 size={32} style={{ color: 'var(--primary)', animation: 'spin 0.8s linear infinite' }} /></div>
            ) : videos.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                <Video size={40} style={{ opacity: 0.3, marginBottom: 10 }} />
                <p style={{ margin: 0, fontSize: '0.875rem' }}>{t('لا توجد فيديوهات بعد', 'Aucune vidéo disponible', 'No videos yet')}</p>
              </div>
            ) : videos.map((v: any) => (
              <div key={v.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '0.875rem 1rem', background: 'var(--bg-mid)', borderRadius: 'var(--radius-md)', marginBottom: 8 }}>
                <div style={{ width: 44, height: 44, borderRadius: 'var(--radius-md)', background: 'rgba(59,130,246,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Play size={20} style={{ color: '#4f8ef7' }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-white)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v.title}</div>
                  <div style={{ display: 'flex', gap: 10, marginTop: 3, fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                    {v.teacherName && <span>{v.teacherName}</span>}
                    <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><Eye size={10} />{v.views || 0}</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><Heart size={10} />{v.likes || 0}</span>
                  </div>
                </div>
                <button onClick={() => window.open(v.videoUrl || v.cloudinaryUrl, '_blank')} style={{ padding: '0.5rem 0.875rem', background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.25)', borderRadius: 'var(--radius-md)', color: '#4f8ef7', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600, flexShrink: 0 }}>
                  {t('مشاهدة', 'Voir', 'Watch')}
                </button>
              </div>
            ))}
          </div>
        </Overlay>
      )}

      {/* Achievements */}
      {showAchievements && (
        <Overlay onClose={() => setShowAchievements(false)} maxWidth={480}>
          <ModalHeader title={t('إنجازاتي', 'Mes réalisations', 'My Achievements')} onClose={() => setShowAchievements(false)} />
          <div style={{ padding: '1.5rem' }}>
            {[
              { icon: <BookOpen size={22} />, label: t('دروس الكود مكتملة', 'Leçons de code terminées', 'Code Lessons Complete'), progress: `${codeCount}/10`, done: codeCount >= 10 },
              { icon: <Car size={22} />, label: t('الكرينو مكتمل', 'Créneau terminé', 'Creneau Complete'), progress: `${creneauCount}/15`, done: creneauCount >= 15 },
              { icon: <Trophy size={22} />, label: t('السيركوي مكتمل', 'Circui terminé', 'Circui Complete'), progress: `${circuiCount}/15`, done: circuiCount >= 15 },
              { icon: <FileText size={22} />, label: t('اجتياز الاختبار', 'Test réussi', 'Test Passed'), progress: testScore !== null ? `${testScore}%` : '0%', done: (testScore || 0) >= 50 },
            ].map(({ icon, label, progress, done }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '0.875rem 1rem', background: 'var(--bg-mid)', borderRadius: 'var(--radius-md)', marginBottom: 8, opacity: done ? 1 : 0.55 }}>
                <div style={{ color: done ? '#f59e0b' : 'var(--text-muted)', flexShrink: 0 }}>{icon}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-white)' }}>{label}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{progress}</div>
                </div>
                {done && <Trophy size={16} style={{ color: '#f59e0b', flexShrink: 0 }} />}
              </div>
            ))}
          </div>
        </Overlay>
      )}
    </div>
  );
};

const StudentDashboard = () => (
  <LanguageProvider>
    <StudentDashboardContent />
  </LanguageProvider>
);

export default StudentDashboard;
