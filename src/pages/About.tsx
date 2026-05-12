import { LanguageProvider, useLanguage } from '../contexts/LanguageContext';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import '../components/style/theme.css';
import {
  Award, Users, Car, Target, CheckCircle,
  GraduationCap, Shield, Star, TrendingUp, BookOpen, Clock
} from 'lucide-react';

const AboutContent = () => {
  const { language } = useLanguage();

  const t = (ar: string, fr: string, en: string) =>
    language === 'ar' ? ar : language === 'fr' ? fr : en;

  const stats = [
    {
      value: '15+',
      labelAr: 'سنوات خبرة',
      labelFr: 'Ans d\'expérience',
      labelEn: 'Years Experience',
    },
    {
      value: '5000+',
      labelAr: 'طالب ناجح',
      labelFr: 'Étudiants diplômés',
      labelEn: 'Graduates',
    },
    {
      value: '98%',
      labelAr: 'نسبة النجاح',
      labelFr: 'Taux de réussite',
      labelEn: 'Pass Rate',
    },
    {
      value: '3',
      labelAr: 'أنواع الرخص',
      labelFr: 'Types de permis',
      labelEn: 'License Types',
    },
  ];

  const features = [
    {
      icon: GraduationCap,
      titleAr: 'مدربون معتمدون',
      titleFr: 'Instructeurs certifiés',
      titleEn: 'Certified Instructors',
      descAr: 'فريق من أفضل المدربين المعتمدين حكومياً ذوي الخبرة الواسعة',
      descFr: 'Une équipe des meilleurs instructeurs certifiés par l\'État avec une vaste expérience',
      descEn: 'A team of the best government-certified instructors with extensive experience',
    },
    {
      icon: Car,
      titleAr: 'مركبات حديثة',
      titleFr: 'Véhicules modernes',
      titleEn: 'Modern Vehicles',
      descAr: 'أسطول من المركبات الحديثة المجهزة بأحدث أنظمة السلامة والقيادة المزدوجة',
      descFr: 'Flotte de véhicules modernes équipés des derniers systèmes de sécurité et double commande',
      descEn: 'Fleet of modern vehicles equipped with the latest safety systems and dual controls',
    },
    {
      icon: BookOpen,
      titleAr: 'برنامج شامل',
      titleFr: 'Programme complet',
      titleEn: 'Comprehensive Program',
      descAr: 'منهج تدريسي متكامل يشمل النظري والعملي وفق أحدث معايير تعليم القيادة',
      descFr: 'Programme d\'enseignement intégré couvrant théorie et pratique selon les dernières normes',
      descEn: 'Integrated curriculum covering theory and practice per the latest driving education standards',
    },
    {
      icon: Shield,
      titleAr: 'الأمان أولاً',
      titleFr: 'Sécurité avant tout',
      titleEn: 'Safety First',
      descAr: 'نضع سلامة الطلاب في مقدمة أولوياتنا في كل جلسة تدريبية',
      descFr: 'Nous plaçons la sécurité des étudiants au premier plan de nos priorités à chaque séance',
      descEn: 'We place student safety at the forefront of our priorities in every training session',
    },
    {
      icon: Clock,
      titleAr: 'جداول مرنة',
      titleFr: 'Horaires flexibles',
      titleEn: 'Flexible Schedules',
      descAr: 'اختر أوقات التدريب التي تناسب جدولك الزمني بكل مرونة',
      descFr: 'Choisissez les horaires de formation qui correspondent à votre emploi du temps',
      descEn: 'Choose training times that fit your schedule with full flexibility',
    },
    {
      icon: Star,
      titleAr: 'دعم مستمر',
      titleFr: 'Support continu',
      titleEn: 'Continuous Support',
      descAr: 'فريق دعم دائم لمساعدتك في كل خطوة من رحلتك التعليمية',
      descFr: 'Équipe de support permanente pour vous aider à chaque étape de votre parcours',
      descEn: 'A permanent support team to help you at every step of your learning journey',
    },
  ];

  const values = [
    { ar: 'الجودة في التدريب', fr: 'Qualité de formation', en: 'Quality Training' },
    { ar: 'الأمان أولاً', fr: 'Sécurité d\'abord', en: 'Safety First' },
    { ar: 'الاحترافية', fr: 'Professionnalisme', en: 'Professionalism' },
    { ar: 'الالتزام بالمواعيد', fr: 'Ponctualité', en: 'Punctuality' },
    { ar: 'دعم مستمر', fr: 'Support continu', en: 'Continuous Support' },
    { ar: 'الشفافية', fr: 'Transparence', en: 'Transparency' },
  ];

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-darkest)', color: 'var(--text-primary)' }}>
      <Navbar />

      {/* ── Hero Banner ── */}
      <section style={{
        position: 'relative',
        paddingTop: '140px',
        paddingBottom: '80px',
        overflow: 'hidden',
      }}>
        {/* Background glow blobs */}
        <div style={{
          position: 'absolute', top: '-80px', left: '50%', transform: 'translateX(-50%)',
          width: '700px', height: '700px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(245,166,35,0.07) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', top: '10%', right: '-150px',
          width: '400px', height: '400px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,107,53,0.05) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        <div className="section-container" style={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
          <span className="section-label">
            <Award size={13} />
            {t('من نحن', 'À propos', 'About Us')}
          </span>
          <h1 className="section-title" style={{ marginBottom: '1.5rem' }}>
            {t('نحن نصنع', 'Nous façonnons', 'We Shape')}{' '}
            <span className="gold-text">
              {t('قادة الطريق', 'les conducteurs de demain', 'Tomorrow\'s Drivers')}
            </span>
          </h1>
          <p className="section-subtitle" style={{ margin: '0 auto 2.5rem', maxWidth: '650px' }}>
            {t(
              'مدرسة قيادة رائدة منذ 2009، نقدم تدريباً عالي الجودة بأساليب حديثة لضمان نجاحك في الحصول على رخصة السياقة',
              'École de conduite leader depuis 2009, nous offrons une formation de haute qualité avec des méthodes modernes pour garantir votre réussite',
              'A leading driving school since 2009, offering high-quality training with modern methods to ensure your success in obtaining a driver\'s license',
            )}
          </p>

          {/* Decorative divider */}
          <div style={{
            width: '80px', height: '3px',
            background: 'var(--grad-gold)',
            borderRadius: '2px',
            margin: '0 auto',
          }} />
        </div>
      </section>

      {/* ── Stats Section ── */}
      <section style={{ padding: '0 0 80px' }}>
        <div className="section-container">
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1.5rem',
          }}>
            {stats.map((s, i) => (
              <div
                key={i}
                className="glass-card"
                style={{
                  padding: '2rem',
                  textAlign: 'center',
                  border: '1px solid var(--border-gold)',
                  transition: 'transform 0.3s, box-shadow 0.3s',
                  cursor: 'default',
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-6px)';
                  (e.currentTarget as HTMLDivElement).style.boxShadow = 'var(--shadow-gold)';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)';
                  (e.currentTarget as HTMLDivElement).style.boxShadow = 'none';
                }}
              >
                <div className="gold-text" style={{ fontSize: '2.75rem', fontWeight: 800, lineHeight: 1 }}>
                  {s.value}
                </div>
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem', marginTop: '0.5rem', fontWeight: 500 }}>
                  {t(s.labelAr, s.labelFr, s.labelEn)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features Grid ── */}
      <section style={{ padding: '80px 0', background: 'var(--bg-dark)' }}>
        <div className="section-container">
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <span className="section-label">
              <TrendingUp size={13} />
              {t('لماذا نحن', 'Pourquoi nous', 'Why Us')}
            </span>
            <h2 className="section-title" style={{ marginBottom: '1rem' }}>
              {t('ما الذي يميّزنا', 'Ce qui nous distingue', 'What Sets Us Apart')}
            </h2>
            <p className="section-subtitle" style={{ margin: '0 auto' }}>
              {t(
                'نجمع بين الخبرة والتكنولوجيا لنقدم تجربة تعليمية لا مثيل لها',
                'Nous combinons expérience et technologie pour offrir une expérience d\'apprentissage incomparable',
                'We combine experience and technology to deliver an unmatched learning experience',
              )}
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '1.5rem',
          }}>
            {features.map((feat, i) => (
              <div
                key={i}
                className="glass-card"
                style={{
                  padding: '2rem',
                  transition: 'transform 0.3s, border-color 0.3s, box-shadow 0.3s',
                  cursor: 'default',
                }}
                onMouseEnter={e => {
                  const el = e.currentTarget as HTMLDivElement;
                  el.style.transform = 'translateY(-6px)';
                  el.style.borderColor = 'var(--border-gold)';
                  el.style.boxShadow = 'var(--shadow-gold)';
                }}
                onMouseLeave={e => {
                  const el = e.currentTarget as HTMLDivElement;
                  el.style.transform = 'translateY(0)';
                  el.style.borderColor = 'var(--border)';
                  el.style.boxShadow = 'none';
                }}
              >
                <div style={{
                  width: '3.25rem', height: '3.25rem', borderRadius: '14px',
                  background: 'rgba(245,166,35,0.1)',
                  border: '1px solid var(--border-gold)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginBottom: '1.25rem',
                }}>
                  <feat.icon size={22} color="var(--primary)" />
                </div>
                <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-white)', marginBottom: '0.625rem' }}>
                  {t(feat.titleAr, feat.titleFr, feat.titleEn)}
                </h3>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                  {t(feat.descAr, feat.descFr, feat.descEn)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Mission Section (two-column) ── */}
      <section style={{ padding: '80px 0' }}>
        <div className="section-container">
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
            gap: '3rem',
            alignItems: 'center',
          }}>
            {/* Text side */}
            <div>
              <span className="section-label">
                <Target size={13} />
                {t('رؤيتنا ورسالتنا', 'Notre vision & mission', 'Our Vision & Mission')}
              </span>
              <h2 className="section-title" style={{ marginBottom: '1.25rem' }}>
                {t('نرسم طريق', 'Tracer la voie vers', 'Paving the road to')}{' '}
                <span className="gold-text">{t('نجاحك', 'votre succès', 'your success')}</span>
              </h2>
              <p style={{ color: 'var(--text-secondary)', lineHeight: 1.8, marginBottom: '2rem' }}>
                {t(
                  'رؤيتنا هي أن نكون المرجع الأول في تعليم القيادة بالجزائر، من خلال تقديم برامج تدريبية متكاملة تجمع بين أعلى معايير السلامة والتكنولوجيا الحديثة.',
                  'Notre vision est d\'être la référence en matière d\'éducation à la conduite en Algérie, en proposant des programmes de formation intégrés alliant les plus hauts standards de sécurité et la technologie moderne.',
                  'Our vision is to be the premier reference in driving education in Algeria, through integrated training programs combining the highest safety standards with modern technology.',
                )}
              </p>

              <div style={{ display: 'grid', gap: '0.875rem' }}>
                {values.map((v, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
                    <CheckCircle size={18} color="var(--primary)" style={{ flexShrink: 0 }} />
                    <span style={{ color: 'var(--text-primary)', fontSize: '0.9375rem', fontWeight: 500 }}>
                      {t(v.ar, v.fr, v.en)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Visual side */}
            <div style={{ position: 'relative' }}>
              {/* Main card */}
              <div
                className="glass-card"
                style={{
                  padding: '2.5rem',
                  border: '1px solid var(--border-gold)',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                {/* Gold accent top bar */}
                <div style={{
                  position: 'absolute', top: 0, left: 0, right: 0, height: '3px',
                  background: 'var(--grad-gold)',
                }} />

                <div style={{
                  width: '4rem', height: '4rem', borderRadius: '50%',
                  background: 'var(--grad-gold)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginBottom: '1.5rem',
                }}>
                  <Award size={28} color="#000" />
                </div>

                <h3 style={{ fontSize: '1.375rem', fontWeight: 700, color: 'var(--text-white)', marginBottom: '1rem' }}>
                  {t('رؤيتنا', 'Notre vision', 'Our Vision')}
                </h3>
                <p style={{ color: 'var(--text-secondary)', lineHeight: 1.8, marginBottom: '2rem' }}>
                  {t(
                    'نسعى لأن يكون كل طالب قادراً على القيادة بأمان وثقة، مسلحاً بالمعرفة والمهارة اللازمتين للتنقل في طرق الجزائر وما بعدها.',
                    'Nous aspirons à ce que chaque étudiant soit capable de conduire en toute sécurité et confiance, armé des connaissances et compétences nécessaires.',
                    'We aspire for every student to drive safely and confidently, armed with the knowledge and skills needed to navigate Algeria\'s roads and beyond.',
                  )}
                </p>

                {/* Mini stat row */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  {[
                    { value: '15+', label: t('سنة خبرة', 'ans d\'expérience', 'years exp.') },
                    { value: '98%', label: t('نسبة نجاح', 'taux de réussite', 'pass rate') },
                  ].map((item, i) => (
                    <div
                      key={i}
                      style={{
                        background: 'rgba(245,166,35,0.07)',
                        border: '1px solid var(--border-gold)',
                        borderRadius: 'var(--radius-md)',
                        padding: '1rem',
                        textAlign: 'center',
                      }}
                    >
                      <div className="gold-text" style={{ fontSize: '1.75rem', fontWeight: 800 }}>{item.value}</div>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.8125rem', marginTop: '2px' }}>{item.label}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Floating badge */}
              <div style={{
                position: 'absolute', bottom: '-18px', right: '-18px',
                background: 'var(--grad-gold)',
                borderRadius: '50%',
                width: '80px', height: '80px',
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                boxShadow: 'var(--shadow-gold)',
              }}>
                <span style={{ fontSize: '1.125rem', fontWeight: 800, color: '#000', lineHeight: 1 }}>5K+</span>
                <span style={{ fontSize: '0.6rem', fontWeight: 600, color: '#000' }}>
                  {t('طالب', 'élèves', 'students')}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

const About = () => (
  <LanguageProvider>
    <AboutContent />
  </LanguageProvider>
);

export default About;
