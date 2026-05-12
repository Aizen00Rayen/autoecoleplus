import { useState, useEffect } from 'react';
import { LanguageProvider, useLanguage } from '../contexts/LanguageContext';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../supabase';
import { Car, Plus, Edit, Trash2, Check, X, ArrowLeft, Upload, Bike, Truck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { applyToggle } from '../utils/vehicleUtils';
import '../components/style/theme.css';

interface Vehicle {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  licenseType: string;
  disabled: boolean;
  createdAt: string;
}

const ManageVehiclesContent = () => {
  const { language } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    licenseType: ''
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // إعدادات Cloudinary
  const CLOUDINARY_CLOUD_NAME = 'dpjclv2nb';
  const CLOUDINARY_UPLOAD_PRESET = 'preset';

  useEffect(() => {
    fetchVehicles();
  }, []);

  const fetchVehicles = async () => {
    try {
      const { data, error } = await supabase.from('vehicles').select('*');
      if (error) throw error;
      setVehicles((data || []).map(v => ({
        id: v.id, name: v.name, description: v.description,
        imageUrl: v.imageUrl, licenseType: v.licenseType,
        disabled: v.disabled ?? false, createdAt: v.createdAt
      })));
    } catch (error) {
      console.error('Error fetching vehicles:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError(
          language === 'ar'
            ? 'يرجى اختيار ملف صورة صالح'
            : language === 'fr'
            ? 'Veuillez choisir un fichier image valide'
            : 'Please choose a valid image file'
        );
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        setError(
          language === 'ar'
            ? 'حجم الصورة يجب أن يكون أقل من 5 ميجابايت'
            : language === 'fr'
            ? 'La taille de l\'image doit être inférieure à 5 MB'
            : 'Image size must be less than 5MB'
        );
        return;
      }

      setImageFile(file);
      setError('');

      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadImageToCloudinary = async (file: File): Promise<string> => {
    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
      formData.append('cloud_name', CLOUDINARY_CLOUD_NAME);

      if (user?.uid) {
        formData.append('public_id', `vehicles/${user.uid}_${Date.now()}`);
      }

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
        {
          method: 'POST',
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error('فشل في رفع الصورة');
      }

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error.message);
      }

      return data.secure_url;
    } catch (error: any) {
      console.error('Error uploading to Cloudinary:', error);
      throw new Error(
        language === 'ar'
          ? 'فشل في رفع الصورة. يرجى المحاولة مرة أخرى.'
          : language === 'fr'
          ? 'Échec du téléchargement de l\'image. Veuillez réessayer.'
          : 'Failed to upload image. Please try again.'
      );
    } finally {
      setIsUploading(false);
    }
  };

  const handleAddVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage('');
    setError('');

    try {
      if (!imageFile) {
        setError(
          language === 'ar'
            ? 'الرجاء اختيار صورة المركبة'
            : language === 'fr'
            ? 'Veuillez choisir une image'
            : 'Please choose an image'
        );
        setIsSubmitting(false);
        return;
      }

      if (!user?.uid) {
        setError(
          language === 'ar'
            ? 'يجب تسجيل الدخول أولاً'
            : language === 'fr'
            ? 'Vous devez vous connecter'
            : 'You must be logged in'
        );
        setIsSubmitting(false);
        return;
      }

      const imageUrl = await uploadImageToCloudinary(imageFile);

      const { error: insertError } = await supabase.from('vehicles').insert({
        name: formData.name,
        description: formData.description,
        imageUrl: imageUrl,
        licenseType: formData.licenseType,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      if (insertError) throw insertError;

      setMessage(
        language === 'ar'
          ? 'تم إضافة المركبة بنجاح!'
          : language === 'fr'
          ? 'Véhicule ajouté avec succès!'
          : 'Vehicle added successfully!'
      );

      setFormData({ name: '', description: '', licenseType: '' });
      setImageFile(null);
      setImagePreview('');
      setShowAddDialog(false);
      fetchVehicles();

      setTimeout(() => setMessage(''), 3000);

    } catch (error: any) {
      console.error('Error adding vehicle:', error);
      setError(error.message || (
        language === 'ar'
          ? 'حدث خطأ أثناء الإضافة'
          : language === 'fr'
          ? 'Erreur lors de l\'ajout'
          : 'Error adding vehicle'
      ));
      setTimeout(() => setError(''), 5000);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVehicle) return;

    setIsSubmitting(true);
    setMessage('');
    setError('');

    try {
      if (!user?.uid) {
        setError(
          language === 'ar'
            ? 'يجب تسجيل الدخول أولاً'
            : language === 'fr'
            ? 'Vous devez vous connecter'
            : 'You must be logged in'
        );
        setIsSubmitting(false);
        return;
      }

      let imageUrl = selectedVehicle.imageUrl;

      if (imageFile) {
        imageUrl = await uploadImageToCloudinary(imageFile);
      }

      await supabase.from('vehicles').update({
        name: formData.name,
        description: formData.description,
        imageUrl: imageUrl,
        licenseType: formData.licenseType,
        updatedAt: new Date().toISOString()
      }).eq('id', selectedVehicle.id);

      setMessage(
        language === 'ar'
          ? 'تم تحديث بيانات المركبة بنجاح!'
          : language === 'fr'
          ? 'Véhicule mis à jour avec succès!'
          : 'Vehicle updated successfully!'
      );

      setShowEditDialog(false);
      setSelectedVehicle(null);
      setFormData({ name: '', description: '', licenseType: '' });
      setImageFile(null);
      setImagePreview('');
      fetchVehicles();

      setTimeout(() => setMessage(''), 3000);

    } catch (error: any) {
      console.error('Error updating vehicle:', error);
      setError(error.message || (
        language === 'ar'
          ? 'حدث خطأ أثناء التحديث'
          : language === 'fr'
          ? 'Erreur lors de la mise à jour'
          : 'Error updating vehicle'
      ));
      setTimeout(() => setError(''), 5000);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteVehicle = async (vehicleId: string, vehicleName: string) => {
    const confirmMessage = language === 'ar'
      ? `هل أنت متأكد من حذف المركبة "${vehicleName}"؟`
      : language === 'fr'
      ? `Êtes-vous sûr de supprimer le véhicule "${vehicleName}"?`
      : `Are you sure you want to delete vehicle "${vehicleName}"?`;

    if (!window.confirm(confirmMessage)) return;

    try {
      await supabase.from('vehicles').delete().eq('id', vehicleId);

      setMessage(
        language === 'ar'
          ? 'تم حذف المركبة بنجاح!'
          : language === 'fr'
          ? 'Véhicule supprimé avec succès!'
          : 'Vehicle deleted successfully!'
      );

      fetchVehicles();
    } catch (error) {
      setError(
        language === 'ar'
          ? 'حدث خطأ أثناء الحذف'
          : language === 'fr'
          ? 'Erreur lors de la suppression'
          : 'Error deleting vehicle'
      );
    }
  };

  const handleToggleDisabled = async (vehicleId: string, currentDisabled: boolean) => {
    const newDisabled = applyToggle(currentDisabled);
    setVehicles(prev => prev.map(v => v.id === vehicleId ? { ...v, disabled: newDisabled } : v));
    try {
      await supabase.from('vehicles').update({ disabled: newDisabled, updatedAt: new Date().toISOString() }).eq('id', vehicleId);
    } catch (err) {
      console.error('Error toggling vehicle:', err);
      setVehicles(prev => prev.map(v => v.id === vehicleId ? { ...v, disabled: currentDisabled } : v));
      setError(language === 'ar' ? 'حدث خطأ أثناء تحديث حالة المركبة' : language === 'fr' ? 'Erreur lors de la mise à jour' : 'Error updating vehicle status');
    }
  };

  const openEditDialog = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    setFormData({
      name: vehicle.name,
      description: vehicle.description,
      licenseType: vehicle.licenseType
    });
    setImagePreview(vehicle.imageUrl);
    setShowEditDialog(true);
  };

  const getLicenseIcon = (type: string) => {
    switch (type) {
      case 'A': return Bike;
      case 'B': return Car;
      case 'C': return Truck;
      default: return Car;
    }
  };

  const getLicenseColor = (type: string) => {
    switch (type) {
      case 'A': return '#f97316';
      case 'B': return '#3b82f6';
      case 'C': return '#10b981';
      default: return '#3b82f6';
    }
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

  const spinnerStyle: React.CSSProperties = {
    width: '24px',
    height: '24px',
    border: '3px solid rgba(245,166,35,0.2)',
    borderTopColor: 'var(--primary)',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
    display: 'inline-block'
  };

  const modalOverlayStyle: React.CSSProperties = {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.7)',
    backdropFilter: 'blur(8px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: '1rem'
  };

  const modalContentStyle: React.CSSProperties = {
    background: 'var(--bg-card)',
    border: '1px solid var(--border-gold)',
    borderRadius: 'var(--radius-lg)',
    padding: '2rem',
    width: '100%',
    maxWidth: '520px',
    maxHeight: '90vh',
    overflowY: 'auto'
  };

  const VehicleForm = ({ onSubmit, submitLabel }: { onSubmit: (e: React.FormEvent) => void; submitLabel: string }) => (
    <form onSubmit={onSubmit}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {/* Vehicle Image */}
        <div>
          <label style={labelStyle}>
            {language === 'ar' ? 'صورة المركبة' : language === 'fr' ? 'Image du véhicule' : 'Vehicle Image'}
            <span style={{ color: '#FCA5A5', marginLeft: '0.25rem' }}>*</span>
          </label>
          <div
            style={{
              border: imageFile ? '2px solid var(--primary)' : '2px dashed var(--border)',
              borderRadius: 'var(--radius-md)',
              padding: '1.5rem',
              textAlign: 'center',
              cursor: isUploading ? 'not-allowed' : 'pointer',
              transition: 'all 0.3s ease',
              background: imagePreview ? 'rgba(245,166,35,0.05)' : 'var(--bg-mid)',
              position: 'relative'
            }}
            onClick={() => !isUploading && document.getElementById(onSubmit === handleAddVehicle ? 'imageInput' : 'editImageInput')?.click()}
          >
            {isUploading ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                <div style={{ ...spinnerStyle, width: '3rem', height: '3rem', border: '4px solid rgba(245,166,35,0.2)', borderTopColor: 'var(--primary)' }} />
                <p style={{ color: 'var(--primary)', fontSize: '0.875rem', fontWeight: 600 }}>
                  {language === 'ar' ? 'جاري رفع الصورة...' : language === 'fr' ? 'Téléchargement en cours...' : 'Uploading image...'}
                </p>
              </div>
            ) : imagePreview ? (
              <div style={{ position: 'relative' }}>
                <img src={imagePreview} alt="Preview" style={{ maxWidth: '100%', maxHeight: '200px', borderRadius: '0.5rem', margin: '0 auto', boxShadow: 'var(--shadow-gold)' }} />
                <div style={{ position: 'absolute', top: '0.5rem', right: '0.5rem', background: '#10b981', color: 'white', borderRadius: '50%', padding: '0.5rem' }}>
                  <Check style={{ width: '1rem', height: '1rem' }} />
                </div>
                <p style={{ color: 'var(--primary)', fontSize: '0.75rem', marginTop: '0.5rem', fontWeight: 600 }}>
                  {language === 'ar' ? 'انقر لتغيير الصورة' : language === 'fr' ? 'Cliquez pour changer l\'image' : 'Click to change image'}
                </p>
              </div>
            ) : (
              <div>
                <Upload style={{ width: '3rem', height: '3rem', color: 'var(--text-muted)', margin: '0 auto 1rem' }} />
                <p style={{ color: 'var(--text-primary)', fontSize: '1rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                  {language === 'ar' ? 'انقر لاختيار صورة' : language === 'fr' ? 'Cliquez pour choisir une image' : 'Click to choose an image'}
                </p>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                  {language === 'ar' ? 'PNG, JPG, JPEG (حد أقصى 5MB)' : language === 'fr' ? 'PNG, JPG, JPEG (max 5MB)' : 'PNG, JPG, JPEG (max 5MB)'}
                </p>
              </div>
            )}
          </div>
          <input
            id={onSubmit === handleAddVehicle ? 'imageInput' : 'editImageInput'}
            type="file"
            accept="image/png,image/jpeg,image/jpg"
            onChange={handleImageChange}
            disabled={isUploading}
            style={{ display: 'none' }}
          />
          {imageFile && (
            <p style={{ fontSize: '0.75rem', color: 'var(--primary)', marginTop: '0.5rem', textAlign: 'center' }}>
              {language === 'ar' ? `تم اختيار: ${imageFile.name}` : language === 'fr' ? `Sélectionné: ${imageFile.name}` : `Selected: ${imageFile.name}`}
            </p>
          )}
        </div>

        {/* Vehicle Name */}
        <div>
          <label style={labelStyle}>
            {language === 'ar' ? 'اسم المركبة' : language === 'fr' ? 'Nom du véhicule' : 'Vehicle Name'}
          </label>
          <input
            className="input-pro"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
            placeholder={language === 'ar' ? 'مثال: رينو كليو' : language === 'fr' ? 'Ex: Renault Clio' : 'Ex: Renault Clio'}
          />
        </div>

        {/* Description */}
        <div>
          <label style={labelStyle}>
            {language === 'ar' ? 'الوصف' : language === 'fr' ? 'Description' : 'Description'}
          </label>
          <textarea
            className="input-pro"
            style={{ resize: 'vertical', minHeight: '80px' }}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            required
            placeholder={language === 'ar' ? 'وصف المركبة...' : language === 'fr' ? 'Description du véhicule...' : 'Vehicle description...'}
            rows={3}
          />
        </div>

        {/* License Type */}
        <div>
          <label style={labelStyle}>
            {language === 'ar' ? 'نوع الرخصة' : language === 'fr' ? 'Type de permis' : 'License Type'}
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
            {[
              { value: 'A', icon: Bike, label: language === 'ar' ? 'دراجة نارية' : language === 'fr' ? 'Moto' : 'Motorcycle', color: '#f97316' },
              { value: 'B', icon: Car, label: language === 'ar' ? 'سيارة' : language === 'fr' ? 'Voiture' : 'Car', color: '#3b82f6' },
              { value: 'C', icon: Truck, label: language === 'ar' ? 'شاحنة' : language === 'fr' ? 'Camion' : 'Truck', color: '#10b981' }
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
                    border: isSelected ? `2px solid ${license.color}` : '2px solid var(--border)',
                    background: isSelected ? `${license.color}22` : 'var(--bg-mid)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}
                >
                  <Icon style={{ width: '1.5rem', height: '1.5rem', color: license.color }} />
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '0.875rem', fontWeight: 600, color: isSelected ? license.color : 'var(--text-primary)', marginBottom: '0.125rem' }}>
                      {license.value}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', lineHeight: 1.2 }}>
                      {license.label}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--border)', display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
        <button
          type="button"
          className="btn-outline"
          onClick={() => {
            setShowAddDialog(false);
            setShowEditDialog(false);
            setSelectedVehicle(null);
            setFormData({ name: '', description: '', licenseType: '' });
            setImageFile(null);
            setImagePreview('');
          }}
        >
          {language === 'ar' ? 'إلغاء' : language === 'fr' ? 'Annuler' : 'Cancel'}
        </button>
        <button
          type="submit"
          disabled={isSubmitting || isUploading}
          className="btn-primary"
          style={{ opacity: (isSubmitting || isUploading) ? 0.6 : 1, cursor: (isSubmitting || isUploading) ? 'not-allowed' : 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
        >
          {(isSubmitting || isUploading) && <div style={spinnerStyle} />}
          {isUploading
            ? (language === 'ar' ? 'جاري رفع الصورة...' : language === 'fr' ? 'Téléchargement...' : 'Uploading...')
            : isSubmitting
            ? submitLabel + '...'
            : submitLabel
          }
        </button>
      </div>
    </form>
  );

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
            padding: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1.5rem'
          }}>
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
                <h1 style={{ fontSize: '2rem', fontWeight: 700, background: 'var(--grad-gold)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: '0.25rem' }}>
                  {language === 'ar' ? 'إدارة المركبات' : language === 'fr' ? 'Gérer les Véhicules' : 'Manage Vehicles'}
                </h1>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                  {language === 'ar' ? 'إضافة وتعديل وحذف المركبات' : language === 'fr' ? 'Ajouter, modifier et supprimer les véhicules' : 'Add, edit and delete vehicles'}
                </p>
              </div>
            </div>

            <button
              className="btn-primary"
              onClick={() => setShowAddDialog(true)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.75rem' }}
            >
              <Plus className="w-5 h-5" />
              {language === 'ar' ? 'إضافة مركبة جديدة' : language === 'fr' ? 'Ajouter Véhicule' : 'Add New Vehicle'}
            </button>
          </div>

          {/* Messages */}
          {message && (
            <div style={{ marginTop: '1rem', padding: '1rem 1.25rem', background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: 'var(--radius-md)', color: '#4ade80', display: 'flex', alignItems: 'center', gap: '0.75rem', fontWeight: 600 }}>
              <Check style={{ width: '1.25rem', height: '1.25rem', flexShrink: 0 }} />
              {message}
            </div>
          )}
          {error && (
            <div style={{ marginTop: '1rem', padding: '1rem 1.25rem', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 'var(--radius-md)', color: '#FCA5A5', display: 'flex', alignItems: 'center', gap: '0.75rem', fontWeight: 600 }}>
              <X style={{ width: '1.25rem', height: '1.25rem', flexShrink: 0 }} />
              {error}
            </div>
          )}
        </div>

        {/* Add Vehicle Modal */}
        {showAddDialog && (
          <div style={modalOverlayStyle}>
            <div style={modalContentStyle}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border-gold)' }}>
                <div style={{ width: '2.5rem', height: '2.5rem', borderRadius: '0.5rem', background: 'rgba(245,166,35,0.15)', border: '1px solid var(--border-gold)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Plus style={{ width: '1.25rem', height: '1.25rem', color: 'var(--primary)' }} />
                </div>
                <div>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                    {language === 'ar' ? 'إضافة مركبة جديدة' : language === 'fr' ? 'Ajouter un véhicule' : 'Add New Vehicle'}
                  </h2>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', margin: 0 }}>
                    {language === 'ar' ? 'أدخل بيانات المركبة الجديدة' : language === 'fr' ? 'Entrez les informations du nouveau véhicule' : 'Enter the new vehicle information'}
                  </p>
                </div>
              </div>
              <VehicleForm
                onSubmit={handleAddVehicle}
                submitLabel={language === 'ar' ? 'إضافة' : language === 'fr' ? 'Ajouter' : 'Add'}
              />
            </div>
          </div>
        )}

        {/* Edit Vehicle Modal */}
        {showEditDialog && (
          <div style={modalOverlayStyle}>
            <div style={modalContentStyle}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border-gold)' }}>
                <div style={{ width: '2.5rem', height: '2.5rem', borderRadius: '0.5rem', background: 'rgba(245,166,35,0.15)', border: '1px solid var(--border-gold)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Edit style={{ width: '1.25rem', height: '1.25rem', color: 'var(--primary)' }} />
                </div>
                <div>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                    {language === 'ar' ? 'تعديل المركبة' : language === 'fr' ? 'Modifier le véhicule' : 'Edit Vehicle'}
                  </h2>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', margin: 0 }}>
                    {language === 'ar' ? 'تحديث بيانات المركبة' : language === 'fr' ? 'Mettre à jour les informations du véhicule' : 'Update vehicle information'}
                  </p>
                </div>
              </div>
              <VehicleForm
                onSubmit={handleEditVehicle}
                submitLabel={language === 'ar' ? 'تحديث' : language === 'fr' ? 'Mettre à jour' : 'Update'}
              />
            </div>
          </div>
        )}

        {/* Vehicles List */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem' }}>
            <div style={{ ...spinnerStyle, width: '3rem', height: '3rem', border: '4px solid rgba(245,166,35,0.2)', borderTopColor: 'var(--primary)', margin: '0 auto' }} />
          </div>
        ) : vehicles.length === 0 ? (
          <div style={{ background: 'var(--grad-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '1.5rem' }}>
            <div style={{ padding: '4rem 2rem', textAlign: 'center' }}>
              <div style={{ width: '5rem', height: '5rem', borderRadius: '50%', background: 'rgba(245,166,35,0.1)', border: '1px solid var(--border-gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
                <Car style={{ width: '2.5rem', height: '2.5rem', color: 'var(--primary)' }} />
              </div>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                {language === 'ar' ? 'لا توجد مركبات حالياً' : language === 'fr' ? 'Aucun véhicule pour le moment' : 'No vehicles yet'}
              </h3>
              <p style={{ fontSize: '1rem', color: 'var(--text-secondary)' }}>
                {language === 'ar' ? 'ابدأ بإضافة مركبة جديدة' : language === 'fr' ? 'Commencez par ajouter un nouveau véhicule' : 'Start by adding a new vehicle'}
              </p>
            </div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.5rem' }}>
            {vehicles.map((vehicle) => {
              const LicenseIcon = getLicenseIcon(vehicle.licenseType);
              const licenseColor = getLicenseColor(vehicle.licenseType);

              return (
                <div
                  key={vehicle.id}
                  style={{
                    background: 'var(--grad-card)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-lg)',
                    overflow: 'hidden',
                    transition: 'border-color 0.3s ease, box-shadow 0.3s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'var(--border-gold)';
                    e.currentTarget.style.boxShadow = 'var(--shadow-gold)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'var(--border)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <div style={{ position: 'relative' }}>
                    <img
                      src={vehicle.imageUrl}
                      alt={vehicle.name}
                      style={{ width: '100%', height: '200px', objectFit: 'cover', opacity: vehicle.disabled ? 0.5 : 1 }}
                    />
                    {vehicle.disabled && (
                      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span style={{ background: 'rgba(239,68,68,0.9)', color: 'white', fontWeight: 700, padding: '0.4rem 1.2rem', borderRadius: 'var(--radius-full)', fontSize: '0.875rem' }}>
                          {language === 'ar' ? 'معطلة' : language === 'fr' ? 'Désactivé' : 'Disabled'}
                        </span>
                      </div>
                    )}
                    <div style={{ position: 'absolute', top: '1rem', right: '1rem', padding: '0.4rem 0.9rem', background: licenseColor, borderRadius: 'var(--radius-full)', display: 'flex', alignItems: 'center', gap: '0.4rem', boxShadow: '0 4px 12px rgba(0,0,0,0.3)' }}>
                      <LicenseIcon style={{ width: '1rem', height: '1rem', color: 'white' }} />
                      <span style={{ color: 'white', fontWeight: 700, fontSize: '0.875rem' }}>{vehicle.licenseType}</span>
                    </div>
                  </div>

                  <div style={{ padding: '1.25rem 1.5rem 0.75rem' }}>
                    <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.4rem' }}>
                      {vehicle.name}
                    </h3>
                    <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                      {vehicle.description}
                    </p>
                  </div>

                  <div style={{ padding: '0 1.5rem 1.5rem' }}>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        className="btn-outline"
                        style={{ flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', fontSize: '0.8rem', padding: '0.5rem 0.75rem' }}
                        onClick={() => openEditDialog(vehicle)}
                      >
                        <Edit className="w-3 h-3" />
                        {language === 'ar' ? 'تعديل' : language === 'fr' ? 'Modifier' : 'Edit'}
                      </button>

                      <button
                        style={{ flex: 1, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#FCA5A5', borderRadius: 'var(--radius-full)', padding: '8px 16px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                        onClick={() => handleDeleteVehicle(vehicle.id, vehicle.name)}
                      >
                        <Trash2 className="w-3 h-3" />
                        {language === 'ar' ? 'حذف' : language === 'fr' ? 'Supprimer' : 'Delete'}
                      </button>

                      <button
                        style={{
                          flex: 1,
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.4rem',
                          padding: '8px',
                          borderRadius: 'var(--radius-full)',
                          border: vehicle.disabled ? '1px solid rgba(74,222,128,0.35)' : '1px solid rgba(245,166,35,0.35)',
                          background: vehicle.disabled ? 'rgba(74,222,128,0.1)' : 'rgba(245,166,35,0.1)',
                          color: vehicle.disabled ? '#4ade80' : 'var(--primary)',
                          fontWeight: 600,
                          fontSize: '0.8rem',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease'
                        }}
                        onClick={() => handleToggleDisabled(vehicle.id, vehicle.disabled)}
                      >
                        {vehicle.disabled
                          ? (language === 'ar' ? 'تفعيل' : language === 'fr' ? 'Activer' : 'Enable')
                          : (language === 'ar' ? 'تعطيل' : language === 'fr' ? 'Désactiver' : 'Disable')}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
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

const ManageVehicles = () => {
  return (
    <LanguageProvider>
      <ManageVehiclesContent />
    </LanguageProvider>
  );
};

export default ManageVehicles;
