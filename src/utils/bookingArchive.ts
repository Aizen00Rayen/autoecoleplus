import { supabase } from '../supabase';

/**
 * أرشفة الحجوزات التي مضى عليها أكثر من ساعتين بعد وقت الموعد
 * نقلها من bookings إلى archivedBookings
 */
export const archiveOldBookings = async () => {
  try {
    const now = new Date();
    const { data: bookings, error } = await supabase.from('bookings').select('*');
    if (error) throw error;

    let archivedCount = 0;

    for (const booking of (bookings || [])) {
      // تحويل تاريخ ووقت الحجز إلى Date object
      const bookingDateTime = new Date(`${booking.date}T${booking.time}`);

      // إضافة ساعتين إلى وقت الموعد
      const twoHoursAfterBooking = new Date(bookingDateTime.getTime() + (2 * 60 * 60 * 1000));

      // إذا مر أكثر من ساعتين على الموعد، انقله للأرشيف
      if (now > twoHoursAfterBooking) {
        // إضافة إلى الأرشيف
        const { id, ...bookingWithoutId } = booking;
        await supabase.from('archivedBookings').insert({
          ...bookingWithoutId,
          archivedAt: now.toISOString(),
          originalId: id
        });

        // حذف من الحجوزات الأصلية
        await supabase.from('bookings').delete().eq('id', id);

        archivedCount++;
      }
    }

    console.log(`تم أرشفة ${archivedCount} حجز`);
    return archivedCount;
  } catch (error) {
    console.error('خطأ في أرشفة الحجوزات:', error);
    throw error;
  }
};

/**
 * حذف الحجوزات المؤرشفة التي مضى عليها أكثر من أسبوع
 */
export const deleteOldArchivedBookings = async () => {
  try {
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));

    const { data: archivedBookings, error } = await supabase.from('archivedBookings').select('*');
    if (error) throw error;

    let deletedCount = 0;

    for (const archived of (archivedBookings || [])) {
      const archivedDate = new Date(archived.archivedAt);

      // إذا مر أكثر من أسبوع على الأرشفة، احذفه نهائياً
      if (archivedDate < oneWeekAgo) {
        await supabase.from('archivedBookings').delete().eq('id', archived.id);
        deletedCount++;
      }
    }

    console.log(`تم حذف ${deletedCount} حجز من الأرشيف`);
    return deletedCount;
  } catch (error) {
    console.error('خطأ في حذف الحجوزات المؤرشفة:', error);
    throw error;
  }
};

/**
 * تشغيل عملية الأرشفة والحذف معاً
 */
export const runBookingMaintenance = async () => {
  try {
    const archived = await archiveOldBookings();
    const deleted = await deleteOldArchivedBookings();
    
    return {
      archived,
      deleted,
      success: true
    };
  } catch (error) {
    console.error('خطأ في صيانة الحجوزات:', error);
    return {
      archived: 0,
      deleted: 0,
      success: false,
      error
    };
  }
};
