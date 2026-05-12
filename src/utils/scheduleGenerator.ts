import { supabase } from '../supabase';

export interface WorkDay {
  enabled: boolean;
  hours: string[]; // ['08:00', '09:00', '10:00', ...]
}

export interface WorkDays {
  sunday: WorkDay;
  monday: WorkDay;
  tuesday: WorkDay;
  wednesday: WorkDay;
  thursday: WorkDay;
  friday: WorkDay;
  saturday: WorkDay;
}

export interface Session {
  studentId: string;
  studentName: string;
  teacherId: string;
  teacherName: string;
  type: 'code' | 'creneau' | 'circui';
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  day: string; // sunday, monday, etc.
  status: 'scheduled' | 'completed' | 'cancelled';
  createdAt: string;
}

// الحصول على أيام العمل المتاحة
export const getAvailableWorkDays = (workDays: WorkDays): string[] => {
  const days: string[] = [];
  Object.entries(workDays).forEach(([day, config]) => {
    if (config.enabled && config.hours.length > 0) {
      days.push(day);
    }
  });
  return days;
};

// الحصول على جميع الساعات المتاحة في الأسبوع
export const getAllAvailableSlots = (workDays: WorkDays): { day: string; time: string }[] => {
  const slots: { day: string; time: string }[] = [];
  Object.entries(workDays).forEach(([day, config]) => {
    if (config.enabled) {
      config.hours.forEach((hour: string) => {
        slots.push({ day, time: hour });
      });
    }
  });
  return slots;
};

// الحصول على التاريخ التالي لليوم المحدد
export const getNextDateForDay = (dayName: string, startDate: Date = new Date()): Date => {
  const daysMap: { [key: string]: number } = {
    sunday: 0,
    monday: 1,
    tuesday: 2,
    wednesday: 3,
    thursday: 4,
    friday: 5,
    saturday: 6
  };

  const targetDay = daysMap[dayName];
  const currentDay = startDate.getDay();
  let daysToAdd = targetDay - currentDay;
  
  if (daysToAdd <= 0) {
    daysToAdd += 7;
  }

  const nextDate = new Date(startDate);
  nextDate.setDate(nextDate.getDate() + daysToAdd);
  return nextDate;
};

// تنسيق التاريخ YYYY-MM-DD
export const formatDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// التحقق من توفر الموعد
export const isSlotAvailable = async (
  teacherId: string,
  date: string,
  time: string
): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from('sessions')
      .select('id')
      .eq('teacherId', teacherId)
      .eq('date', date)
      .eq('time', time)
      .neq('status', 'cancelled');
    if (error) throw error;
    return !data || data.length === 0;
  } catch (error) {
    console.error('Error checking slot availability:', error);
    return false;
  }
};

export interface DistributionResult {
  success: boolean;
  sessions: Session[];
  distributed: number;
  required: number;
  error?: string;
}

// توزيع الحصص على جدول المعلم
export const distributeSessionsToSchedule = async (
  studentId: string,
  studentName: string,
  teacherId: string,
  teacherName: string,
  workDays: WorkDays | undefined,
  sessionType: 'code' | 'creneau' | 'circui'
): Promise<DistributionResult> => {
  const numberOfSessions = getSessionCount(sessionType);

  // استخدام الجدول الافتراضي إذا كان workDays غير محدد أو جميع أيامه معطّلة
  const resolvedWorkDays: WorkDays = (() => {
    if (!workDays) return getDefaultScheduleWorkDays();
    const hasEnabledDay = Object.values(workDays).some(d => d.enabled && d.hours.length > 0);
    return hasEnabledDay ? workDays : getDefaultScheduleWorkDays();
  })();

  try {
    const sessions: Session[] = [];
    const availableSlots = getAllAvailableSlots(resolvedWorkDays);

    if (availableSlots.length === 0) {
      return {
        success: false,
        sessions: [],
        distributed: 0,
        required: numberOfSessions,
        error: 'No available work days for this teacher'
      };
    }

    let currentDate = new Date();
    let sessionsCreated = 0;
    let slotIndex = 0;
    let attempts = 0;
    const maxAttempts = numberOfSessions * 10; // تجنب الحلقة اللانهائية

    while (sessionsCreated < numberOfSessions && attempts < maxAttempts) {
      attempts++;

      const slot = availableSlots[slotIndex % availableSlots.length];
      const nextDate = getNextDateForDay(slot.day, currentDate);
      const dateStr = formatDate(nextDate);

      // التحقق من توفر الموعد
      const isAvailable = await isSlotAvailable(teacherId, dateStr, slot.time);

      if (isAvailable) {
        const session: Session = {
          studentId,
          studentName,
          teacherId,
          teacherName,
          type: sessionType,
          date: dateStr,
          time: slot.time,
          day: slot.day,
          status: 'scheduled',
          createdAt: new Date().toISOString()
        };

        // حفظ في Supabase
        await supabase.from('sessions').insert(session);
        sessions.push(session);
        sessionsCreated++;
      }

      slotIndex++;

      // الانتقال للأسبوع التالي بعد المرور على جميع الفترات
      if (slotIndex % availableSlots.length === 0) {
        currentDate = new Date(nextDate);
        currentDate.setDate(currentDate.getDate() + 1);
      }
    }

    if (sessionsCreated < numberOfSessions) {
      return {
        success: false,
        sessions,
        distributed: sessionsCreated,
        required: numberOfSessions,
        error: `Only ${sessionsCreated} sessions could be scheduled out of ${numberOfSessions}`
      };
    }

    return {
      success: true,
      sessions,
      distributed: sessionsCreated,
      required: numberOfSessions
    };
  } catch (error) {
    console.error('Error distributing sessions:', error);
    return {
      success: false,
      sessions: [],
      distributed: 0,
      required: numberOfSessions,
      error: 'Failed to distribute sessions'
    };
  }
};

// الحصول على حصص المعلم
export const getTeacherSessions = async (
  teacherId: string,
  startDate?: string,
  endDate?: string
): Promise<Session[]> => {
  try {
    let query = supabase.from('sessions').select('*').eq('teacherId', teacherId);
    if (startDate) query = query.gte('date', startDate);
    if (endDate) query = query.lte('date', endDate);
    const { data, error } = await query;
    if (error) throw error;

    const sessions: Session[] = (data || []) as Session[];

    sessions.sort((a, b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date);
      return a.time.localeCompare(b.time);
    });

    return sessions;
  } catch (error) {
    console.error('Error getting teacher sessions:', error);
    return [];
  }
};

// الحصول على حصص الطالب
export const getStudentSessions = async (studentId: string): Promise<Session[]> => {
  try {
    const { data, error } = await supabase.from('sessions').select('*').eq('studentId', studentId);
    if (error) throw error;

    const sessions: Session[] = (data || []) as Session[];

    sessions.sort((a, b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date);
      return a.time.localeCompare(b.time);
    });

    return sessions;
  } catch (error) {
    console.error('Error getting student sessions:', error);
    return [];
  }
};

// ساعات العمل الافتراضية
export const getDefaultWorkHours = (): string[] => {
  const hours: string[] = [];
  for (let h = 8; h <= 17; h++) {
    hours.push(`${String(h).padStart(2, '0')}:00`);
  }
  return hours;
};

// أيام العمل الافتراضية (جميع الأيام معطّلة)
export const getDefaultWorkDays = (): WorkDays => {
  return {
    sunday: { enabled: false, hours: [] },
    monday: { enabled: false, hours: [] },
    tuesday: { enabled: false, hours: [] },
    wednesday: { enabled: false, hours: [] },
    thursday: { enabled: false, hours: [] },
    friday: { enabled: false, hours: [] },
    saturday: { enabled: false, hours: [] }
  };
};

// 1.1 — عدد الحصص حسب نوع الرخصة
export const getSessionCount = (type: 'code' | 'creneau' | 'circui'): number => {
  return type === 'code' ? 10 : 15;
};

// 1.2 — الجدول الافتراضي للتوزيع (الأحد-الخميس، 08:00-17:00)
export const getDefaultScheduleWorkDays = (): WorkDays => {
  const hours = getDefaultWorkHours();
  const weekdays: (keyof WorkDays)[] = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday'];
  const result = getDefaultWorkDays();
  weekdays.forEach(day => {
    result[day] = { enabled: true, hours };
  });
  return result;
};
