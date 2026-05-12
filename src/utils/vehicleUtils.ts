// Feature: vehicle-selection-booking — دوال الفلترة المساعدة النقية

export interface Vehicle {
  id: string;
  name: string;
  licenseType: string;
  imageUrl?: string;
  disabled: boolean;
}

export interface Session {
  id: string;
  vehicleId: string;
  date: string;
  time: string;
  status: string;
}

export interface BookingParams {
  studentId: string;
  studentName: string;
  teacherId: string;
  teacherName: string;
  date: string;
  time: string;
  notes: string;
  sessionType: 'code' | 'creneau' | 'circui';
  vehicleId?: string;
  vehicleName?: string;
  vehicleImageUrl?: string;
}

export interface BookingDoc {
  studentId: string;
  studentName: string;
  teacherId: string;
  teacherName: string;
  date: string;
  time: string;
  notes: string;
  sessionType: 'code' | 'creneau' | 'circui';
  status: 'pending';
  createdAt: string;
  updatedAt: string;
  vehicleId?: string;
  vehicleName?: string;
  vehicleImageUrl?: string;
}

/** تستبعد المركبات المعطلة (disabled: true) */
export function filterAvailableVehicles(vehicles: Vehicle[]): Vehicle[] {
  return vehicles.filter(v => !v.disabled);
}

/** تُرجع فقط المركبات التي تطابق نوع الرخصة المطلوب */
export function filterByLicenseType(vehicles: Vehicle[], licenseType: string): Vehicle[] {
  return vehicles.filter(v => v.licenseType === licenseType);
}

/**
 * تستبعد المركبات المحجوزة في نفس التاريخ والوقت بحصة غير ملغاة.
 * المركبات ذات الحصص الملغاة فقط تُعتبر متوفرة.
 */
export function filterByAvailability(
  vehicles: Vehicle[],
  sessions: Session[],
  date: string,
  time: string
): Vehicle[] {
  const bookedIds = new Set(
    sessions
      .filter(s => s.date === date && s.time === time && s.status !== 'cancelled')
      .map(s => s.vehicleId)
  );
  return vehicles.filter(v => !bookedIds.has(v.id));
}

/**
 * يبني وثيقة الحجز — يُضيف vehicleId/vehicleName للحصص العملية فقط.
 */
export function buildBookingDocument(params: BookingParams): BookingDoc {
  const now = new Date().toISOString();
  const doc: BookingDoc = {
    studentId: params.studentId,
    studentName: params.studentName,
    teacherId: params.teacherId,
    teacherName: params.teacherName,
    date: params.date,
    time: params.time,
    notes: params.notes,
    sessionType: params.sessionType,
    status: 'pending',
    createdAt: now,
    updatedAt: now,
  };
  if ((params.sessionType === 'creneau' || params.sessionType === 'circui') && params.vehicleId) {
    doc.vehicleId = params.vehicleId;
    doc.vehicleName = params.vehicleName;
    doc.vehicleImageUrl = params.vehicleImageUrl;
  }
  return doc;
}

/** يعكس حالة disabled للمركبة */
export function applyToggle(currentDisabled: boolean): boolean {
  return !currentDisabled;
}
