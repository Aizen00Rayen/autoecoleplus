import type { WorkDays } from '../utils/scheduleGenerator';
import { getDefaultWorkHours } from '../utils/scheduleGenerator';
import { Clock } from 'lucide-react';

interface WorkDaysSelectorProps {
  workDays: WorkDays;
  onChange: (workDays: WorkDays) => void;
  language: 'ar' | 'fr' | 'en';
}

const WorkDaysSelector = ({ workDays, onChange, language }: WorkDaysSelectorProps) => {
  const dir = language === 'ar' ? 'rtl' : 'ltr';

  const daysLabels = {
    sunday:    { ar: 'الأحد',    fr: 'Dim',  en: 'Sun' },
    monday:    { ar: 'الاثنين',  fr: 'Lun',  en: 'Mon' },
    tuesday:   { ar: 'الثلاثاء', fr: 'Mar',  en: 'Tue' },
    wednesday: { ar: 'الأربعاء', fr: 'Mer',  en: 'Wed' },
    thursday:  { ar: 'الخميس',   fr: 'Jeu',  en: 'Thu' },
    friday:    { ar: 'الجمعة',   fr: 'Ven',  en: 'Fri' },
    saturday:  { ar: 'السبت',    fr: 'Sam',  en: 'Sat' },
  };

  const availableHours = getDefaultWorkHours();

  const handleDayToggle = (day: string) => {
    const next = { ...workDays };
    next[day as keyof WorkDays].enabled = !next[day as keyof WorkDays].enabled;
    if (next[day as keyof WorkDays].enabled && next[day as keyof WorkDays].hours.length === 0) {
      next[day as keyof WorkDays].hours = [...availableHours];
    }
    onChange(next);
  };

  const handleHourToggle = (day: string, hour: string) => {
    const next = { ...workDays };
    const cfg = next[day as keyof WorkDays];
    cfg.hours = cfg.hours.includes(hour)
      ? cfg.hours.filter(h => h !== hour)
      : [...cfg.hours, hour].sort();
    onChange(next);
  };

  const totalDays  = Object.values(workDays).filter(c => c.enabled).length;
  const totalHours = Object.values(workDays).reduce((s, c) => s + (c.enabled ? c.hours.length : 0), 0);

  return (
    <div dir={dir} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

      {/* اختيار الأيام */}
      <div>
        <p style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {language === 'ar' ? 'أيام العمل' : language === 'fr' ? 'Jours de travail' : 'Work Days'}
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.5rem' }}>
          {Object.keys(daysLabels).map(day => {
            const enabled = workDays[day as keyof WorkDays].enabled;
            const hours   = workDays[day as keyof WorkDays].hours.length;
            return (
              <button
                key={day}
                type="button"
                onClick={() => handleDayToggle(day)}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '0.25rem',
                  padding: '0.75rem 0.25rem',
                  borderRadius: '0.75rem',
                  border: enabled ? '2px solid #3b82f6' : '2px solid #e2e8f0',
                  background: enabled ? 'linear-gradient(135deg, #eff6ff, #dbeafe)' : 'white',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  boxShadow: enabled ? '0 2px 8px rgba(59,130,246,0.2)' : 'none',
                }}
              >
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: enabled ? '#1d4ed8' : '#94a3b8' }}>
                  {daysLabels[day as keyof typeof daysLabels][language]}
                </span>
                {enabled && (
                  <span style={{ fontSize: '0.65rem', color: '#3b82f6', fontWeight: 600 }}>
                    {hours}h
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ساعات كل يوم مفعّل */}
      {Object.keys(daysLabels).map(day => {
        if (!workDays[day as keyof WorkDays].enabled) return null;
        const selectedHours = workDays[day as keyof WorkDays].hours;
        return (
          <div key={day} style={{ background: '#f8fafc', borderRadius: '1rem', padding: '1rem', border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Clock style={{ width: '1rem', height: '1rem', color: '#3b82f6' }} />
                <span style={{ fontWeight: 700, color: '#1e293b', fontSize: '0.9rem' }}>
                  {daysLabels[day as keyof typeof daysLabels][language]}
                </span>
                <span style={{ fontSize: '0.75rem', color: '#64748b', background: '#e2e8f0', padding: '0.1rem 0.5rem', borderRadius: '9999px' }}>
                  {selectedHours.length} {language === 'ar' ? 'ساعة' : language === 'fr' ? 'h' : 'h'}
                </span>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button type="button"
                  onClick={() => { const n = {...workDays}; n[day as keyof WorkDays].hours = [...availableHours]; onChange(n); }}
                  style={{ fontSize: '0.75rem', color: '#3b82f6', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' }}>
                  {language === 'ar' ? 'الكل' : language === 'fr' ? 'Tout' : 'All'}
                </button>
                <button type="button"
                  onClick={() => { const n = {...workDays}; n[day as keyof WorkDays].hours = []; onChange(n); }}
                  style={{ fontSize: '0.75rem', color: '#ef4444', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' }}>
                  {language === 'ar' ? 'مسح' : language === 'fr' ? 'Effacer' : 'Clear'}
                </button>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '0.4rem' }}>
              {availableHours.map(hour => {
                const active = selectedHours.includes(hour);
                return (
                  <button
                    key={hour}
                    type="button"
                    onClick={() => handleHourToggle(day, hour)}
                    style={{
                      padding: '0.4rem 0.25rem',
                      borderRadius: '0.5rem',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      border: active ? '2px solid #3b82f6' : '1px solid #e2e8f0',
                      background: active ? '#3b82f6' : 'white',
                      color: active ? 'white' : '#64748b',
                      cursor: 'pointer',
                      transition: 'all 0.15s',
                    }}
                  >
                    {hour}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* ملخص */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0.875rem 1.25rem',
        background: totalDays > 0 ? 'linear-gradient(135deg, #eff6ff, #dbeafe)' : '#fef9c3',
        borderRadius: '0.75rem',
        border: totalDays > 0 ? '1px solid #bfdbfe' : '1px solid #fde68a',
      }}>
        {totalDays > 0 ? (
          <>
            <span style={{ fontSize: '0.875rem', color: '#1d4ed8', fontWeight: 600 }}>
              {language === 'ar' ? `${totalDays} أيام عمل` : language === 'fr' ? `${totalDays} jours de travail` : `${totalDays} work days`}
            </span>
            <span style={{ fontSize: '0.875rem', color: '#1d4ed8', fontWeight: 700 }}>
              {language === 'ar' ? `${totalHours} ساعة إجمالاً` : language === 'fr' ? `${totalHours}h au total` : `${totalHours}h total`}
            </span>
          </>
        ) : (
          <span style={{ fontSize: '0.875rem', color: '#92400e', fontWeight: 600 }}>
            {language === 'ar' ? 'يرجى اختيار يوم عمل واحد على الأقل' : language === 'fr' ? 'Veuillez sélectionner au moins un jour' : 'Please select at least one work day'}
          </span>
        )}
      </div>

    </div>
  );
};

export default WorkDaysSelector;
