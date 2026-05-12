import { useState, useEffect } from 'react';
import { LanguageProvider, useLanguage } from '../contexts/LanguageContext';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { supabase } from '../supabase';
import '../components/style/theme.css';
import {
  Users, Loader2, Award, Phone, Mail, Calendar,
  Clock, Filter, Shield, Star
} from 'lucide-react';

interface Teacher {
  id: string;
  name: string;
  email: string;
  phone: string;
  licenseType: string;
  photoURL?: string;
  experience?: string;
  specialization?: string;
  workDays?: Record<string, { enabled: boolean; hours: string[] }>;
}

const DAY_LABELS: Record<string, { ar: string; fr: string; en: string }> = {
  sunday:    { ar: 'أحد',    fr: 'Dim', en: 'Sun' },
  monday:    { ar: 'اثنين',  fr: 'Lun', en: 'Mon' },
  tuesday:   { ar: 'ثلاثاء', fr: 'Mar', en: 'Tue' },
  wednesday: { ar: 'أربعاء', fr: 'Mer', en: 'Wed' },
  thursday:  { ar: 'خميس',   fr: 'Jeu', en: 'Thu' },
  friday:    { ar: 'جمعة',   fr: 'Ven', en: 'Fri' },
  saturday:  { ar: 'سبت',    fr: 'Sam', en: 'Sat' },
};

const LICENSE_PALETTE: Record<string, string> = {
  A: '#F5A623',
  B: '#60A5FA',
  C: '#34D399',
  D: '#C084FC',
};

const getLicenseColor = (type: string) => LICENSE_PALETTE[type] || '#94A3B8';

/* Returns initials for avatar fallback */
const getInitials = (name: string) => {
  const parts = (name || '').trim().split(/\s+/);
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
};

const InstructorsContent = () => {
  const { language } = useLanguage();
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLicense, setSelectedLicense] = useState<string>('all');
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const t = (ar: string, fr: string, en: string) =>
    language === 'ar' ? ar : language === 'fr' ? fr : en;

  useEffect(() => { fetchTeachers(); }, []);

  const fetchTeachers = async () => {
    try {
      const { data, error } = await supabase.from('users').select('*').eq('role', 'teacher');
      if (error) throw error;
      setTeachers(
        (data || []).map(d => ({
          id: d.id,
          name: d.fullName || d.name,
          email: d.email,
          phone: d.phone,
          licenseType: d.licenseType || 'B',
          photoURL: d.photoURL,
          experience: d.experience,
          specialization: d.specialization,
          workDays: d.workDays || null,
        }))
      );
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const licenseTypes = ['all', ...Array.from(new Set(teachers.map(tc => tc.licenseType)))];
  const filtered = selectedLicense === 'all'
    ? teachers
    : teachers.filter(tc => tc.licenseType === selectedLicense);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-darkest)', color: 'var(--text-primary)' }}>
      <Navbar />

      <main style={{ paddingTop: '100px', paddingBottom: '4rem' }}>

        {/* ── Page Header ── */}
        <div style={{
          background: 'linear-gradient(180deg, var(--bg-dark) 0%, var(--bg-darkest) 100%)',
          borderBottom: '1px solid var(--border)',
          padding: '3rem 1.5rem 2.5rem',
          marginBottom: '2.5rem',
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden',
        }}>
          {/* Ambient glow */}
          <div style={{
            position: 'absolute', top: '-60px', left: '50%', transform: 'translateX(-50%)',
            width: '600px', height: '240px',
            background: 'radial-gradient(ellipse, rgba(245,166,35,0.07) 0%, transparent 70%)',
            pointerEvents: 'none',
          }} />

          <div style={{ position: 'relative', zIndex: 1 }}>
            <span className="section-label">
              <Users style={{ width: '0.85rem', height: '0.85rem' }} />
              {t('فريق التدريب', 'Équipe Pédagogique', 'Teaching Team')}
            </span>

            <h1 className="section-title" style={{ marginBottom: '0.75rem' }}>
              <span style={{
                background: 'var(--grad-gold)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}>
                {t('المدربون', 'Instructeurs', 'Instructors')}
              </span>
            </h1>

            <p className="section-subtitle" style={{ margin: '0 auto' }}>
              {t(
                'تعرف على فريق المدربين المحترفين المعتمدين لدينا',
                "Rencontrez notre équipe d'instructeurs professionnels certifiés",
                'Meet our certified professional instructor team'
              )}
            </p>

            {!loading && (
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                marginTop: '1.25rem',
                padding: '0.5rem 1.25rem',
                background: 'rgba(245,166,35,0.08)',
                border: '1px solid var(--border-gold)',
                borderRadius: 'var(--radius-full)',
              }}>
                <Users style={{ width: '0.9rem', height: '0.9rem', color: 'var(--primary)' }} />
                <span style={{ color: 'var(--primary)', fontWeight: 700, fontSize: '0.9rem' }}>
                  {teachers.length}
                </span>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                  {t('مدرب', 'instructeur(s)', 'instructor(s)')}
                </span>
              </div>
            )}
          </div>
        </div>

        <div style={{ maxWidth: '1300px', margin: '0 auto', padding: '0 1.5rem' }}>

          {/* ── License Filter ── */}
          {licenseTypes.length > 1 && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.625rem',
              flexWrap: 'wrap',
              marginBottom: '2rem',
              padding: '1rem 1.25rem',
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-lg)',
            }}>
              <Filter style={{ width: '0.9rem', height: '0.9rem', color: 'var(--text-muted)', flexShrink: 0 }} />
              {licenseTypes.map(type => {
                const active = selectedLicense === type;
                const color = type === 'all' ? 'var(--primary)' : getLicenseColor(type);
                return (
                  <button
                    key={type}
                    onClick={() => setSelectedLicense(type)}
                    style={{
                      padding: '0.45rem 1.1rem',
                      borderRadius: 'var(--radius-full)',
                      border: active ? `1.5px solid ${color}` : '1.5px solid var(--border)',
                      background: active ? `${color}20` : 'transparent',
                      color: active ? color : 'var(--text-secondary)',
                      fontWeight: 600,
                      fontSize: '0.8125rem',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      whiteSpace: 'nowrap',
                    }}
                    onMouseEnter={e => {
                      if (!active) {
                        (e.currentTarget as HTMLButtonElement).style.borderColor = color;
                        (e.currentTarget as HTMLButtonElement).style.color = color;
                      }
                    }}
                    onMouseLeave={e => {
                      if (!active) {
                        (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border)';
                        (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-secondary)';
                      }
                    }}
                  >
                    {type === 'all'
                      ? t('الكل', 'Tous', 'All')
                      : `${t('رخصة', 'Permis', 'License')} ${type}`}
                  </button>
                );
              })}
            </div>
          )}

          {/* ── Loading ── */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: '6rem 2rem' }}>
              <Loader2
                className="animate-spin"
                style={{ width: '3rem', height: '3rem', margin: '0 auto', color: 'var(--primary)' }}
              />
              <p style={{ color: 'var(--text-muted)', marginTop: '1rem', fontSize: '0.9375rem' }}>
                {t('جار التحميل…', 'Chargement…', 'Loading…')}
              </p>
            </div>

          ) : filtered.length === 0 ? (
            /* ── Empty State ── */
            <div style={{
              textAlign: 'center',
              padding: '5rem 2rem',
              background: 'var(--grad-card)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-xl)',
            }}>
              <div style={{
                width: '5rem', height: '5rem', borderRadius: '50%',
                background: 'rgba(245,166,35,0.08)',
                border: '1px solid var(--border-gold)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 1.25rem',
              }}>
                <Users style={{ width: '2.5rem', height: '2.5rem', color: 'var(--primary)', opacity: 0.6 }} />
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-white)', marginBottom: '0.5rem' }}>
                {t('لا يوجد مدربون', 'Aucun instructeur', 'No instructors found')}
              </h3>
              <p style={{ color: 'var(--text-muted)' }}>
                {t('لم يتم إضافة أي مدربين بعد', 'Aucun instructeur ajouté pour le moment', 'No instructors added yet')}
              </p>
            </div>

          ) : (
            /* ── Instructor Cards Grid ── */
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(310px, 1fr))',
              gap: '1.5rem',
            }}>
              {filtered.map(teacher => {
                const isHovered = hoveredId === teacher.id;
                const licenseColor = getLicenseColor(teacher.licenseType);
                const enabledDays = teacher.workDays
                  ? Object.entries(teacher.workDays).filter(([, d]) => d.enabled)
                  : [];

                return (
                  <div
                    key={teacher.id}
                    onMouseEnter={() => setHoveredId(teacher.id)}
                    onMouseLeave={() => setHoveredId(null)}
                    style={{
                      background: 'var(--grad-card)',
                      border: isHovered
                        ? '1px solid var(--border-glow)'
                        : '1px solid var(--border)',
                      borderRadius: 'var(--radius-lg)',
                      overflow: 'hidden',
                      transition: 'all 0.3s var(--ease)',
                      boxShadow: isHovered
                        ? '0 0 0 1px var(--border-gold), var(--shadow-gold), 0 0 30px rgba(245,166,35,0.07)'
                        : 'var(--shadow-sm)',
                      transform: isHovered ? 'translateY(-6px)' : 'translateY(0)',
                    }}
                  >
                    {/* ── Avatar Banner ── */}
                    <div style={{
                      position: 'relative',
                      height: '160px',
                      background: teacher.photoURL
                        ? 'var(--bg-mid)'
                        : `linear-gradient(135deg, ${licenseColor}18 0%, rgba(17,21,35,0.9) 100%)`,
                      overflow: 'hidden',
                    }}>
                      {teacher.photoURL ? (
                        <img
                          src={teacher.photoURL}
                          alt={teacher.name}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      ) : (
                        <div style={{
                          width: '100%', height: '100%',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          {/* Large initials */}
                          <div style={{
                            width: '5.5rem', height: '5.5rem',
                            borderRadius: '50%',
                            background: 'var(--grad-gold)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '2rem', fontWeight: 800, color: '#000',
                            boxShadow: 'var(--shadow-gold)',
                            letterSpacing: '-0.02em',
                          }}>
                            {getInitials(teacher.name)}
                          </div>
                        </div>
                      )}

                      {/* Bottom gradient overlay */}
                      <div style={{
                        position: 'absolute', bottom: 0, left: 0, right: 0, height: '60px',
                        background: 'linear-gradient(to top, rgba(11,14,26,0.9), transparent)',
                      }} />

                      {/* License badge */}
                      <div style={{
                        position: 'absolute', top: '0.875rem', right: '0.875rem',
                        padding: '0.3rem 0.8rem',
                        background: `${licenseColor}22`,
                        border: `1.5px solid ${licenseColor}55`,
                        borderRadius: 'var(--radius-full)',
                        fontWeight: 700, fontSize: '0.775rem',
                        color: licenseColor,
                        backdropFilter: 'blur(8px)',
                      }}>
                        {t('رخصة', 'Permis', 'License')} {teacher.licenseType}
                      </div>

                      {/* Certified star badge */}
                      <div style={{
                        position: 'absolute', top: '0.875rem', left: '0.875rem',
                        width: '2rem', height: '2rem',
                        background: 'rgba(245,166,35,0.15)',
                        border: '1px solid var(--border-gold)',
                        borderRadius: '50%',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        backdropFilter: 'blur(8px)',
                      }}>
                        <Star style={{ width: '0.85rem', height: '0.85rem', color: 'var(--primary)', fill: 'var(--primary)' }} />
                      </div>
                    </div>

                    {/* ── Card Body ── */}
                    <div style={{ padding: '1.25rem 1.375rem 1.375rem' }}>

                      {/* Name + certified label */}
                      <div style={{ marginBottom: '1rem' }}>
                        <h3 style={{
                          fontSize: '1.0625rem', fontWeight: 700,
                          color: 'var(--text-white)',
                          marginBottom: '0.25rem',
                          letterSpacing: '-0.01em',
                        }}>
                          {teacher.name}
                        </h3>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <Shield style={{ width: '0.75rem', height: '0.75rem', color: 'var(--primary)' }} />
                          <span style={{ fontSize: '0.775rem', color: 'var(--primary)', fontWeight: 600 }}>
                            {t('مدرب معتمد', 'Instructeur certifié', 'Certified Instructor')}
                          </span>
                        </div>
                      </div>

                      {/* Experience */}
                      {teacher.experience && (
                        <div style={{
                          padding: '0.5rem 0.875rem',
                          background: 'rgba(245,166,35,0.06)',
                          border: '1px solid var(--border-gold)',
                          borderRadius: 'var(--radius-md)',
                          marginBottom: '0.875rem',
                          display: 'flex', alignItems: 'center', gap: '0.5rem',
                        }}>
                          <Award style={{ width: '0.85rem', height: '0.85rem', color: 'var(--primary)', flexShrink: 0 }} />
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
                            {teacher.experience}
                          </span>
                        </div>
                      )}

                      {/* Contact info */}
                      <div style={{
                        display: 'flex', flexDirection: 'column', gap: '0.45rem',
                        marginBottom: '0.875rem',
                      }}>
                        <div style={{
                          display: 'flex', alignItems: 'center', gap: '0.625rem',
                          padding: '0.45rem 0.75rem',
                          background: 'rgba(255,255,255,0.03)',
                          border: '1px solid var(--border)',
                          borderRadius: 'var(--radius-sm)',
                        }}>
                          <Phone style={{ width: '0.8rem', height: '0.8rem', color: '#34D399', flexShrink: 0 }} />
                          <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
                            {teacher.phone}
                          </span>
                        </div>
                        <div style={{
                          display: 'flex', alignItems: 'center', gap: '0.625rem',
                          padding: '0.45rem 0.75rem',
                          background: 'rgba(255,255,255,0.03)',
                          border: '1px solid var(--border)',
                          borderRadius: 'var(--radius-sm)',
                        }}>
                          <Mail style={{ width: '0.8rem', height: '0.8rem', color: '#60A5FA', flexShrink: 0 }} />
                          <span style={{
                            fontSize: '0.775rem', color: 'var(--text-secondary)', fontWeight: 500,
                            wordBreak: 'break-all', overflow: 'hidden', textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}>
                            {teacher.email}
                          </span>
                        </div>
                      </div>

                      {/* Work Days */}
                      {enabledDays.length > 0 && (
                        <div>
                          <div style={{
                            display: 'flex', alignItems: 'center', gap: '0.375rem',
                            marginBottom: '0.5rem',
                          }}>
                            <Calendar style={{ width: '0.8rem', height: '0.8rem', color: 'var(--primary)' }} />
                            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                              {t('أيام العمل', 'Jours de travail', 'Work Days')}
                            </span>
                          </div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                            {enabledDays.map(([day, d]) => (
                              <span
                                key={day}
                                style={{
                                  display: 'inline-flex', alignItems: 'center', gap: '0.25rem',
                                  padding: '0.25rem 0.6rem',
                                  borderRadius: 'var(--radius-full)',
                                  background: 'rgba(245,166,35,0.1)',
                                  border: '1px solid var(--border-gold)',
                                  fontSize: '0.7rem', fontWeight: 700,
                                  color: 'var(--primary)',
                                }}
                              >
                                {DAY_LABELS[day]?.[language as 'ar' | 'fr' | 'en'] ?? day}
                                {d.hours.length > 0 && (
                                  <span style={{
                                    display: 'inline-flex', alignItems: 'center', gap: '0.2rem',
                                    color: 'var(--text-muted)', fontWeight: 500,
                                  }}>
                                    <Clock style={{ width: '0.6rem', height: '0.6rem' }} />
                                    {d.hours[0]}
                                  </span>
                                )}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

const Instructors = () => (
  <LanguageProvider>
    <InstructorsContent />
  </LanguageProvider>
);

export default Instructors;
