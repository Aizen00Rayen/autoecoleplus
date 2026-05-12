import { useState, useEffect } from 'react';
import { LanguageProvider, useLanguage } from '../contexts/LanguageContext';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Users, Car, CreditCard, Calendar, Bell,
  Settings, LogOut, TrendingUp, BookOpen, Shield, BarChart2,
  FileText, AlertTriangle, Camera, Upload, Check, Loader2,
  Info, User, Mail, Phone, ChevronRight, X
} from 'lucide-react';
import { supabase } from '../supabase';
import { useAuth } from '../contexts/AuthContext';
import { runBookingMaintenance } from '../utils/bookingArchive';
import '../components/style/theme.css';

/* ─── Sidebar nav items ──────────────────────────────────────── */
const NAV_ITEMS = [
  { path: '/admin-dashboard',       icon: LayoutDashboard, labelEn: 'Dashboard',      labelAr: 'لوحة التحكم',    labelFr: 'Tableau de bord' },
  { path: '/manage-students',       icon: Users,           labelEn: 'Students',        labelAr: 'الطلاب',          labelFr: 'Étudiants' },
  { path: '/manage-teachers',       icon: Users,           labelEn: 'Teachers',        labelAr: 'المعلمون',        labelFr: 'Moniteurs' },
  { path: '/manage-vehicles',       icon: Car,             labelEn: 'Vehicles',        labelAr: 'المركبات',        labelFr: 'Véhicules' },
  { path: '/manage-payments',       icon: CreditCard,      labelEn: 'Payments',        labelAr: 'المدفوعات',       labelFr: 'Paiements' },
  { path: '/admin-bookings',        icon: Calendar,        labelEn: 'Bookings',        labelAr: 'الحجوزات',        labelFr: 'Réservations' },
  { path: '/admin-notifications',   icon: Bell,            labelEn: 'Notifications',   labelAr: 'الإشعارات',       labelFr: 'Notifications' },
  { path: '/admin-reports',         icon: BarChart2,       labelEn: 'Reports',         labelAr: 'التقارير',        labelFr: 'Rapports' },
  { path: '/admin-settings',        icon: Settings,        labelEn: 'Settings',        labelAr: 'الإعدادات',       labelFr: 'Paramètres' },
  { path: '/test',                   icon: Shield,          labelEn: 'Test Accounts',   labelAr: 'حسابات تجريبية', labelFr: 'Comptes test' },
];

/* ─── Small helpers ──────────────────────────────────────────── */
const t = (language: string, ar: string, fr: string, en: string) =>
  language === 'ar' ? ar : language === 'fr' ? fr : en;

/* ─── Sidebar ────────────────────────────────────────────────── */
const Sidebar = ({
  language,
  pendingCount,
  onLogout,
}: {
  language: string;
  pendingCount: number;
  onLogout: () => void;
}) => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [hovered, setHovered] = useState<string | null>(null);

  return (
    <aside className="dashboard-sidebar" style={{ display: 'flex', flexDirection: 'column' }}>
      {/* Logo */}
      <div style={{
        padding: '1.75rem 1.5rem 1.25rem',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            width: '2.5rem', height: '2.5rem', borderRadius: '0.75rem',
            background: 'var(--grad-gold)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: 'var(--shadow-gold)',
            flexShrink: 0,
          }}>
            <Car size={18} color="#000" strokeWidth={2.5} />
          </div>
          <div>
            <p style={{
              fontSize: '1rem', fontWeight: 800,
              background: 'var(--grad-gold)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              lineHeight: 1.2,
            }}>
              Auto-École
            </p>
            <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 500, letterSpacing: '0.08em' }}>
              {t(language, 'لوحة الإدارة', 'Administration', 'Admin Panel')}
            </p>
          </div>
        </div>
      </div>

      {/* Nav label */}
      <p style={{
        fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.1em',
        textTransform: 'uppercase', color: 'var(--text-muted)',
        padding: '1.25rem 1.5rem 0.5rem',
      }}>
        {t(language, 'القائمة الرئيسية', 'Menu Principal', 'Main Menu')}
      </p>

      {/* Nav items */}
      <nav style={{ flex: 1, overflowY: 'auto', padding: '0 0.75rem' }}>
        {NAV_ITEMS.map(({ path, icon: Icon, labelEn, labelAr, labelFr }) => {
          const isActive = pathname === path;
          const label = language === 'ar' ? labelAr : language === 'fr' ? labelFr : labelEn;
          const isHovered = hovered === path;
          const isNotifications = path === '/admin-notifications';

          return (
            <button
              key={path}
              onClick={() => navigate(path)}
              onMouseEnter={() => setHovered(path)}
              onMouseLeave={() => setHovered(null)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.7rem 0.875rem',
                marginBottom: '2px',
                borderRadius: '0.75rem',
                border: 'none',
                cursor: 'pointer',
                background: isActive
                  ? 'rgba(245,166,35,0.12)'
                  : isHovered
                    ? 'rgba(255,255,255,0.04)'
                    : 'transparent',
                borderLeft: isActive ? '3px solid var(--primary)' : '3px solid transparent',
                transition: 'all 150ms ease',
                textAlign: 'left',
                position: 'relative',
              }}
            >
              <div style={{
                width: '1.75rem', height: '1.75rem', display: 'flex',
                alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                position: 'relative',
              }}>
                <Icon
                  size={17}
                  color={isActive ? 'var(--primary)' : isHovered ? 'var(--text-primary)' : 'var(--text-secondary)'}
                  strokeWidth={isActive ? 2.5 : 2}
                />
                {isNotifications && pendingCount > 0 && (
                  <span style={{
                    position: 'absolute', top: '-4px', right: '-4px',
                    background: '#ef4444', color: '#fff',
                    borderRadius: '9999px', fontSize: '0.6rem', fontWeight: 700,
                    minWidth: '16px', height: '16px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    padding: '0 3px',
                  }}>
                    {pendingCount > 99 ? '99+' : pendingCount}
                  </span>
                )}
              </div>
              <span style={{
                fontSize: '0.875rem',
                fontWeight: isActive ? 700 : 500,
                color: isActive ? 'var(--primary)' : isHovered ? 'var(--text-primary)' : 'var(--text-secondary)',
                flex: 1,
                transition: 'color 150ms ease',
              }}>
                {label}
              </span>
              {isActive && (
                <ChevronRight size={14} color="var(--primary)" />
              )}
            </button>
          );
        })}
      </nav>

      {/* Logout */}
      <div style={{
        padding: '1rem 0.75rem 1.5rem',
        borderTop: '1px solid rgba(255,255,255,0.06)',
      }}>
        <button
          onClick={onLogout}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            padding: '0.7rem 0.875rem',
            borderRadius: '0.75rem',
            border: '1px solid rgba(239,68,68,0.2)',
            background: 'rgba(239,68,68,0.05)',
            color: '#FCA5A5',
            cursor: 'pointer',
            fontSize: '0.875rem',
            fontWeight: 600,
            transition: 'all 150ms ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(239,68,68,0.12)';
            e.currentTarget.style.borderColor = 'rgba(239,68,68,0.4)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(239,68,68,0.05)';
            e.currentTarget.style.borderColor = 'rgba(239,68,68,0.2)';
          }}
        >
          <LogOut size={16} />
          {t(language, 'تسجيل الخروج', 'Déconnexion', 'Log Out')}
        </button>
      </div>
    </aside>
  );
};

/* ─── Info Dialog ────────────────────────────────────────────── */
const InfoDialog = ({
  open,
  onClose,
  language,
  adminData,
  user,
  profileImagePreview,
  profileImageFile,
  isUploadingProfile,
  isSubmitting,
  message,
  error,
  showProfileUpload,
  onToggleProfileUpload,
  onImageChange,
  onSaveImage,
  onClearImage,
}: any) => {
  if (!open) return null;

  const infoRows = [
    {
      icon: User,
      label: t(language, 'الاسم الكامل', 'Nom complet', 'Full Name'),
      value: adminData?.fullName || user?.name || t(language, 'المدير', 'Administrateur', 'Administrator'),
    },
    {
      icon: Mail,
      label: t(language, 'البريد الإلكتروني', 'Email', 'Email'),
      value: adminData?.email || user?.email || '—',
    },
    {
      icon: Phone,
      label: t(language, 'رقم الهاتف', 'Téléphone', 'Phone'),
      value: adminData?.phone || t(language, 'غير محدد', 'Non spécifié', 'Not specified'),
    },
    {
      icon: Shield,
      label: t(language, 'الدور', 'Rôle', 'Role'),
      value: t(language, 'مدير النظام', 'Administrateur système', 'System Administrator'),
    },
  ];

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 2000,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)',
    }} onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: '560px', maxHeight: '90vh', overflowY: 'auto',
          background: 'var(--bg-dark)',
          border: '1px solid var(--border)',
          borderRadius: '1.25rem',
          padding: '2rem',
          boxShadow: 'var(--shadow-lg)',
          margin: '1rem',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
          <div>
            <h2 style={{
              fontSize: '1.5rem', fontWeight: 800,
              background: 'var(--grad-gold)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>
              {t(language, 'معلومات المدير', "Informations de l'administrateur", 'Administrator Information')}
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
              {t(language, 'معلوماتك الشخصية والإدارية', 'Vos informations personnelles', 'Your personal information')}
            </p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '0.25rem' }}>
            <X size={20} />
          </button>
        </div>

        {/* Messages */}
        {message && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            padding: '0.75rem 1rem', borderRadius: '0.75rem',
            background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)',
            color: '#34D399', fontWeight: 600, fontSize: '0.875rem', marginBottom: '1rem',
          }}>
            <Check size={16} />{message}
          </div>
        )}
        {error && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            padding: '0.75rem 1rem', borderRadius: '0.75rem',
            background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
            color: '#FCA5A5', fontWeight: 600, fontSize: '0.875rem', marginBottom: '1rem',
          }}>
            <AlertTriangle size={16} />{error}
          </div>
        )}

        {/* Profile Picture */}
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem',
          padding: '1.5rem',
          background: 'var(--bg-mid)',
          borderRadius: '1rem',
          border: '1px solid var(--border)',
          marginBottom: '1.5rem',
        }}>
          <div style={{ position: 'relative' }}>
            <div style={{
              width: '6rem', height: '6rem', borderRadius: '50%',
              overflow: 'hidden',
              border: '3px solid var(--border-gold)',
              boxShadow: 'var(--shadow-gold)',
              background: 'var(--bg-card)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {adminData?.photoURL ? (
                <img src={adminData.photoURL} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <Shield size={32} color="var(--primary)" />
              )}
            </div>
            <button
              onClick={onToggleProfileUpload}
              style={{
                position: 'absolute', bottom: 0, right: 0,
                width: '2rem', height: '2rem', borderRadius: '50%',
                background: 'var(--grad-gold)', border: '2px solid var(--bg-dark)',
                color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', transition: 'all 200ms ease',
              }}
            >
              <Camera size={12} strokeWidth={2.5} />
            </button>
          </div>

          {showProfileUpload && (
            <div style={{ width: '100%' }}>
              <div
                onClick={() => !isUploadingProfile && document.getElementById('adminProfileImageInput')?.click()}
                style={{
                  border: profileImageFile ? '2px solid rgba(16,185,129,0.5)' : '2px dashed var(--border)',
                  borderRadius: '0.75rem', padding: '1.25rem', textAlign: 'center',
                  cursor: isUploadingProfile ? 'not-allowed' : 'pointer',
                  background: 'var(--bg-card)', transition: 'all 200ms ease',
                }}
              >
                {isUploadingProfile ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                    <Loader2 size={28} color="var(--primary)" style={{ animation: 'spin 1s linear infinite' }} />
                    <p style={{ color: 'var(--primary)', fontSize: '0.75rem', fontWeight: 600 }}>
                      {t(language, 'جاري رفع الصورة...', 'Téléchargement...', 'Uploading...')}
                    </p>
                  </div>
                ) : profileImagePreview ? (
                  <div style={{ position: 'relative', display: 'inline-block' }}>
                    <img src={profileImagePreview} alt="Preview" style={{ maxWidth: '100%', maxHeight: '100px', borderRadius: '0.5rem' }} />
                    <div style={{
                      position: 'absolute', top: '4px', right: '4px',
                      background: '#10b981', borderRadius: '50%', padding: '3px',
                    }}>
                      <Check size={10} color="#fff" />
                    </div>
                  </div>
                ) : (
                  <>
                    <Upload size={28} color="var(--text-muted)" style={{ margin: '0 auto 0.5rem' }} />
                    <p style={{ color: 'var(--text-primary)', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.25rem' }}>
                      {t(language, 'انقر لاختيار صورة', 'Cliquez pour choisir', 'Click to choose image')}
                    </p>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>PNG, JPG (max 5MB)</p>
                  </>
                )}
              </div>
              <input
                id="adminProfileImageInput"
                type="file"
                accept="image/png,image/jpeg,image/jpg"
                onChange={onImageChange}
                disabled={isUploadingProfile}
                style={{ display: 'none' }}
              />
              {profileImageFile && (
                <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', marginTop: '0.75rem' }}>
                  <button
                    onClick={onSaveImage}
                    disabled={isSubmitting || isUploadingProfile}
                    className="btn-primary"
                    style={{ padding: '0.5rem 1.25rem', fontSize: '0.8rem', borderRadius: '0.5rem' }}
                  >
                    {(isSubmitting || isUploadingProfile) && <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />}
                    {t(language, 'حفظ الصورة', 'Sauvegarder', 'Save Image')}
                  </button>
                  <button
                    onClick={onClearImage}
                    className="btn-ghost"
                    style={{ padding: '0.5rem 1.25rem', fontSize: '0.8rem', borderRadius: '0.5rem' }}
                  >
                    {t(language, 'إلغاء', 'Annuler', 'Cancel')}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Info Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
          {infoRows.map(({ icon: Icon, label, value }) => (
            <div key={label} style={{
              display: 'flex', alignItems: 'center', gap: '0.875rem',
              padding: '1rem 1.125rem',
              background: 'var(--bg-mid)',
              borderRadius: '0.875rem',
              border: '1px solid var(--border)',
            }}>
              <div style={{
                width: '2.5rem', height: '2.5rem', borderRadius: '0.625rem', flexShrink: 0,
                background: 'rgba(245,166,35,0.1)',
                border: '1px solid var(--border-gold)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Icon size={16} color="var(--primary)" />
              </div>
              <div style={{ minWidth: 0 }}>
                <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.2rem' }}>
                  {label}
                </p>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-primary)', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {value}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Close */}
        <button
          onClick={onClose}
          className="btn-primary"
          style={{ width: '100%', marginTop: '1.5rem', justifyContent: 'center' }}
        >
          {t(language, 'إغلاق', 'Fermer', 'Close')}
        </button>
      </div>
    </div>
  );
};

/* ─── Main Content ───────────────────────────────────────────── */
const AdminDashboardContent = () => {
  const { language } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [studentsCount, setStudentsCount] = useState(0);
  const [teachersCount, setTeachersCount] = useState(0);
  const [vehiclesCount, setVehiclesCount] = useState(0);
  const [todayBookingsCount, setTodayBookingsCount] = useState(0);
  const [pendingBookingsCount, setPendingBookingsCount] = useState(0);
  const [pendingLicenseRequestsCount, setPendingLicenseRequestsCount] = useState(0);
  const [totalPendingCount, setTotalPendingCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const [showInfoDialog, setShowInfoDialog] = useState(false);
  const [adminData, setAdminData] = useState<any>(null);
  const [profileImageFile, setProfileImageFile] = useState<File | null>(null);
  const [profileImagePreview, setProfileImagePreview] = useState<string>('');
  const [isUploadingProfile, setIsUploadingProfile] = useState(false);
  const [showProfileUpload, setShowProfileUpload] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const CLOUDINARY_CLOUD_NAME = 'dpjclv2nb';
  const CLOUDINARY_UPLOAD_PRESET = 'preset';

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        await runBookingMaintenance();

        const { data: students } = await supabase.from('users').select('id').eq('role', 'student');
        setStudentsCount(students?.length || 0);

        const { data: teachers } = await supabase.from('users').select('id').eq('role', 'teacher');
        setTeachersCount(teachers?.length || 0);

        const { data: vehicles } = await supabase.from('vehicles').select('id');
        setVehiclesCount(vehicles?.length || 0);

        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const today = `${year}-${month}-${day}`;

        const { data: allBookings } = await supabase.from('bookings').select('date');
        const todayCount = (allBookings || []).filter((b: any) => b.date === today).length;
        setTodayBookingsCount(todayCount);

        setLoading(false);
      } catch (err) {
        console.error('Error fetching counts:', err);
        setLoading(false);
      }
    };
    fetchCounts();
  }, []);

  useEffect(() => {
    const fetchAdminData = async () => {
      if (!user?.uid) return;
      try {
        const { data, error: err } = await supabase.from('users').select('*').eq('id', user.uid).single();
        if (!err && data) {
          setAdminData(data);
          console.log('Admin data loaded:', {
            hasProfileImage: !!(data.profileImage || data.photoURL),
            profileImage: data.profileImage,
            photoURL: data.photoURL,
          });
        }
      } catch (err) {
        console.error('Error fetching admin data:', err);
      }
    };
    fetchAdminData();
  }, [user?.uid]);

  const handleProfileImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError(t(language, 'يرجى اختيار ملف صورة صالح', 'Veuillez choisir un fichier image valide', 'Please choose a valid image file'));
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setError(t(language, 'حجم الصورة يجب أن يكون أقل من 5 ميجابايت', "La taille de l'image doit être inférieure à 5 MB", 'Image size must be less than 5MB'));
        return;
      }
      setProfileImageFile(file);
      setError('');
      const reader = new FileReader();
      reader.onloadend = () => { setProfileImagePreview(reader.result as string); };
      reader.readAsDataURL(file);
    }
  };

  const uploadProfileImageToCloudinary = async (file: File): Promise<string> => {
    setIsUploadingProfile(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
      formData.append('cloud_name', CLOUDINARY_CLOUD_NAME);
      if (user?.uid) {
        formData.append('public_id', `admins/${user.uid}_profile_${Date.now()}`);
      }
      const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, {
        method: 'POST', body: formData,
      });
      if (!response.ok) throw new Error('فشل في رفع الصورة');
      const data = await response.json();
      if (data.error) throw new Error(data.error.message);
      return data.secure_url;
    } catch (err: any) {
      console.error('Error uploading to Cloudinary:', err);
      throw new Error(t(language, 'فشل في رفع الصورة. يرجى المحاولة مرة أخرى.', "Échec du téléchargement de l'image. Veuillez réessayer.", 'Failed to upload image. Please try again.'));
    } finally {
      setIsUploadingProfile(false);
    }
  };

  const handleProfilePictureUpload = async () => {
    if (!profileImageFile || !user?.uid) return;
    setIsSubmitting(true);
    setMessage(''); setError('');
    try {
      const imageUrl = await uploadProfileImageToCloudinary(profileImageFile);
      await supabase.from('users').update({ photoURL: imageUrl, updatedAt: new Date().toISOString() }).eq('id', user.uid);
      setAdminData((prev: any) => ({ ...prev, photoURL: imageUrl }));
      setMessage(t(language, 'تم تحديث الصورة الشخصية بنجاح!', 'Photo de profil mise à jour avec succès!', 'Profile picture updated successfully!'));
      setProfileImageFile(null);
      setProfileImagePreview('');
      setShowProfileUpload(false);
      setTimeout(() => setMessage(''), 3000);
    } catch (err: any) {
      console.error('Error updating profile picture:', err);
      setError(err.message || t(language, 'حدث خطأ أثناء تحديث الصورة', "Erreur lors de la mise à jour de l'image", 'Error updating profile picture'));
      setTimeout(() => setError(''), 5000);
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    supabase.from('bookings').select('id').eq('status', 'pending').then(({ data }) => {
      setPendingBookingsCount(data?.length || 0);
    });
    const channel = supabase
      .channel('pending-bookings')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, async () => {
        const { data } = await supabase.from('bookings').select('id').eq('status', 'pending');
        setPendingBookingsCount(data?.length || 0);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  useEffect(() => {
    supabase.from('licenseChangeRequests').select('id').eq('status', 'pending').then(({ data }) => {
      setPendingLicenseRequestsCount(data?.length || 0);
    });
    const channel = supabase
      .channel('pending-license-requests')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'licenseChangeRequests' }, async () => {
        const { data } = await supabase.from('licenseChangeRequests').select('id').eq('status', 'pending');
        setPendingLicenseRequestsCount(data?.length || 0);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  useEffect(() => {
    setTotalPendingCount(pendingBookingsCount + pendingLicenseRequestsCount);
  }, [pendingBookingsCount, pendingLicenseRequestsCount]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  /* ── Stats config ── */
  const STATS = [
    {
      icon: Users,
      label: t(language, 'إجمالي الطلاب', 'Total Étudiants', 'Total Students'),
      value: loading ? '—' : studentsCount,
      iconBg: 'rgba(59,130,246,0.15)',
      iconColor: '#93C5FD',
      borderColor: 'rgba(59,130,246,0.3)',
    },
    {
      icon: BookOpen,
      label: t(language, 'المعلمون', 'Moniteurs', 'Instructors'),
      value: loading ? '—' : teachersCount,
      iconBg: 'rgba(16,185,129,0.15)',
      iconColor: '#34D399',
      borderColor: 'rgba(16,185,129,0.3)',
    },
    {
      icon: Car,
      label: t(language, 'المركبات', 'Véhicules', 'Vehicles'),
      value: loading ? '—' : vehiclesCount,
      iconBg: 'rgba(168,85,247,0.15)',
      iconColor: '#C4B5FD',
      borderColor: 'rgba(168,85,247,0.3)',
    },
    {
      icon: Calendar,
      label: t(language, 'حجوزات اليوم', "Réservations aujourd'hui", 'Bookings Today'),
      value: loading ? '—' : todayBookingsCount,
      iconBg: 'rgba(245,166,35,0.15)',
      iconColor: 'var(--primary)',
      borderColor: 'var(--border-gold)',
    },
  ];

  /* ── Quick actions ── */
  const QUICK_ACTIONS = [
    { path: '/manage-students',     icon: Users,      labelEn: 'Manage Students',       labelAr: 'إدارة الطلاب',      labelFr: 'Gérer Étudiants',   descEn: 'View and manage student accounts',       descAr: 'عرض وإدارة حسابات الطلاب',          descFr: 'Voir et gérer les comptes étudiants' },
    { path: '/manage-teachers',     icon: BookOpen,   labelEn: 'Manage Instructors',     labelAr: 'إدارة المعلمين',    labelFr: 'Gérer Moniteurs',   descEn: 'Add and edit instructor data',           descAr: 'إضافة وتعديل بيانات المعلمين',       descFr: 'Ajouter et modifier les moniteurs' },
    { path: '/manage-vehicles',     icon: Car,        labelEn: 'Manage Vehicles',        labelAr: 'إدارة المركبات',    labelFr: 'Gérer Véhicules',   descEn: 'Track vehicles and maintenance',         descAr: 'متابعة حالة المركبات',               descFr: 'Suivre les véhicules' },
    { path: '/admin-bookings',      icon: Calendar,   labelEn: 'Manage Bookings',        labelAr: 'إدارة الحجوزات',    labelFr: 'Gérer Réservations',descEn: 'View and manage all bookings',           descAr: 'عرض وإدارة جميع الحجوزات',           descFr: 'Voir toutes les réservations' },
    { path: '/manage-payments',     icon: CreditCard, labelEn: 'Manage Payments',        labelAr: 'إدارة المدفوعات',   labelFr: 'Gérer Paiements',   descEn: 'Track payments and invoices',            descAr: 'متابعة المدفوعات والفواتير',          descFr: 'Suivre paiements et factures' },
    { path: '/admin-notifications', icon: Bell,       labelEn: 'Notifications',          labelAr: 'الإشعارات',         labelFr: 'Notifications',     descEn: 'Send and manage notifications',          descAr: 'إرسال وإدارة الإشعارات',             descFr: 'Envoyer et gérer notifications',    badge: totalPendingCount },
    { path: '/admin-reports',       icon: BarChart2,  labelEn: 'Reports & Statistics',   labelAr: 'التقارير',          labelFr: 'Rapports',          descEn: 'View performance reports',              descAr: 'عرض تقارير الأداء',                  descFr: 'Voir rapports de performance' },
    { path: '/admin-settings',      icon: Settings,   labelEn: 'Settings',               labelAr: 'الإعدادات',         labelFr: 'Paramètres',        descEn: 'System and app settings',               descAr: 'إعدادات النظام',                      descFr: 'Paramètres système' },
  ];

  return (
    <>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        .anim-fade { animation: fadeIn 0.4s ease forwards; }
      `}</style>

      <div className="dashboard-layout" style={{ display: 'flex' }}>
        {/* Sidebar */}
        <Sidebar language={language} pendingCount={totalPendingCount} onLogout={handleLogout} />

        {/* Main */}
        <main className="dashboard-main" style={{ flex: 1, minHeight: '100vh', background: 'var(--bg-darkest)' }}>

          {/* ── Top Header Bar ── */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            marginBottom: '2rem',
            padding: '1.25rem 1.75rem',
            background: 'var(--bg-dark)',
            borderRadius: '1rem',
            border: '1px solid var(--border)',
          }}>
            <div>
              <p className="section-label" style={{ marginBottom: '0.35rem' }}>
                <Shield size={12} />
                {t(language, 'المدير', 'Administrateur', 'Administrator')}
              </p>
              <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-white)', lineHeight: 1 }}>
                {t(language, 'لوحة تحكم المدير', "Tableau de bord Admin", 'Admin Dashboard')}
              </h1>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              {/* Notification Bell */}
              <button
                onClick={() => navigate('/admin-notifications')}
                style={{
                  position: 'relative', width: '2.75rem', height: '2.75rem',
                  borderRadius: '0.75rem', border: '1px solid var(--border)',
                  background: 'var(--bg-mid)', color: 'var(--text-secondary)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', transition: 'all 200ms ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-gold)';
                  e.currentTarget.style.color = 'var(--primary)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border)';
                  e.currentTarget.style.color = 'var(--text-secondary)';
                }}
              >
                <Bell size={18} />
                {totalPendingCount > 0 && (
                  <span style={{
                    position: 'absolute', top: '-4px', right: '-4px',
                    background: '#ef4444', color: '#fff',
                    borderRadius: '9999px', fontSize: '0.6rem', fontWeight: 700,
                    minWidth: '18px', height: '18px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    padding: '0 3px',
                  }}>
                    {totalPendingCount}
                  </span>
                )}
              </button>

              {/* Admin Avatar / Info */}
              <button
                onClick={() => setShowInfoDialog(true)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.625rem',
                  padding: '0.5rem 1rem 0.5rem 0.5rem',
                  borderRadius: '0.875rem',
                  border: '1px solid var(--border)',
                  background: 'var(--bg-mid)',
                  cursor: 'pointer', transition: 'all 200ms ease',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--border-gold)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; }}
              >
                <div style={{
                  width: '2.25rem', height: '2.25rem', borderRadius: '0.625rem',
                  overflow: 'hidden',
                  background: 'rgba(245,166,35,0.15)',
                  border: '1px solid var(--border-gold)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  {(adminData?.profileImage || adminData?.photoURL) ? (
                    <img
                      src={adminData.profileImage || adminData.photoURL}
                      alt="Profile"
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={(e) => { e.currentTarget.style.display = 'none'; }}
                    />
                  ) : (
                    <Shield size={16} color="var(--primary)" />
                  )}
                </div>
                <div style={{ textAlign: 'left' }}>
                  <p style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.2 }}>
                    {adminData?.fullName || user?.name || t(language, 'المدير', 'Admin', 'Admin')}
                  </p>
                  <p style={{ fontSize: '0.7rem', color: 'var(--primary)', fontWeight: 600 }}>
                    {t(language, 'مدير النظام', 'Administrateur', 'System Admin')}
                  </p>
                </div>
                <Info size={14} color="var(--text-muted)" style={{ marginLeft: '0.25rem' }} />
              </button>
            </div>
          </div>

          {/* ── Stats Row ── */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '1rem',
            marginBottom: '2rem',
          }}>
            {STATS.map(({ icon: Icon, label, value, iconBg, iconColor, borderColor }, i) => (
              <div
                key={i}
                className="stat-card-pro anim-fade"
                style={{ animationDelay: `${i * 80}ms`, borderColor }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1rem' }}>
                  <div style={{
                    width: '3rem', height: '3rem', borderRadius: '0.875rem',
                    background: iconBg, border: `1px solid ${borderColor}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Icon size={20} color={iconColor} strokeWidth={2} />
                  </div>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: '0.25rem',
                    fontSize: '0.75rem', color: '#34D399', fontWeight: 600,
                  }}>
                    <TrendingUp size={12} />
                    <span>Active</span>
                  </div>
                </div>
                <p style={{
                  fontSize: '2.25rem', fontWeight: 800, lineHeight: 1,
                  marginBottom: '0.375rem',
                  background: 'var(--grad-gold)',
                  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}>
                  {loading ? (
                    <span style={{ WebkitTextFillColor: 'var(--text-muted)', fontSize: '1.5rem' }}>—</span>
                  ) : value}
                </p>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', fontWeight: 500 }}>{label}</p>
              </div>
            ))}
          </div>

          {/* ── Quick Actions ── */}
          <div style={{
            background: 'var(--grad-card)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)',
            padding: '1.75rem',
            marginBottom: '2rem',
          }}>
            <div style={{ marginBottom: '1.25rem' }}>
              <p className="section-label">
                <FileText size={12} />
                {t(language, 'الوصول السريع', 'Accès Rapide', 'Quick Access')}
              </p>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-white)' }}>
                {t(language, 'الإجراءات السريعة', 'Actions Rapides', 'Quick Actions')}
              </h2>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                {t(language, 'الوصول السريع إلى الوظائف الرئيسية', 'Accès rapide aux fonctions principales', 'Quick access to main functions')}
              </p>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '0.875rem',
            }}>
              {QUICK_ACTIONS.map(({ path, icon: Icon, labelEn, labelAr, labelFr, descEn, descAr, descFr, badge }, i) => {
                const label = language === 'ar' ? labelAr : language === 'fr' ? labelFr : labelEn;
                const desc  = language === 'ar' ? descAr  : language === 'fr' ? descFr  : descEn;
                return (
                  <button
                    key={i}
                    onClick={() => navigate(path)}
                    className="glass-card"
                    style={{
                      display: 'flex', flexDirection: 'column', alignItems: 'flex-start',
                      gap: '0.75rem', padding: '1.25rem',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-md)',
                      background: 'var(--bg-glass)',
                      cursor: 'pointer',
                      transition: 'all 200ms ease',
                      textAlign: 'left',
                      position: 'relative',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = 'var(--border-gold)';
                      e.currentTarget.style.transform = 'translateY(-3px)';
                      e.currentTarget.style.boxShadow = 'var(--shadow-gold)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'var(--border)';
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    <div style={{ position: 'relative' }}>
                      <div style={{
                        width: '2.75rem', height: '2.75rem', borderRadius: '0.75rem',
                        background: 'rgba(245,166,35,0.1)',
                        border: '1px solid var(--border-gold)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <Icon size={18} color="var(--primary)" strokeWidth={2} />
                      </div>
                      {badge && badge > 0 && (
                        <span style={{
                          position: 'absolute', top: '-6px', right: '-6px',
                          background: '#ef4444', color: '#fff',
                          borderRadius: '9999px', fontSize: '0.6rem', fontWeight: 700,
                          minWidth: '18px', height: '18px',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          padding: '0 3px',
                        }}>
                          {badge}
                        </span>
                      )}
                    </div>
                    <div>
                      <p style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-white)', marginBottom: '0.2rem' }}>
                        {label}
                      </p>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                        {desc}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── Recent Activity Table ── */}
          <div style={{
            background: 'var(--grad-card)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)',
            padding: '1.75rem',
          }}>
            <div style={{ marginBottom: '1.25rem' }}>
              <p className="section-label">
                <AlertTriangle size={12} />
                {t(language, 'الحالة', 'Statut', 'Status')}
              </p>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-white)' }}>
                {t(language, 'ملخص النظام', 'Résumé du Système', 'System Summary')}
              </h2>
            </div>
            <table className="table-pro">
              <thead>
                <tr>
                  <th>{t(language, 'المقياس', 'Indicateur', 'Metric')}</th>
                  <th>{t(language, 'القيمة', 'Valeur', 'Value')}</th>
                  <th>{t(language, 'الحالة', 'Statut', 'Status')}</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ color: 'var(--text-secondary)' }}>{t(language, 'الطلاب المسجلون', 'Étudiants inscrits', 'Enrolled Students')}</td>
                  <td style={{ fontWeight: 700 }}>{loading ? '—' : studentsCount}</td>
                  <td><span className="badge-pro badge-info">{t(language, 'نشط', 'Actif', 'Active')}</span></td>
                </tr>
                <tr>
                  <td style={{ color: 'var(--text-secondary)' }}>{t(language, 'المعلمون النشطون', 'Moniteurs actifs', 'Active Instructors')}</td>
                  <td style={{ fontWeight: 700 }}>{loading ? '—' : teachersCount}</td>
                  <td><span className="badge-pro badge-success">{t(language, 'متاح', 'Disponible', 'Available')}</span></td>
                </tr>
                <tr>
                  <td style={{ color: 'var(--text-secondary)' }}>{t(language, 'الحجوزات المعلقة', 'Réservations en attente', 'Pending Bookings')}</td>
                  <td style={{ fontWeight: 700 }}>{pendingBookingsCount}</td>
                  <td>
                    <span className={`badge-pro ${pendingBookingsCount > 0 ? 'badge-warning' : 'badge-success'}`}>
                      {pendingBookingsCount > 0
                        ? t(language, 'بانتظار المراجعة', 'En attente', 'Awaiting Review')
                        : t(language, 'لا يوجد', 'Aucune', 'None')}
                    </span>
                  </td>
                </tr>
                <tr>
                  <td style={{ color: 'var(--text-secondary)' }}>{t(language, 'طلبات الرخصة المعلقة', 'Demandes de licence en attente', 'Pending License Requests')}</td>
                  <td style={{ fontWeight: 700 }}>{pendingLicenseRequestsCount}</td>
                  <td>
                    <span className={`badge-pro ${pendingLicenseRequestsCount > 0 ? 'badge-warning' : 'badge-success'}`}>
                      {pendingLicenseRequestsCount > 0
                        ? t(language, 'بانتظار المراجعة', 'En attente', 'Awaiting Review')
                        : t(language, 'لا يوجد', 'Aucune', 'None')}
                    </span>
                  </td>
                </tr>
                <tr>
                  <td style={{ color: 'var(--text-secondary)' }}>{t(language, 'حجوزات اليوم', "Réservations aujourd'hui", "Today's Bookings")}</td>
                  <td style={{ fontWeight: 700 }}>{loading ? '—' : todayBookingsCount}</td>
                  <td><span className="badge-pro badge-gold">{t(language, 'اليوم', "Aujourd'hui", 'Today')}</span></td>
                </tr>
                <tr>
                  <td style={{ color: 'var(--text-secondary)' }}>{t(language, 'عدد المركبات', 'Nombre de véhicules', 'Total Vehicles')}</td>
                  <td style={{ fontWeight: 700 }}>{loading ? '—' : vehiclesCount}</td>
                  <td><span className="badge-pro badge-info">{t(language, 'مسجل', 'Enregistré', 'Registered')}</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        </main>
      </div>

      {/* Info Dialog */}
      <InfoDialog
        open={showInfoDialog}
        onClose={() => setShowInfoDialog(false)}
        language={language}
        adminData={adminData}
        user={user}
        profileImagePreview={profileImagePreview}
        profileImageFile={profileImageFile}
        isUploadingProfile={isUploadingProfile}
        isSubmitting={isSubmitting}
        message={message}
        error={error}
        showProfileUpload={showProfileUpload}
        onToggleProfileUpload={() => setShowProfileUpload(!showProfileUpload)}
        onImageChange={handleProfileImageChange}
        onSaveImage={handleProfilePictureUpload}
        onClearImage={() => { setProfileImageFile(null); setProfileImagePreview(''); }}
      />
    </>
  );
};

/* ─── Root export ────────────────────────────────────────────── */
const AdminDashboard = () => (
  <LanguageProvider>
    <AdminDashboardContent />
  </LanguageProvider>
);

export default AdminDashboard;
