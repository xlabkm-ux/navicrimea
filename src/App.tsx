/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useMemo, useState } from 'react';
import {
  Calendar,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Globe,
  List,
  Map as MapIcon,
  MapPin,
  Mic,
  RefreshCw,
  Search,
  ShieldCheck,
  User,
  X,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { YandexCrimeaMap } from './components/YandexCrimeaMap';

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

interface DiscoveryItem {
  id: string;
  title: string;
  category: string;
  source: string;
  summary: string;
  details: string;
  url: string;
}

type Section = 'stays' | 'routes' | 'experiences' | 'safety';
type ViewMode = 'map' | 'list';
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
    discoverySearch: 'Поиск по подборке...',
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
    noResults: 'По этому запросу ничего не найдено.',
    postgis: 'PostGIS: Активен',
    s3: 'S3 Хранилище: Подключено',
    systemTime: 'Системное время',
    region: 'Регион: Крым (RU)',
    openSource: 'Открыть источник',
    searchSelection: 'Редакционная подборка',
    routesLead: 'Готовые идеи для путешествий по Крыму.',
    experiencesLead: 'Куда поехать за атмосферой, прогулками и культурой.',
    safetyLead: 'Практические рекомендации перед поездкой и маршрутом.',
  },
  en: {
    stays: 'Stays',
    routes: 'Routes',
    experiences: 'Experiences',
    safety: 'Safety',
    cabinet: 'Cabinet',
    search: 'Search by name or type...',
    discoverySearch: 'Search within this collection...',
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
    noResults: 'Nothing matches this query.',
    postgis: 'PostGIS: Active',
    s3: 'S3 Storage: Connected',
    systemTime: 'System Time',
    region: 'Region: Crimea (RU)',
    openSource: 'Open source',
    searchSelection: 'Editorial selection',
    routesLead: 'Curated route ideas for traveling across Crimea.',
    experiencesLead: 'Where to go for atmosphere, culture, and coastal leisure.',
    safetyLead: 'Practical pre-trip and on-route safety guidance.',
  },
  zh: {},
  hi: {},
  es: {},
  fr: {},
  ar: {},
  bn: {},
  pt: {},
  ja: {},
};

const fallbackTranslations = translations.ru;

const heroImages = [
  { url: '/images/hero-coast-1.svg', title: 'Coast 1' },
  { url: '/images/hero-coast-2.svg', title: 'Coast 2' },
  { url: '/images/hero-cliff-1.svg', title: 'Cliff 1' },
  { url: '/images/hero-cliff-2.svg', title: 'Cliff 2' },
  { url: '/images/hero-palace.svg', title: 'Palace' },
  { url: '/images/hero-sea-night.svg', title: 'Sea Night' },
];

const localStayImages: Record<number, string> = {
  1: '/images/stay-villa-elena.svg',
  2: '/images/stay-fiolent.svg',
  3: '/images/stay-sudak.svg',
};

const sectionAccents: Record<Section, string> = {
  stays: 'bg-purple-200',
  routes: 'bg-[#dceee3]',
  experiences: 'bg-[#f2e2d5]',
  safety: 'bg-[#dde6f5]',
};

const sectionLeadKey: Record<Exclude<Section, 'stays'>, 'routesLead' | 'experiencesLead' | 'safetyLead'> = {
  routes: 'routesLead',
  experiences: 'experiencesLead',
  safety: 'safetyLead',
};

export default function App() {
  const [view, setView] = useState<ViewMode>('map');
  const [section, setSection] = useState<Section>('stays');
  const [showHero, setShowHero] = useState(true);
  const [objects, setObjects] = useState<GeoObject[]>([]);
  const [selectedObject, setSelectedObject] = useState<GeoObject | null>(null);
  const [selectedDiscovery, setSelectedDiscovery] = useState<DiscoveryItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [discoveryLoading, setDiscoveryLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [lang, setLang] = useState<Language>('ru');
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [discovery, setDiscovery] = useState<Record<Exclude<Section, 'stays'>, DiscoveryItem[]>>({
    routes: [],
    experiences: [],
    safety: [],
  });

  const t = { ...fallbackTranslations, ...translations[lang] };

  const navItems: { id: Section; label: string }[] = [
    { id: 'stays', label: t.stays },
    { id: 'routes', label: t.routes },
    { id: 'experiences', label: t.experiences },
    { id: 'safety', label: t.safety },
  ];

  useEffect(() => {
    fetchObjects();
    fetchDiscoverySection('routes');
    fetchDiscoverySection('experiences');
    fetchDiscoverySection('safety');
  }, []);

  useEffect(() => {
    setSearchQuery('');
    setSelectedObject(null);
    setSelectedDiscovery(null);
  }, [section]);

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

  const fetchDiscoverySection = async (targetSection: Exclude<Section, 'stays'>) => {
    setDiscoveryLoading(true);
    try {
      const res = await fetch(`/api/v1/discovery/${targetSection}`);
      const data = await res.json();
      setDiscovery((current) => ({ ...current, [targetSection]: data }));
    } catch (err) {
      console.error(err);
    } finally {
      setDiscoveryLoading(false);
    }
  };

  const filteredObjects = useMemo(() => {
    return objects.filter((obj) =>
      obj.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      obj.type.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }, [objects, searchQuery]);

  const currentDiscovery = section === 'stays' ? [] : discovery[section];

  const filteredDiscovery = useMemo(() => {
    return currentDiscovery.filter((item) =>
      [item.title, item.category, item.source, item.summary].some((field) =>
        field.toLowerCase().includes(searchQuery.toLowerCase()),
      ),
    );
  }, [currentDiscovery, searchQuery]);

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

    recognition.onstart = () => setIsListening(true);
    recognition.onresult = (event: any) => {
      setSearchQuery(event.results[0][0].transcript);
      setIsListening(false);
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);

    recognition.start();
  };

  const getObjectImage = (obj: GeoObject) => {
    if (obj.image_url?.startsWith('/images/')) {
      return obj.image_url;
    }

    return localStayImages[obj.id] ?? '/images/stay-villa-elena.svg';
  };

  const renderStaysPanel = () => (
    <>
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
            filteredObjects.map((obj) => (
              <motion.div
                layoutId={`card-${obj.id}`}
                key={obj.id}
                className={`group cursor-pointer rounded-2xl overflow-hidden border transition-all ${selectedObject?.id === obj.id ? 'border-black ring-1 ring-black' : 'border-black/5 hover:border-black/20'}`}
                onClick={() => setSelectedObject(obj)}
              >
                <div className="aspect-[4/3] overflow-hidden relative">
                  <img src={getObjectImage(obj)} alt={obj.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
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
                    <span className="text-lg font-medium">
                      ₽{obj.price_per_night.toLocaleString()}
                      <span className="text-xs opacity-40"> / {t.night}</span>
                    </span>
                    <ChevronRight size={16} className="opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>

      <div className="flex-[0.6] bg-purple-200 relative overflow-hidden">
        <YandexCrimeaMap />

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
    </>
  );

  const renderDiscoveryPanel = () => (
    <>
      <div className="w-full md:w-[420px] bg-white border-r border-black/5 flex flex-col">
        <div className="p-6 border-b border-black/5">
          <div className="mb-4">
            <div className="text-[10px] font-bold uppercase tracking-[0.3em] text-black/40 mb-2">{t.searchSelection}</div>
            <h2 className="font-serif text-3xl mb-2">{navItems.find((item) => item.id === section)?.label}</h2>
            <p className="text-sm opacity-60">{t[sectionLeadKey[section as Exclude<Section, 'stays'>]]}</p>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 opacity-30" size={18} />
            <input
              type="text"
              placeholder={t.discoverySearch}
              className="w-full pl-10 pr-12 py-3 bg-black/[0.03] rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-black/10"
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
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
          {discoveryLoading && currentDiscovery.length === 0 ? (
            <div className="flex items-center justify-center h-40 opacity-20">
              <RefreshCw className="animate-spin" />
            </div>
          ) : filteredDiscovery.length === 0 ? (
            <div className="text-center py-20 opacity-40">{t.noResults}</div>
          ) : (
            filteredDiscovery.map((item) => (
              <button
                key={item.id}
                onClick={() => setSelectedDiscovery(item)}
                className={`w-full text-left rounded-3xl border p-5 transition-all ${selectedDiscovery?.id === item.id ? 'border-black bg-black text-white shadow-xl' : 'border-black/5 bg-white hover:border-black/20'}`}
              >
                <div className="flex items-center justify-between gap-4 mb-3">
                  <span className={`text-[10px] font-bold uppercase tracking-[0.25em] ${selectedDiscovery?.id === item.id ? 'text-white/60' : 'text-black/40'}`}>
                    {item.category}
                  </span>
                  <span className={`text-[10px] ${selectedDiscovery?.id === item.id ? 'text-white/60' : 'text-black/40'}`}>{item.source}</span>
                </div>
                <h3 className="font-serif text-2xl mb-2">{item.title}</h3>
                <p className={`text-sm leading-relaxed ${selectedDiscovery?.id === item.id ? 'text-white/70' : 'opacity-60'}`}>{item.summary}</p>
              </button>
            ))
          )}
        </div>
      </div>

      <div className={`flex-1 relative overflow-hidden ${sectionAccents[section]}`}>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.45),transparent_38%)]" />
        <div className="absolute inset-0 opacity-20 pointer-events-none">
          <div className="absolute top-12 left-12 w-64 h-64 border border-black/10 rounded-full" />
          <div className="absolute bottom-20 right-20 w-80 h-80 border border-black/10 rounded-full" />
        </div>

        <div className="relative z-10 h-full p-8 md:p-12">
          {selectedDiscovery ? (
            <div className="max-w-3xl bg-white/85 backdrop-blur-md rounded-[32px] border border-black/5 shadow-2xl p-8 md:p-10">
              <div className="flex items-start justify-between gap-6 mb-8">
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-[0.3em] text-black/40 mb-3">{selectedDiscovery.category}</div>
                  <h2 className="font-serif text-4xl leading-tight mb-3">{selectedDiscovery.title}</h2>
                  <p className="text-sm opacity-50">{selectedDiscovery.source}</p>
                </div>
                <button onClick={() => setSelectedDiscovery(null)} className="p-2 hover:bg-black/5 rounded-full"><X size={20} /></button>
              </div>

              <p className="text-lg leading-relaxed opacity-70 mb-6">{selectedDiscovery.summary}</p>
              <p className="text-sm leading-7 opacity-60 mb-8">{selectedDiscovery.details}</p>

              <a
                href={selectedDiscovery.url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 px-5 py-3 bg-[#1A1A1A] text-white rounded-full text-xs font-bold uppercase tracking-[0.2em] hover:bg-black/80 transition-colors"
              >
                {t.openSource}
                <ExternalLink size={14} />
              </a>
            </div>
          ) : (
            <div className="max-w-2xl pt-12">
              <div className="text-[10px] font-bold uppercase tracking-[0.3em] text-black/35 mb-4">{t.searchSelection}</div>
              <h2 className="font-serif text-5xl leading-tight mb-6">{navItems.find((item) => item.id === section)?.label}</h2>
              <p className="text-lg leading-8 opacity-60 mb-8">{t[sectionLeadKey[section as Exclude<Section, 'stays'>]]}</p>
              <div className="grid md:grid-cols-3 gap-4">
                {currentDiscovery.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setSelectedDiscovery(item)}
                    className="rounded-3xl bg-white/70 backdrop-blur-sm border border-black/5 p-5 text-left hover:bg-white transition-colors"
                  >
                    <div className="text-[10px] font-bold uppercase tracking-[0.25em] text-black/40 mb-3">{item.category}</div>
                    <div className="font-serif text-2xl mb-3">{item.title}</div>
                    <div className="text-sm opacity-55 leading-relaxed">{item.summary}</div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );

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

      <nav className="fixed top-0 left-0 right-0 h-16 bg-white/80 backdrop-blur-md border-b border-black/5 z-50 flex items-center justify-between px-6">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => setShowHero(true)}>
          <div className="w-8 h-8 bg-[#1A1A1A] rounded-lg flex items-center justify-center text-white font-bold">Н</div>
          <span className="font-semibold tracking-tight text-lg uppercase">Нави<span className="font-light italic">Крым</span></span>
        </div>

        <div className="hidden md:flex items-center gap-4 text-xs font-medium uppercase tracking-widest">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setSection(item.id)}
              className={`px-4 py-2 rounded-full transition-colors ${section === item.id ? 'bg-[#1A1A1A] text-white opacity-100' : 'opacity-60 hover:opacity-100 hover:bg-black/5'}`}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-4">
          <div className="relative">
            <button
              onClick={() => setLangMenuOpen(!langMenuOpen)}
              className="flex items-center gap-2 px-3 py-2 hover:bg-black/5 rounded-full transition-colors text-xs font-medium"
            >
              <Globe size={16} />
              <span className="hidden sm:inline">{languages.find((l) => l.code === lang)?.native}</span>
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
        {section === 'stays' ? renderStaysPanel() : renderDiscoveryPanel()}
      </main>

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
