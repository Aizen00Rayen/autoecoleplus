import { Link } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { Car, ArrowRight, ArrowLeft } from 'lucide-react';
import './style/CTASection.css';

export const CTASection = () => {
  const { language, dir } = useLanguage();
  const Arrow = dir === 'rtl' ? ArrowLeft : ArrowRight;

  const content = {
    ar: {
      title: 'ابدأ رحلتك اليوم',
      subtitle: 'سجّل الآن واحصل على أول درس مجاناً',
      cta: 'سجّل مجاناً',
    },
    fr: {
      title: 'Commencez votre voyage',
      subtitle: 'Inscrivez-vous et obtenez votre première leçon gratuite',
      cta: 'Inscription gratuite',
    },
    en: {
      title: 'Start Your Journey Today',
      subtitle: 'Register now and get your first lesson free',
      cta: 'Register Free',
    },
  };

  const currentContent = content[language];

  return (
    <section className="cta">
      {/* Background Pattern */}
      <div className="cta-pattern" />

      {/* Decorative Cars */}
      <Car className="cta-car car-top" />
      <Car className="cta-car car-bottom" />

      <div className="cta-container">
        <div className="cta-content">
          <h2>{currentContent.title}</h2>
          <p>{currentContent.subtitle}</p>

          <Link to="/register" className="cta-btn">
            {currentContent.cta}
            <Arrow size={20} />
          </Link>
        </div>
      </div>
    </section>
  );
};
