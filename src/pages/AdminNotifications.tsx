import { useState, useEffect } from 'react';
import { LanguageProvider, useLanguage } from '../contexts/LanguageContext';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { supabase } from '../supabase';
import { Bell, Check, X, AlertCircle, Loader2, ArrowLeft, RefreshCw, DollarSign, CheckCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import '../components/style/theme.css';

interface LicenseChangeRequest {
  id: string;
  teacherId: string;
  teacherName: string;
  teacherPhotoURL?: string;
  currentLicenseType: string;
  requestedLicenseType: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

interface PaymentNotification {
  id: string;
  studentId: string;
  studentName: string;
  paymentType: string;
  paymentLabel: { ar: string; fr: string; en: string };
  createdAt: string;
  read: boolean;
}

const AdminNotificationsContent = () => {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const [requests, setRequests] = useState<LicenseChangeRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'license' | 'payments'>('payments');
  const [paymentNotifications, setPaymentNotifications] = useState<PaymentNotification[]>([]);
  const [markingAllRead, setMarkingAllRead] = useState(false);

  useEffect(() => {
    fetchRequests();
    fetchPaymentNotifications();
  }, []);

  const fetchPaymentNotifications = async () => {
    try {
      const { data, error } = await supabase
        .from('paymentNotifications')
        .select('*')
        .order('createdAt', { ascending: false });
      if (error) throw error;
      setPaymentNotifications((data || []) as PaymentNotification[]);
    } catch (err) {
      console.error('Error fetching payment notifications:', err);
    }
  };

  const markAllPaymentsRead = async () => {
    setMarkingAllRead(true);
    try {
      const unreadIds = paymentNotifications.filter(n => !n.read).map(n => n.id);
      if (unreadIds.length > 0) {
        await supabase.from('paymentNotifications').update({ read: true }).in('id', unreadIds);
      }
      setPaymentNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (err) {
      console.error('Error marking as read:', err);
    } finally {
      setMarkingAllRead(false);
    }
  };

  const fetchRequests = async () => {
    try {
      const { data: reqs, error } = await supabase
        .from('licenseChangeRequests')
        .select('*')
        .order('createdAt', { ascending: false });
      if (error) throw error;

      const requestsList: LicenseChangeRequest[] = await Promise.all(
        (reqs || []).map(async (row) => {
          let teacherPhotoURL: string | undefined;
          try {
            const { data: teacher } = await supabase
              .from('users').select('photoURL').eq('id', row.teacherId).single();
            teacherPhotoURL = teacher?.photoURL;
          } catch (err) {
            console.error('Error fetching teacher photo:', err);
          }
          return {
            id: row.id,
            teacherId: row.teacherId,
            teacherName: row.teacherName,
            teacherPhotoURL,
            currentLicenseType: row.currentLicenseType,
            requestedLicenseType: row.requestedLicenseType,
            reason: row.reason,
            status: row.status,
            createdAt: row.createdAt
          };
        })
      );

      setRequests(requestsList);
    } catch (error) {
      console.error('Error fetching requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (request: LicenseChangeRequest) => {
    setProcessingId(request.id);

    try {
      await supabase.from('users').update({ licenseType: request.requestedLicenseType }).eq('id', request.teacherId);
      await supabase.from('licenseChangeRequests').update({ status: 'approved', processedAt: new Date().toISOString() }).eq('id', request.id);

      setMessage(
        language === 'ar'
          ? 'تمت الموافقة على الطلب وتم تغيير نوع الرخصة'
          : language === 'fr'
          ? 'Demande approuvée et type de permis modifié'
          : 'Request approved and license type changed'
      );

      fetchRequests();
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error approving request:', error);
      setError(
        language === 'ar'
          ? 'حدث خطأ أثناء الموافقة'
          : language === 'fr'
          ? 'Erreur lors de l\'approbation'
          : 'Error approving request'
      );
      setTimeout(() => setError(''), 3000);
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (requestId: string) => {
    setProcessingId(requestId);

    try {
      await supabase.from('licenseChangeRequests').update({ status: 'rejected', processedAt: new Date().toISOString() }).eq('id', requestId);

      setMessage(
        language === 'ar'
          ? 'تم رفض الطلب'
          : language === 'fr'
          ? 'Demande rejetée'
          : 'Request rejected'
      );

      fetchRequests();
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error rejecting request:', error);
      setError(
        language === 'ar'
          ? 'حدث خطأ أثناء الرفض'
          : language === 'fr'
          ? 'Erreur lors du rejet'
          : 'Error rejecting request'
      );
      setTimeout(() => setError(''), 3000);
    } finally {
      setProcessingId(null);
    }
  };

  const pendingRequests = requests.filter(r => r.status === 'pending');
  const processedRequests = requests.filter(r => r.status !== 'pending');

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
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
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
                  marginBottom: '0.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem'
                }}>
                  <Bell style={{ width: '2rem', height: '2rem', color: 'var(--primary)' }} />
                  {language === 'ar' ? 'الإشعارات' : language === 'fr' ? 'Notifications' : 'Notifications'}
                </h1>
                <p style={{ color: 'var(--text-secondary)', fontSize: '1rem' }}>
                  {language === 'ar' ? 'طلبات تغيير نوع الرخصة من المعلمين' : language === 'fr' ? 'Demandes de changement de type de permis' : 'License type change requests from instructors'}
                </p>
              </div>
              <button
                className="btn-primary"
                onClick={fetchRequests}
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
              >
                <RefreshCw style={{ width: '1rem', height: '1rem' }} />
                {language === 'ar' ? 'تحديث' : language === 'fr' ? 'Actualiser' : 'Refresh'}
              </button>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem', flexWrap: 'wrap' }}>
              <button
                onClick={() => setActiveTab('payments')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.75rem 1.5rem',
                  borderRadius: 'var(--radius-full)',
                  border: activeTab === 'payments' ? '1px solid var(--border-gold)' : '1px solid var(--border)',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '0.9rem',
                  background: activeTab === 'payments' ? 'rgba(245,166,35,0.15)' : 'var(--bg-mid)',
                  color: activeTab === 'payments' ? 'var(--primary)' : 'var(--text-secondary)',
                  transition: 'all 0.2s',
                  position: 'relative'
                }}
              >
                <DollarSign style={{ width: '1rem', height: '1rem' }} />
                {language === 'ar' ? 'إشعارات الدفع' : language === 'fr' ? 'Paiements' : 'Payment Notifications'}
                {paymentNotifications.filter(n => !n.read).length > 0 && (
                  <span style={{
                    position: 'absolute',
                    top: '-6px',
                    right: '-6px',
                    background: '#EF4444',
                    color: 'white',
                    borderRadius: '50%',
                    width: '1.25rem',
                    height: '1.25rem',
                    fontSize: '0.7rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700
                  }}>
                    {paymentNotifications.filter(n => !n.read).length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveTab('license')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.75rem 1.5rem',
                  borderRadius: 'var(--radius-full)',
                  border: activeTab === 'license' ? '1px solid var(--border-gold)' : '1px solid var(--border)',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '0.9rem',
                  background: activeTab === 'license' ? 'rgba(245,166,35,0.15)' : 'var(--bg-mid)',
                  color: activeTab === 'license' ? 'var(--primary)' : 'var(--text-secondary)',
                  transition: 'all 0.2s',
                  position: 'relative'
                }}
              >
                <Bell style={{ width: '1rem', height: '1rem' }} />
                {language === 'ar' ? 'طلبات الرخصة' : language === 'fr' ? 'Demandes Permis' : 'License Requests'}
                {pendingRequests.length > 0 && (
                  <span style={{
                    position: 'absolute',
                    top: '-6px',
                    right: '-6px',
                    background: 'var(--primary)',
                    color: '#0B0E1A',
                    borderRadius: '50%',
                    width: '1.25rem',
                    height: '1.25rem',
                    fontSize: '0.7rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700
                  }}>
                    {pendingRequests.length}
                  </span>
                )}
              </button>
            </div>

            {activeTab === 'license' && pendingRequests.length > 0 && (
              <div style={{
                padding: '1rem',
                background: 'rgba(245,166,35,0.08)',
                border: '1px solid var(--border-gold)',
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                marginTop: '1rem'
              }}>
                <AlertCircle style={{ width: '1.25rem', height: '1.25rem', color: 'var(--primary)' }} />
                <span style={{ color: 'var(--primary)', fontWeight: 600 }}>
                  {language === 'ar'
                    ? `لديك ${pendingRequests.length} طلب قيد الانتظار`
                    : language === 'fr'
                    ? `Vous avez ${pendingRequests.length} demande(s) en attente`
                    : `You have ${pendingRequests.length} pending request(s)`
                  }
                </span>
              </div>
            )}
          </div>

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
                  <Check style={{ width: '1.25rem', height: '1.25rem' }} />
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
                  <AlertCircle style={{ width: '1.25rem', height: '1.25rem' }} />
                  {error}
                </div>
              )}
            </div>
          )}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem' }}>
            <Loader2 className="w-8 h-8 animate-spin" style={{ margin: '0 auto', color: 'var(--primary)' }} />
          </div>
        ) : (
          <>
            {/* Payment Notifications Tab */}
            {activeTab === 'payments' && (
              <div>
                {paymentNotifications.length > 0 ? (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                      <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                        {language === 'ar' ? 'إشعارات الدفع' : language === 'fr' ? 'Notifications de paiement' : 'Payment Notifications'}
                        <span style={{ marginRight: '0.5rem', marginLeft: '0.5rem', fontSize: '1rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                          ({paymentNotifications.length})
                        </span>
                      </h2>
                      {paymentNotifications.some(n => !n.read) && (
                        <button
                          className="btn-outline"
                          onClick={markAllPaymentsRead}
                          disabled={markingAllRead}
                          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', opacity: markingAllRead ? 0.6 : 1 }}
                        >
                          {markingAllRead ? <Loader2 style={{ width: '1rem', height: '1rem' }} className="animate-spin" /> : <CheckCheck style={{ width: '1rem', height: '1rem' }} />}
                          {language === 'ar' ? 'تحديد الكل كمقروء' : language === 'fr' ? 'Tout marquer lu' : 'Mark all as read'}
                        </button>
                      )}
                    </div>
                    <div style={{ display: 'grid', gap: '0.75rem' }}>
                      {paymentNotifications.map((notif) => (
                        <div
                          key={notif.id}
                          style={{
                            background: 'var(--grad-card)',
                            borderRadius: 'var(--radius-md)',
                            border: notif.read ? '1px solid var(--border)' : '1px solid var(--border-gold)',
                            borderLeft: notif.read ? '3px solid var(--border)' : '3px solid var(--primary)',
                            padding: '1.25rem',
                            boxShadow: notif.read ? 'none' : 'var(--shadow-gold)'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <div style={{
                              width: '3rem',
                              height: '3rem',
                              borderRadius: '0.75rem',
                              background: 'rgba(245,166,35,0.15)',
                              border: '1px solid var(--border-gold)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0
                            }}>
                              <DollarSign style={{ width: '1.5rem', height: '1.5rem', color: 'var(--primary)' }} />
                            </div>
                            <div style={{ flex: 1 }}>
                              <p style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '1rem', marginBottom: '0.25rem' }}>
                                {notif.studentName}
                              </p>
                              <p style={{ color: 'var(--primary)', fontSize: '0.875rem', fontWeight: 600 }}>
                                {language === 'ar'
                                  ? `دفع ${notif.paymentLabel?.ar || notif.paymentType}`
                                  : language === 'fr'
                                  ? `Paiement ${notif.paymentLabel?.fr || notif.paymentType}`
                                  : `Paid ${notif.paymentLabel?.en || notif.paymentType}`
                                }
                              </p>
                              <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                                {new Date(notif.createdAt).toLocaleString(
                                  language === 'ar' ? 'ar-DZ' : language === 'fr' ? 'fr-FR' : 'en-US'
                                )}
                              </p>
                            </div>
                            {!notif.read && (
                              <span style={{
                                width: '0.625rem',
                                height: '0.625rem',
                                borderRadius: '50%',
                                background: 'var(--primary)',
                                flexShrink: 0
                              }} />
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div style={{
                    background: 'var(--grad-card)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-lg)',
                    padding: '4rem 2rem',
                    textAlign: 'center'
                  }}>
                    <DollarSign style={{ width: '4rem', height: '4rem', color: 'var(--text-muted)', margin: '0 auto 1rem' }} />
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                      {language === 'ar' ? 'لا توجد إشعارات دفع' : language === 'fr' ? 'Aucune notification de paiement' : 'No payment notifications'}
                    </h3>
                    <p style={{ fontSize: '1rem', color: 'var(--text-secondary)' }}>
                      {language === 'ar' ? 'ستظهر هنا عند تسجيل أي دفعة' : language === 'fr' ? 'Elles apparaîtront ici lors d\'un paiement' : 'They will appear here when a payment is recorded'}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* License Requests Tab */}
            {activeTab === 'license' && (
              <>
                {/* Pending Requests */}
                {pendingRequests.length > 0 && (
                  <div style={{ marginBottom: '2rem' }}>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1rem' }}>
                      {language === 'ar' ? 'طلبات قيد الانتظار' : language === 'fr' ? 'Demandes en attente' : 'Pending Requests'}
                    </h2>
                    <div style={{ display: 'grid', gap: '1rem' }}>
                      {pendingRequests.map((request) => (
                        <div
                          key={request.id}
                          style={{
                            background: 'var(--grad-card)',
                            borderRadius: 'var(--radius-lg)',
                            border: '1px solid var(--border-gold)',
                            borderLeft: '3px solid var(--primary)',
                            padding: '1.5rem',
                            boxShadow: 'var(--shadow-gold)'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap' }}>
                            <div style={{ flex: 1 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                                <div style={{
                                  width: '3rem',
                                  height: '3rem',
                                  borderRadius: '0.75rem',
                                  background: request.teacherPhotoURL
                                    ? `url(${request.teacherPhotoURL})`
                                    : 'rgba(245,166,35,0.15)',
                                  backgroundSize: 'cover',
                                  backgroundPosition: 'center',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  border: '1px solid var(--border-gold)',
                                  flexShrink: 0
                                }}>
                                  {!request.teacherPhotoURL && (
                                    <Bell style={{ width: '1.5rem', height: '1.5rem', color: 'var(--primary)' }} />
                                  )}
                                </div>
                                <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                                  {request.teacherName}
                                </h3>
                              </div>
                              <div style={{ display: 'grid', gap: '0.5rem', marginBottom: '1rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                                  <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                                    {language === 'ar' ? 'من:' : language === 'fr' ? 'De:' : 'From:'}
                                  </span>
                                  <span className="badge-pro badge-error">
                                    {language === 'ar' ? 'رخصة' : language === 'fr' ? 'Permis' : 'License'} {request.currentLicenseType}
                                  </span>
                                  <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>→</span>
                                  <span className="badge-pro badge-success">
                                    {language === 'ar' ? 'رخصة' : language === 'fr' ? 'Permis' : 'License'} {request.requestedLicenseType}
                                  </span>
                                </div>
                              </div>
                              {request.reason && (
                                <div style={{
                                  padding: '0.75rem',
                                  background: 'rgba(255,255,255,0.03)',
                                  border: '1px solid var(--border)',
                                  borderRadius: '0.5rem',
                                  marginBottom: '1rem'
                                }}>
                                  <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                                    "{request.reason}"
                                  </p>
                                </div>
                              )}
                              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                {new Date(request.createdAt).toLocaleString(language === 'ar' ? 'ar-DZ' : language === 'fr' ? 'fr-FR' : 'en-US')}
                              </p>
                            </div>
                            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                              <button
                                onClick={() => handleApprove(request)}
                                disabled={processingId === request.id}
                                className="btn-primary"
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '0.5rem',
                                  opacity: processingId === request.id ? 0.6 : 1,
                                  cursor: processingId === request.id ? 'not-allowed' : 'pointer'
                                }}
                              >
                                {processingId === request.id ? (
                                  <Loader2 style={{ width: '1rem', height: '1rem' }} className="animate-spin" />
                                ) : (
                                  <Check style={{ width: '1rem', height: '1rem' }} />
                                )}
                                {language === 'ar' ? 'موافقة' : language === 'fr' ? 'Approuver' : 'Approve'}
                              </button>
                              <button
                                onClick={() => handleReject(request.id)}
                                disabled={processingId === request.id}
                                style={{
                                  background: 'rgba(239,68,68,0.1)',
                                  border: '1px solid rgba(239,68,68,0.3)',
                                  color: '#FCA5A5',
                                  borderRadius: 'var(--radius-full)',
                                  padding: '8px 16px',
                                  cursor: processingId === request.id ? 'not-allowed' : 'pointer',
                                  fontSize: '0.875rem',
                                  fontWeight: 600,
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '6px',
                                  opacity: processingId === request.id ? 0.6 : 1
                                }}
                              >
                                {processingId === request.id ? (
                                  <Loader2 style={{ width: '1rem', height: '1rem' }} className="animate-spin" />
                                ) : (
                                  <X style={{ width: '1rem', height: '1rem' }} />
                                )}
                                {language === 'ar' ? 'رفض' : language === 'fr' ? 'Rejeter' : 'Reject'}
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Processed Requests */}
                {processedRequests.length > 0 && (
                  <div>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1rem' }}>
                      {language === 'ar' ? 'الطلبات المعالجة' : language === 'fr' ? 'Demandes traitées' : 'Processed Requests'}
                    </h2>
                    <div style={{ display: 'grid', gap: '1rem' }}>
                      {processedRequests.map((request) => (
                        <div
                          key={request.id}
                          style={{
                            background: 'var(--grad-card)',
                            borderRadius: 'var(--radius-lg)',
                            border: '1px solid var(--border)',
                            padding: '1.5rem',
                            opacity: 0.75
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                            <div style={{ flex: 1 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                                <div style={{
                                  width: '2.5rem',
                                  height: '2.5rem',
                                  borderRadius: '0.5rem',
                                  background: request.teacherPhotoURL
                                    ? `url(${request.teacherPhotoURL})`
                                    : 'var(--bg-mid)',
                                  backgroundSize: 'cover',
                                  backgroundPosition: 'center',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  border: '1px solid var(--border)',
                                  flexShrink: 0
                                }}>
                                  {!request.teacherPhotoURL && (
                                    <Bell style={{ width: '1.25rem', height: '1.25rem', color: 'var(--text-muted)' }} />
                                  )}
                                </div>
                                <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                                  {request.teacherName}
                                </h3>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                                <span>{request.currentLicenseType} → {request.requestedLicenseType}</span>
                              </div>
                            </div>
                            <span className={`badge-pro ${request.status === 'approved' ? 'badge-success' : 'badge-error'}`}>
                              {request.status === 'approved'
                                ? (language === 'ar' ? 'تمت الموافقة' : language === 'fr' ? 'Approuvé' : 'Approved')
                                : (language === 'ar' ? 'مرفوض' : language === 'fr' ? 'Rejeté' : 'Rejected')
                              }
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {requests.length === 0 && (
                  <div style={{
                    background: 'var(--grad-card)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-lg)',
                    padding: '4rem 2rem',
                    textAlign: 'center'
                  }}>
                    <Bell style={{ width: '4rem', height: '4rem', color: 'var(--text-muted)', margin: '0 auto 1rem' }} />
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                      {language === 'ar' ? 'لا توجد إشعارات' : language === 'fr' ? 'Aucune notification' : 'No notifications'}
                    </h3>
                    <p style={{ fontSize: '1rem', color: 'var(--text-secondary)' }}>
                      {language === 'ar' ? 'لا توجد طلبات تغيير رخصة حالياً' : language === 'fr' ? 'Aucune demande de changement de permis' : 'No license change requests at the moment'}
                    </p>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </main>

      <Footer />
    </div>
  );
};

const AdminNotifications = () => {
  return (
    <LanguageProvider>
      <AdminNotificationsContent />
    </LanguageProvider>
  );
};

export default AdminNotifications;
