import { useState, useEffect, useRef } from 'react';
import { LanguageProvider, useLanguage } from '../contexts/LanguageContext';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle, Ban, Navigation, Info, Plus, Trash2,
  Upload, X, Loader2, CheckCircle, Eye, EyeOff, ImageIcon,
  ArrowLeft, BookOpen
} from 'lucide-react';
import { supabase } from '../supabase';
import '../components/style/theme.css';

const CLOUDINARY_CLOUD_NAME = 'dpjclv2nb';
const CLOUDINARY_UPLOAD_PRESET = 'preset';

const CATEGORIES = [
  { id: 'warning',     labelAr: 'تحذيرية',  labelFr: 'Avertissement', labelEn: 'Warning',     icon: AlertTriangle, color: '#F59E0B', bg: 'rgba(245,158,11,0.12)' },
  { id: 'prohibition', labelAr: 'منع',       labelFr: 'Interdiction',  labelEn: 'Prohibition', icon: Ban,           color: '#EF4444', bg: 'rgba(239,68,68,0.12)' },
  { id: 'mandatory',   labelAr: 'إلزامية',  labelFr: 'Obligatoire',   labelEn: 'Mandatory',   icon: Navigation,    color: '#3B82F6', bg: 'rgba(59,130,246,0.12)' },
  { id: 'information', labelAr: 'إعلامية',  labelFr: 'Information',   labelEn: 'Information', icon: Info,          color: '#10B981', bg: 'rgba(16,185,129,0.12)' },
];

interface TrafficSign {
  id: string;
  nameAr: string; nameFr: string; nameEn: string;
  commentAr: string; commentFr: string; commentEn: string;
  category: string;
  imageUrl: string;
  published: boolean;
  createdAt: string;
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 14px', borderRadius: 8,
  border: '1px solid rgba(255,255,255,0.15)',
  background: 'rgba(255,255,255,0.05)', color: '#fff',
  fontSize: 14, outline: 'none', boxSizing: 'border-box',
};

const AdminSignsContent = () => {
  const { language } = useLanguage();
  const navigate = useNavigate();

  const [signs, setSigns] = useState<TrafficSign[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterCat, setFilterCat] = useState('all');

  // Upload form state
  const [showForm, setShowForm] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState('');
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({
    nameAr: '', nameFr: '', nameEn: '',
    commentAr: '', commentFr: '', commentEn: '',
    category: 'warning',
  });

  const [flashMsg, setFlashMsg] = useState('');
  const [flashErr, setFlashErr] = useState('');
  const imgInputRef = useRef<HTMLInputElement>(null);

  const t = (ar: string, fr: string, en: string) =>
    language === 'ar' ? ar : language === 'fr' ? fr : en;

  const flash = (msg: string, err = false) => {
    if (err) { setFlashErr(msg); setTimeout(() => setFlashErr(''), 4000); }
    else { setFlashMsg(msg); setTimeout(() => setFlashMsg(''), 4000); }
  };

  useEffect(() => {
    fetchSigns();
  }, []);

  const fetchSigns = async () => {
    setLoading(true);
    const { data } = await supabase.from('trafficSigns').select('*').order('createdAt', { ascending: false });
    setSigns((data || []) as TrafficSign[]);
    setLoading(false);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { flash(t('اختر صورة', 'Choisissez une image', 'Select an image'), true); return; }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageFile && !form.nameAr) { flash(t('يرجى ملء الاسم والصورة', 'Veuillez remplir le nom et l\'image', 'Please fill name and image'), true); return; }
    setUploading(true);
    try {
      let imageUrl = '';
      if (imageFile) {
        const fd = new FormData();
        fd.append('file', imageFile);
        fd.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
        fd.append('folder', 'traffic_signs');
        const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, { method: 'POST', body: fd });
        const result = await res.json();
        imageUrl = result.secure_url || '';
      }
      const { data: newSign, error } = await supabase.from('trafficSigns').insert({
        nameAr: form.nameAr,
        nameFr: form.nameFr,
        nameEn: form.nameEn,
        commentAr: form.commentAr,
        commentFr: form.commentFr,
        commentEn: form.commentEn,
        category: form.category,
        imageUrl,
        published: true,
        createdAt: new Date().toISOString(),
      }).select().single();
      if (error) throw error;
      setSigns(prev => [newSign as TrafficSign, ...prev]);
      setShowForm(false);
      setForm({ nameAr: '', nameFr: '', nameEn: '', commentAr: '', commentFr: '', commentEn: '', category: 'warning' });
      setImageFile(null);
      setImagePreview('');
      flash(t('تم إضافة العلامة', 'Panneau ajouté', 'Sign added'));
    } catch { flash(t('فشل رفع العلامة', 'Échec du téléchargement', 'Upload failed'), true); }
    setUploading(false);
  };

  const togglePublish = async (sign: TrafficSign) => {
    await supabase.from('trafficSigns').update({ published: !sign.published }).eq('id', sign.id);
    setSigns(prev => prev.map(s => s.id === sign.id ? { ...s, published: !s.published } : s));
  };

  const handleDelete = async (id: string) => {
    await supabase.from('trafficSigns').delete().eq('id', id);
    setSigns(prev => prev.filter(s => s.id !== id));
    flash(t('تم حذف العلامة', 'Panneau supprimé', 'Sign deleted'));
  };

  const displayed = filterCat === 'all' ? signs : signs.filter(s => s.category === filterCat);

  const getCat = (id: string) => CATEGORIES.find(c => c.id === id) || CATEGORIES[3];

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-darkest, #0a0a14)', color: '#fff' }}>
      {/* Top bar */}
      <div style={{ position: 'sticky', top: 0, zIndex: 50, background: 'rgba(10,10,20,0.95)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(255,255,255,0.08)', padding: '0 24px', height: 64, display: 'flex', alignItems: 'center', gap: 16 }}>
        <button onClick={() => navigate('/admin-dashboard')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.6)', display: 'flex', alignItems: 'center', gap: 6, fontSize: 14 }}>
          <ArrowLeft size={18} /> {t('العودة', 'Retour', 'Back')}
        </button>
        <div style={{ width: 1, height: 24, background: 'rgba(255,255,255,0.1)' }} />
        <BookOpen size={18} color="#F59E0B" />
        <span style={{ fontWeight: 700, fontSize: 16 }}>{t('إدارة علامات المرور', 'Gestion des panneaux', 'Manage Road Signs')}</span>
        <div style={{ flex: 1 }} />
        <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>{signs.length} {t('علامة', 'panneaux', 'signs')}</span>
        <button
          onClick={() => setShowForm(true)}
          style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 18px', borderRadius: 8, background: 'linear-gradient(135deg,#F59E0B,#D97706)', border: 'none', color: '#000', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}
        >
          <Plus size={16} /> {t('إضافة علامة', 'Ajouter un panneau', 'Add Sign')}
        </button>
      </div>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 16px' }}>

        {/* Flash */}
        {flashMsg && <div style={{ background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.35)', borderRadius: 10, padding: '12px 16px', marginBottom: 16, color: '#22c55e', display: 'flex', alignItems: 'center', gap: 8 }}><CheckCircle size={16} />{flashMsg}</div>}
        {flashErr && <div style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.35)', borderRadius: 10, padding: '12px 16px', marginBottom: 16, color: '#ef4444' }}>{flashErr}</div>}

        {/* Stats row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))', gap: 12, marginBottom: 24 }}>
          {CATEGORIES.map(cat => {
            const Icon = cat.icon;
            const count = signs.filter(s => s.category === cat.id).length;
            return (
              <div key={cat.id} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: '16px 14px', textAlign: 'center' }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: cat.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px' }}><Icon size={20} color={cat.color} /></div>
                <div style={{ fontSize: 24, fontWeight: 700, color: cat.color }}>{count}</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>{language === 'ar' ? cat.labelAr : language === 'fr' ? cat.labelFr : cat.labelEn}</div>
              </div>
            );
          })}
        </div>

        {/* Filter tabs */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
          {[{ id: 'all', labelAr: 'الكل', labelFr: 'Tous', labelEn: 'All', color: '#F59E0B', bg: 'rgba(245,158,11,0.12)' }, ...CATEGORIES.map(c => ({ id: c.id, labelAr: c.labelAr, labelFr: c.labelFr, labelEn: c.labelEn, color: c.color, bg: c.bg }))].map(tab => (
            <button key={tab.id} onClick={() => setFilterCat(tab.id)} style={{ padding: '6px 14px', borderRadius: 20, border: `1.5px solid ${filterCat === tab.id ? tab.color : 'rgba(255,255,255,0.12)'}`, background: filterCat === tab.id ? tab.bg : 'transparent', color: filterCat === tab.id ? tab.color : 'rgba(255,255,255,0.5)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              {language === 'ar' ? tab.labelAr : language === 'fr' ? tab.labelFr : tab.labelEn}
            </button>
          ))}
        </div>

        {/* Signs grid */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '4rem' }}><Loader2 size={32} style={{ animation: 'spin 1s linear infinite', color: '#F59E0B' }} /></div>
        ) : displayed.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem', background: 'rgba(255,255,255,0.03)', borderRadius: 16, border: '1px dashed rgba(255,255,255,0.1)' }}>
            <ImageIcon size={48} style={{ color: 'rgba(255,255,255,0.2)', marginBottom: 12 }} />
            <p style={{ color: 'rgba(255,255,255,0.4)', margin: 0 }}>{t('لا توجد علامات بعد', 'Aucun panneau', 'No signs yet')}</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 14 }}>
            {displayed.map(sign => {
              const cat = getCat(sign.category);
              const Icon = cat.icon;
              return (
                <div key={sign.id} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, overflow: 'hidden' }}>
                  {/* Image */}
                  <div style={{ height: 110, background: cat.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                    {sign.imageUrl ? (
                      <img src={sign.imageUrl} alt={sign.nameAr} style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }} />
                    ) : (
                      <Icon size={36} color={cat.color} />
                    )}
                    <span style={{ position: 'absolute', top: 8, left: 8, fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: cat.bg, color: cat.color, border: `1px solid ${cat.color}40` }}>
                      {language === 'ar' ? cat.labelAr : language === 'fr' ? cat.labelFr : cat.labelEn}
                    </span>
                    <span style={{ position: 'absolute', top: 8, right: 8, width: 8, height: 8, borderRadius: '50%', background: sign.published ? '#22c55e' : '#ef4444' }} />
                  </div>
                  {/* Info */}
                  <div style={{ padding: '12px 14px' }}>
                    <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 3, color: '#fff' }}>
                      {language === 'ar' ? sign.nameAr : language === 'fr' ? (sign.nameFr || sign.nameAr) : (sign.nameEn || sign.nameAr)}
                    </div>
                    {(sign.commentAr || sign.commentFr || sign.commentEn) && (
                      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', marginBottom: 10, lineHeight: 1.4 }}>
                        {language === 'ar' ? sign.commentAr : language === 'fr' ? (sign.commentFr || sign.commentAr) : (sign.commentEn || sign.commentAr)}
                      </div>
                    )}
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button
                        onClick={() => togglePublish(sign)}
                        title={sign.published ? t('إخفاء', 'Masquer', 'Unpublish') : t('نشر', 'Publier', 'Publish')}
                        style={{ flex: 1, padding: '5px 0', borderRadius: 7, border: `1px solid ${sign.published ? 'rgba(239,68,68,0.3)' : 'rgba(34,197,94,0.3)'}`, background: sign.published ? 'rgba(239,68,68,0.08)' : 'rgba(34,197,94,0.08)', color: sign.published ? '#ef4444' : '#22c55e', cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}
                      >
                        {sign.published ? <><EyeOff size={12} />{t('إخفاء', 'Masquer', 'Hide')}</> : <><Eye size={12} />{t('نشر', 'Publier', 'Publish')}</>}
                      </button>
                      <button
                        onClick={() => handleDelete(sign.id)}
                        title={t('حذف', 'Supprimer', 'Delete')}
                        style={{ padding: '5px 10px', borderRadius: 7, border: '1px solid rgba(239,68,68,0.25)', background: 'rgba(239,68,68,0.08)', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Upload modal ── */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }} onClick={() => setShowForm(false)}>
          <div style={{ background: '#13131f', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 16, width: '100%', maxWidth: 560, maxHeight: '90vh', overflowY: 'auto', padding: 24 }} onClick={e => e.stopPropagation()}>
            {/* Modal header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: '#fff' }}>{t('إضافة علامة مرور', 'Ajouter un panneau', 'Add Road Sign')}</h2>
              <button onClick={() => setShowForm(false)} style={{ background: 'rgba(255,255,255,0.08)', border: 'none', borderRadius: 8, width: 32, height: 32, cursor: 'pointer', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={16} /></button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* Image upload */}
              <div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 8, fontWeight: 600 }}>{t('صورة العلامة', 'Image du panneau', 'Sign Image')} *</div>
                <input ref={imgInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImageChange} />
                <div
                  onClick={() => imgInputRef.current?.click()}
                  style={{ height: 120, borderRadius: 10, border: `2px dashed ${imagePreview ? '#F59E0B' : 'rgba(255,255,255,0.15)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: imagePreview ? 'rgba(245,158,11,0.05)' : 'rgba(255,255,255,0.02)', overflow: 'hidden' }}
                >
                  {imagePreview ? <img src={imagePreview} alt="preview" style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }} /> : (
                    <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.3)' }}>
                      <Upload size={24} style={{ marginBottom: 6 }} />
                      <div style={{ fontSize: 13 }}>{t('انقر لاختيار صورة', 'Cliquez pour choisir', 'Click to select image')}</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Category */}
              <div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 8, fontWeight: 600 }}>{t('الفئة', 'Catégorie', 'Category')}</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 8 }}>
                  {CATEGORIES.map(cat => {
                    const Icon = cat.icon;
                    const sel = form.category === cat.id;
                    return (
                      <button key={cat.id} type="button" onClick={() => setForm(f => ({ ...f, category: cat.id }))} style={{ padding: '10px 12px', borderRadius: 8, border: `1.5px solid ${sel ? cat.color : 'rgba(255,255,255,0.1)'}`, background: sel ? cat.bg : 'transparent', color: sel ? cat.color : 'rgba(255,255,255,0.4)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: sel ? 700 : 400 }}>
                        <Icon size={14} />{language === 'ar' ? cat.labelAr : language === 'fr' ? cat.labelFr : cat.labelEn}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Names */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                {[{ key: 'nameAr', ph: 'الاسم بالعربية', label: 'عربي' }, { key: 'nameFr', ph: 'Nom en français', label: 'Français' }, { key: 'nameEn', ph: 'Name in English', label: 'English' }].map(f => (
                  <div key={f.key}>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 5 }}>{f.label}</div>
                    <input
                      style={inputStyle}
                      placeholder={f.ph}
                      value={(form as any)[f.key]}
                      onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                      required={f.key === 'nameAr'}
                    />
                  </div>
                ))}
              </div>

              {/* Comments */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                {[{ key: 'commentAr', ph: 'وصف بالعربية', label: 'وصف عربي' }, { key: 'commentFr', ph: 'Description en français', label: 'Desc. français' }, { key: 'commentEn', ph: 'Description in English', label: 'Desc. English' }].map(f => (
                  <div key={f.key}>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 5 }}>{f.label}</div>
                    <textarea
                      style={{ ...inputStyle, resize: 'vertical', minHeight: 60 }}
                      placeholder={f.ph}
                      value={(form as any)[f.key]}
                      onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                      rows={2}
                    />
                  </div>
                ))}
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 4 }}>
                <button type="button" onClick={() => setShowForm(false)} style={{ padding: '10px 20px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.15)', background: 'transparent', color: '#fff', cursor: 'pointer', fontSize: 14 }}>
                  {t('إلغاء', 'Annuler', 'Cancel')}
                </button>
                <button type="submit" disabled={uploading} style={{ padding: '10px 24px', borderRadius: 8, border: 'none', background: 'linear-gradient(135deg,#F59E0B,#D97706)', color: '#000', fontWeight: 700, fontSize: 14, cursor: uploading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 8, opacity: uploading ? 0.7 : 1 }}>
                  {uploading ? <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> : <CheckCircle size={15} />}
                  {t('إضافة العلامة', 'Ajouter le panneau', 'Add Sign')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

const AdminSigns = () => (
  <LanguageProvider>
    <AdminSignsContent />
  </LanguageProvider>
);

export default AdminSigns;
