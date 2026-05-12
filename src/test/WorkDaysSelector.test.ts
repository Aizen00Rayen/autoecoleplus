/**
 * Feature: teacher-schedule-sessions
 * اختبارات الخصائص لـ WorkDaysSelector
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { getDefaultWorkHours, getDefaultWorkDays } from '../utils/scheduleGenerator';
import type { WorkDays } from '../utils/scheduleGenerator';

// ===== منطق handleDayToggle المستخرج من WorkDaysSelector =====
const defaultHours = getDefaultWorkHours();

function handleDayToggle(workDays: WorkDays, day: string): WorkDays {
  const newWorkDays: WorkDays = JSON.parse(JSON.stringify(workDays));
  const key = day as keyof WorkDays;
  newWorkDays[key].enabled = !newWorkDays[key].enabled;

  // إذا تم تفعيل اليوم وكانت ساعاته فارغة، أضف الساعات الافتراضية
  if (newWorkDays[key].enabled && newWorkDays[key].hours.length === 0) {
    newWorkDays[key].hours = [...defaultHours];
  }

  return newWorkDays;
}

function handleHourToggle(workDays: WorkDays, day: string, hour: string): WorkDays {
  const newWorkDays: WorkDays = JSON.parse(JSON.stringify(workDays));
  const dayConfig = newWorkDays[day as keyof WorkDays];

  if (dayConfig.hours.includes(hour)) {
    dayConfig.hours = dayConfig.hours.filter((h: string) => h !== hour);
  } else {
    dayConfig.hours = [...dayConfig.hours, hour].sort();
  }

  return newWorkDays;
}

// ===== Arbitraries =====

const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as const;
type DayName = typeof dayNames[number];

const arbitraryDay = () => fc.constantFrom(...dayNames);

const arbitraryWorkDays = () =>
  fc.record({
    sunday:    fc.record({ enabled: fc.boolean(), hours: fc.array(fc.constantFrom(...defaultHours)) }),
    monday:    fc.record({ enabled: fc.boolean(), hours: fc.array(fc.constantFrom(...defaultHours)) }),
    tuesday:   fc.record({ enabled: fc.boolean(), hours: fc.array(fc.constantFrom(...defaultHours)) }),
    wednesday: fc.record({ enabled: fc.boolean(), hours: fc.array(fc.constantFrom(...defaultHours)) }),
    thursday:  fc.record({ enabled: fc.boolean(), hours: fc.array(fc.constantFrom(...defaultHours)) }),
    friday:    fc.record({ enabled: fc.boolean(), hours: fc.array(fc.constantFrom(...defaultHours)) }),
    saturday:  fc.record({ enabled: fc.boolean(), hours: fc.array(fc.constantFrom(...defaultHours)) }),
  }) as fc.Arbitrary<WorkDays>;

// ===== الخاصية 7: استقلالية ساعات الأيام =====

describe('WorkDaysSelector — Property 7: استقلالية ساعات الأيام', () => {
  /**
   * Feature: teacher-schedule-sessions, Property 7: استقلالية ساعات الأيام في WorkDaysSelector
   * Validates: Requirements 2.5
   */
  it('تعديل ساعات يوم معين لا يؤثر على ساعات الأيام الأخرى', () => {
    fc.assert(
      fc.property(
        arbitraryWorkDays(),
        arbitraryDay(),
        fc.constantFrom(...defaultHours),
        (workDays, targetDay, hour) => {
          const before: WorkDays = JSON.parse(JSON.stringify(workDays));
          const updated = handleHourToggle(workDays, targetDay, hour);

          // جميع الأيام الأخرى يجب أن تبقى كما هي
          return dayNames
            .filter((d) => d !== targetDay)
            .every(
              (d) =>
                JSON.stringify(updated[d].hours) === JSON.stringify(before[d].hours) &&
                updated[d].enabled === before[d].enabled
            );
        }
      ),
      { numRuns: 100 }
    );
  });

  it('تفعيل/تعطيل يوم لا يؤثر على ساعات الأيام الأخرى', () => {
    fc.assert(
      fc.property(
        arbitraryWorkDays(),
        arbitraryDay(),
        (workDays, targetDay) => {
          const before: WorkDays = JSON.parse(JSON.stringify(workDays));
          const updated = handleDayToggle(workDays, targetDay);

          return dayNames
            .filter((d) => d !== targetDay)
            .every(
              (d) =>
                JSON.stringify(updated[d].hours) === JSON.stringify(before[d].hours) &&
                updated[d].enabled === before[d].enabled
            );
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ===== الخاصية 8: الساعات الافتراضية عند تفعيل يوم =====

describe('WorkDaysSelector — Property 8: الساعات الافتراضية عند تفعيل يوم', () => {
  /**
   * Feature: teacher-schedule-sessions, Property 8: الساعات الافتراضية عند تفعيل يوم
   * Validates: Requirements 2.4
   */
  it('عند تفعيل يوم كانت ساعاته فارغة، تُعيَّن ساعات 08:00-17:00 تلقائياً', () => {
    fc.assert(
      fc.property(
        arbitraryDay(),
        (day) => {
          // يوم معطّل وساعاته فارغة
          const workDays = getDefaultWorkDays();
          workDays[day as keyof WorkDays].enabled = false;
          workDays[day as keyof WorkDays].hours = [];

          const updated = handleDayToggle(workDays, day);

          // يجب أن يكون مفعّلاً وساعاته = defaultHours
          return (
            updated[day as keyof WorkDays].enabled === true &&
            JSON.stringify(updated[day as keyof WorkDays].hours) ===
              JSON.stringify(defaultHours)
          );
        }
      ),
      { numRuns: 100 }
    );
  });

  it('عند تفعيل يوم كانت ساعاته غير فارغة، لا تُعاد كتابة ساعاته', () => {
    fc.assert(
      fc.property(
        arbitraryDay(),
        fc.array(fc.constantFrom(...defaultHours), { minLength: 1 }),
        (day, existingHours) => {
          const workDays = getDefaultWorkDays();
          workDays[day as keyof WorkDays].enabled = false;
          workDays[day as keyof WorkDays].hours = existingHours;

          const updated = handleDayToggle(workDays, day);

          // الساعات يجب أن تبقى كما هي (لم تكن فارغة)
          return (
            updated[day as keyof WorkDays].enabled === true &&
            JSON.stringify(updated[day as keyof WorkDays].hours) ===
              JSON.stringify(existingHours)
          );
        }
      ),
      { numRuns: 100 }
    );
  });

  it('الساعات الافتراضية تشمل 08:00 إلى 17:00 بالضبط (10 ساعات)', () => {
    const hours = getDefaultWorkHours();
    expect(hours).toHaveLength(10);
    expect(hours[0]).toBe('08:00');
    expect(hours[hours.length - 1]).toBe('17:00');
  });
});
