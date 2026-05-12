import { useState, useEffect } from 'react';
import { LanguageProvider, useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { supabase } from '../supabase';
import { Calendar, Clock, User, ChevronLeft, ChevronRight, BookOpen, Car, Trophy, LayoutGrid, List } from 'lucide-react';
import {
  filterByType, filterByStatus, filterByDay, filterByWeek,
  formatDateStr, getStartOfWeekStr, addDaysStr,
} from '../utils/teacherScheduleUtils';
import '../components/style/theme.css';

interface Session {
  id: string;
  studentId: string;
  studentName: string;
  teacherId: string;
  teacherName: string;
  type: 'code' | 'creneau' | 'circui';
  date: string;
  time: string;
  day: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  createdAt: string;
}

const DAY_START_HOUR = 7;
const DAY_END_HOUR = 20;
const HOUR_HEIGHT = 80;

const TYPE_COLORS: Record<string, string> = {
  code: '#F5A623',
  creneau: '#FF6B35',
  circui: '#34D399',
};

const STATUS_COLORS: Record<string, string> = {
  scheduled: '#F5A623',
  completed: '#34D399',
  cancelled: '#EF4444',
};

interface DayTimelineProps {
  sessions: Session[];
  language: string;
  getTypeName: (t: string) => string;
  getStatusName: (s: string) => string;
  currentDate: Date;
}

const DayTimelineView = ({ sessions, language, getTypeName, getStatusName, currentDate }: DayTimelineProps) => {
  const hours = Array.from({ length: DAY_END_HOUR - DAY_START_HOUR }, (_, i) => DAY_START_HOUR + i);
  const totalHeight = hours.length * HOUR_HEIGHT;

  const timeToTop = (time: string): number => {
    const [h, m] = time.split(':').map(Number);
    return ((h - DAY_START_HOUR) + m / 60) * HOUR_HEIGHT;
  };

  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
  const currentDateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth()+1).padStart(2,'0')}-${String(currentDate.getDate()).padStart(2,'0')}`;
  const isToday = todayStr === currentDateStr;
  const nowTop = isToday ? ((now.getHours() - DAY_START_HOUR) + now.getMinutes() / 60) * HOUR_HEIGHT : null;

  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '1.25rem' }}>
      {sessions.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
          <div style={{ width: '4rem', height: '4rem', borderRadius: '50%', background: 'rgba(245,166,35,0.08)', border: '1px solid var(--border-gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem', color: 'var(--primary)' }}>
            <Calendar size={28} />
          </div>
          <p style={{ fontWeight: 500, color: 'var(--text-muted)' }}>{language === 'ar' ? 'لا توجد حصص اليوم' : language === 'fr' ? 'Aucune session aujourd\'hui' : 'No sessions today'}</p>
        </div>
      ) : (
        <div style={{ position: 'relative', display: 'flex' }}>
          {/* Hours column */}
          <div style={{ width: '56px', flexShrink: 0, position: 'relative', height: `${totalHeight}px` }}>
            {hours.map(h => (
              <div key={h} style={{ position: 'absolute', top: `${(h - DAY_START_HOUR) * HOUR_HEIGHT}px`, fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600, paddingTop: '4px' }}>
                {String(h).padStart(2,'0')}:00
              </div>
            ))}
          </div>
          {/* Grid area */}
          <div style={{ flex: 1, position: 'relative', height: `${totalHeight}px`, borderLeft: '2px solid var(--border)' }}>
            {hours.map(h => (
              <div key={h} style={{ position: 'absolute', top: `${(h - DAY_START_HOUR) * HOUR_HEIGHT}px`, left: 0, right: 0, borderTop: `1px solid ${h % 2 === 0 ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.03)'}`, height: `${HOUR_HEIGHT}px` }} />
            ))}
            {/* Current time line */}
            {nowTop !== null && nowTop >= 0 && nowTop <= totalHeight && (
              <div style={{ position: 'absolute', top: `${nowTop}px`, left: 0, right: 0, height: '2px', background: '#EF4444', zIndex: 10 }}>
                <div style={{ position: 'absolute', left: '-6px', top: '-5px', width: '12px', height: '12px', borderRadius: '50%', background: '#EF4444' }} />
              </div>
            )}
            {/* Sessions */}
            {sessions.map(session => {
              const top = timeToTop(session.time);
              const color = TYPE_COLORS[session.type] || 'var(--primary)';
              const statusColor = STATUS_COLORS[session.status] || 'var(--primary)';
              return (
                <div key={session.id}
                  style={{
                    position: 'absolute', top: `${top}px`, left: '8px', right: '8px',
                    height: `${HOUR_HEIGHT - 10}px`,
                    background: `${color}18`, border: `2px solid ${color}`,
                    borderRadius: 'var(--radius-md)', padding: '6px 10px', overflow: 'hidden', zIndex: 5,
                  }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '3px' }}>
                        <User size={11} style={{ color, flexShrink: 0 }} />
                        <span style={{ fontWeight: 700, fontSize: '0.8125rem', color: 'var(--text-white)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{session.studentName}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <Clock size={11} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{session.time}</span>
                        <span style={{ fontSize: '0.65rem', padding: '1px 6px', background: `${color}25`, color, borderRadius: 'var(--radius-full)', fontWeight: 700 }}>{getTypeName(session.type)}</span>
                      </div>
                    </div>
                    <span style={{ fontSize: '0.65rem', padding: '2px 7px', background: `${statusColor}20`, color: statusColor, borderRadius: 'var(--radius-full)', fontWeight: 700, flexShrink: 0, marginInlineStart: '4px' }}>
                      {getStatusName(session.status)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

const TeacherScheduleContent = () => {
  const { language, dir } = useLanguage();
  const { user } = useAuth();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [filteredSessions, setFilteredSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'week' | 'day'>('week');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [updatingSession, setUpdatingSession] = useState<string | null>(null);

  useEffect(() => { if (user) fetchSessions(); }, [user]);
  useEffect(() => { filterSessions(); }, [sessions, selectedType, selectedStatus, currentDate, viewMode]);

  const fetchSessions = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const { data: snap, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('teacherId', user.uid)
        .eq('status', 'approved');
      if (error) throw error;
      const list: Session[] = [];
      (snap || []).forEach(data => {
        const dateObj = new Date(data.date + 'T00:00:00');
        const dayNames = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'];
        list.push({ id: data.id, studentId: data.studentId, studentName: data.studentName, teacherId: data.teacherId, teacherName: data.teacherName, type: data.sessionType || 'code', date: data.date, time: data.time, day: dayNames[dateObj.getDay()], status: 'scheduled', createdAt: data.createdAt });
      });
      list.sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time));
      setSessions(list);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const filterSessions = () => {
    let f = filterByType(filterByStatus([...sessions], selectedStatus), selectedType);
    f = viewMode === 'day' ? filterByDay(f, currentDate) : filterByWeek(f, currentDate);
    setFilteredSessions(f);
  };

  const updateSessionStatus = async (sessionId: string, newStatus: 'completed' | 'cancelled') => {
    setUpdatingSession(sessionId);
    try {
      await supabase.from('bookings').update({ status: newStatus }).eq('id', sessionId);
      setSessions(sessions.map(s => s.id === sessionId ? { ...s, status: newStatus } : s));
    } catch (e) { console.error(e); }
    finally { setUpdatingSession(null); }
  };

  const t = (ar: string, fr: string, en: string) => language === 'ar' ? ar : language === 'fr' ? fr : en;

  const getTypeName = (type: string) => ({ ar: { code: 'كود', creneau: 'كرينو', circui: 'سيركوي' }, fr: { code: 'Code', creneau: 'Créneau', circui: 'Circuit' }, en: { code: 'Code', creneau: 'Creneau', circui: 'Circuit' } }[language as 'ar'|'fr'|'en'][type as 'code'] || type);
  const getStatusName = (s: string) => ({ ar: { scheduled: 'مجدولة', completed: 'مكتملة', cancelled: 'ملغاة' }, fr: { scheduled: 'Programmée', completed: 'Terminée', cancelled: 'Annulée' }, en: { scheduled: 'Scheduled', completed: 'Completed', cancelled: 'Cancelled' } }[language as 'ar'|'fr'|'en'][s as 'scheduled'] || s);

  const formatDate = (dateStr: string) => new Date(dateStr + 'T00:00:00').toLocaleDateString(language === 'ar' ? 'ar-DZ' : language === 'fr' ? 'fr-FR' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  const navigateDate = (navDir: 'prev' | 'next') => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() + (navDir === 'next' ? (viewMode === 'day' ? 1 : 7) : (viewMode === 'day' ? -1 : -7)));
    setCurrentDate(d);
  };

  if (loading) return (
    <div dir={dir} style={{ minHeight: '100vh', background: 'var(--bg-darkest)', color: 'var(--text-primary)' }}>
      <Navbar />
      <main style={{ paddingTop: '6rem', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
          <div style={{ width: '3rem', height: '3rem', border: '3px solid var(--border)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin-slow 0.7s linear infinite' }} />
          <p style={{ color: 'var(--text-muted)', fontWeight: 500 }}>{t('جاري التحميل...', 'Chargement...', 'Loading...')}</p>
        </div>
      </main>
      <Footer />
    </div>
  );

  const typeIcons = { code: BookOpen, creneau: Car, circui: Trophy };

  return (
    <div dir={dir} style={{ minHeight: '100vh', background: 'var(--bg-darkest)', color: 'var(--text-primary)' }}>
      <Navbar />
      <main style={{ padding: '6rem 1.5rem 3rem', maxWidth: '1300px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

        {/* Header */}
        <div style={{ background: 'var(--grad-card)', border: '1px solid var(--border)', padding: '1.75rem 2rem', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-gold)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ width: '3.5rem', height: '3.5rem', borderRadius: 'var(--radius-md)', background: 'var(--grad-gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Calendar size={26} style={{ color: '#000' }} />
            </div>
            <div>
              <h1 style={{ fontSize: '1.875rem', fontWeight: 700, background: 'var(--grad-gold)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', margin: '0 0 0.25rem' }}>
                {t('جدول الأعمال', 'Emploi du temps', 'Schedule')}
              </h1>
              <p style={{ color: 'var(--text-muted)', margin: 0 }}>{t('عرض وإدارة جميع الحصص المجدولة', 'Voir et gérer toutes les sessions', 'View and manage all scheduled sessions')}</p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem' }}>
          {[
            { label: t('إجمالي الحصص', 'Total sessions', 'Total Sessions'), value: filteredSessions.length, color: 'var(--primary)', border: 'var(--border-gold)' },
            { label: t('مجدولة', 'Programmées', 'Scheduled'), value: filteredSessions.filter(s => s.status === 'scheduled').length, color: '#F5A623', border: 'rgba(245,166,35,0.3)' },
            { label: t('مكتملة', 'Terminées', 'Completed'), value: filteredSessions.filter(s => s.status === 'completed').length, color: '#34D399', border: 'rgba(52,211,153,0.3)' },
            { label: t('ملغاة', 'Annulées', 'Cancelled'), value: filteredSessions.filter(s => s.status === 'cancelled').length, color: '#EF4444', border: 'rgba(239,68,68,0.3)' },
          ].map(({ label, value, color, border }) => (
            <div key={label} style={{ background: 'var(--bg-card)', borderRadius: 'var(--radius-md)', padding: '1.25rem', border: `1px solid ${border}`, textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', fontWeight: 800, color }}>{value}</div>
              <div style={{ fontSize: '0.8125rem', color, fontWeight: 600, marginTop: '0.25rem', opacity: 0.85 }}>{label}</div>
            </div>
          ))}
        </div>

        {/* Controls */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '1.25rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
            {/* Session type filter */}
            <div>
              <label style={{ display: 'block', marginBottom: '0.375rem', fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                {t('نوع الحصة', 'Type de session', 'Session Type')}
              </label>
              <select value={selectedType} onChange={e => setSelectedType(e.target.value)}
                className="input-pro"
                style={{ width: '100%' }}>
                <option value="all">{t('الكل', 'Tous', 'All')}</option>
                <option value="code">{getTypeName('code')}</option>
                <option value="creneau">{getTypeName('creneau')}</option>
                <option value="circui">{getTypeName('circui')}</option>
              </select>
            </div>
            {/* Status filter */}
            <div>
              <label style={{ display: 'block', marginBottom: '0.375rem', fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                {t('الحالة', 'Statut', 'Status')}
              </label>
              <select value={selectedStatus} onChange={e => setSelectedStatus(e.target.value)}
                className="input-pro"
                style={{ width: '100%' }}>
                <option value="all">{t('الكل', 'Tous', 'All')}</option>
                <option value="scheduled">{getStatusName('scheduled')}</option>
                <option value="completed">{getStatusName('completed')}</option>
                <option value="cancelled">{getStatusName('cancelled')}</option>
              </select>
            </div>
            {/* View mode */}
            <div>
              <label style={{ display: 'block', marginBottom: '0.375rem', fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                {t('وضع العرض', 'Mode d\'affichage', 'View Mode')}
              </label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {(['week', 'day'] as const).map(mode => (
                  <button key={mode} onClick={() => setViewMode(mode)}
                    style={{
                      flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.375rem',
                      padding: '0.625rem', borderRadius: 'var(--radius-md)',
                      border: viewMode === mode ? '1.5px solid var(--primary)' : '1px solid var(--border)',
                      background: viewMode === mode ? 'rgba(245,166,35,0.12)' : 'rgba(255,255,255,0.03)',
                      color: viewMode === mode ? 'var(--primary)' : 'var(--text-muted)',
                      fontWeight: 600, fontSize: '0.8125rem', cursor: 'pointer', transition: 'all 0.2s',
                    }}>
                    {mode === 'week' ? <LayoutGrid size={14} /> : <List size={14} />}
                    {mode === 'week' ? t('أسبوعي', 'Semaine', 'Week') : t('يومي', 'Jour', 'Day')}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Date navigation */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '0.875rem 1.25rem' }}>
            <button onClick={() => navigateDate('prev')}
              style={{ width: '2.25rem', height: '2.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0, color: 'var(--text-primary)' }}>
              <ChevronLeft size={18} />
            </button>
            <div style={{ flex: 1, textAlign: 'center' }}>
              <div style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--text-white)' }}>
                {viewMode === 'day'
                  ? formatDate(formatDateStr(currentDate))
                  : `${formatDate(getStartOfWeekStr(currentDate))} — ${formatDate(addDaysStr(getStartOfWeekStr(currentDate), 6))}`}
              </div>
              <button onClick={() => setCurrentDate(new Date())}
                style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', marginTop: '0.125rem' }}>
                {t('اليوم', 'Aujourd\'hui', 'Today')}
              </button>
            </div>
            <button onClick={() => navigateDate('next')}
              style={{ width: '2.25rem', height: '2.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0, color: 'var(--text-primary)' }}>
              <ChevronRight size={18} />
            </button>
          </div>
        </div>

        {/* Schedule content */}
        <div>
          {viewMode === 'day' ? (
            <DayTimelineView sessions={filteredSessions} language={language} getTypeName={getTypeName} getStatusName={getStatusName} currentDate={currentDate} />
          ) : filteredSessions.length === 0 ? (
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '4rem', textAlign: 'center' }}>
              <div style={{ width: '4.5rem', height: '4.5rem', borderRadius: '50%', background: 'rgba(245,166,35,0.08)', border: '1px solid var(--border-gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem', color: 'var(--primary)' }}>
                <Calendar size={28} />
              </div>
              <p style={{ color: 'var(--text-muted)', fontWeight: 500 }}>{t('لا توجد حصص في هذه الفترة', 'Aucune session pour cette période', 'No sessions for this period')}</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {filteredSessions.map((session) => {
                const typeColor = TYPE_COLORS[session.type] || 'var(--primary)';
                const statusColor = STATUS_COLORS[session.status] || 'var(--primary)';
                const TypeIcon = typeIcons[session.type] || BookOpen;
                return (
                  <div key={session.id}
                    style={{
                      background: 'var(--bg-card)', borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border)', overflow: 'hidden',
                      borderInlineStart: `4px solid ${typeColor}`,
                    }}>
                    <div style={{ padding: '1rem 1.25rem' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.875rem', alignItems: 'center' }}>
                        {/* Student */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                          <div style={{ width: '2.25rem', height: '2.25rem', borderRadius: '50%', background: `${typeColor}20`, border: `1px solid ${typeColor}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <User size={14} style={{ color: typeColor }} />
                          </div>
                          <div>
                            <p style={{ fontWeight: 700, color: 'var(--text-white)', fontSize: '0.9rem', margin: 0 }}>{session.studentName}</p>
                            <span style={{ fontSize: '0.7rem', padding: '1px 7px', background: `${typeColor}18`, color: typeColor, borderRadius: 'var(--radius-full)', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                              <TypeIcon size={10} />{getTypeName(session.type)}
                            </span>
                          </div>
                        </div>
                        {/* Date & time */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                            <Calendar size={13} style={{ color: 'var(--text-muted)' }} />
                            <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', fontWeight: 500 }}>{formatDate(session.date)}</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                            <Clock size={13} style={{ color: 'var(--text-muted)' }} />
                            <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', fontWeight: 500 }}>{session.time}</span>
                          </div>
                        </div>
                        {/* Status */}
                        <div>
                          <span style={{ display: 'inline-flex', alignItems: 'center', padding: '0.375rem 0.875rem', background: `${statusColor}15`, color: statusColor, borderRadius: 'var(--radius-md)', fontSize: '0.8125rem', fontWeight: 700, border: `1px solid ${statusColor}30` }}>
                            {getStatusName(session.status)}
                          </span>
                        </div>
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

const TeacherSchedule = () => (
  <LanguageProvider>
    <TeacherScheduleContent />
  </LanguageProvider>
);

export default TeacherSchedule;
