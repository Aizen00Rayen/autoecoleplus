import { useState, useEffect } from 'react';
import { LanguageProvider, useLanguage } from '../contexts/LanguageContext';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import ChatBot from '../components/ChatBot';
import { supabase } from '../supabase';
import {
  Search, AlertTriangle, Ban, Navigation, Info, AlertCircle,
  Zap, Eye, XCircle, Car, Shield, BookOpen, ChevronDown
} from 'lucide-react';
import '../components/style/theme.css';

interface FirestoreSign {
  id: string;
  imageUrl: string;
  nameAr: string; nameFr: string; nameEn: string;
  commentAr: string; commentFr: string; commentEn: string;
  category: 'warning' | 'prohibition' | 'mandatory' | 'information';
  published: boolean;
}

const drivingRules = [
  { id: 'r1', icon: Zap, title: { ar: 'حدود السرعة', fr: 'Limites de vitesse', en: 'Speed Limits' }, content: { ar: 'داخل المدينة: 50 كم/س | خارج المدينة: 80-100 كم/س | الطريق السريع: 120 كم/س', fr: 'En ville: 50 km/h | Hors agglomération: 80-100 km/h | Autoroute: 120 km/h', en: 'In city: 50 km/h | Outside city: 80-100 km/h | Highway: 120 km/h' } },
  { id: 'r2', icon: Shield, title: { ar: 'حزام الأمان', fr: 'Ceinture de sécurité', en: 'Seat Belt' }, content: { ar: 'إلزامي لجميع الركاب في المقاعد الأمامية والخلفية', fr: 'Obligatoire pour tous les passagers à l\'avant et à l\'arrière', en: 'Mandatory for all passengers in front and rear seats' } },
  { id: 'r3', icon: Eye, title: { ar: 'المسافة الآمنة', fr: 'Distance de sécurité', en: 'Safe Distance' }, content: { ar: 'احتفظ بمسافة ثانيتين على الأقل من السيارة التي أمامك', fr: 'Maintenez une distance d\'au moins 2 secondes', en: 'Maintain at least 2 seconds distance from the vehicle ahead' } },
  { id: 'r4', icon: AlertCircle, title: { ar: 'أولوية المرور', fr: 'Priorité', en: 'Right of Way' }, content: { ar: 'الأولوية من اليمين في التقاطعات غير المنظمة', fr: 'Priorité à droite aux intersections non réglementées', en: 'Priority from right at unregulated intersections' } },
  { id: 'r5', icon: XCircle, title: { ar: 'الكحول والمخدرات', fr: 'Alcool et drogues', en: 'Alcohol & Drugs' }, content: { ar: 'ممنوع منعاً باتاً القيادة تحت تأثير الكحول أو المخدرات', fr: 'Strictement interdit de conduire sous l\'influence d\'alcool', en: 'Strictly prohibited to drive under influence of alcohol or drugs' } },
  { id: 'r6', icon: Car, title: { ar: 'التجاوز', fr: 'Dépassement', en: 'Overtaking' }, content: { ar: 'يُسمح بالتجاوز فقط عندما يكون الطريق واضحاً وآمناً', fr: 'Le dépassement n\'est autorisé que lorsque la route est claire', en: 'Overtaking allowed only when road is clear and safe' } }
];

const CATEGORY_COLORS: Record<string, string> = {
  warning: '#F59E0B',
  prohibition: '#EF4444',
  mandatory: '#3B82F6',
  information: '#10B981',
};

const CATEGORY_BG: Record<string, string> = {
  warning: 'rgba(245,158,11,0.1)',
  prohibition: 'rgba(239,68,68,0.1)',
  mandatory: 'rgba(59,130,246,0.1)',
  information: 'rgba(16,185,129,0.1)',
};

const LearningMaterialsContent = () => {
  const { language } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [signs, setSigns] = useState<FirestoreSign[]>([]);
  const [signsLoading, setSignsLoading] = useState(true);

  useEffect(() => {
    supabase.from('trafficSigns').select('*').eq('published', true)
      .then(({ data, error }) => {
        if (error) console.error(error);
        setSigns((data || []) as FirestoreSign[]);
      })
      .finally(() => setSignsLoading(false));
  }, []);

  const t = (ar: string, fr: string, en: string) => language === 'ar' ? ar : language === 'fr' ? fr : en;

  const categoryLabel = (cat: string) => {
    if (cat === 'warning') return t('تحذيرية', 'Avertissement', 'Warning');
    if (cat === 'prohibition') return t('منع', 'Interdiction', 'Prohibition');
    if (cat === 'mandatory') return t('إلزامية', 'Obligatoire', 'Mandatory');
    return t('إعلامية', 'Information', 'Information');
  };

  const filtered = signs.filter(s => {
    const q = searchQuery.toLowerCase();
    return s.nameAr.toLowerCase().includes(q) || s.nameFr.toLowerCase().includes(q) || s.nameEn.toLowerCase().includes(q);
  });

  const displayed = activeTab === 'all' ? filtered : filtered.filter(s => s.category === activeTab);

  const tabs = [
    { id: 'all',         label: t('الكل', 'Tous', 'All'),                  icon: BookOpen,      count: filtered.length },
    { id: 'warning',     label: t('تحذيرية', 'Avertissement', 'Warning'),  icon: AlertTriangle, count: filtered.filter(s => s.category === 'warning').length },
    { id: 'prohibition', label: t('منع', 'Interdiction', 'Prohibition'),   icon: Ban,           count: filtered.filter(s => s.category === 'prohibition').length },
    { id: 'mandatory',   label: t('إلزامية', 'Obligatoire', 'Mandatory'),  icon: Navigation,    count: filtered.filter(s => s.category === 'mandatory').length },
    { id: 'information', label: t('إعلامية', 'Information', 'Information'), icon: Info,         count: filtered.filter(s => s.category === 'information').length },
  ];

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-darkest)', color: 'var(--text-primary)' }}>
      <Navbar />

      {/* Background glow */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
        <div style={{ position: 'absolute', top: '15%', right: '10%', width: 500, height: 500, background: 'radial-gradient(circle, rgba(245,166,35,0.06) 0%, transparent 70%)', borderRadius: '50%' }} />
      </div>

      <main style={{ position: 'relative', zIndex: 1, maxWidth: 1280, margin: '0 auto', padding: '100px 1.5rem 4rem' }}>

        {/* Header */}
        <div style={{ marginBottom: '3rem', textAlign: 'center' }}>
          <div className="section-label" style={{ display: 'inline-flex', marginBottom: '1rem' }}>
            <BookOpen size={13} />
            {t('المواد التعليمية', 'Matériel pédagogique', 'Learning Materials')}
          </div>
          <h1 className="section-title" style={{ marginBottom: '1rem' }}>
            {t('علامات المرور و', 'Panneaux et ', 'Traffic Signs &')}{' '}
            <span style={{ background: 'var(--grad-gold)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              {t('قواعد السياقة', 'Règles de conduite', 'Driving Rules')}
            </span>
          </h1>
          <p className="section-subtitle" style={{ margin: '0 auto' }}>
            {t('تعلم كل ما تحتاجه للنجاح في امتحان رخصة القيادة', 'Apprenez tout ce qu\'il faut pour réussir votre examen', 'Learn everything you need to pass your driving license exam')}
          </p>
        </div>

        {/* Search Bar */}
        <div style={{ position: 'relative', maxWidth: 560, margin: '0 auto 3rem', }}>
          <Search size={18} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder={t('ابحث عن علامة...', 'Rechercher un panneau...', 'Search for a sign...')}
            className="input-pro"
            style={{ paddingLeft: 46, paddingRight: 16 }}
          />
        </div>

        {/* ═══ DRIVING RULES ══════════════════════════════════ */}
        <section style={{ marginBottom: '4rem' }}>
          <h2 style={{ fontSize: '1.375rem', fontWeight: 800, color: 'var(--text-white)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: 10 }}>
            <Shield size={20} style={{ color: 'var(--primary)' }} />
            {t('قواعد السياقة الأساسية', 'Règles de conduite de base', 'Basic Driving Rules')}
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
            {drivingRules.map(rule => (
              <div key={rule.id} className="glass-card" style={{
                padding: '1.25rem', display: 'flex', gap: '1rem', alignItems: 'flex-start',
                transition: 'all 0.2s ease',
              }}
                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--border-gold)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = ''; }}
              >
                <div style={{
                  width: 44, height: 44, borderRadius: 'var(--radius-md)', flexShrink: 0,
                  background: 'rgba(245,166,35,0.1)', border: '1px solid var(--border-gold)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)',
                }}>
                  <rule.icon size={20} />
                </div>
                <div>
                  <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--text-white)', marginBottom: 4 }}>
                    {rule.title[language as 'ar' | 'fr' | 'en']}
                  </h3>
                  <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                    {rule.content[language as 'ar' | 'fr' | 'en']}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ═══ TRAFFIC SIGNS ══════════════════════════════════ */}
        <section>
          <h2 style={{ fontSize: '1.375rem', fontWeight: 800, color: 'var(--text-white)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: 10 }}>
            <AlertTriangle size={20} style={{ color: 'var(--primary)' }} />
            {t('علامات المرور', 'Panneaux de signalisation', 'Traffic Signs')}
          </h2>

          {/* Tab filters */}
          <div style={{ display: 'flex', gap: 8, marginBottom: '1.5rem', flexWrap: 'wrap' }}>
            {tabs.map(tab => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 7,
                    padding: '8px 16px',
                    background: active ? 'rgba(245,166,35,0.12)' : 'rgba(255,255,255,0.04)',
                    border: `1.5px solid ${active ? 'var(--primary)' : 'var(--border)'}`,
                    borderRadius: 'var(--radius-full)',
                    color: active ? 'var(--primary)' : 'var(--text-secondary)',
                    fontSize: '0.8125rem', fontWeight: 600, cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <Icon size={14} />
                  {tab.label}
                  <span style={{
                    padding: '1px 7px', borderRadius: 'var(--radius-full)',
                    background: active ? 'var(--primary)' : 'var(--bg-mid)',
                    color: active ? '#000' : 'var(--text-muted)',
                    fontSize: '0.7rem', fontWeight: 700,
                  }}>
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Signs grid */}
          {signsLoading ? (
            <div style={{ padding: '4rem', textAlign: 'center' }}>
              <div style={{
                width: 36, height: 36, margin: '0 auto 12px',
                border: '3px solid var(--border)', borderTopColor: 'var(--primary)',
                borderRadius: '50%', animation: 'spin-slow 0.7s linear infinite',
              }} />
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                {t('جاري التحميل...', 'Chargement...', 'Loading...')}
              </p>
            </div>
          ) : displayed.length === 0 ? (
            <div style={{
              padding: '4rem', textAlign: 'center',
              background: 'var(--grad-card)', border: '1px solid var(--border)',
              borderRadius: 'var(--radius-xl)',
            }}>
              <AlertCircle size={40} style={{ color: 'var(--text-muted)', margin: '0 auto 12px' }} />
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9375rem' }}>
                {signs.length === 0
                  ? t('لم يتم إضافة علامات مرور بعد', 'Aucun panneau ajouté', 'No traffic signs added yet')
                  : t('لم يتم العثور على نتائج', 'Aucun résultat trouvé', 'No results found')}
              </p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '1rem' }}>
              {displayed.map(sign => {
                const color = CATEGORY_COLORS[sign.category];
                const bg = CATEGORY_BG[sign.category];
                return (
                  <div
                    key={sign.id}
                    style={{
                      background: 'var(--grad-card)', border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-lg)', padding: '1.25rem', textAlign: 'center',
                      transition: 'all 0.2s ease', cursor: 'default',
                    }}
                    onMouseEnter={e => {
                      const el = e.currentTarget as HTMLDivElement;
                      el.style.borderColor = color + '60';
                      el.style.transform = 'translateY(-3px)';
                      el.style.boxShadow = `0 12px 32px ${color}20`;
                    }}
                    onMouseLeave={e => {
                      const el = e.currentTarget as HTMLDivElement;
                      el.style.borderColor = '';
                      el.style.transform = '';
                      el.style.boxShadow = '';
                    }}
                  >
                    {/* Image */}
                    <div style={{
                      width: 90, height: 90, margin: '0 auto 0.875rem',
                      background: bg, borderRadius: 'var(--radius-md)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      border: `1.5px solid ${color}30`, overflow: 'hidden',
                    }}>
                      <img src={sign.imageUrl} alt={sign.nameAr} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                    </div>

                    {/* Category badge */}
                    <span style={{
                      display: 'inline-block', fontSize: '0.65rem', fontWeight: 700,
                      padding: '2px 10px', borderRadius: 'var(--radius-full)',
                      background: bg, color: color,
                      border: `1px solid ${color}30`,
                      marginBottom: 8,
                    }}>
                      {categoryLabel(sign.category)}
                    </span>

                    {/* Name */}
                    <h3 style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-white)', marginBottom: 4, lineHeight: 1.3 }}>
                      {language === 'ar' ? sign.nameAr : language === 'fr' ? (sign.nameFr || sign.nameAr) : (sign.nameEn || sign.nameAr)}
                    </h3>

                    {/* Comment */}
                    {(sign.commentAr || sign.commentFr || sign.commentEn) && (
                      <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                        {language === 'ar' ? sign.commentAr : language === 'fr' ? (sign.commentFr || sign.commentAr) : (sign.commentEn || sign.commentAr)}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Bottom Stats */}
          {!signsLoading && signs.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem', marginTop: '2.5rem' }}>
              {[
                { cat: 'warning',     Icon: AlertTriangle, label: t('تحذيرية', 'Avertissement', 'Warning') },
                { cat: 'prohibition', Icon: Ban,           label: t('منع', 'Interdiction', 'Prohibition') },
                { cat: 'mandatory',   Icon: Navigation,    label: t('إلزامية', 'Obligatoire', 'Mandatory') },
                { cat: 'information', Icon: Info,          label: t('إعلامية', 'Information', 'Information') },
              ].map(({ cat, Icon, label }) => (
                <div key={cat} style={{
                  background: 'var(--grad-card)', border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-lg)', padding: '1.25rem', textAlign: 'center',
                }}>
                  <Icon size={22} style={{ color: CATEGORY_COLORS[cat], margin: '0 auto 8px' }} />
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: CATEGORY_COLORS[cat] }}>
                    {signs.filter(s => s.category === cat).length}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>{label}</div>
                </div>
              ))}
            </div>
          )}
        </section>

      </main>

      <ChatBot />
      <Footer />
    </div>
  );
};

const LearningMaterials = () => (
  <LanguageProvider>
    <LearningMaterialsContent />
  </LanguageProvider>
);

export default LearningMaterials;
