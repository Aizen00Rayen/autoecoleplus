import { useLanguage } from '../contexts/LanguageContext';
import { BookOpen, Car, Clock, Shield } from 'lucide-react';
import './style/FeaturesSection.css';

const features = [
  { key: 'theory', icon: BookOpen },
  { key: 'practical', icon: Car },
  { key: 'flexible', icon: Clock },
  { key: 'modern', icon: Shield },
];

export const FeaturesSection = () => {
  const { t } = useLanguage();

  return (
    <section className="features-section">
      <div className="features-container">
        <div className="features-title-container">
          <h2 className="features-title">
            {t('features.title')}
          </h2>
          <div className="features-divider" />
        </div>

        <div className="features-grid">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <div key={feature.key} className="feature-card-wrapper">
                <div className="feature-card">
                  <div className="feature-icon-container">
                    <Icon className="feature-icon" />
                  </div>
                  <h3 className="feature-title">
                    {t(`features.${feature.key}.title`)}
                  </h3>
                  <p className="feature-description">
                    {t(`features.${feature.key}.desc`)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
