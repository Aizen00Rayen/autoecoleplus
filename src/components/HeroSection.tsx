import { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { Car, Users, Award, Clock, ArrowRight, ArrowLeft } from 'lucide-react';
import { supabase } from '../supabase';

import '../components/style/HeroSection.css'

const stats = [
  { key: 'students', value: '2500+', icon: Users },
  { key: 'instructors', value: '15', icon: Award },
  { key: 'vehicles', value: '20', icon: Car },
  { key: 'experience', value: '10+', icon: Clock },
];

export const HeroSection = () => {
  const { t, language, dir } = useLanguage();
  const Arrow = dir === 'rtl' ? ArrowLeft : ArrowRight;
  const [logoUrl, setLogoUrl] = useState('');

  useEffect(() => {
    supabase.from('settings').select('logoUrl').eq('id', 'school').single()
      .then(({ data }) => { if (data?.logoUrl) setLogoUrl(data.logoUrl); })
      .catch(() => {});
  }, []);

  return (
    <section className="hero-section">
      {/* Background Pattern */}
      <div className="hero-background-pattern">
        <div className="hero-pattern" />
      </div>

      {/* Decorative Elements */}
      <div className="hero-decorative-element-1" />
      <div className="hero-decorative-element-2" />

      <div className="hero-container">
        <div className="hero-grid">
          {/* Text Content */}
          <div className="hero-text-content">
            <div className="hero-badge">
              <Car className="hero-badge-icon" />
              <span>
                {language === 'ar'
                  ? 'مدرسة معتمدة'
                  : language === 'fr'
                  ? 'École agréée'
                  : 'Certified School'}
              </span>
            </div>

            <h1 className="hero-title">
              {t('hero.title')}
              <span className="hero-title-primary">{t('hero.subtitle')}</span>
            </h1>

            <p className="hero-description">
              {t('hero.description')}
            </p>

            <div className="hero-buttons-container">
              <a href="/register" className="hero-primary-button">
                {t('hero.cta.register')}
                <Arrow className="hero-button-icon" />
              </a>
              <a href="/booking" className="hero-secondary-button">
                {t('hero.cta.booking')}
              </a>
            </div>
          </div>

          {/* Image/Illustration */}
          <div className="hero-image-container">
            <div className="hero-image-wrapper">
              {/* Main Circle */}
              <div className="hero-main-circle" />

              {/* Car Icon */}
              <div className="hero-car-container">
                {logoUrl
                  ? <img src={logoUrl} alt="logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                  : <Car className="hero-car-icon" />
                }
              </div>

              {/* Floating Elements */}
              <div className="hero-floating-element-1 floating-animation-1">
                <div className="floating-element-content">
                  <div className="floating-icon-container-1">
                    <Award className="floating-icon-1" />
                  </div>
                  <div>
                    <p className="floating-text-bold">98%</p>
                    <p className="floating-text-small">
                      {language === 'ar' ? 'نسبة النجاح' : language === 'fr' ? 'Taux de réussite' : 'Success Rate'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="hero-floating-element-2 floating-animation-2">
                <div className="floating-element-content">
                  <div className="floating-icon-container-2">
                    <Users className="floating-icon-2" />
                  </div>
                  <div>
                    <p className="floating-text-bold">2500+</p>
                    <p className="floating-text-small">
                      {language === 'ar' ? 'طالب ناجح' : language === 'fr' ? 'Étudiants' : 'Students'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="hero-stats-container">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.key}
                className="hero-stat-item"
              >
                <Icon className="hero-stat-icon" />
                <p className="hero-stat-value">{stat.value}</p>
                <p className="hero-stat-label">
                  {t(`hero.stats.${stat.key}`)}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
