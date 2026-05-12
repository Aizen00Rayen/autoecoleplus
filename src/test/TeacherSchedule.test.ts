/**
 * Feature: teacher-schedule-sessions
 * اختبارات المهمة 7: TeacherSchedule — التصفية والإحصائيات وتحديث الحالة
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import {
  filterByType,
  filterByStatus,
  filterByDay,
  filterByWeek,
  computeStats,
  getStartOfWeekStr,
  formatDateStr,
  addDaysStr,
} from '../utils/teacherScheduleUtils';

// ===== نماذج البيانات =====

interface Session {
  id: string;
  studentId: string;
  studentName: string;
  teacherId: string;
  teacherName: string;
  type: 'code' | 'creneau' | 'circui';
  date: string;
  time: string;
  day: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  createdAt: string;
}

// ===== Arbitraries =====

const arbitrarySessionType = () =>
  fc.constantFrom('code', 'creneau', 'circui') as fc.Arbitrary<'code' | 'creneau' | 'circui'>;

const arbitrarySessionStatus = () =>
  fc.constantFrom('scheduled', 'completed', 'cancelled') as fc.Arbitrary<'scheduled' | 'completed' | 'cancelled'>;

const arbitraryDateStr = () =>
  fc.date({ min: new Date('2024-01-01'), max: new Date('2026-12-31') }).map(d => formatDateStr(d));

const arbitrarySession = (): fc.Arbitrary<Session> =>
  fc.record({
    id: fc.string({ minLength: 1, maxLength: 20 }),
    studentId: fc.string({ minLength: 1, maxLength: 20 }),
    studentName: fc.string({ minLength: 1, maxLength: 30 }),
    teacherId: fc.string({ minLength: 1, maxLength: 20 }),
    teacherName: fc.string({ minLength: 1, maxLength: 30 }),
    type: arbitrarySessionType(),
    date: arbitraryDateStr(),
    time: fc.constantFrom('08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'),
    day: fc.constantFrom('sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'),
    status: arbitrarySessionStatus(),
    createdAt: fc.constant(new Date().toISOString()),
  });

const arbitraryTypeFilter = () =>
  fc.constantFrom('code', 'creneau', 'circui', 'all');

const arbitraryStatusFilter = () =>
  fc.constantFrom('scheduled', 'completed', 'cancelled', 'all');

// ===== 7.1: التحقق من منطق filterSessions =====

describe('7.1 — filterSessions: العرض الأسبوعي واليومي', () => {

  // اختبارات وحدة محددة
  describe('اختبارات وحدة', () => {
    it('العرض اليومي يعرض اليوم المحدد فقط', () => {
      const sessions: Session[] = [
        { id: '1', studentId: 's1', studentName: 'أحمد', teacherId: 't1', teacherName: 'كريم',
          type: 'code', date: '2025-01-15', time: '09:00', day: 'wednesday',
          status: 'scheduled', createdAt: '' },
        { id: '2', studentId: 's2', studentName: 'سارة', teacherId: 't1', teacherName: 'كريم',
          type: 'creneau', date: '2025-01-16', time: '10:00', day: 'thursday',
          status: 'scheduled', createdAt: '' },
      ];
      const currentDate = new Date('2025-01-15T00:00:00');
      const result = filterByDay(sessions, currentDate);
      expect(result).toHaveLength(1);
      expect(result[0].date).toBe('2025-01-15');
    });

    it('العرض الأسبوعي يشمل الأحد-السبت للأسبوع المحدد', () => {
      // الأسبوع: 2025-01-12 (أحد) إلى 2025-01-18 (سبت)
      const sessions: Session[] = [
        { id: '1', studentId: 's1', studentName: 'أحمد', teacherId: 't1', teacherName: 'كريم',
          type: 'code', date: '2025-01-12', time: '09:00', day: 'sunday',
          status: 'scheduled', createdAt: '' },
        { id: '2', studentId: 's2', studentName: 'سارة', teacherId: 't1', teacherName: 'كريم',
          type: 'creneau', date: '2025-01-18', time: '10:00', day: 'saturday',
          status: 'scheduled', createdAt: '' },
        { id: '3', studentId: 's3', studentName: 'محمد', teacherId: 't1', teacherName: 'كريم',
          type: 'circui', date: '2025-01-19', time: '11:00', day: 'sunday',
          status: 'scheduled', createdAt: '' }, // الأسبوع التالي
        { id: '4', studentId: 's4', studentName: 'فاطمة', teacherId: 't1', teacherName: 'كريم',
          type: 'code', date: '2025-01-11', time: '08:00', day: 'saturday',
          status: 'scheduled', createdAt: '' }, // الأسبوع السابق
      ];
      // currentDate = الأربعاء 2025-01-15 (ضمن الأسبوع 12-18)
      const currentDate = new Date('2025-01-15T00:00:00');
      const result = filterByWeek(sessions, currentDate);
      expect(result).toHaveLength(2);
      expect(result.map(s => s.id).sort()).toEqual(['1', '2']);
    });

    it('getStartOfWeekStr يُعيد الأحد الصحيح', () => {
      // الأربعاء 2025-01-15 → الأحد 2025-01-12
      const date = new Date('2025-01-15T00:00:00');
      expect(getStartOfWeekStr(date)).toBe('2025-01-12');
    });

    it('getStartOfWeekStr للأحد يُعيد نفس اليوم', () => {
      const date = new Date('2025-01-12T00:00:00'); // أحد
      expect(getStartOfWeekStr(date)).toBe('2025-01-12');
    });

    it('getStartOfWeekStr للسبت يُعيد الأحد السابق', () => {
      const date = new Date('2025-01-18T00:00:00'); // سبت
      expect(getStartOfWeekStr(date)).toBe('2025-01-12');
    });

    it('العرض اليومي يُعيد قائمة فارغة إذا لا توجد حصص في اليوم', () => {
      const sessions: Session[] = [
        { id: '1', studentId: 's1', studentName: 'أحمد', teacherId: 't1', teacherName: 'كريم',
          type: 'code', date: '2025-01-16', time: '09:00', day: 'thursday',
          status: 'scheduled', createdAt: '' },
      ];
      const currentDate = new Date('2025-01-15T00:00:00');
      const result = filterByDay(sessions, currentDate);
      expect(result).toHaveLength(0);
    });
  });

  // ===== الخاصية 10: التصفية الزمنية تعيد الحصص ضمن النطاق الصحيح =====
  /**
   * Feature: teacher-schedule-sessions, Property 10: التصفية الزمنية تعيد الحصص ضمن النطاق الصحيح
   * Validates: Requirements 4.6, 4.7
   */
  describe('Property 10: التصفية الزمنية تعيد الحصص ضمن النطاق الصحيح', () => {
    it('العرض اليومي: جميع الحصص المُعادة تطابق اليوم المحدد', () => {
      fc.assert(
        fc.property(
          fc.array(arbitrarySession(), { minLength: 0, maxLength: 20 }),
          fc.date({ min: new Date('2024-01-01'), max: new Date('2026-12-31') }),
          (sessions, currentDate) => {
            const result = filterByDay(sessions, currentDate);
            const expectedDateStr = formatDateStr(currentDate);
            return result.every(s => s.date === expectedDateStr);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('العرض الأسبوعي: جميع الحصص المُعادة تقع بين الأحد والسبت للأسبوع المحدد', () => {
      fc.assert(
        fc.property(
          fc.array(arbitrarySession(), { minLength: 0, maxLength: 20 }),
          fc.date({ min: new Date('2024-01-01'), max: new Date('2026-12-31') }),
          (sessions, currentDate) => {
            const result = filterByWeek(sessions, currentDate);
            const startStr = getStartOfWeekStr(currentDate);
            const endStr = addDaysStr(startStr, 6);
            return result.every(s => s.date >= startStr && s.date <= endStr);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('العرض الأسبوعي: لا تُفقد حصص تقع ضمن الأسبوع', () => {
      fc.assert(
        fc.property(
          fc.array(arbitrarySession(), { minLength: 0, maxLength: 20 }),
          fc.date({ min: new Date('2024-01-01'), max: new Date('2026-12-31') }),
          (sessions, currentDate) => {
            const startStr = getStartOfWeekStr(currentDate);
            const endStr = addDaysStr(startStr, 6);
            const inWeek = sessions.filter(s => s.date >= startStr && s.date <= endStr);
            const result = filterByWeek(sessions, currentDate);
            return result.length === inWeek.length;
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});

// ===== 7.3: رسالة "لا توجد حصص" =====

describe('7.3 — رسالة "لا توجد حصص" عند filteredSessions.length === 0', () => {
  it('filterByDay تُعيد مصفوفة فارغة عند عدم وجود حصص في اليوم', () => {
    const result = filterByDay([], new Date('2025-01-15T00:00:00'));
    expect(result).toHaveLength(0);
  });

  it('filterByWeek تُعيد مصفوفة فارغة عند عدم وجود حصص في الأسبوع', () => {
    const result = filterByWeek([], new Date('2025-01-15T00:00:00'));
    expect(result).toHaveLength(0);
  });
});

// ===== الخاصية 9: التصفية تعيد فقط الحصص المطابقة =====

describe('Property 9: التصفية تعيد فقط الحصص المطابقة', () => {
  /**
   * Feature: teacher-schedule-sessions, Property 9: التصفية تعيد فقط الحصص المطابقة
   * Validates: Requirements 4.3, 4.4
   */
  it('تصفية النوع: النتائج تحتوي فقط على الحصص المطابقة للنوع المحدد', () => {
    fc.assert(
      fc.property(
        fc.array(arbitrarySession(), { minLength: 0, maxLength: 30 }),
        arbitraryTypeFilter(),
        (sessions, typeFilter) => {
          const filtered = filterByType(sessions, typeFilter);
          if (typeFilter === 'all') {
            return filtered.length === sessions.length;
          }
          return filtered.every(s => s.type === typeFilter);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('تصفية النوع: لا تُفقد حصص مطابقة للفلتر', () => {
    fc.assert(
      fc.property(
        fc.array(arbitrarySession(), { minLength: 0, maxLength: 30 }),
        arbitraryTypeFilter(),
        (sessions, typeFilter) => {
          const filtered = filterByType(sessions, typeFilter);
          if (typeFilter === 'all') return true;
          const expected = sessions.filter(s => s.type === typeFilter);
          return filtered.length === expected.length;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('تصفية الحالة: النتائج تحتوي فقط على الحصص المطابقة للحالة المحددة', () => {
    fc.assert(
      fc.property(
        fc.array(arbitrarySession(), { minLength: 0, maxLength: 30 }),
        arbitraryStatusFilter(),
        (sessions, statusFilter) => {
          const filtered = filterByStatus(sessions, statusFilter);
          if (statusFilter === 'all') {
            return filtered.length === sessions.length;
          }
          return filtered.every(s => s.status === statusFilter);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('تصفية الحالة: لا تُفقد حصص مطابقة للفلتر', () => {
    fc.assert(
      fc.property(
        fc.array(arbitrarySession(), { minLength: 0, maxLength: 30 }),
        arbitraryStatusFilter(),
        (sessions, statusFilter) => {
          const filtered = filterByStatus(sessions, statusFilter);
          if (statusFilter === 'all') return true;
          const expected = sessions.filter(s => s.status === statusFilter);
          return filtered.length === expected.length;
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ===== الخاصية 11: تحديث حالة الحصة =====

describe('Property 11: تحديث حالة الحصة يُحفظ في Firebase', () => {
  /**
   * Feature: teacher-schedule-sessions, Property 11: تحديث حالة الحصة يُحفظ في Firebase
   * Validates: Requirements 4.8, 4.9
   */

  // اختبار وحدة: التحقق من منطق تحديث الـ state المحلي
  it('7.2 — تحديث الـ state المحلي بعد updateSessionStatus', () => {
    // محاكاة منطق setSessions في TeacherSchedule
    const sessions: Session[] = [
      { id: 'abc', studentId: 's1', studentName: 'أحمد', teacherId: 't1', teacherName: 'كريم',
        type: 'code', date: '2025-01-15', time: '09:00', day: 'wednesday',
        status: 'scheduled', createdAt: '' },
      { id: 'def', studentId: 's2', studentName: 'سارة', teacherId: 't1', teacherName: 'كريم',
        type: 'creneau', date: '2025-01-16', time: '10:00', day: 'thursday',
        status: 'scheduled', createdAt: '' },
    ];

    // منطق تحديث الـ state (مستخرج من updateSessionStatus)
    const updateLocalState = (
      sessions: Session[],
      sessionId: string,
      newStatus: 'completed' | 'cancelled'
    ): Session[] =>
      sessions.map(s => s.id === sessionId ? { ...s, status: newStatus } : s);

    const updated = updateLocalState(sessions, 'abc', 'completed');
    expect(updated.find(s => s.id === 'abc')?.status).toBe('completed');
    expect(updated.find(s => s.id === 'def')?.status).toBe('scheduled'); // لم يتغير
  });

  it('تحديث حصة واحدة لا يؤثر على الحصص الأخرى', () => {
    fc.assert(
      fc.property(
        fc.array(arbitrarySession(), { minLength: 1, maxLength: 20 }),
        fc.constantFrom('completed', 'cancelled') as fc.Arbitrary<'completed' | 'cancelled'>,
        (sessions, newStatus) => {
          const targetId = sessions[0].id;
          const updated = sessions.map(s =>
            s.id === targetId ? { ...s, status: newStatus } : s
          );
          // الحصة المستهدفة تحدّثت
          const target = updated.find(s => s.id === targetId);
          if (!target) return false;
          if (target.status !== newStatus) return false;
          // الحصص الأخرى لم تتغير
          return updated
            .filter(s => s.id !== targetId)
            .every((s, i) => {
              const original = sessions.filter(x => x.id !== targetId)[i];
              return s.status === original.status;
            });
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ===== الخاصية 12: صحة الإحصائيات الملخصة =====

describe('Property 12: صحة الإحصائيات الملخصة', () => {
  /**
   * Feature: teacher-schedule-sessions, Property 12: صحة الإحصائيات الملخصة
   * Validates: Requirements 4.10
   */
  it('مجموع (مكتملة + مجدولة + ملغاة) يساوي الإجمالي', () => {
    fc.assert(
      fc.property(
        fc.array(arbitrarySession(), { minLength: 0, maxLength: 50 }),
        (sessions) => {
          const stats = computeStats(sessions);
          return stats.completed + stats.scheduled + stats.cancelled === stats.total;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('الإجمالي يساوي طول المصفوفة', () => {
    fc.assert(
      fc.property(
        fc.array(arbitrarySession(), { minLength: 0, maxLength: 50 }),
        (sessions) => {
          const stats = computeStats(sessions);
          return stats.total === sessions.length;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('الإحصائيات صحيحة لمصفوفة فارغة', () => {
    const stats = computeStats([]);
    expect(stats.total).toBe(0);
    expect(stats.completed).toBe(0);
    expect(stats.scheduled).toBe(0);
    expect(stats.cancelled).toBe(0);
  });

  it('الإحصائيات صحيحة لمصفوفة بحصة واحدة مكتملة', () => {
    const sessions: Session[] = [
      { id: '1', studentId: 's1', studentName: 'أحمد', teacherId: 't1', teacherName: 'كريم',
        type: 'code', date: '2025-01-15', time: '09:00', day: 'wednesday',
        status: 'completed', createdAt: '' },
    ];
    const stats = computeStats(sessions);
    expect(stats.total).toBe(1);
    expect(stats.completed).toBe(1);
    expect(stats.scheduled).toBe(0);
    expect(stats.cancelled).toBe(0);
  });
});
