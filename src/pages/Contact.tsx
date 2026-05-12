import { useState } from 'react';
import { LanguageProvider, useLanguage } from '../contexts/LanguageContext';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import '../components/style/theme.css';
import {
  Phone, Mail, MapPin, Clock, Send,
  Facebook, Instagram, Twitter, Youtube, MessageCircle,
} from 'lucide-react';
import { useToast } from '../hooks/use-toast';

const ContactContent = () => {
  const { language } = useLanguage();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  });
  const [loading, setLoading] = useState(false);

  const t = (ar: string, fr: string, en: string) =>
    language === 'ar' ? ar : language === 'fr' ? fr : en;

  const contactInfo = [
    {
      icon: Phone,
      titleAr: 'الهاتف',
      titleFr: 'Téléphone',
      titleEn: 'Phone',
      value: '+213 555 123 456',
      link: 'tel:+213555123456',
      color: '#10B981',
    },
    {
      icon: Mail,
      titleAr: 'البريد الإلكتروني',
      titleFr: 'Email',
      titleEn: 'Email',
      value: 'contact@autoecole.dz',
      link: 'mailto:contact@autoecole.dz',
      color: '#3B82F6',
    },
    {
      icon: MapPin,
      titleAr: 'العنوان',
      titleFr: 'Adresse',
      titleEn: 'Address',
      value: t('الجزائر العاصمة، الجزائر', 'Alger, Algérie', 'Algiers, Algeria'),
      link: null,
      color: '#F5A623',
    },
    {
      icon: Clock,
      titleAr: 'ساعات العمل',
      titleFr: 'Horaires',
      titleEn: 'Working Hours',
      value: t('السبت – الخميس: 8:00 – 18:00', 'Sam – Jeu: 8h00 – 18h00', 'Sat – Thu: 8:00 – 18:00'),
      link: null,
      color: '#8B5CF6',
    },
  ];

  const socialLinks = [
    { icon: Facebook, href: '#', label: 'Facebook', color: '#1877F2' },
    { icon: Instagram, href: '#', label: 'Instagram', color: '#E1306C' },
    { icon: Twitter, href: '#', label: 'Twitter/X', color: '#1DA1F2' },
    { icon: Youtube, href: '#', label: 'YouTube', color: '#FF0000' },
    { icon: MessageCircle, href: '#', label: 'WhatsApp', color: '#25D366' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Simulate sending message
    setTimeout(() => {
      toast({
        title: t('تم الإرسال بنجاح', 'Envoyé avec succès', 'Sent Successfully'),
        description: t(
          'شكراً لتواصلك معنا. سنرد عليك في أقرب وقت ممكن',
          'Merci de nous avoir contactés. Nous vous répondrons dans les plus brefs délais',
          'Thank you for contacting us. We will respond as soon as possible',
        ),
      });
      setFormData({ name: '', email: '', phone: '', subject: '', message: '' });
      setLoading(false);
    }, 1500);
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '12px 16px',
    background: 'var(--bg-mid)',
    border: '1.5px solid var(--border)',
    borderRadius: 'var(--radius-md)',
    color: 'var(--text-primary)',
    fontSize: '0.9375rem',
    outline: 'none',
    transition: 'border-color 0.3s, box-shadow 0.3s',
    fontFamily: 'inherit',
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    e.target.style.borderColor = 'var(--primary)';
    e.target.style.boxShadow = '0 0 0 3px rgba(245,166,35,0.15)';
  };
  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    e.target.style.borderColor = 'var(--border)';
    e.target.style.boxShadow = 'none';
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: '0.875rem',
    fontWeight: 600,
    color: 'var(--text-secondary)',
    marginBottom: '0.5rem',
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-darkest)', color: 'var(--text-primary)' }}>
      <Navbar />

      {/* ── Hero ── */}
      <section style={{ position: 'relative', paddingTop: '140px', paddingBottom: '60px', overflow: 'hidden' }}>
        <div style={{
          position: 'absolute', top: '-100px', left: '50%', transform: 'translateX(-50%)',
          width: '700px', height: '700px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(245,166,35,0.06) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />
        <div className="section-container" style={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
          <span className="section-label">
            <Mail size={13} />
            {t('تواصل معنا', 'Contactez-nous', 'Contact Us')}
          </span>
          <h1 className="section-title" style={{ marginBottom: '1.25rem' }}>
            {t('نحن هنا', 'Nous sommes là', 'We Are Here')}{' '}
            <span className="gold-text">{t('لمساعدتك', 'pour vous aider', 'to Help You')}</span>
          </h1>
          <p className="section-subtitle" style={{ margin: '0 auto 2rem', maxWidth: '580px' }}>
            {t(
              'لا تتردد في التواصل معنا لأي استفسار أو حجز — فريقنا جاهز للرد عليك',
              'N\'hésitez pas à nous contacter pour toute question ou réservation — notre équipe est prête',
              'Don\'t hesitate to reach out for any inquiry or booking — our team is ready to respond',
            )}
          </p>
          <div style={{ width: '80px', height: '3px', background: 'var(--grad-gold)', borderRadius: '2px', margin: '0 auto' }} />
        </div>
      </section>

      {/* ── Two-Column Layout ── */}
      <section style={{ padding: '40px 0 100px' }}>
        <div className="section-container">
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
            gap: '2.5rem',
            alignItems: 'start',
          }}>

            {/* ── LEFT: Contact Form ── */}
            <div
              className="glass-card"
              style={{
                padding: '2.5rem',
                border: '1px solid var(--border)',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              {/* Gold accent bar */}
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: 'var(--grad-gold)' }} />

              <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-white)', marginBottom: '0.5rem' }}>
                {t('أرسل رسالة', 'Envoyez un message', 'Send a Message')}
              </h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '2rem' }}>
                {t(
                  'سنرد عليك خلال 24 ساعة في أيام العمل',
                  'Nous vous répondrons dans les 24h ouvrables',
                  'We\'ll reply within 24 business hours',
                )}
              </p>

              <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '1.25rem' }}>
                {/* Name & Phone row */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={labelStyle}>
                      {t('الاسم الكامل', 'Nom complet', 'Full Name')} *
                    </label>
                    <input
                      className="input-pro"
                      type="text"
                      required
                      placeholder={t('أدخل اسمك', 'Votre nom', 'Enter your name')}
                      value={formData.name}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                      onFocus={handleFocus}
                      onBlur={handleBlur}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>
                      {t('الهاتف', 'Téléphone', 'Phone')} *
                    </label>
                    <input
                      className="input-pro"
                      type="tel"
                      required
                      placeholder="+213 5xx xxx xxx"
                      value={formData.phone}
                      onChange={e => setFormData({ ...formData, phone: e.target.value })}
                      onFocus={handleFocus}
                      onBlur={handleBlur}
                    />
                  </div>
                </div>

                <div>
                  <label style={labelStyle}>
                    {t('البريد الإلكتروني', 'Email', 'Email')} *
                  </label>
                  <input
                    className="input-pro"
                    type="email"
                    required
                    placeholder={t('بريدك الإلكتروني', 'Votre email', 'Your email')}
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                  />
                </div>

                <div>
                  <label style={labelStyle}>
                    {t('الموضوع', 'Sujet', 'Subject')} *
                  </label>
                  <input
                    className="input-pro"
                    type="text"
                    required
                    placeholder={t('موضوع رسالتك', 'Sujet de votre message', 'Message subject')}
                    value={formData.subject}
                    onChange={e => setFormData({ ...formData, subject: e.target.value })}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                  />
                </div>

                <div>
                  <label style={labelStyle}>
                    {t('الرسالة', 'Message', 'Message')} *
                  </label>
                  <textarea
                    className="input-pro"
                    required
                    rows={5}
                    placeholder={t('اكتب رسالتك هنا...', 'Écrivez votre message ici...', 'Write your message here...')}
                    value={formData.message}
                    onChange={e => setFormData({ ...formData, message: e.target.value })}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                    style={{ resize: 'vertical', fontFamily: 'inherit' }}
                  />
                </div>

                <button
                  type="submit"
                  className="btn-primary"
                  disabled={loading}
                  style={{
                    width: '100%',
                    justifyContent: 'center',
                    opacity: loading ? 0.7 : 1,
                    cursor: loading ? 'not-allowed' : 'pointer',
                  }}
                >
                  <Send size={16} />
                  {loading
                    ? t('جاري الإرسال...', 'Envoi en cours...', 'Sending...')
                    : t('إرسال الرسالة', 'Envoyer le message', 'Send Message')
                  }
                </button>
              </form>
            </div>

            {/* ── RIGHT: Info Cards + Map + Social ── */}
            <div style={{ display: 'grid', gap: '1.5rem' }}>

              {/* Info Cards */}
              {contactInfo.map((info, i) => (
                <div
                  key={i}
                  className="glass-card"
                  style={{
                    padding: '1.375rem 1.5rem',
                    display: 'flex', alignItems: 'center', gap: '1.125rem',
                    border: '1px solid var(--border)',
                    cursor: info.link ? 'pointer' : 'default',
                    transition: 'border-color 0.3s, transform 0.3s, box-shadow 0.3s',
                    textDecoration: 'none', color: 'inherit',
                  }}
                  onClick={() => info.link && window.open(info.link, '_self')}
                  onMouseEnter={e => {
                    const el = e.currentTarget as HTMLDivElement;
                    el.style.transform = 'translateX(5px)';
                    el.style.borderColor = 'var(--border-gold)';
                    el.style.boxShadow = 'var(--shadow-gold)';
                  }}
                  onMouseLeave={e => {
                    const el = e.currentTarget as HTMLDivElement;
                    el.style.transform = 'translateX(0)';
                    el.style.borderColor = 'var(--border)';
                    el.style.boxShadow = 'none';
                  }}
                >
                  <div style={{
                    width: '2.875rem', height: '2.875rem', borderRadius: '12px',
                    background: `${info.color}18`,
                    border: `1px solid ${info.color}40`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    <info.icon size={18} color={info.color} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '2px' }}>
                      {t(info.titleAr, info.titleFr, info.titleEn)}
                    </div>
                    <div style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--text-white)' }}>
                      {info.value}
                    </div>
                  </div>
                </div>
              ))}

              {/* Map Placeholder */}
              <div
                className="glass-card"
                style={{
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-lg)',
                  overflow: 'hidden',
                  position: 'relative',
                  height: '180px',
                }}
              >
                {/* Decorative map grid */}
                <div style={{
                  position: 'absolute', inset: 0,
                  backgroundImage: `
                    linear-gradient(rgba(245,166,35,0.04) 1px, transparent 1px),
                    linear-gradient(90deg, rgba(245,166,35,0.04) 1px, transparent 1px)
                  `,
                  backgroundSize: '30px 30px',
                }} />
                <div style={{
                  position: 'absolute', inset: 0,
                  display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center', gap: '0.75rem',
                }}>
                  <div style={{
                    width: '3rem', height: '3rem', borderRadius: '50%',
                    background: 'rgba(245,166,35,0.15)', border: '2px solid var(--border-gold)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    animation: 'pulse-glow 2s infinite',
                  }}>
                    <MapPin size={20} color="var(--primary)" />
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', fontWeight: 500 }}>
                      {t('الجزائر العاصمة، الجزائر', 'Alger, Algérie', 'Algiers, Algeria')}
                    </p>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.8125rem' }}>
                      {t('عرض على الخريطة', 'Voir sur la carte', 'View on map')}
                    </p>
                  </div>
                </div>
              </div>

              {/* Social Media */}
              <div
                className="glass-card"
                style={{ padding: '1.5rem', border: '1px solid var(--border)' }}
              >
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', fontWeight: 600, marginBottom: '1rem' }}>
                  {t('تابعنا على', 'Suivez-nous sur', 'Follow us on')}
                </p>
                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                  {socialLinks.map((s, i) => (
                    <a
                      key={i}
                      href={s.href}
                      title={s.label}
                      style={{
                        width: '2.5rem', height: '2.5rem', borderRadius: '10px',
                        background: `${s.color}15`,
                        border: `1px solid ${s.color}35`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'transform 0.25s, background 0.25s, box-shadow 0.25s',
                        textDecoration: 'none',
                      }}
                      onMouseEnter={e => {
                        const el = e.currentTarget as HTMLAnchorElement;
                        el.style.transform = 'translateY(-3px) scale(1.08)';
                        el.style.background = `${s.color}30`;
                        el.style.boxShadow = `0 4px 16px ${s.color}40`;
                      }}
                      onMouseLeave={e => {
                        const el = e.currentTarget as HTMLAnchorElement;
                        el.style.transform = 'translateY(0) scale(1)';
                        el.style.background = `${s.color}15`;
                        el.style.boxShadow = 'none';
                      }}
                    >
                      <s.icon size={16} color={s.color} />
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

const Contact = () => (
  <LanguageProvider>
    <ContactContent />
  </LanguageProvider>
);

export default Contact;
