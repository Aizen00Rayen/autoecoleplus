import { useState, useEffect, useRef } from 'react';
import { LanguageProvider, useLanguage } from '../contexts/LanguageContext';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { supabase } from '../supabase';
import {
  Settings, ArrowLeft, Save, Building2, Phone, Mail, MapPin, Globe,
  Clock, DollarSign, Check, AlertCircle, Loader2, ImagePlus, X,
  TrafficCone, Plus, Trash2, Eye, EyeOff, Upload
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import '../components/style/theme.css';

interface SchoolSettings {
  schoolName: string; schoolNameAr: string; schoolNameFr: string;
  phone: string; email: string; address: string;
  website: string; workingHours: string; logoUrl: string;
  prices: { codePrice: string; creneauPrice: string; circuiPrice: string; };
}

interface TrafficSign {
  id?: string;
  imageUrl: string;
  nameAr: string; nameFr: string; nameEn: string;
  commentAr: string; commentFr: string; commentEn: string;
  category: 'warning' | 'prohibition' | 'mandatory' | 'information';
  published: boolean;
  createdAt: number;
}

const emptySign: Omit<TrafficSign, 'id'> = {
  imageUrl: '', nameAr: '', nameFr: '', nameEn: '',
  commentAr: '', commentFr: '', commentEn: '',
  category: 'warning', published: false, createdAt: 0
};

const sectionCard: React.CSSProperties = {
  background: 'var(--grad-card)',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius-md)',
  borderTop: '3px solid var(--primary)',
  padding: '1.5rem',
  marginBottom: '0',
};

const iconBox = (color: string): React.CSSProperties => ({
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  width: '2.25rem', height: '2.25rem', borderRadius: '0.625rem',
  background: color, color: 'white', flexShrink: 0,
});

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontWeight: 600,
  fontSize: '0.875rem',
  color: 'var(--text-secondary)',
  marginBottom: '0.375rem',
};

const AdminSettingsContent = () => {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const logoInputRef = useRef<HTMLInputElement>(null);
  const signImgRef = useRef<HTMLInputElement>(null);

  // Traffic signs state
  const [signs, setSigns] = useState<TrafficSign[]>([]);
  const [signsLoading, setSignsLoading] = useState(true);
  const [newSign, setNewSign] = useState<Omit<TrafficSign, 'id'>>(emptySign);
  const [addingSign, setAddingSign] = useState(false);
  const [uploadingSignImg, setUploadingSignImg] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const [settings, setSettings] = useState<SchoolSettings>({
    schoolName: '', schoolNameAr: '', schoolNameFr: '',
    phone: '', email: '', address: '', website: '', workingHours: '', logoUrl: '',
    prices: { codePrice: '', creneauPrice: '', circuiPrice: '' }
  });

  useEffect(() => { fetchSettings(); fetchSigns(); }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase.from('settings').select('*').eq('id', 'school').single();
      if (!error && data) {
        setSettings({
          ...data,
          prices: data.prices ?? { codePrice: '', creneauPrice: '', circuiPrice: '' }
        } as SchoolSettings);
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const fetchSigns = async () => {
    try {
      const { data } = await supabase.from('trafficSigns').select('*');
      const signs = (data || []) as TrafficSign[];
      signs.sort((a, b) => b.createdAt - a.createdAt);
      setSigns(signs);
    } catch (e) { console.error(e); }
    finally { setSignsLoading(false); }
  };

  const ok = (msg: string) => { setMessage(msg); setTimeout(() => setMessage(''), 3000); };
  const err = (msg: string) => { setError(msg); setTimeout(() => setError(''), 3000); };
  const t = (ar: string, fr: string, en: string) => language === 'ar' ? ar : language === 'fr' ? fr : en;

  const uploadCloudinary = async (file: File, folder: string) => {
    const fd = new FormData();
    fd.append('file', file);
    fd.append('upload_preset', import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET);
    fd.append('folder', folder);
    const res = await fetch(`https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/image/upload`, { method: 'POST', body: fd });
    const data = await res.json();
    if (!data.secure_url) throw new Error('Upload failed');
    return data.secure_url as string;
  };

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault(); setSaving(true);
    try { await supabase.from('settings').upsert({ id: 'school', ...settings }); ok(t('تم حفظ الإعدادات!', 'Paramètres enregistrés!', 'Settings saved!')); }
    catch (e) { console.error(e); err(t('خطأ في الحفظ', 'Erreur', 'Save error')); }
    finally { setSaving(false); }
  };

  const handleField = (field: string, value: string) => {
    if (field.startsWith('prices.')) {
      const pf = field.split('.')[1];
      setSettings(p => ({ ...p, prices: { ...p.prices, [pf]: value } }));
    } else setSettings(p => ({ ...p, [field]: value }));
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    if (!file.type.startsWith('image/')) { err(t('صورة غير صالحة', 'Image invalide', 'Invalid image')); return; }
    setUploadingLogo(true);
    try {
      const url = await uploadCloudinary(file, 'school_logo');
      const ns = { ...settings, logoUrl: url };
      setSettings(ns); await supabase.from('settings').upsert({ id: 'school', ...ns });
      ok(t('تم رفع الشعار!', 'Logo téléchargé!', 'Logo uploaded!'));
    } catch (e) { console.error(e); err(t('فشل رفع الشعار', 'Échec upload', 'Upload failed')); }
    finally { setUploadingLogo(false); }
  };

  const handleSignImgUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    if (!file.type.startsWith('image/')) { err(t('صورة غير صالحة', 'Image invalide', 'Invalid image')); return; }
    setUploadingSignImg(true);
    try {
      const url = await uploadCloudinary(file, 'traffic_signs');
      setNewSign(p => ({ ...p, imageUrl: url }));
    } catch (e) { console.error(e); err(t('فشل رفع الصورة', 'Échec upload', 'Upload failed')); }
    finally { setUploadingSignImg(false); }
  };

  const handleAddSign = async () => {
    if (!newSign.nameAr.trim()) { err(t('أدخل اسم العلامة', 'Entrez le nom', 'Enter sign name')); return; }
    if (!newSign.imageUrl) { err(t('ارفع صورة العلامة أولاً', 'Téléchargez l\'image d\'abord', 'Upload sign image first')); return; }
    setAddingSign(true);
    try {
      const data = { ...newSign, createdAt: Date.now() };
      const { data: inserted, error: insertError } = await supabase.from('trafficSigns').insert(data).select().single();
      if (insertError) throw insertError;
      setSigns(p => [inserted as TrafficSign, ...p]);
      setNewSign(emptySign); setShowForm(false);
      ok(t('تمت إضافة العلامة!', 'Panneau ajouté!', 'Sign added!'));
    } catch (e) { console.error(e); err(t('فشل الإضافة', 'Échec', 'Failed')); }
    finally { setAddingSign(false); }
  };

  const handleDelete = async (id: string) => {
    try {
      await supabase.from('trafficSigns').delete().eq('id', id);
      setSigns(p => p.filter(s => s.id !== id));
      ok(t('تم الحذف', 'Supprimé', 'Deleted'));
    } catch (e) { console.error(e); err(t('فشل الحذف', 'Échec', 'Failed')); }
  };

  const handleToggle = async (sign: TrafficSign) => {
    if (!sign.id) return;
    try {
      await supabase.from('trafficSigns').update({ published: !sign.published }).eq('id', sign.id);
      setSigns(p => p.map(s => s.id === sign.id ? { ...s, published: !s.published } : s));
      ok(sign.published ? t('تم إلغاء النشر', 'Dépublié', 'Unpublished') : t('تم النشر للطلاب!', 'Publié!', 'Published!'));
    } catch (e) { console.error(e); err(t('فشل تغيير الحالة', 'Échec', 'Failed')); }
  };

  const catColor = (c: string) => ({ warning: '#f59e0b', prohibition: '#ef4444', mandatory: '#3b82f6', information: '#10b981' }[c] || '#64748b');
  const catLabel = (c: string) => ({ warning: t('تحذيرية', 'Avertissement', 'Warning'), prohibition: t('منع', 'Interdiction', 'Prohibition'), mandatory: t('إلزامية', 'Obligatoire', 'Mandatory'), information: t('إعلامية', 'Information', 'Information') }[c] || c);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-darkest)', color: 'var(--text-primary)' }}>
      <Navbar />
      <main style={{ padding: '6rem 1.5rem 3rem', maxWidth: '1050px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

        {/* Header */}
        <div>
          <div style={{ background: 'var(--grad-card)', border: '1px solid var(--border)', padding: '1.75rem 2rem', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-md)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <button
                type="button"
                onClick={() => navigate('/admin-dashboard')}
                className="btn-ghost"
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}
              >
                <ArrowLeft style={{ width: '1rem', height: '1rem' }} />
                {t('رجوع', 'Retour', 'Back')}
              </button>
              <div>
                <h1 style={{ fontSize: '1.875rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '0 0 0.25rem' }}>
                  <Settings style={{ width: '1.75rem', height: '1.75rem', color: 'var(--primary)' }} />
                  <span className="gold-text">{t('الإعدادات', 'Paramètres', 'Settings')}</span>
                </h1>
                <p style={{ color: 'var(--text-secondary)', margin: 0 }}>{t('إدارة إعدادات المدرسة والنظام', 'Gérer les paramètres', 'Manage school settings')}</p>
              </div>
            </div>
          </div>

          {message && (
            <div style={{ marginTop: '0.75rem', padding: '0.875rem 1.25rem', background: 'rgba(16,185,129,0.1)', border: '2px solid rgba(16,185,129,0.3)', borderRadius: 'var(--radius-md)', color: '#34D399', display: 'flex', alignItems: 'center', gap: '0.75rem', fontWeight: 600 }}>
              <Check style={{ width: '1.25rem', height: '1.25rem' }} />{message}
            </div>
          )}
          {error && (
            <div style={{ marginTop: '0.75rem', padding: '0.875rem 1.25rem', background: 'rgba(239,68,68,0.1)', border: '2px solid rgba(239,68,68,0.3)', borderRadius: 'var(--radius-md)', color: '#FCA5A5', display: 'flex', alignItems: 'center', gap: '0.75rem', fontWeight: 600 }}>
              <AlertCircle style={{ width: '1.25rem', height: '1.25rem' }} />{error}
            </div>
          )}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '4rem' }}>
            <Loader2 style={{ width: '2rem', height: '2rem', margin: '0 auto', color: 'var(--primary)', animation: 'spin 1s linear infinite' }} />
          </div>
        ) : (
          <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

            {/* Logo */}
            <div style={sectionCard}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
                <span style={iconBox('linear-gradient(135deg,#8b5cf6,#6d28d9)')}><ImagePlus style={{ width: '1.25rem', height: '1.25rem' }} /></span>
                <h2 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-white)', margin: 0 }}>
                  {t('شعار المدرسة', 'Logo de l\'école', 'School Logo')}
                </h2>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
                <div style={{ width: '88px', height: '88px', borderRadius: 'var(--radius-md)', border: '2px dashed var(--border-gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-mid)', overflow: 'hidden', flexShrink: 0 }}>
                  {settings.logoUrl
                    ? <img src={settings.logoUrl} alt="logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                    : <ImagePlus style={{ width: '2rem', height: '2rem', color: 'var(--text-muted)' }} />
                  }
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                  <input ref={logoInputRef} type="file" accept="image/*" onChange={handleLogoUpload} style={{ display: 'none' }} />
                  <button type="button" onClick={() => logoInputRef.current?.click()} disabled={uploadingLogo} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.625rem 1.25rem', fontSize: '0.875rem' }}>
                    {uploadingLogo
                      ? <><Loader2 style={{ width: '1rem', height: '1rem', animation: 'spin 1s linear infinite' }} />{t('جاري الرفع...', 'Téléchargement...', 'Uploading...')}</>
                      : <><ImagePlus style={{ width: '1rem', height: '1rem' }} />{t('رفع شعار', 'Télécharger', 'Upload Logo')}</>
                    }
                  </button>
                  {settings.logoUrl && (
                    <button
                      type="button"
                      onClick={() => { const ns = { ...settings, logoUrl: '' }; setSettings(ns); supabase.from('settings').upsert({ id: 'school', ...ns }); }}
                      style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'transparent', color: '#FCA5A5', border: '1.5px solid rgba(239,68,68,0.35)', borderRadius: 'var(--radius-full)', padding: '0.5rem 1rem', fontWeight: 500, fontSize: '0.875rem', cursor: 'pointer' }}
                    >
                      <X style={{ width: '1rem', height: '1rem' }} />{t('حذف', 'Supprimer', 'Remove')}
                    </button>
                  )}
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>PNG, JPG, SVG — Max 2MB</p>
                </div>
              </div>
            </div>

            {/* School Info */}
            <div style={sectionCard}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
                <span style={iconBox('linear-gradient(135deg,#3b82f6,#2563eb)')}><Building2 style={{ width: '1.25rem', height: '1.25rem' }} /></span>
                <h2 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-white)', margin: 0 }}>
                  {t('معلومات المدرسة', 'Informations de l\'école', 'School Information')}
                </h2>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: '1rem' }}>
                {[
                  { f: 'schoolNameAr', l: t('الاسم (عربي)', 'Nom (Arabe)', 'Name (Arabic)'), ph: 'مدرسة تعليم السياقة' },
                  { f: 'schoolNameFr', l: t('الاسم (فرنسي)', 'Nom (Français)', 'Name (French)'), ph: 'Auto-école' },
                  { f: 'schoolName',   l: t('الاسم (إنجليزي)', 'Nom (Anglais)', 'Name (English)'), ph: 'Driving School' }
                ].map(({ f, l, ph }) => (
                  <div key={f}>
                    <label style={labelStyle}>{l}</label>
                    <input
                      className="input-pro"
                      value={settings[f as keyof SchoolSettings] as string}
                      onChange={e => handleField(f, e.target.value)}
                      placeholder={ph}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Contact */}
            <div style={sectionCard}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
                <span style={iconBox('linear-gradient(135deg,#10b981,#059669)')}><Phone style={{ width: '1.25rem', height: '1.25rem' }} /></span>
                <h2 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-white)', margin: 0 }}>
                  {t('معلومات الاتصال', 'Informations de contact', 'Contact Information')}
                </h2>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: '1rem' }}>
                  <div>
                    <label style={labelStyle}><Phone style={{ width: '0.875rem', height: '0.875rem', display: 'inline', verticalAlign: 'middle', marginRight: '0.375rem' }} />{t('الهاتف', 'Téléphone', 'Phone')}</label>
                    <input className="input-pro" value={settings.phone} onChange={e => handleField('phone', e.target.value)} placeholder="+213 XXX XXX XXX" />
                  </div>
                  <div>
                    <label style={labelStyle}><Mail style={{ width: '0.875rem', height: '0.875rem', display: 'inline', verticalAlign: 'middle', marginRight: '0.375rem' }} />{t('البريد', 'Email', 'Email')}</label>
                    <input className="input-pro" type="email" value={settings.email} onChange={e => handleField('email', e.target.value)} placeholder="info@school.com" />
                  </div>
                  <div>
                    <label style={labelStyle}><Globe style={{ width: '0.875rem', height: '0.875rem', display: 'inline', verticalAlign: 'middle', marginRight: '0.375rem' }} />{t('الموقع', 'Site Web', 'Website')}</label>
                    <input className="input-pro" value={settings.website} onChange={e => handleField('website', e.target.value)} placeholder="www.school.com" />
                  </div>
                </div>
                <div>
                  <label style={labelStyle}><MapPin style={{ width: '0.875rem', height: '0.875rem', display: 'inline', verticalAlign: 'middle', marginRight: '0.375rem' }} />{t('العنوان', 'Adresse', 'Address')}</label>
                  <textarea
                    className="input-pro"
                    value={settings.address}
                    onChange={e => handleField('address', e.target.value)}
                    rows={2}
                    placeholder={t('أدخل العنوان...', 'Entrez l\'adresse...', 'Enter address...')}
                    style={{ resize: 'vertical' }}
                  />
                </div>
                <div>
                  <label style={labelStyle}><Clock style={{ width: '0.875rem', height: '0.875rem', display: 'inline', verticalAlign: 'middle', marginRight: '0.375rem' }} />{t('ساعات العمل', 'Heures de travail', 'Working Hours')}</label>
                  <input className="input-pro" value={settings.workingHours} onChange={e => handleField('workingHours', e.target.value)} placeholder={t('السبت - الخميس: 8:00 - 18:00', 'Sam - Jeu: 8:00 - 18:00', 'Sat - Thu: 8:00 - 18:00')} />
                </div>
              </div>
            </div>

            {/* Pricing */}
            <div style={sectionCard}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
                <span style={iconBox('linear-gradient(135deg,#F5A623,#FF6B35)')}><DollarSign style={{ width: '1.25rem', height: '1.25rem' }} /></span>
                <h2 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-white)', margin: 0 }}>
                  {t('الأسعار', 'Tarifs', 'Pricing')}
                </h2>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: '1rem' }}>
                <div>
                  <label style={labelStyle}>{t('سعر الكود', 'Prix Code', 'Code Price')}</label>
                  <input className="input-pro" value={settings.prices.codePrice} onChange={e => handleField('prices.codePrice', e.target.value)} placeholder="5000 DA" />
                </div>
                <div>
                  <label style={labelStyle}>{t('سعر الكرينو', 'Prix Créneau', 'Creneau Price')}</label>
                  <input className="input-pro" value={settings.prices.creneauPrice} onChange={e => handleField('prices.creneauPrice', e.target.value)} placeholder="3000 DA" />
                </div>
                <div>
                  <label style={labelStyle}>{t('سعر السيركوي', 'Prix Circui', 'Circui Price')}</label>
                  <input className="input-pro" value={settings.prices.circuiPrice} onChange={e => handleField('prices.circuiPrice', e.target.value)} placeholder="2000 DA" />
                </div>
              </div>
            </div>

            {/* Save */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.875rem' }}>
              <button type="button" className="btn-ghost" onClick={() => navigate('/admin-dashboard')} style={{ padding: '0.75rem 1.5rem' }}>
                {t('إلغاء', 'Annuler', 'Cancel')}
              </button>
              <button type="submit" disabled={saving} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.75rem', opacity: saving ? 0.7 : 1 }}>
                {saving
                  ? <><Loader2 style={{ width: '1.25rem', height: '1.25rem', animation: 'spin 1s linear infinite' }} />{t('جاري الحفظ...', 'Enregistrement...', 'Saving...')}</>
                  : <><Save style={{ width: '1.25rem', height: '1.25rem' }} />{t('حفظ الإعدادات', 'Enregistrer', 'Save Settings')}</>
                }
              </button>
            </div>
          </form>
        )}

        {/* ===== قسم علامات المرور ===== */}
        <div style={{ ...sectionCard, borderTop: '3px solid var(--primary)' }}>
          {/* Header row */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1.25rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.375rem' }}>
                <span style={iconBox('linear-gradient(135deg,#F5A623,#FF6B35)')}><TrafficCone style={{ width: '1.25rem', height: '1.25rem' }} /></span>
                <h2 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-white)', margin: 0 }}>
                  {t('إدارة علامات المرور', 'Gestion des panneaux', 'Traffic Signs Management')}
                </h2>
              </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', margin: 0, paddingLeft: '3rem' }}>
                {t('أضف صور علامات المرور مع شرحها ثم انشرها للطلاب', 'Ajoutez des panneaux avec descriptions et publiez-les aux étudiants', 'Add traffic sign images with descriptions then publish to students')}
              </p>
            </div>
            <button
              type="button"
              onClick={() => { setShowForm(v => !v); setNewSign(emptySign); }}
              className={showForm ? 'btn-ghost' : 'btn-primary'}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.625rem 1.25rem', fontSize: '0.9375rem' }}
            >
              {showForm
                ? <><X style={{ width: '1rem', height: '1rem' }} />{t('إلغاء', 'Annuler', 'Cancel')}</>
                : <><Plus style={{ width: '1.25rem', height: '1.25rem' }} />{t('+ إضافة علامة', '+ Ajouter panneau', '+ Add Sign')}</>
              }
            </button>
          </div>

          {/* ===== فورم الإضافة ===== */}
          {showForm && (
            <div style={{ background: 'var(--bg-mid)', borderRadius: 'var(--radius-md)', padding: '1.5rem', marginBottom: '1.75rem', border: '1.5px solid var(--border-gold)' }}>
              <p style={{ fontWeight: 700, color: 'var(--text-white)', fontSize: '1.0625rem', marginBottom: '1.25rem' }}>
                {t('إضافة علامة مرور جديدة', 'Ajouter un nouveau panneau', 'Add New Traffic Sign')}
              </p>

              {/* رفع الصورة */}
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ ...labelStyle, fontWeight: 700, marginBottom: '0.625rem' }}>
                  {t('📷 صورة العلامة *', '📷 Image du panneau *', '📷 Sign Image *')}
                </label>
                <input ref={signImgRef} type="file" accept="image/*" onChange={handleSignImgUpload} style={{ display: 'none' }} />
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap' }}>
                  <div
                    onClick={() => signImgRef.current?.click()}
                    style={{ width: '110px', height: '110px', borderRadius: 'var(--radius-md)', border: `2px dashed ${newSign.imageUrl ? '#34D399' : 'var(--border)'}`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-card)', overflow: 'hidden', cursor: 'pointer', flexShrink: 0 }}
                  >
                    {newSign.imageUrl
                      ? <img src={newSign.imageUrl} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                      : uploadingSignImg
                        ? <Loader2 style={{ width: '2rem', height: '2rem', color: 'var(--text-muted)', animation: 'spin 1s linear infinite' }} />
                        : <><Upload style={{ width: '1.75rem', height: '1.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }} /><span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textAlign: 'center' }}>{t('اضغط لرفع صورة', 'Cliquer pour uploader', 'Click to upload')}</span></>
                    }
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <button type="button" onClick={() => signImgRef.current?.click()} disabled={uploadingSignImg} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.625rem 1.25rem', fontSize: '0.875rem' }}>
                      {uploadingSignImg
                        ? <><Loader2 style={{ width: '1rem', height: '1rem', animation: 'spin 1s linear infinite' }} />{t('جاري الرفع...', 'Téléchargement...', 'Uploading...')}</>
                        : <><Upload style={{ width: '1rem', height: '1rem' }} />{t('رفع صورة العلامة', 'Télécharger image', 'Upload Sign Image')}</>
                      }
                    </button>
                    {newSign.imageUrl && (
                      <p style={{ fontSize: '0.8rem', color: '#34D399', display: 'flex', alignItems: 'center', gap: '0.25rem', margin: 0 }}>
                        <Check style={{ width: '1rem', height: '1rem' }} />{t('تم رفع الصورة بنجاح', 'Image téléchargée', 'Image uploaded')}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* الأسماء */}
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ ...labelStyle, fontWeight: 700, marginBottom: '0.625rem' }}>
                  {t('📝 اسم العلامة', '📝 Nom du panneau', '📝 Sign Name')}
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: '0.75rem' }}>
                  <div>
                    <label style={{ ...labelStyle, fontSize: '0.8rem' }}>{t('عربي *', 'Arabe *', 'Arabic *')}</label>
                    <input className="input-pro" value={newSign.nameAr} onChange={e => setNewSign(p => ({ ...p, nameAr: e.target.value }))} placeholder={t('مثال: قف', 'Ex: Stop', 'Ex: Stop')} />
                  </div>
                  <div>
                    <label style={{ ...labelStyle, fontSize: '0.8rem' }}>Français</label>
                    <input className="input-pro" value={newSign.nameFr} onChange={e => setNewSign(p => ({ ...p, nameFr: e.target.value }))} placeholder="Ex: Stop" />
                  </div>
                  <div>
                    <label style={{ ...labelStyle, fontSize: '0.8rem' }}>English</label>
                    <input className="input-pro" value={newSign.nameEn} onChange={e => setNewSign(p => ({ ...p, nameEn: e.target.value }))} placeholder="Ex: Stop" />
                  </div>
                </div>
              </div>

              {/* التعليق / الشرح */}
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ ...labelStyle, fontWeight: 700, marginBottom: '0.625rem' }}>
                  {t('💬 التعليق والشرح', '💬 Commentaire / Explication', '💬 Comment / Explanation')}
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: '0.75rem' }}>
                  <div>
                    <label style={{ ...labelStyle, fontSize: '0.8rem' }}>{t('عربي', 'Arabe', 'Arabic')}</label>
                    <textarea className="input-pro" value={newSign.commentAr} onChange={e => setNewSign(p => ({ ...p, commentAr: e.target.value }))} rows={3} placeholder={t('اشرح معنى هذه العلامة...', 'Expliquez ce panneau...', 'Explain this sign...')} style={{ resize: 'vertical' }} />
                  </div>
                  <div>
                    <label style={{ ...labelStyle, fontSize: '0.8rem' }}>Français</label>
                    <textarea className="input-pro" value={newSign.commentFr} onChange={e => setNewSign(p => ({ ...p, commentFr: e.target.value }))} rows={3} placeholder="Expliquez ce panneau..." style={{ resize: 'vertical' }} />
                  </div>
                  <div>
                    <label style={{ ...labelStyle, fontSize: '0.8rem' }}>English</label>
                    <textarea className="input-pro" value={newSign.commentEn} onChange={e => setNewSign(p => ({ ...p, commentEn: e.target.value }))} rows={3} placeholder="Explain this sign..." style={{ resize: 'vertical' }} />
                  </div>
                </div>
              </div>

              {/* النوع */}
              <div style={{ marginBottom: '1.25rem', maxWidth: '240px' }}>
                <label style={{ ...labelStyle, fontWeight: 700, marginBottom: '0.5rem' }}>
                  {t('🏷️ نوع العلامة', '🏷️ Type de panneau', '🏷️ Sign Type')}
                </label>
                <select
                  className="input-pro"
                  value={newSign.category}
                  onChange={e => setNewSign(p => ({ ...p, category: e.target.value as TrafficSign['category'] }))}
                >
                  <option value="warning">⚠️ {t('تحذيرية', 'Avertissement', 'Warning')}</option>
                  <option value="prohibition">🚫 {t('منع', 'Interdiction', 'Prohibition')}</option>
                  <option value="mandatory">🔵 {t('إلزامية', 'Obligatoire', 'Mandatory')}</option>
                  <option value="information">ℹ️ {t('إعلامية', 'Information', 'Information')}</option>
                </select>
              </div>

              {/* أزرار الحفظ */}
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', paddingTop: '0.5rem', borderTop: '1px solid var(--border)' }}>
                <button
                  type="button"
                  onClick={handleAddSign}
                  disabled={addingSign || !newSign.nameAr.trim() || !newSign.imageUrl}
                  className="btn-primary"
                  style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.75rem', opacity: (addingSign || !newSign.nameAr.trim() || !newSign.imageUrl) ? 0.5 : 1 }}
                >
                  {addingSign
                    ? <><Loader2 style={{ width: '1.25rem', height: '1.25rem', animation: 'spin 1s linear infinite' }} />{t('جاري الحفظ...', 'Enregistrement...', 'Saving...')}</>
                    : <><Check style={{ width: '1.25rem', height: '1.25rem' }} />{t('حفظ العلامة', 'Enregistrer le panneau', 'Save Sign')}</>
                  }
                </button>
                <button
                  type="button"
                  onClick={() => { setShowForm(false); setNewSign(emptySign); }}
                  className="btn-ghost"
                  style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.25rem' }}
                >
                  <X style={{ width: '1rem', height: '1rem' }} />{t('إلغاء', 'Annuler', 'Cancel')}
                </button>
              </div>
            </div>
          )}

          {/* قائمة العلامات */}
          {signsLoading ? (
            <div style={{ textAlign: 'center', padding: '3rem' }}>
              <Loader2 style={{ width: '1.75rem', height: '1.75rem', margin: '0 auto', color: 'var(--primary)', animation: 'spin 1s linear infinite' }} />
            </div>
          ) : signs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
              <TrafficCone style={{ width: '3.5rem', height: '3.5rem', margin: '0 auto 1rem', opacity: 0.3 }} />
              <p style={{ fontSize: '0.9375rem' }}>{t('لا توجد علامات بعد. اضغط "+ إضافة علامة" للبدء.', 'Aucun panneau. Cliquez sur "+ Ajouter panneau".', 'No signs yet. Click "+ Add Sign" to start.')}</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))', gap: '1rem' }}>
              {signs.map(sign => (
                <div
                  key={sign.id}
                  style={{
                    background: sign.published ? 'rgba(16,185,129,0.05)' : 'var(--bg-card)',
                    borderRadius: 'var(--radius-md)',
                    border: `1.5px solid ${sign.published ? 'rgba(16,185,129,0.35)' : 'var(--border)'}`,
                    overflow: 'hidden',
                    transition: 'all 0.2s',
                  }}
                >
                  {/* صورة */}
                  <div style={{ height: '130px', background: 'var(--bg-mid)', display: 'flex', alignItems: 'center', justifyContent: 'center', borderBottom: '1px solid var(--border)', overflow: 'hidden' }}>
                    <img src={sign.imageUrl} alt={sign.nameAr} style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }} />
                  </div>
                  {/* معلومات */}
                  <div style={{ padding: '0.875rem' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem', marginBottom: '0.375rem' }}>
                      <p style={{ fontWeight: 700, color: 'var(--text-white)', fontSize: '0.9375rem', margin: 0 }}>{sign.nameAr}</p>
                      <span className="badge-pro" style={{ fontSize: '0.7rem', background: catColor(sign.category) + '20', color: catColor(sign.category), border: `1px solid ${catColor(sign.category)}40`, flexShrink: 0 }}>
                        {catLabel(sign.category)}
                      </span>
                    </div>
                    {sign.nameFr && <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', margin: '0 0 0.5rem' }}>{sign.nameFr}</p>}
                    {(sign.commentAr || sign.commentFr || sign.commentEn) && (
                      <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', margin: '0 0 0.75rem', lineHeight: 1.5, borderTop: '1px solid var(--border)', paddingTop: '0.5rem' }}>
                        {language === 'ar' ? sign.commentAr : language === 'fr' ? (sign.commentFr || sign.commentAr) : (sign.commentEn || sign.commentAr)}
                      </p>
                    )}
                    {/* أزرار */}
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        type="button"
                        onClick={() => handleToggle(sign)}
                        style={{
                          flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.375rem',
                          background: sign.published ? 'rgba(239,68,68,0.1)' : 'var(--grad-gold)',
                          color: sign.published ? '#FCA5A5' : '#000',
                          border: sign.published ? '1px solid rgba(239,68,68,0.35)' : 'none',
                          borderRadius: 'var(--radius-md)',
                          padding: '0.5rem', fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer'
                        }}
                      >
                        {sign.published
                          ? <><EyeOff style={{ width: '0.875rem', height: '0.875rem' }} />{t('إلغاء النشر', 'Dépublier', 'Unpublish')}</>
                          : <><Eye style={{ width: '0.875rem', height: '0.875rem' }} />{t('نشر للطلاب', 'Publier', 'Publish')}</>
                        }
                      </button>
                      <button
                        type="button"
                        onClick={() => sign.id && handleDelete(sign.id)}
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', color: '#FCA5A5', border: '1px solid rgba(239,68,68,0.35)', borderRadius: 'var(--radius-md)', padding: '0.5rem 0.75rem', cursor: 'pointer' }}
                      >
                        <Trash2 style={{ width: '1rem', height: '1rem' }} />
                      </button>
                    </div>
                    {sign.published && (
                      <p style={{ fontSize: '0.7rem', color: '#34D399', marginTop: '0.375rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <Eye style={{ width: '0.75rem', height: '0.75rem' }} />{t('ظاهر للطلاب', 'Visible aux étudiants', 'Visible to students')}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </main>
      <Footer />
    </div>
  );
};

const AdminSettings = () => (
  <LanguageProvider>
    <AdminSettingsContent />
  </LanguageProvider>
);

export default AdminSettings;
