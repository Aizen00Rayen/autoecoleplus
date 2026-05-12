import { Link } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { Bike, Car, Truck, ArrowRight, ArrowLeft } from 'lucide-react';
import '../components/style/LicenseTypesSection.css';

const licenseTypes = [
  {
    type: 'a',
    icon: Bike,
    gradientClass: 'license-gradient-a',
    iconClass: 'license-icon-container-a'
  },
  {
    type: 'b',
    icon: Car,
    gradientClass: 'license-gradient-b',
    iconClass: 'license-icon-container-b'
  },
  {
    type: 'c',
    icon: Truck,
    gradientClass: 'license-gradient-c',
    iconClass: 'license-icon-container-c'
  },
];

export const LicenseTypesSection = () => {
  const { t, dir } = useLanguage();
  const Arrow = dir === 'rtl' ? ArrowLeft : ArrowRight;

  return (
    <section className="license-types-section">
      <div className="license-container">
        <div className="license-title-container">
          <h2 className="license-title">
            {t('license.title')}
          </h2>
          <div className="license-divider" />
        </div>

        <div className="license-grid">
          {licenseTypes.map((license) => {
            const Icon = license.icon;
            return (
              <div key={license.type} className="license-card-wrapper">
                <div className="license-card">
                  {/* Gradient Background */}
                  <div className={`license-gradient-bg ${license.gradientClass}`} />

                  {/* Icon */}
                  <div className={`license-icon-container ${license.iconClass}`}>
                    <Icon className="license-icon" />
                  </div>

                  {/* Content */}
                  <h3 className="license-card-title">
                    {t(`license.${license.type}.title`)}
                  </h3>
                  <p className="license-card-description">
                    {t(`license.${license.type}.desc`)}
                  </p>

                  {/* CTA */}
                  <Link
                    to={`/license/${license.type}`}
                    className="license-cta-button"
                  >
                    {dir === 'rtl' ? 'المزيد' : 'Learn more'}
                    <Arrow className="license-cta-icon" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
