import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LanguageProvider, useLanguage } from '../contexts/LanguageContext';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { ShieldAlert, Home, ArrowLeft } from 'lucide-react';
import '../components/style/theme.css';

const UnauthorizedContent = () => {
  const { language } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleGoToDashboard = () => {
    if (user) {
      switch (user.role) {
        case 'student': navigate('/student-dashboard'); break;
        case 'teacher': navigate('/teacher-dashboard'); break;
        case 'admin':   navigate('/admin-dashboard');   break;
        default:        navigate('/');
      }
    } else {
      navigate('/login');
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-darkest)', color: 'var(--text-primary)' }}>
      <Navbar />

      {/* Background glow */}
      <div style={{
        position: 'fixed', top: '20%', left: '50%', transform: 'translateX(-50%)',
        width: 600, height: 600,
        background: 'radial-gradient(circle, rgba(239,68,68,0.06) 0%, transparent 70%)',
        borderRadius: '50%', pointerEvents: 'none', zIndex: 0,
      }} />

      <main style={{
        position: 'relative', zIndex: 1,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        minHeight: '100vh', padding: '120px 1.5rem 3rem',
      }}>
        <div style={{
          maxWidth: 560, width: '100%',
          background: 'var(--grad-card)',
          border: '1px solid rgba(239,68,68,0.25)',
          borderRadius: 'var(--radius-xl)',
          padding: '3rem 2.5rem',
          textAlign: 'center',
          boxShadow: '0 24px 64px rgba(0,0,0,0.5)',
        }}>
          {/* Icon */}
          <div style={{
            width: 80, height: 80, borderRadius: '50%',
            background: 'rgba(239,68,68,0.12)',
            border: '1px solid rgba(239,68,68,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 1.75rem',
            color: '#FCA5A5',
          }}>
            <ShieldAlert size={36} />
          </div>

          <h1 style={{
            fontSize: 'clamp(1.75rem, 4vw, 2.5rem)',
            fontWeight: 800, color: 'var(--text-white)',
            marginBottom: '1rem', letterSpacing: '-0.02em',
          }}>
            {language === 'ar' ? 'وصول غير مصرح به' : language === 'fr' ? 'Accès non autorisé' : 'Unauthorized Access'}
          </h1>

          <p style={{
            fontSize: '1rem', color: 'var(--text-secondary)',
            lineHeight: 1.7, marginBottom: '1.5rem',
          }}>
            {language === 'ar'
              ? 'عذراً، ليس لديك صلاحية للوصول إلى هذه الصفحة. يرجى التحقق من صلاحياتك أو الاتصال بالمسؤول.'
              : language === 'fr'
              ? "Désolé, vous n'avez pas la permission d'accéder à cette page. Veuillez vérifier vos autorisations ou contacter l'administrateur."
              : 'Sorry, you do not have permission to access this page. Please check your permissions or contact the administrator.'}
          </p>

          {user && (
            <div style={{
              padding: '1rem 1.25rem',
              background: 'rgba(59,130,246,0.08)',
              border: '1px solid rgba(59,130,246,0.2)',
              borderRadius: 'var(--radius-md)',
              marginBottom: '2rem',
            }}>
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '0.375rem' }}>
                {language === 'ar' ? 'دورك الحالي:' : language === 'fr' ? 'Votre rôle actuel:' : 'Your current role:'}
              </p>
              <p style={{ fontSize: '1.0625rem', fontWeight: 700, color: '#93C5FD' }}>
                {user.role === 'student'
                  ? (language === 'ar' ? 'طالب' : language === 'fr' ? 'Étudiant' : 'Student')
                  : user.role === 'teacher'
                  ? (language === 'ar' ? 'معلم' : language === 'fr' ? 'Enseignant' : 'Teacher')
                  : (language === 'ar' ? 'مدير' : language === 'fr' ? 'Administrateur' : 'Admin')}
              </p>
            </div>
          )}

          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={handleGoToDashboard}
              className="btn-primary"
            >
              <Home size={18} />
              {language === 'ar' ? 'الذهاب إلى لوحة التحكم' : language === 'fr' ? 'Aller au tableau de bord' : 'Go to Dashboard'}
            </button>

            <button
              onClick={() => navigate(-1)}
              className="btn-outline"
            >
              <ArrowLeft size={18} />
              {language === 'ar' ? 'رجوع' : language === 'fr' ? 'Retour' : 'Go Back'}
            </button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

const Unauthorized = () => (
  <LanguageProvider>
    <UnauthorizedContent />
  </LanguageProvider>
);

export default Unauthorized;
