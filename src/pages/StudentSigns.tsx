import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LanguageProvider, useLanguage } from '../contexts/LanguageContext';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { Search, X, ArrowLeft } from 'lucide-react';
import { supabase } from '../supabase';
import '../components/style/theme.css';

// ─── SVG base shapes ───────────────────────────────────────────────────────────

const Warn = ({ children }: { children: React.ReactNode }) => (
  <svg viewBox="0 0 100 100" width="72" height="72" xmlns="http://www.w3.org/2000/svg">
    <polygon points="50,6 96,90 4,90" fill="#FFFDE7" stroke="#E53935" strokeWidth="5.5" strokeLinejoin="round" />
    {children}
  </svg>
);

const Prohib = ({ children }: { children: React.ReactNode }) => (
  <svg viewBox="0 0 100 100" width="72" height="72" xmlns="http://www.w3.org/2000/svg">
    <circle cx="50" cy="50" r="46" fill="white" stroke="#E53935" strokeWidth="7" />
    {children}
  </svg>
);

const Mand = ({ children }: { children: React.ReactNode }) => (
  <svg viewBox="0 0 100 100" width="72" height="72" xmlns="http://www.w3.org/2000/svg">
    <circle cx="50" cy="50" r="46" fill="#1565C0" />
    {children}
  </svg>
);

// ─── Built-in signs data ────────────────────────────────────────────────────────

const svgMap: Record<string, React.ReactNode> = {
  // ── WARNING ──────────────────────────────────────────────────────────────────
  crossroads: (
    <Warn>
      <line x1="50" y1="32" x2="50" y2="80" stroke="#333" strokeWidth="7" strokeLinecap="round" />
      <line x1="22" y1="57" x2="78" y2="57" stroke="#333" strokeWidth="7" strokeLinecap="round" />
      <polygon points="50,32 44,46 56,46" fill="#333" />
      <polygon points="78,57 64,51 64,63" fill="#333" />
    </Warn>
  ),
  curve_right: (
    <Warn>
      <path d="M40,75 C40,40 70,35 60,28" fill="none" stroke="#333" strokeWidth="7" strokeLinecap="round" />
      <polygon points="60,28 52,40 64,42" fill="#333" />
    </Warn>
  ),
  curve_left: (
    <Warn>
      <path d="M60,75 C60,40 30,35 40,28" fill="none" stroke="#333" strokeWidth="7" strokeLinecap="round" />
      <polygon points="40,28 48,40 36,42" fill="#333" />
    </Warn>
  ),
  double_bend: (
    <Warn>
      <path d="M45,78 C45,62 62,58 58,46 C54,34 40,32 42,20" fill="none" stroke="#333" strokeWidth="6.5" strokeLinecap="round" />
      <polygon points="42,20 36,32 48,32" fill="#333" />
    </Warn>
  ),
  steep_descent: (
    <Warn>
      <line x1="30" y1="36" x2="70" y2="78" stroke="#333" strokeWidth="7" strokeLinecap="round" />
      <text x="52" y="50" fontSize="18" fontWeight="bold" fill="#333" fontFamily="Arial">%</text>
      <polygon points="70,78 56,72 64,62" fill="#333" />
    </Warn>
  ),
  slippery: (
    <Warn>
      <rect x="35" y="40" width="24" height="14" rx="2" fill="#333" />
      <circle cx="41" cy="62" r="5" fill="#333" />
      <circle cx="53" cy="62" r="5" fill="#333" />
      <path d="M28,68 Q38,58 50,66 Q62,74 72,64" fill="none" stroke="#333" strokeWidth="4" strokeLinecap="round" />
    </Warn>
  ),
  pedestrian: (
    <Warn>
      <circle cx="50" cy="30" r="6" fill="#333" />
      <line x1="50" y1="36" x2="50" y2="62" stroke="#333" strokeWidth="6" strokeLinecap="round" />
      <line x1="50" y1="46" x2="38" y2="56" stroke="#333" strokeWidth="5" strokeLinecap="round" />
      <line x1="50" y1="46" x2="62" y2="54" stroke="#333" strokeWidth="5" strokeLinecap="round" />
      <line x1="50" y1="62" x2="40" y2="78" stroke="#333" strokeWidth="5" strokeLinecap="round" />
      <line x1="50" y1="62" x2="60" y2="78" stroke="#333" strokeWidth="5" strokeLinecap="round" />
    </Warn>
  ),
  school: (
    <Warn>
      <circle cx="42" cy="30" r="5" fill="#333" />
      <circle cx="60" cy="28" r="5" fill="#333" />
      <line x1="42" y1="35" x2="38" y2="55" stroke="#333" strokeWidth="5" strokeLinecap="round" />
      <line x1="38" y1="44" x2="30" y2="52" stroke="#333" strokeWidth="4" strokeLinecap="round" />
      <line x1="38" y1="55" x2="32" y2="68" stroke="#333" strokeWidth="4" strokeLinecap="round" />
      <line x1="38" y1="55" x2="46" y2="67" stroke="#333" strokeWidth="4" strokeLinecap="round" />
      <line x1="60" y1="33" x2="56" y2="53" stroke="#333" strokeWidth="5" strokeLinecap="round" />
      <line x1="56" y1="42" x2="48" y2="49" stroke="#333" strokeWidth="4" strokeLinecap="round" />
      <line x1="56" y1="53" x2="50" y2="66" stroke="#333" strokeWidth="4" strokeLinecap="round" />
      <line x1="56" y1="53" x2="64" y2="65" stroke="#333" strokeWidth="4" strokeLinecap="round" />
    </Warn>
  ),
  roadworks: (
    <Warn>
      <circle cx="50" cy="30" r="6" fill="#E65100" />
      <line x1="50" y1="36" x2="50" y2="60" stroke="#E65100" strokeWidth="6" strokeLinecap="round" />
      <line x1="50" y1="48" x2="38" y2="56" stroke="#E65100" strokeWidth="5" strokeLinecap="round" />
      <line x1="50" y1="60" x2="40" y2="76" stroke="#E65100" strokeWidth="5" strokeLinecap="round" />
      <line x1="50" y1="60" x2="60" y2="76" stroke="#E65100" strokeWidth="5" strokeLinecap="round" />
      <line x1="54" y1="45" x2="66" y2="38" stroke="#E65100" strokeWidth="4" strokeLinecap="round" />
      <circle cx="69" cy="36" r="4" fill="#E65100" />
    </Warn>
  ),
  animals: (
    <Warn>
      <ellipse cx="48" cy="55" rx="16" ry="10" fill="#333" />
      <ellipse cx="60" cy="48" rx="8" ry="10" fill="#333" />
      <line x1="38" y1="63" x2="34" y2="78" stroke="#333" strokeWidth="5" strokeLinecap="round" />
      <line x1="44" y1="65" x2="42" y2="78" stroke="#333" strokeWidth="5" strokeLinecap="round" />
      <line x1="52" y1="65" x2="52" y2="78" stroke="#333" strokeWidth="5" strokeLinecap="round" />
      <line x1="58" y1="63" x2="60" y2="78" stroke="#333" strokeWidth="5" strokeLinecap="round" />
      <ellipse cx="65" cy="41" rx="3" ry="5" fill="#333" transform="rotate(-20 65 41)" />
      <ellipse cx="72" cy="40" rx="3" ry="5" fill="#333" transform="rotate(10 72 40)" />
      <circle cx="68" cy="38" r="3" fill="#333" />
    </Warn>
  ),
  narrow_road: (
    <Warn>
      <line x1="35" y1="30" x2="45" y2="78" stroke="#333" strokeWidth="5" strokeLinecap="round" />
      <line x1="65" y1="30" x2="55" y2="78" stroke="#333" strokeWidth="5" strokeLinecap="round" />
      <line x1="45" y1="78" x2="55" y2="78" stroke="#333" strokeWidth="5" strokeLinecap="round" />
    </Warn>
  ),
  traffic_light: (
    <Warn>
      <rect x="40" y="28" width="20" height="46" rx="3" fill="#333" />
      <circle cx="50" cy="37" r="6" fill="#E53935" />
      <circle cx="50" cy="51" r="6" fill="#FDD835" />
      <circle cx="50" cy="65" r="6" fill="#43A047" />
    </Warn>
  ),

  // ── PROHIBITION ──────────────────────────────────────────────────────────────
  no_entry: (
    <svg viewBox="0 0 100 100" width="72" height="72" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="50" r="46" fill="#E53935" />
      <rect x="18" y="42" width="64" height="16" rx="3" fill="white" />
    </svg>
  ),
  speed_30: (
    <Prohib>
      <text x="50" y="60" fontSize="30" fontWeight="900" fill="#E53935" textAnchor="middle" fontFamily="Arial">30</text>
    </Prohib>
  ),
  speed_50: (
    <Prohib>
      <text x="50" y="60" fontSize="30" fontWeight="900" fill="#E53935" textAnchor="middle" fontFamily="Arial">50</text>
    </Prohib>
  ),
  speed_70: (
    <Prohib>
      <text x="50" y="60" fontSize="30" fontWeight="900" fill="#E53935" textAnchor="middle" fontFamily="Arial">70</text>
    </Prohib>
  ),
  speed_90: (
    <Prohib>
      <text x="50" y="60" fontSize="30" fontWeight="900" fill="#E53935" textAnchor="middle" fontFamily="Arial">90</text>
    </Prohib>
  ),
  speed_110: (
    <Prohib>
      <text x="50" y="62" fontSize="24" fontWeight="900" fill="#E53935" textAnchor="middle" fontFamily="Arial">110</text>
    </Prohib>
  ),
  speed_130: (
    <Prohib>
      <text x="50" y="62" fontSize="24" fontWeight="900" fill="#E53935" textAnchor="middle" fontFamily="Arial">130</text>
    </Prohib>
  ),
  no_overtaking: (
    <Prohib>
      <rect x="30" y="35" width="20" height="12" rx="3" fill="#333" />
      <rect x="50" y="35" width="20" height="12" rx="3" fill="#E53935" />
      <rect x="30" y="52" width="6" height="14" rx="1" fill="#333" />
      <rect x="37" y="52" width="6" height="14" rx="1" fill="#333" />
      <rect x="57" y="52" width="6" height="14" rx="1" fill="#E53935" />
      <rect x="64" y="52" width="6" height="14" rx="1" fill="#E53935" />
      <line x1="18" y1="82" x2="82" y2="18" stroke="#E53935" strokeWidth="6" strokeLinecap="round" />
    </Prohib>
  ),
  no_parking: (
    <Prohib>
      <text x="50" y="62" fontSize="44" fontWeight="900" fill="#1565C0" textAnchor="middle" fontFamily="Arial">P</text>
      <line x1="20" y1="80" x2="80" y2="20" stroke="#E53935" strokeWidth="7" strokeLinecap="round" />
    </Prohib>
  ),
  no_stopping: (
    <svg viewBox="0 0 100 100" width="72" height="72" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="50" r="46" fill="white" stroke="#1565C0" strokeWidth="7" />
      <line x1="20" y1="80" x2="80" y2="20" stroke="#E53935" strokeWidth="7" strokeLinecap="round" />
    </svg>
  ),
  no_horn: (
    <Prohib>
      <path d="M30,40 L30,60 L42,60 L56,72 L56,28 L42,40 Z" fill="#333" />
      <path d="M60,40 Q70,50 60,60" fill="none" stroke="#333" strokeWidth="4" strokeLinecap="round" />
      <path d="M64,35 Q78,50 64,65" fill="none" stroke="#333" strokeWidth="4" strokeLinecap="round" />
      <line x1="18" y1="82" x2="82" y2="18" stroke="#E53935" strokeWidth="6" strokeLinecap="round" />
    </Prohib>
  ),
  end_speed_50: (
    <svg viewBox="0 0 100 100" width="72" height="72" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="50" r="46" fill="white" stroke="#777" strokeWidth="5" strokeDasharray="8,4" />
      <text x="50" y="60" fontSize="30" fontWeight="900" fill="#777" textAnchor="middle" fontFamily="Arial">50</text>
      <line x1="20" y1="80" x2="80" y2="20" stroke="#333" strokeWidth="5" strokeLinecap="round" />
    </svg>
  ),

  // ── MANDATORY ────────────────────────────────────────────────────────────────
  go_straight: (
    <Mand>
      <line x1="50" y1="75" x2="50" y2="30" stroke="white" strokeWidth="10" strokeLinecap="round" />
      <polygon points="50,18 36,38 64,38" fill="white" />
    </Mand>
  ),
  turn_right: (
    <Mand>
      <path d="M35,75 L35,45 Q35,25 55,25 L70,25" fill="none" stroke="white" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" />
      <polygon points="82,25 62,14 62,36" fill="white" />
    </Mand>
  ),
  turn_left: (
    <Mand>
      <path d="M65,75 L65,45 Q65,25 45,25 L30,25" fill="none" stroke="white" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" />
      <polygon points="18,25 38,14 38,36" fill="white" />
    </Mand>
  ),
  straight_or_right: (
    <Mand>
      <line x1="38" y1="75" x2="38" y2="30" stroke="white" strokeWidth="8" strokeLinecap="round" />
      <polygon points="38,18 26,36 50,36" fill="white" />
      <path d="M62,75 L62,50 Q62,32 78,32" fill="none" stroke="white" strokeWidth="8" strokeLinecap="round" />
      <polygon points="88,32 70,22 70,42" fill="white" />
    </Mand>
  ),
  keep_right: (
    <Mand>
      <path d="M30,68 Q30,30 70,30" fill="none" stroke="white" strokeWidth="10" strokeLinecap="round" />
      <polygon points="82,30 62,18 62,42" fill="white" />
    </Mand>
  ),
  roundabout: (
    <Mand>
      <circle cx="50" cy="50" r="22" fill="none" stroke="white" strokeWidth="8" />
      <polygon points="50,24 36,38 50,32 44,24" fill="white" />
      <polygon points="72,50 58,36 64,50 58,56" fill="white" />
      <polygon points="50,76 64,62 50,68 56,76" fill="white" />
      <polygon points="28,50 42,64 36,50 42,44" fill="white" />
    </Mand>
  ),
  min_speed_30: (
    <svg viewBox="0 0 100 100" width="72" height="72" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="50" r="46" fill="white" stroke="#1565C0" strokeWidth="7" />
      <text x="50" y="60" fontSize="30" fontWeight="900" fill="#1565C0" textAnchor="middle" fontFamily="Arial">30</text>
    </svg>
  ),

  // ── PRIORITY ─────────────────────────────────────────────────────────────────
  stop: (
    <svg viewBox="0 0 100 100" width="72" height="72" xmlns="http://www.w3.org/2000/svg">
      <polygon points="30,4 70,4 96,30 96,70 70,96 30,96 4,70 4,30" fill="#E53935" stroke="#E53935" />
      <polygon points="32,8 68,8 92,32 92,68 68,92 32,92 8,68 8,32" fill="none" stroke="white" strokeWidth="2" />
      <text x="50" y="60" fontSize="22" fontWeight="900" fill="white" textAnchor="middle" fontFamily="Arial" letterSpacing="1">STOP</text>
    </svg>
  ),
  give_way: (
    <svg viewBox="0 0 100 100" width="72" height="72" xmlns="http://www.w3.org/2000/svg">
      <polygon points="6,10 94,10 50,92" fill="white" stroke="#E53935" strokeWidth="5.5" strokeLinejoin="round" />
      <polygon points="14,16 86,16 50,80" fill="none" stroke="#E53935" strokeWidth="3" strokeLinejoin="round" />
    </svg>
  ),
  priority_road: (
    <svg viewBox="0 0 100 100" width="72" height="72" xmlns="http://www.w3.org/2000/svg">
      <rect x="22" y="22" width="56" height="56" rx="3" fill="#FDD835" stroke="#333" strokeWidth="3" transform="rotate(45 50 50)" />
      <rect x="28" y="28" width="44" height="44" rx="2" fill="white" transform="rotate(45 50 50)" />
    </svg>
  ),
  end_priority: (
    <svg viewBox="0 0 100 100" width="72" height="72" xmlns="http://www.w3.org/2000/svg">
      <rect x="22" y="22" width="56" height="56" rx="3" fill="#FDD835" stroke="#333" strokeWidth="3" transform="rotate(45 50 50)" />
      <rect x="28" y="28" width="44" height="44" rx="2" fill="white" transform="rotate(45 50 50)" />
      <line x1="25" y1="75" x2="75" y2="25" stroke="#333" strokeWidth="5" strokeLinecap="round" />
    </svg>
  ),

  // ── INFORMATION ───────────────────────────────────────────────────────────────
  parking: (
    <svg viewBox="0 0 100 100" width="72" height="72" xmlns="http://www.w3.org/2000/svg">
      <rect x="4" y="4" width="92" height="92" rx="8" fill="#1565C0" />
      <text x="50" y="68" fontSize="62" fontWeight="900" fill="white" textAnchor="middle" fontFamily="Arial">P</text>
    </svg>
  ),
  hospital: (
    <svg viewBox="0 0 100 100" width="72" height="72" xmlns="http://www.w3.org/2000/svg">
      <rect x="4" y="4" width="92" height="92" rx="8" fill="#1565C0" />
      <rect x="42" y="22" width="16" height="56" rx="3" fill="white" />
      <rect x="22" y="42" width="56" height="16" rx="3" fill="white" />
    </svg>
  ),
  highway_start: (
    <svg viewBox="0 0 100 100" width="72" height="72" xmlns="http://www.w3.org/2000/svg">
      <rect x="4" y="4" width="92" height="92" rx="8" fill="#1565C0" />
      <path d="M20,72 L35,28 L50,52 L65,28 L80,72" fill="none" stroke="white" strokeWidth="7" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  ),
  speed_camera: (
    <svg viewBox="0 0 100 100" width="72" height="72" xmlns="http://www.w3.org/2000/svg">
      <rect x="4" y="4" width="92" height="92" rx="8" fill="#1565C0" />
      <rect x="20" y="38" width="42" height="28" rx="4" fill="white" />
      <circle cx="62" cy="38" r="14" fill="none" stroke="white" strokeWidth="5" />
      <circle cx="62" cy="38" r="6" fill="white" />
      <line x1="62" y1="18" x2="62" y2="14" stroke="white" strokeWidth="4" strokeLinecap="round" />
      <line x1="76" y1="24" x2="79" y2="21" stroke="white" strokeWidth="4" strokeLinecap="round" />
    </svg>
  ),
};

// ─── Signs data ─────────────────────────────────────────────────────────────────

interface BuiltInSign {
  id: string;
  category: 'warning' | 'prohibition' | 'mandatory' | 'priority' | 'information';
  nameEn: string; nameFr: string; nameAr: string;
  descEn: string; descFr: string; descAr: string;
}

const BUILT_IN_SIGNS: BuiltInSign[] = [
  // WARNING
  { id: 'crossroads',    category: 'warning', nameEn: 'Dangerous Crossroads',  nameFr: 'Carrefour dangereux',       nameAr: 'تقاطع خطير',
    descEn: 'Intersection ahead — yield to crossing traffic.',
    descFr: 'Intersection en avant — cédez le passage.',
    descAr: 'تقاطع طرق أمامك — أعطِ الأولوية للمرور المتقاطع.' },
  { id: 'curve_right',   category: 'warning', nameEn: 'Curve to the Right',    nameFr: 'Virage à droite',           nameAr: 'منعطف يميني',
    descEn: 'Sharp bend to the right ahead — reduce speed.',
    descFr: 'Virage serré à droite — réduisez la vitesse.',
    descAr: 'منعطف حاد إلى اليمين — خففوا السرعة.' },
  { id: 'curve_left',    category: 'warning', nameEn: 'Curve to the Left',     nameFr: 'Virage à gauche',           nameAr: 'منعطف يساري',
    descEn: 'Sharp bend to the left ahead — reduce speed.',
    descFr: 'Virage serré à gauche — réduisez la vitesse.',
    descAr: 'منعطف حاد إلى اليسار — خففوا السرعة.' },
  { id: 'double_bend',   category: 'warning', nameEn: 'Double Bend',           nameFr: 'Succession de virages',     nameAr: 'تعاقب المنعطفات',
    descEn: 'Two or more successive bends ahead.',
    descFr: 'Deux virages successifs ou plus en avant.',
    descAr: 'منعطفان أو أكثر متتاليان أمامك.' },
  { id: 'steep_descent', category: 'warning', nameEn: 'Steep Descent',         nameFr: 'Descente dangereuse',       nameAr: 'منحدر خطير',
    descEn: 'Steep downhill slope — use lower gear, avoid braking.',
    descFr: 'Pente descendante importante — réduisez la vitesse.',
    descAr: 'منحدر شديد — استخدم نقلة منخفضة وتجنب الكبح المفاجئ.' },
  { id: 'slippery',      category: 'warning', nameEn: 'Slippery Road',         nameFr: 'Chaussée glissante',        nameAr: 'طريق زلق',
    descEn: 'Road may be slippery — reduce speed, avoid harsh braking.',
    descFr: 'Chaussée peut être glissante — ralentissez.',
    descAr: 'قد يكون الطريق زلقاً — خففوا السرعة وتجنبوا الفرملة المفاجئة.' },
  { id: 'pedestrian',    category: 'warning', nameEn: 'Pedestrian Crossing',   nameFr: 'Passage piétons',           nameAr: 'معبر للمشاة',
    descEn: 'Pedestrians may be crossing — slow down and give way.',
    descFr: 'Des piétons peuvent traverser — ralentissez.',
    descAr: 'قد يعبر المشاة — تباطأ وأعطِ الأولوية.' },
  { id: 'school',        category: 'warning', nameEn: 'School / Children',     nameFr: 'École / Enfants',           nameAr: 'مدرسة / أطفال',
    descEn: 'Children may be crossing near a school — drive slowly.',
    descFr: 'Enfants peuvent traverser — conduisez lentement.',
    descAr: 'قد يعبر أطفال بالقرب من مدرسة — سِر ببطء.' },
  { id: 'roadworks',     category: 'warning', nameEn: 'Road Works',            nameFr: 'Travaux',                   nameAr: 'أشغال الطريق',
    descEn: 'Road works ahead — expect delays and reduced lanes.',
    descFr: 'Travaux en cours — attendez-vous à des ralentissements.',
    descAr: 'أشغال طريق أمامك — توقع تأخيرات وتضييق مسارات.' },
  { id: 'animals',       category: 'warning', nameEn: 'Wild Animals Crossing', nameFr: 'Animaux sauvages',          nameAr: 'عبور الحيوانات البرية',
    descEn: 'Wild animals may cross the road — be alert.',
    descFr: 'Des animaux sauvages peuvent traverser — restez vigilant.',
    descAr: 'قد تعبر حيوانات برية الطريق — كونوا يقظين.' },
  { id: 'narrow_road',   category: 'warning', nameEn: 'Road Narrows',          nameFr: 'Rétrécissement de chaussée',nameAr: 'ضيق الطريق',
    descEn: 'Road becomes narrower ahead — keep to your lane.',
    descFr: 'La route devient plus étroite — restez dans votre voie.',
    descAr: 'يضيق الطريق أمامك — التزم بمسارك.' },
  { id: 'traffic_light', category: 'warning', nameEn: 'Traffic Lights Ahead', nameFr: 'Feux de signalisation',     nameAr: 'إشارات مرور أمامك',
    descEn: 'Traffic lights at the next junction.',
    descFr: 'Feux de signalisation au prochain carrefour.',
    descAr: 'إشارات مرور في التقاطع التالي.' },

  // PROHIBITION
  { id: 'no_entry',      category: 'prohibition', nameEn: 'No Entry',          nameFr: 'Sens interdit',             nameAr: 'ممنوع الدخول',
    descEn: 'Entry forbidden for all vehicles — wrong way.',
    descFr: 'Accès interdit à tout véhicule — sens interdit.',
    descAr: 'يُحظر الدخول على جميع المركبات — الاتجاه الخاطئ.' },
  { id: 'speed_30',      category: 'prohibition', nameEn: 'Speed Limit 30',    nameFr: 'Limitation 30 km/h',        nameAr: 'حد السرعة 30',
    descEn: 'Maximum speed 30 km/h in this zone.',
    descFr: 'Vitesse maximale autorisée : 30 km/h.',
    descAr: 'الحد الأقصى للسرعة 30 كم/ساعة في هذه المنطقة.' },
  { id: 'speed_50',      category: 'prohibition', nameEn: 'Speed Limit 50',    nameFr: 'Limitation 50 km/h',        nameAr: 'حد السرعة 50',
    descEn: 'Maximum speed 50 km/h (standard urban limit).',
    descFr: 'Vitesse maximale : 50 km/h (limite urbaine standard).',
    descAr: 'الحد الأقصى للسرعة 50 كم/ساعة (الحد الحضري المعتاد).' },
  { id: 'speed_70',      category: 'prohibition', nameEn: 'Speed Limit 70',    nameFr: 'Limitation 70 km/h',        nameAr: 'حد السرعة 70',
    descEn: 'Maximum speed 70 km/h.',
    descFr: 'Vitesse maximale : 70 km/h.',
    descAr: 'الحد الأقصى للسرعة 70 كم/ساعة.' },
  { id: 'speed_90',      category: 'prohibition', nameEn: 'Speed Limit 90',    nameFr: 'Limitation 90 km/h',        nameAr: 'حد السرعة 90',
    descEn: 'Maximum speed 90 km/h (rural roads).',
    descFr: 'Vitesse maximale : 90 km/h (routes rurales).',
    descAr: 'الحد الأقصى للسرعة 90 كم/ساعة (الطرق الريفية).' },
  { id: 'speed_110',     category: 'prohibition', nameEn: 'Speed Limit 110',   nameFr: 'Limitation 110 km/h',       nameAr: 'حد السرعة 110',
    descEn: 'Maximum speed 110 km/h (expressways).',
    descFr: 'Vitesse maximale : 110 km/h (voies express).',
    descAr: 'الحد الأقصى للسرعة 110 كم/ساعة (الطرق السريعة).' },
  { id: 'speed_130',     category: 'prohibition', nameEn: 'Speed Limit 130',   nameFr: 'Limitation 130 km/h',       nameAr: 'حد السرعة 130',
    descEn: 'Maximum speed 130 km/h (motorways, dry road).',
    descFr: 'Vitesse maximale : 130 km/h (autoroute, route sèche).',
    descAr: 'الحد الأقصى للسرعة 130 كم/ساعة (الطريق السيار، طريق جافة).' },
  { id: 'no_overtaking', category: 'prohibition', nameEn: 'No Overtaking',     nameFr: 'Dépassement interdit',      nameAr: 'ممنوع التجاوز',
    descEn: 'Overtaking other motor vehicles is forbidden.',
    descFr: 'Il est interdit de dépasser d\'autres véhicules à moteur.',
    descAr: 'يُحظر تجاوز المركبات الأخرى.' },
  { id: 'no_parking',    category: 'prohibition', nameEn: 'No Parking',        nameFr: 'Stationnement interdit',    nameAr: 'ممنوع الوقوف',
    descEn: 'Parking is not allowed at any time.',
    descFr: 'Le stationnement est interdit à tout moment.',
    descAr: 'يُحظر ركن السيارة في أي وقت.' },
  { id: 'no_stopping',   category: 'prohibition', nameEn: 'No Stopping',       nameFr: 'Arrêt et stationnement interdits', nameAr: 'ممنوع التوقف',
    descEn: 'Both stopping and parking are forbidden.',
    descFr: 'L\'arrêt et le stationnement sont tous deux interdits.',
    descAr: 'يُحظر كل من التوقف والركن.' },
  { id: 'no_horn',       category: 'prohibition', nameEn: 'No Horns',          nameFr: 'Klaxon interdit',           nameAr: 'ممنوع العزف بالبوق',
    descEn: 'Use of horn is prohibited in this area.',
    descFr: 'L\'utilisation du klaxon est interdite dans cette zone.',
    descAr: 'يُحظر استخدام البوق في هذه المنطقة.' },
  { id: 'end_speed_50',  category: 'prohibition', nameEn: 'End of Speed Limit 50', nameFr: 'Fin de limitation 50',  nameAr: 'نهاية حد السرعة 50',
    descEn: 'End of the 50 km/h speed limit.',
    descFr: 'Fin de la limitation de vitesse à 50 km/h.',
    descAr: 'نهاية حد السرعة 50 كم/ساعة.' },

  // MANDATORY
  { id: 'go_straight',        category: 'mandatory', nameEn: 'Go Straight',           nameFr: 'Tout droit obligatoire',      nameAr: 'إلزامي السير قُدُماً',
    descEn: 'You must go straight — no turns allowed.',
    descFr: 'Vous devez aller tout droit — aucun virage autorisé.',
    descAr: 'يجب السير مستقيماً — لا يُسمح بالانعطاف.' },
  { id: 'turn_right',         category: 'mandatory', nameEn: 'Turn Right Ahead',      nameFr: 'Direction obligatoire droite', nameAr: 'إلزامي الانعطاف يميناً',
    descEn: 'You must turn right at the next junction.',
    descFr: 'Vous devez tourner à droite au prochain carrefour.',
    descAr: 'يجب الانعطاف يميناً في التقاطع التالي.' },
  { id: 'turn_left',          category: 'mandatory', nameEn: 'Turn Left Ahead',       nameFr: 'Direction obligatoire gauche', nameAr: 'إلزامي الانعطاف يساراً',
    descEn: 'You must turn left at the next junction.',
    descFr: 'Vous devez tourner à gauche au prochain carrefour.',
    descAr: 'يجب الانعطاف يساراً في التقاطع التالي.' },
  { id: 'straight_or_right',  category: 'mandatory', nameEn: 'Straight or Right',     nameFr: 'Tout droit ou à droite',      nameAr: 'قُدُماً أو يميناً',
    descEn: 'You may go straight or turn right only.',
    descFr: 'Vous pouvez aller tout droit ou tourner à droite.',
    descAr: 'يمكنك السير قُدُماً أو الانعطاف يميناً فقط.' },
  { id: 'keep_right',         category: 'mandatory', nameEn: 'Keep Right',            nameFr: 'Serrez à droite',             nameAr: 'التزم باليمين',
    descEn: 'Keep to the right side of the obstacle ahead.',
    descFr: 'Serrez à droite de l\'obstacle en avant.',
    descAr: 'التزم بالجانب الأيمن للعائق أمامك.' },
  { id: 'roundabout',         category: 'mandatory', nameEn: 'Roundabout',            nameFr: 'Sens giratoire obligatoire',  nameAr: 'نقطة دوران إلزامية',
    descEn: 'Traffic must circulate around the roundabout.',
    descFr: 'La circulation doit se faire dans le sens giratoire.',
    descAr: 'يجب على حركة المرور الالتفاف حول الدوار.' },
  { id: 'min_speed_30',       category: 'mandatory', nameEn: 'Minimum Speed 30',      nameFr: 'Vitesse minimale 30 km/h',   nameAr: 'الحد الأدنى للسرعة 30',
    descEn: 'Minimum speed of 30 km/h is required.',
    descFr: 'Une vitesse minimale de 30 km/h est obligatoire.',
    descAr: 'الحد الأدنى المطلوب للسرعة هو 30 كم/ساعة.' },

  // PRIORITY
  { id: 'stop',          category: 'priority', nameEn: 'Stop',              nameFr: 'Stop',                   nameAr: 'قف',
    descEn: 'Come to a complete stop and give way to all traffic.',
    descFr: 'Arrêtez-vous complètement et cédez le passage.',
    descAr: 'توقف تماماً وأعطِ الأولوية لجميع المركبات.' },
  { id: 'give_way',      category: 'priority', nameEn: 'Give Way',          nameFr: 'Cédez le passage',       nameAr: 'أعطِ الأولوية',
    descEn: 'Yield to vehicles on the major road.',
    descFr: 'Cédez le passage aux véhicules sur la route principale.',
    descAr: 'أعطِ الأولوية للمركبات على الطريق الرئيسي.' },
  { id: 'priority_road', category: 'priority', nameEn: 'Priority Road',     nameFr: 'Route prioritaire',      nameAr: 'طريق ذو أولوية',
    descEn: 'You are on the priority road — you have right of way.',
    descFr: 'Vous êtes sur une route prioritaire — vous avez la priorité.',
    descAr: 'أنت على طريق ذي أولوية — لديك حق المرور.' },
  { id: 'end_priority',  category: 'priority', nameEn: 'End of Priority Road', nameFr: 'Fin de route prioritaire', nameAr: 'نهاية الطريق ذي الأولوية',
    descEn: 'End of priority road — give way at the next junction.',
    descFr: 'Fin de route prioritaire — cédez le passage au prochain carrefour.',
    descAr: 'نهاية الطريق ذي الأولوية — أعطِ الأولوية في التقاطع التالي.' },

  // INFORMATION
  { id: 'parking',       category: 'information', nameEn: 'Parking',          nameFr: 'Parking',               nameAr: 'موقف سيارات',
    descEn: 'Parking area ahead.',
    descFr: 'Zone de stationnement en avant.',
    descAr: 'منطقة ركن السيارات أمامك.' },
  { id: 'hospital',      category: 'information', nameEn: 'Hospital',         nameFr: 'Hôpital',               nameAr: 'مستشفى',
    descEn: 'Hospital nearby — drive quietly, no horn.',
    descFr: 'Hôpital à proximité — conduisez calmement, pas de klaxon.',
    descAr: 'مستشفى قريب — سِر بهدوء ولا تستخدم البوق.' },
  { id: 'highway_start', category: 'information', nameEn: 'Motorway',         nameFr: 'Autoroute',             nameAr: 'طريق سيار',
    descEn: 'Beginning of motorway — motorway rules apply.',
    descFr: 'Début d\'autoroute — les règles d\'autoroute s\'appliquent.',
    descAr: 'بداية الطريق السيار — تطبق قواعد الطريق السيار.' },
  { id: 'speed_camera',  category: 'information', nameEn: 'Speed Camera',     nameFr: 'Radar de contrôle',     nameAr: 'رادار السرعة',
    descEn: 'Speed enforcement camera ahead — check your speed.',
    descFr: 'Radar de contrôle en avant — vérifiez votre vitesse.',
    descAr: 'رادار مراقبة السرعة أمامك — تحقق من سرعتك.' },
];

const CATEGORIES = [
  { id: 'all',         labelEn: 'All Signs',    labelFr: 'Tous',             labelAr: 'الكل',       color: '#F5A623' },
  { id: 'warning',     labelEn: 'Warning',      labelFr: 'Avertissement',    labelAr: 'تحذيرية',    color: '#F59E0B' },
  { id: 'prohibition', labelEn: 'Prohibition',  labelFr: 'Interdiction',     labelAr: 'منع',        color: '#EF4444' },
  { id: 'mandatory',   labelEn: 'Mandatory',    labelFr: 'Obligatoire',      labelAr: 'إلزامية',    color: '#3B82F6' },
  { id: 'priority',    labelEn: 'Priority',     labelFr: 'Priorité',         labelAr: 'أولوية',     color: '#FDD835' },
  { id: 'information', labelEn: 'Information',  labelFr: 'Information',      labelAr: 'إعلامية',    color: '#10B981' },
];

interface DbSign {
  id: string;
  nameAr: string; nameFr: string; nameEn: string;
  commentAr: string; commentFr: string; commentEn: string;
  category: string;
  imageUrl: string;
}

// ─── Main component ─────────────────────────────────────────────────────────────

const StudentSignsContent = () => {
  const { language } = useLanguage();
  const navigate = useNavigate();

  const [dbSigns, setDbSigns] = useState<DbSign[]>([]);
  const [filterCat, setFilterCat] = useState('all');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<{ svg: React.ReactNode | null; img: string | null; sign: BuiltInSign | DbSign } | null>(null);

  const t = (ar: string, fr: string, en: string) =>
    language === 'ar' ? ar : language === 'fr' ? fr : en;

  useEffect(() => {
    supabase
      .from('trafficSigns')
      .select('*')
      .eq('published', true)
      .then(({ data }) => { if (data) setDbSigns(data as DbSign[]); });
  }, []);

  const getName = (s: BuiltInSign | DbSign) =>
    language === 'ar' ? s.nameAr : language === 'fr' ? s.nameFr : s.nameEn;

  const getDesc = (s: BuiltInSign | DbSign) => {
    if ('descEn' in s) return language === 'ar' ? s.descAr : language === 'fr' ? s.descFr : s.descEn;
    return language === 'ar' ? s.commentAr : language === 'fr' ? s.commentFr : s.commentEn;
  };

  const catColor = (cat: string) => CATEGORIES.find(c => c.id === cat)?.color ?? '#F5A623';

  const allSigns = [
    ...BUILT_IN_SIGNS,
    ...dbSigns.filter(d => !BUILT_IN_SIGNS.find(b => b.id === d.id)),
  ];

  const filtered = allSigns.filter(s => {
    const matchCat = filterCat === 'all' || s.category === filterCat;
    const q = search.toLowerCase();
    const matchSearch = !q || getName(s).toLowerCase().includes(q);
    return matchCat && matchSearch;
  });

  const catLabel = (c: typeof CATEGORIES[0]) =>
    language === 'ar' ? c.labelAr : language === 'fr' ? c.labelFr : c.labelEn;

  const card: React.CSSProperties = {
    background: 'var(--bg-card)', border: '1px solid var(--border)',
    borderRadius: 'var(--radius-lg)',
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-main)', color: 'var(--text-white)', display: 'flex', flexDirection: 'column' }}>
      <Navbar />
      <main style={{ flex: 1, padding: '1.5rem 1rem', maxWidth: 900, margin: '0 auto', width: '100%' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: '1.5rem' }}>
          <button onClick={() => navigate('/student-dashboard')}
            style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, padding: 0 }}>
            <ArrowLeft size={18} /> {t('العودة', 'Retour', 'Back')}
          </button>
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary)' }}>
            {t('لوحات التشوير', 'Panneaux de signalisation', 'Road Signs')}
          </h1>
          <p style={{ margin: '0.35rem 0 0', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
            {t('تعلم وتعرف على علامات الطريق', 'Apprenez et reconnaissez les panneaux routiers', 'Learn and recognise road signs')}
          </p>
        </div>

        {/* Search */}
        <div style={{ position: 'relative', marginBottom: '1rem' }}>
          <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={t('ابحث عن لافتة...', 'Rechercher un panneau...', 'Search signs...')}
            style={{ width: '100%', padding: '10px 14px 10px 38px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-white)', fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
          />
        </div>

        {/* Category tabs */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: '1.25rem' }}>
          {CATEGORIES.map(c => (
            <button
              key={c.id}
              onClick={() => setFilterCat(c.id)}
              style={{
                padding: '6px 14px', borderRadius: 20, fontSize: 13, fontWeight: 600, cursor: 'pointer', border: 'none',
                background: filterCat === c.id ? c.color : 'var(--bg-card)',
                color: filterCat === c.id ? '#000' : 'var(--text-secondary)',
                outline: filterCat === c.id ? 'none' : '1px solid var(--border)',
              }}
            >
              {catLabel(c)} {filterCat === c.id && <span style={{ opacity: 0.7 }}>({filtered.length})</span>}
            </button>
          ))}
        </div>

        {/* Signs grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 12 }}>
          {filtered.map(sign => {
            const dbMatch = dbSigns.find(d => d.id === sign.id);
            const imgUrl = dbMatch?.imageUrl ?? ('imageUrl' in sign ? sign.imageUrl : '');
            const svgIcon = 'descEn' in sign ? svgMap[sign.id] : null;
            return (
              <button
                key={sign.id}
                onClick={() => setSelected({ svg: svgIcon, img: imgUrl || null, sign })}
                style={{ ...card, padding: '1rem 0.75rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, cursor: 'pointer', textAlign: 'center', border: `1px solid ${catColor(sign.category)}33`, transition: 'transform .15s', }}
                onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.04)')}
                onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
              >
                <div style={{ width: 72, height: 72, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {imgUrl
                    ? <img src={imgUrl} alt={getName(sign)} style={{ width: 72, height: 72, objectFit: 'contain', borderRadius: 4 }} />
                    : svgIcon ?? <div style={{ width: 72, height: 72, borderRadius: 8, background: `${catColor(sign.category)}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: catColor(sign.category) }}>?</div>
                  }
                </div>
                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-white)', lineHeight: 1.3 }}>{getName(sign)}</div>
                <div style={{ width: 28, height: 3, borderRadius: 2, background: catColor(sign.category), marginTop: 2 }} />
              </button>
            );
          })}
        </div>

        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
            {t('لا توجد نتائج', 'Aucun résultat', 'No results found')}
          </div>
        )}
      </main>
      <Footer />

      {/* Detail modal */}
      {selected && (
        <div
          onClick={() => setSelected(null)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{ ...card, padding: '2rem', maxWidth: 420, width: '100%', position: 'relative' }}
          >
            <button onClick={() => setSelected(null)}
              style={{ position: 'absolute', top: 12, right: 12, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
              <X size={20} />
            </button>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
              <div style={{ width: 110, height: 110, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {selected.img
                  ? <img src={selected.img} alt={getName(selected.sign)} style={{ width: 110, height: 110, objectFit: 'contain' }} />
                  : selected.svg
                    ? <div style={{ transform: 'scale(1.5)' }}>{selected.svg}</div>
                    : null}
              </div>

              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', color: catColor(selected.sign.category), marginBottom: 4 }}>
                  {catLabel(CATEGORIES.find(c => c.id === selected.sign.category)!)}
                </div>
                <h2 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800 }}>{getName(selected.sign)}</h2>
              </div>

              <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)', textAlign: 'center', lineHeight: 1.6 }}>
                {getDesc(selected.sign)}
              </p>

              {/* All 3 language names */}
              <div style={{ width: '100%', background: 'var(--bg-mid)', borderRadius: 10, padding: '0.75rem 1rem', display: 'flex', flexDirection: 'column', gap: 6 }}>
                {[['🇩🇿', selected.sign.nameAr], ['🇫🇷', selected.sign.nameFr], ['🇬🇧', selected.sign.nameEn]].map(([flag, name]) => (
                  <div key={flag} style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: '0.82rem' }}>
                    <span>{flag}</span>
                    <span style={{ color: 'var(--text-secondary)' }}>{name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const StudentSigns = () => (
  <LanguageProvider>
    <StudentSignsContent />
  </LanguageProvider>
);

export default StudentSigns;
