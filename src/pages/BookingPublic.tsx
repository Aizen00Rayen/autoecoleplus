import { useState } from 'react';
import { LanguageProvider, useLanguage } from '../contexts/LanguageContext';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { Calendar, Clock, Car, User, Phone, Mail, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import '../components/style/theme.css';

const BookingPublicContent = () => {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);

  const licenseTypes = [
    {
      id: 'B',
      nameAr: 'رخصة B',
      nameFr: 'Permis B',
      nameEn: 'License B',
      descAr: 'سيارات خفيفة',
      descFr: 'Véhicules légers',
      descEn: 'Light vehicles'
    },
    {
      id: 'C',
      nameAr: 'رخصة C',
      nameFr: 'Permis C',
      nameEn: 'License C',
      descAr: 'شاحنات',
      descFr: 'Camions',
      descEn: 'Trucks'
    },
    /*{
      id: 'D',
      nameAr: 'رخصة D',
      nameFr: 'Permis D',
      nameEn: 'License D',
      descAr: 'حافلات',
      descFr: 'Bus',
      descEn: 'Buses'
    },*/
    {
      id: 'A',
      nameAr: 'رخصة A',
      nameFr: 'Permis A',
      nameEn: 'License A',
      descAr: 'دراجات نارية',
      descFr: 'Motos',
      descEn: 'Motorcycles'
    }
  ];

  const steps = [
    {
      titleAr: 'اختر نوع الرخصة',
      titleFr: 'Choisissez le type de permis',
      titleEn: 'Choose License Type',
      icon: Car
    },
    {
      titleAr: 'معلوماتك',
      titleFr: 'Vos informations',
      titleEn: 'Your Information',
      icon: User
    },
    {
      titleAr: 'تأكيد',
      titleFr: 'Confirmation',
      titleEn: 'Confirmation',
      icon: CheckCircle
    }
  ];

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg-darkest)',
      color: 'var(--text-primary)'
    }}>
      <Navbar />

      <main style={{ paddingTop: '100px', paddingBottom: '3rem', paddingLeft: '1.5rem', paddingRight: '1.5rem', maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '3rem', textAlign: 'center' }}>
          <h1 style={{
            fontSize: '3rem',
            fontWeight: 700,
            background: 'var(--grad-gold)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            marginBottom: '1rem'
          }}>
            {language === 'ar' ? 'احجز الآن' : language === 'fr' ? 'Réservez maintenant' : 'Book Now'}
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.125rem', maxWidth: '800px', margin: '0 auto' }}>
            {language === 'ar'
              ? 'ابدأ رحلتك في تعلم القيادة معنا'
              : language === 'fr'
              ? 'Commencez votre parcours d\'apprentissage avec nous'
              : 'Start your driving learning journey with us'
            }
          </p>
        </div>

        {/* Steps Indicator */}
        <div style={{ marginBottom: '3rem' }}>
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            {steps.map((s, index) => {
              const isCompleted = step > index + 1;
              const isCurrent = step === index + 1;
              const isUpcoming = step < index + 1;
              return (
                <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {/* Circle */}
                  <div style={{
                    width: '3rem',
                    height: '3rem',
                    borderRadius: '50%',
                    background: isCompleted
                      ? 'var(--grad-gold)'
                      : isCurrent
                      ? 'transparent'
                      : 'var(--bg-mid)',
                    border: isCurrent
                      ? '2px solid var(--primary)'
                      : isCompleted
                      ? 'none'
                      : '2px solid var(--border)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.3s',
                    boxShadow: isCurrent ? 'var(--shadow-gold)' : isCompleted ? 'var(--shadow-gold)' : 'none',
                    flexShrink: 0
                  }}>
                    <s.icon style={{
                      width: '1.25rem',
                      height: '1.25rem',
                      color: isCompleted ? '#000' : isCurrent ? 'var(--primary)' : 'var(--text-muted)'
                    }} />
                  </div>
                  {/* Label */}
                  <span style={{
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    color: isCompleted || isCurrent ? 'var(--text-primary)' : 'var(--text-muted)'
                  }}>
                    {language === 'ar' ? s.titleAr : language === 'fr' ? s.titleFr : s.titleEn}
                  </span>
                  {/* Connector line */}
                  {index < steps.length - 1 && (
                    <div style={{
                      width: '2.5rem',
                      height: '2px',
                      background: step > index + 1 ? 'var(--grad-gold)' : 'var(--border)',
                      marginLeft: '0.25rem',
                      marginRight: '0.25rem',
                      flexShrink: 0
                    }} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Content Card */}
        <div>
          <div style={{
            background: 'var(--grad-card)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border)',
            boxShadow: 'var(--shadow-md)',
            padding: '3rem'
          }}>
            {step === 1 && (
              <div>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-white)', marginBottom: '2rem', textAlign: 'center' }}>
                  {language === 'ar' ? 'اختر نوع الرخصة' : language === 'fr' ? 'Choisissez votre permis' : 'Choose Your License'}
                </h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
                  {licenseTypes.map((license) => (
                    <div
                      key={license.id}
                      onClick={() => setStep(2)}
                      style={{ cursor: 'pointer' }}
                      onMouseEnter={(e) => {
                        const el = e.currentTarget as HTMLDivElement;
                        el.style.borderColor = 'var(--primary)';
                        el.style.boxShadow = 'var(--shadow-gold)';
                        el.style.transform = 'translateY(-6px)';
                      }}
                      onMouseLeave={(e) => {
                        const el = e.currentTarget as HTMLDivElement;
                        el.style.borderColor = 'var(--border)';
                        el.style.boxShadow = 'none';
                        el.style.transform = 'translateY(0)';
                      }}
                    >
                      <div style={{
                        background: 'var(--bg-mid)',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--border)',
                        padding: '2rem',
                        textAlign: 'center',
                        transition: 'all 0.3s var(--ease)'
                      }}>
                        <div style={{
                          width: '4rem',
                          height: '4rem',
                          borderRadius: '50%',
                          background: 'rgba(245,166,35,0.12)',
                          border: '1px solid var(--border-gold)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          margin: '0 auto 1rem'
                        }}>
                          <Car style={{ width: '2rem', height: '2rem', color: 'var(--primary)' }} />
                        </div>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-white)', marginBottom: '0.5rem' }}>
                          {language === 'ar' ? license.nameAr : language === 'fr' ? license.nameFr : license.nameEn}
                        </h3>
                        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                          {language === 'ar' ? license.descAr : language === 'fr' ? license.descFr : license.descEn}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {step === 2 && (
              <div>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-white)', marginBottom: '2rem', textAlign: 'center' }}>
                  {language === 'ar' ? 'معلوماتك الشخصية' : language === 'fr' ? 'Vos informations personnelles' : 'Your Personal Information'}
                </h2>
                <div style={{ maxWidth: '600px', margin: '0 auto' }}>
                  <div style={{
                    background: 'rgba(245,166,35,0.06)',
                    border: '1px solid var(--border-gold)',
                    padding: '2.5rem',
                    borderRadius: 'var(--radius-md)',
                    textAlign: 'center',
                    marginBottom: '2rem'
                  }}>
                    <div style={{
                      width: '5rem',
                      height: '5rem',
                      borderRadius: '50%',
                      background: 'rgba(245,166,35,0.12)',
                      border: '1px solid var(--border-gold)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 1.25rem'
                    }}>
                      <User style={{ width: '2.5rem', height: '2.5rem', color: 'var(--primary)' }} />
                    </div>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-white)', marginBottom: '0.75rem' }}>
                      {language === 'ar' ? 'يجب تسجيل الدخول' : language === 'fr' ? 'Connexion requise' : 'Login Required'}
                    </h3>
                    <p style={{ fontSize: '1rem', color: 'var(--text-secondary)', marginBottom: '1.75rem', lineHeight: 1.7 }}>
                      {language === 'ar'
                        ? 'للمتابعة مع الحجز، يرجى تسجيل الدخول أو إنشاء حساب جديد'
                        : language === 'fr'
                        ? 'Pour continuer avec la réservation, veuillez vous connecter ou créer un nouveau compte'
                        : 'To continue with booking, please login or create a new account'
                      }
                    </p>
                    <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                      <button
                        className="btn-primary"
                        onClick={() => navigate('/login')}
                      >
                        {language === 'ar' ? 'تسجيل الدخول' : language === 'fr' ? 'Se connecter' : 'Login'}
                      </button>
                      <button
                        className="btn-outline"
                        onClick={() => navigate('/register')}
                      >
                        {language === 'ar' ? 'إنشاء حساب' : language === 'fr' ? 'Créer un compte' : 'Create Account'}
                      </button>
                    </div>
                  </div>
                  <button
                    className="btn-ghost"
                    onClick={() => setStep(1)}
                    style={{ width: '100%', justifyContent: 'center' }}
                  >
                    {language === 'ar' ? 'رجوع' : language === 'fr' ? 'Retour' : 'Back'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Info Cards */}
        <div style={{ marginTop: '3rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
            {/* Card 1 — Flexible Scheduling */}
            <div style={{
              background: 'var(--grad-card)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border)',
              padding: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              transition: 'all var(--duration-normal) var(--ease)'
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--border-gold)'; (e.currentTarget as HTMLDivElement).style.boxShadow = 'var(--shadow-gold)'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--border)'; (e.currentTarget as HTMLDivElement).style.boxShadow = 'none'; }}
            >
              <div style={{
                width: '3.5rem',
                height: '3.5rem',
                borderRadius: 'var(--radius-sm)',
                background: 'rgba(245,166,35,0.12)',
                border: '1px solid var(--border-gold)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <Calendar style={{ width: '1.75rem', height: '1.75rem', color: 'var(--primary)' }} />
              </div>
              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-white)', marginBottom: '0.25rem' }}>
                  {language === 'ar' ? 'جدولة مرنة' : language === 'fr' ? 'Planification flexible' : 'Flexible Scheduling'}
                </h3>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                  {language === 'ar' ? 'اختر الأوقات المناسبة لك' : language === 'fr' ? 'Choisissez les horaires qui vous conviennent' : 'Choose times that suit you'}
                </p>
              </div>
            </div>

            {/* Card 2 — Professional Instructors */}
            <div style={{
              background: 'var(--grad-card)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border)',
              padding: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              transition: 'all var(--duration-normal) var(--ease)'
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--border-gold)'; (e.currentTarget as HTMLDivElement).style.boxShadow = 'var(--shadow-gold)'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--border)'; (e.currentTarget as HTMLDivElement).style.boxShadow = 'none'; }}
            >
              <div style={{
                width: '3.5rem',
                height: '3.5rem',
                borderRadius: 'var(--radius-sm)',
                background: 'rgba(245,166,35,0.12)',
                border: '1px solid var(--border-gold)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <User style={{ width: '1.75rem', height: '1.75rem', color: 'var(--primary)' }} />
              </div>
              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-white)', marginBottom: '0.25rem' }}>
                  {language === 'ar' ? 'مدربون محترفون' : language === 'fr' ? 'Instructeurs professionnels' : 'Professional Instructors'}
                </h3>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                  {language === 'ar' ? 'مدربون معتمدون وذوو خبرة' : language === 'fr' ? 'Instructeurs certifiés et expérimentés' : 'Certified and experienced instructors'}
                </p>
              </div>
            </div>

            {/* Card 3 — Modern Vehicles */}
            <div style={{
              background: 'var(--grad-card)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border)',
              padding: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              transition: 'all var(--duration-normal) var(--ease)'
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--border-gold)'; (e.currentTarget as HTMLDivElement).style.boxShadow = 'var(--shadow-gold)'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--border)'; (e.currentTarget as HTMLDivElement).style.boxShadow = 'none'; }}
            >
              <div style={{
                width: '3.5rem',
                height: '3.5rem',
                borderRadius: 'var(--radius-sm)',
                background: 'rgba(245,166,35,0.12)',
                border: '1px solid var(--border-gold)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <Car style={{ width: '1.75rem', height: '1.75rem', color: 'var(--primary)' }} />
              </div>
              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-white)', marginBottom: '0.25rem' }}>
                  {language === 'ar' ? 'مركبات حديثة' : language === 'fr' ? 'Véhicules modernes' : 'Modern Vehicles'}
                </h3>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                  {language === 'ar' ? 'أسطول مجهز بأحدث التقنيات' : language === 'fr' ? 'Flotte équipée des dernières technologies' : 'Fleet equipped with latest technology'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

const BookingPublic = () => {
  return (
    <LanguageProvider>
      <BookingPublicContent />
    </LanguageProvider>
  );
};

export default BookingPublic;
