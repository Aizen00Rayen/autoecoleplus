import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LanguageProvider, useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { supabase } from '../supabase';
import { Calendar, Clock, User, Check, X, AlertCircle, Loader2, Mail, BookOpen, Car, Trophy, Search } from 'lucide-react';
import { filterAvailableVehicles, filterByLicenseType, filterByAvailability, buildBookingDocument } from '../utils/vehicleUtils';
import type { Vehicle as VehicleUtil } from '../utils/vehicleUtils';
import '../components/style/theme.css';

interface Teacher {
  id: string;
  fullName: string;
  licenseType: string;
  photoURL?: string;
  workDays?: Record<string, { enabled: boolean; hours: string[] }>;
}

interface Booking {
  id: string;
  studentId: string;
  studentName: string;
  teacherId: string;
  teacherName: string;
  date: string;
  time: string;
  notes: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  sessionType?: 'code' | 'creneau' | 'circui';
  vehicleId?: string;
  vehicleName?: string;
  vehicleImageUrl?: string;
}

const BookingPageContent = () => {
  const { language } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [allTeachers, setAllTeachers] = useState<Teacher[]>([]);
  const [availableTeachers, setAvailableTeachers] = useState<Teacher[]>([]);
  const [studentData, setStudentData] = useState<any>(null);
  const [myBookings, setMyBookings] = useState<Booking[]>([]);
  const [bookingMessagesCount, setBookingMessagesCount] = useState<{[key: string]: number}>({});
  const [teachersData, setTeachersData] = useState<{[key: string]: any}>({});
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [searched, setSearched] = useState(false);

  // حالات المركبة
  const [availableVehicles, setAvailableVehicles] = useState<VehicleUtil[]>([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState('');
  const [selectedVehicleName, setSelectedVehicleName] = useState('');
  const [selectedVehicleImageUrl, setSelectedVehicleImageUrl] = useState('');

  // Step 1: session type, date, time — Step 2: pick teacher
  const [sessionType, setSessionType] = useState<'code' | 'creneau' | 'circui' | ''>('');
  const [formData, setFormData] = useState({
    teacherId: '',
    date: '',
    time: '',
    notes: ''
  });

  const dayNames = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'];

  // جلب بيانات الطالب والمعلمين
  useEffect(() => {
    if (user?.uid) {
      fetchStudentData();
      fetchAllTeachers();
      fetchMyBookings();
    }
  }, [user]);

  const fetchStudentData = async () => {
    if (!user?.uid) return;
    try {
      const { data } = await supabase.from('users').select('*').eq('id', user.uid).single();
      if (data) setStudentData(data);
    } catch (e) { console.error(e); }
  };

  const fetchAllTeachers = async () => {
    try {
      const { data } = await supabase.from('users').select('*').eq('role', 'teacher');
      setAllTeachers((data || []).map(d => ({
        id: d.id,
        fullName: d.fullName,
        licenseType: d.licenseType || 'B',
        photoURL: d.photoURL || d.profileImage || '',
        workDays: d.workDays || null
      })));
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  // البحث عن المعلمين المتوفرين في التاريخ والوقت المحددين
  const searchAvailableTeachers = async () => {
    if (!sessionType || !formData.date || !formData.time) return;
    setIsSearching(true);
    setSearched(false);
    setAvailableTeachers([]);
    setFormData(prev => ({ ...prev, teacherId: '' }));

    try {
      const dateObj = new Date(formData.date);
      const dayName = dayNames[dateObj.getDay()];
      const hour = formData.time.substring(0, 5); // HH:MM

      // تصفية المعلمين حسب نوع الحصة
      let candidateTeachers = allTeachers;
      if (sessionType === 'creneau' || sessionType === 'circui') {
        // نفس نوع رخصة الطالب
        const studentLicense = studentData?.licenseType || 'B';
        candidateTeachers = allTeachers.filter(t => t.licenseType === studentLicense);
      }
      // code → جميع المعلمين

      // التحقق من أيام عمل كل معلم وعدم وجود حصة مسبقة
      const available: Teacher[] = [];
      for (const teacher of candidateTeachers) {
        // التحقق من أيام العمل
        if (teacher.workDays) {
          const dayConfig = teacher.workDays[dayName];
          if (!dayConfig?.enabled || !dayConfig.hours.includes(hour)) continue;
        }
        // التحقق من عدم وجود حجز مقبول أو قيد الانتظار في نفس الوقت
        const { data: conflictData } = await supabase
          .from('bookings')
          .select('status')
          .eq('teacherId', teacher.id)
          .eq('date', formData.date)
          .eq('time', hour);
        const hasConflict = (conflictData || []).some(d => d.status === 'approved' || d.status === 'pending');
        if (!hasConflict) {
          available.push(teacher);
        }
      }

      setAvailableTeachers(available);
      setSearched(true);

      // جلب المركبات المتوفرة للحصص العملية
      if (sessionType === 'creneau' || sessionType === 'circui') {
        await fetchAvailableVehicles(formData.date, hour, studentData?.licenseType || 'B');
      } else {
        setAvailableVehicles([]);
        setSelectedVehicleId('');
        setSelectedVehicleName('');
        setSelectedVehicleImageUrl('');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSearching(false);
    }
  };

  const fetchAvailableVehicles = async (date: string, time: string, licenseType: string) => {
    try {
      const { data: vehiclesData } = await supabase.from('vehicles').select('*');
      const all: VehicleUtil[] = (vehiclesData || []).map(d => ({
        id: d.id, name: d.name, licenseType: d.licenseType,
        imageUrl: d.imageUrl, disabled: d.disabled ?? false,
      }));

      // جلب الحجوزات المقبولة أو قيد الانتظار في نفس التاريخ والوقت للتحقق من التعارض
      const { data: bookingsData } = await supabase
        .from('bookings').select('*').eq('date', date).eq('time', time);
      const sessions = (bookingsData || [])
        .filter(d => d.status === 'approved' || d.status === 'pending')
        .map(d => ({ id: d.id, vehicleId: d.vehicleId || '', date: d.date, time: d.time, status: d.status }));

      const filtered = filterByAvailability(
        filterByLicenseType(filterAvailableVehicles(all), licenseType),
        sessions, date, time
      );
      setAvailableVehicles(filtered);
    } catch (e) {
      console.error('Error fetching vehicles:', e);
      setAvailableVehicles([]);
    }
  };

  // جلب عدد الرسائل غير المقروءة لكل حجز في الوقت الفعلي
  useEffect(() => {
    if (!user?.uid || myBookings.length === 0) return;

    const channels: ReturnType<typeof supabase.channel>[] = [];

    for (const booking of myBookings) {
      if (booking.status === 'approved') {
        const ch = supabase
          .channel(`booking-msgs-student-${booking.id}`)
          .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, async () => {
            const { count } = await supabase
              .from('messages')
              .select('*', { count: 'exact', head: true })
              .eq('senderId', booking.teacherId)
              .eq('receiverId', user!.uid)
              .eq('read', false)
              .eq('chatType', 'booking')
              .eq('bookingId', booking.id);
            setBookingMessagesCount(prev => ({ ...prev, [booking.id]: count ?? 0 }));
          })
          .subscribe();
        channels.push(ch);
      }
    }

    return () => { channels.forEach(ch => supabase.removeChannel(ch)); };
  }, [user?.uid, myBookings]);

  const fetchMyBookings = async () => {
    if (!user?.uid) return;

    try {
      const { data: bookingsData } = await supabase.from('bookings').select('*').eq('studentId', user.uid);
      const bookingsList: Booking[] = (bookingsData || []).map(d => ({
        id: d.id, studentId: d.studentId, studentName: d.studentName,
        teacherId: d.teacherId, teacherName: d.teacherName,
        date: d.date, time: d.time, notes: d.notes, status: d.status,
        createdAt: d.createdAt, sessionType: d.sessionType,
        vehicleId: d.vehicleId, vehicleName: d.vehicleName, vehicleImageUrl: d.vehicleImageUrl,
      }));

      // ترتيب حسب التاريخ (الأحدث أولاً)
      bookingsList.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setMyBookings(bookingsList);

      // جلب بيانات المعلمين
      await fetchTeachersData(bookingsList);
    } catch (error) {
      console.error('Error fetching bookings:', error);
    }
  };

  const fetchTeachersData = async (bookingsList: Booking[]) => {
    try {
      const teacherIds = [...new Set(bookingsList.map(b => b.teacherId))];
      if (teacherIds.length === 0) return;
      const { data } = await supabase.from('users').select('*').in('id', teacherIds);
      const teachersDataMap: {[key: string]: any} = {};
      (data || []).forEach(t => { teachersDataMap[t.id] = t; });
      setTeachersData(teachersDataMap);
    } catch (error) {
      console.error('Error fetching teachers data:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage('');
    setError('');

    try {
      if (!user?.uid) {
        setError(language === 'ar' ? 'يجب تسجيل الدخول أولاً' : language === 'fr' ? 'Vous devez vous connecter' : 'You must login first');
        setIsSubmitting(false);
        return;
      }

      // التحقق من الدفع وعدد الحصص
      const payments = studentData?.payments || {};
      const approvedCount = myBookings.filter(b => b.status === 'approved' && b.sessionType === sessionType).length;
      const maxSessions = sessionType === 'code' ? 10 : 15;
      if (!payments[sessionType as string]) {
        setError(
          language === 'ar' ? `لا يمكن الحجز — لم يتم دفع ثمن حصص ${sessionType === 'code' ? 'الكود' : sessionType === 'creneau' ? 'الكرينو' : 'السيركوي'} بعد`
          : language === 'fr' ? `Réservation impossible — paiement ${sessionType} non effectué`
          : `Cannot book — ${sessionType} payment not completed`
        );
        setIsSubmitting(false);
        return;
      }
      if (approvedCount >= maxSessions) {
        setError(
          language === 'ar' ? 'لقد أكملت جميع الحصص المتاحة لهذا النوع'
          : language === 'fr' ? 'Vous avez complété toutes les séances disponibles'
          : 'You have completed all available sessions for this type'
        );
        setIsSubmitting(false);
        return;
      }

      // جلب بيانات الطالب
      const { data: freshStudentData } = await supabase.from('users').select('*').eq('id', user.uid).single();

      // جلب بيانات المعلم
      const { data: teacherData } = await supabase.from('users').select('*').eq('id', formData.teacherId).single();

      // إنشاء الحجز
      await supabase.from('bookings').insert(buildBookingDocument({
        studentId: user.uid,
        studentName: freshStudentData?.fullName || 'Unknown',
        teacherId: formData.teacherId,
        teacherName: teacherData?.fullName || 'Unknown',
        date: formData.date,
        time: formData.time,
        notes: formData.notes,
        sessionType: sessionType as 'code' | 'creneau' | 'circui',
        vehicleId: selectedVehicleId || undefined,
        vehicleName: selectedVehicleName || undefined,
        vehicleImageUrl: selectedVehicleImageUrl || undefined,
      }));

      setMessage(
        language === 'ar'
          ? 'تم إرسال طلب الحجز بنجاح! في انتظار موافقة المعلم.'
          : language === 'fr'
          ? 'Demande de réservation envoyée avec succès! En attente de l\'approbation de l\'instructeur.'
          : 'Booking request sent successfully! Waiting for instructor approval.'
      );

      setFormData({ teacherId: '', date: '', time: '', notes: '' });
      setSessionType('');
      setAvailableVehicles([]);
      setSelectedVehicleId('');
      setSelectedVehicleName('');
      setSelectedVehicleImageUrl('');
      setShowDialog(false);
      fetchMyBookings();
    } catch (error) {
      console.error('Error creating booking:', error);
      setError(
        language === 'ar'
          ? 'حدث خطأ أثناء إنشاء الحجز'
          : language === 'fr'
          ? 'Erreur lors de la création de la réservation'
          : 'Error creating booking'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const map: Record<string, { cls: string; icon: typeof Clock; text: string }> = {
      pending: {
        cls: 'badge-warning',
        icon: Clock,
        text: language === 'ar' ? 'قيد الانتظار' : language === 'fr' ? 'En attente' : 'Pending',
      },
      approved: {
        cls: 'badge-success',
        icon: Check,
        text: language === 'ar' ? 'مقبول' : language === 'fr' ? 'Approuvé' : 'Approved',
      },
      rejected: {
        cls: 'badge-pro',
        icon: X,
        text: language === 'ar' ? 'مرفوض' : language === 'fr' ? 'Rejeté' : 'Rejected',
      },
    };
    const entry = map[status] || map.pending;
    const Icon = entry.icon;
    return (
      <span className={entry.cls} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem' }}>
        <Icon size={13} />
        {entry.text}
      </span>
    );
  };

  // الحصول على الحد الأدنى للتاريخ (اليوم)
  const today = new Date().toISOString().split('T')[0];

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-darkest)', color: 'var(--text-primary)' }}>
      <Navbar />

      <main style={{ padding: '6rem 1.5rem 3rem', maxWidth: '1400px', margin: '0 auto' }}>

        {/* Header card */}
        <div style={{ marginBottom: '2.5rem' }}>
          <div style={{
            background: 'var(--grad-card)', border: '1px solid var(--border)',
            padding: '2rem', borderRadius: 'var(--radius-lg)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            flexWrap: 'wrap', gap: '1.5rem',
          }}>
            <div>
              <h1 style={{
                fontSize: '2.25rem', fontWeight: 700,
                background: 'var(--grad-gold)', WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent', backgroundClip: 'text', marginBottom: '0.5rem',
              }}>
                {language === 'ar' ? 'حجز المواعيد' : language === 'fr' ? 'Réserver un Rendez-vous' : 'Book Appointment'}
              </h1>
              <p style={{ color: 'var(--text-secondary)', fontSize: '1rem' }}>
                {language === 'ar' ? 'احجز موعد مع معلمك المفضل' : language === 'fr' ? 'Réservez un rendez-vous avec votre instructeur préféré' : 'Book an appointment with your preferred instructor'}
              </p>
            </div>

            <button
              className="btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.875rem 1.75rem', fontSize: '1rem', fontWeight: 600 }}
              onClick={() => setShowDialog(true)}
            >
              <Calendar size={20} />
              {language === 'ar' ? 'حجز موعد جديد' : language === 'fr' ? 'Nouveau Rendez-vous' : 'New Appointment'}
            </button>
          </div>

          {/* Messages */}
          {message && (
            <div style={{ marginTop: '1rem', padding: '1rem 1.25rem', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 'var(--radius-md)', color: '#34D399', display: 'flex', alignItems: 'center', gap: '0.75rem', fontWeight: 600 }}>
              <Check size={20} style={{ flexShrink: 0 }} />{message}
            </div>
          )}
          {error && (
            <div style={{ marginTop: '1rem', padding: '1rem 1.25rem', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 'var(--radius-md)', color: '#FCA5A5', display: 'flex', alignItems: 'center', gap: '0.75rem', fontWeight: 600 }}>
              <AlertCircle size={20} style={{ flexShrink: 0 }} />{error}
            </div>
          )}
        </div>

        {/* My Bookings */}
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-white)', marginBottom: '1.5rem' }}>
            {language === 'ar' ? 'حجوزاتي' : language === 'fr' ? 'Mes Réservations' : 'My Bookings'}
          </h2>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '3rem' }}>
              <Loader2 size={32} style={{ margin: '0 auto', color: 'var(--primary)', animation: 'spin-slow 0.8s linear infinite' }} />
            </div>
          ) : myBookings.length === 0 ? (
            <div style={{ background: 'var(--grad-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '4rem 2rem', textAlign: 'center' }}>
              <div style={{ width: '4rem', height: '4rem', borderRadius: '50%', background: 'rgba(245,166,35,0.1)', border: '1px solid var(--border-gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem', color: 'var(--primary)' }}>
                <Calendar size={28} />
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-white)', marginBottom: '0.5rem' }}>
                {language === 'ar' ? 'لا توجد حجوزات' : language === 'fr' ? 'Aucune réservation' : 'No bookings'}
              </h3>
              <p style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>
                {language === 'ar' ? 'ابدأ بحجز موعدك الأول' : language === 'fr' ? 'Commencez par réserver votre premier rendez-vous' : 'Start by booking your first appointment'}
              </p>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '1rem' }}>
              {myBookings.map((booking) => (
                <div
                  key={booking.id}
                  style={{
                    background: 'var(--grad-card)', border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-md)', overflow: 'hidden', padding: '1.5rem',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                        {/* Teacher avatar */}
                        <div style={{
                          width: '3rem', height: '3rem', borderRadius: 'var(--radius-md)',
                          border: '2px solid var(--border-gold)', overflow: 'hidden', flexShrink: 0,
                          background: (teachersData[booking.teacherId]?.photoURL || teachersData[booking.teacherId]?.profileImage)
                            ? 'transparent' : 'var(--grad-gold)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          {(teachersData[booking.teacherId]?.photoURL || teachersData[booking.teacherId]?.profileImage)
                            ? <img src={teachersData[booking.teacherId].photoURL || teachersData[booking.teacherId].profileImage} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
                            : <User size={18} style={{ color: '#000' }} />
                          }
                        </div>
                        <div>
                          <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-white)', marginBottom: '0.25rem' }}>
                            {booking.teacherName}
                          </h3>
                          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                            {language === 'ar' ? 'المعلم' : language === 'fr' ? 'Instructeur' : 'Instructor'}
                          </p>
                        </div>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <Calendar size={16} style={{ color: 'var(--primary)' }} />
                          <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                            {new Date(booking.date).toLocaleDateString(language === 'ar' ? 'ar-DZ' : language === 'fr' ? 'fr-FR' : 'en-US')}
                          </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <Clock size={16} style={{ color: 'var(--primary)' }} />
                          <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                            {booking.time}
                          </span>
                        </div>
                      </div>

                      {/* Vehicle info — shown only when approved + practical sessions */}
                      {booking.status === 'approved' && booking.vehicleName && (
                        <div style={{
                          marginTop: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.75rem',
                          padding: '0.5rem 0.75rem', background: 'rgba(16,185,129,0.08)',
                          border: '1px solid rgba(16,185,129,0.25)', borderRadius: 'var(--radius-md)',
                        }}>
                          {booking.vehicleImageUrl ? (
                            <img src={booking.vehicleImageUrl} alt={booking.vehicleName}
                              style={{ width: '2.5rem', height: '2.5rem', borderRadius: '0.375rem', objectFit: 'cover', flexShrink: 0 }} />
                          ) : (
                            <Car size={16} style={{ color: '#34D399', flexShrink: 0 }} />
                          )}
                          <span style={{ fontSize: '0.875rem', color: '#34D399', fontWeight: 600 }}>{booking.vehicleName}</span>
                        </div>
                      )}

                      {booking.notes && (
                        <div style={{ marginTop: '0.75rem', padding: '0.75rem', background: 'rgba(255,255,255,0.04)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                            "{booking.notes}"
                          </p>
                        </div>
                      )}
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'flex-end' }}>
                      {getStatusBadge(booking.status)}
                      {booking.status === 'approved' && (
                        <button
                          className="btn-primary"
                          style={{ marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', padding: '0.5rem 1rem', position: 'relative' }}
                          onClick={() => {
                            navigate('/chat', {
                              state: {
                                userId: booking.teacherId,
                                userName: booking.teacherName,
                                chatType: 'booking',
                                bookingId: booking.id
                              }
                            });
                          }}
                        >
                          <div style={{ width: '1.25rem', height: '1.25rem', borderRadius: '50%', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.3)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.15)' }}>
                            {(teachersData[booking.teacherId]?.photoURL || teachersData[booking.teacherId]?.profileImage)
                              ? <img src={teachersData[booking.teacherId].photoURL || teachersData[booking.teacherId].profileImage} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
                              : <User size={8} />
                            }
                          </div>
                          <Mail size={14} />
                          {language === 'ar' ? 'محادثة المعلم' : language === 'fr' ? 'Chat instructeur' : 'Chat with instructor'}
                          {bookingMessagesCount[booking.id] > 0 && (
                            <span style={{ padding: '0.125rem 0.5rem', backgroundColor: '#ef4444', color: 'white', borderRadius: 'var(--radius-full)', fontSize: '0.75rem', fontWeight: 'bold' }}>
                              {bookingMessagesCount[booking.id]}
                            </span>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />

      {/* ── Booking Modal ── */}
      {showDialog && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 2000,
            background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '1.5rem',
          }}
          onClick={e => { if (e.target === e.currentTarget) setShowDialog(false); }}
        >
          <div style={{
            width: '100%', maxWidth: 560, maxHeight: '92vh', overflow: 'hidden',
            background: 'var(--bg-card)', border: '1px solid var(--border-gold)',
            borderRadius: 'var(--radius-lg)', display: 'flex', flexDirection: 'column',
            boxShadow: 'var(--shadow-gold)',
          }}>
            {/* Modal header */}
            <div style={{ padding: '1.5rem 1.75rem', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '0.875rem', flexShrink: 0 }}>
              <div style={{ width: '2.75rem', height: '2.75rem', borderRadius: 'var(--radius-md)', background: 'var(--grad-gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Calendar size={20} style={{ color: '#000' }} />
              </div>
              <div style={{ flex: 1 }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-white)', margin: 0 }}>
                  {language === 'ar' ? 'حجز موعد جديد' : language === 'fr' ? 'Nouveau Rendez-vous' : 'New Appointment'}
                </h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.8125rem', margin: 0 }}>
                  {language === 'ar' ? 'اختر نوع الحصة والوقت ثم ابحث عن المعلمين المتوفرين' : language === 'fr' ? 'Choisissez le type et l\'heure, puis recherchez les instructeurs' : 'Choose session type and time, then search for available instructors'}
                </p>
              </div>
              <button
                onClick={() => setShowDialog(false)}
                style={{ padding: 8, background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', color: 'var(--text-muted)', cursor: 'pointer', flexShrink: 0 }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ padding: '1.25rem 1.75rem', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '1.125rem' }}>

              {/* Session type */}
              <div>
                <label style={{ fontWeight: 700, marginBottom: '0.625rem', display: 'block', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                  {language === 'ar' ? 'نوع الحصة' : language === 'fr' ? 'Type de séance' : 'Session Type'}
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.625rem' }}>
                  {([
                    { key: 'code' as const, icon: BookOpen, label: { ar: 'كود', fr: 'Code', en: 'Code' } },
                    { key: 'creneau' as const, icon: Car, label: { ar: 'كرينو', fr: 'Créneau', en: 'Creneau' } },
                    { key: 'circui' as const, icon: Trophy, label: { ar: 'سيركوي', fr: 'Circui', en: 'Circui' } },
                  ]).map(({ key, icon: Icon, label }) => {
                    const payments = studentData?.payments || {};
                    const approvedSessions = myBookings.filter(b => b.status === 'approved' && b.sessionType === key).length;
                    const maxSessions = key === 'code' ? 10 : 15;
                    const isPaid = payments[key] === true;
                    const isComplete = isPaid && approvedSessions >= maxSessions;
                    const isLocked = !isPaid || isComplete;
                    const lockReason = !isPaid
                      ? (language === 'ar' ? 'غير مدفوع' : language === 'fr' ? 'Non payé' : 'Unpaid')
                      : isComplete
                      ? (language === 'ar' ? 'مكتمل' : language === 'fr' ? 'Complété' : 'Completed')
                      : null;
                    const isSelected = sessionType === key;
                    return (
                      <button key={key} type="button"
                        onClick={() => {
                          if (isLocked) return;
                          setSessionType(key);
                          setSearched(false);
                          setAvailableTeachers([]);
                          setFormData(p => ({ ...p, teacherId: '' }));
                          setAvailableVehicles([]);
                          setSelectedVehicleId('');
                          setSelectedVehicleName('');
                          setSelectedVehicleImageUrl('');
                        }}
                        disabled={isLocked}
                        style={{
                          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.375rem',
                          padding: '0.875rem 0.5rem',
                          background: isSelected ? 'rgba(245,166,35,0.12)' : 'rgba(255,255,255,0.03)',
                          border: isSelected ? '2px solid var(--primary)' : '1px solid var(--border)',
                          borderRadius: 'var(--radius-md)', cursor: isLocked ? 'not-allowed' : 'pointer',
                          transition: 'all 0.2s', opacity: isLocked ? 0.45 : 1,
                          boxShadow: isSelected ? 'var(--shadow-gold)' : 'none',
                        }}>
                        <Icon size={22} style={{ color: isLocked ? 'var(--text-muted)' : isSelected ? 'var(--primary)' : 'var(--text-secondary)' }} />
                        <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: isLocked ? 'var(--text-muted)' : isSelected ? 'var(--primary)' : 'var(--text-primary)' }}>
                          {label[language as 'ar' | 'fr' | 'en']}
                        </span>
                        {lockReason && (
                          <span style={{ fontSize: '0.65rem', color: isComplete ? '#34D399' : '#FCA5A5', fontWeight: 600 }}>
                            {lockReason}
                          </span>
                        )}
                        {isPaid && !isComplete && (
                          <span style={{ fontSize: '0.65rem', color: 'var(--primary)', fontWeight: 600 }}>
                            {approvedSessions}/{maxSessions}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Date & Time */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ fontWeight: 600, marginBottom: '0.375rem', display: 'flex', alignItems: 'center', gap: '0.375rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                    <Calendar size={14} style={{ color: 'var(--primary)' }} />
                    {language === 'ar' ? 'التاريخ' : language === 'fr' ? 'Date' : 'Date'}
                  </label>
                  <input type="date" value={formData.date}
                    onChange={(e) => { setFormData(p => ({ ...p, date: e.target.value, teacherId: '' })); setSearched(false); setAvailableTeachers([]); setAvailableVehicles([]); setSelectedVehicleId(''); setSelectedVehicleName(''); setSelectedVehicleImageUrl(''); }}
                    min={today} required
                    className="input-pro"
                  />
                </div>
                <div>
                  <label style={{ fontWeight: 600, marginBottom: '0.375rem', display: 'flex', alignItems: 'center', gap: '0.375rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                    <Clock size={14} style={{ color: 'var(--primary)' }} />
                    {language === 'ar' ? 'الوقت' : language === 'fr' ? 'Heure' : 'Time'}
                  </label>
                  <input type="time" value={formData.time}
                    onChange={(e) => { setFormData(p => ({ ...p, time: e.target.value, teacherId: '' })); setSearched(false); setAvailableTeachers([]); setAvailableVehicles([]); setSelectedVehicleId(''); setSelectedVehicleName(''); setSelectedVehicleImageUrl(''); }}
                    required
                    className="input-pro"
                  />
                </div>
              </div>

              {/* Search button */}
              <button type="button"
                onClick={searchAvailableTeachers}
                disabled={!sessionType || !formData.date || !formData.time || isSearching}
                className="btn-primary"
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                  opacity: (!sessionType || !formData.date || !formData.time) ? 0.5 : 1,
                  cursor: (!sessionType || !formData.date || !formData.time) ? 'not-allowed' : 'pointer',
                  fontWeight: 700, fontSize: '0.9rem',
                }}>
                {isSearching ? <Loader2 size={16} style={{ animation: 'spin-slow 0.6s linear infinite' }} /> : <Search size={16} />}
                {isSearching
                  ? (language === 'ar' ? 'جاري البحث...' : language === 'fr' ? 'Recherche...' : 'Searching...')
                  : (language === 'ar' ? 'بحث عن المعلمين المتوفرين' : language === 'fr' ? 'Rechercher instructeurs disponibles' : 'Search Available Instructors')}
              </button>

              {/* Search results — teachers */}
              {searched && (
                <div>
                  <label style={{ fontWeight: 600, marginBottom: '0.75rem', display: 'block', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                    {language === 'ar' ? 'المعلمون المتوفرون' : language === 'fr' ? 'Instructeurs disponibles' : 'Available Instructors'}
                    <span style={{ marginInlineStart: '0.5rem', color: 'var(--text-muted)', fontWeight: 400 }}>
                      ({availableTeachers.length})
                    </span>
                  </label>

                  {availableTeachers.length === 0 ? (
                    <div style={{ padding: '1.25rem', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 'var(--radius-md)', color: '#FCA5A5', fontSize: '0.875rem', textAlign: 'center' }}>
                      <AlertCircle size={22} style={{ margin: '0 auto 0.5rem' }} />
                      {language === 'ar' ? 'لا يوجد معلمون متوفرون في هذا الوقت' : language === 'fr' ? 'Aucun instructeur disponible à cette heure' : 'No instructors available at this time'}
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '220px', overflowY: 'auto' }}>
                      {availableTeachers.map((teacher) => (
                        <button key={teacher.id} type="button"
                          onClick={() => setFormData(p => ({ ...p, teacherId: teacher.id }))}
                          style={{
                            display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem',
                            background: formData.teacherId === teacher.id ? 'rgba(245,166,35,0.1)' : 'rgba(255,255,255,0.03)',
                            border: formData.teacherId === teacher.id ? '1.5px solid var(--primary)' : '1px solid var(--border)',
                            borderRadius: 'var(--radius-md)', cursor: 'pointer', transition: 'all 0.2s', textAlign: 'left', width: '100%',
                          }}>
                          <div style={{ width: '2.5rem', height: '2.5rem', borderRadius: 'var(--radius-md)', flexShrink: 0, overflow: 'hidden', border: '1px solid var(--border-gold)', background: teacher.photoURL ? 'transparent' : 'var(--grad-gold)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {teacher.photoURL
                              ? <img src={teacher.photoURL} alt={teacher.fullName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              : <User size={16} style={{ color: '#000' }} />}
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-white)' }}>{teacher.fullName}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                              {language === 'ar' ? 'رخصة' : language === 'fr' ? 'Permis' : 'License'} {teacher.licenseType}
                            </div>
                          </div>
                          {formData.teacherId === teacher.id && <Check size={18} style={{ color: 'var(--primary)', flexShrink: 0 }} />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Vehicles — practical sessions only */}
              {searched && (sessionType === 'creneau' || sessionType === 'circui') && (
                <div>
                  <label style={{ fontWeight: 600, marginBottom: '0.75rem', display: 'block', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                    {language === 'ar' ? 'المركبات المتوفرة' : language === 'fr' ? 'Véhicules disponibles' : 'Available Vehicles'}
                    <span style={{ marginInlineStart: '0.5rem', color: 'var(--text-muted)', fontWeight: 400 }}>({availableVehicles.length})</span>
                  </label>

                  {availableVehicles.length === 0 ? (
                    <div style={{ padding: '1.25rem', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 'var(--radius-md)', color: '#FCA5A5', fontSize: '0.875rem', textAlign: 'center' }}>
                      <AlertCircle size={22} style={{ margin: '0 auto 0.5rem' }} />
                      {language === 'ar' ? 'لا توجد مركبات متوفرة في هذا الوقت' : language === 'fr' ? 'Aucun véhicule disponible à cette heure' : 'No vehicles available at this time'}
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '200px', overflowY: 'auto' }}>
                      {availableVehicles.map((vehicle) => (
                        <button key={vehicle.id} type="button"
                          onClick={() => { setSelectedVehicleId(vehicle.id); setSelectedVehicleName(vehicle.name); setSelectedVehicleImageUrl(vehicle.imageUrl || ''); }}
                          style={{
                            display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem',
                            background: selectedVehicleId === vehicle.id ? 'rgba(245,166,35,0.1)' : 'rgba(255,255,255,0.03)',
                            border: selectedVehicleId === vehicle.id ? '1.5px solid var(--primary)' : '1px solid var(--border)',
                            borderRadius: 'var(--radius-md)', cursor: 'pointer', transition: 'all 0.2s', textAlign: 'left', width: '100%',
                          }}>
                          <div style={{ width: '2.5rem', height: '2.5rem', borderRadius: 'var(--radius-md)', flexShrink: 0, overflow: 'hidden', border: '1px solid var(--border-gold)', background: vehicle.imageUrl ? 'transparent' : 'var(--grad-gold)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {vehicle.imageUrl
                              ? <img src={vehicle.imageUrl} alt={vehicle.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              : <Car size={16} style={{ color: '#000' }} />}
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-white)' }}>{vehicle.name}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                              {language === 'ar' ? 'رخصة' : language === 'fr' ? 'Permis' : 'License'} {vehicle.licenseType}
                            </div>
                          </div>
                          {selectedVehicleId === vehicle.id && <Check size={18} style={{ color: 'var(--primary)', flexShrink: 0 }} />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Notes */}
              <div>
                <label style={{ fontWeight: 500, marginBottom: '0.5rem', display: 'block', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                  {language === 'ar' ? 'ملاحظات (اختياري)' : language === 'fr' ? 'Notes (optionnel)' : 'Notes (optional)'}
                </label>
                <textarea value={formData.notes}
                  onChange={(e) => setFormData(p => ({ ...p, notes: e.target.value }))}
                  placeholder={language === 'ar' ? 'أضف ملاحظات إضافية...' : language === 'fr' ? 'Ajouter des notes...' : 'Add notes...'}
                  rows={2}
                  className="input-pro"
                  style={{ resize: 'vertical', fontFamily: 'inherit' }}
                />
              </div>

              {/* Footer actions */}
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', paddingTop: '0.75rem', borderTop: '1px solid var(--border)', marginTop: '0.25rem' }}>
                <button type="button" className="btn-outline"
                  style={{ padding: '0.625rem 1.25rem', fontSize: '0.875rem', fontWeight: 600 }}
                  onClick={() => { setShowDialog(false); setSearched(false); setAvailableTeachers([]); setSessionType(''); setFormData({ teacherId: '', date: '', time: '', notes: '' }); setAvailableVehicles([]); setSelectedVehicleId(''); setSelectedVehicleName(''); setSelectedVehicleImageUrl(''); }}>
                  {language === 'ar' ? 'إلغاء' : language === 'fr' ? 'Annuler' : 'Cancel'}
                </button>
                <button type="submit" className="btn-primary"
                  disabled={isSubmitting || !formData.teacherId || availableTeachers.length === 0 || ((sessionType === 'creneau' || sessionType === 'circui') && !selectedVehicleId)}
                  style={{
                    padding: '0.625rem 1.5rem', fontSize: '0.875rem', fontWeight: 700,
                    display: 'flex', alignItems: 'center', gap: '0.5rem',
                    opacity: (isSubmitting || !formData.teacherId || availableTeachers.length === 0 || ((sessionType === 'creneau' || sessionType === 'circui') && !selectedVehicleId)) ? 0.5 : 1,
                    cursor: (isSubmitting || !formData.teacherId || availableTeachers.length === 0 || ((sessionType === 'creneau' || sessionType === 'circui') && !selectedVehicleId)) ? 'not-allowed' : 'pointer',
                  }}>
                  {isSubmitting && <Loader2 size={15} style={{ animation: 'spin-slow 0.6s linear infinite' }} />}
                  {isSubmitting ? (language === 'ar' ? 'جاري الحجز...' : language === 'fr' ? 'Réservation...' : 'Booking...') : (language === 'ar' ? 'إرسال الطلب' : language === 'fr' ? 'Envoyer la demande' : 'Send Request')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const BookingPage = () => {
  return (
    <LanguageProvider>
      <BookingPageContent />
    </LanguageProvider>
  );
};

export default BookingPage;
