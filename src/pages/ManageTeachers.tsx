import { useState, useEffect } from 'react';
import { LanguageProvider, useLanguage } from '../contexts/LanguageContext';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import WorkDaysSelector from '../components/WorkDaysSelector';
import type { WorkDays } from '../utils/scheduleGenerator';
import { getDefaultWorkDays } from '../utils/scheduleGenerator';
import { supabase, BACKEND_URL, adminFetch } from '../supabase';
import { User, Plus, Edit, Trash2, Mail, Phone, Calendar, Check, X, ArrowLeft, Bike, Car, Truck, ChevronDown, ChevronUp, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import '../components/style/theme.css';

interface Teacher {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  licenseType: string;
  workDays?: WorkDays;
  createdAt: string;
  photoURL?: string;
}

const ManageTeachersContent = () => {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showInfoDialogId, setShowInfoDialogId] = useState<string | null>(null);
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const [teacherStudents, setTeacherStudents] = useState<{[teacherId: string]: {id: string, fullName: string, photoURL?: string}[]}>({});
  const [expandedTeacher, setExpandedTeacher] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    phone: '',
    licenseType: ''
  });
  const [workDays, setWorkDays] = useState<WorkDays>(getDefaultWorkDays());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchTeachers();
  }, []);

  const fetchTeachers = async () => {
    try {
      const { data, error } = await supabase.from('users').select('*').eq('role', 'teacher');
      if (error) throw error;
      const teachersList: Teacher[] = (data || []).map((d: any) => ({
        id: d.id,
        fullName: d.fullName,
        email: d.email,
        phone: d.phone,
        licenseType: d.licenseType || '',
        workDays: d.workDays || getDefaultWorkDays(),
        createdAt: d.createdAt,
        photoURL: d.photoURL
      }));

      setTeachers(teachersList);
      await fetchTeacherStudents(teachersList);
    } catch (error) {
      console.error('Error fetching teachers:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTeacherStudents = async (teachersList: Teacher[]) => {
    try {
      const { data: bookings } = await supabase.from('bookings').select('*').eq('status', 'approved');
      const { data: users } = await supabase.from('users').select('id, fullName, photoURL, profileImage');
      const usersMap: {[id: string]: {fullName: string, photoURL?: string}} = {};
      (users || []).forEach((d: any) => { usersMap[d.id] = { fullName: d.fullName, photoURL: d.photoURL || d.profileImage }; });

      const map: {[teacherId: string]: {id: string, fullName: string, photoURL?: string}[]} = {};
      teachersList.forEach(t => { map[t.id] = []; });

      (bookings || []).forEach((b: any) => {
        if (map[b.teacherId] !== undefined) {
          const already = map[b.teacherId].find(s => s.id === b.studentId);
          if (!already) {
            map[b.teacherId].push({ id: b.studentId, fullName: b.studentName, photoURL: usersMap[b.studentId]?.photoURL });
          }
        }
      });

      setTeacherStudents(map);
    } catch (e) {
      console.error('Error fetching teacher students:', e);
    }
  };

  const handleAddTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage('');
    setError('');

    try {
      const response = await fetch(`${BACKEND_URL}/admin/create-user`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          userData: {
            fullName: formData.fullName,
            email: formData.email,
            phone: formData.phone,
            licenseType: formData.licenseType,
            workDays: workDays,
            role: 'teacher',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        })
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || errData.message || 'Error creating teacher');
      }

      setMessage(
        language === 'ar'
          ? 'تم إضافة المعلم بنجاح!'
          : language === 'fr'
          ? 'Enseignant ajouté avec succès!'
          : 'Teacher added successfully!'
      );

      setFormData({ fullName: '', email: '', password: '', phone: '', licenseType: '' });
      setWorkDays(getDefaultWorkDays());
      setShowAddDialog(false);
      fetchTeachers();

    } catch (error: any) {
      setError(error.message || (language === 'ar' ? 'حدث خطأ أثناء الإضافة' : language === 'fr' ? 'Erreur lors de l\'ajout' : 'Error adding teacher'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTeacher) return;

    setIsSubmitting(true);
    setMessage('');
    setError('');

    try {
      await supabase.from('users').update({
        fullName: formData.fullName,
        phone: formData.phone,
        licenseType: formData.licenseType,
        workDays: workDays,
        updatedAt: new Date().toISOString()
      }).eq('id', selectedTeacher.id);

      setMessage(
        language === 'ar'
          ? 'تم تحديث بيانات المعلم بنجاح!'
          : language === 'fr'
          ? 'Données de l\'enseignant mises à jour!'
          : 'Teacher data updated successfully!'
      );

      setShowEditDialog(false);
      setSelectedTeacher(null);
      setFormData({ fullName: '', email: '', password: '', phone: '', licenseType: '' });
      setWorkDays(getDefaultWorkDays());
      fetchTeachers();

    } catch (error) {
      setError(
        language === 'ar'
          ? 'حدث خطأ أثناء التحديث'
          : language === 'fr'
          ? 'Erreur lors de la mise à jour'
          : 'Error updating teacher'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteTeacher = async (teacherId: string, teacherName: string) => {
    const confirmMessage = language === 'ar'
      ? `هل أنت متأكد من حذف المعلم "${teacherName}"؟`
      : language === 'fr'
      ? `Êtes-vous sûr de supprimer l'enseignant "${teacherName}"?`
      : `Are you sure you want to delete teacher "${teacherName}"?`;

    if (!window.confirm(confirmMessage)) return;

    try {
      const response = await adminFetch(`/admin/delete-user/${teacherId}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Delete failed');

      setMessage(
        language === 'ar'
          ? 'تم حذف المعلم بنجاح!'
          : language === 'fr'
          ? 'Enseignant supprimé avec succès!'
          : 'Teacher deleted successfully!'
      );

      fetchTeachers();
    } catch (error) {
      setError(
        language === 'ar'
          ? 'حدث خطأ أثناء الحذف'
          : language === 'fr'
          ? 'Erreur lors de la suppression'
          : 'Error deleting teacher'
      );
    }
  };

  const openEditDialog = (teacher: Teacher) => {
    setSelectedTeacher(teacher);
    setFormData({
      fullName: teacher.fullName,
      email: teacher.email,
      password: '',
      phone: teacher.phone,
      licenseType: teacher.licenseType
    });
    setWorkDays(teacher.workDays || getDefaultWorkDays());
    setShowEditDialog(true);
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: '0.8125rem',
    fontWeight: 600,
    color: 'var(--text-secondary)',
    marginBottom: '6px',
    letterSpacing: '0.04em',
    textTransform: 'uppercase'
  };

  const infoCardStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    padding: '1rem',
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid var(--border)',
    borderRadius: '12px'
  };

  const iconBoxStyle: React.CSSProperties = {
    width: '2.5rem',
    height: '2.5rem',
    borderRadius: '10px',
    background: 'rgba(245,166,35,0.15)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0
  };

  const LicenseButtons = ({ editing }: { editing?: boolean }) => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
      {[
        { value: 'A', icon: Bike, label: language === 'ar' ? 'دراجة نارية' : language === 'fr' ? 'Moto' : 'Motorcycle' },
        { value: 'B', icon: Car, label: language === 'ar' ? 'سيارة' : language === 'fr' ? 'Voiture' : 'Car' },
        { value: 'C', icon: Truck, label: language === 'ar' ? 'شاحنة' : language === 'fr' ? 'Camion' : 'Truck' }
      ].map((license) => {
        const Icon = license.icon;
        const isSelected = formData.licenseType === license.value;
        return (
          <button
            key={license.value}
            type="button"
            onClick={() => setFormData({ ...formData, licenseType: license.value })}
            style={{
              padding: '0.75rem',
              borderRadius: '0.5rem',
              border: isSelected ? '2px solid var(--primary)' : '2px solid rgba(255,255,255,0.08)',
              background: isSelected ? 'rgba(245,166,35,0.15)' : 'var(--bg-dark)',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '0.4rem'
            }}
          >
            <Icon style={{ width: '1.25rem', height: '1.25rem', color: isSelected ? 'var(--primary)' : 'var(--text-muted)' }} />
            <div style={{ fontSize: '0.875rem', fontWeight: 600, color: isSelected ? 'var(--primary)' : 'var(--text-secondary)' }}>
              {license.value}
            </div>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', lineHeight: 1.2 }}>
              {license.label}
            </div>
          </button>
        );
      })}
    </div>
  );

  const q = searchQuery.trim().toLowerCase();
  const filtered = q
    ? teachers.filter(t =>
        t.fullName?.toLowerCase().includes(q) ||
        t.email?.toLowerCase().includes(q) ||
        t.phone?.toLowerCase().includes(q)
      )
    : teachers;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-darkest)', color: 'var(--text-primary)' }}>
      <Navbar />

      <main style={{ padding: '6rem 1.5rem 3rem', maxWidth: '1400px', margin: '0 auto' }}>

        {/* Page Header */}
        <div style={{ marginBottom: '2rem' }}>
          {/* Breadcrumb / Back */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <button
              onClick={() => navigate('/admin-dashboard')}
              className="btn-ghost"
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}
            >
              <ArrowLeft style={{ width: '1rem', height: '1rem' }} />
              {language === 'ar' ? 'لوحة التحكم' : language === 'fr' ? 'Tableau de bord' : 'Dashboard'}
            </button>
            <span style={{ color: 'var(--text-muted)' }}>/</span>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
              {language === 'ar' ? 'إدارة المعلمين' : language === 'fr' ? 'Enseignants' : 'Teachers'}
            </span>
          </div>

          {/* Title row */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h1 style={{
                fontSize: '2rem',
                fontWeight: 700,
                background: 'var(--grad-gold)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                margin: 0
              }}>
                {language === 'ar' ? 'إدارة المعلمين' : language === 'fr' ? 'Gérer les Enseignants' : 'Manage Teachers'}
              </h1>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
                {language === 'ar' ? 'إضافة وتعديل وحذف حسابات المعلمين' : language === 'fr' ? 'Ajouter, modifier et supprimer les comptes enseignants' : 'Add, edit and delete teacher accounts'}
              </p>
            </div>
            <button
              className="btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
              onClick={() => setShowAddDialog(true)}
            >
              <Plus style={{ width: '1rem', height: '1rem' }} />
              {language === 'ar' ? 'إضافة معلم جديد' : language === 'fr' ? 'Ajouter Enseignant' : 'Add New Teacher'}
            </button>
          </div>
        </div>

        {/* Messages */}
        {message && (
          <div style={{ padding: '0.875rem 1.25rem', background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: '0.75rem', color: '#4ade80', display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem', fontWeight: 500 }}>
            <Check style={{ width: '1rem', height: '1rem', flexShrink: 0 }} />
            {message}
          </div>
        )}
        {error && (
          <div style={{ padding: '0.875rem 1.25rem', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '0.75rem', color: '#f87171', display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem', fontWeight: 500 }}>
            <X style={{ width: '1rem', height: '1rem', flexShrink: 0 }} />
            {error}
          </div>
        )}

        {/* Search Bar */}
        {!loading && teachers.length > 0 && (
          <div style={{ position: 'relative', marginBottom: '1.5rem' }}>
            <Search style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', width: '1rem', height: '1rem', color: 'var(--text-muted)', pointerEvents: 'none' }} />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="input-pro"
              placeholder={language === 'ar' ? 'بحث بالاسم أو الإيميل أو الهاتف...' : language === 'fr' ? 'Rechercher par nom, email ou téléphone...' : 'Search by name, email or phone...'}
              style={{ width: '100%', paddingLeft: '2.75rem', boxSizing: 'border-box' }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 0 }}
              >
                <X style={{ width: '1rem', height: '1rem' }} />
              </button>
            )}
          </div>
        )}

        {/* Teachers List */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '4rem' }}>
            <div style={{ width: '24px', height: '24px', border: '3px solid rgba(245,166,35,0.2)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', display: 'inline-block' }} />
          </div>
        ) : filtered.length === 0 ? (
          <div className="glass-card" style={{ padding: '4rem 2rem', textAlign: 'center' }}>
            <User style={{ width: '3rem', height: '3rem', color: 'var(--text-muted)', margin: '0 auto 1rem' }} />
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
              {searchQuery
                ? (language === 'ar' ? 'لا توجد نتائج' : language === 'fr' ? 'Aucun résultat' : 'No results found')
                : (language === 'ar' ? 'لا يوجد معلمين حالياً' : language === 'fr' ? 'Aucun enseignant pour le moment' : 'No teachers yet')}
            </h3>
            {!searchQuery && (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                {language === 'ar' ? 'ابدأ بإضافة معلم جديد' : language === 'fr' ? 'Commencez par ajouter un nouvel enseignant' : 'Start by adding a new teacher'}
              </p>
            )}
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '1.5rem' }}>
            {filtered.map((teacher) => (
              <div
                key={teacher.id}
                style={{
                  background: 'var(--grad-card)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-lg)',
                  overflow: 'hidden',
                  position: 'relative',
                  transition: 'border-color 0.2s ease'
                }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--border-gold)')}
                onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}
              >
                {/* Gold top accent */}
                <div style={{ height: '3px', background: 'var(--grad-gold)' }} />

                <div style={{ padding: '1.25rem' }}>
                  {/* Header row */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                    <div style={{
                      width: '3rem',
                      height: '3rem',
                      borderRadius: '0.75rem',
                      background: teacher.photoURL ? 'transparent' : 'rgba(245,166,35,0.15)',
                      border: '1px solid var(--border-gold)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      overflow: 'hidden',
                      flexShrink: 0
                    }}>
                      {teacher.photoURL
                        ? <img src={teacher.photoURL} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        : <User style={{ width: '1.5rem', height: '1.5rem', color: 'var(--primary)' }} />
                      }
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)', marginBottom: '0.25rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {teacher.fullName}
                      </div>
                      <span className="badge-gold" style={{ fontSize: '0.7rem' }}>
                        {language === 'ar' ? 'معلم' : language === 'fr' ? 'Enseignant' : 'Teacher'}
                      </span>
                    </div>
                  </div>

                  {/* Info rows */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      <Mail style={{ width: '0.85rem', height: '0.85rem', color: 'var(--primary)', flexShrink: 0 }} />
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', direction: 'ltr' }}>
                        {teacher.email}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      <Phone style={{ width: '0.85rem', height: '0.85rem', color: 'var(--primary)', flexShrink: 0 }} />
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', direction: 'ltr' }}>
                        {teacher.phone}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      <Calendar style={{ width: '0.85rem', height: '0.85rem', color: 'var(--primary)', flexShrink: 0 }} />
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        {new Date(teacher.createdAt).toLocaleDateString(language === 'ar' ? 'ar-DZ' : language === 'fr' ? 'fr-FR' : 'en-US')}
                      </span>
                    </div>
                    {teacher.licenseType && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        {teacher.licenseType === 'A'
                          ? <Bike style={{ width: '0.85rem', height: '0.85rem', color: 'var(--primary)', flexShrink: 0 }} />
                          : teacher.licenseType === 'B'
                          ? <Car style={{ width: '0.85rem', height: '0.85rem', color: 'var(--primary)', flexShrink: 0 }} />
                          : <Truck style={{ width: '0.85rem', height: '0.85rem', color: 'var(--primary)', flexShrink: 0 }} />
                        }
                        <span className="badge-gold" style={{ fontSize: '0.72rem' }}>
                          {language === 'ar' ? 'رخصة' : language === 'fr' ? 'Permis' : 'License'} {teacher.licenseType}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Students accordion */}
                  {teacherStudents[teacher.id] !== undefined && (
                    <div style={{ marginBottom: '0.75rem' }}>
                      <button
                        type="button"
                        onClick={() => setExpandedTeacher(expandedTeacher === teacher.id ? null : teacher.id)}
                        style={{
                          width: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '0.5rem 0.75rem',
                          background: 'rgba(245,166,35,0.08)',
                          border: '1px solid var(--border-gold)',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          fontSize: '0.8rem',
                          fontWeight: 600,
                          color: 'var(--primary)'
                        }}
                      >
                        <span>
                          {language === 'ar' ? 'التلاميذ' : language === 'fr' ? 'Élèves' : 'Students'} ({teacherStudents[teacher.id]?.length || 0})
                        </span>
                        {expandedTeacher === teacher.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </button>
                      {expandedTeacher === teacher.id && (
                        <div style={{ marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.4rem', maxHeight: '180px', overflowY: 'auto' }}>
                          {teacherStudents[teacher.id]?.length === 0 ? (
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center', padding: '0.5rem' }}>
                              {language === 'ar' ? 'لا يوجد تلاميذ بعد' : language === 'fr' ? 'Aucun élève' : 'No students yet'}
                            </p>
                          ) : teacherStudents[teacher.id]?.map(s => (
                            <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.4rem 0.5rem', background: 'var(--bg-dark)', borderRadius: '6px', border: '1px solid var(--border)' }}>
                              <div style={{ width: '1.75rem', height: '1.75rem', borderRadius: '50%', overflow: 'hidden', flexShrink: 0, background: 'rgba(245,166,35,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                {s.photoURL
                                  ? <img src={s.photoURL} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                  : <User size={10} style={{ color: 'var(--primary)' }} />
                                }
                              </div>
                              <span style={{ fontSize: '0.8rem', color: 'var(--text-primary)', fontWeight: 500 }}>{s.fullName}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Actions */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        className="btn-outline"
                        style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem', padding: '0.5rem', fontSize: '0.8rem' }}
                        onClick={() => openEditDialog(teacher)}
                      >
                        <Edit style={{ width: '0.75rem', height: '0.75rem' }} />
                        {language === 'ar' ? 'تعديل' : language === 'fr' ? 'Modifier' : 'Edit'}
                      </button>
                      <button
                        className="btn-ghost"
                        style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem', padding: '0.5rem', fontSize: '0.8rem', color: 'var(--primary)', border: '1px solid var(--border-gold)' }}
                        onClick={() => setShowInfoDialogId(teacher.id)}
                      >
                        <User style={{ width: '0.75rem', height: '0.75rem' }} />
                        {language === 'ar' ? 'معلومات' : language === 'fr' ? 'Infos' : 'Info'}
                      </button>
                    </div>
                    <button
                      style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.5rem', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#FCA5A5', borderRadius: 'var(--radius-full)', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}
                      onClick={() => handleDeleteTeacher(teacher.id, teacher.fullName)}
                    >
                      <Trash2 style={{ width: '0.75rem', height: '0.75rem' }} />
                      {language === 'ar' ? 'حذف' : language === 'fr' ? 'Supprimer' : 'Delete'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add Teacher Modal */}
        {showAddDialog && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-gold)', borderRadius: 'var(--radius-lg)', padding: '2rem', width: '100%', maxWidth: '520px', maxHeight: '90vh', overflowY: 'auto', position: 'relative' }}>
              {/* Modal header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ width: '2.5rem', height: '2.5rem', borderRadius: '10px', background: 'rgba(245,166,35,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Plus style={{ width: '1.25rem', height: '1.25rem', color: 'var(--primary)' }} />
                  </div>
                  <div>
                    <h2 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                      {language === 'ar' ? 'إضافة معلم جديد' : language === 'fr' ? 'Ajouter un enseignant' : 'Add New Teacher'}
                    </h2>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
                      {language === 'ar' ? 'أدخل بيانات المعلم الجديد' : language === 'fr' ? 'Entrez les informations du nouvel enseignant' : 'Enter the new teacher information'}
                    </p>
                  </div>
                </div>
                <button onClick={() => setShowAddDialog(false)} className="btn-ghost" style={{ padding: '0.35rem', width: '2rem', height: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <X style={{ width: '1rem', height: '1rem' }} />
                </button>
              </div>

              <form onSubmit={handleAddTeacher} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={labelStyle}>
                    {language === 'ar' ? 'الاسم الكامل' : language === 'fr' ? 'Nom complet' : 'Full Name'}
                  </label>
                  <input
                    className="input-pro"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    required
                    placeholder={language === 'ar' ? 'أدخل الاسم الكامل' : language === 'fr' ? 'Nom complet' : 'Enter full name'}
                    style={{ width: '100%' }}
                  />
                </div>

                <div>
                  <label style={labelStyle}>Email</label>
                  <input
                    className="input-pro"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                    placeholder="teacher@example.com"
                    dir="ltr"
                    style={{ width: '100%' }}
                  />
                </div>

                <div>
                  <label style={labelStyle}>
                    {language === 'ar' ? 'كلمة المرور' : language === 'fr' ? 'Mot de passe' : 'Password'}
                  </label>
                  <input
                    className="input-pro"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                    placeholder="••••••••"
                    dir="ltr"
                    style={{ width: '100%' }}
                  />
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                    {language === 'ar' ? 'يجب أن تكون 6 أحرف على الأقل' : language === 'fr' ? 'Minimum 6 caractères' : 'Minimum 6 characters'}
                  </p>
                </div>

                <div>
                  <label style={labelStyle}>
                    {language === 'ar' ? 'رقم الهاتف' : language === 'fr' ? 'Téléphone' : 'Phone'}
                  </label>
                  <input
                    className="input-pro"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    required
                    placeholder="+213 555 123 456"
                    dir="ltr"
                    style={{ width: '100%' }}
                  />
                </div>

                <div>
                  <label style={labelStyle}>
                    {language === 'ar' ? 'نوع الرخصة' : language === 'fr' ? 'Type de permis' : 'License Type'}
                  </label>
                  <input type="text" value={formData.licenseType} onChange={() => {}} required style={{ position: 'absolute', opacity: 0, pointerEvents: 'none', height: 0, width: 0 }} tabIndex={-1} />
                  <LicenseButtons />
                  {!formData.licenseType && (
                    <p style={{ fontSize: '0.75rem', color: '#f87171', marginTop: '0.25rem' }}>
                      {language === 'ar' ? 'الرجاء اختيار نوع الرخصة' : language === 'fr' ? 'Veuillez choisir le type' : 'Please choose a type'}
                    </p>
                  )}
                </div>

                <div>
                  <WorkDaysSelector workDays={workDays} onChange={setWorkDays} language={language} />
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', paddingTop: '0.75rem', borderTop: '1px solid var(--border)' }}>
                  <button type="button" className="btn-ghost" onClick={() => setShowAddDialog(false)}>
                    {language === 'ar' ? 'إلغاء' : language === 'fr' ? 'Annuler' : 'Cancel'}
                  </button>
                  <button type="submit" className="btn-primary" disabled={isSubmitting}>
                    {isSubmitting ? (language === 'ar' ? 'جاري الإضافة...' : language === 'fr' ? 'Ajout...' : 'Adding...') : (language === 'ar' ? 'إضافة' : language === 'fr' ? 'Ajouter' : 'Add')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Teacher Modal */}
        {showEditDialog && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-gold)', borderRadius: 'var(--radius-lg)', padding: '2rem', width: '100%', maxWidth: '520px', maxHeight: '90vh', overflowY: 'auto', position: 'relative' }}>
              {/* Modal header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ width: '2.5rem', height: '2.5rem', borderRadius: '10px', background: 'rgba(245,166,35,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Edit style={{ width: '1.25rem', height: '1.25rem', color: 'var(--primary)' }} />
                  </div>
                  <div>
                    <h2 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                      {language === 'ar' ? 'تعديل بيانات المعلم' : language === 'fr' ? 'Modifier l\'enseignant' : 'Edit Teacher'}
                    </h2>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
                      {language === 'ar' ? 'قم بتحديث المعلومات المطلوبة' : language === 'fr' ? 'Mettez à jour les informations requises' : 'Update the required information'}
                    </p>
                  </div>
                </div>
                <button onClick={() => setShowEditDialog(false)} className="btn-ghost" style={{ padding: '0.35rem', width: '2rem', height: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <X style={{ width: '1rem', height: '1rem' }} />
                </button>
              </div>

              <form onSubmit={handleEditTeacher} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={labelStyle}>
                    {language === 'ar' ? 'الاسم الكامل' : language === 'fr' ? 'Nom complet' : 'Full Name'}
                  </label>
                  <input
                    className="input-pro"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    required
                    style={{ width: '100%' }}
                  />
                </div>

                <div>
                  <label style={labelStyle}>Email</label>
                  <input
                    className="input-pro"
                    type="email"
                    value={formData.email}
                    disabled
                    dir="ltr"
                    style={{ width: '100%', opacity: 0.5, cursor: 'not-allowed' }}
                  />
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                    {language === 'ar' ? 'لا يمكن تعديل البريد الإلكتروني' : language === 'fr' ? 'L\'email ne peut pas être modifié' : 'Email cannot be modified'}
                  </p>
                </div>

                <div>
                  <label style={labelStyle}>
                    {language === 'ar' ? 'رقم الهاتف' : language === 'fr' ? 'Téléphone' : 'Phone'}
                  </label>
                  <input
                    className="input-pro"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    required
                    dir="ltr"
                    style={{ width: '100%' }}
                  />
                </div>

                <div>
                  <label style={labelStyle}>
                    {language === 'ar' ? 'نوع الرخصة' : language === 'fr' ? 'Type de permis' : 'License Type'}
                  </label>
                  <input type="text" value={formData.licenseType} onChange={() => {}} required style={{ position: 'absolute', opacity: 0, pointerEvents: 'none', height: 0, width: 0 }} tabIndex={-1} />
                  <LicenseButtons editing />
                  {!formData.licenseType && (
                    <p style={{ fontSize: '0.75rem', color: '#f87171', marginTop: '0.25rem' }}>
                      {language === 'ar' ? 'الرجاء اختيار نوع الرخصة' : language === 'fr' ? 'Veuillez choisir le type' : 'Please choose a type'}
                    </p>
                  )}
                </div>

                <div>
                  <WorkDaysSelector workDays={workDays} onChange={setWorkDays} language={language} />
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', paddingTop: '0.75rem', borderTop: '1px solid var(--border)' }}>
                  <button type="button" className="btn-ghost" onClick={() => setShowEditDialog(false)}>
                    {language === 'ar' ? 'إلغاء' : language === 'fr' ? 'Annuler' : 'Cancel'}
                  </button>
                  <button type="submit" className="btn-primary" disabled={isSubmitting}>
                    {isSubmitting ? (language === 'ar' ? 'جاري التحديث...' : language === 'fr' ? 'Mise à jour...' : 'Updating...') : (language === 'ar' ? 'تحديث' : language === 'fr' ? 'Mettre à jour' : 'Update')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Teacher Info Modal */}
        {showInfoDialogId && (() => {
          const teacher = teachers.find(t => t.id === showInfoDialogId);
          if (!teacher) return null;
          return (
            <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
              <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-gold)', borderRadius: 'var(--radius-lg)', padding: '2rem', width: '100%', maxWidth: '560px', maxHeight: '90vh', overflowY: 'auto', position: 'relative' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 700, background: 'var(--grad-gold)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', margin: 0 }}>
                    {language === 'ar' ? 'معلومات المعلم' : language === 'fr' ? 'Informations de l\'enseignant' : 'Teacher Information'}
                  </h2>
                  <button onClick={() => setShowInfoDialogId(null)} className="btn-ghost" style={{ padding: '0.35rem', width: '2rem', height: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <X style={{ width: '1rem', height: '1rem' }} />
                  </button>
                </div>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
                  {language === 'ar' ? 'المعلومات الشخصية والمهنية للمعلم' : language === 'fr' ? 'Informations personnelles et professionnelles de l\'enseignant' : 'Personal and professional information of the teacher'}
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.75rem' }}>
                  {[
                    { Icon: User, label: language === 'ar' ? 'الاسم الكامل' : language === 'fr' ? 'Nom complet' : 'Full Name', value: teacher.fullName },
                    { Icon: Mail, label: 'Email', value: teacher.email, ltr: true },
                    { Icon: Phone, label: language === 'ar' ? 'رقم الهاتف' : language === 'fr' ? 'Téléphone' : 'Phone', value: teacher.phone, ltr: true },
                    { Icon: User, label: language === 'ar' ? 'الدور' : language === 'fr' ? 'Rôle' : 'Role', value: language === 'ar' ? 'معلم' : language === 'fr' ? 'Enseignant' : 'Teacher' },
                    { Icon: Calendar, label: language === 'ar' ? 'تاريخ الانضمام' : language === 'fr' ? 'Date d\'adhésion' : 'Join Date', value: new Date(teacher.createdAt).toLocaleDateString(language === 'ar' ? 'ar-DZ' : language === 'fr' ? 'fr-FR' : 'en-US') },
                  ].map(({ Icon, label, value, ltr }) => (
                    <div key={label} style={infoCardStyle}>
                      <div style={iconBoxStyle}>
                        <Icon style={{ width: '1.1rem', height: '1.1rem', color: 'var(--primary)' }} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '0.2rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</p>
                        <p style={{ fontSize: '0.95rem', color: 'var(--text-primary)', fontWeight: 600, direction: ltr ? 'ltr' : undefined, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', margin: 0 }}>{value}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
                  <button className="btn-primary" style={{ width: '100%' }} onClick={() => setShowInfoDialogId(null)}>
                    {language === 'ar' ? 'إغلاق' : language === 'fr' ? 'Fermer' : 'Close'}
                  </button>
                </div>
              </div>
            </div>
          );
        })()}
      </main>

      <Footer />

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

const ManageTeachers = () => {
  return (
    <LanguageProvider>
      <ManageTeachersContent />
    </LanguageProvider>
  );
};

export default ManageTeachers;
