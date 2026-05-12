import { useState, useEffect } from 'react';
import { LanguageProvider, useLanguage } from '../contexts/LanguageContext';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { supabase, BACKEND_URL, adminFetch } from '../supabase';
import { User, Plus, Edit, Trash2, Mail, Phone, Calendar, Check, X, ArrowLeft, IdCard, Bike, Car, Truck, GraduationCap, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import '../components/style/theme.css';

interface Student {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  licenseType: string;
  createdAt: string;
  photoURL?: string;
}

const ManageStudentsContent = () => {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [studentTeachers, setStudentTeachers] = useState<{[studentId: string]: {id: string, fullName: string, photoURL?: string} | null}>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    phone: '',
    licenseType: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      const { data, error } = await supabase.from('users').select('*').eq('role', 'student');
      if (error) throw error;
      const studentsList: Student[] = (data || []).map((d: any) => ({
        id: d.id,
        fullName: d.fullName,
        email: d.email,
        phone: d.phone,
        licenseType: d.licenseType || '',
        createdAt: d.createdAt,
        photoURL: d.photoURL
      }));
      setStudents(studentsList);
      await fetchStudentTeachers(studentsList);
    } catch (error) {
      console.error('Error fetching students:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStudentTeachers = async (studentsList: Student[]) => {
    try {
      const { data: bookings } = await supabase.from('bookings').select('*').eq('status', 'approved');
      const { data: users } = await supabase.from('users').select('id, fullName, photoURL, profileImage');
      const usersMap: {[id: string]: {fullName: string, photoURL?: string}} = {};
      (users || []).forEach((d: any) => { usersMap[d.id] = { fullName: d.fullName, photoURL: d.photoURL || d.profileImage }; });
      const map: {[studentId: string]: {id: string, fullName: string, photoURL?: string} | null} = {};
      studentsList.forEach(s => { map[s.id] = null; });
      (bookings || []).forEach((b: any) => {
        if (map[b.studentId] !== undefined && map[b.studentId] === null) {
          map[b.studentId] = { id: b.teacherId, fullName: b.teacherName, photoURL: usersMap[b.teacherId]?.photoURL };
        }
      });
      setStudentTeachers(map);
    } catch (e) {
      console.error('Error fetching student teachers:', e);
    }
  };

  const handleAddStudent = async (e: React.FormEvent) => {
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
            role: 'student',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        })
      });
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || errData.message || (language === 'ar' ? 'حدث خطأ أثناء الإضافة' : language === 'fr' ? "Erreur lors de l'ajout" : 'Error adding student'));
      }
      setMessage(language === 'ar' ? 'تم إضافة الطالب بنجاح!' : language === 'fr' ? 'Étudiant ajouté avec succès!' : 'Student added successfully!');
      setFormData({ fullName: '', email: '', password: '', phone: '', licenseType: '' });
      setShowAddDialog(false);
      fetchStudents();
    } catch (error: any) {
      setError(error.message || (language === 'ar' ? 'حدث خطأ أثناء الإضافة' : language === 'fr' ? "Erreur lors de l'ajout" : 'Error adding student'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent) return;
    setIsSubmitting(true);
    setMessage('');
    setError('');
    try {
      await supabase.from('users').update({
        fullName: formData.fullName,
        phone: formData.phone,
        licenseType: formData.licenseType,
        updatedAt: new Date().toISOString()
      }).eq('id', selectedStudent.id);
      setMessage(language === 'ar' ? 'تم تحديث بيانات الطالب بنجاح!' : language === 'fr' ? "Données de l'étudiant mises à jour!" : 'Student data updated successfully!');
      setShowEditDialog(false);
      setSelectedStudent(null);
      setFormData({ fullName: '', email: '', password: '', phone: '', licenseType: '' });
      fetchStudents();
    } catch (error) {
      setError(language === 'ar' ? 'حدث خطأ أثناء التحديث' : language === 'fr' ? 'Erreur lors de la mise à jour' : 'Error updating student');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteStudent = async (studentId: string, studentName: string) => {
    const confirmMessage = language === 'ar' ? `هل أنت متأكد من حذف الطالب "${studentName}"؟` : language === 'fr' ? `Êtes-vous sûr de supprimer l'étudiant "${studentName}"?` : `Are you sure you want to delete student "${studentName}"?`;
    if (!window.confirm(confirmMessage)) return;
    try {
      const response = await adminFetch(`/admin/delete-user/${studentId}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Delete failed');
      setMessage(language === 'ar' ? 'تم حذف الطالب بنجاح!' : language === 'fr' ? 'Étudiant supprimé avec succès!' : 'Student deleted successfully!');
      fetchStudents();
    } catch (error) {
      setError(language === 'ar' ? 'حدث خطأ أثناء الحذف' : language === 'fr' ? 'Erreur lors de la suppression' : 'Error deleting student');
    }
  };

  const openEditDialog = (student: Student) => {
    setSelectedStudent(student);
    setFormData({ fullName: student.fullName, email: student.email, password: '', phone: student.phone, licenseType: student.licenseType });
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

  const LicenseSelector = ({ value, onChange }: { value: string; onChange: (v: string) => void }) => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '0.5rem' }}>
      {[
        { value: 'A', icon: Bike, label: language === 'ar' ? 'دراجة نارية' : language === 'fr' ? 'Moto' : 'Motorcycle' },
        { value: 'B', icon: Car, label: language === 'ar' ? 'سيارة' : language === 'fr' ? 'Voiture' : 'Car' },
        { value: 'C', icon: Truck, label: language === 'ar' ? 'شاحنة' : language === 'fr' ? 'Camion' : 'Truck' }
      ].map((license) => {
        const Icon = license.icon;
        const isSelected = value === license.value;
        return (
          <button key={license.value} type="button" onClick={() => onChange(license.value)}
            style={{ padding: '0.75rem', borderRadius: '0.5rem', border: isSelected ? '2px solid var(--primary)' : '2px solid rgba(255,255,255,0.08)', background: isSelected ? 'rgba(245,166,35,0.15)' : 'var(--bg-dark)', cursor: 'pointer', transition: 'all 0.2s ease', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem' }}>
            <Icon style={{ width: '1.25rem', height: '1.25rem', color: isSelected ? 'var(--primary)' : 'var(--text-muted)' }} />
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: isSelected ? 'var(--primary)' : 'var(--text-secondary)' }}>{license.value}</span>
            <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{license.label}</span>
          </button>
        );
      })}
    </div>
  );

  const DialogFormBody = ({ onSubmit, submitLabel }: { onSubmit: (e: React.FormEvent) => void; submitLabel: string }) => (
    <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {[
        { key: 'fullName', label: language === 'ar' ? 'الاسم الكامل' : language === 'fr' ? 'Nom complet' : 'Full Name', type: 'text', placeholder: language === 'ar' ? 'أدخل الاسم' : 'Enter name' },
        { key: 'email', label: 'Email', type: 'email', placeholder: 'student@example.com', disabled: showEditDialog },
        ...(showAddDialog ? [{ key: 'password', label: language === 'ar' ? 'كلمة المرور' : language === 'fr' ? 'Mot de passe' : 'Password', type: 'password', placeholder: '••••••••' }] : []),
        { key: 'phone', label: language === 'ar' ? 'رقم الهاتف' : language === 'fr' ? 'Téléphone' : 'Phone', type: 'tel', placeholder: '+213 555 123 456' },
      ].map(({ key, label, type, placeholder, disabled }) => (
        <div key={key}>
          <label style={labelStyle}>{label}</label>
          <input type={type} value={(formData as any)[key]} onChange={e => setFormData({ ...formData, [key]: e.target.value })}
            required placeholder={placeholder} disabled={disabled} dir={type === 'email' || type === 'tel' || type === 'password' ? 'ltr' : undefined}
            className="input-pro" style={{ width: '100%', opacity: disabled ? 0.5 : 1 }} />
        </div>
      ))}
      <div>
        <label style={labelStyle}>
          {language === 'ar' ? 'نوع الرخصة' : language === 'fr' ? 'Type de permis' : 'License Type'}
        </label>
        <input type="text" value={formData.licenseType} onChange={() => {}} required style={{ position: 'absolute', opacity: 0, pointerEvents: 'none', height: 0, width: 0 }} tabIndex={-1} />
        <LicenseSelector value={formData.licenseType} onChange={v => setFormData({ ...formData, licenseType: v })} />
      </div>
      <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', paddingTop: '0.75rem', borderTop: '1px solid var(--border)' }}>
        <button type="button" className="btn-ghost" onClick={() => { setShowAddDialog(false); setShowEditDialog(false); }}>
          {language === 'ar' ? 'إلغاء' : language === 'fr' ? 'Annuler' : 'Cancel'}
        </button>
        <button type="submit" className="btn-primary" disabled={isSubmitting}>
          {isSubmitting ? '...' : submitLabel}
        </button>
      </div>
    </form>
  );

  const q = searchQuery.trim().toLowerCase();
  const filtered = q ? students.filter(s => s.fullName?.toLowerCase().includes(q) || s.email?.toLowerCase().includes(q) || s.phone?.toLowerCase().includes(q)) : students;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-darkest)', color: 'var(--text-primary)' }}>
      <Navbar />
      <main style={{ padding: '6rem 1.5rem 3rem', maxWidth: '1400px', margin: '0 auto' }}>

        {/* Page Header */}
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
            <button onClick={() => navigate('/admin-dashboard')} className="btn-ghost" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}>
              <ArrowLeft style={{ width: '1rem', height: '1rem' }} />
              {language === 'ar' ? 'لوحة التحكم' : language === 'fr' ? 'Tableau de bord' : 'Dashboard'}
            </button>
            <span style={{ color: 'var(--text-muted)' }}>/</span>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
              {language === 'ar' ? 'إدارة الطلاب' : language === 'fr' ? 'Étudiants' : 'Students'}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h1 style={{ fontSize: '2rem', fontWeight: 700, background: 'var(--grad-gold)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', margin: 0 }}>
                {language === 'ar' ? 'إدارة الطلاب' : language === 'fr' ? 'Gérer les Étudiants' : 'Manage Students'}
              </h1>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
                {language === 'ar' ? 'إضافة وتعديل وحذف حسابات الطلاب' : language === 'fr' ? 'Ajouter, modifier et supprimer les étudiants' : 'Add, edit and delete student accounts'}
              </p>
            </div>
            <button
              className="btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
              onClick={() => setShowAddDialog(true)}
            >
              <Plus style={{ width: '1rem', height: '1rem' }} />
              {language === 'ar' ? 'إضافة طالب' : language === 'fr' ? 'Ajouter Étudiant' : 'Add Student'}
            </button>
          </div>
        </div>

        {/* Messages */}
        {message && (
          <div style={{ padding: '0.875rem 1.25rem', background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: '0.75rem', color: '#4ade80', display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem', fontWeight: 500 }}>
            <Check style={{ width: '1rem', height: '1rem', flexShrink: 0 }} />{message}
          </div>
        )}
        {error && (
          <div style={{ padding: '0.875rem 1.25rem', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '0.75rem', color: '#f87171', display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem', fontWeight: 500 }}>
            <X style={{ width: '1rem', height: '1rem', flexShrink: 0 }} />{error}
          </div>
        )}

        {/* Search */}
        {!loading && students.length > 0 && (
          <div style={{ position: 'relative', marginBottom: '1.5rem' }}>
            <Search style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', width: '1rem', height: '1rem', color: 'var(--text-muted)', pointerEvents: 'none' }} />
            <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="input-pro"
              placeholder={language === 'ar' ? 'بحث بالاسم أو الإيميل...' : language === 'fr' ? 'Rechercher...' : 'Search by name or email...'}
              style={{ width: '100%', paddingLeft: '2.75rem', boxSizing: 'border-box' as const }} />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 0 }}>
                <X style={{ width: '1rem', height: '1rem' }} />
              </button>
            )}
          </div>
        )}

        {/* Table */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '4rem' }}>
            <div style={{ width: '24px', height: '24px', border: '3px solid rgba(245,166,35,0.2)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', display: 'inline-block' }} />
          </div>
        ) : filtered.length === 0 ? (
          <div className="glass-card" style={{ padding: '4rem 2rem', textAlign: 'center' }}>
            <User style={{ width: '3rem', height: '3rem', color: 'var(--text-muted)', margin: '0 auto 1rem' }} />
            <p style={{ color: 'var(--text-muted)', fontSize: '1rem' }}>
              {searchQuery ? (language === 'ar' ? 'لا توجد نتائج' : 'No results') : (language === 'ar' ? 'لا يوجد طلاب بعد' : 'No students yet')}
            </p>
          </div>
        ) : (
          <div className="glass-card" style={{ overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table className="table-pro" style={{ width: '100%' }}>
                <thead>
                  <tr>
                    <th>{language === 'ar' ? 'الطالب' : language === 'fr' ? 'Étudiant' : 'Student'}</th>
                    <th>{language === 'ar' ? 'البريد الإلكتروني' : 'Email'}</th>
                    <th>{language === 'ar' ? 'الهاتف' : language === 'fr' ? 'Téléphone' : 'Phone'}</th>
                    <th>{language === 'ar' ? 'الرخصة' : language === 'fr' ? 'Permis' : 'License'}</th>
                    <th>{language === 'ar' ? 'المعلم' : language === 'fr' ? 'Instructeur' : 'Instructor'}</th>
                    <th>{language === 'ar' ? 'تاريخ التسجيل' : language === 'fr' ? 'Inscription' : 'Enrolled'}</th>
                    <th>{language === 'ar' ? 'الإجراءات' : language === 'fr' ? 'Actions' : 'Actions'}</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((student) => (
                    <tr key={student.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <div style={{ width: '2.25rem', height: '2.25rem', borderRadius: '0.5rem', overflow: 'hidden', background: 'rgba(245,166,35,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            {student.photoURL ? <img src={student.photoURL} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <User style={{ width: '1rem', height: '1rem', color: 'var(--primary)' }} />}
                          </div>
                          <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{student.fullName}</span>
                        </div>
                      </td>
                      <td><span style={{ direction: 'ltr', display: 'inline-block', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{student.email}</span></td>
                      <td><span style={{ direction: 'ltr', display: 'inline-block', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{student.phone}</span></td>
                      <td>
                        {student.licenseType && (
                          <span className="badge-gold" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                            {student.licenseType === 'A' ? <Bike style={{ width: '0.75rem', height: '0.75rem' }} /> : student.licenseType === 'B' ? <Car style={{ width: '0.75rem', height: '0.75rem' }} /> : <Truck style={{ width: '0.75rem', height: '0.75rem' }} />}
                            {student.licenseType}
                          </span>
                        )}
                      </td>
                      <td>
                        {studentTeachers[student.id] ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <div style={{ width: '1.5rem', height: '1.5rem', borderRadius: '50%', overflow: 'hidden', background: 'rgba(245,166,35,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              {studentTeachers[student.id]?.photoURL ? <img src={studentTeachers[student.id]!.photoURL} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <GraduationCap style={{ width: '0.75rem', height: '0.75rem', color: 'var(--primary)' }} />}
                            </div>
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{studentTeachers[student.id]?.fullName}</span>
                          </div>
                        ) : (
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>—</span>
                        )}
                      </td>
                      <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                        {new Date(student.createdAt).toLocaleDateString(language === 'ar' ? 'ar-DZ' : language === 'fr' ? 'fr-FR' : 'en-US')}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button className="btn-outline" style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }} onClick={() => openEditDialog(student)}>
                            <Edit style={{ width: '0.75rem', height: '0.75rem' }} />
                            {language === 'ar' ? 'تعديل' : language === 'fr' ? 'Modifier' : 'Edit'}
                          </button>
                          <button
                            style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.35rem', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#FCA5A5', borderRadius: 'var(--radius-full)', cursor: 'pointer', fontWeight: 600 }}
                            onClick={() => handleDeleteStudent(student.id, student.fullName)}
                          >
                            <Trash2 style={{ width: '0.75rem', height: '0.75rem' }} />
                            {language === 'ar' ? 'حذف' : language === 'fr' ? 'Supprimer' : 'Delete'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ padding: '0.875rem 1.5rem', borderTop: '1px solid var(--border)', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
              {filtered.length} {language === 'ar' ? 'طالب' : language === 'fr' ? 'étudiant(s)' : 'student(s)'}
            </div>
          </div>
        )}

        {/* Add Student Modal */}
        {showAddDialog && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-gold)', borderRadius: 'var(--radius-lg)', padding: '2rem', width: '100%', maxWidth: '520px', maxHeight: '90vh', overflowY: 'auto', position: 'relative' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ width: '2.5rem', height: '2.5rem', borderRadius: '10px', background: 'rgba(245,166,35,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Plus style={{ width: '1.25rem', height: '1.25rem', color: 'var(--primary)' }} />
                  </div>
                  <h2 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                    {language === 'ar' ? 'إضافة طالب جديد' : language === 'fr' ? 'Ajouter un étudiant' : 'Add New Student'}
                  </h2>
                </div>
                <button onClick={() => setShowAddDialog(false)} className="btn-ghost" style={{ padding: '0.35rem', width: '2rem', height: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <X style={{ width: '1rem', height: '1rem' }} />
                </button>
              </div>
              <DialogFormBody onSubmit={handleAddStudent} submitLabel={language === 'ar' ? 'إضافة' : language === 'fr' ? 'Ajouter' : 'Add'} />
            </div>
          </div>
        )}

        {/* Edit Student Modal */}
        {showEditDialog && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-gold)', borderRadius: 'var(--radius-lg)', padding: '2rem', width: '100%', maxWidth: '520px', maxHeight: '90vh', overflowY: 'auto', position: 'relative' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ width: '2.5rem', height: '2.5rem', borderRadius: '10px', background: 'rgba(245,166,35,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Edit style={{ width: '1.25rem', height: '1.25rem', color: 'var(--primary)' }} />
                  </div>
                  <h2 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                    {language === 'ar' ? 'تعديل بيانات الطالب' : language === 'fr' ? "Modifier l'étudiant" : 'Edit Student'}
                  </h2>
                </div>
                <button onClick={() => setShowEditDialog(false)} className="btn-ghost" style={{ padding: '0.35rem', width: '2rem', height: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <X style={{ width: '1rem', height: '1rem' }} />
                </button>
              </div>
              <DialogFormBody onSubmit={handleEditStudent} submitLabel={language === 'ar' ? 'تحديث' : language === 'fr' ? 'Mettre à jour' : 'Update'} />
            </div>
          </div>
        )}
      </main>
      <Footer />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

const ManageStudents = () => (
  <LanguageProvider>
    <ManageStudentsContent />
  </LanguageProvider>
);

export default ManageStudents;
