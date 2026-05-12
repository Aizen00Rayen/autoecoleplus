import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import {
  Car,
  Phone,
  Mail,
  MapPin,
  Facebook,
  Instagram,
  Youtube,
} from 'lucide-react';
import { supabase } from '../supabase';
import './style/Footer.css';

export const Footer = () => {
  const { t, language } = useLanguage();
  const [logoUrl, setLogoUrl] = useState('');

  useEffect(() => {
    const fetchLogo = async () => {
      try {
        const { data } = await supabase.from('settings').select('logoUrl').eq('id', 'school').single();
        if (data?.logoUrl) setLogoUrl(data.logoUrl);
      } catch (_) {}
    };
    fetchLogo();
  }, []);

  const quickLinks = [
    { path: '/', label: t('nav.home') },
    { path: '/about', label: t('nav.about') },
    { path: '/services', label: t('nav.services') },
    { path: '/booking', label: t('nav.booking') },
    { path: '/contact', label: t('nav.contact') },
  ];

  const licenseLinks = [
    { path: '/license/a', label: t('license.a.title') },
    { path: '/license/b', label: t('license.b.title') },
    { path: '/license/c', label: t('license.c.title') },
  ];

  return (
    <footer className="footer">
      <div className="footer-container">

        <div className="footer-grid">
          {/* Logo */}
          <div className="footer-brand">
            <div className="footer-brand-info">
            <Link to="/" className="footer-logo">
                <div className={`footer-logo-icon${logoUrl ? ' has-image' : ''}`}>
                  {logoUrl
                    ? <img src={logoUrl} alt="logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                    : <Car size={22} />
                  }
                </div>
                <span>
                  {language === 'ar' ? 'أوتو إيكول بلوس' : 'Auto Ecole Plus'}
                </span>
              </Link>
              <p className="footer-desc">{t('hero.description')}</p>
            </div>

            <div className="footer-social">
              <a href="#"><Facebook size={16} /></a>
              <a href="#"><Instagram size={16} /></a>
              <a href="#"><Youtube size={16} /></a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="footer-title">
              {language === 'ar'
                ? 'روابط سريعة'
                : language === 'fr'
                ? 'Liens rapides'
                : 'Quick Links'}
            </h3>
            <ul>
              {quickLinks.map(link => (
                <li key={link.path}>
                  <Link to={link.path}>{link.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Licenses */}
          <div>
            <h3 className="footer-title">{t('license.title')}</h3>
            <ul>
              {licenseLinks.map(link => (
                <li key={link.path}>
                  <Link to={link.path}>{link.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="footer-title">
              {language === 'ar'
                ? 'تواصل معنا'
                : language === 'fr'
                ? 'Contactez-nous'
                : 'Contact Us'}
            </h3>

            <ul className="footer-contact">
              <li>
                <MapPin size={16} />
                <span>
                  {language === 'ar'
                    ? 'شارع الاستقلال، الجزائر العاصمة'
                    : language === 'fr'
                    ? "Rue de l'Indépendance, Alger"
                    : 'Independence Street, Algiers'}
                </span>
              </li>
              <li>
                <Phone size={16} />
                <span dir="ltr">+213 555 123 456</span>
              </li>
              <li>
                <Mail size={16} />
                <span>contact@autoecole.dz</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="footer-bottom">
          © {new Date().getFullYear()}{' '}
          {language === 'ar' ? 'أوتو إيكول بلوس' : 'Auto Ecole Plus'} — {t('footer.rights')}
        </div>

      </div>
    </footer>
  );
};
