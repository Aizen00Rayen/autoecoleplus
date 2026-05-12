import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { LanguageProvider } from '../contexts/LanguageContext';
import {
  Car, Eye, EyeOff, Bike, Truck, Check, X, User, Calendar, Clock, Loader2,
  AlertCircle, ChevronDown, ChevronUp
} from 'lucide-react';
import { supabase, BACKEND_URL } from '../supabase';
import { useAuth } from '../contexts/AuthContext';
import '../components/style/theme.css';

type LicenseType = 'A' | 'B' | 'C';

interface Teacher {
  id: string;
  fullName: string;
  name: string;
  email: string;
  phone: string;
  licenseType: string;
  photoURL?: string;
  workDays?: string[];
  workHours?: { start: string; end: string };
}

const licenseIcons = { A: Bike, B: Car, C: Truck };

const RegisterPageContent = () => {
  const { t, language, dir } = useLanguage();
  const { login: authLogin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [formData, setFormData] = useState({
    fullName: '', phone: '', email: '', password: '', confirmPassword: '',
    licenseType: '' as LicenseType | '', teacherId: '', teacherName: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [passwordStrength, setPasswordStrength] = useState<'weak' | 'medium' | 'strong'>('weak');
  const [passwordFulfilledRequirements, setPasswordFulfilledRequirements] = useState({
    minLength: false, hasUppercase: false, hasLowercase: false, hasNumber: false, hasSpecialChar: false,
  });
  const [passwordsMatch, setPasswordsMatch] = useState<boolean | null>(null);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loadingTeachers, setLoadingTeachers] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState<string | null>(null);
  const [licenseOpen, setLicenseOpen] = useState(false);

  useEffect(() => {
    supabase.from('settings').select('logoUrl').eq('id', 'school').single()
      .then(({ data }) => { if (data?.logoUrl) setLogoUrl(data.logoUrl); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (location.state?.selectedTeacher) {
      setFormData(prev => ({
        ...prev,
        teacherId: location.state.selectedTeacher.id,
        teacherName: location.state.selectedTeacher.name,
      }));
    }
  }, [location.state]);

  useEffect(() => {
    if (formData.licenseType) {
      fetchTeachers();
    } else {
      setTeachers([]);
      setSelectedTeacher(null);
      setFormData(prev => ({ ...prev, teacherId: '', teacherName: '' }));
    }
  }, [formData.licenseType]);

  const fetchTeachers = async () => {
    if (!formData.licenseType) return;
    try {
      setLoadingTeachers(true);
      const { data, error } = await supabase.from('users').select('*').eq('role', 'teacher').eq('licenseType', formData.licenseType);
      if (!error && data) setTeachers(data.map(t => ({ ...t, name: t.fullName })));
    } catch (err) {
      console.error('Error fetching teachers:', err);
    } finally {
      setLoadingTeachers(false);
    }
  };

  const handleSelectTeacher = (teacherId: string) => {
    const teacher = teachers.find(t => t.id === teacherId);
    if (teacher) {
      setSelectedTeacher(teacherId);
      setFormData(prev => ({ ...prev, teacherId: teacher.id, teacherName: teacher.fullName || teacher.name }));
    }
  };

  const handleDeselectTeacher = () => {
    setSelectedTeacher(null);
    setFormData(prev => ({ ...prev, teacherId: '', teacherName: '' }));
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  useEffect(() => {
    const password = formData.password;
    const requirements = {
      minLength: password.length >= 8,
      hasUppercase: /[A-Z]/.test(password),
      hasLowercase: /[a-z]/.test(password),
      hasNumber: /[0-9]/.test(password),
      hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    };
    setPasswordFulfilledRequirements(requirements);
    const count = Object.values(requirements).filter(Boolean).length;
    setPasswordStrength(count <= 2 ? 'weak' : count <= 4 ? 'medium' : 'strong');
    if (formData.confirmPassword.length > 0) {
      setPasswordsMatch(password === formData.confirmPassword);
    } else {
      setPasswordsMatch(null);
    }
  }, [formData.password, formData.confirmPassword]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (formData.password.length < 8) {
      setError(language === 'ar' ? 'كلمة المرور يجب أن تكون 8 أحرف على الأقل' : language === 'fr' ? 'Le mot de passe doit comporter au moins 8 caractères' : 'Password must be at least 8 characters');
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError(language === 'ar' ? 'كلمتا المرور غير متطابقتين' : language === 'fr' ? 'Les mots de passe ne correspondent pas' : 'Passwords do not match');
      return;
    }
    if (!formData.licenseType) {
      setError(language === 'ar' ? 'الرجاء اختيار نوع الرخصة' : language === 'fr' ? 'Veuillez choisir le type de permis' : 'Please choose a license type');
      return;
    }
    setIsLoading(true);
    try {
      const response = await fetch(`${BACKEND_URL}/admin/create-user`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          userData: {
            fullName: formData.fullName,
            email: formData.email,
            phone: formData.phone,
            licenseType: formData.licenseType,
            ...(formData.teacherId && { teacherId: formData.teacherId }),
            ...(formData.teacherName && { teacherName: formData.teacherName }),
            role: 'student',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(result.error || result.message || 'Error creating account');
      }
      // Auto sign-in after account creation
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });
      if (signInError) throw signInError;
      // Set auth context so ProtectedRoute and dashboard know who the user is
      authLogin(formData.email, 'student', signInData.user.id, formData.fullName);
      navigate('/student-dashboard');
    } catch (err: any) {
      console.error('Register error:', err);
      const msg = err?.message || '';
      if (msg.includes('already registered') || msg.includes('already been registered') || msg.includes('already exists')) {
        setError(language === 'ar' ? 'البريد الإلكتروني مستخدم بالفعل' : language === 'fr' ? 'Email déjà utilisé' : 'Email already in use');
      } else if (msg.includes('invalid') && msg.includes('email')) {
        setError(language === 'ar' ? 'البريد الإلكتروني غير صالح' : language === 'fr' ? 'Email invalide' : 'Invalid email');
      } else if (msg.includes('weak') || msg.includes('password')) {
        setError(language === 'ar' ? 'كلمة المرور ضعيفة جداً' : language === 'fr' ? 'Mot de passe trop faible' : 'Password is too weak');
      } else if (msg.includes('fetch') || msg.includes('network') || msg.includes('Failed')) {
        setError(language === 'ar' ? 'لا يمكن الاتصال بالخادم، تأكد من تشغيل الخادم' : language === 'fr' ? 'Impossible de contacter le serveur' : 'Cannot reach server — make sure the backend is running');
      } else {
        setError(language === 'ar' ? 'حدث خطأ أثناء إنشاء الحساب' : language === 'fr' ? 'Erreur lors de la création du compte' : 'Error creating account');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const getPasswordStrengthText = () => {
    if (language === 'ar') return passwordStrength === 'weak' ? 'ضعيفة' : passwordStrength === 'medium' ? 'متوسطة' : 'قوية';
    if (language === 'fr') return passwordStrength === 'weak' ? 'Faible' : passwordStrength === 'medium' ? 'Moyenne' : 'Forte';
    return passwordStrength === 'weak' ? 'Weak' : passwordStrength === 'medium' ? 'Medium' : 'Strong';
  };

  const strengthColors = { weak: '#EF4444', medium: '#F59E0B', strong: '#10B981' };
  const strengthWidths = { weak: '33%', medium: '66%', strong: '100%' };

  const getDayName = (day: string) => {
    const dayNames = {
      ar: { sunday: 'الأحد', monday: 'الاثنين', tuesday: 'الثلاثاء', wednesday: 'الأربعاء', thursday: 'الخميس', friday: 'الجمعة', saturday: 'السبت' },
      fr: { sunday: 'Dim', monday: 'Lun', tuesday: 'Mar', wednesday: 'Mer', thursday: 'Jeu', friday: 'Ven', saturday: 'Sam' },
      en: { sunday: 'Sun', monday: 'Mon', tuesday: 'Tue', wednesday: 'Wed', thursday: 'Thu', friday: 'Fri', saturday: 'Sat' },
    };
    return (dayNames[language as keyof typeof dayNames] || dayNames.en)[day as keyof typeof dayNames.en] || day;
  };

  const licenseOptions = [
    { value: 'B' as LicenseType, Icon: Car,   label: language === 'ar' ? 'رخصة B — سيارة'   : language === 'fr' ? 'Permis B — Voiture'   : 'License B — Car' },
    { value: 'A' as LicenseType, Icon: Bike,  label: language === 'ar' ? 'رخصة A — دراجة'   : language === 'fr' ? 'Permis A — Moto'      : 'License A — Motorcycle' },
    { value: 'C' as LicenseType, Icon: Truck, label: language === 'ar' ? 'رخصة C — شاحنة'   : language === 'fr' ? 'Permis C — Camion'    : 'License C — Truck' },
  ];
  const selectedLicense = licenseOptions.find(l => l.value === formData.licenseType);

  const fieldStyle = { marginBottom: '1.25rem' };
  const labelStyle: React.CSSProperties = { display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8, letterSpacing: '0.03em' };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-darkest)', color: 'var(--text-primary)' }} dir={dir}>
      <Navbar />

      {/* Background glow */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
        <div style={{ position: 'absolute', top: '10%', right: '10%', width: 500, height: 500, background: 'radial-gradient(circle, rgba(245,166,35,0.07) 0%, transparent 70%)', borderRadius: '50%' }} />
        <div style={{ position: 'absolute', bottom: '5%', left: '5%', width: 400, height: 400, background: 'radial-gradient(circle, rgba(79,142,247,0.05) 0%, transparent 70%)', borderRadius: '50%' }} />
      </div>

      <main style={{ position: 'relative', zIndex: 1, padding: '100px 1.5rem 4rem', display: 'flex', justifyContent: 'center' }}>
        <div style={{ width: '100%', maxWidth: 520 }}>

          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              width: 60, height: 60, background: 'var(--grad-gold)',
              borderRadius: 'var(--radius-lg)', boxShadow: '0 0 32px rgba(245,166,35,0.4)',
              marginBottom: '1rem', color: '#000',
            }}>
              {logoUrl
                ? <img src={logoUrl} alt="logo" style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: 'var(--radius-md)' }} />
                : <Car size={26} />
              }
            </div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-white)', marginBottom: 6 }}>
              {t('auth.register.title')}
            </h1>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
              {language === 'ar' ? 'أنشئ حسابك وابدأ رحلتك' : language === 'fr' ? 'Créez votre compte et commencez' : 'Create your account and start your journey'}
            </p>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 10,
              padding: '4px 12px', borderRadius: 20,
              background: 'rgba(245,166,35,0.1)', border: '1px solid rgba(245,166,35,0.3)',
              fontSize: '0.75rem', fontWeight: 600, color: 'var(--primary)',
            }}>
              <User size={12} />
              {language === 'ar' ? 'تسجيل الطلاب فقط — المعلمون يُضافون من قِبَل المدير' : language === 'fr' ? 'Inscription étudiants uniquement — Les enseignants sont ajoutés par l\'admin' : 'Students only — Teachers are added by the admin'}
            </div>
          </div>

          {/* Form Card */}
          <div style={{
            background: 'var(--grad-card)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-xl)',
            padding: '2rem',
            boxShadow: 'var(--shadow-lg)',
          }}>

            {error && (
              <div style={{
                display: 'flex', alignItems: 'flex-start', gap: 10, padding: '12px 16px',
                background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)',
                borderRadius: 'var(--radius-md)', color: '#FCA5A5', fontSize: '0.875rem', marginBottom: '1.5rem',
              }}>
                <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>

              {/* Full Name */}
              <div style={fieldStyle}>
                <label style={labelStyle}>{t('auth.register.fullName')} *</label>
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={e => handleChange('fullName', e.target.value)}
                  placeholder={language === 'ar' ? 'محمد أحمد' : language === 'fr' ? 'Jean Dupont' : 'John Doe'}
                  required
                  className="input-pro"
                  style={{ fontFamily: 'inherit' }}
                />
              </div>

              {/* Phone */}
              <div style={fieldStyle}>
                <label style={labelStyle}>{t('auth.register.phone')} *</label>
                <input type="tel" value={formData.phone} onChange={e => handleChange('phone', e.target.value)}
                  placeholder="+213 555 123 456" required dir="ltr" className="input-pro" style={{ fontFamily: 'inherit' }} />
              </div>

              {/* Email */}
              <div style={fieldStyle}>
                <label style={labelStyle}>{t('auth.register.email')} *</label>
                <input type="email" value={formData.email} onChange={e => handleChange('email', e.target.value)}
                  placeholder="example@email.com" required dir="ltr" className="input-pro" style={{ fontFamily: 'inherit' }} />
              </div>

              {/* License Type */}
              <div style={{ ...fieldStyle, position: 'relative' }}>
                <label style={labelStyle}>{t('auth.register.licenseType')} *</label>
                <button
                  type="button"
                  onClick={() => setLicenseOpen(!licenseOpen)}
                  style={{
                    width: '100%', padding: '12px 16px',
                    background: 'var(--bg-mid)', border: '1.5px solid var(--border)',
                    borderRadius: 'var(--radius-md)', color: formData.licenseType ? 'var(--text-primary)' : 'var(--text-muted)',
                    fontSize: '0.9375rem', cursor: 'pointer', display: 'flex', alignItems: 'center',
                    justifyContent: 'space-between', fontFamily: 'inherit', transition: 'all 0.2s ease',
                  }}
                >
                  {selectedLicense ? (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <selectedLicense.Icon size={16} style={{ color: 'var(--primary)' }} />
                      {selectedLicense.label}
                    </span>
                  ) : (
                    <span>{language === 'ar' ? 'اختر نوع الرخصة' : language === 'fr' ? 'Choisir le type de permis' : 'Choose license type'}</span>
                  )}
                  {licenseOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
                {licenseOpen && (
                  <div style={{
                    position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, zIndex: 50,
                    background: 'var(--bg-card)', border: '1px solid var(--border-gold)',
                    borderRadius: 'var(--radius-md)', overflow: 'hidden', boxShadow: 'var(--shadow-lg)',
                  }}>
                    {licenseOptions.map(opt => (
                      <div
                        key={opt.value}
                        onClick={() => { handleChange('licenseType', opt.value); setLicenseOpen(false); }}
                        style={{
                          padding: '12px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10,
                          background: formData.licenseType === opt.value ? 'rgba(245,166,35,0.08)' : 'transparent',
                          color: formData.licenseType === opt.value ? 'var(--primary)' : 'var(--text-primary)',
                          transition: 'background 0.15s ease',
                          fontSize: '0.9rem',
                        }}
                        onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = 'rgba(245,166,35,0.06)'; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = formData.licenseType === opt.value ? 'rgba(245,166,35,0.08)' : 'transparent'; }}
                      >
                        <opt.Icon size={16} />
                        {opt.label}
                        {formData.licenseType === opt.value && <Check size={14} style={{ marginLeft: 'auto', color: 'var(--primary)' }} />}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Teacher Selection */}
              {formData.licenseType && (
                <div style={fieldStyle}>
                  <label style={labelStyle}>
                    {language === 'ar' ? 'المعلم (اختياري)' : language === 'fr' ? 'Enseignant (optionnel)' : 'Teacher (optional)'}
                  </label>
                  {loadingTeachers ? (
                    <div style={{ padding: '1.5rem', textAlign: 'center', background: 'var(--bg-mid)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                      <Loader2 size={22} style={{ color: 'var(--primary)', animation: 'spin-slow 0.8s linear infinite', margin: '0 auto' }} />
                      <p style={{ marginTop: 8, fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                        {language === 'ar' ? 'جاري تحميل...' : language === 'fr' ? 'Chargement...' : 'Loading...'}
                      </p>
                    </div>
                  ) : teachers.length === 0 ? (
                    <div style={{ padding: '1.25rem', textAlign: 'center', background: 'var(--bg-mid)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                      <User size={28} style={{ color: 'var(--text-muted)', margin: '0 auto' }} />
                      <p style={{ marginTop: 8, fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                        {language === 'ar' ? 'لا يوجد أساتذة متاحون' : language === 'fr' ? 'Aucun instructeur disponible' : 'No instructors available'}
                      </p>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {teachers.map(teacher => {
                        const isSelected = selectedTeacher === teacher.id;
                        return (
                          <div
                            key={teacher.id}
                            onClick={() => isSelected ? handleDeselectTeacher() : handleSelectTeacher(teacher.id)}
                            style={{
                              padding: '12px 14px', borderRadius: 'var(--radius-md)', cursor: 'pointer',
                              background: isSelected ? 'rgba(245,166,35,0.08)' : 'var(--bg-mid)',
                              border: `1.5px solid ${isSelected ? 'var(--primary)' : 'var(--border)'}`,
                              display: 'flex', alignItems: 'center', gap: 12,
                              transition: 'all 0.2s ease',
                            }}
                          >
                            <div style={{
                              width: 44, height: 44, borderRadius: '50%', flexShrink: 0, overflow: 'hidden',
                              background: teacher.photoURL ? `url(${teacher.photoURL}) center/cover` : 'var(--grad-gold)',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              color: '#000', fontWeight: 700, fontSize: '1.1rem',
                            }}>
                              {!teacher.photoURL && (teacher.fullName || teacher.name || '?').charAt(0)}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: '0.875rem', fontWeight: 600, color: isSelected ? 'var(--primary)' : 'var(--text-white)' }}>
                                {teacher.fullName || teacher.name}
                              </div>
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>
                                {teacher.email}
                              </div>
                              {teacher.workDays && teacher.workDays.length > 0 && (
                                <div style={{ display: 'flex', gap: 4, marginTop: 4, flexWrap: 'wrap' }}>
                                  {teacher.workDays.slice(0, 4).map(d => (
                                    <span key={d} style={{
                                      fontSize: '0.65rem', fontWeight: 600, padding: '1px 6px',
                                      background: 'rgba(245,166,35,0.1)', color: 'var(--primary)',
                                      borderRadius: 4, border: '1px solid var(--border-gold)',
                                    }}>
                                      {getDayName(d)}
                                    </span>
                                  ))}
                                  {teacher.workDays.length > 4 && <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>+{teacher.workDays.length - 4}</span>}
                                </div>
                              )}
                            </div>
                            {isSelected && (
                              <div style={{
                                width: 22, height: 22, borderRadius: '50%', background: 'var(--primary)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                              }}>
                                <Check size={12} color="#000" />
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Password */}
              <div style={fieldStyle}>
                <label style={labelStyle}>{t('auth.register.password')} *</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={e => handleChange('password', e.target.value)}
                    placeholder="••••••••" required dir="ltr"
                    className="input-pro"
                    style={{
                      paddingRight: 44, fontFamily: 'inherit',
                      borderColor: formData.password.length > 0 && formData.password.length < 8 ? 'rgba(239,68,68,0.5)' : undefined,
                    }}
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 0 }}>
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {formData.password.length > 0 && (
                  <div style={{ marginTop: 10 }}>
                    {/* Strength bar */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {language === 'ar' ? 'قوة كلمة المرور:' : language === 'fr' ? 'Force:' : 'Strength:'}
                      </span>
                      <span style={{ fontSize: '0.75rem', color: strengthColors[passwordStrength], fontWeight: 600 }}>
                        {getPasswordStrengthText()}
                      </span>
                    </div>
                    <div style={{ height: 4, background: 'var(--bg-mid)', borderRadius: 4, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: strengthWidths[passwordStrength], background: strengthColors[passwordStrength], borderRadius: 4, transition: 'all 0.3s ease' }} />
                    </div>
                    {/* Requirements */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 12px', marginTop: 8 }}>
                      {[
                        { key: 'minLength', text: language === 'ar' ? '8 أحرف' : language === 'fr' ? '8 caractères' : '8 characters' },
                        { key: 'hasUppercase', text: language === 'ar' ? 'حرف كبير' : language === 'fr' ? 'Majuscule' : 'Uppercase' },
                        { key: 'hasLowercase', text: language === 'ar' ? 'حرف صغير' : language === 'fr' ? 'Minuscule' : 'Lowercase' },
                        { key: 'hasNumber', text: language === 'ar' ? 'رقم' : language === 'fr' ? 'Chiffre' : 'Number' },
                        { key: 'hasSpecialChar', text: language === 'ar' ? 'رمز خاص' : language === 'fr' ? 'Caractère spécial' : 'Special char' },
                      ].map(req => {
                        const ok = passwordFulfilledRequirements[req.key as keyof typeof passwordFulfilledRequirements];
                        return (
                          <div key={req.key} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.75rem', color: ok ? '#34D399' : 'var(--text-muted)' }}>
                            {ok ? <Check size={11} /> : <X size={11} />}
                            {req.text}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Confirm Password */}
              <div style={fieldStyle}>
                <label style={labelStyle}>{t('auth.register.confirmPassword')} *</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={formData.confirmPassword}
                    onChange={e => handleChange('confirmPassword', e.target.value)}
                    placeholder="••••••••" required dir="ltr"
                    className="input-pro"
                    style={{
                      paddingRight: 44, fontFamily: 'inherit',
                      borderColor: passwordsMatch === false ? 'rgba(239,68,68,0.5)' : passwordsMatch === true ? 'rgba(16,185,129,0.5)' : undefined,
                    }}
                  />
                  <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 0 }}>
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {formData.confirmPassword.length > 0 && passwordsMatch !== null && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6, fontSize: '0.8125rem', color: passwordsMatch ? '#34D399' : '#FCA5A5' }}>
                    {passwordsMatch ? <Check size={13} /> : <X size={13} />}
                    {passwordsMatch
                      ? (language === 'ar' ? 'كلمات المرور متطابقة' : language === 'fr' ? 'Les mots de passe correspondent' : 'Passwords match')
                      : (language === 'ar' ? 'غير متطابقة' : language === 'fr' ? 'Ne correspondent pas' : 'Passwords do not match')}
                  </div>
                )}
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={isLoading || formData.password.length < 8 || !passwordsMatch || !formData.licenseType}
                className="btn-primary"
                style={{
                  width: '100%', justifyContent: 'center', padding: '14px',
                  fontSize: '0.9375rem', marginTop: '0.5rem',
                  opacity: (isLoading || formData.password.length < 8 || !passwordsMatch || !formData.licenseType) ? 0.6 : 1,
                  cursor: (isLoading || formData.password.length < 8 || !passwordsMatch || !formData.licenseType) ? 'not-allowed' : 'pointer',
                }}
              >
                {isLoading ? (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ width: 16, height: 16, border: '2px solid rgba(0,0,0,0.3)', borderTopColor: '#000', borderRadius: '50%', animation: 'spin-slow 0.6s linear infinite', display: 'inline-block' }} />
                    {language === 'ar' ? 'جارٍ الإنشاء...' : language === 'fr' ? 'Création...' : 'Creating...'}
                  </span>
                ) : t('auth.register.submit')}
              </button>
            </form>

            <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
              {t('auth.register.hasAccount')}{' '}
              <Link to="/login" style={{ color: 'var(--primary)', fontWeight: 600, textDecoration: 'none' }}>
                {t('nav.login')}
              </Link>
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

const Register = () => (
  <LanguageProvider>
    <RegisterPageContent />
  </LanguageProvider>
);

export default Register;
