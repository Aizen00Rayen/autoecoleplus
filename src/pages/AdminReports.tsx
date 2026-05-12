import { useState, useEffect } from 'react';
import { LanguageProvider, useLanguage } from '../contexts/LanguageContext';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { supabase } from '../supabase';
import { BarChart3, Users, GraduationCap, Car, Calendar, DollarSign, CheckCircle, Clock, XCircle, ArrowLeft, Loader2, Download } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import '../components/style/theme.css';

const AdminReportsContent = () => {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalTeachers: 0,
    totalVehicles: 0,
    totalBookings: 0,
    pendingBookings: 0,
    approvedBookings: 0,
    rejectedBookings: 0,
    studentsByLicense: { A: 0, B: 0, C: 0, D: 0 },
    teachersByLicense: { A: 0, B: 0, C: 0, D: 0 },
    paymentsStats: {
      totalPaid: 0,
      totalUnpaid: 0,
      codePayments: 0,
      creneauPayments: 0,
      circuiPayments: 0
    }
  });

  useEffect(() => {
    fetchAllStats();
  }, []);

  const fetchAllStats = async () => {
    try {
      const { data: students = [] } = await supabase.from('users').select('*').eq('role', 'student');
      const { data: teachers = [] } = await supabase.from('users').select('*').eq('role', 'teacher');
      const { data: vehiclesData = [] } = await supabase.from('vehicles').select('id');
      const { data: bookings = [] } = await supabase.from('bookings').select('*');

      const studentsByLicense = { A: 0, B: 0, C: 0, D: 0 };
      students.forEach(student => {
        const licenseType = student.licenseType || 'B';
        if (licenseType in studentsByLicense) {
          studentsByLicense[licenseType as keyof typeof studentsByLicense]++;
        }
      });

      const teachersByLicense = { A: 0, B: 0, C: 0, D: 0 };
      teachers.forEach(teacher => {
        const licenseType = teacher.licenseType || 'B';
        if (licenseType in teachersByLicense) {
          teachersByLicense[licenseType as keyof typeof teachersByLicense]++;
        }
      });

      let totalPaid = 0;
      let totalUnpaid = 0;
      let codePayments = 0;
      let creneauPayments = 0;
      let circuiPayments = 0;

      students.forEach(student => {
        const payments = student.payments || { code: false, creneau: false, circui: false };
        if (payments.code) codePayments++;
        if (payments.creneau) creneauPayments++;
        if (payments.circui) circuiPayments++;

        const paidCount = (payments.code ? 1 : 0) + (payments.creneau ? 1 : 0) + (payments.circui ? 1 : 0);
        totalPaid += paidCount;
        totalUnpaid += (3 - paidCount);
      });

      setStats({
        totalStudents: students.length,
        totalTeachers: teachers.length,
        totalVehicles: vehiclesData.length,
        totalBookings: bookings.length,
        pendingBookings: bookings.filter(b => b.status === 'pending').length,
        approvedBookings: bookings.filter(b => b.status === 'approved').length,
        rejectedBookings: bookings.filter(b => b.status === 'rejected').length,
        studentsByLicense,
        teachersByLicense,
        paymentsStats: {
          totalPaid,
          totalUnpaid,
          codePayments,
          creneauPayments,
          circuiPayments
        }
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportReport = () => {
    const reportData = `
تقرير إحصائيات مدرسة تعليم السياقة
=====================================

إحصائيات عامة:
- إجمالي الطلاب: ${stats.totalStudents}
- إجمالي المعلمين: ${stats.totalTeachers}
- إجمالي المركبات: ${stats.totalVehicles}
- إجمالي الحجوزات: ${stats.totalBookings}

الطلاب حسب نوع الرخصة:
- رخصة A: ${stats.studentsByLicense.A}
- رخصة B: ${stats.studentsByLicense.B}
- رخصة C: ${stats.studentsByLicense.C}
- رخصة D: ${stats.studentsByLicense.D}

المعلمين حسب نوع الرخصة:
- رخصة A: ${stats.teachersByLicense.A}
- رخصة B: ${stats.teachersByLicense.B}
- رخصة C: ${stats.teachersByLicense.C}
- رخصة D: ${stats.teachersByLicense.D}

إحصائيات الحجوزات:
- قيد الانتظار: ${stats.pendingBookings}
- مقبولة: ${stats.approvedBookings}
- مرفوضة: ${stats.rejectedBookings}

إحصائيات المدفوعات:
- إجمالي المدفوعات: ${stats.paymentsStats.totalPaid}
- إجمالي غير المدفوع: ${stats.paymentsStats.totalUnpaid}
- مدفوعات الكود: ${stats.paymentsStats.codePayments}
- مدفوعات الكرينو: ${stats.paymentsStats.creneauPayments}
- مدفوعات السيركوي: ${stats.paymentsStats.circuiPayments}

تاريخ التقرير: ${new Date().toLocaleString('ar-DZ')}
    `;

    const blob = new Blob([reportData], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `report-${new Date().toISOString().split('T')[0]}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Dark gold stat card
  const StatCard = ({ icon: Icon, title, value, accentColor, subtitle }: any) => (
    <div style={{
      background: 'var(--grad-card)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-lg)',
      padding: '1.5rem',
      transition: 'border-color 0.2s, box-shadow 0.2s'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <div style={{
          width: '3.5rem',
          height: '3.5rem',
          borderRadius: '0.75rem',
          background: `${accentColor}18`,
          border: `1px solid ${accentColor}40`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0
        }}>
          <Icon style={{ width: '1.75rem', height: '1.75rem', color: accentColor }} />
        </div>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
            {title}
          </p>
          <p style={{ fontSize: '2rem', fontWeight: 700, color: accentColor, marginBottom: '0.25rem', lineHeight: 1.1 }}>
            {value}
          </p>
          {subtitle && (
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              {subtitle}
            </p>
          )}
        </div>
      </div>
    </div>
  );

  const BarChart = ({ data, title, accentColor }: any) => {
    const maxValue = Math.max(...Object.values(data).map(v => v as number), 1);

    return (
      <div style={{
        background: 'var(--grad-card)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        padding: '1.5rem'
      }}>
        <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1.25rem' }}>
          {title}
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {Object.entries(data).map(([key, value]) => (
            <div key={key}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                  {language === 'ar' ? 'رخصة' : language === 'fr' ? 'Permis' : 'License'} {key}
                </span>
                <span style={{ fontSize: '0.875rem', fontWeight: 700, color: accentColor }}>
                  {value as number}
                </span>
              </div>
              <div style={{
                width: '100%',
                height: '0.625rem',
                background: 'rgba(255,255,255,0.06)',
                borderRadius: 'var(--radius-full)',
                overflow: 'hidden'
              }}>
                <div style={{
                  width: `${((value as number) / maxValue) * 100}%`,
                  height: '100%',
                  background: accentColor,
                  borderRadius: 'var(--radius-full)',
                  transition: 'width 0.5s ease',
                  boxShadow: `0 0 8px ${accentColor}60`
                }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
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
                  <BarChart3 style={{ width: '2rem', height: '2rem', color: 'var(--primary)' }} />
                  {language === 'ar' ? 'التقارير والإحصائيات' : language === 'fr' ? 'Rapports et Statistiques' : 'Reports & Statistics'}
                </h1>
                <p style={{ color: 'var(--text-secondary)', fontSize: '1rem' }}>
                  {language === 'ar' ? 'نظرة شاملة على أداء المدرسة' : language === 'fr' ? 'Vue d\'ensemble des performances de l\'école' : 'Comprehensive overview of school performance'}
                </p>
              </div>
              <button
                className="btn-primary"
                onClick={exportReport}
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
              >
                <Download style={{ width: '1rem', height: '1rem' }} />
                {language === 'ar' ? 'تصدير التقرير' : language === 'fr' ? 'Exporter' : 'Export Report'}
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem' }}>
            <Loader2 className="w-8 h-8 animate-spin" style={{ margin: '0 auto', color: 'var(--primary)' }} />
          </div>
        ) : (
          <>
            {/* Main Stats */}
            <div style={{ marginBottom: '2.5rem' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1rem' }}>
                {language === 'ar' ? 'الإحصائيات العامة' : language === 'fr' ? 'Statistiques Générales' : 'General Statistics'}
              </h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
                <StatCard
                  icon={Users}
                  title={language === 'ar' ? 'إجمالي الطلاب' : language === 'fr' ? 'Total Étudiants' : 'Total Students'}
                  value={stats.totalStudents}
                  accentColor="#F5A623"
                  subtitle={language === 'ar' ? 'طلاب مسجلين' : language === 'fr' ? 'étudiants inscrits' : 'registered students'}
                />
                <StatCard
                  icon={GraduationCap}
                  title={language === 'ar' ? 'إجمالي المعلمين' : language === 'fr' ? 'Total Moniteurs' : 'Total Instructors'}
                  value={stats.totalTeachers}
                  accentColor="#FF6B35"
                  subtitle={language === 'ar' ? 'معلمين نشطين' : language === 'fr' ? 'moniteurs actifs' : 'active instructors'}
                />
                <StatCard
                  icon={Car}
                  title={language === 'ar' ? 'إجمالي المركبات' : language === 'fr' ? 'Total Véhicules' : 'Total Vehicles'}
                  value={stats.totalVehicles}
                  accentColor="#F5A623"
                  subtitle={language === 'ar' ? 'مركبات متاحة' : language === 'fr' ? 'véhicules disponibles' : 'available vehicles'}
                />
                <StatCard
                  icon={Calendar}
                  title={language === 'ar' ? 'إجمالي الحجوزات' : language === 'fr' ? 'Total Réservations' : 'Total Bookings'}
                  value={stats.totalBookings}
                  accentColor="#FF6B35"
                  subtitle={language === 'ar' ? 'حجوزات كلية' : language === 'fr' ? 'réservations totales' : 'total bookings'}
                />
              </div>
            </div>

            {/* Bookings Stats */}
            <div style={{ marginBottom: '2.5rem' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1rem' }}>
                {language === 'ar' ? 'إحصائيات الحجوزات' : language === 'fr' ? 'Statistiques Réservations' : 'Bookings Statistics'}
              </h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
                <StatCard
                  icon={Clock}
                  title={language === 'ar' ? 'قيد الانتظار' : language === 'fr' ? 'En Attente' : 'Pending'}
                  value={stats.pendingBookings}
                  accentColor="#EAB308"
                />
                <StatCard
                  icon={CheckCircle}
                  title={language === 'ar' ? 'مقبولة' : language === 'fr' ? 'Approuvées' : 'Approved'}
                  value={stats.approvedBookings}
                  accentColor="#22C55E"
                />
                <StatCard
                  icon={XCircle}
                  title={language === 'ar' ? 'مرفوضة' : language === 'fr' ? 'Rejetées' : 'Rejected'}
                  value={stats.rejectedBookings}
                  accentColor="#EF4444"
                />
              </div>
            </div>

            {/* License Distribution */}
            <div style={{ marginBottom: '2.5rem' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1rem' }}>
                {language === 'ar' ? 'توزيع الرخص' : language === 'fr' ? 'Distribution des Permis' : 'License Distribution'}
              </h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.5rem' }}>
                <BarChart
                  data={stats.studentsByLicense}
                  title={language === 'ar' ? 'الطلاب حسب نوع الرخصة' : language === 'fr' ? 'Étudiants par Type de Permis' : 'Students by License Type'}
                  accentColor="#F5A623"
                />
                <BarChart
                  data={stats.teachersByLicense}
                  title={language === 'ar' ? 'المعلمين حسب نوع الرخصة' : language === 'fr' ? 'Moniteurs par Type de Permis' : 'Instructors by License Type'}
                  accentColor="#FF6B35"
                />
              </div>
            </div>

            {/* Payments Stats */}
            <div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1rem' }}>
                {language === 'ar' ? 'إحصائيات المدفوعات' : language === 'fr' ? 'Statistiques Paiements' : 'Payments Statistics'}
              </h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                <StatCard
                  icon={DollarSign}
                  title={language === 'ar' ? 'إجمالي المدفوع' : language === 'fr' ? 'Total Payé' : 'Total Paid'}
                  value={stats.paymentsStats.totalPaid}
                  accentColor="#22C55E"
                />
                <StatCard
                  icon={DollarSign}
                  title={language === 'ar' ? 'إجمالي غير المدفوع' : language === 'fr' ? 'Total Non Payé' : 'Total Unpaid'}
                  value={stats.paymentsStats.totalUnpaid}
                  accentColor="#EF4444"
                />
                <StatCard
                  icon={CheckCircle}
                  title={language === 'ar' ? 'مدفوعات الكود' : language === 'fr' ? 'Paiements Code' : 'Code Payments'}
                  value={stats.paymentsStats.codePayments}
                  accentColor="#F5A623"
                />
                <StatCard
                  icon={CheckCircle}
                  title={language === 'ar' ? 'مدفوعات الكرينو' : language === 'fr' ? 'Paiements Créneau' : 'Creneau Payments'}
                  value={stats.paymentsStats.creneauPayments}
                  accentColor="#FF6B35"
                />
                <StatCard
                  icon={CheckCircle}
                  title={language === 'ar' ? 'مدفوعات السيركوي' : language === 'fr' ? 'Paiements Circui' : 'Circui Payments'}
                  value={stats.paymentsStats.circuiPayments}
                  accentColor="#F5A623"
                />
              </div>
            </div>
          </>
        )}
      </main>

      <Footer />
    </div>
  );
};

const AdminReports = () => {
  return (
    <LanguageProvider>
      <AdminReportsContent />
    </LanguageProvider>
  );
};

export default AdminReports;
