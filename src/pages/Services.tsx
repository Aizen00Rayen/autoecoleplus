import { LanguageProvider, useLanguage } from '../contexts/LanguageContext';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import '../components/style/theme.css';
import {
  GraduationCap, Car, BookOpen, Users, Clock, Award,
  Shield, Headphones, CheckCircle, ArrowRight, Bike,
  ClipboardList, UserCheck, FileCheck, ChevronDown, ChevronUp,
} from 'lucide-react';
import { useState } from 'react';

const ServicesContent = () => {
  const { language } = useLanguage();
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const t = (ar: string, fr: string, en: string) =>
    language === 'ar' ? ar : language === 'fr' ? fr : en;

  /* ─────────── License Programs ─────────── */
  const licensePrograms = [
    {
      type: 'A',
      icon: Bike,
      accentColor: '#F5A623',
      nameAr: 'رخصة A',
      nameFr: 'Permis A',
      nameEn: 'License A',
      descAr: 'دراجات نارية وعجلات ثلاثية',
      descFr: 'Motos et tricycles motorisés',
      descEn: 'Motorcycles & motor tricycles',
      price: '18 000',
      featuresAr: ['20 حصة تدريبية', 'نظرية مكثفة', 'تدريب ميداني', 'إعداد للامتحان'],
      featuresFr: ['20 séances de formation', 'Théorie intensive', 'Formation terrain', 'Préparation examen'],
      featuresEn: ['20 training sessions', 'Intensive theory', 'Field training', 'Exam preparation'],
      popular: false,
    },
    {
      type: 'B',
      icon: Car,
      accentColor: '#F5A623',
      nameAr: 'رخصة B',
      nameFr: 'Permis B',
      nameEn: 'License B',
      descAr: 'سيارات خفيفة (حتى 3.5 طن)',
      descFr: 'Véhicules légers (jusqu\'à 3,5 t)',
      descEn: 'Light vehicles (up to 3.5 t)',
      price: '22 000',
      featuresAr: ['30 حصة تدريبية', 'قاعات نظرية حديثة', 'سيارة بقيادة مزدوجة', 'اختبارات تجريبية', 'دعم حتى الامتحان'],
      featuresFr: ['30 séances de formation', 'Salles théoriques modernes', 'Voiture à double commande', 'Tests d\'entraînement', 'Soutien jusqu\'à l\'examen'],
      featuresEn: ['30 training sessions', 'Modern theory rooms', 'Dual-control car', 'Practice tests', 'Support until exam'],
      popular: true,
    },
    {
      type: 'C',
      icon: GraduationCap,
      accentColor: '#F5A623',
      nameAr: 'رخصة C',
      nameFr: 'Permis C',
      nameEn: 'License C',
      descAr: 'شاحنات ثقيلة (أكثر من 3.5 طن)',
      descFr: 'Poids lourds (plus de 3,5 t)',
      descEn: 'Heavy trucks (over 3.5 t)',
      price: '35 000',
      featuresAr: ['40 حصة تدريبية', 'تدريب على شاحنات حقيقية', 'دورة خاصة بالسلامة', 'شهادة معتمدة', 'دعم مستمر'],
      featuresFr: ['40 séances de formation', 'Formation sur vrais camions', 'Stage sécurité dédié', 'Certificat accrédité', 'Support continu'],
      featuresEn: ['40 training sessions', 'Real truck training', 'Dedicated safety course', 'Accredited certificate', 'Continuous support'],
      popular: false,
    },
  ];

  /* ─────────── Process Steps ─────────── */
  const steps = [
    {
      num: '01', icon: ClipboardList,
      titleAr: 'سجّل', titleFr: 'S\'inscrire', titleEn: 'Register',
      descAr: 'أكمل استمارة التسجيل وقدّم وثائقك', descFr: 'Remplissez le formulaire et soumettez vos documents', descEn: 'Complete the registration form and submit your documents',
    },
    {
      num: '02', icon: UserCheck,
      titleAr: 'اختر مدرّبك', titleFr: 'Choisir l\'instructeur', titleEn: 'Choose Instructor',
      descAr: 'اختر من بين نخبة مدربينا المعتمدين', descFr: 'Choisissez parmi nos instructeurs certifiés', descEn: 'Pick from our certified instructor roster',
    },
    {
      num: '03', icon: BookOpen,
      titleAr: 'الدروس النظرية', titleFr: 'Cours théoriques', titleEn: 'Theory Lessons',
      descAr: 'تعلّم قواعد المرور وإشارات الطريق', descFr: 'Apprenez le code de la route et la signalisation', descEn: 'Learn traffic rules and road signs',
    },
    {
      num: '04', icon: Car,
      titleAr: 'التدريب العملي', titleFr: 'Formation pratique', titleEn: 'Practical Training',
      descAr: 'حصص قيادة ميدانية على مركبات حديثة', descFr: 'Séances de conduite sur véhicules modernes', descEn: 'Field driving sessions on modern vehicles',
    },
    {
      num: '05', icon: FileCheck,
      titleAr: 'الامتحان', titleFr: 'L\'examen', titleEn: 'The Exam',
      descAr: 'أدِّ امتحان النظري والتطبيقي بثقة', descFr: 'Passez l\'examen théorique et pratique avec confiance', descEn: 'Take the theory and practical exam with confidence',
    },
    {
      num: '06', icon: Award,
      titleAr: 'احصل على رخصتك', titleFr: 'Obtenez votre permis', titleEn: 'Get Your License',
      descAr: 'استلم رخصتك واطلق حريتك على الطريق', descFr: 'Recevez votre permis et prenez la route en liberté', descEn: 'Receive your license and hit the road in freedom',
    },
  ];

  /* ─────────── Benefits ─────────── */
  const benefits = [
    { icon: Clock, titleAr: 'جدولة مرنة', titleFr: 'Planification flexible', titleEn: 'Flexible Scheduling', descAr: 'صباحاً أو مساءً، حدّد أوقاتك بحرية', descFr: 'Matin ou soir, choisissez librement', descEn: 'Morning or evening, choose freely' },
    { icon: Award, titleAr: 'ضمان النجاح', titleFr: 'Garantie de réussite', titleEn: 'Success Guarantee', descAr: 'نسبة نجاح 98% في الامتحانات الرسمية', descFr: '98% de réussite aux examens officiels', descEn: '98% pass rate on official exams' },
    { icon: Shield, titleAr: 'تأمين شامل', titleFr: 'Assurance complète', titleEn: 'Full Insurance', descAr: 'جميع مركباتنا مؤمنة بالكامل', descFr: 'Tous nos véhicules sont entièrement assurés', descEn: 'All our vehicles are fully insured' },
    { icon: Headphones, titleAr: 'دعم مستمر', titleFr: 'Support continu', titleEn: 'Continuous Support', descAr: 'فريق دعم متاح لأي استفسار', descFr: 'Équipe disponible pour toute question', descEn: 'Support team available for any query' },
    { icon: Users, titleAr: 'مجموعات صغيرة', titleFr: 'Petits groupes', titleEn: 'Small Groups', descAr: 'عدد محدود لضمان جودة التدريب', descFr: 'Nombre limité pour garantir la qualité', descEn: 'Limited numbers to ensure quality' },
    { icon: BookOpen, titleAr: 'مواد رقمية', titleFr: 'Supports numériques', titleEn: 'Digital Materials', descAr: 'وصول إلى تطبيق التعلم وموارد رقمية', descFr: 'Accès à l\'app d\'apprentissage et ressources', descEn: 'Access to learning app and digital resources' },
  ];

  /* ─────────── FAQs ─────────── */
  const faqs = [
    {
      qAr: 'كم من الوقت يستغرق الحصول على رخصة القيادة؟',
      qFr: 'Combien de temps faut-il pour obtenir le permis de conduire?',
      qEn: 'How long does it take to get a driver\'s license?',
      aAr: 'يتراوح الوقت عادةً بين 2 إلى 4 أشهر حسب نوع الرخصة والجدول الزمني للطالب.',
      aFr: 'La durée varie généralement entre 2 et 4 mois selon le type de permis et l\'emploi du temps de l\'étudiant.',
      aEn: 'It typically ranges from 2 to 4 months depending on the license type and student\'s schedule.',
    },
    {
      qAr: 'هل يمكنني تغيير المدرّب إذا لم يناسبني؟',
      qFr: 'Puis-je changer d\'instructeur si ça ne convient pas?',
      qEn: 'Can I change instructors if it doesn\'t work out?',
      aAr: 'نعم، بإمكانك طلب تغيير المدرّب في أي وقت وسنحرص على مطابقة أفضل.',
      aFr: 'Oui, vous pouvez demander un changement d\'instructeur à tout moment et nous veillerons à la meilleure correspondance.',
      aEn: 'Yes, you can request an instructor change at any time and we\'ll ensure the best match.',
    },
    {
      qAr: 'ماذا يحدث إذا رسبت في الامتحان؟',
      qFr: 'Que se passe-t-il si j\'échoue à l\'examen?',
      qEn: 'What happens if I fail the exam?',
      aAr: 'نقدم حصصاً إضافية مجانية ودعماً كاملاً حتى تجتاز الامتحان بنجاح.',
      aFr: 'Nous offrons des séances supplémentaires gratuites et un soutien complet jusqu\'à la réussite.',
      aEn: 'We provide free additional sessions and full support until you pass.',
    },
    {
      qAr: 'ما الوثائق المطلوبة للتسجيل؟',
      qFr: 'Quels sont les documents nécessaires pour s\'inscrire?',
      qEn: 'What documents are needed to register?',
      aAr: 'بطاقة الهوية الوطنية، صور شخصية، شهادة طبية، وإيصال دفع الرسوم.',
      aFr: 'Carte d\'identité nationale, photos d\'identité, certificat médical, et reçu de paiement.',
      aEn: 'National ID card, ID photos, medical certificate, and payment receipt.',
    },
  ];

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-darkest)', color: 'var(--text-primary)' }}>
      <Navbar />

      {/* ── Hero ── */}
      <section style={{ position: 'relative', paddingTop: '140px', paddingBottom: '80px', overflow: 'hidden' }}>
        <div style={{
          position: 'absolute', top: '-100px', left: '50%', transform: 'translateX(-50%)',
          width: '800px', height: '800px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(245,166,35,0.06) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />
        <div className="section-container" style={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
          <span className="section-label">
            <GraduationCap size={13} />
            {t('خدماتنا', 'Nos services', 'Our Services')}
          </span>
          <h1 className="section-title" style={{ marginBottom: '1.5rem' }}>
            {t('برامج', 'Programmes', 'Programs')}{' '}
            <span className="gold-text">{t('تدريب متميزة', 'de formation d\'excellence', 'of Excellence')}</span>
          </h1>
          <p className="section-subtitle" style={{ margin: '0 auto 2.5rem', maxWidth: '600px' }}>
            {t(
              'نقدم مجموعة شاملة من برامج التدريب المصممة لضمان حصولك على رخصة القيادة بسهولة وثقة',
              'Nous proposons une gamme complète de programmes conçus pour vous aider à obtenir votre permis facilement',
              'We offer a comprehensive range of training programs designed to help you earn your license easily and confidently',
            )}
          </p>
          <div style={{ width: '80px', height: '3px', background: 'var(--grad-gold)', borderRadius: '2px', margin: '0 auto' }} />
        </div>
      </section>

      {/* ── License Programs ── */}
      <section style={{ padding: '0 0 100px' }}>
        <div className="section-container">
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <span className="section-label">
              <Award size={13} />
              {t('أنواع الرخص', 'Types de permis', 'License Types')}
            </span>
            <h2 className="section-title" style={{ marginBottom: '1rem' }}>
              {t('اختر برنامجك', 'Choisissez votre programme', 'Choose Your Program')}
            </h2>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '1.5rem',
          }}>
            {licensePrograms.map((prog, i) => (
              <div
                key={i}
                className="glass-card"
                style={{
                  position: 'relative',
                  padding: '2rem',
                  border: prog.popular ? '1px solid var(--border-gold)' : '1px solid var(--border)',
                  transition: 'transform 0.3s, box-shadow 0.3s, border-color 0.3s',
                  overflow: 'hidden',
                  cursor: 'default',
                }}
                onMouseEnter={e => {
                  const el = e.currentTarget as HTMLDivElement;
                  el.style.transform = 'translateY(-8px)';
                  el.style.boxShadow = 'var(--shadow-gold)';
                  el.style.borderColor = 'var(--border-gold)';
                }}
                onMouseLeave={e => {
                  const el = e.currentTarget as HTMLDivElement;
                  el.style.transform = 'translateY(0)';
                  el.style.boxShadow = 'none';
                  el.style.borderColor = prog.popular ? 'var(--border-gold)' : 'var(--border)';
                }}
              >
                {/* Top gold bar */}
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: 'var(--grad-gold)' }} />

                {/* Popular badge */}
                {prog.popular && (
                  <div style={{
                    position: 'absolute', top: '1.25rem', right: '1.25rem',
                    background: 'var(--grad-gold)', color: '#000',
                    fontSize: '0.75rem', fontWeight: 700,
                    padding: '3px 10px', borderRadius: 'var(--radius-full)',
                  }}>
                    {t('الأكثر طلباً', 'Le plus demandé', 'Most Popular')}
                  </div>
                )}

                {/* License type badge */}
                <div style={{
                  width: '3.5rem', height: '3.5rem', borderRadius: '50%',
                  background: 'rgba(245,166,35,0.1)',
                  border: '1.5px solid var(--border-gold)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginBottom: '1.25rem',
                  fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary)',
                }}>
                  {prog.type}
                </div>

                <h3 style={{ fontSize: '1.375rem', fontWeight: 700, color: 'var(--text-white)', marginBottom: '0.375rem' }}>
                  {t(prog.nameAr, prog.nameFr, prog.nameEn)}
                </h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                  {t(prog.descAr, prog.descFr, prog.descEn)}
                </p>

                {/* Price */}
                <div style={{ marginBottom: '1.5rem' }}>
                  <span className="gold-text" style={{ fontSize: '2rem', fontWeight: 800 }}>{prog.price}</span>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginLeft: '6px' }}>DZD</span>
                </div>

                {/* Features */}
                <div style={{ display: 'grid', gap: '0.625rem', marginBottom: '2rem' }}>
                  {(t(prog.featuresAr, prog.featuresFr, prog.featuresEn) as unknown as string[]).map((feat: string, fi: number) => (
                    <div key={fi} style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                      <CheckCircle size={15} color="var(--primary)" style={{ flexShrink: 0 }} />
                      <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{feat}</span>
                    </div>
                  ))}
                </div>

                <button
                  className={prog.popular ? 'btn-primary' : 'btn-outline'}
                  style={{ width: '100%', justifyContent: 'center' }}
                >
                  <ArrowRight size={16} />
                  {t('سجّل الآن', 'S\'inscrire maintenant', 'Enroll Now')}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Process Steps ── */}
      <section style={{ padding: '80px 0', background: 'var(--bg-dark)' }}>
        <div className="section-container">
          <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
            <span className="section-label">
              <ClipboardList size={13} />
              {t('كيف نعمل', 'Comment ça marche', 'How It Works')}
            </span>
            <h2 className="section-title" style={{ marginBottom: '1rem' }}>
              {t('مسارك نحو الرخصة', 'Votre parcours vers le permis', 'Your Path to a License')}
            </h2>
            <p className="section-subtitle" style={{ margin: '0 auto' }}>
              {t('6 خطوات بسيطة تفصلك عن رخصتك', '6 étapes simples vous séparent de votre permis', '6 simple steps between you and your license')}
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: '1.25rem',
          }}>
            {steps.map((step, i) => (
              <div
                key={i}
                className="glass-card"
                style={{
                  padding: '1.75rem',
                  position: 'relative',
                  transition: 'transform 0.3s, border-color 0.3s, box-shadow 0.3s',
                  cursor: 'default',
                }}
                onMouseEnter={e => {
                  const el = e.currentTarget as HTMLDivElement;
                  el.style.transform = 'translateY(-5px)';
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
                {/* Step number watermark */}
                <span style={{
                  position: 'absolute', top: '1rem', right: '1.25rem',
                  fontSize: '3rem', fontWeight: 900, color: 'rgba(245,166,35,0.06)',
                  lineHeight: 1, userSelect: 'none',
                }}>
                  {step.num}
                </span>

                <div style={{
                  width: '2.75rem', height: '2.75rem', borderRadius: '12px',
                  background: 'rgba(245,166,35,0.1)', border: '1px solid var(--border-gold)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginBottom: '1rem',
                }}>
                  <step.icon size={18} color="var(--primary)" />
                </div>

                <div className="gold-text" style={{ fontSize: '0.8125rem', fontWeight: 700, marginBottom: '4px' }}>
                  {t('الخطوة', 'Étape', 'Step')} {step.num}
                </div>
                <h3 style={{ fontSize: '1.0625rem', fontWeight: 700, color: 'var(--text-white)', marginBottom: '0.5rem' }}>
                  {t(step.titleAr, step.titleFr, step.titleEn)}
                </h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: 1.6 }}>
                  {t(step.descAr, step.descFr, step.descEn)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Benefits ── */}
      <section style={{ padding: '80px 0' }}>
        <div className="section-container">
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <span className="section-label">
              <Shield size={13} />
              {t('مميزاتنا', 'Nos avantages', 'Our Benefits')}
            </span>
            <h2 className="section-title" style={{ marginBottom: '1rem' }}>
              {t('ما نقدمه لك', 'Ce que nous vous offrons', 'What We Offer You')}
            </h2>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '1.25rem',
          }}>
            {benefits.map((b, i) => (
              <div
                key={i}
                className="glass-card"
                style={{
                  padding: '1.5rem',
                  display: 'flex', alignItems: 'center', gap: '1rem',
                  transition: 'transform 0.3s, border-color 0.3s',
                  cursor: 'default',
                }}
                onMouseEnter={e => {
                  const el = e.currentTarget as HTMLDivElement;
                  el.style.transform = 'translateY(-4px)';
                  el.style.borderColor = 'var(--border-gold)';
                }}
                onMouseLeave={e => {
                  const el = e.currentTarget as HTMLDivElement;
                  el.style.transform = 'translateY(0)';
                  el.style.borderColor = 'var(--border)';
                }}
              >
                <div style={{
                  width: '2.75rem', height: '2.75rem', borderRadius: '12px',
                  background: 'rgba(245,166,35,0.1)', border: '1px solid var(--border-gold)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <b.icon size={18} color="var(--primary)" />
                </div>
                <div>
                  <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-white)', marginBottom: '3px' }}>
                    {t(b.titleAr, b.titleFr, b.titleEn)}
                  </h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                    {t(b.descAr, b.descFr, b.descEn)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section style={{ padding: '80px 0', background: 'var(--bg-dark)' }}>
        <div className="section-container" style={{ maxWidth: '780px' }}>
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <span className="section-label">
              <BookOpen size={13} />
              {t('الأسئلة الشائعة', 'FAQ', 'FAQ')}
            </span>
            <h2 className="section-title" style={{ marginBottom: '1rem' }}>
              {t('أسئلة وأجوبة', 'Questions & Réponses', 'Questions & Answers')}
            </h2>
          </div>

          <div style={{ display: 'grid', gap: '1rem' }}>
            {faqs.map((faq, i) => (
              <div
                key={i}
                className="glass-card"
                style={{
                  overflow: 'hidden',
                  border: openFaq === i ? '1px solid var(--border-gold)' : '1px solid var(--border)',
                  transition: 'border-color 0.3s',
                }}
              >
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  style={{
                    width: '100%', padding: '1.25rem 1.5rem',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem',
                    background: 'transparent', border: 'none', cursor: 'pointer',
                    color: 'var(--text-white)', textAlign: 'left',
                  }}
                >
                  <span style={{ fontWeight: 600, fontSize: '1rem' }}>
                    {t(faq.qAr, faq.qFr, faq.qEn)}
                  </span>
                  {openFaq === i
                    ? <ChevronUp size={18} color="var(--primary)" style={{ flexShrink: 0 }} />
                    : <ChevronDown size={18} color="var(--text-muted)" style={{ flexShrink: 0 }} />
                  }
                </button>
                {openFaq === i && (
                  <div style={{ padding: '0 1.5rem 1.25rem' }}>
                    <div style={{ height: '1px', background: 'var(--border)', marginBottom: '1rem' }} />
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem', lineHeight: 1.7 }}>
                      {t(faq.aAr, faq.aFr, faq.aEn)}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

const Services = () => (
  <LanguageProvider>
    <ServicesContent />
  </LanguageProvider>
);

export default Services;
