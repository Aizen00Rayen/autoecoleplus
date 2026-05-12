import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';


export type Language = 'ar' | 'fr' | 'en';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  dir: 'rtl' | 'ltr';
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Translations
const translations: Record<Language, Record<string, string>> = {
  ar: {
    // Navigation
    'nav.home': 'الرئيسية',
    'nav.about': 'من نحن',
    'nav.services': 'خدماتنا',
    'nav.instructors': 'الأساتذة',
    'nav.vehicles': 'المركبات',
    'nav.booking': 'حجز موعد',
    'nav.contact': 'اتصل بنا',
    'nav.login': 'تسجيل الدخول',
    'nav.register': 'التسجيل',
    'nav.dashboard': 'لوحة التحكم',
    'nav.logout': 'تسجيل الخروج',

    // Hero Section
    'hero.title': 'مدرسة تعليم السياقة',
    'hero.subtitle': 'احترف القيادة مع أفضل المدربين',
    'hero.description': 'نقدم لك تجربة تعليمية متميزة للحصول على رخصة القيادة بكل ثقة وأمان',
    'hero.cta.register': 'سجّل الآن',
    'hero.cta.booking': 'احجز موعدك',
    'hero.stats.students': 'طالب ناجح',
    'hero.stats.instructors': 'مدرب محترف',
    'hero.stats.vehicles': 'مركبة حديثة',
    'hero.stats.experience': 'سنوات خبرة',

    // Features
    'features.title': 'لماذا تختارنا؟',
    'features.theory.title': 'دروس نظرية',
    'features.theory.desc': 'تعلم قوانين المرور وإشارات الطريق',
    'features.practical.title': 'تدريب عملي',
    'features.practical.desc': 'تدريب على القيادة مع مدربين محترفين',
    'features.flexible.title': 'مواعيد مرنة',
    'features.flexible.desc': 'اختر الوقت المناسب لك',
    'features.modern.title': 'مركبات حديثة',
    'features.modern.desc': 'أسطول من السيارات الحديثة والآمنة',

    // License Types
    'license.title': 'أنواع الرخص',
    'license.a.title': 'رخصة A - دراجة نارية',
    'license.a.desc': 'للدراجات النارية بجميع أنواعها',
    'license.b.title': 'رخصة B - سيارة',
    'license.b.desc': 'للسيارات الخاصة والخفيفة',
    'license.c.title': 'رخصة C - شاحنة',
    'license.c.desc': 'للشاحنات والمركبات الثقيلة',

    // Auth Forms
    'auth.login.title': 'تسجيل الدخول',
    'auth.login.email': 'البريد الإلكتروني',
    'auth.login.password': 'كلمة المرور',
    'auth.login.submit': 'دخول',
    'auth.login.forgot': 'نسيت كلمة المرور؟',
    'auth.login.noAccount': 'ليس لديك حساب؟',
    'auth.register.title': 'إنشاء حساب جديد',
    'auth.register.fullName': 'الاسم الكامل',
    'auth.register.phone': 'رقم الهاتف',
    'auth.register.email': 'البريد الإلكتروني',
    'auth.register.password': 'كلمة المرور',
    'auth.register.confirmPassword': 'تأكيد كلمة المرور',
    'auth.register.licenseType': 'نوع الرخصة',
    'auth.register.submit': 'تسجيل',
    'auth.register.hasAccount': 'لديك حساب بالفعل؟',
    'auth.selectRole': 'تسجيل الدخول كـ',
    'auth.role.student': 'طالب',
    'auth.role.teacher': 'أستاذ',
    'auth.role.admin': 'مدير',

    // Booking
    'booking.title': 'حجز موعد',
    'booking.type': 'نوع الدرس',
    'booking.theory': 'درس نظري',
    'booking.practical': 'درس عملي',
    'booking.date': 'التاريخ',
    'booking.time': 'الوقت',
    'booking.instructor': 'اختر المدرب',
    'booking.vehicle': 'اختر المركبة',
    'booking.submit': 'تأكيد الحجز',

    // Footer
    'footer.rights': 'جميع الحقوق محفوظة',
    'footer.address': 'العنوان',
    'footer.phone': 'الهاتف',
    'footer.email': 'البريد الإلكتروني',
    'footer.followUs': 'تابعنا',

    // Common
    'common.loading': 'جاري التحميل...',
    'common.error': 'حدث خطأ',
    'common.success': 'تمت العملية بنجاح',
    'common.cancel': 'إلغاء',
    'common.save': 'حفظ',
    'common.delete': 'حذف',
    'common.edit': 'تعديل',
    'common.view': 'عرض',
    'common.search': 'بحث',
  },
  fr: {
    // Navigation
    'nav.home': 'Accueil',
    'nav.about': 'À propos',
    'nav.services': 'Services',
    'nav.instructors': 'Moniteurs',
    'nav.vehicles': 'Véhicules',
    'nav.booking': 'Réservation',
    'nav.contact': 'Contact',
    'nav.login': 'Connexion',
    'nav.register': "S'inscrire",
    'nav.dashboard': 'Tableau de bord',
    'nav.logout': 'Déconnexion',

    // Hero Section
    'hero.title': 'Auto-École Excellence',
    'hero.subtitle': 'Maîtrisez la conduite avec les meilleurs moniteurs',
    'hero.description': 'Nous vous offrons une expérience éducative exceptionnelle pour obtenir votre permis de conduire en toute confiance et sécurité',
    'hero.cta.register': "S'inscrire maintenant",
    'hero.cta.booking': 'Réserver une leçon',
    'hero.stats.students': 'Étudiants réussis',
    'hero.stats.instructors': 'Moniteurs experts',
    'hero.stats.vehicles': 'Véhicules modernes',
    'hero.stats.experience': "Années d'expérience",

    // Features
    'features.title': 'Pourquoi nous choisir ?',
    'features.theory.title': 'Cours théoriques',
    'features.theory.desc': 'Apprenez le code de la route et la signalisation',
    'features.practical.title': 'Formation pratique',
    'features.practical.desc': 'Entraînement à la conduite avec des moniteurs professionnels',
    'features.flexible.title': 'Horaires flexibles',
    'features.flexible.desc': 'Choisissez le créneau qui vous convient',
    'features.modern.title': 'Véhicules modernes',
    'features.modern.desc': 'Une flotte de voitures modernes et sécurisées',

    // License Types
    'license.title': 'Types de permis',
    'license.a.title': 'Permis A - Moto',
    'license.a.desc': 'Pour tous types de motos',
    'license.b.title': 'Permis B - Voiture',
    'license.b.desc': 'Pour véhicules légers et voitures particulières',
    'license.c.title': 'Permis C - Camion',
    'license.c.desc': 'Pour camions et véhicules lourds',

    // Auth Forms
    'auth.login.title': 'Connexion',
    'auth.login.email': 'Email',
    'auth.login.password': 'Mot de passe',
    'auth.login.submit': 'Se connecter',
    'auth.login.forgot': 'Mot de passe oublié ?',
    'auth.login.noAccount': "Vous n'avez pas de compte ?",
    'auth.register.title': 'Créer un compte',
    'auth.register.fullName': 'Nom complet',
    'auth.register.phone': 'Téléphone',
    'auth.register.email': 'Email',
    'auth.register.password': 'Mot de passe',
    'auth.register.confirmPassword': 'Confirmer le mot de passe',
    'auth.register.licenseType': 'Type de permis',
    'auth.register.submit': "S'inscrire",
    'auth.register.hasAccount': 'Déjà inscrit ?',
    'auth.selectRole': 'Se connecter en tant que',
    'auth.role.student': 'Étudiant',
    'auth.role.teacher': 'Moniteur',
    'auth.role.admin': 'Administrateur',

    // Booking
    'booking.title': 'Réserver une leçon',
    'booking.type': 'Type de leçon',
    'booking.theory': 'Leçon théorique',
    'booking.practical': 'Leçon pratique',
    'booking.date': 'Date',
    'booking.time': 'Heure',
    'booking.instructor': 'Choisir un moniteur',
    'booking.vehicle': 'Choisir un véhicule',
    'booking.submit': 'Confirmer la réservation',

    // Footer
    'footer.rights': 'Tous droits réservés',
    'footer.address': 'Adresse',
    'footer.phone': 'Téléphone',
    'footer.email': 'Email',
    'footer.followUs': 'Suivez-nous',

    // Common
    'common.loading': 'Chargement...',
    'common.error': 'Une erreur est survenue',
    'common.success': 'Opération réussie',
    'common.cancel': 'Annuler',
    'common.save': 'Enregistrer',
    'common.delete': 'Supprimer',
    'common.edit': 'Modifier',
    'common.view': 'Voir',
    'common.search': 'Rechercher',
  },
  en: {
    // Navigation
    'nav.home': 'Home',
    'nav.about': 'About Us',
    'nav.services': 'Services',
    'nav.instructors': 'Instructors',
    'nav.vehicles': 'Vehicles',
    'nav.booking': 'Book Now',
    'nav.contact': 'Contact',
    'nav.login': 'Login',
    'nav.register': 'Register',
    'nav.dashboard': 'Dashboard',
    'nav.logout': 'Logout',

    // Hero Section
    'hero.title': 'Driving School Excellence',
    'hero.subtitle': 'Master driving with the best instructors',
    'hero.description': 'We offer you an exceptional learning experience to get your driving license with confidence and safety',
    'hero.cta.register': 'Register Now',
    'hero.cta.booking': 'Book a Lesson',
    'hero.stats.students': 'Successful Students',
    'hero.stats.instructors': 'Expert Instructors',
    'hero.stats.vehicles': 'Modern Vehicles',
    'hero.stats.experience': 'Years Experience',

    // Features
    'features.title': 'Why Choose Us?',
    'features.theory.title': 'Theory Classes',
    'features.theory.desc': 'Learn traffic laws and road signs',
    'features.practical.title': 'Practical Training',
    'features.practical.desc': 'Driving training with professional instructors',
    'features.flexible.title': 'Flexible Schedule',
    'features.flexible.desc': 'Choose the time that suits you',
    'features.modern.title': 'Modern Vehicles',
    'features.modern.desc': 'A fleet of modern and safe vehicles',

    // License Types
    'license.title': 'License Types',
    'license.a.title': 'License A - Motorcycle',
    'license.a.desc': 'For all types of motorcycles',
    'license.b.title': 'License B - Car',
    'license.b.desc': 'For light vehicles and private cars',
    'license.c.title': 'License C - Truck',
    'license.c.desc': 'For trucks and heavy vehicles',

    // Auth Forms
    'auth.login.title': 'Login',
    'auth.login.email': 'Email',
    'auth.login.password': 'Password',
    'auth.login.submit': 'Sign In',
    'auth.login.forgot': 'Forgot password?',
    'auth.login.noAccount': "Don't have an account?",
    'auth.register.title': 'Create Account',
    'auth.register.fullName': 'Full Name',
    'auth.register.phone': 'Phone Number',
    'auth.register.email': 'Email',
    'auth.register.password': 'Password',
    'auth.register.confirmPassword': 'Confirm Password',
    'auth.register.licenseType': 'License Type',
    'auth.register.submit': 'Register',
    'auth.register.hasAccount': 'Already have an account?',
    'auth.selectRole': 'Login as',
    'auth.role.student': 'Student',
    'auth.role.teacher': 'Instructor',
    'auth.role.admin': 'Administrator',

    // Booking
    'booking.title': 'Book a Lesson',
    'booking.type': 'Lesson Type',
    'booking.theory': 'Theory Lesson',
    'booking.practical': 'Practical Lesson',
    'booking.date': 'Date',
    'booking.time': 'Time',
    'booking.instructor': 'Select Instructor',
    'booking.vehicle': 'Select Vehicle',
    'booking.submit': 'Confirm Booking',

    // Footer
    'footer.rights': 'All rights reserved',
    'footer.address': 'Address',
    'footer.phone': 'Phone',
    'footer.email': 'Email',
    'footer.followUs': 'Follow Us',

    // Common
    'common.loading': 'Loading...',
    'common.error': 'An error occurred',
    'common.success': 'Operation successful',
    'common.cancel': 'Cancel',
    'common.save': 'Save',
    'common.delete': 'Delete',
    'common.edit': 'Edit',
    'common.view': 'View',
    'common.search': 'Search',
  },
};

interface LanguageProviderProps {
  children: ReactNode;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem('language');
    return (saved as Language) || 'ar';
  });

  const dir = language === 'ar' ? 'rtl' : 'ltr';

  useEffect(() => {
    localStorage.setItem('language', language);
    document.documentElement.lang = language;
    document.documentElement.dir = dir;
  }, [language, dir]);

  const t = (key: string): string => {
    return translations[language][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, dir }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

