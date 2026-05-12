/**
 * دوال مساعدة لـ TeacherSchedule — قابلة للاختبار بشكل مستقل
 */

export interface SessionForFilter {
  id: string;
  type: 'code' | 'creneau' | 'circui';
  date: string; // YYYY-MM-DD
  status: 'scheduled' | 'completed' | 'cancelled';
  [key: string]: unknown;
}

/**
 * إيجاد بداية الأسبوع (الأحد) لتاريخ معين
 * يُعيد سلسلة نصية YYYY-MM-DD لتجنب مشاكل timezone
 */
export const getStartOfWeekStr = (date: Date): string => {
  const d = new Date(date);
  const day = d.getDay(); // 0=Sunday
  d.setDate(d.getDate() - day);
  return formatDateStr(d);
};

/**
 * تنسيق Date إلى YYYY-MM-DD بالتوقيت المحلي
 */
export const formatDateStr = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * إضافة أيام إلى تاريخ وإعادة سلسلة YYYY-MM-DD
 */
export const addDaysStr = (dateStr: string, days: number): string => {
  const d = new Date(dateStr + 'T00:00:00');
  d.setDate(d.getDate() + days);
  return formatDateStr(d);
};

/**
 * تصفية الحصص حسب النوع
 */
export const filterByType = <T extends { type: string }>(
  sessions: T[],
  typeFilter: string
): T[] => {
  if (typeFilter === 'all') return sessions;
  return sessions.filter(s => s.type === typeFilter);
};

/**
 * تصفية الحصص حسب الحالة
 */
export const filterByStatus = <T extends { status: string }>(
  sessions: T[],
  statusFilter: string
): T[] => {
  if (statusFilter === 'all') return sessions;
  return sessions.filter(s => s.status === statusFilter);
};

/**
 * تصفية الحصص للعرض اليومي
 */
export const filterByDay = <T extends { date: string }>(
  sessions: T[],
  currentDate: Date
): T[] => {
  const dateStr = formatDateStr(currentDate);
  return sessions.filter(s => s.date === dateStr);
};

/**
 * تصفية الحصص للعرض الأسبوعي (الأحد-السبت)
 * يستخدم مقارنة نصية لتجنب مشاكل timezone
 */
export const filterByWeek = <T extends { date: string }>(
  sessions: T[],
  currentDate: Date
): T[] => {
  const startStr = getStartOfWeekStr(currentDate);
  const endStr = addDaysStr(startStr, 6);
  return sessions.filter(s => s.date >= startStr && s.date <= endStr);
};

/**
 * حساب إحصائيات الحصص
 */
export const computeStats = (sessions: { status: string }[]) => {
  const completed = sessions.filter(s => s.status === 'completed').length;
  const scheduled = sessions.filter(s => s.status === 'scheduled').length;
  const cancelled = sessions.filter(s => s.status === 'cancelled').length;
  return {
    total: sessions.length,
    completed,
    scheduled,
    cancelled,
  };
};
