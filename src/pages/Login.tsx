import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { LanguageProvider } from '../contexts/LanguageContext';
import { Car, GraduationCap, User, Shield, Eye, EyeOff, AlertCircle, KeyRound } from 'lucide-react';
import { supabase } from '../supabase';
import '../components/style/theme.css';

type UserRole = 'student' | 'teacher' | 'admin';

const LoginPageContent = () => {
  const { t, language, dir } = useLanguage();
  const { login: authLogin } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('student');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [logoUrl, setLogoUrl] = useState('');

  useEffect(() => {
    supabase.from('settings').select('logoUrl').eq('id', 'school').single()
      .then(({ data }) => { if (data?.logoUrl) setLogoUrl(data.logoUrl); })
      .catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({ email, password });
      if (authError) throw authError;

      const { data: userData, error: dbError } = await supabase
        .from('users').select('*').eq('id', authData.user.id).single();

      if (dbError || !userData) {
        await supabase.auth.signOut();
        setError(language === 'ar' ? 'لم يتم العثور على بيانات المستخدم' : language === 'fr' ? 'Données utilisateur introuvables' : 'User data not found');
        return;
      }

      const actualRole = userData.role as UserRole;

      if (actualRole !== role) {
        const roleNames: Record<string, { ar: string; fr: string; en: string }> = {
          student: { ar: 'طالب', fr: 'étudiant', en: 'student' },
          teacher: { ar: 'معلم', fr: 'enseignant', en: 'teacher' },
          admin: { ar: 'مدير', fr: 'administrateur', en: 'admin' },
        };
        const names = roleNames[actualRole] || { ar: actualRole, fr: actualRole, en: actualRole };
        setError(language === 'ar' ? `عذراً، أنت مسجل كـ ${names.ar}` : language === 'fr' ? `Vous êtes enregistré en tant que ${names.fr}` : `You are registered as a ${names.en}`);
        await supabase.auth.signOut();
        return;
      }

      authLogin(email, actualRole, authData.user.id, userData.fullName);
      if (actualRole === 'admin') navigate('/admin-dashboard');
      else if (actualRole === 'teacher') navigate('/teacher-dashboard');
      else navigate('/student-dashboard');

    } catch (err: any) {
      const msg = err?.message || '';
      if (msg.includes('Invalid login credentials') || msg.includes('invalid_credentials')) {
        setError(language === 'ar' ? 'البريد الإلكتروني أو كلمة المرور غير صحيحة' : language === 'fr' ? 'Email ou mot de passe incorrect' : 'Incorrect email or password');
      } else if (msg.includes('Email not confirmed')) {
        setError(language === 'ar' ? 'يرجى تأكيد بريدك الإلكتروني أولاً' : language === 'fr' ? 'Veuillez confirmer votre email' : 'Please confirm your email first');
      } else if (msg.includes('Too many requests')) {
        setError(language === 'ar' ? 'محاولات كثيرة. حاول لاحقاً' : language === 'fr' ? 'Trop de tentatives' : 'Too many attempts. Try later');
      } else {
        setError(language === 'ar' ? 'حدث خطأ أثناء تسجيل الدخول' : language === 'fr' ? 'Erreur lors de la connexion' : 'Login error occurred');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const roles: { id: UserRole; icon: typeof Car; label: string; color: string }[] = [
    { id: 'student',  icon: GraduationCap, label: language === 'ar' ? 'طالب' : language === 'fr' ? 'Étudiant' : 'Student',     color: '#4F8EF7' },
    { id: 'teacher',  icon: User,          label: language === 'ar' ? 'معلم' : language === 'fr' ? 'Moniteur' : 'Instructor',   color: '#F5A623' },
    { id: 'admin',    icon: Shield,        label: language === 'ar' ? 'مدير' : language === 'fr' ? 'Admin' : 'Admin',           color: '#10B981' },
  ];

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-darkest)', color: 'var(--text-primary)' }} dir={dir}>
      <Navbar />

      {/* Background effects */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
        <div style={{ position: 'absolute', top: '10%', left: '5%', width: 500, height: 500, background: 'radial-gradient(circle, rgba(245,166,35,0.08) 0%, transparent 70%)', borderRadius: '50%' }} />
        <div style={{ position: 'absolute', bottom: '10%', right: '5%', width: 400, height: 400, background: 'radial-gradient(circle, rgba(79,142,247,0.06) 0%, transparent 70%)', borderRadius: '50%' }} />
      </div>

      <main style={{
        position: 'relative', zIndex: 1,
        minHeight: '100vh',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '100px 1.5rem 3rem',
      }}>
        <div style={{ width: '100%', maxWidth: 460 }}>

          {/* Logo */}
          <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              width: 64, height: 64,
              background: 'var(--grad-gold)',
              borderRadius: 'var(--radius-lg)',
              boxShadow: '0 0 40px rgba(245,166,35,0.4)',
              marginBottom: '1rem',
              color: '#000',
            }}>
              {logoUrl
                ? <img src={logoUrl} alt="logo" style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: 'var(--radius-md)' }} />
                : <Car size={28} />
              }
            </div>
            <h1 style={{ fontSize: '1.625rem', fontWeight: 800, color: 'var(--text-white)', marginBottom: 6 }}>
              {t('auth.login.title')}
            </h1>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
              {language === 'ar' ? 'مرحباً بك مجدداً' : language === 'fr' ? 'Bienvenue de retour' : 'Welcome back'}
            </p>
          </div>

          {/* Card */}
          <div style={{
            background: 'var(--grad-card)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-xl)',
            padding: '2rem',
            boxShadow: 'var(--shadow-lg)',
          }}>

            {/* Error */}
            {error && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '12px 16px',
                background: 'rgba(239,68,68,0.08)',
                border: '1px solid rgba(239,68,68,0.25)',
                borderRadius: 'var(--radius-md)',
                color: '#FCA5A5',
                fontSize: '0.875rem',
                marginBottom: '1.5rem',
              }}>
                <AlertCircle size={16} style={{ flexShrink: 0 }} />
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>

              {/* Role Selection */}
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 10, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                  {t('auth.selectRole')}
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                  {roles.map(r => {
                    const Icon = r.icon;
                    const selected = role === r.id;
                    return (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => setRole(r.id)}
                        style={{
                          padding: '12px 8px',
                          background: selected ? `${r.color}18` : 'rgba(255,255,255,0.03)',
                          border: `1.5px solid ${selected ? r.color : 'var(--border)'}`,
                          borderRadius: 'var(--radius-md)',
                          color: selected ? r.color : 'var(--text-muted)',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                          boxShadow: selected ? `0 0 16px ${r.color}30` : 'none',
                        }}
                      >
                        <Icon size={20} />
                        <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>{r.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Email */}
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8 }}>
                  {t('auth.login.email')}
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="example@email.com"
                  required
                  dir="ltr"
                  className="input-pro"
                  style={{ fontFamily: 'inherit' }}
                />
              </div>

              {/* Password */}
              <div style={{ marginBottom: '0.75rem' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8 }}>
                  {t('auth.login.password')}
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    dir="ltr"
                    className="input-pro"
                    style={{ paddingRight: 44, fontFamily: 'inherit' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute',
                      right: 12, top: '50%', transform: 'translateY(-50%)',
                      background: 'none', border: 'none', cursor: 'pointer',
                      color: 'var(--text-muted)', padding: 0,
                    }}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Forgot */}
              <div style={{ textAlign: 'right', marginBottom: '1.5rem' }}>
                <a
                  href="mailto:support@mydrive.com?subject=Password Reset Request"
                  style={{ fontSize: '0.8125rem', color: 'var(--primary)', textDecoration: 'none', fontWeight: 500, display: 'inline-flex', alignItems: 'center', gap: 4 }}
                >
                  <KeyRound size={13} />
                  {t('auth.login.forgot')}
                </a>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={isLoading}
                className="btn-primary"
                style={{ width: '100%', justifyContent: 'center', padding: '14px', fontSize: '0.9375rem', opacity: isLoading ? 0.7 : 1, cursor: isLoading ? 'not-allowed' : 'pointer' }}
              >
                {isLoading ? (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ width: 18, height: 18, border: '2px solid rgba(0,0,0,0.3)', borderTopColor: '#000', borderRadius: '50%', animation: 'spin-slow 0.6s linear infinite', display: 'inline-block' }} />
                    {language === 'ar' ? 'جارٍ الدخول...' : language === 'fr' ? 'Connexion...' : 'Logging in...'}
                  </span>
                ) : t('auth.login.submit')}
              </button>
            </form>

            {/* Footer */}
            <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
              {t('auth.login.noAccount')}{' '}
              <Link to="/register" style={{ color: 'var(--primary)', fontWeight: 600, textDecoration: 'none' }}>
                {t('nav.register')}
              </Link>
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

const Login = () => (
  <LanguageProvider>
    <LoginPageContent />
  </LanguageProvider>
);

export default Login;
