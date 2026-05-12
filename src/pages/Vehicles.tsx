import { useState, useEffect } from 'react';
import { LanguageProvider, useLanguage } from '../contexts/LanguageContext';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { supabase } from '../supabase';
import '../components/style/theme.css';
import {
  Car, Loader2, Calendar, Users, Search, Filter,
  Shield, Fuel, Award
} from 'lucide-react';

interface Vehicle {
  id: string;
  brand: string;
  model: string;
  year: string;
  licensePlate: string;
  licenseType: string;
  imageUrl?: string;
  fuelType?: string;
  transmission?: string;
  seats?: number;
  createdAt: string;
}

const VehiclesContent = () => {
  const { language } = useLanguage();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLicense, setSelectedLicense] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const t = (ar: string, fr: string, en: string) =>
    language === 'ar' ? ar : language === 'fr' ? fr : en;

  useEffect(() => {
    fetchVehicles();
  }, []);

  const fetchVehicles = async () => {
    try {
      const { data, error } = await supabase.from('vehicles').select('*');
      if (error) throw error;
      setVehicles(
        (data || []).map(v => ({
          id: v.id,
          brand: v.brand,
          model: v.model,
          year: v.year,
          licensePlate: v.licensePlate || v.plateNumber,
          licenseType: v.licenseType || 'B',
          imageUrl: v.imageUrl,
          fuelType: v.fuelType,
          transmission: v.transmission,
          seats: v.seats,
          createdAt: v.createdAt,
        }))
      );
    } catch (error) {
      console.error('Error fetching vehicles:', error);
    } finally {
      setLoading(false);
    }
  };

  const licenseTypes = ['all', ...Array.from(new Set(vehicles.map(v => v.licenseType)))];

  const filteredVehicles = vehicles.filter(v => {
    const matchesLicense = selectedLicense === 'all' || v.licenseType === selectedLicense;
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !q ||
      v.brand?.toLowerCase().includes(q) ||
      v.model?.toLowerCase().includes(q) ||
      v.licensePlate?.toLowerCase().includes(q);
    return matchesLicense && matchesSearch;
  });

  const getLicenseBadgeColor = (type: string) => {
    const map: Record<string, string> = { A: '#F5A623', B: '#60A5FA', C: '#34D399', D: '#C084FC' };
    return map[type] || '#94A3B8';
  };

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
          {/* decorative orbs */}
          <div style={{
            position: 'absolute', top: '-60px', left: '50%', transform: 'translateX(-50%)',
            width: '500px', height: '200px',
            background: 'radial-gradient(ellipse, rgba(245,166,35,0.08) 0%, transparent 70%)',
            pointerEvents: 'none',
          }} />

          <div style={{ position: 'relative', zIndex: 1 }}>
            <span className="section-label">
              <Car style={{ width: '0.85rem', height: '0.85rem' }} />
              {t('أسطول المركبات', 'Notre Flotte', 'Our Fleet')}
            </span>

            <h1 className="section-title" style={{ marginBottom: '0.75rem' }}>
              <span style={{
                background: 'var(--grad-gold)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}>
                {t('المركبات', 'Véhicules', 'Vehicles')}
              </span>
            </h1>

            <p className="section-subtitle" style={{ margin: '0 auto' }}>
              {t(
                'اكتشف أسطولنا الحديث من مركبات التدريب المجهزة بأحدث التقنيات',
                'Découvrez notre flotte moderne de véhicules de formation équipés des dernières technologies',
                'Discover our modern fleet of training vehicles equipped with the latest technology'
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
                <Car style={{ width: '0.9rem', height: '0.9rem', color: 'var(--primary)' }} />
                <span style={{ color: 'var(--primary)', fontWeight: 700, fontSize: '0.9rem' }}>
                  {vehicles.length}
                </span>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                  {t('مركبة', 'véhicule(s)', 'vehicle(s)')}
                </span>
              </div>
            )}
          </div>
        </div>

        <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 1.5rem' }}>

          {/* ── Filter Bar ── */}
          <div style={{
            display: 'flex',
            gap: '1rem',
            flexWrap: 'wrap',
            alignItems: 'center',
            marginBottom: '2rem',
            padding: '1.25rem 1.5rem',
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)',
          }}>
            {/* Search */}
            <div style={{ position: 'relative', flex: '1 1 220px', minWidth: '180px' }}>
              <Search style={{
                position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)',
                width: '1rem', height: '1rem', color: 'var(--text-muted)',
              }} />
              <input
                className="input-pro"
                placeholder={t('ابحث عن مركبة…', 'Rechercher un véhicule…', 'Search vehicles…')}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{ paddingLeft: '2.5rem' }}
              />
            </div>

            {/* License filter pills */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <Filter style={{ width: '0.9rem', height: '0.9rem', color: 'var(--text-muted)', flexShrink: 0 }} />
              {licenseTypes.map(type => {
                const active = selectedLicense === type;
                const color = type === 'all' ? 'var(--primary)' : getLicenseBadgeColor(type);
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
          </div>

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

          ) : filteredVehicles.length === 0 ? (
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
                <Car style={{ width: '2.5rem', height: '2.5rem', color: 'var(--primary)', opacity: 0.6 }} />
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-white)', marginBottom: '0.5rem' }}>
                {t('لا توجد مركبات', 'Aucun véhicule', 'No vehicles found')}
              </h3>
              <p style={{ color: 'var(--text-muted)' }}>
                {searchQuery
                  ? t('حاول البحث بكلمة مختلفة', 'Essayez un autre terme de recherche', 'Try a different search term')
                  : t('لم يتم إضافة أي مركبات بعد', 'Aucun véhicule ajouté pour le moment', 'No vehicles added yet')}
              </p>
            </div>

          ) : (
            /* ── Vehicle Cards Grid ── */
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
              gap: '1.5rem',
            }}>
              {filteredVehicles.map(vehicle => {
                const isHovered = hoveredId === vehicle.id;
                const licenseColor = getLicenseBadgeColor(vehicle.licenseType);

                return (
                  <div
                    key={vehicle.id}
                    onMouseEnter={() => setHoveredId(vehicle.id)}
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
                        ? '0 0 0 1px var(--border-gold), var(--shadow-gold), 0 0 30px rgba(245,166,35,0.08)'
                        : 'var(--shadow-sm)',
                      transform: isHovered ? 'translateY(-6px)' : 'translateY(0)',
                      cursor: 'default',
                    }}
                  >
                    {/* Image / Placeholder Banner */}
                    <div style={{
                      position: 'relative',
                      width: '100%',
                      height: '200px',
                      background: vehicle.imageUrl
                        ? 'var(--bg-mid)'
                        : 'linear-gradient(135deg, rgba(245,166,35,0.12) 0%, rgba(255,107,53,0.08) 100%)',
                      overflow: 'hidden',
                    }}>
                      {vehicle.imageUrl ? (
                        <img
                          src={vehicle.imageUrl}
                          alt={`${vehicle.brand} ${vehicle.model}`}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      ) : (
                        <div style={{
                          width: '100%', height: '100%',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          <Car style={{
                            width: '5rem', height: '5rem',
                            color: 'var(--primary)', opacity: 0.25,
                          }} />
                        </div>
                      )}

                      {/* Overlay gradient at bottom */}
                      <div style={{
                        position: 'absolute', bottom: 0, left: 0, right: 0, height: '70px',
                        background: 'linear-gradient(to top, rgba(11,14,26,0.85), transparent)',
                      }} />

                      {/* License type badge */}
                      <div style={{
                        position: 'absolute', top: '0.875rem', right: '0.875rem',
                        padding: '0.3rem 0.8rem',
                        background: `${licenseColor}22`,
                        border: `1.5px solid ${licenseColor}55`,
                        borderRadius: 'var(--radius-full)',
                        fontWeight: 700, fontSize: '0.8rem',
                        color: licenseColor,
                        backdropFilter: 'blur(8px)',
                      }}>
                        {t('رخصة', 'Permis', 'License')} {vehicle.licenseType}
                      </div>
                    </div>

                    {/* Card Body */}
                    <div style={{ padding: '1.25rem 1.5rem 1.5rem' }}>
                      {/* Name */}
                      <h3 style={{
                        fontSize: '1.125rem', fontWeight: 700,
                        color: 'var(--text-white)',
                        marginBottom: '0.25rem',
                        letterSpacing: '-0.01em',
                      }}>
                        {vehicle.brand} {vehicle.model}
                      </h3>

                      {/* License plate */}
                      <p style={{
                        fontSize: '0.8125rem', color: 'var(--text-muted)',
                        fontFamily: 'monospace', letterSpacing: '0.06em',
                        marginBottom: '1rem',
                      }}>
                        {vehicle.licensePlate}
                      </p>

                      {/* Feature chips row */}
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
                        {/* Year */}
                        {vehicle.year && (
                          <span style={{
                            display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
                            padding: '0.3rem 0.75rem',
                            background: 'rgba(255,255,255,0.04)',
                            border: '1px solid var(--border)',
                            borderRadius: 'var(--radius-full)',
                            fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 500,
                          }}>
                            <Calendar style={{ width: '0.7rem', height: '0.7rem' }} />
                            {vehicle.year}
                          </span>
                        )}

                        {/* Transmission */}
                        {vehicle.transmission && (
                          <span style={{
                            display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
                            padding: '0.3rem 0.75rem',
                            background: 'rgba(255,255,255,0.04)',
                            border: '1px solid var(--border)',
                            borderRadius: 'var(--radius-full)',
                            fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 500,
                          }}>
                            <Shield style={{ width: '0.7rem', height: '0.7rem' }} />
                            {vehicle.transmission === 'manual'
                              ? t('يدوي', 'Manuelle', 'Manual')
                              : t('أوتوماتيك', 'Automatique', 'Automatic')}
                          </span>
                        )}

                        {/* Fuel */}
                        {vehicle.fuelType && (
                          <span style={{
                            display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
                            padding: '0.3rem 0.75rem',
                            background: 'rgba(255,255,255,0.04)',
                            border: '1px solid var(--border)',
                            borderRadius: 'var(--radius-full)',
                            fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 500,
                          }}>
                            <Fuel style={{ width: '0.7rem', height: '0.7rem' }} />
                            {vehicle.fuelType === 'diesel'
                              ? t('ديزل', 'Diesel', 'Diesel')
                              : t('بنزين', 'Essence', 'Gasoline')}
                          </span>
                        )}

                        {/* Seats */}
                        {vehicle.seats && (
                          <span style={{
                            display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
                            padding: '0.3rem 0.75rem',
                            background: 'rgba(255,255,255,0.04)',
                            border: '1px solid var(--border)',
                            borderRadius: 'var(--radius-full)',
                            fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 500,
                          }}>
                            <Users style={{ width: '0.7rem', height: '0.7rem' }} />
                            {vehicle.seats} {t('مقاعد', 'places', 'seats')}
                          </span>
                        )}
                      </div>

                      {/* Divider */}
                      <div style={{
                        height: '1px',
                        background: 'var(--border)',
                        marginBottom: '1rem',
                      }} />

                      {/* Availability badge */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span className="badge-pro badge-success" style={{ fontSize: '0.7375rem' }}>
                          <span style={{
                            width: '6px', height: '6px', borderRadius: '50%',
                            background: '#34D399', display: 'inline-block',
                          }} />
                          {t('متاح للتدريب', 'Disponible', 'Available')}
                        </span>
                        <span className="badge-pro badge-gold" style={{ fontSize: '0.7375rem' }}>
                          <Award style={{ width: '0.7rem', height: '0.7rem' }} />
                          {t('معتمد', 'Certifié', 'Certified')}
                        </span>
                      </div>
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

const Vehicles = () => (
  <LanguageProvider>
    <VehiclesContent />
  </LanguageProvider>
);

export default Vehicles;
