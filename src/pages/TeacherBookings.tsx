import { useState, useEffect } from 'react';
import { LanguageProvider, useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { supabase } from '../supabase';
import { runBookingMaintenance } from '../utils/bookingArchive';
import { Calendar, Clock, User, Check, X, AlertCircle, Loader2, ArrowLeft, Mail, Car } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import '../components/style/theme.css';

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

const TeacherBookingsContent = () => {
  const { language } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [bookingMessagesCount, setBookingMessagesCount] = useState<{[key: string]: number}>({});
  const [studentsData, setStudentsData] = useState<{[key: string]: any}>({});

  useEffect(() => {
    if (user?.uid) {
      fetchBookings();
    }
  }, [user]);

  // جلب عدد رسائل الحجز لكل حجز في الوقت الفعلي
  useEffect(() => {
    if (!user?.uid || bookings.length === 0) return;

    const setupMessagesListeners = () => {
      const channels: ReturnType<typeof supabase.channel>[] = [];

      for (const booking of bookings) {
        if (booking.status === 'approved') {
          const ch = supabase
            .channel(`booking-msgs-${booking.id}`)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, async () => {
              const { count } = await supabase
                .from('messages')
                .select('*', { count: 'exact', head: true })
                .eq('senderId', booking.studentId)
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
    };

    const cleanup = setupMessagesListeners();
    return cleanup;
  }, [user?.uid, bookings]);

  const fetchBookings = async () => {
    if (!user?.uid) return;

    try {
      // تشغيل صيانة الحجوزات أولاً
      await runBookingMaintenance();

      const { data: bookingsData, error: bookingsError } = await supabase
        .from('bookings').select('*').eq('teacherId', user.uid);
      if (bookingsError) throw bookingsError;
      const bookingsList: Booking[] = (bookingsData || []).map(d => ({
        id: d.id, studentId: d.studentId, studentName: d.studentName,
        teacherId: d.teacherId, teacherName: d.teacherName,
        date: d.date, time: d.time, notes: d.notes, status: d.status,
        createdAt: d.createdAt, sessionType: d.sessionType,
        vehicleId: d.vehicleId, vehicleName: d.vehicleName, vehicleImageUrl: d.vehicleImageUrl,
      }));

      // ترتيب: قيد الانتظار أولاً، ثم حسب التاريخ
      bookingsList.sort((a, b) => {
        if (a.status === 'pending' && b.status !== 'pending') return -1;
        if (a.status !== 'pending' && b.status === 'pending') return 1;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });

      setBookings(bookingsList);

      // جلب بيانات الطلاب
      await fetchStudentsData(bookingsList);
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStudentsData = async (bookingsList: Booking[]) => {
    try {
      const studentIds = [...new Set(bookingsList.map(b => b.studentId))];
      if (studentIds.length === 0) return;
      const { data } = await supabase.from('users').select('*').in('id', studentIds);
      const studentsDataMap: {[key: string]: any} = {};
      (data || []).forEach(s => { studentsDataMap[s.id] = s; });
      setStudentsData(studentsDataMap);
    } catch (error) {
      console.error('Error fetching students data:', error);
    }
  };

  const handleApprove = async (bookingId: string) => {
    try {
      await supabase.from('bookings').update({ status: 'approved', updatedAt: new Date().toISOString() }).eq('id', bookingId);

      setMessage(
        language === 'ar'
          ? 'تم قبول الحجز بنجاح!'
          : language === 'fr'
          ? 'Réservation approuvée avec succès!'
          : 'Booking approved successfully!'
      );

      fetchBookings();
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error approving booking:', error);
      setError(
        language === 'ar'
          ? 'حدث خطأ أثناء قبول الحجز'
          : language === 'fr'
          ? 'Erreur lors de l\'approbation'
          : 'Error approving booking'
      );
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleReject = async (bookingId: string) => {
    const confirmMessage = language === 'ar'
      ? 'هل أنت متأكد من رفض هذا الحجز؟'
      : language === 'fr'
      ? 'Êtes-vous sûr de rejeter cette réservation?'
      : 'Are you sure you want to reject this booking?';

    if (!window.confirm(confirmMessage)) return;

    try {
      await supabase.from('bookings').update({
        status: 'rejected',
        updatedAt: new Date().toISOString()
      }).eq('id', bookingId);

      setMessage(
        language === 'ar'
          ? 'تم رفض الحجز'
          : language === 'fr'
          ? 'Réservation rejetée'
          : 'Booking rejected'
      );

      fetchBookings();
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error rejecting booking:', error);
      setError(
        language === 'ar'
          ? 'حدث خطأ أثناء رفض الحجز'
          : language === 'fr'
          ? 'Erreur lors du rejet'
          : 'Error rejecting booking'
      );
      setTimeout(() => setError(''), 3000);
    }
  };

  const getStatusBadge = (status: string) => {
    if (status === 'approved') {
      return (
        <span className="badge-pro badge-success" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem', padding: '0.35rem 0.75rem' }}>
          <Check style={{ width: '0.875rem', height: '0.875rem' }} />
          {language === 'ar' ? 'مقبول' : language === 'fr' ? 'Approuvé' : 'Approved'}
        </span>
      );
    }
    if (status === 'rejected') {
      return (
        <span className="badge-pro badge-error" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem', padding: '0.35rem 0.75rem' }}>
          <X style={{ width: '0.875rem', height: '0.875rem' }} />
          {language === 'ar' ? 'مرفوض' : language === 'fr' ? 'Rejeté' : 'Rejected'}
        </span>
      );
    }
    // pending
    return (
      <span className="badge-pro badge-warning" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem', padding: '0.35rem 0.75rem' }}>
        <Clock style={{ width: '0.875rem', height: '0.875rem' }} />
        {language === 'ar' ? 'قيد الانتظار' : language === 'fr' ? 'En attente' : 'Pending'}
      </span>
    );
  };

  const pendingCount = bookings.filter(b => b.status === 'pending').length;
  const approvedCount = bookings.filter(b => b.status === 'approved').length;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-darkest)', color: 'var(--text-primary)' }}>
      <Navbar />

      <main style={{ padding: '6rem 1.5rem 3rem', maxWidth: '1400px', margin: '0 auto' }}>

        {/* Header */}
        <div style={{ marginBottom: '2.5rem' }}>
          <div style={{
            background: 'var(--grad-card)',
            border: '1px solid var(--border)',
            padding: '2rem',
            borderRadius: 'var(--radius-lg)',
            boxShadow: 'var(--shadow-md)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
              <button
                type="button"
                onClick={() => navigate('/teacher-dashboard')}
                className="btn-ghost"
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.25rem' }}
              >
                <ArrowLeft style={{ width: '1rem', height: '1rem' }} />
                {language === 'ar' ? 'رجوع' : language === 'fr' ? 'Retour' : 'Back'}
              </button>
              <div>
                <h1 style={{ fontSize: '2.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                  <span className="gold-text">
                    {language === 'ar' ? 'إدارة الحجوزات' : language === 'fr' ? 'Gérer les Réservations' : 'Manage Bookings'}
                  </span>
                </h1>
                <p style={{ color: 'var(--text-secondary)', fontSize: '1rem' }}>
                  {language === 'ar' ? 'قبول أو رفض طلبات الحجز من الطلاب' : language === 'fr' ? 'Approuver ou rejeter les demandes de réservation' : 'Approve or reject booking requests'}
                </p>
              </div>
            </div>

            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
              <div style={{
                padding: '1rem',
                background: 'rgba(245,158,11,0.08)',
                borderRadius: 'var(--radius-md)',
                border: '1.5px solid rgba(245,158,11,0.3)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <Clock style={{ width: '2rem', height: '2rem', color: '#FCD34D' }} />
                  <div>
                    <p style={{ fontSize: '0.875rem', color: '#FCD34D', fontWeight: 600 }}>
                      {language === 'ar' ? 'قيد الانتظار' : language === 'fr' ? 'En attente' : 'Pending'}
                    </p>
                    <p style={{ fontSize: '1.5rem', fontWeight: 700, color: '#FCD34D' }}>
                      {pendingCount}
                    </p>
                  </div>
                </div>
              </div>

              <div style={{
                padding: '1rem',
                background: 'rgba(16,185,129,0.08)',
                borderRadius: 'var(--radius-md)',
                border: '1.5px solid rgba(16,185,129,0.3)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <Check style={{ width: '2rem', height: '2rem', color: '#34D399' }} />
                  <div>
                    <p style={{ fontSize: '0.875rem', color: '#34D399', fontWeight: 600 }}>
                      {language === 'ar' ? 'مقبول' : language === 'fr' ? 'Approuvé' : 'Approved'}
                    </p>
                    <p style={{ fontSize: '1.5rem', fontWeight: 700, color: '#34D399' }}>
                      {approvedCount}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Messages */}
          {message && (
            <div style={{ marginTop: '1rem', padding: '1rem 1.25rem', background: 'rgba(16,185,129,0.1)', border: '2px solid rgba(16,185,129,0.3)', borderRadius: 'var(--radius-md)', color: '#34D399', display: 'flex', alignItems: 'center', gap: '0.75rem', fontWeight: 600 }}>
              <Check style={{ width: '1.25rem', height: '1.25rem', flexShrink: 0 }} />
              {message}
            </div>
          )}
          {error && (
            <div style={{ marginTop: '1rem', padding: '1rem 1.25rem', background: 'rgba(239,68,68,0.1)', border: '2px solid rgba(239,68,68,0.3)', borderRadius: 'var(--radius-md)', color: '#FCA5A5', display: 'flex', alignItems: 'center', gap: '0.75rem', fontWeight: 600 }}>
              <AlertCircle style={{ width: '1.25rem', height: '1.25rem', flexShrink: 0 }} />
              {error}
            </div>
          )}
        </div>

        {/* Bookings List */}
        <div>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '3rem' }}>
              <Loader2 style={{ width: '2rem', height: '2rem', margin: '0 auto', color: 'var(--primary)', animation: 'spin 1s linear infinite' }} />
            </div>
          ) : bookings.length === 0 ? (
            <div style={{
              background: 'var(--grad-card)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-lg)',
              padding: '4rem 2rem',
              textAlign: 'center'
            }}>
              <Calendar style={{ width: '4rem', height: '4rem', color: 'var(--text-muted)', margin: '0 auto 1rem' }} />
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-white)', marginBottom: '0.5rem' }}>
                {language === 'ar' ? 'لا توجد حجوزات' : language === 'fr' ? 'Aucune réservation' : 'No bookings'}
              </h3>
              <p style={{ fontSize: '1rem', color: 'var(--text-secondary)' }}>
                {language === 'ar' ? 'لم يتم استلام أي طلبات حجز بعد' : language === 'fr' ? 'Aucune demande de réservation reçue' : 'No booking requests received yet'}
              </p>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '1rem' }}>
              {bookings.map((booking) => (
                <div
                  key={booking.id}
                  style={{
                    background: 'var(--grad-card)',
                    borderRadius: 'var(--radius-md)',
                    border: booking.status === 'pending'
                      ? '2px solid var(--border-gold)'
                      : booking.status === 'approved'
                        ? '1px solid rgba(16,185,129,0.25)'
                        : '1px solid rgba(239,68,68,0.2)',
                    overflow: 'hidden',
                    boxShadow: booking.status === 'pending' ? 'var(--shadow-gold)' : 'var(--shadow-sm)',
                    transition: 'all 0.2s',
                  }}
                >
                  <div style={{ padding: '1.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                          {/* صورة الطالب */}
                          <div style={{
                            width: '3rem',
                            height: '3rem',
                            borderRadius: 'var(--radius-md)',
                            background: studentsData[booking.studentId]?.photoURL
                              ? `url(${studentsData[booking.studentId].photoURL})`
                              : 'var(--grad-gold)',
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: 'var(--shadow-gold)',
                            border: '2px solid var(--border-gold)',
                            flexShrink: 0,
                          }}>
                            {!studentsData[booking.studentId]?.photoURL && (
                              <User style={{ width: '1.5rem', height: '1.5rem', color: '#000' }} />
                            )}
                          </div>
                          <div>
                            <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-white)', marginBottom: '0.25rem' }}>
                              {booking.studentName}
                            </h3>
                            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                              {language === 'ar' ? 'الطالب' : language === 'fr' ? 'Étudiant' : 'Student'}
                            </p>
                          </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem', marginBottom: '1rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Calendar style={{ width: '1.125rem', height: '1.125rem', color: 'var(--primary)' }} />
                            <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                              {new Date(booking.date).toLocaleDateString(language === 'ar' ? 'ar-DZ' : language === 'fr' ? 'fr-FR' : 'en-US')}
                            </span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Clock style={{ width: '1.125rem', height: '1.125rem', color: 'var(--primary)' }} />
                            <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                              {booking.time}
                            </span>
                          </div>
                        </div>

                        {/* معلومات المركبة — تظهر فقط عند القبول وللحصص العملية */}
                        {booking.status === 'approved' && booking.vehicleName && (
                          <div style={{
                            marginBottom: '0.75rem',
                            display: 'flex', alignItems: 'center', gap: '0.75rem',
                            padding: '0.5rem 0.75rem',
                            background: 'rgba(16,185,129,0.08)',
                            border: '1px solid rgba(16,185,129,0.25)',
                            borderRadius: 'var(--radius-md)'
                          }}>
                            {booking.vehicleImageUrl ? (
                              <img src={booking.vehicleImageUrl} alt={booking.vehicleName}
                                style={{ width: '2.5rem', height: '2.5rem', borderRadius: '0.375rem', objectFit: 'cover', flexShrink: 0 }} />
                            ) : (
                              <Car style={{ width: '1rem', height: '1rem', color: '#34D399', flexShrink: 0 }} />
                            )}
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                              {language === 'ar' ? 'المركبة:' : language === 'fr' ? 'Véhicule:' : 'Vehicle:'}
                            </span>
                            <span style={{ fontSize: '0.875rem', color: '#34D399', fontWeight: 600 }}>
                              {booking.vehicleName}
                            </span>
                          </div>
                        )}

                        {booking.notes && (
                          <div style={{ padding: '0.75rem', background: 'var(--bg-mid)', borderRadius: 'var(--radius-md)', marginBottom: '1rem', border: '1px solid var(--border)' }}>
                            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                              "{booking.notes}"
                            </p>
                          </div>
                        )}

                        {booking.status === 'pending' && (
                          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                            <button
                              type="button"
                              onClick={() => handleApprove(booking.id)}
                              className="btn-primary"
                              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1.25rem', fontSize: '0.875rem' }}
                            >
                              <Check style={{ width: '1rem', height: '1rem' }} />
                              {language === 'ar' ? 'قبول' : language === 'fr' ? 'Approuver' : 'Approve'}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleReject(booking.id)}
                              style={{
                                display: 'flex', alignItems: 'center', gap: '0.5rem',
                                padding: '0.5rem 1.25rem',
                                background: 'transparent',
                                color: '#FCA5A5',
                                border: '1.5px solid rgba(239,68,68,0.45)',
                                borderRadius: 'var(--radius-full)',
                                fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer',
                              }}
                            >
                              <X style={{ width: '1rem', height: '1rem' }} />
                              {language === 'ar' ? 'رفض' : language === 'fr' ? 'Rejeter' : 'Reject'}
                            </button>
                          </div>
                        )}
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'flex-end' }}>
                        {getStatusBadge(booking.status)}
                        {booking.status === 'approved' && (
                          <button
                            type="button"
                            onClick={() => {
                              navigate('/chat', {
                                state: {
                                  userId: booking.studentId,
                                  userName: booking.studentName,
                                  chatType: 'booking',
                                  bookingId: booking.id
                                }
                              });
                            }}
                            className="btn-outline"
                            style={{
                              marginTop: '0.25rem',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              gap: '0.5rem', padding: '0.5rem 1rem', fontSize: '0.875rem',
                              position: 'relative',
                            }}
                          >
                            {/* صورة الطالب الصغيرة */}
                            <div style={{
                              width: '1.25rem', height: '1.25rem', borderRadius: '50%',
                              background: studentsData[booking.studentId]?.photoURL
                                ? `url(${studentsData[booking.studentId].photoURL})`
                                : 'rgba(245,166,35,0.3)',
                              backgroundSize: 'cover', backgroundPosition: 'center',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              border: '1px solid var(--border-gold)', flexShrink: 0,
                            }}>
                              {!studentsData[booking.studentId]?.photoURL && (
                                <User size={8} style={{ color: 'var(--primary)' }} />
                              )}
                            </div>
                            <Mail size={16} />
                            {language === 'ar' ? 'محادثة الطالب' : language === 'fr' ? 'Chat étudiant' : 'Chat with student'}
                            {bookingMessagesCount[booking.id] > 0 && (
                              <span style={{
                                padding: '0.125rem 0.5rem',
                                backgroundColor: '#ef4444',
                                color: 'white',
                                borderRadius: 'var(--radius-full)',
                                fontSize: '0.75rem',
                                fontWeight: 'bold',
                                marginLeft: '0.25rem'
                              }}>
                                {bookingMessagesCount[booking.id]}
                              </span>
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

const TeacherBookings = () => {
  return (
    <LanguageProvider>
      <TeacherBookingsContent />
    </LanguageProvider>
  );
};

export default TeacherBookings;
