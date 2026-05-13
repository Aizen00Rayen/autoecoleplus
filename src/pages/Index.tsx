import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import CarScene3D from '../components/CarScene3D';
import { useLanguage } from '../contexts/LanguageContext';
import {
  Shield, Clock, Award, Users, Star, Car,
  BookOpen, BarChart2, CheckCircle, ArrowRight, Zap, MapPin, ChevronRight
} from 'lucide-react';
import '../components/style/theme.css';

/* ─── Animated counter ──────────────────────────────────────── */
function useCounter(target: number, duration = 2000, start = false) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!start) return;
    let raf: number;
    const t0 = performance.now();
    const tick = (now: number) => {
      const p = Math.min((now - t0) / duration, 1);
      setCount(Math.round((1 - Math.pow(1 - p, 3)) * target));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration, start]);
  return count;
}

function StatItem({ value, suffix, label, started }: { value: number; suffix: string; label: string; started: boolean }) {
  const n = useCounter(value, 2200, started);
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: 'clamp(2rem,3.5vw,2.75rem)', fontWeight: 800, color: '#fff', letterSpacing: '-0.03em', lineHeight: 1 }}>
        {n}<span style={{ color: 'var(--primary)', marginLeft: 2 }}>{suffix}</span>
      </div>
      <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: 6, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</div>
    </div>
  );
}

/* ─── Main ──────────────────────────────────────────────────── */
const Index = () => {
  const { language } = useLanguage();
  const [scrollY, setScrollY] = useState(0);
  const [statsVisible, setStatsVisible] = useState(false);
  const statsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', h, { passive: true });
    return () => window.removeEventListener('scroll', h);
  }, []);

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setStatsVisible(true); }, { threshold: 0.3 });
    if (statsRef.current) obs.observe(statsRef.current);
    return () => obs.disconnect();
  }, []);

  const t = (ar: string, fr: string, en: string) =>
    language === 'ar' ? ar : language === 'fr' ? fr : en;

  const stats = [
    { value: 5000, suffix: '+', label: t('طالب تخرج', 'Diplômés', 'Graduates') },
    { value: 15,   suffix: '+', label: t('سنة خبرة', "Ans d'expérience", 'Years Experience') },
    { value: 98,   suffix: '%', label: t('نسبة النجاح', 'Taux réussite', 'Pass Rate') },
    { value: 24,   suffix: '/7', label: t('دعم مستمر', 'Support continu', 'Support') },
  ];

  const features = [
    { icon: Shield,   title: t('معلمون معتمدون', 'Moniteurs certifiés', 'Certified Instructors'), desc: t('فريق محترف من المعلمين المرخصين', 'Équipe de moniteurs agréés', 'Professional licensed teaching team') },
    { icon: Car,      title: t('أسطول حديث', 'Véhicules modernes', 'Modern Fleet'), desc: t('سيارات حديثة مجهزة بأحدث تقنيات السلامة', 'Véhicules équipés des dernières technologies', 'Latest safety-equipped modern vehicles') },
    { icon: BookOpen, title: t('منهج شامل', 'Programme complet', 'Comprehensive Program'), desc: t('برامج تدريبية متكاملة نظرياً وعملياً', 'Formation théorique et pratique', 'Full theory and practical training') },
    { icon: Clock,    title: t('جداول مرنة', 'Horaires flexibles', 'Flexible Schedules'), desc: t('مواعيد تناسب جميع الأوقات والاحتياجات', 'Des horaires adaptés à vos besoins', 'Schedules that fit all needs') },
    { icon: BarChart2,title: t('تتبع التقدم', 'Suivi des progrès', 'Progress Tracking'), desc: t('لوحة تحكم ذكية لمتابعة مستوى تقدمك', 'Tableau de bord pour suivre vos progrès', 'Smart dashboard to monitor your progress') },
    { icon: Award,    title: t('نسبة نجاح عالية', 'Taux réussite élevé', 'High Pass Rate'), desc: t('نسبة نجاح 98% في امتحانات رخصة القيادة', '98% de réussite aux examens', '98% success rate in license exams') },
  ];

  const programs = [
    { id: 'b', icon: Car,    title: t('رخصة B', 'Permis B', 'License B'), sub: t('سيارات خاصة', 'Voiture', 'Private Car'), price: '15,000', color: '#F5A623',
      items: [t('30 ساعة تدريب عملي','30h conduite','30h driving'),t('دروس نظرية','Cours théoriques','Theory classes'),t('جداول مرنة','Horaires flexibles','Flexible hours'),t('ضمان النجاح','Garantie réussite','Pass guarantee')] },
    { id: 'a', icon: Zap,    title: t('رخصة A', 'Permis A', 'License A'), sub: t('دراجات نارية', 'Moto/Scooter', 'Motorcycle'),   price: '10,000', color: '#7C3AED',
      items: [t('20 ساعة تدريب','20h formation','20h training'),t('دروس نظرية كاملة','Cours théorique','Full theory'),t('تدريب الإشارات','Code de la route','Road code'),t('إرشاد شخصي','Coaching perso','Personal coaching')] },
    { id: 'c', icon: Shield, title: t('رخصة C', 'Permis C', 'License C'), sub: t('شاحنات', 'Poids lourds', 'Trucks'),          price: '25,000', color: '#0EA5E9',
      items: [t('50 ساعة تخصصية','50h spécialisées','50h specialized'),t('مركبات ثقيلة','Véhicules lourds','Heavy vehicles'),t('شهادة معتمدة','Certificat reconnu','Certification'),t('دعم ما بعد التخرج','Suivi post-obtention','Post-license support')] },
  ];

  const testimonials = [
    { name: t('أحمد بن علي','Ahmed Ben Ali','Ahmed Ben Ali'), role: t('طالب سابق','Ancien élève','Former Student'), rating: 5,
      text: t('تجربة رائعة! المعلمون محترفون جداً والبرنامج منظم بشكل ممتاز.','Excellente expérience ! Les moniteurs sont très professionnels.','Amazing experience! The instructors are very professional.') },
    { name: t('سارة المنصوري','Sara Mansouri','Sara Mansouri'), role: t('طالبة متخرجة','Diplômée','Graduate'), rating: 5,
      text: t('نجحت من أول محاولة بفضل هذه المدرسة الرائعة والمنهج الشامل.','J\'ai réussi du premier coup grâce à cette école.','Passed on the first attempt thanks to this great school.') },
    { name: t('كريم بوزيدي','Karim Bouzidi','Karim Bouzidi'), role: t('سائق محترف','Conducteur pro','Professional Driver'), rating: 5,
      text: t('أفضل مدرسة قيادة في المنطقة. خدمة مميزة وأسعار معقولة.','Meilleure auto-école de la région. Service exceptionnel.','Best driving school in the area. Exceptional service.') },
  ];

  return (
    <div style={{ background: 'var(--bg-darkest)', minHeight: '100vh', color: 'var(--text-primary)' }}>
      <Navbar />

      {/* ══════════════════════════════════════════════════════
          HERO
      ══════════════════════════════════════════════════════ */}
      <section style={{ position: 'relative', minHeight: '100vh', display: 'flex', alignItems: 'center', overflow: 'hidden', background: '#06090f' }}>

        {/* subtle top-left ambient */}
        <div style={{ position:'absolute', top:'-10%', left:'-5%', width:700, height:700,
          background:'radial-gradient(circle,rgba(245,166,35,0.07) 0%,transparent 68%)',
          pointerEvents:'none', borderRadius:'50%' }}/>
        <div style={{ position:'absolute', bottom:'5%', right:'0%', width:500, height:500,
          background:'radial-gradient(circle,rgba(100,130,255,0.05) 0%,transparent 68%)',
          pointerEvents:'none', borderRadius:'50%' }}/>

        <div style={{
          maxWidth:1320, margin:'0 auto', padding:'0 2rem', width:'100%',
          display:'grid', gridTemplateColumns:'1fr 1fr', gap:'4rem', alignItems:'center',
          paddingTop:'6rem', paddingBottom:'4rem',
        }} className="hero-grid">

          {/* ── Left: copy ── */}
          <div style={{ zIndex:1 }}>

            {/* eyebrow */}
            <div style={{ display:'inline-flex', alignItems:'center', gap:8,
              padding:'5px 14px', marginBottom:'2rem',
              border:'1px solid rgba(245,166,35,0.25)', borderRadius:4,
              background:'rgba(245,166,35,0.06)',
              fontSize:'0.72rem', fontWeight:700, color:'var(--primary)',
              letterSpacing:'0.12em', textTransform:'uppercase' }}>
              <div style={{ width:6, height:6, borderRadius:'50%', background:'var(--primary)',
                boxShadow:'0 0 8px var(--primary)', animation:'pulseGlow 2s ease-in-out infinite' }}/>
              {t('مرخصة رسمياً • منذ 2010', 'Agréée officiellement • Depuis 2010', 'Officially Certified • Since 2010')}
            </div>

            <h1 style={{ fontSize:'clamp(2.4rem,4.5vw,3.75rem)', fontWeight:900,
              lineHeight:1.08, letterSpacing:'-0.04em', marginBottom:'1.5rem', color:'#fff' }}>
              {t('تعلم القيادة', 'Maîtrisez', 'Master the')}
              <br/>
              <span style={{ background:'var(--grad-gold)', WebkitBackgroundClip:'text',
                WebkitTextFillColor:'transparent', backgroundClip:'text' }}>
                {t('باحترافية حقيقية', 'la conduite', 'Art of Driving')}
              </span>
              <br/>
              <span style={{ color:'rgba(255,255,255,0.55)', fontSize:'0.72em', fontWeight:700 }}>
                {t('مدرسة أوتو إيكول بلوس', 'Auto Ecole Plus', 'Auto Ecole Plus')}
              </span>
            </h1>

            <p style={{ fontSize:'1rem', color:'rgba(255,255,255,0.5)', lineHeight:1.75,
              marginBottom:'2.5rem', maxWidth:460 }}>
              {t(
                'انضم إلى أكثر من 5,000 طالب تخرّجوا من مدرستنا. تدريب شامل بأحدث الأساليب والأسطول.',
                'Rejoignez plus de 5 000 diplômés. Formation complète avec les méthodes et équipements les plus modernes.',
                'Join 5,000+ graduates. Comprehensive training with the most modern methods and fleet.'
              )}
            </p>

            {/* CTAs */}
            <div style={{ display:'flex', gap:'0.875rem', flexWrap:'wrap', marginBottom:'3rem' }}>
              <Link to="/register" style={{
                display:'inline-flex', alignItems:'center', gap:10,
                padding:'14px 28px', background:'var(--primary)',
                color:'#000', fontWeight:700, fontSize:'0.9375rem',
                border:'none', borderRadius:6, cursor:'pointer',
                textDecoration:'none', letterSpacing:'-0.01em',
                boxShadow:'0 4px 24px rgba(245,166,35,0.35)',
                transition:'all 0.2s ease',
              }}
                onMouseEnter={e=>(e.currentTarget.style.filter='brightness(1.1)')}
                onMouseLeave={e=>(e.currentTarget.style.filter='')}>
                {t('ابدأ التسجيل', "S'inscrire", 'Get Started')}
                <ArrowRight size={16}/>
              </Link>
              <Link to="/about" style={{
                display:'inline-flex', alignItems:'center', gap:10,
                padding:'13px 24px', background:'transparent',
                color:'rgba(255,255,255,0.7)', fontWeight:600, fontSize:'0.9375rem',
                border:'1px solid rgba(255,255,255,0.12)', borderRadius:6,
                cursor:'pointer', textDecoration:'none',
                transition:'all 0.2s ease',
              }}
                onMouseEnter={e=>{e.currentTarget.style.borderColor='rgba(255,255,255,0.3)'; e.currentTarget.style.color='#fff';}}
                onMouseLeave={e=>{e.currentTarget.style.borderColor='rgba(255,255,255,0.12)'; e.currentTarget.style.color='rgba(255,255,255,0.7)';}}>
                {t('اعرف أكثر', 'En savoir plus', 'Learn More')}
              </Link>
            </div>

            {/* inline trust row */}
            <div style={{ display:'flex', gap:'2rem', flexWrap:'wrap' }}>
              {[
                t('✓ معتمد رسمياً', '✓ Agréé officiellement', '✓ Officially Certified'),
                t('✓ ضمان النجاح', '✓ Garantie réussite', '✓ Pass Guarantee'),
                t('✓ دعم 24/7', '✓ Support 24/7', '✓ 24/7 Support'),
              ].map((b,i)=>(
                <span key={i} style={{ fontSize:'0.78rem', color:'rgba(255,255,255,0.38)', fontWeight:500 }}>{b}</span>
              ))}
            </div>
          </div>

          {/* ── Right: 3-D scene ── */}
          <div style={{ position:'relative', height:560 }}>
            <CarScene3D scrollY={scrollY} style={{ height:'100%', width:'100%', borderRadius:8, overflow:'hidden' }}/>

            {/* stat pill – bottom left */}
            <div style={{
              position:'absolute', bottom:24, left:16,
              background:'rgba(6,9,18,0.85)', backdropFilter:'blur(18px)',
              border:'1px solid rgba(255,255,255,0.08)',
              borderRadius:8, padding:'12px 18px',
              display:'flex', alignItems:'center', gap:12,
              boxShadow:'0 8px 32px rgba(0,0,0,0.5)',
            }}>
              <div style={{ width:36, height:36, borderRadius:6, background:'var(--primary)',
                display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                <Award size={16} color="#000"/>
              </div>
              <div>
                <div style={{ fontSize:'0.72rem', color:'rgba(255,255,255,0.4)', letterSpacing:'0.06em', textTransform:'uppercase' }}>
                  {t('نسبة النجاح', 'Taux réussite', 'Pass Rate')}
                </div>
                <div style={{ fontSize:'1.1rem', fontWeight:800, color:'#fff', letterSpacing:'-0.02em' }}>98%</div>
              </div>
            </div>

            {/* students pill – top right */}
            <div style={{
              position:'absolute', top:24, right:16,
              background:'rgba(6,9,18,0.85)', backdropFilter:'blur(18px)',
              border:'1px solid rgba(255,255,255,0.08)',
              borderRadius:8, padding:'10px 16px',
              display:'flex', alignItems:'center', gap:10,
              boxShadow:'0 8px 32px rgba(0,0,0,0.5)',
            }}>
              <Users size={14} color="var(--primary)"/>
              <span style={{ fontSize:'0.82rem', fontWeight:700, color:'#fff' }}>5,000+</span>
              <span style={{ fontSize:'0.72rem', color:'rgba(255,255,255,0.4)' }}>
                {t('طالب', 'élèves', 'students')}
              </span>
            </div>
          </div>
        </div>

        {/* scroll caret */}
        <div style={{ position:'absolute', bottom:28, left:'50%', transform:'translateX(-50%)',
          display:'flex', flexDirection:'column', alignItems:'center', gap:6,
          color:'rgba(255,255,255,0.2)', animation:'floatY 2.5s ease-in-out infinite' }}>
          <div style={{ width:1, height:36, background:'linear-gradient(to bottom, rgba(255,255,255,0.2), transparent)' }}/>
          <div style={{ fontSize:'0.6rem', letterSpacing:'0.15em', textTransform:'uppercase', fontWeight:600 }}>
            {t('انزل', 'Défiler', 'Scroll')}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          STATS
      ══════════════════════════════════════════════════════ */}
      <section ref={statsRef} style={{ background:'#090c15', borderTop:'1px solid rgba(255,255,255,0.05)', borderBottom:'1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ maxWidth:1320, margin:'0 auto', padding:'0 2rem' }}>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', borderLeft:'1px solid rgba(255,255,255,0.05)' }} className="stats-grid">
            {stats.map((s,i)=>(
              <div key={i} style={{ padding:'2.5rem 2rem', borderRight:'1px solid rgba(255,255,255,0.05)' }}>
                <StatItem value={s.value} suffix={s.suffix} label={s.label} started={statsVisible}/>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          FEATURES
      ══════════════════════════════════════════════════════ */}
      <section style={{ padding:'7rem 2rem', background:'var(--bg-darkest)' }}>
        <div style={{ maxWidth:1320, margin:'0 auto' }}>

          <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-start', marginBottom:'4rem', maxWidth:560 }}>
            <span style={{ fontSize:'0.72rem', fontWeight:700, color:'var(--primary)', letterSpacing:'0.14em',
              textTransform:'uppercase', marginBottom:'1rem' }}>
              {t('لماذا تختارنا', 'Pourquoi nous', 'Why Choose Us')}
            </span>
            <h2 style={{ fontSize:'clamp(1.75rem,3.5vw,2.75rem)', fontWeight:800, color:'#fff',
              letterSpacing:'-0.03em', lineHeight:1.15, margin:0 }}>
              {t('ميزات تجعلنا الخيار الأول', 'Ce qui nous distingue', 'Features That Set Us Apart')}
            </h2>
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'1px', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.05)' }} className="features-grid">
            {features.map((f,i)=>(
              <div key={i} style={{
                padding:'2.25rem', background:'var(--bg-darkest)',
                transition:'background 0.2s',
                cursor:'default',
              }}
                onMouseEnter={e=>(e.currentTarget.style.background='#0f1320')}
                onMouseLeave={e=>(e.currentTarget.style.background='var(--bg-darkest)')}>
                <f.icon size={22} color="var(--primary)" style={{ marginBottom:'1.25rem', display:'block' }}/>
                <h3 style={{ fontSize:'1rem', fontWeight:700, color:'#fff', marginBottom:8, letterSpacing:'-0.01em' }}>
                  {f.title}
                </h3>
                <p style={{ fontSize:'0.875rem', color:'rgba(255,255,255,0.42)', lineHeight:1.65, margin:0 }}>
                  {f.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          PROGRAMS
      ══════════════════════════════════════════════════════ */}
      <section style={{ padding:'7rem 2rem', background:'#090c15' }}>
        <div style={{ maxWidth:1320, margin:'0 auto' }}>

          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end', marginBottom:'3.5rem', flexWrap:'wrap', gap:'1rem' }}>
            <div>
              <span style={{ fontSize:'0.72rem', fontWeight:700, color:'var(--primary)', letterSpacing:'0.14em',
                textTransform:'uppercase', display:'block', marginBottom:'0.75rem' }}>
                {t('برامجنا', 'Nos programmes', 'Our Programs')}
              </span>
              <h2 style={{ fontSize:'clamp(1.75rem,3.5vw,2.75rem)', fontWeight:800, color:'#fff',
                letterSpacing:'-0.03em', lineHeight:1.15, margin:0 }}>
                {t('اختر نوع رخصتك', 'Choisissez votre permis', 'Choose Your License')}
              </h2>
            </div>
            <Link to="/register" style={{
              display:'inline-flex', alignItems:'center', gap:8,
              fontSize:'0.875rem', fontWeight:600, color:'rgba(255,255,255,0.5)',
              textDecoration:'none', transition:'color 0.2s',
            }}
              onMouseEnter={e=>(e.currentTarget.style.color='#fff')}
              onMouseLeave={e=>(e.currentTarget.style.color='rgba(255,255,255,0.5)')}>
              {t('عرض الكل', 'Voir tout', 'View All')} <ChevronRight size={16}/>
            </Link>
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'1.25rem' }} className="programs-grid">
            {programs.map((prog,i)=>(
              <div key={i} style={{
                background:'#0d1020', border:'1px solid rgba(255,255,255,0.07)',
                borderRadius:8, padding:'2rem',
                display:'flex', flexDirection:'column',
                transition:'border-color 0.2s, transform 0.2s',
              }}
                onMouseEnter={e=>{
                  e.currentTarget.style.borderColor=`${prog.color}50`;
                  e.currentTarget.style.transform='translateY(-3px)';
                }}
                onMouseLeave={e=>{
                  e.currentTarget.style.borderColor='rgba(255,255,255,0.07)';
                  e.currentTarget.style.transform='';
                }}>
                {/* top */}
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'1.5rem' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                    <div style={{ width:40, height:40, borderRadius:6, background:`${prog.color}14`,
                      display:'flex', alignItems:'center', justifyContent:'center', color:prog.color }}>
                      <prog.icon size={18}/>
                    </div>
                    <div>
                      <div style={{ fontSize:'1rem', fontWeight:800, color:'#fff', letterSpacing:'-0.02em' }}>{prog.title}</div>
                      <div style={{ fontSize:'0.75rem', color:'rgba(255,255,255,0.35)', marginTop:1 }}>{prog.sub}</div>
                    </div>
                  </div>
                </div>

                {/* items */}
                <ul style={{ listStyle:'none', padding:0, margin:'0 0 1.75rem', flex:1 }}>
                  {prog.items.map((item,fi)=>(
                    <li key={fi} style={{ display:'flex', alignItems:'center', gap:10,
                      padding:'8px 0', borderBottom: fi<prog.items.length-1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                      fontSize:'0.8375rem', color:'rgba(255,255,255,0.5)' }}>
                      <CheckCircle size={13} color={prog.color} style={{ flexShrink:0 }}/>
                      {item}
                    </li>
                  ))}
                </ul>

                {/* footer */}
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between',
                  paddingTop:'1.25rem', borderTop:'1px solid rgba(255,255,255,0.05)' }}>
                  <div>
                    <div style={{ fontSize:'0.7rem', color:'rgba(255,255,255,0.3)', letterSpacing:'0.06em', textTransform:'uppercase' }}>
                      {t('من', 'À partir de', 'From')}
                    </div>
                    <div style={{ fontSize:'1.2rem', fontWeight:800, color:prog.color, letterSpacing:'-0.02em' }}>
                      {prog.price} {t('د.ج','DA','DZD')}
                    </div>
                  </div>
                  <Link to="/register" style={{
                    display:'inline-flex', alignItems:'center', gap:6,
                    padding:'9px 18px', background:`${prog.color}14`,
                    border:`1px solid ${prog.color}30`, borderRadius:5,
                    color:prog.color, textDecoration:'none',
                    fontSize:'0.82rem', fontWeight:700, letterSpacing:'-0.01em',
                    transition:'background 0.2s',
                  }}
                    onMouseEnter={e=>(e.currentTarget.style.background=`${prog.color}28`)}
                    onMouseLeave={e=>(e.currentTarget.style.background=`${prog.color}14`)}>
                    {t('سجل الآن',"S'inscrire",'Enroll')} <ArrowRight size={13}/>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          TESTIMONIALS
      ══════════════════════════════════════════════════════ */}
      <section style={{ padding:'7rem 2rem', background:'var(--bg-darkest)' }}>
        <div style={{ maxWidth:1320, margin:'0 auto' }}>

          <div style={{ marginBottom:'3.5rem' }}>
            <span style={{ fontSize:'0.72rem', fontWeight:700, color:'var(--primary)', letterSpacing:'0.14em',
              textTransform:'uppercase', display:'block', marginBottom:'0.75rem' }}>
              {t('آراء الطلاب', 'Témoignages', 'Testimonials')}
            </span>
            <h2 style={{ fontSize:'clamp(1.75rem,3.5vw,2.75rem)', fontWeight:800, color:'#fff',
              letterSpacing:'-0.03em', lineHeight:1.15, margin:0 }}>
              {t('ماذا يقول طلابنا', 'Ce que disent nos élèves', 'What Our Students Say')}
            </h2>
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'1.25rem' }} className="testimonials-grid">
            {testimonials.map((r,i)=>(
              <div key={i} style={{
                background:'#0d1020', border:'1px solid rgba(255,255,255,0.07)',
                borderRadius:8, padding:'2rem',
              }}>
                <div style={{ display:'flex', gap:3, marginBottom:'1.25rem' }}>
                  {Array.from({length:r.rating}).map((_,si)=>(
                    <Star key={si} size={14} fill="var(--primary)" color="var(--primary)"/>
                  ))}
                </div>
                <p style={{ fontSize:'0.9rem', color:'rgba(255,255,255,0.55)', lineHeight:1.75,
                  marginBottom:'1.5rem', fontStyle:'italic' }}>
                  "{r.text}"
                </p>
                <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                  <div style={{ width:38, height:38, borderRadius:'50%', background:'#1a2040',
                    border:'1px solid rgba(255,255,255,0.1)',
                    display:'flex', alignItems:'center', justifyContent:'center',
                    color:'var(--primary)', fontWeight:800, fontSize:'0.9rem' }}>
                    {r.name.charAt(0)}
                  </div>
                  <div>
                    <div style={{ fontSize:'0.875rem', fontWeight:700, color:'#fff' }}>{r.name}</div>
                    <div style={{ fontSize:'0.75rem', color:'rgba(255,255,255,0.3)' }}>{r.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          CTA BAND
      ══════════════════════════════════════════════════════ */}
      <section style={{ padding:'6rem 2rem', background:'#090c15', borderTop:'1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ maxWidth:680, margin:'0 auto', textAlign:'center' }}>
          <span style={{ fontSize:'0.72rem', fontWeight:700, color:'var(--primary)', letterSpacing:'0.14em',
            textTransform:'uppercase', display:'block', marginBottom:'1.25rem' }}>
            {t('جاهز للبدء؟', 'Prêt à commencer ?', 'Ready to Begin?')}
          </span>
          <h2 style={{ fontSize:'clamp(1.75rem,3.5vw,2.75rem)', fontWeight:800, color:'#fff',
            letterSpacing:'-0.03em', lineHeight:1.15, marginBottom:'1.25rem' }}>
            {t('سجّل اليوم وابدأ رحلتك', 'Inscrivez-vous et commencez', 'Register Today and Start Your Journey')}
          </h2>
          <p style={{ fontSize:'1rem', color:'rgba(255,255,255,0.4)', lineHeight:1.7, marginBottom:'2.5rem' }}>
            {t(
              'لا تنتظر أكثر. انضم إلينا اليوم وابدأ رحلتك نحو الحصول على رخصة القيادة.',
              "N'attendez plus. Rejoignez-nous et obtenez votre permis de conduire.",
              "Don't wait any longer. Join us today and earn your driving license."
            )}
          </p>
          <div style={{ display:'flex', gap:'0.875rem', justifyContent:'center', flexWrap:'wrap' }}>
            <Link to="/register" style={{
              display:'inline-flex', alignItems:'center', gap:10,
              padding:'15px 32px', background:'var(--primary)',
              color:'#000', fontWeight:700, fontSize:'0.9375rem',
              borderRadius:6, textDecoration:'none',
              boxShadow:'0 4px 24px rgba(245,166,35,0.35)',
              transition:'filter 0.2s',
            }}
              onMouseEnter={e=>(e.currentTarget.style.filter='brightness(1.1)')}
              onMouseLeave={e=>(e.currentTarget.style.filter='')}>
              {t('ابدأ الآن مجاناً',"S'inscrire gratuitement",'Register Free')}
              <ArrowRight size={16}/>
            </Link>
            <Link to="/contact" style={{
              display:'inline-flex', alignItems:'center', gap:10,
              padding:'14px 28px', background:'transparent',
              color:'rgba(255,255,255,0.6)', fontWeight:600, fontSize:'0.9375rem',
              border:'1px solid rgba(255,255,255,0.12)', borderRadius:6,
              textDecoration:'none', transition:'all 0.2s',
            }}
              onMouseEnter={e=>{e.currentTarget.style.borderColor='rgba(255,255,255,0.28)'; e.currentTarget.style.color='#fff';}}
              onMouseLeave={e=>{e.currentTarget.style.borderColor='rgba(255,255,255,0.12)'; e.currentTarget.style.color='rgba(255,255,255,0.6)';}}>
              <MapPin size={15}/> {t('تواصل معنا','Nous contacter','Contact Us')}
            </Link>
          </div>
        </div>
      </section>

      <Footer />

      <style>{`
        @keyframes pulseGlow {
          0%,100% { opacity:1; box-shadow:0 0 8px var(--primary); }
          50%      { opacity:0.6; box-shadow:0 0 16px var(--primary); }
        }
        @media (max-width: 1024px) {
          .features-grid { grid-template-columns: repeat(2,1fr) !important; }
          .programs-grid, .testimonials-grid { grid-template-columns: repeat(2,1fr) !important; }
        }
        @media (max-width: 768px) {
          .hero-grid { grid-template-columns: 1fr !important; }
          .stats-grid { grid-template-columns: repeat(2,1fr) !important; }
          .features-grid, .programs-grid, .testimonials-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
};

export default Index;
