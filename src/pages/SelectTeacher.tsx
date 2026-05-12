import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../supabase';
import { useLanguage } from '../contexts/LanguageContext';
import { ArrowLeft, User, Calendar, Clock, Loader2 } from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import '../components/style/theme.css';

interface Teacher {
  id: string;
  name: string;
  email: string;
  phone: string;
  licenseType: string;
  workDays?: string[];
  workHours?: {
    start: string;
    end: string;
  };
}

const SelectTeacherContent = () => {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTeacher, setSelectedTeacher] = useState<string | null>(null);

  const licenseType = location.state?.licenseType;

  useEffect(() => {
    if (!licenseType) {
      navigate('/register');
      return;
    }
    fetchTeachers();
  }, [licenseType, navigate]);

  const fetchTeachers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('role', 'teacher')
        .eq('licenseType', licenseType);
      if (error) throw error;
      setTeachers((data || []) as Teacher[]);
    } catch (error) {
      console.error('Error fetching teachers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectTeacher = (teacherId: string) => {
    setSelectedTeacher(teacherId);
  };

  const handleContinue = () => {
    navigate('/register', {
      state: {
        licenseType,
        selectedTeacher: selectedTeacher ? teachers.find(t => t.id === selectedTeacher) : null
      }
    });
  };

  const handleSkip = () => {
    navigate('/register', { state: { licenseType, selectedTeacher: null } });
  };

  const getDayName = (day: string) => {
    const dayNames = {
      ar: {
        sunday: 'الأحد',
        monday: 'الاثنين',
        tuesday: 'الثلاثاء',
        wednesday: 'الأربعاء',
        thursday: 'الخميس',
        friday: 'الجمعة',
        saturday: 'السبت'
      },
      fr: {
        sunday: 'Dimanche',
        monday: 'Lundi',
        tuesday: 'Mardi',
        wednesday: 'Mercredi',
        thursday: 'Jeudi',
        friday: 'Vendredi',
        saturday: 'Samedi'
      },
      en: {
        sunday: 'Sunday',
        monday: 'Monday',
        tuesday: 'Tuesday',
        wednesday: 'Wednesday',
        thursday: 'Thursday',
        friday: 'Friday',
        saturday: 'Saturday'
      }
    };

    return dayNames[language as keyof typeof dayNames][day as keyof typeof dayNames.ar] || day;
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg-darkest)', color: 'var(--text-primary)' }}>
        <Navbar />
        <main style={{ paddingTop: '120px', paddingBottom: '3rem' }}>
          <div style={{ textAlign: 'center', padding: '3rem' }}>
            <Loader2
              className="animate-spin"
              size={48}
              style={{ margin: '0 auto', color: 'var(--primary)' }}
            />
            <p style={{ marginTop: '1.25rem', fontSize: '1.125rem', color: 'var(--text-secondary)' }}>
              {language === 'ar' ? 'جاري تحميل الأساتذة...' : language === 'fr' ? 'Chargement des instructeurs...' : 'Loading instructors...'}
            </p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-darkest)', color: 'var(--text-primary)' }}>
      <Navbar />

      <main style={{ paddingTop: '100px', paddingBottom: '3rem', paddingLeft: '1.5rem', paddingRight: '1.5rem' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
          <div>
            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
              <h1 style={{
                fontSize: '2.25rem',
                fontWeight: 800,
                marginBottom: '0.75rem',
                background: 'var(--grad-gold)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}>
                {language === 'ar' ? 'اختيار الأستاذ' : language === 'fr' ? 'Choisir un instructeur' : 'Choose an Instructor'}
              </h1>
              <p style={{ color: 'var(--text-secondary)', fontSize: '1.125rem' }}>
                {language === 'ar'
                  ? `اختر أستاذاً لرخصة ${licenseType} (اختياري)`
                  : language === 'fr'
                  ? `Choisissez un instructeur pour le permis ${licenseType} (optionnel)`
                  : `Choose an instructor for license ${licenseType} (optional)`}
              </p>
            </div>

            {/* Back button */}
            <div style={{ marginBottom: '2rem' }}>
              <button
                className="btn-ghost"
                onClick={() => navigate('/register')}
              >
                <ArrowLeft
                  size={18}
                  style={{
                    marginRight: language === 'ar' ? '0' : '0.25rem',
                    marginLeft: language === 'ar' ? '0.25rem' : '0'
                  }}
                />
                {language === 'ar' ? 'العودة' : language === 'fr' ? 'Retour' : 'Back'}
              </button>
            </div>

            {teachers.length === 0 ? (
              /* Empty state */
              <div style={{
                background: 'var(--grad-card)',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--border)',
                padding: '3rem',
                textAlign: 'center'
              }}>
                <div style={{
                  width: '5rem',
                  height: '5rem',
                  borderRadius: '50%',
                  background: 'var(--bg-mid)',
                  border: '1px solid var(--border)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 1.25rem'
                }}>
                  <User size={36} style={{ color: 'var(--text-muted)' }} />
                </div>
                <h3 style={{ marginBottom: '0.75rem', fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-white)' }}>
                  {language === 'ar' ? 'لا يوجد أساتذة متاحون' : language === 'fr' ? 'Aucun instructeur disponible' : 'No instructors available'}
                </h3>
                <p style={{ marginBottom: '1.75rem', color: 'var(--text-secondary)' }}>
                  {language === 'ar'
                    ? `لا يوجد أساتذة متاحون لرخصة ${licenseType} حالياً`
                    : language === 'fr'
                    ? `Aucun instructeur disponible pour le permis ${licenseType} actuellement`
                    : `No instructors available for license ${licenseType} currently`}
                </p>
                <button className="btn-primary" onClick={handleSkip}>
                  {language === 'ar' ? 'متابعة بدون أستاذ' : language === 'fr' ? 'Continuer sans instructeur' : 'Continue without instructor'}
                </button>
              </div>
            ) : (
              <>
                {/* Teacher list */}
                <div style={{ display: 'grid', gap: '1rem', marginBottom: '2rem' }}>
                  {teachers.map((teacher) => {
                    const isSelected = selectedTeacher === teacher.id;
                    return (
                      <div
                        key={teacher.id}
                        onClick={() => handleSelectTeacher(teacher.id)}
                        style={{
                          cursor: 'pointer',
                          background: isSelected ? 'rgba(245,166,35,0.06)' : 'var(--grad-card)',
                          borderRadius: 'var(--radius-md)',
                          border: isSelected ? '2px solid var(--primary)' : '1px solid var(--border)',
                          boxShadow: isSelected ? 'var(--shadow-gold)' : 'none',
                          padding: '1.5rem',
                          transition: 'all var(--duration-normal) var(--ease)'
                        }}
                        onMouseEnter={(e) => {
                          if (!isSelected) {
                            (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--border-gold)';
                            (e.currentTarget as HTMLDivElement).style.boxShadow = '0 4px 20px rgba(245,166,35,0.15)';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!isSelected) {
                            (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--border)';
                            (e.currentTarget as HTMLDivElement).style.boxShadow = 'none';
                          }
                        }}
                      >
                        <div style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                          gap: '1rem',
                          alignItems: 'center'
                        }}>
                          {/* Teacher info */}
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                              {/* Avatar circle */}
                              <div style={{
                                width: '2.75rem',
                                height: '2.75rem',
                                borderRadius: '50%',
                                background: isSelected ? 'rgba(245,166,35,0.2)' : 'var(--bg-mid)',
                                border: isSelected ? '1.5px solid var(--primary)' : '1.5px solid var(--border)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0
                              }}>
                                <User size={18} style={{ color: isSelected ? 'var(--primary)' : 'var(--text-secondary)' }} />
                              </div>
                              <h3 style={{ fontSize: '1.0625rem', fontWeight: 600, color: 'var(--text-white)' }}>
                                {teacher.name}
                              </h3>
                              {isSelected && (
                                <span className="badge-pro badge-gold">
                                  {language === 'ar' ? 'مختار' : language === 'fr' ? 'Sélectionné' : 'Selected'}
                                </span>
                              )}
                            </div>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '0.2rem' }}>
                              {teacher.email}
                            </p>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                              {teacher.phone}
                            </p>
                          </div>

                          {/* Work days */}
                          {teacher.workDays && teacher.workDays.length > 0 && (
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                <Calendar size={15} style={{ color: 'var(--text-muted)' }} />
                                <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                  {language === 'ar' ? 'أيام العمل' : language === 'fr' ? 'Jours de travail' : 'Work days'}
                                </span>
                              </div>
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                                {teacher.workDays.map((day) => (
                                  <span key={day} className="badge-pro badge-info" style={{ fontSize: '0.75rem' }}>
                                    {getDayName(day)}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Work hours */}
                          {teacher.workHours && (
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                <Clock size={15} style={{ color: 'var(--text-muted)' }} />
                                <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                  {language === 'ar' ? 'ساعات العمل' : language === 'fr' ? 'Heures de travail' : 'Work hours'}
                                </span>
                              </div>
                              <p style={{ fontSize: '0.9375rem', color: 'var(--text-primary)', fontWeight: 500 }}>
                                {teacher.workHours.start} – {teacher.workHours.end}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Action buttons */}
                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                  <button className="btn-outline" onClick={handleSkip}>
                    {language === 'ar' ? 'تخطي' : language === 'fr' ? 'Passer' : 'Skip'}
                  </button>
                  <button
                    className="btn-primary"
                    onClick={handleContinue}
                    disabled={!selectedTeacher}
                    style={{ opacity: selectedTeacher ? 1 : 0.45, cursor: selectedTeacher ? 'pointer' : 'not-allowed' }}
                  >
                    {language === 'ar' ? 'متابعة' : language === 'fr' ? 'Continuer' : 'Continue'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

const SelectTeacher = () => {
  return <SelectTeacherContent />;
};

export default SelectTeacher;
