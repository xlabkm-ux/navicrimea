/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Map as MapIcon, 
  List, 
  Search, 
  Calendar, 
  Navigation, 
  ShieldCheck, 
  ChevronRight,
  MapPin,
  RefreshCw,
  User,
  X,
  Globe,
  ChevronDown,
  Mic
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface GeoObject {
  id: number;
  name: string;
  type: string;
  description: string;
  lat: number;
  lng: number;
  price_per_night: number;
  image_url: string;
  ical_sync_url?: string;
}

type Language = 'ru' | 'en' | 'zh' | 'hi' | 'es' | 'fr' | 'ar' | 'bn' | 'pt' | 'ja';

const languages: { code: Language; name: string; native: string }[] = [
  { code: 'ru', name: 'Russian', native: 'Русский' },
  { code: 'en', name: 'English', native: 'English' },
  { code: 'zh', name: 'Chinese', native: '中文' },
  { code: 'hi', name: 'Hindi', native: 'हिन्दी' },
  { code: 'es', name: 'Spanish', native: 'Español' },
  { code: 'fr', name: 'French', native: 'Français' },
  { code: 'ar', name: 'Arabic', native: 'العربية' },
  { code: 'bn', name: 'Bengali', native: 'বাংলা' },
  { code: 'pt', name: 'Portuguese', native: 'Português' },
  { code: 'ja', name: 'Japanese', native: '日本語' },
];

const translations: Record<Language, any> = {
  ru: {
    stays: 'Жилье',
    routes: 'Маршруты',
    experiences: 'Впечатления',
    safety: 'Безопасность',
    cabinet: 'Кабинет',
    search: 'Поиск по названию или типу...',
    list: 'Список',
    map: 'Карта',
    night: 'ночь',
    syncStatus: 'Статус синхронизации',
    icalActive: 'iCal Активен',
    manualOnly: 'Только вручную',
    verification: 'Верификация',
    verifiedHost: 'Проверенный хост',
    checkAvailability: 'Проверить наличие',
    noObjects: 'Объекты не найдены в этой области.',
    postgis: 'PostGIS: Активен',
    s3: 'S3 Хранилище: Подключено',
    systemTime: 'Системное время',
    region: 'Регион: Крым (RU)'
  },
  en: {
    stays: 'Stays',
    routes: 'Routes',
    experiences: 'Experiences',
    safety: 'Safety',
    cabinet: 'Cabinet',
    search: 'Search by name or type...',
    list: 'List',
    map: 'Map',
    night: 'night',
    syncStatus: 'Sync Status',
    icalActive: 'iCal Active',
    manualOnly: 'Manual Only',
    verification: 'Verification',
    verifiedHost: 'Verified Host',
    checkAvailability: 'Check Availability',
    noObjects: 'No objects found in this area.',
    postgis: 'PostGIS: Active',
    s3: 'S3 Storage: Connected',
    systemTime: 'System Time',
    region: 'Region: Crimea (RU)'
  },
  zh: {
    stays: '住宿',
    routes: '路线',
    experiences: '体验',
    safety: '安全',
    cabinet: '个人中心',
    search: '按名称或类型搜索...',
    list: '列表',
    map: '地图',
    night: '晚',
    syncStatus: '同步状态',
    icalActive: 'iCal 已激活',
    manualOnly: '仅手动',
    verification: '验证',
    verifiedHost: '已验证房东',
    checkAvailability: '检查可用性',
    noObjects: '该区域未找到对象。',
    postgis: 'PostGIS: 激活',
    s3: 'S3 存储: 已连接',
    systemTime: '系统时间',
    region: '地区: 克里米亚 (RU)'
  },
  hi: {
    stays: 'ठहरने की जगह',
    routes: 'मार्ग',
    experiences: 'अनुभव',
    safety: 'सुरक्षा',
    cabinet: 'कैबिनेट',
    search: 'नाम या प्रकार से खोजें...',
    list: 'सूची',
    map: 'मानचित्र',
    night: 'रात',
    syncStatus: 'सिंक स्थिति',
    icalActive: 'iCal सक्रिय',
    manualOnly: 'केवल मैनुअल',
    verification: 'सत्यापन',
    verifiedHost: 'सत्यापित मेजबान',
    checkAvailability: 'उपलब्धता जांचें',
    noObjects: 'इस क्षेत्र में कोई वस्तु नहीं मिली।',
    postgis: 'PostGIS: सक्रिय',
    s3: 'S3 स्टोरेज: कनेक्टेड',
    systemTime: 'सिस्टम समय',
    region: 'क्षेत्र: क्रीमिया (RU)'
  },
  es: {
    stays: 'Estancias',
    routes: 'Rutas',
    experiences: 'Experiencias',
    safety: 'Seguridad',
    cabinet: 'Gabinete',
    search: 'Buscar por nombre o tipo...',
    list: 'Lista',
    map: 'Mapa',
    night: 'noche',
    syncStatus: 'Estado de sincronización',
    icalActive: 'iCal Activo',
    manualOnly: 'Solo manual',
    verification: 'Verificación',
    verifiedHost: 'Anfitrión verificado',
    checkAvailability: 'Consultar disponibilidad',
    noObjects: 'No se encontraron objetos en esta área.',
    postgis: 'PostGIS: Activo',
    s3: 'Almacenamiento S3: Conectado',
    systemTime: 'Hora del sistema',
    region: 'Región: Crimea (RU)'
  },
  fr: {
    stays: 'Séjours',
    routes: 'Itinéraires',
    experiences: 'Expériences',
    safety: 'Sécurité',
    cabinet: 'Cabinet',
    search: 'Rechercher par nom ou type...',
    list: 'Liste',
    map: 'Carte',
    night: 'nuit',
    syncStatus: 'État de synchronisation',
    icalActive: 'iCal Actif',
    manualOnly: 'Manuel uniquement',
    verification: 'Vérification',
    verifiedHost: 'Hôte vérifié',
    checkAvailability: 'Vérifier la disponibilité',
    noObjects: 'Aucun objet trouvé dans cette zone.',
    postgis: 'PostGIS: Actif',
    s3: 'Stockage S3: Connecté',
    systemTime: 'Heure système',
    region: 'Région: Crimée (RU)'
  },
  ar: {
    stays: 'الإقامة',
    routes: 'الطرق',
    experiences: 'التجارب',
    safety: 'الأمان',
    cabinet: 'المكتب',
    search: 'البحث بالاسم أو النوع...',
    list: 'قائمة',
    map: 'خريطة',
    night: 'ليلة',
    syncStatus: 'حالة المزامنة',
    icalActive: 'iCal نشط',
    manualOnly: 'يدوي فقط',
    verification: 'التحقق',
    verifiedHost: 'مضيف موثق',
    checkAvailability: 'التحقق من التوفر',
    noObjects: 'لم يتم العثور على كائنات في هذه المنطقة.',
    postgis: 'PostGIS: نشط',
    s3: 'تخزين S3: متصل',
    systemTime: 'وقت النظام',
    region: 'المنطقة: القرم (RU)'
  },
  bn: {
    stays: 'থাকার জায়গা',
    routes: 'রুট',
    experiences: 'অভিজ্ঞতা',
    safety: 'নিরাপত্তা',
    cabinet: 'ক্যাবিনেট',
    search: 'নাম বা ধরন দিয়ে খুঁজুন...',
    list: 'তালিকা',
    map: 'মানচিত্র',
    night: 'রাত',
    syncStatus: 'সিঙ্ক অবস্থা',
    icalActive: 'iCal সক্রিয়',
    manualOnly: 'শুধুমাত্র ম্যানুয়াল',
    verification: 'যাচাইকরণ',
    verifiedHost: 'যাচাইকৃত হোস্ট',
    checkAvailability: 'উপলব্ধতা পরীক্ষা করুন',
    noObjects: 'এই এলাকায় কোনো বস্তু পাওয়া যায়নি।',
    postgis: 'PostGIS: সক্রিয়',
    s3: 'S3 স্টোরেজ: সংযুক্ত',
    systemTime: 'সিস্টেম সময়',
    region: 'অঞ্চল: ক্রিমিয়া (RU)'
  },
  pt: {
    stays: 'Estadias',
    routes: 'Rotas',
    experiences: 'Experiências',
    safety: 'Segurança',
    cabinet: 'Gabinete',
    search: 'Buscar por nome ou tipo...',
    list: 'Lista',
    map: 'Mapa',
    night: 'noite',
    syncStatus: 'Estado de sincronização',
    icalActive: 'iCal Ativo',
    manualOnly: 'Apenas manual',
    verification: 'Verificação',
    verifiedHost: 'Anfitrião verificado',
    checkAvailability: 'Verificar disponibilidade',
    noObjects: 'Nenhum objeto encontrado nesta área.',
    postgis: 'PostGIS: Ativo',
    s3: 'Armazenamento S3: Conectado',
    systemTime: 'Hora do sistema',
    region: 'Região: Crimeia (RU)'
  },
  ja: {
    stays: '宿泊',
    routes: 'ルート',
    experiences: '体験',
    safety: '安全',
    cabinet: 'キャビネット',
    search: '名前またはタイプで検索...',
    list: 'リスト',
    map: 'マップ',
    night: '泊',
    syncStatus: '同期ステータス',
    icalActive: 'iCal 有効',
    manualOnly: '手動のみ',
    verification: '認証',
    verifiedHost: '認証済みホスト',
    checkAvailability: '空き状況を確認',
    noObjects: 'このエリアにはオブジェクトが見つかりませんでした。',
    postgis: 'PostGIS: 有効',
    s3: 'S3 ストレージ: 接続済み',
    systemTime: 'システム時刻',
    region: '地域: クリミア (RU)'
  }
};

export default function App() {
  const [view, setView] = useState<'map' | 'list'>('map');
  const [showHero, setShowHero] = useState(true);
  const [objects, setObjects] = useState<GeoObject[]>([]);
  const [selectedObject, setSelectedObject] = useState<GeoObject | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [lang, setLang] = useState<Language>('ru');
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);

  const t = translations[lang];

  const heroImages = [
    { url: "https://picsum.photos/seed/lagoon1/1200/800", title: "Lagoon 1" },
    { url: "https://picsum.photos/seed/lagoon2/1200/800", title: "Lagoon 2" },
    { url: "https://picsum.photos/seed/lagoon3/1200/800", title: "Lagoon 3" },
    { url: "https://picsum.photos/seed/lagoon4/1200/800", title: "Lagoon 4" },
    { url: "https://picsum.photos/seed/museum1/1200/800", title: "Museum" },
    { url: "https://picsum.photos/seed/lagoon5/1200/800", title: "Lagoon 5" },
  ];

  const handleVoiceSearch = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Voice recognition is not supported in this browser.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = lang === 'ru' ? 'ru-RU' : 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setSearchQuery(transcript);
      setIsListening(false);
    };

    recognition.onerror = () => {
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };

  // Mock Crimea Bounds for the SVG Map
  const bounds = {
    minLat: 44.3,
    maxLat: 46.2,
    minLng: 32.4,
    maxLng: 36.7
  };

  useEffect(() => {
    fetchObjects();
  }, []);

  const fetchObjects = async () => {
    try {
      const res = await fetch('/api/v1/objects/search');
      const data = await res.json();
      setObjects(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredObjects = useMemo(() => {
    return objects.filter(obj => 
      obj.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      obj.type.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [objects, searchQuery]);

  // Simple coordinate to SVG percentage conversion
  const getPos = (lat: number, lng: number) => {
    const x = ((lng - bounds.minLng) / (bounds.maxLng - bounds.minLng)) * 100;
    const y = 100 - ((lat - bounds.minLat) / (bounds.maxLat - bounds.minLat)) * 100;
    return { x, y };
  };

  return (
    <div className="min-h-screen bg-purple-100 text-[#1A1A1A] font-sans">
      <AnimatePresence>
        {showHero && (
          <motion.div 
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-purple-900 overflow-hidden"
          >
            <div className="grid grid-cols-3 grid-rows-2 h-full w-full">
              {heroImages.map((img, i) => (
                <div key={i} className="relative overflow-hidden group">
                  <img 
                    src={img.url} 
                    alt={img.title} 
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />
                </div>
              ))}
            </div>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <motion.div 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="bg-white/10 backdrop-blur-xl p-12 rounded-[40px] border border-white/20 flex flex-col items-center pointer-events-auto"
              >
                <h1 className="text-white text-7xl font-serif mb-4 tracking-tighter uppercase">Нави<span className="italic font-light">Крым</span></h1>
                <p className="text-white/70 text-lg mb-8 tracking-widest uppercase font-light">Исследуй лучшее</p>
                <button 
                  onClick={() => setShowHero(false)}
                  className="px-12 py-4 bg-white text-purple-900 rounded-full font-bold uppercase tracking-widest text-xs hover:bg-purple-50 transition-all shadow-2xl"
                >
                  Начать путешествие
                </button>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navigation Rail */}
      <nav className="fixed top-0 left-0 right-0 h-16 bg-white/80 backdrop-blur-md border-b border-black/5 z-50 flex items-center justify-between px-6">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => setShowHero(true)}>
          <div className="w-8 h-8 bg-[#1A1A1A] rounded-lg flex items-center justify-center text-white font-bold">Н</div>
          <span className="font-semibold tracking-tight text-lg uppercase">Нави<span className="font-light italic">Крым</span></span>
        </div>

        <div className="hidden md:flex items-center gap-8 text-xs font-medium uppercase tracking-widest opacity-60">
          <a href="#" className="hover:opacity-100 transition-opacity">{t.stays}</a>
          <a href="#" className="hover:opacity-100 transition-opacity">{t.routes}</a>
          <a href="#" className="hover:opacity-100 transition-opacity">{t.experiences}</a>
          <a href="#" className="hover:opacity-100 transition-opacity">{t.safety}</a>
        </div>

        <div className="flex items-center gap-4">
          {/* Language Selector */}
          <div className="relative">
            <button 
              onClick={() => setLangMenuOpen(!langMenuOpen)}
              className="flex items-center gap-2 px-3 py-2 hover:bg-black/5 rounded-full transition-colors text-xs font-medium"
            >
              <Globe size={16} />
              <span className="hidden sm:inline">{languages.find(l => l.code === lang)?.native}</span>
              <ChevronDown size={14} className={`transition-transform ${langMenuOpen ? 'rotate-180' : ''}`} />
            </button>
            <AnimatePresence>
              {langMenuOpen && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-2xl border border-black/5 overflow-hidden z-[60] py-2"
                >
                  {languages.map((l) => (
                    <button
                      key={l.code}
                      onClick={() => {
                        setLang(l.code);
                        setLangMenuOpen(false);
                      }}
                      className={`w-full text-left px-4 py-2 text-xs hover:bg-black/5 transition-colors flex items-center justify-between ${lang === l.code ? 'font-bold bg-black/5' : ''}`}
                    >
                      <span>{l.native}</span>
                      <span className="opacity-40 text-[10px] uppercase">{l.code}</span>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <button className="p-2 hover:bg-black/5 rounded-full transition-colors">
            <Search size={20} />
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-[#1A1A1A] text-white rounded-full text-xs font-semibold uppercase tracking-wider hover:bg-black/80 transition-colors">
            <User size={16} />
            <span>{t.cabinet}</span>
          </button>
        </div>
      </nav>

      <main className="pt-16 h-[calc(100vh-64px)] flex overflow-hidden">
        {/* Sidebar / Catalog */}
        <div className={`w-full md:w-[400px] bg-white border-r border-black/5 flex flex-col transition-all duration-300 ${view === 'map' ? 'hidden md:flex' : 'flex'}`}>
          <div className="p-6 border-b border-black/5">
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 opacity-30" size={18} />
              <input 
                type="text" 
                placeholder={t.search} 
                className="w-full pl-10 pr-12 py-3 bg-purple-50/50 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-black/10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button 
                onClick={handleVoiceSearch}
                className={`absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg transition-all ${isListening ? 'bg-red-500 text-white animate-pulse' : 'hover:bg-black/5 opacity-30 hover:opacity-100'}`}
              >
                <Mic size={16} />
              </button>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => setView('list')}
                className={`flex-1 py-2 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${view === 'list' ? 'bg-[#1A1A1A] text-white' : 'bg-purple-50 text-black/40'}`}
              >
                <List size={14} /> {t.list}
              </button>
              <button 
                onClick={() => setView('map')}
                className={`flex-1 py-2 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${view === 'map' ? 'bg-[#1A1A1A] text-white' : 'bg-purple-50 text-black/40'}`}
              >
                <MapIcon size={14} /> {t.map}
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
            {loading ? (
              <div className="flex items-center justify-center h-40 opacity-20">
                <RefreshCw className="animate-spin" />
              </div>
            ) : filteredObjects.length === 0 ? (
              <div className="text-center py-20 opacity-40">{t.noObjects}</div>
            ) : (
              filteredObjects.map(obj => (
                <motion.div 
                  layoutId={`card-${obj.id}`}
                  key={obj.id} 
                  className={`group cursor-pointer rounded-2xl overflow-hidden border transition-all ${selectedObject?.id === obj.id ? 'border-black ring-1 ring-black' : 'border-black/5 hover:border-black/20'}`}
                  onClick={() => setSelectedObject(obj)}
                >
                  <div className="aspect-[4/3] overflow-hidden relative">
                    <img src={obj.image_url} alt={obj.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" referrerPolicy="no-referrer" />
                    <div className="absolute top-3 right-3 px-3 py-1 bg-white/90 backdrop-blur-sm rounded-full text-[10px] font-bold uppercase tracking-widest">
                      {obj.type}
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="font-serif text-xl mb-1">{obj.name}</h3>
                    <div className="flex items-center gap-1 text-xs opacity-50 mb-3">
                      <MapPin size={12} />
                      <span>{obj.lat.toFixed(4)}, {obj.lng.toFixed(4)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-medium">₽{obj.price_per_night.toLocaleString()}<span className="text-xs opacity-40"> / {t.night}</span></span>
                      <ChevronRight size={16} className="opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>

        {/* Map View - Reduced by 40% (taking 60% of flex space) */}
        <div className="flex-[0.6] bg-purple-200 relative overflow-hidden">
          {/* Mock Map Background */}
          <div className="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none">
            <Navigation size={400} className="rotate-45" />
          </div>

          <svg className="w-full h-full p-20" viewBox="0 0 100 100" preserveAspectRatio="none">
            {/* Stylized Crimea Outline (Simplified) */}
            <path 
              d="M30,20 L70,20 L85,40 L80,70 L50,90 L20,70 L15,40 Z" 
              fill="none" 
              stroke="black" 
              strokeWidth="0.1" 
              strokeDasharray="1 1"
              className="opacity-20"
            />
            
            {/* Object Markers */}
            {filteredObjects.map(obj => {
              const pos = getPos(obj.lat, obj.lng);
              return (
                <g 
                  key={obj.id} 
                  className="cursor-pointer group"
                  onClick={() => setSelectedObject(obj)}
                >
                  <circle 
                    cx={pos.x} 
                    cy={pos.y} 
                    r={selectedObject?.id === obj.id ? 1.5 : 0.8} 
                    fill={selectedObject?.id === obj.id ? "#1A1A1A" : "white"} 
                    stroke="#1A1A1A"
                    strokeWidth="0.2"
                    className="transition-all duration-300"
                  />
                  {selectedObject?.id === obj.id && (
                    <circle cx={pos.x} cy={pos.y} r="3" fill="none" stroke="#1A1A1A" strokeWidth="0.1" className="animate-ping" />
                  )}
                </g>
              );
            })}
          </svg>

          {/* Floating Controls */}
          <div className="absolute bottom-8 right-8 flex flex-col gap-2">
            <div className="bg-white rounded-2xl shadow-xl border border-black/5 p-2 flex flex-col gap-1">
              <button className="p-3 hover:bg-black/5 rounded-xl transition-colors"><RefreshCw size={20} /></button>
              <div className="h-px bg-black/5 mx-2" />
              <button className="p-3 hover:bg-black/5 rounded-xl transition-colors"><Navigation size={20} /></button>
            </div>
          </div>

          {/* Object Detail Overlay */}
          <AnimatePresence>
            {selectedObject && (
              <motion.div 
                initial={{ y: 100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 100, opacity: 0 }}
                className="absolute bottom-8 left-8 right-8 md:left-auto md:w-[400px] bg-white rounded-3xl shadow-2xl border border-black/5 overflow-hidden z-40"
              >
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-black/40 mb-1 block">{selectedObject.type}</span>
                      <h2 className="font-serif text-2xl">{selectedObject.name}</h2>
                    </div>
                    <button onClick={() => setSelectedObject(null)} className="p-2 hover:bg-black/5 rounded-full"><X size={20} /></button>
                  </div>
                  
                  <p className="text-sm opacity-60 mb-6 leading-relaxed">{selectedObject.description}</p>
                  
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="p-3 bg-purple-50 rounded-2xl">
                      <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider opacity-40 mb-1">
                        <Calendar size={12} /> {t.syncStatus}
                      </div>
                      <div className="flex items-center gap-2 text-xs font-medium">
                        {selectedObject.ical_sync_url ? (
                          <>
                            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                            <span>{t.icalActive}</span>
                          </>
                        ) : (
                          <>
                            <div className="w-1.5 h-1.5 bg-amber-500 rounded-full" />
                            <span>{t.manualOnly}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="p-3 bg-purple-50 rounded-2xl">
                      <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider opacity-40 mb-1">
                        <ShieldCheck size={12} /> {t.verification}
                      </div>
                      <div className="flex items-center gap-2 text-xs font-medium">
                        <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                        <span>{t.verifiedHost}</span>
                      </div>
                    </div>
                  </div>

                  <button className="w-full py-4 bg-[#1A1A1A] text-white rounded-2xl font-bold uppercase tracking-widest text-xs hover:bg-black/80 transition-all flex items-center justify-center gap-2">
                    {t.checkAvailability} <ChevronRight size={14} />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Footer / Status Bar */}
      <footer className="fixed bottom-0 left-0 right-0 h-8 bg-white border-t border-black/5 px-6 flex items-center justify-between text-[10px] font-medium uppercase tracking-widest opacity-40 z-50">
        <div className="flex gap-4">
          <span>{t.postgis}</span>
          <span>{t.s3}</span>
        </div>
        <div className="flex gap-4">
          <span>{t.systemTime}: {new Date().toLocaleTimeString()}</span>
          <span>{t.region}</span>
        </div>
      </footer>
    </div>
  );
}


