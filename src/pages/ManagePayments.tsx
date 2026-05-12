import { useState, useEffect } from 'react';
import { LanguageProvider, useLanguage } from '../contexts/LanguageContext';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { supabase } from '../supabase';
import { Check, X, DollarSign, ArrowLeft, Eye, User, Mail, Phone, Calendar, CreditCard } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { distributeSessionsToSchedule } from '../utils/scheduleGenerator';
import type { WorkDays } from '../utils/scheduleGenerator';
import '../components/style/theme.css';

interface Student {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  licenseType: string;
  teacherId?: string;
  teacherName?: string;
  createdAt: string;
  photoURL?: string;
  payments: {
    code: boolean;
    creneau: boolean;
    circui: boolean;
  };
}

const ManagePaymentsContent = () => {
  const { language, dir } = useLanguage();
  const navigate = useNavigate();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [updatingPayment, setUpdatingPayment] = useState<string | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      const { data, error } = await supabase.from('users').select('*').eq('role', 'student');
      if (error) throw error;
      const studentsList: Student[] = (data || []).map(d => ({
        id: d.id,
        fullName: d.fullName,
        email: d.email || '',
        phone: d.phone || '',
        licenseType: d.licenseType || 'B',
        teacherId: d.teacherId,
        teacherName: d.teacherName,
        createdAt: d.createdAt || new Date().toISOString(),
        photoURL: d.photoURL,
        payments: d.payments || { code: false, creneau: false, circui: false }
      }));
      studentsList.sort((a, b) => a.fullName.localeCompare(b.fullName));
      setStudents(studentsList);
    } catch (error) {
      console.error('Error fetching students:', error);
    } finally {
      setLoading(false);
    }
  };

  const togglePayment = async (studentId: string, paymentType: 'code' | 'creneau' | 'circui') => {
    setUpdatingPayment(`${studentId}-${paymentType}`);

    try {
      const student = students.find(s => s.id === studentId);
      if (!student) return;

      const newPaymentStatus = !student.payments[paymentType];
      const updatedPayments = { ...student.payments, [paymentType]: newPaymentStatus };

      await supabase.from('users').update({ payments: updatedPayments }).eq('id', studentId);

      setStudents(students.map(s =>
        s.id === studentId
          ? { ...s, payments: { ...s.payments, [paymentType]: newPaymentStatus } }
          : s
      ));

      if (newPaymentStatus) {
        const paymentLabels: Record<string, { ar: string; fr: string; en: string }> = {
          code: { ar: 'الكود', fr: 'Code', en: 'Code' },
          creneau: { ar: 'الكرينو', fr: 'Créneau', en: 'Creneau' },
          circui: { ar: 'السيركوي', fr: 'Circui', en: 'Circui' }
        };
        await supabase.from('paymentNotifications').insert({
          studentId,
          studentName: student.fullName,
          paymentType,
          paymentLabel: paymentLabels[paymentType],
          amount: null,
          createdAt: new Date().toISOString(),
          read: false
        });
      }

      if (newPaymentStatus) {
        if (!student.teacherId) {
          setMessage(
            language === 'ar'
              ? 'تم تحديث حالة الدفع — تنبيه: لم يتم توزيع الحصص لأن الطالب غير مرتبط بمعلم'
              : language === 'fr'
              ? 'Paiement mis à jour — Attention : aucune session distribuée car l\'étudiant n\'a pas d\'enseignant assigné'
              : 'Payment updated — Warning: no sessions distributed because the student has no assigned teacher'
          );
          setTimeout(() => setMessage(''), 5000);
          return;
        }

        try {
          const { data: teacherData } = await supabase.from('users').select('*').eq('id', student.teacherId).single();
          const workDays = teacherData?.workDays as WorkDays | undefined;

          const result = await distributeSessionsToSchedule(
            student.id,
            student.fullName,
            student.teacherId,
            student.teacherName || teacherData?.fullName || '',
            workDays,
            paymentType
          );

          if (result.success) {
            setMessage(
              language === 'ar'
                ? `تم تحديث حالة الدفع وتوزيع ${result.distributed} حصة بنجاح`
                : language === 'fr'
                ? `Paiement mis à jour et ${result.distributed} sessions distribuées avec succès`
                : `Payment updated and ${result.distributed} sessions distributed successfully`
            );
          } else if (result.distributed < result.required) {
            setMessage(
              language === 'ar'
                ? `تم تحديث حالة الدفع — تحذير: تم توزيع ${result.distributed} من ${result.required} حصة فقط`
                : language === 'fr'
                ? `Paiement mis à jour — Avertissement : ${result.distributed} sur ${result.required} sessions ont été distribuées`
                : `Payment updated — Warning: ${result.distributed} of ${result.required} sessions were distributed`
            );
          } else {
            setMessage(
              language === 'ar'
                ? 'تم تحديث حالة الدفع بنجاح'
                : language === 'fr'
                ? 'Statut de paiement mis à jour'
                : 'Payment status updated'
            );
          }
        } catch (error) {
          console.error('Error distributing sessions:', error);
          setMessage(
            language === 'ar'
              ? 'تم تحديث حالة الدفع — خطأ: فشل الاتصال بـ Firebase أثناء توزيع الحصص'
              : language === 'fr'
              ? 'Paiement mis à jour — Erreur : échec de connexion à Firebase lors de la distribution des sessions'
              : 'Payment updated — Error: Firebase connection failed while distributing sessions'
          );
        }
      } else {
        setMessage(
          language === 'ar'
            ? 'تم تحديث حالة الدفع بنجاح'
            : language === 'fr'
            ? 'Statut de paiement mis à jour'
            : 'Payment status updated'
        );
      }

      setTimeout(() => setMessage(''), 5000);
    } catch (error) {
      console.error('Error updating payment:', error);
      setMessage(
        language === 'ar'
          ? 'حدث خطأ أثناء تحديث الدفع'
          : language === 'fr'
          ? 'Erreur lors de la mise à jour'
          : 'Error updating payment'
      );
      setTimeout(() => setMessage(''), 3000);
    } finally {
      setUpdatingPayment(null);
    }
  };

  const getStudentsByLicense = (licenseType: string) => {
    return students.filter(s => s.licenseType === licenseType);
  };

  const spinnerStyle: React.CSSProperties = {
    width: '18px',
    height: '18px',
    border: '3px solid rgba(245,166,35,0.2)',
    borderTopColor: 'var(--primary)',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
    display: 'inline-block'
  };

  const PaymentTable = ({ licenseType, students }: { licenseType: string; students: Student[] }) => {
    const licenseLabels: { [key: string]: { ar: string; fr: string; en: string } } = {
      'A': { ar: 'رخصة A - دراجة نارية', fr: 'Permis A - Moto', en: 'License A - Motorcycle' },
      'B': { ar: 'رخصة B - سيارة', fr: 'Permis B - Voiture', en: 'License B - Car' },
      'C': { ar: 'رخصة C - شاحنة', fr: 'Permis C - Camion', en: 'License C - Truck' },
      'D': { ar: 'رخصة D - حافلة', fr: 'Permis D - Bus', en: 'License D - Bus' }
    };

    const secondColumnLabel = (licenseType === 'A' || licenseType === 'C')
      ? {
          ar: licenseType === 'A' ? 'مناورة بالدراجة' : 'المناورات',
          fr: licenseType === 'A' ? 'Manœuvre Moto' : 'Manœuvres',
          en: licenseType === 'A' ? 'Motorcycle Maneuver' : 'Maneuvers'
        }
      : {
          ar: 'الكرينو',
          fr: 'Créneau',
          en: 'Creneau'
        };

    const label = licenseLabels[licenseType] || { ar: `رخصة ${licenseType}`, fr: `Permis ${licenseType}`, en: `License ${licenseType}` };

    return (
      <div style={{ background: 'var(--grad-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '1.5rem', marginBottom: '2rem' }}>
        {/* Card Header */}
        <div style={{ paddingBottom: '1.25rem', marginBottom: '1.25rem', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ width: '2.5rem', height: '2.5rem', borderRadius: '0.5rem', background: 'var(--grad-gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '1.125rem', fontWeight: 700, flexShrink: 0 }}>
            {licenseType}
          </div>
          <span style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            {language === 'ar' ? label.ar : language === 'fr' ? label.fr : label.en}
          </span>
          <span style={{ marginLeft: 'auto', fontSize: '0.875rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
            ({students.length} {language === 'ar' ? 'طالب' : language === 'fr' ? 'étudiants' : 'students'})
          </span>
        </div>

        {students.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            {language === 'ar' ? 'لا يوجد طلاب' : language === 'fr' ? 'Aucun étudiant' : 'No students'}
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="table-pro" style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th style={{ textAlign: language === 'ar' ? 'right' : 'left' }}>
                    {language === 'ar' ? 'الاسم الكامل' : language === 'fr' ? 'Nom Complet' : 'Full Name'}
                  </th>
                  <th style={{ textAlign: 'center' }}>
                    {language === 'ar' ? 'الكود' : language === 'fr' ? 'Code' : 'Code'}
                  </th>
                  <th style={{ textAlign: 'center' }}>
                    {language === 'ar' ? secondColumnLabel.ar : language === 'fr' ? secondColumnLabel.fr : secondColumnLabel.en}
                  </th>
                  <th style={{ textAlign: 'center' }}>
                    {language === 'ar' ? 'السيركوي' : language === 'fr' ? 'Circui' : 'Circui'}
                  </th>
                  <th style={{ textAlign: 'center' }}>
                    {language === 'ar' ? 'التفاصيل' : language === 'fr' ? 'Détails' : 'Details'}
                  </th>
                </tr>
              </thead>
              <tbody>
                {students.map((student) => (
                  <tr key={student.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{
                          width: '2.5rem',
                          height: '2.5rem',
                          borderRadius: '0.5rem',
                          background: student.photoURL
                            ? `url(${student.photoURL})`
                            : 'var(--grad-gold)',
                          backgroundSize: 'cover',
                          backgroundPosition: 'center',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          border: '1px solid var(--border-gold)',
                          flexShrink: 0
                        }}>
                          {!student.photoURL && (
                            <User style={{ width: '1.25rem', height: '1.25rem', color: 'white' }} />
                          )}
                        </div>
                        <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{student.fullName}</span>
                      </div>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <button
                        onClick={() => togglePayment(student.id, 'code')}
                        disabled={updatingPayment === `${student.id}-code`}
                        style={{
                          width: '2.5rem',
                          height: '2.5rem',
                          padding: 0,
                          borderRadius: '0.5rem',
                          border: 'none',
                          background: student.payments.code ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.15)',
                          color: student.payments.code ? '#4ade80' : '#FCA5A5',
                          cursor: updatingPayment === `${student.id}-code` ? 'not-allowed' : 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          outline: `1px solid ${student.payments.code ? 'rgba(74,222,128,0.3)' : 'rgba(239,68,68,0.3)'}`,
                          transition: 'all 0.2s ease'
                        }}
                      >
                        {updatingPayment === `${student.id}-code` ? (
                          <div style={spinnerStyle} />
                        ) : student.payments.code ? (
                          <Check className="w-5 h-5" />
                        ) : (
                          <X className="w-5 h-5" />
                        )}
                      </button>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <button
                        onClick={() => togglePayment(student.id, 'creneau')}
                        disabled={updatingPayment === `${student.id}-creneau`}
                        style={{
                          width: '2.5rem',
                          height: '2.5rem',
                          padding: 0,
                          borderRadius: '0.5rem',
                          border: 'none',
                          background: student.payments.creneau ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.15)',
                          color: student.payments.creneau ? '#4ade80' : '#FCA5A5',
                          cursor: updatingPayment === `${student.id}-creneau` ? 'not-allowed' : 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          outline: `1px solid ${student.payments.creneau ? 'rgba(74,222,128,0.3)' : 'rgba(239,68,68,0.3)'}`,
                          transition: 'all 0.2s ease'
                        }}
                      >
                        {updatingPayment === `${student.id}-creneau` ? (
                          <div style={spinnerStyle} />
                        ) : student.payments.creneau ? (
                          <Check className="w-5 h-5" />
                        ) : (
                          <X className="w-5 h-5" />
                        )}
                      </button>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <button
                        onClick={() => togglePayment(student.id, 'circui')}
                        disabled={updatingPayment === `${student.id}-circui`}
                        style={{
                          width: '2.5rem',
                          height: '2.5rem',
                          padding: 0,
                          borderRadius: '0.5rem',
                          border: 'none',
                          background: student.payments.circui ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.15)',
                          color: student.payments.circui ? '#4ade80' : '#FCA5A5',
                          cursor: updatingPayment === `${student.id}-circui` ? 'not-allowed' : 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          outline: `1px solid ${student.payments.circui ? 'rgba(74,222,128,0.3)' : 'rgba(239,68,68,0.3)'}`,
                          transition: 'all 0.2s ease'
                        }}
                      >
                        {updatingPayment === `${student.id}-circui` ? (
                          <div style={spinnerStyle} />
                        ) : student.payments.circui ? (
                          <Check className="w-5 h-5" />
                        ) : (
                          <X className="w-5 h-5" />
                        )}
                      </button>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <button
                        className="btn-outline"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.875rem', padding: '6px 14px' }}
                        onClick={() => {
                          setSelectedStudent(student);
                          setShowDetailsDialog(true);
                        }}
                      >
                        <Eye className="w-4 h-4" />
                        {language === 'ar' ? 'عرض' : language === 'fr' ? 'Voir' : 'View'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  };

  const licenseTypes = ['B', 'A', 'C', 'D'];

  const detailRowStyle: React.CSSProperties = {
    padding: '1rem',
    background: 'var(--bg-mid)',
    borderRadius: '0.75rem',
    border: '1px solid var(--border)'
  };

  return (
    <div dir={dir} style={{ minHeight: '100vh', background: 'var(--bg-darkest)', color: 'var(--text-primary)' }}>
      <Navbar />

      <main style={{ padding: '6rem 1.5rem 3rem', maxWidth: '1400px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '2.5rem' }}>
          <div style={{ background: 'var(--grad-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <button
                className="btn-outline"
                onClick={() => navigate('/admin-dashboard')}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
              >
                <ArrowLeft className="w-4 h-4" />
                {language === 'ar' ? 'رجوع' : language === 'fr' ? 'Retour' : 'Back'}
              </button>
              <div>
                <h1 style={{ fontSize: '2rem', fontWeight: 700, background: 'var(--grad-gold)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <DollarSign style={{ width: '2rem', height: '2rem', color: 'var(--primary)' }} />
                  {language === 'ar' ? 'إدارة المدفوعات' : language === 'fr' ? 'Gérer les Paiements' : 'Manage Payments'}
                </h1>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                  {language === 'ar' ? 'متابعة مدفوعات الطلاب حسب نوع الرخصة' : language === 'fr' ? 'Suivre les paiements des étudiants par type de permis' : 'Track student payments by license type'}
                </p>
              </div>
            </div>
          </div>

          {message && (
            <div style={{ marginTop: '1rem', padding: '1rem 1.25rem', background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: 'var(--radius-md)', color: '#4ade80', display: 'flex', alignItems: 'center', gap: '0.75rem', fontWeight: 600 }}>
              <Check style={{ width: '1.25rem', height: '1.25rem' }} />
              {message}
            </div>
          )}
        </div>

        {/* Payment Tables */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem' }}>
            <div style={{ width: '3rem', height: '3rem', border: '4px solid rgba(245,166,35,0.2)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', display: 'inline-block' }} />
          </div>
        ) : (
          <div>
            {licenseTypes.map((licenseType) => {
              const licenseStudents = getStudentsByLicense(licenseType);
              if (licenseStudents.length === 0) return null;

              return (
                <PaymentTable
                  key={licenseType}
                  licenseType={licenseType}
                  students={licenseStudents}
                />
              );
            })}
          </div>
        )}
      </main>

      {/* Student Details Modal */}
      {showDetailsDialog && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-gold)', borderRadius: 'var(--radius-lg)', padding: '2rem', width: '100%', maxWidth: '520px', maxHeight: '90vh', overflowY: 'auto' }}>
            {/* Modal Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border-gold)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <User style={{ width: '1.75rem', height: '1.75rem', color: 'var(--primary)' }} />
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                  {language === 'ar' ? 'تفاصيل الطالب' : language === 'fr' ? 'Détails de l\'étudiant' : 'Student Details'}
                </h2>
              </div>
              <button
                className="btn-ghost"
                style={{ padding: '8px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                onClick={() => { setShowDetailsDialog(false); setSelectedStudent(null); }}
              >
                <X style={{ width: '1.25rem', height: '1.25rem' }} />
              </button>
            </div>

            {selectedStudent && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {/* Full Name */}
                <div style={detailRowStyle}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                    <User style={{ width: '1.25rem', height: '1.25rem', color: 'var(--primary)' }} />
                    <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      {language === 'ar' ? 'الاسم الكامل' : language === 'fr' ? 'Nom Complet' : 'Full Name'}
                    </span>
                  </div>
                  <p style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', marginLeft: '2rem', margin: 0, paddingLeft: '2rem' }}>
                    {selectedStudent.fullName}
                  </p>
                </div>

                {/* Email */}
                <div style={detailRowStyle}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                    <Mail style={{ width: '1.25rem', height: '1.25rem', color: '#a78bfa' }} />
                    <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      {language === 'ar' ? 'البريد الإلكتروني' : language === 'fr' ? 'Email' : 'Email'}
                    </span>
                  </div>
                  <p style={{ fontSize: '1rem', fontWeight: 500, color: 'var(--text-primary)', margin: 0, paddingLeft: '2rem' }}>
                    {selectedStudent.email || (language === 'ar' ? 'غير متوفر' : language === 'fr' ? 'Non disponible' : 'Not available')}
                  </p>
                </div>

                {/* Phone */}
                <div style={detailRowStyle}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                    <Phone style={{ width: '1.25rem', height: '1.25rem', color: '#34d399' }} />
                    <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      {language === 'ar' ? 'رقم الهاتف' : language === 'fr' ? 'Téléphone' : 'Phone'}
                    </span>
                  </div>
                  <p style={{ fontSize: '1rem', fontWeight: 500, color: 'var(--text-primary)', margin: 0, paddingLeft: '2rem', direction: 'ltr', textAlign: language === 'ar' ? 'right' : 'left' }}>
                    {selectedStudent.phone || (language === 'ar' ? 'غير متوفر' : language === 'fr' ? 'Non disponible' : 'Not available')}
                  </p>
                </div>

                {/* License Type */}
                <div style={detailRowStyle}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                    <CreditCard style={{ width: '1.25rem', height: '1.25rem', color: 'var(--primary)' }} />
                    <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      {language === 'ar' ? 'نوع الرخصة' : language === 'fr' ? 'Type de Permis' : 'License Type'}
                    </span>
                  </div>
                  <div style={{ paddingLeft: '2rem' }}>
                    <span style={{ display: 'inline-block', padding: '0.4rem 1rem', background: 'var(--grad-gold)', color: 'white', borderRadius: 'var(--radius-full)', fontSize: '1rem', fontWeight: 700 }}>
                      {selectedStudent.licenseType}
                    </span>
                  </div>
                </div>

                {/* Registration Date */}
                <div style={detailRowStyle}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                    <Calendar style={{ width: '1.25rem', height: '1.25rem', color: '#f472b6' }} />
                    <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      {language === 'ar' ? 'تاريخ التسجيل' : language === 'fr' ? 'Date d\'inscription' : 'Registration Date'}
                    </span>
                  </div>
                  <p style={{ fontSize: '1rem', fontWeight: 500, color: 'var(--text-primary)', margin: 0, paddingLeft: '2rem' }}>
                    {new Date(selectedStudent.createdAt).toLocaleDateString(language === 'ar' ? 'ar-DZ' : language === 'fr' ? 'fr-FR' : 'en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>

                {/* Payment Status */}
                <div style={detailRowStyle}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                    <DollarSign style={{ width: '1.25rem', height: '1.25rem', color: '#4ade80' }} />
                    <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      {language === 'ar' ? 'حالة المدفوعات' : language === 'fr' ? 'État des Paiements' : 'Payment Status'}
                    </span>
                  </div>
                  <div style={{ paddingLeft: '2rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {[
                      {
                        key: 'code' as const,
                        label: language === 'ar' ? 'الكود' : language === 'fr' ? 'Code' : 'Code',
                        paid: selectedStudent.payments.code
                      },
                      {
                        key: 'creneau' as const,
                        label: selectedStudent.licenseType === 'A'
                          ? (language === 'ar' ? 'مناورة بالدراجة' : language === 'fr' ? 'Manœuvre Moto' : 'Motorcycle Maneuver')
                          : selectedStudent.licenseType === 'C'
                          ? (language === 'ar' ? 'المناورات' : language === 'fr' ? 'Manœuvres' : 'Maneuvers')
                          : (language === 'ar' ? 'الكرينو' : language === 'fr' ? 'Créneau' : 'Creneau'),
                        paid: selectedStudent.payments.creneau
                      },
                      {
                        key: 'circui' as const,
                        label: language === 'ar' ? 'السيركوي' : language === 'fr' ? 'Circui' : 'Circui',
                        paid: selectedStudent.payments.circui
                      }
                    ].map(({ key, label, paid }) => (
                      <div key={key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{label}</span>
                        <span className={paid ? 'badge-success' : 'badge-error'} style={{ padding: '0.25rem 0.75rem', borderRadius: 'var(--radius-full)', fontSize: '0.8rem', fontWeight: 600 }}>
                          {paid
                            ? (language === 'ar' ? 'مدفوع' : language === 'fr' ? 'Payé' : 'Paid')
                            : (language === 'ar' ? 'غير مدفوع' : language === 'fr' ? 'Non payé' : 'Unpaid')
                          }
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <Footer />

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

const ManagePayments = () => {
  return (
    <LanguageProvider>
      <ManagePaymentsContent />
    </LanguageProvider>
  );
};

export default ManagePayments;
