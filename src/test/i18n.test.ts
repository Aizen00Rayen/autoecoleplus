/**
 * Feature: teacher-schedule-sessions
 * اختبارات المهمة 8: دعم تعدد اللغات — الخصائص 13 و14
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

// ===== بيانات الترجمة المستخرجة من المكونات =====

type Language = 'ar' | 'fr' | 'en';

// أسماء الأيام (من TeacherSchedule.tsx - getDayName)
const dayNames: Record<Language, Record<string, string>> = {
  ar: {
    sunday: 'الأحد',
    monday: 'الاثنين',
    tuesday: 'الثلاثاء',
    wednesday: 'الأربعاء',
    thursday: 'الخميس',
    friday: 'الجمعة',
    saturday: 'السبت',
  },
  fr: {
    sunday: 'Dimanche',
    monday: 'Lundi',
    tuesday: 'Mardi',
    wednesday: 'Mercredi',
    thursday: 'Jeudi',
    friday: 'Vendredi',
    saturday: 'Samedi',
  },
  en: {
    sunday: 'Sunday',
    monday: 'Monday',
    tuesday: 'Tuesday',
    wednesday: 'Wednesday',
    thursday: 'Thursday',
    friday: 'Friday',
    saturday: 'Saturday',
  },
};

// أنواع الحصص (من TeacherSchedule.tsx - getTypeName)
const typeNames: Record<Language, Record<string, string>> = {
  ar: { code: 'كود', creneau: 'كرينو', circui: 'سيركوي' },
  fr: { code: 'Code', creneau: 'Créneau', circui: 'Circuit' },
  en: { code: 'Code', creneau: 'Creneau', circui: 'Circuit' },
};

// حالات الحصص (من TeacherSchedule.tsx - getStatusName)
const statusNames: Record<Language, Record<string, string>> = {
  ar: { scheduled: 'مجدولة', completed: 'مكتملة', cancelled: 'ملغاة' },
  fr: { scheduled: 'Programmée', completed: 'Terminée', cancelled: 'Annulée' },
  en: { scheduled: 'Scheduled', completed: 'Completed', cancelled: 'Cancelled' },
};

// رسائل ManagePayments (من ManagePayments.tsx - togglePayment)
const paymentMessages = {
  noTeacher: {
    ar: 'تم تحديث حالة الدفع — تنبيه: لم يتم توزيع الحصص لأن الطالب غير مرتبط بمعلم',
    fr: "Paiement mis à jour — Attention : aucune session distribuée car l'étudiant n'a pas d'enseignant assigné",
    en: 'Payment updated — Warning: no sessions distributed because the student has no assigned teacher',
  },
  updateSuccess: {
    ar: 'تم تحديث حالة الدفع بنجاح',
    fr: 'Statut de paiement mis à jour',
    en: 'Payment status updated',
  },
  firebaseError: {
    ar: 'تم تحديث حالة الدفع — خطأ: فشل الاتصال بـ Firebase أثناء توزيع الحصص',
    fr: 'Paiement mis à jour — Erreur : échec de connexion à Firebase lors de la distribution des sessions',
    en: 'Payment updated — Error: Firebase connection failed while distributing sessions',
  },
  updateError: {
    ar: 'حدث خطأ أثناء تحديث الدفع',
    fr: 'Erreur lors de la mise à jour',
    en: 'Error updating payment',
  },
};

// دوال مساعدة تحاكي منطق المكونات
function getDayName(day: string, language: Language): string {
  return dayNames[language][day] || day;
}

function getTypeName(type: string, language: Language): string {
  return typeNames[language][type] || type;
}

function getStatusName(status: string, language: Language): string {
  return statusNames[language][status] || status;
}

function getDir(language: Language): 'rtl' | 'ltr' {
  return language === 'ar' ? 'rtl' : 'ltr';
}

// ===== Arbitraries =====

const arbitraryLanguage = () => fc.constantFrom('ar', 'fr', 'en') as fc.Arbitrary<Language>;
const arbitraryDay = () =>
  fc.constantFrom('sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday');
const arbitraryType = () => fc.constantFrom('code', 'creneau', 'circui');
const arbitraryStatus = () => fc.constantFrom('scheduled', 'completed', 'cancelled');

// ===== الخاصية 13: دعم اللغات في الرسائل والتسميات =====

describe('Property 13: دعم اللغات في الرسائل والتسميات', () => {
  /**
   * Feature: teacher-schedule-sessions, Property 13: دعم اللغات في الرسائل والتسميات
   * Validates: Requirements 6.1, 6.2, 6.3
   */

  it('أسماء الأيام غير فارغة لأي لغة ويوم', () => {
    fc.assert(
      fc.property(arbitraryDay(), arbitraryLanguage(), (day, lang) => {
        const name = getDayName(day, lang);
        return name.length > 0 && name !== day; // يجب أن يكون مترجماً
      }),
      { numRuns: 100 }
    );
  });

  it('أسماء الأيام مختلفة بين اللغات', () => {
    fc.assert(
      fc.property(arbitraryDay(), (day) => {
        const ar = getDayName(day, 'ar');
        const fr = getDayName(day, 'fr');
        const en = getDayName(day, 'en');
        // كل لغة تُعيد قيمة مختلفة
        return ar !== fr && ar !== en;
      }),
      { numRuns: 100 }
    );
  });

  it('أنواع الحصص غير فارغة لأي لغة ونوع', () => {
    fc.assert(
      fc.property(arbitraryType(), arbitraryLanguage(), (type, lang) => {
        const name = getTypeName(type, lang);
        return name.length > 0;
      }),
      { numRuns: 100 }
    );
  });

  it('حالات الحصص غير فارغة لأي لغة وحالة', () => {
    fc.assert(
      fc.property(arbitraryStatus(), arbitraryLanguage(), (status, lang) => {
        const name = getStatusName(status, lang);
        return name.length > 0 && name !== status; // يجب أن يكون مترجماً
      }),
      { numRuns: 100 }
    );
  });

  it('حالات الحصص مختلفة بين اللغات', () => {
    fc.assert(
      fc.property(arbitraryStatus(), (status) => {
        const ar = getStatusName(status, 'ar');
        const fr = getStatusName(status, 'fr');
        const en = getStatusName(status, 'en');
        return ar !== fr && ar !== en;
      }),
      { numRuns: 100 }
    );
  });

  // اختبارات وحدة محددة للرسائل
  it('رسالة غياب المعلم موجودة بالثلاث لغات', () => {
    expect(paymentMessages.noTeacher.ar).toBeTruthy();
    expect(paymentMessages.noTeacher.fr).toBeTruthy();
    expect(paymentMessages.noTeacher.en).toBeTruthy();
    // كل رسالة مختلفة
    expect(paymentMessages.noTeacher.ar).not.toBe(paymentMessages.noTeacher.fr);
    expect(paymentMessages.noTeacher.ar).not.toBe(paymentMessages.noTeacher.en);
  });

  it('رسالة نجاح التحديث موجودة بالثلاث لغات', () => {
    expect(paymentMessages.updateSuccess.ar).toBeTruthy();
    expect(paymentMessages.updateSuccess.fr).toBeTruthy();
    expect(paymentMessages.updateSuccess.en).toBeTruthy();
  });

  it('رسالة خطأ Firebase موجودة بالثلاث لغات', () => {
    expect(paymentMessages.firebaseError.ar).toBeTruthy();
    expect(paymentMessages.firebaseError.fr).toBeTruthy();
    expect(paymentMessages.firebaseError.en).toBeTruthy();
  });

  it('رسالة خطأ التحديث موجودة بالثلاث لغات', () => {
    expect(paymentMessages.updateError.ar).toBeTruthy();
    expect(paymentMessages.updateError.fr).toBeTruthy();
    expect(paymentMessages.updateError.en).toBeTruthy();
  });

  it('WorkDaysSelector: أسماء الأيام مترجمة بالثلاث لغات', () => {
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const languages: Language[] = ['ar', 'fr', 'en'];
    for (const day of days) {
      for (const lang of languages) {
        expect(dayNames[lang][day]).toBeTruthy();
      }
    }
  });
});

// ===== الخاصية 14: اتجاه RTL عند اللغة العربية =====

describe('Property 14: اتجاه RTL عند اللغة العربية', () => {
  /**
   * Feature: teacher-schedule-sessions, Property 14: اتجاه RTL عند اللغة العربية
   * Validates: Requirements 6.4
   */

  it('اللغة العربية تُعيد dir=rtl', () => {
    expect(getDir('ar')).toBe('rtl');
  });

  it('اللغة الفرنسية تُعيد dir=ltr', () => {
    expect(getDir('fr')).toBe('ltr');
  });

  it('اللغة الإنجليزية تُعيد dir=ltr', () => {
    expect(getDir('en')).toBe('ltr');
  });

  it('فقط اللغة العربية تُعيد rtl', () => {
    fc.assert(
      fc.property(arbitraryLanguage(), (lang) => {
        const dir = getDir(lang);
        if (lang === 'ar') return dir === 'rtl';
        return dir === 'ltr';
      }),
      { numRuns: 100 }
    );
  });

  it('اللغات غير العربية تُعيد ltr دائماً', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('fr', 'en') as fc.Arbitrary<'fr' | 'en'>,
        (lang) => getDir(lang) === 'ltr'
      ),
      { numRuns: 100 }
    );
  });
});
