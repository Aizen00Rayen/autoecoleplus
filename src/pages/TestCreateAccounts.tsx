import { useState } from 'react';
import { LanguageProvider, useLanguage } from '../contexts/LanguageContext';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { supabase, BACKEND_URL } from '../supabase';
import { User, Shield, Check, X, AlertCircle, Trash2, Users, GraduationCap, MessageSquare } from 'lucide-react';
import '../components/style/theme.css';

type UserRole = 'student' | 'teacher' | 'admin';

const fieldLabel = (ar: string, fr: string, en: string, language: string) =>
  language === 'ar' ? ar : language === 'fr' ? fr : en;

const FormField = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div style={{ marginBottom: '1.25rem' }}>
    <label style={{
      display: 'block', fontSize: '0.8125rem', fontWeight: 600,
      color: 'var(--text-secondary)', marginBottom: '6px',
      letterSpacing: '0.04em', textTransform: 'uppercase',
    }}>{label}</label>
    {children}
  </div>
);

const TestCreateAccountsContent = () => {
  const { language } = useLanguage();
  const [teacherData, setTeacherData] = useState({
    name: '', email: '', password: '', phone: '',
    licenseType: 'B' as 'A' | 'B' | 'C' | 'D'
  });
  const [adminData, setAdminData] = useState({ name: '', email: '', password: '', phone: '' });
  const [teacherLoading, setTeacherLoading] = useState(false);
  const [adminLoading, setAdminLoading] = useState(false);
  const [teacherMessage, setTeacherMessage] = useState('');
  const [adminMessage, setAdminMessage] = useState('');
  const [teacherError, setTeacherError] = useState('');
  const [adminError, setAdminError] = useState('');
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);
  const [deleteMessage, setDeleteMessage] = useState('');
  const [deleteError, setDeleteError] = useState('');

  const createAccount = async (
    data: { name: string; email: string; password: string; phone: string; licenseType?: 'A' | 'B' | 'C' | 'D' },
    role: UserRole,
    setLoading: (v: boolean) => void,
    setMessage: (v: string) => void,
    setError: (v: string) => void
  ) => {
    setLoading(true); setMessage(''); setError('');
    try {
      const userData: any = {
        fullName: data.name, email: data.email, phone: data.phone, role,
        createdAt: new Date().toISOString(), updatedAt: new Date().toISOString()
      };
      if (role === 'teacher' && 'licenseType' in data) userData.licenseType = data.licenseType;

      const response = await fetch(`${BACKEND_URL}/admin/create-user`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: data.email, password: data.password, userData })
      });
      if (!response.ok) { const err = await response.json(); throw new Error(err.error || 'Failed to create account'); }

      setMessage(fieldLabel(
        `تم إنشاء حساب ${role === 'teacher' ? 'المعلم' : 'المدير'} بنجاح!`,
        `Compte ${role === 'teacher' ? 'enseignant' : 'administrateur'} créé avec succès!`,
        `${role === 'teacher' ? 'Teacher' : 'Admin'} account created successfully!`,
        language
      ));
    } catch (error: any) {
      const msg = error.message || '';
      setError(msg.includes('already')
        ? fieldLabel('البريد الإلكتروني مستخدم بالفعل', 'Email déjà utilisé', 'Email already in use', language)
        : fieldLabel('حدث خطأ أثناء إنشاء الحساب', 'Erreur lors de la création', 'Error creating account', language)
      );
    } finally { setLoading(false); }
  };

  const handleCreateTeacher = (e: React.FormEvent) => {
    e.preventDefault();
    createAccount(teacherData, 'teacher', setTeacherLoading, setTeacherMessage, setTeacherError);
  };

  const handleCreateAdmin = (e: React.FormEvent) => {
    e.preventDefault();
    createAccount(adminData, 'admin', setAdminLoading, setAdminMessage, setAdminError);
  };

  const deleteAllCollection = async (collectionName: string) => {
    setDeleteLoading(collectionName); setDeleteMessage(''); setDeleteError('');
    try {
      const { data: rows } = await supabase.from(collectionName).select('id');
      const ids = (rows || []).map((r: any) => r.id);
      if (ids.length > 0) await supabase.from(collectionName).delete().in('id', ids);
      setDeleteMessage(fieldLabel(
        `تم حذف جميع بيانات ${collectionName} بنجاح!`,
        `Toutes les données ${collectionName} supprimées!`,
        `All ${collectionName} deleted successfully!`,
        language
      ));
    } catch {
      setDeleteError(fieldLabel(`خطأ في حذف ${collectionName}`, `Erreur suppression ${collectionName}`, `Error deleting ${collectionName}`, language));
    } finally { setDeleteLoading(null); }
  };

  const deleteTestScores = async () => {
    setDeleteLoading('testScores'); setDeleteMessage(''); setDeleteError('');
    try {
      await supabase.from('users').update({ testScore: null, lastTestDate: null }).neq('id', '');
      setDeleteMessage(fieldLabel('تم حذف جميع نسب الاختبارات!', 'Scores supprimés!', 'All test scores deleted!', language));
    } catch {
      setDeleteError(fieldLabel('خطأ في حذف النسب', 'Erreur suppression scores', 'Error deleting test scores', language));
    } finally { setDeleteLoading(null); }
  };

  const Spinner = () => (
    <div style={{ width: 18, height: 18, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite', display: 'inline-block' }} />
  );

  const Alert = ({ type, message }: { type: 'success' | 'error'; message: string }) => (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '12px 16px',
      background: type === 'success' ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)',
      border: `1px solid ${type === 'success' ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`,
      borderRadius: 'var(--radius-md)', marginBottom: '1.25rem',
      color: type === 'success' ? '#34D399' : '#FCA5A5',
      fontSize: '0.875rem', fontWeight: 500,
    }}>
      {type === 'success' ? <Check size={16} style={{ flexShrink: 0 }} /> : <X size={16} style={{ flexShrink: 0 }} />}
      {message}
    </div>
  );

  const cardStyle = {
    background: 'var(--grad-card)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-xl)',
    overflow: 'hidden',
    transition: 'border-color 0.3s ease',
  };

  const cardHeaderStyle = (color: string) => ({
    padding: '1.75rem 2rem',
    background: `${color}12`,
    borderBottom: `1px solid ${color}30`,
    position: 'relative' as const,
    overflow: 'hidden' as const,
  });

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-darkest)', color: 'var(--text-primary)' }}>
      <Navbar />

      {/* Background glow */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
        <div style={{ position: 'absolute', top: '20%', left: '10%', width: 500, height: 500, background: 'radial-gradient(circle, rgba(245,166,35,0.07) 0%, transparent 70%)', borderRadius: '50%' }} />
        <div style={{ position: 'absolute', bottom: '10%', right: '5%', width: 400, height: 400, background: 'radial-gradient(circle, rgba(79,142,247,0.05) 0%, transparent 70%)', borderRadius: '50%' }} />
      </div>

      <main style={{ position: 'relative', zIndex: 1, padding: '100px 1.5rem 3rem', maxWidth: 1200, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <div className="section-label" style={{ display: 'inline-flex', marginBottom: '1rem' }}>
            <AlertCircle size={13} />
            {fieldLabel('صفحة اختبار', 'Page de test', 'Test Page', language)}
          </div>
          <h1 style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 800, color: 'var(--text-white)', marginBottom: '0.75rem' }}>
            {fieldLabel('إنشاء حسابات الاختبار', 'Créer des comptes de test', 'Create Test Accounts', language)}
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', maxWidth: 560, margin: '0 auto' }}>
            {fieldLabel('إنشاء حسابات معلمين ومديرين للاختبار', 'Créer des comptes enseignants et administrateurs', 'Create teacher and admin accounts for testing', language)}
          </p>
        </div>

        {/* Delete Section */}
        <div style={{ ...cardStyle, marginBottom: '2.5rem' }}
          onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(245,158,11,0.4)'}
          onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--border)'}
        >
          <div style={cardHeaderStyle('#F59E0B')}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ width: 48, height: 48, borderRadius: 'var(--radius-md)', background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#F59E0B', flexShrink: 0 }}>
                <Trash2 size={22} />
              </div>
              <div>
                <h2 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-white)', margin: 0 }}>
                  {fieldLabel('حذف البيانات', 'Supprimer les données', 'Delete Data', language)}
                </h2>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', margin: 0 }}>
                  {fieldLabel('حذف جميع البيانات من قاعدة البيانات', 'Supprimer toutes les données', 'Delete all data from database', language)}
                </p>
              </div>
            </div>
          </div>

          <div style={{ padding: '2rem' }}>
            {deleteMessage && <Alert type="success" message={deleteMessage} />}
            {deleteError && <Alert type="error" message={deleteError} />}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
              {[
                { key: 'users', Icon: Users, label: fieldLabel('حذف المستخدمين', 'Supprimer utilisateurs', 'Delete Users', language) },
                { key: 'sessions', Icon: GraduationCap, label: fieldLabel('حذف الحصص', 'Supprimer sessions', 'Delete Sessions', language) },
                { key: 'messages', Icon: MessageSquare, label: fieldLabel('حذف الرسائل', 'Supprimer messages', 'Delete Messages', language) },
              ].map(({ key, Icon, label }) => (
                <button
                  key={key}
                  onClick={() => deleteAllCollection(key)}
                  disabled={deleteLoading !== null}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    padding: '12px 16px',
                    background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)',
                    borderRadius: 'var(--radius-md)', color: '#FCA5A5',
                    cursor: deleteLoading !== null ? 'not-allowed' : 'pointer',
                    opacity: deleteLoading !== null && deleteLoading !== key ? 0.5 : 1,
                    fontSize: '0.875rem', fontWeight: 600, transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={e => { if (!deleteLoading) { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(239,68,68,0.15)'; (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(239,68,68,0.5)'; } }}
                  onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(239,68,68,0.08)'; (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(239,68,68,0.25)'; }}
                >
                  {deleteLoading === key ? <Spinner /> : <Icon size={16} />}
                  {label}
                </button>
              ))}
              <button
                onClick={deleteTestScores}
                disabled={deleteLoading !== null}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  padding: '12px 16px',
                  background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)',
                  borderRadius: 'var(--radius-md)', color: '#FCD34D',
                  cursor: deleteLoading !== null ? 'not-allowed' : 'pointer',
                  opacity: deleteLoading !== null && deleteLoading !== 'testScores' ? 0.5 : 1,
                  fontSize: '0.875rem', fontWeight: 600, transition: 'all 0.2s ease',
                }}
              >
                {deleteLoading === 'testScores' ? <Spinner /> : <Shield size={16} />}
                {fieldLabel('حذف نسب الاختبارات', 'Supprimer scores', 'Delete Test Scores', language)}
              </button>
            </div>
          </div>
        </div>

        {/* Create Accounts Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '2rem' }}>

          {/* Teacher Card */}
          <div style={cardStyle}
            onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(79,142,247,0.4)'}
            onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--border)'}
          >
            <div style={cardHeaderStyle('#4F8EF7')}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ width: 48, height: 48, borderRadius: 'var(--radius-md)', background: 'rgba(79,142,247,0.15)', border: '1px solid rgba(79,142,247,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4F8EF7', flexShrink: 0 }}>
                  <User size={22} />
                </div>
                <div>
                  <h2 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-white)', margin: 0 }}>
                    {fieldLabel('إنشاء حساب معلم', 'Créer compte enseignant', 'Create Teacher Account', language)}
                  </h2>
                  <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', margin: 0 }}>
                    {fieldLabel('أدخل بيانات المعلم الجديد', 'Données du nouvel enseignant', 'Enter new teacher data', language)}
                  </p>
                </div>
              </div>
            </div>

            <div style={{ padding: '2rem' }}>
              {teacherMessage && <Alert type="success" message={teacherMessage} />}
              {teacherError && <Alert type="error" message={teacherError} />}

              <form onSubmit={handleCreateTeacher}>
                <FormField label={fieldLabel('الاسم الكامل', 'Nom complet', 'Full Name', language)}>
                  <input className="input-pro" value={teacherData.name} onChange={e => setTeacherData({ ...teacherData, name: e.target.value })} required placeholder={fieldLabel('محمد أحمد', 'Jean Dupont', 'John Doe', language)} />
                </FormField>
                <FormField label={fieldLabel('البريد الإلكتروني', 'Email', 'Email', language)}>
                  <input className="input-pro" type="email" dir="ltr" value={teacherData.email} onChange={e => setTeacherData({ ...teacherData, email: e.target.value })} required placeholder="teacher@example.com" />
                </FormField>
                <FormField label={fieldLabel('كلمة المرور', 'Mot de passe', 'Password', language)}>
                  <input className="input-pro" type="password" dir="ltr" value={teacherData.password} onChange={e => setTeacherData({ ...teacherData, password: e.target.value })} required placeholder="••••••••" />
                </FormField>
                <FormField label={fieldLabel('رقم الهاتف', 'Téléphone', 'Phone', language)}>
                  <input className="input-pro" type="tel" dir="ltr" value={teacherData.phone} onChange={e => setTeacherData({ ...teacherData, phone: e.target.value })} required placeholder="+213 555 123 456" />
                </FormField>
                <FormField label={fieldLabel('نوع الرخصة', 'Type de permis', 'License Type', language)}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8 }}>
                    {(['A', 'B', 'C', 'D'] as const).map(type => {
                      const sel = teacherData.licenseType === type;
                      return (
                        <button key={type} type="button" onClick={() => setTeacherData({ ...teacherData, licenseType: type })} style={{
                          padding: '10px', borderRadius: 'var(--radius-md)',
                          border: `1.5px solid ${sel ? '#4F8EF7' : 'var(--border)'}`,
                          background: sel ? 'rgba(79,142,247,0.12)' : 'transparent',
                          color: sel ? '#4F8EF7' : 'var(--text-muted)',
                          fontWeight: 700, fontSize: '1rem', cursor: 'pointer',
                          transition: 'all 0.2s ease',
                        }}>{type}</button>
                      );
                    })}
                  </div>
                </FormField>

                <button type="submit" disabled={teacherLoading} className="btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: '0.5rem', opacity: teacherLoading ? 0.7 : 1, cursor: teacherLoading ? 'not-allowed' : 'pointer' }}>
                  {teacherLoading ? <><Spinner /> {fieldLabel('جاري الإنشاء...', 'Création...', 'Creating...', language)}</> : fieldLabel('إنشاء حساب معلم', 'Créer compte enseignant', 'Create Teacher Account', language)}
                </button>
              </form>
            </div>
          </div>

          {/* Admin Card */}
          <div style={cardStyle}
            onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(16,185,129,0.4)'}
            onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--border)'}
          >
            <div style={cardHeaderStyle('#10B981')}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ width: 48, height: 48, borderRadius: 'var(--radius-md)', background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10B981', flexShrink: 0 }}>
                  <Shield size={22} />
                </div>
                <div>
                  <h2 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-white)', margin: 0 }}>
                    {fieldLabel('إنشاء حساب مدير', 'Créer compte administrateur', 'Create Admin Account', language)}
                  </h2>
                  <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', margin: 0 }}>
                    {fieldLabel('أدخل بيانات المدير الجديد', 'Données du nouvel administrateur', 'Enter new admin data', language)}
                  </p>
                </div>
              </div>
            </div>

            <div style={{ padding: '2rem' }}>
              {adminMessage && <Alert type="success" message={adminMessage} />}
              {adminError && <Alert type="error" message={adminError} />}

              <form onSubmit={handleCreateAdmin}>
                <FormField label={fieldLabel('الاسم الكامل', 'Nom complet', 'Full Name', language)}>
                  <input className="input-pro" value={adminData.name} onChange={e => setAdminData({ ...adminData, name: e.target.value })} required placeholder={fieldLabel('علي حسن', 'Pierre Martin', 'Admin User', language)} />
                </FormField>
                <FormField label={fieldLabel('البريد الإلكتروني', 'Email', 'Email', language)}>
                  <input className="input-pro" type="email" dir="ltr" value={adminData.email} onChange={e => setAdminData({ ...adminData, email: e.target.value })} required placeholder="admin@example.com" />
                </FormField>
                <FormField label={fieldLabel('كلمة المرور', 'Mot de passe', 'Password', language)}>
                  <input className="input-pro" type="password" dir="ltr" value={adminData.password} onChange={e => setAdminData({ ...adminData, password: e.target.value })} required placeholder="••••••••" />
                </FormField>
                <FormField label={fieldLabel('رقم الهاتف', 'Téléphone', 'Phone', language)}>
                  <input className="input-pro" type="tel" dir="ltr" value={adminData.phone} onChange={e => setAdminData({ ...adminData, phone: e.target.value })} required placeholder="+213 555 123 456" />
                </FormField>

                <button type="submit" disabled={adminLoading} className="btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: '1rem', background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)', opacity: adminLoading ? 0.7 : 1, cursor: adminLoading ? 'not-allowed' : 'pointer' }}>
                  {adminLoading ? <><Spinner /> {fieldLabel('جاري الإنشاء...', 'Création...', 'Creating...', language)}</> : fieldLabel('إنشاء حساب مدير', 'Créer compte administrateur', 'Create Admin Account', language)}
                </button>
              </form>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

const TestCreateAccounts = () => (
  <LanguageProvider>
    <TestCreateAccountsContent />
  </LanguageProvider>
);

export default TestCreateAccounts;
