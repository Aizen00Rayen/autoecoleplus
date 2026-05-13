import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { Menu, X, Globe, ChevronDown, LogOut, User } from 'lucide-react';
import { supabase } from '../supabase';
import './style/theme.css';
import './style/Navbar.css';

import type { Language } from '../contexts/LanguageContext';

const languages: { code: Language; label: string; flag: string }[] = [
  { code: 'ar', label: 'العربية', flag: '🇩🇿' },
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
  { code: 'en', label: 'English', flag: '🇬🇧' },
];

export const Navbar = () => {
  const { language, setLanguage, t, dir } = useLanguage();
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [logoUrl, setLogoUrl] = useState('');
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const fetchLogo = async () => {
      try {
        const { data } = await supabase.from('settings').select('logoUrl').eq('id', 'school').single();
        if (data?.logoUrl) setLogoUrl(data.logoUrl);
      } catch (_) {}
    };
    fetchLogo();
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = () => { setLangOpen(false); };
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/');
    setIsOpen(false);
  };

  const navLinks = [
    { path: '/', label: t('nav.home') },
    { path: '/about', label: t('nav.about') },
    { path: '/services', label: t('nav.services') },
    { path: '/instructors', label: t('nav.instructors') },
    { path: '/vehicles', label: t('nav.vehicles') },
    { path: '/contact', label: t('nav.contact') },
  ];

  const getDashboardLink = () => {
    if (!isAuthenticated || !user?.role) return null;
    const label = language === 'ar' ? 'لوحة التحكم' : language === 'fr' ? 'Tableau de bord' : 'Dashboard';
    switch (user.role) {
      case 'student': return { path: '/student-dashboard', label };
      case 'teacher': return { path: '/teacher-dashboard', label };
      case 'admin':   return { path: '/admin-dashboard', label };
      default: return null;
    }
  };

  const dashboardLink = getDashboardLink();
  const allNavLinks = dashboardLink ? [...navLinks, dashboardLink] : navLinks;
  const currentLang = languages.find(l => l.code === language);

  const getRoleLabel = () => {
    if (!user?.role) return '';
    switch (user.role) {
      case 'admin':   return language === 'ar' ? 'المدير العام' : language === 'fr' ? 'Administrateur' : 'Admin';
      case 'teacher': return language === 'ar' ? 'الأستاذ' : language === 'fr' ? 'Moniteur' : 'Instructor';
      case 'student': return language === 'ar' ? 'الطالب' : language === 'fr' ? 'Étudiant' : 'Student';
      default: return '';
    }
  };

  return (
    <nav className={`navbar${scrolled ? ' scrolled' : ''}`} dir={dir}>
      <div className="navbar-container">

        {/* Logo */}
        <Link to="/" className="logo">
          <div className="logo-icon has-image">
            <img
              src={logoUrl || '/logo.jpg'}
              alt="logo"
              style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px' }}
            />
          </div>
          <span className="logo-text">
            {language === 'ar' ? 'أوتو إيكول بلوس' : 'Auto Ecole Plus'}
          </span>
        </Link>

        {/* Desktop Links */}
        <div className="nav-links">
          {allNavLinks.map(link => (
            <Link
              key={link.path}
              to={link.path}
              className={location.pathname === link.path ? 'nav-link active' : 'nav-link'}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Right Side */}
        <div className="right-section">

          {/* Language */}
          <div className="lang-switch" onClick={e => e.stopPropagation()}>
            <button onClick={() => setLangOpen(!langOpen)}>
              <Globe size={14} />
              <span className="lang-label">{currentLang?.flag} {currentLang?.label}</span>
              <span className="lang-code-mobile">{currentLang?.code?.toUpperCase()}</span>
              <ChevronDown size={12} />
            </button>

            {langOpen && (
              <div className="lang-menu" style={{ [dir === 'rtl' ? 'right' : 'left']: 0 }}>
                {languages.map(lang => (
                  <div
                    key={lang.code}
                    className="lang-item"
                    onClick={() => { setLanguage(lang.code); setLangOpen(false); }}
                  >
                    <span className="lang-item-code">{lang.code.toUpperCase()}</span>
                    <span className="lang-item-label">{lang.flag} {lang.label}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Auth */}
          <div className="auth-buttons">
            {isAuthenticated ? (
              <>
                <div className="user-info">
                  <User size={14} />
                  <span>{getRoleLabel()}</span>
                </div>
                <button onClick={handleLogout} className="btn ghost logout-btn">
                  <LogOut size={14} />
                  {t('nav.logout')}
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="btn ghost">{t('nav.login')}</Link>
                <Link to="/register" className="btn primary">{t('nav.register')}</Link>
              </>
            )}
          </div>

          {/* Mobile Toggle */}
          <button className="menu-btn" onClick={() => setIsOpen(!isOpen)}>
            {isOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="mobile-menu">
          {allNavLinks.map(link => (
            <Link
              key={link.path}
              to={link.path}
              onClick={() => setIsOpen(false)}
              className={location.pathname === link.path ? 'mobile-link active' : 'mobile-link'}
            >
              {link.label}
            </Link>
          ))}

          <div className="mobile-auth">
            {isAuthenticated ? (
              <>
                <div className="user-info-mobile">
                  <User size={16} />
                  <span>{getRoleLabel()}</span>
                </div>
                <button onClick={handleLogout} className="btn ghost">
                  <LogOut size={16} /> {t('nav.logout')}
                </button>
              </>
            ) : (
              <>
                <Link to="/login" onClick={() => setIsOpen(false)} className="btn ghost">{t('nav.login')}</Link>
                <Link to="/register" onClick={() => setIsOpen(false)} className="btn primary">{t('nav.register')}</Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};
