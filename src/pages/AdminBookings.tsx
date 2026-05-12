import { useState, useEffect } from 'react';
import { LanguageProvider, useLanguage } from '../contexts/LanguageContext';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { supabase } from '../supabase';
import { runBookingMaintenance } from '../utils/bookingArchive';
import { Calendar, Clock, User, Check, X, AlertCircle, Loader2, ArrowLeft, Search, Filter, Trash2, Archive, Car } from 'lucide-react';
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

const AdminBookingsContent = () => {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showArchiveDialog, setShowArchiveDialog] = useState(false);
  const [archivedBookings, setArchivedBookings] = useState<Booking[]>([]);
  const [loadingArchive, setLoadingArchive] = useState(false);
  const [cleaningArchive, setCleaningArchive] = useState(false);
  const [usersData, setUsersData] = useState<{[key: string]: any}>({});

  useEffect(() => {
    fetchBookings();
  }, []);

  useEffect(() => {
    filterBookings();
  }, [searchTerm, statusFilter, bookings]);

  const fetchBookings = async () => {
    try {
      await runBookingMaintenance();

      const { data: bookingsData, error } = await supabase.from('bookings').select('*').order('createdAt', { ascending: false });
      if (error) throw error;
      const bookingsList: Booking[] = (bookingsData || []).map((data: any) => ({
        id: data.id,
        studentId: data.studentId,
        studentName: data.studentName,
        teacherId: data.teacherId,
        teacherName: data.teacherName,
        date: data.date,
        time: data.time,
        notes: data.notes,
        status: data.status,
        createdAt: data.createdAt,
        sessionType: data.sessionType,
        vehicleId: data.vehicleId,
        vehicleName: data.vehicleName,
        vehicleImageUrl: data.vehicleImageUrl,
      }));

      setBookings(bookingsList);
      setFilteredBookings(bookingsList);
      await fetchUsersData(bookingsList);
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsersData = async (bookingsList: Booking[]) => {
    try {
      const ids = Array.from(new Set<string>(bookingsList.flatMap(b => [b.studentId, b.teacherId])));
      const map: {[key: string]: any} = {};
      for (const uid of ids) {
        const { data } = await supabase.from('users').select('*').eq('id', uid).single();
        if (data) map[uid] = data;
      }
      setUsersData(map);
    } catch (error) {
      console.error('Error fetching users data:', error);
    }
  };

  const filterBookings = () => {
    let filtered = [...bookings];

    if (searchTerm) {
      filtered = filtered.filter(booking =>
        booking.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.teacherName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(booking => booking.status === statusFilter);
    }

    setFilteredBookings(filtered);
  };

  const fetchArchivedBookings = async () => {
    setLoadingArchive(true);
    try {
      const { data: archivedData, error } = await supabase.from('archivedBookings').select('*').order('archivedAt', { ascending: false });
      if (error) throw error;
      const archivedList: Booking[] = (archivedData || []).map((data: any) => ({
        id: data.id,
        studentId: data.studentId,
        studentName: data.studentName,
        teacherId: data.teacherId,
        teacherName: data.teacherName,
        date: data.date,
        time: data.time,
        notes: data.notes,
        status: data.status,
        createdAt: data.createdAt,
        sessionType: data.sessionType,
        vehicleId: data.vehicleId,
        vehicleName: data.vehicleName,
        vehicleImageUrl: data.vehicleImageUrl,
      }));

      setArchivedBookings(archivedList);
    } catch (error) {
      console.error('Error fetching archived bookings:', error);
    } finally {
      setLoadingArchive(false);
    }
  };

  const handleCleanArchive = async () => {
    const confirmMessage = language === 'ar'
      ? 'هل أنت متأكد من حذف جميع الحجوزات المؤرشفة نهائياً؟ لا يمكن التراجع عن هذا الإجراء!'
      : language === 'fr'
      ? 'Êtes-vous sûr de supprimer définitivement toutes les réservations archivées? Cette action est irréversible!'
      : 'Are you sure you want to permanently delete all archived bookings? This action cannot be undone!';

    if (!window.confirm(confirmMessage)) return;

    setCleaningArchive(true);
    try {
      const { data: archivedSnapshot, error: fetchError } = await supabase.from('archivedBookings').select('id');
      if (fetchError) throw fetchError;

      const deletePromises = (archivedSnapshot || []).map((doc: any) =>
        supabase.from('archivedBookings').delete().eq('id', doc.id)
      );

      await Promise.all(deletePromises);

      setMessage(
        language === 'ar'
          ? `تم حذف ${(archivedSnapshot || []).length} حجز من الأرشيف نهائياً!`
          : language === 'fr'
          ? `${(archivedSnapshot || []).length} réservations supprimées définitivement!`
          : `${(archivedSnapshot || []).length} bookings permanently deleted!`
      );

      setArchivedBookings([]);
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error cleaning archive:', error);
      setError(
        language === 'ar'
          ? 'حدث خطأ أثناء تنظيف الأرشيف'
          : language === 'fr'
          ? 'Erreur lors du nettoyage de l\'archive'
          : 'Error cleaning archive'
      );
      setTimeout(() => setError(''), 3000);
    } finally {
      setCleaningArchive(false);
    }
  };

  const handleDelete = async (bookingId: string, studentName: string) => {
    const confirmMessage = language === 'ar'
      ? `هل أنت متأكد من حذف حجز "${studentName}"؟`
      : language === 'fr'
      ? `Êtes-vous sûr de supprimer la réservation de "${studentName}"?`
      : `Are you sure you want to delete "${studentName}"'s booking?`;

    if (!window.confirm(confirmMessage)) return;

    try {
      const bookingToDelete = bookings.find(b => b.id === bookingId);

      if (bookingToDelete) {
        const { id, ...bookingWithoutId } = bookingToDelete;
        await supabase.from('archivedBookings').insert({
          ...bookingWithoutId,
          archivedAt: new Date().toISOString(),
          originalId: bookingId,
          deletedByAdmin: true,
          deletionReason: 'manual_deletion'
        });
      }

      await supabase.from('bookings').delete().eq('id', bookingId);

      setMessage(
        language === 'ar'
          ? 'تم حذف الحجز ونقله إلى الأرشيف بنجاح!'
          : language === 'fr'
          ? 'Réservation supprimée et archivée avec succès!'
          : 'Booking deleted and archived successfully!'
      );

      fetchBookings();
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error deleting booking:', error);
      setError(
        language === 'ar'
          ? 'حدث خطأ أثناء الحذف'
          : language === 'fr'
          ? 'Erreur lors de la suppression'
          : 'Error deleting booking'
      );
      setTimeout(() => setError(''), 3000);
    }
  };

  const getStatusBadge = (status: string) => {
    if (status === 'approved') {
      return (
        <span className="badge-pro badge-success" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
          <Check style={{ width: '0.875rem', height: '0.875rem' }} />
          {language === 'ar' ? 'مقبول' : language === 'fr' ? 'Approuvé' : 'Approved'}
        </span>
      );
    }
    if (status === 'rejected') {
      return (
        <span className="badge-pro badge-error" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
          <X style={{ width: '0.875rem', height: '0.875rem' }} />
          {language === 'ar' ? 'مرفوض' : language === 'fr' ? 'Rejeté' : 'Rejected'}
        </span>
      );
    }
    return (
      <span className="badge-pro badge-warning" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
        <Clock style={{ width: '0.875rem', height: '0.875rem' }} />
        {language === 'ar' ? 'قيد الانتظار' : language === 'fr' ? 'En attente' : 'Pending'}
      </span>
    );
  };

  const stats = {
    total: bookings.length,
    pending: bookings.filter(b => b.status === 'pending').length,
    approved: bookings.filter(b => b.status === 'approved').length,
    rejected: bookings.filter(b => b.status === 'rejected').length,
    today: bookings.filter(b => b.date === new Date().toISOString().split('T')[0]).length
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-darkest)', color: 'var(--text-primary)' }}>
      <Navbar />

      <main style={{ padding: '6rem 1.5rem 3rem', maxWidth: '1400px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '2.5rem' }}>
          <div style={{
            background: 'var(--grad-card)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)',
            padding: '2rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
              <button
                className="btn-outline"
                onClick={() => navigate('/admin-dashboard')}
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
              >
                <ArrowLeft style={{ width: '1rem', height: '1rem' }} />
                {language === 'ar' ? 'رجوع' : language === 'fr' ? 'Retour' : 'Back'}
              </button>
              <div style={{ flex: 1 }}>
                <h1 style={{
                  fontSize: '2.25rem',
                  fontWeight: 700,
                  background: 'var(--grad-gold)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  marginBottom: '0.5rem'
                }}>
                  {language === 'ar' ? 'إدارة الحجوزات' : language === 'fr' ? 'Gérer les Réservations' : 'Manage Bookings'}
                </h1>
                <p style={{ color: 'var(--text-secondary)', fontSize: '1rem' }}>
                  {language === 'ar' ? 'عرض وإدارة جميع حجوزات الطلاب' : language === 'fr' ? 'Voir et gérer toutes les réservations' : 'View and manage all student bookings'}
                </p>
              </div>

              <button
                className="btn-primary"
                onClick={() => { fetchArchivedBookings(); setShowArchiveDialog(true); }}
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginLeft: 'auto' }}
              >
                <Archive style={{ width: '1.25rem', height: '1.25rem' }} />
                {language === 'ar' ? 'الأرشيف' : language === 'fr' ? 'Archive' : 'Archive'}
              </button>
            </div>

            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
              <div className="stat-card-pro" style={{ padding: '1rem', borderRadius: 'var(--radius-md)', background: 'rgba(245,166,35,0.08)', border: '1px solid var(--border-gold)' }}>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', fontWeight: 600, marginBottom: '0.25rem' }}>
                  {language === 'ar' ? 'الإجمالي' : language === 'fr' ? 'Total' : 'Total'}
                </p>
                <p style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--primary)' }}>{stats.total}</p>
              </div>
              <div style={{ padding: '1rem', borderRadius: 'var(--radius-md)', background: 'rgba(234,179,8,0.08)', border: '1px solid rgba(234,179,8,0.25)' }}>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', fontWeight: 600, marginBottom: '0.25rem' }}>
                  {language === 'ar' ? 'قيد الانتظار' : language === 'fr' ? 'En attente' : 'Pending'}
                </p>
                <p style={{ fontSize: '1.75rem', fontWeight: 700, color: '#EAB308' }}>{stats.pending}</p>
              </div>
              <div style={{ padding: '1rem', borderRadius: 'var(--radius-md)', background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.25)' }}>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', fontWeight: 600, marginBottom: '0.25rem' }}>
                  {language === 'ar' ? 'مقبول' : language === 'fr' ? 'Approuvé' : 'Approved'}
                </p>
                <p style={{ fontSize: '1.75rem', fontWeight: 700, color: '#22C55E' }}>{stats.approved}</p>
              </div>
              <div style={{ padding: '1rem', borderRadius: 'var(--radius-md)', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)' }}>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', fontWeight: 600, marginBottom: '0.25rem' }}>
                  {language === 'ar' ? 'مرفوض' : language === 'fr' ? 'Rejeté' : 'Rejected'}
                </p>
                <p style={{ fontSize: '1.75rem', fontWeight: 700, color: '#EF4444' }}>{stats.rejected}</p>
              </div>
              <div style={{ padding: '1rem', borderRadius: 'var(--radius-md)', background: 'rgba(168,85,247,0.08)', border: '1px solid rgba(168,85,247,0.25)' }}>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', fontWeight: 600, marginBottom: '0.25rem' }}>
                  {language === 'ar' ? 'اليوم' : language === 'fr' ? "Aujourd'hui" : 'Today'}
                </p>
                <p style={{ fontSize: '1.75rem', fontWeight: 700, color: '#A855F7' }}>{stats.today}</p>
              </div>
            </div>

            {/* Search and Filter */}
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <div style={{ flex: '1 1 300px', position: 'relative' }}>
                <Search style={{
                  position: 'absolute',
                  left: language === 'ar' ? 'auto' : '0.75rem',
                  right: language === 'ar' ? '0.75rem' : 'auto',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: '1.25rem',
                  height: '1.25rem',
                  color: 'var(--text-muted)'
                }} />
                <input
                  className="input-pro"
                  type="text"
                  placeholder={language === 'ar' ? 'بحث عن طالب أو معلم...' : language === 'fr' ? 'Rechercher étudiant ou instructeur...' : 'Search student or instructor...'}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{
                    paddingLeft: language === 'ar' ? '1rem' : '2.5rem',
                    paddingRight: language === 'ar' ? '2.5rem' : '1rem',
                    width: '100%'
                  }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Filter style={{ width: '1.25rem', height: '1.25rem', color: 'var(--text-secondary)' }} />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  style={{
                    padding: '0.625rem 1rem',
                    borderRadius: 'var(--radius-full)',
                    border: '1px solid var(--border)',
                    background: 'var(--bg-mid)',
                    color: 'var(--text-primary)',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    cursor: 'pointer',
                    outline: 'none'
                  }}
                >
                  <option value="all">{language === 'ar' ? 'الكل' : language === 'fr' ? 'Tous' : 'All'}</option>
                  <option value="pending">{language === 'ar' ? 'قيد الانتظار' : language === 'fr' ? 'En attente' : 'Pending'}</option>
                  <option value="approved">{language === 'ar' ? 'مقبول' : language === 'fr' ? 'Approuvé' : 'Approved'}</option>
                  <option value="rejected">{language === 'ar' ? 'مرفوض' : language === 'fr' ? 'Rejeté' : 'Rejected'}</option>
                </select>
              </div>
            </div>
          </div>

          {/* Messages */}
          {(message || error) && (
            <div style={{ marginTop: '1rem' }}>
              {message && (
                <div style={{
                  padding: '1rem 1.25rem',
                  background: 'rgba(34,197,94,0.08)',
                  border: '1px solid rgba(34,197,94,0.3)',
                  borderRadius: 'var(--radius-md)',
                  color: '#4ADE80',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  fontWeight: 600
                }}>
                  <Check style={{ width: '1.25rem', height: '1.25rem', flexShrink: 0 }} />
                  {message}
                </div>
              )}
              {error && (
                <div style={{
                  padding: '1rem 1.25rem',
                  background: 'rgba(239,68,68,0.08)',
                  border: '1px solid rgba(239,68,68,0.3)',
                  borderRadius: 'var(--radius-md)',
                  color: '#FCA5A5',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  fontWeight: 600
                }}>
                  <AlertCircle style={{ width: '1.25rem', height: '1.25rem', flexShrink: 0 }} />
                  {error}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Bookings List */}
        <div>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '3rem' }}>
              <Loader2 className="w-8 h-8 animate-spin" style={{ margin: '0 auto', color: 'var(--primary)' }} />
            </div>
          ) : filteredBookings.length === 0 ? (
            <div style={{
              background: 'var(--grad-card)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-lg)',
              padding: '4rem 2rem',
              textAlign: 'center'
            }}>
              <Calendar style={{ width: '4rem', height: '4rem', color: 'var(--text-muted)', margin: '0 auto 1rem' }} />
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                {language === 'ar' ? 'لا توجد حجوزات' : language === 'fr' ? 'Aucune réservation' : 'No bookings'}
              </h3>
              <p style={{ fontSize: '1rem', color: 'var(--text-secondary)' }}>
                {searchTerm || statusFilter !== 'all'
                  ? (language === 'ar' ? 'لا توجد نتائج للبحث' : language === 'fr' ? 'Aucun résultat' : 'No results found')
                  : (language === 'ar' ? 'لم يتم استلام أي حجوزات بعد' : language === 'fr' ? 'Aucune réservation reçue' : 'No bookings received yet')
                }
              </p>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '1rem' }}>
              {filteredBookings.map((booking) => (
                <div
                  key={booking.id}
                  style={{
                    background: 'var(--grad-card)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-lg)',
                    padding: '1.5rem',
                    transition: 'border-color 0.2s'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
                        {/* Student */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <div style={{
                            width: '2.5rem',
                            height: '2.5rem',
                            borderRadius: '0.5rem',
                            background: usersData[booking.studentId]?.photoURL || usersData[booking.studentId]?.profileImage
                              ? 'transparent'
                              : 'var(--grad-gold)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            overflow: 'hidden',
                            flexShrink: 0
                          }}>
                            {usersData[booking.studentId]?.photoURL || usersData[booking.studentId]?.profileImage ? (
                              <img
                                src={usersData[booking.studentId]?.photoURL || usersData[booking.studentId]?.profileImage}
                                alt={booking.studentName}
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                              />
                            ) : (
                              <User style={{ width: '1.25rem', height: '1.25rem', color: 'white' }} />
                            )}
                          </div>
                          <div>
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.125rem' }}>
                              {language === 'ar' ? 'الطالب' : language === 'fr' ? 'Étudiant' : 'Student'}
                            </p>
                            <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                              {booking.studentName}
                            </p>
                          </div>
                        </div>

                        {/* Instructor */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <div style={{
                            width: '2.5rem',
                            height: '2.5rem',
                            borderRadius: '0.5rem',
                            background: usersData[booking.teacherId]?.photoURL || usersData[booking.teacherId]?.profileImage
                              ? 'transparent'
                              : 'linear-gradient(135deg, rgba(168,85,247,0.8) 0%, rgba(124,58,237,0.8) 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            overflow: 'hidden',
                            flexShrink: 0
                          }}>
                            {usersData[booking.teacherId]?.photoURL || usersData[booking.teacherId]?.profileImage ? (
                              <img
                                src={usersData[booking.teacherId]?.photoURL || usersData[booking.teacherId]?.profileImage}
                                alt={booking.teacherName}
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                              />
                            ) : (
                              <User style={{ width: '1.25rem', height: '1.25rem', color: 'white' }} />
                            )}
                          </div>
                          <div>
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.125rem' }}>
                              {language === 'ar' ? 'المعلم' : language === 'fr' ? 'Instructeur' : 'Instructor'}
                            </p>
                            <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                              {booking.teacherName}
                            </p>
                          </div>
                        </div>

                        {/* Date */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <Calendar style={{ width: '1.125rem', height: '1.125rem', color: 'var(--primary)' }} />
                          <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                            {new Date(booking.date).toLocaleDateString(language === 'ar' ? 'ar-DZ' : language === 'fr' ? 'fr-FR' : 'en-US')}
                          </span>
                        </div>

                        {/* Time */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <Clock style={{ width: '1.125rem', height: '1.125rem', color: 'var(--primary)' }} />
                          <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                            {booking.time}
                          </span>
                        </div>
                      </div>

                      {/* Vehicle info */}
                      {booking.vehicleName && (
                        <div style={{
                          marginBottom: '0.75rem',
                          display: 'flex', alignItems: 'center', gap: '0.75rem',
                          padding: '0.5rem 0.75rem',
                          background: 'rgba(245,166,35,0.06)',
                          border: '1px solid var(--border-gold)',
                          borderRadius: '0.5rem'
                        }}>
                          {booking.vehicleImageUrl ? (
                            <img src={booking.vehicleImageUrl} alt={booking.vehicleName}
                              style={{ width: '2.5rem', height: '2.5rem', borderRadius: '0.375rem', objectFit: 'cover', flexShrink: 0 }} />
                          ) : (
                            <Car style={{ width: '1rem', height: '1rem', color: 'var(--primary)', flexShrink: 0 }} />
                          )}
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            {language === 'ar' ? 'المركبة:' : language === 'fr' ? 'Véhicule:' : 'Vehicle:'}
                          </span>
                          <span style={{ fontSize: '0.875rem', color: 'var(--primary)', fontWeight: 600 }}>
                            {booking.vehicleName}
                          </span>
                        </div>
                      )}

                      {booking.notes && (
                        <div style={{
                          padding: '0.75rem',
                          background: 'rgba(255,255,255,0.03)',
                          border: '1px solid var(--border)',
                          borderRadius: '0.5rem',
                          marginBottom: '1rem'
                        }}>
                          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                            "{booking.notes}"
                          </p>
                        </div>
                      )}

                      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
                        {getStatusBadge(booking.status)}
                        <button
                          onClick={() => handleDelete(booking.id, booking.studentName)}
                          style={{
                            background: 'rgba(239,68,68,0.1)',
                            border: '1px solid rgba(239,68,68,0.3)',
                            color: '#FCA5A5',
                            borderRadius: 'var(--radius-full)',
                            padding: '8px 16px',
                            cursor: 'pointer',
                            fontSize: '0.875rem',
                            fontWeight: 600,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px'
                          }}
                        >
                          <Trash2 style={{ width: '1rem', height: '1rem' }} />
                          {language === 'ar' ? 'حذف' : language === 'fr' ? 'Supprimer' : 'Delete'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Archive Modal */}
      {showArchiveDialog && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.75)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1rem'
        }}>
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)',
            padding: '2rem',
            width: '100%',
            maxWidth: '900px',
            maxHeight: '80vh',
            overflow: 'auto',
            boxShadow: 'var(--shadow-gold)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                {language === 'ar' ? 'الحجوزات المؤرشفة' : language === 'fr' ? 'Réservations Archivées' : 'Archived Bookings'}
              </h2>
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                {archivedBookings.length > 0 && (
                  <button
                    onClick={handleCleanArchive}
                    disabled={cleaningArchive}
                    style={{
                      background: 'rgba(239,68,68,0.1)',
                      border: '1px solid rgba(239,68,68,0.3)',
                      color: '#FCA5A5',
                      borderRadius: 'var(--radius-full)',
                      padding: '8px 16px',
                      cursor: cleaningArchive ? 'not-allowed' : 'pointer',
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      opacity: cleaningArchive ? 0.6 : 1
                    }}
                  >
                    {cleaningArchive ? (
                      <>
                        <Loader2 style={{ width: '1rem', height: '1rem' }} className="animate-spin" />
                        {language === 'ar' ? 'جاري التنظيف...' : language === 'fr' ? 'Nettoyage...' : 'Cleaning...'}
                      </>
                    ) : (
                      <>
                        <Trash2 style={{ width: '1rem', height: '1rem' }} />
                        {language === 'ar' ? 'تنظيف الأرشيف' : language === 'fr' ? 'Nettoyer Archive' : 'Clean Archive'}
                      </>
                    )}
                  </button>
                )}
                <button
                  onClick={() => setShowArchiveDialog(false)}
                  className="btn-ghost"
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '2rem', height: '2rem', padding: 0, borderRadius: '50%' }}
                >
                  <X style={{ width: '1.25rem', height: '1.25rem' }} />
                </button>
              </div>
            </div>

            <div>
              {loadingArchive ? (
                <div style={{ textAlign: 'center', padding: '2rem' }}>
                  <Loader2 className="w-8 h-8 animate-spin" style={{ margin: '0 auto', color: 'var(--primary)' }} />
                </div>
              ) : archivedBookings.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem' }}>
                  <Archive style={{ width: '3rem', height: '3rem', color: 'var(--text-muted)', margin: '0 auto 1rem' }} />
                  <p style={{ color: 'var(--text-secondary)' }}>
                    {language === 'ar' ? 'لا توجد حجوزات مؤرشفة' : language === 'fr' ? 'Aucune réservation archivée' : 'No archived bookings'}
                  </p>
                </div>
              ) : (
                <div style={{ display: 'grid', gap: '1rem' }}>
                  {archivedBookings.map((booking) => (
                    <div key={booking.id} style={{
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-md)',
                      padding: '1rem'
                    }}>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.75rem' }}>
                        <div>
                          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                            {language === 'ar' ? 'الطالب' : language === 'fr' ? 'Étudiant' : 'Student'}
                          </p>
                          <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                            {booking.studentName}
                          </p>
                        </div>
                        <div>
                          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                            {language === 'ar' ? 'المعلم' : language === 'fr' ? 'Instructeur' : 'Instructor'}
                          </p>
                          <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                            {booking.teacherName}
                          </p>
                        </div>
                        <div>
                          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                            {language === 'ar' ? 'التاريخ' : language === 'fr' ? 'Date' : 'Date'}
                          </p>
                          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                            {new Date(booking.date).toLocaleDateString(language === 'ar' ? 'ar-DZ' : language === 'fr' ? 'fr-FR' : 'en-US')}
                          </p>
                        </div>
                        <div>
                          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                            {language === 'ar' ? 'الوقت' : language === 'fr' ? 'Heure' : 'Time'}
                          </p>
                          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                            {booking.time}
                          </p>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                          {getStatusBadge(booking.status)}
                          {(booking as any).deletedByAdmin ? (
                            <span className="badge-pro badge-error" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                              <Trash2 style={{ width: '0.875rem', height: '0.875rem' }} />
                              {language === 'ar' ? 'محذوفة' : language === 'fr' ? 'Supprimée' : 'Deleted'}
                            </span>
                          ) : (
                            <span className="badge-pro badge-info" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                              <Archive style={{ width: '0.875rem', height: '0.875rem' }} />
                              {language === 'ar' ? 'مؤرشفة' : language === 'fr' ? 'Archivée' : 'Archived'}
                            </span>
                          )}
                        </div>
                      </div>
                      {booking.notes && (
                        <div style={{ marginTop: '0.75rem', padding: '0.5rem', background: 'rgba(255,255,255,0.03)', borderRadius: '0.5rem' }}>
                          <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                            "{booking.notes}"
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};

const AdminBookings = () => {
  return (
    <LanguageProvider>
      <AdminBookingsContent />
    </LanguageProvider>
  );
};

export default AdminBookings;
