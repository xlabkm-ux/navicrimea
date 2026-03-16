import React, { useState, useMemo } from 'react';
import { 
  Users, 
  Heart, 
  X, 
  Check, 
  ChevronRight, 
  ChevronLeft, 
  MapPin, 
  Calendar, 
  Search,
  MessageCircle,
  ThumbsUp,
  User as UserIcon,
  Plus,
  Info,
  Filter,
  ArrowUpDown,
  Bell
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface InterestCategory {
  id: string;
  name: string;
  icon: string;
  subcategories: string[];
}

const INTEREST_CATEGORIES: InterestCategory[] = [
  {
    id: 'music',
    name: 'Музыка',
    icon: '🎵',
    subcategories: ['Рок', 'Поп', 'Классика', 'Джаз', 'Электроника', 'Фолк', 'Опера', 'Фестивали']
  },
  {
    id: 'sport',
    name: 'Спорт',
    icon: '⚽',
    subcategories: ['Активный спорт', 'Пассивный спорт', 'Гимнастика', 'Йога', 'Велоспорт', 'Лыжи', 'Джиппинг', 'Походы']
  },
  {
    id: 'culture',
    name: 'Культура',
    icon: '🏛️',
    subcategories: ['Живопись', 'Музеи', 'Театр', 'Кино', 'История', 'Литература', 'Архитектура', 'Выставки']
  },
  {
    id: 'news',
    name: 'Новости',
    icon: '📰',
    subcategories: ['Политика', 'Технологии', 'Наука', 'Развлечения', 'Бизнес', 'Здоровье', 'Экология', 'Мировые события']
  },
  {
    id: 'food',
    name: 'Еда и гастрономия',
    icon: '🍷',
    subcategories: ['Дегустации', 'Уличная еда', 'Мастер-классы', 'Вегетарианство', 'Морепродукты', 'Традиционная кухня', 'Рестораны', 'Виноделие']
  },
  {
    id: 'nature',
    name: 'Природа',
    icon: '🏔️',
    subcategories: ['Горы', 'Море', 'Леса', 'Пещеры', 'Наблюдение за птицами', 'Кемпинг', 'Фотография', 'Эко-тропы']
  },
  {
    id: 'nightlife',
    name: 'Ночная жизнь',
    icon: '💃',
    subcategories: ['Клубы', 'Бары', 'Караоке', 'Вечеринки', 'Ночные прогулки', 'Казино', 'Концерты', 'Пляжные вечеринки']
  },
  {
    id: 'shopping',
    name: 'Шопинг',
    icon: '🛍️',
    subcategories: ['Местные рынки', 'ТЦ', 'Сувениры', 'Мода', 'Антиквариат', 'Гаджеты', 'Книги', 'Ювелирные изделия']
  },
  {
    id: 'education',
    name: 'Образование',
    icon: '🎓',
    subcategories: ['Воркшопы', 'Лекции', 'Языковой обмен', 'Исторические туры', 'Научные центры', 'Библиотеки', 'Курсы', 'Семинары']
  },
  {
    id: 'health',
    name: 'Здоровье и Wellness',
    icon: '🧘',
    subcategories: ['Спа', 'Медитация', 'Ретриты', 'Термальные источники', 'Фитнес', 'Детокс', 'Массаж', 'Ароматерапия']
  },
  {
    id: 'tech',
    name: 'Технологии',
    icon: '💻',
    subcategories: ['Гаджеты', 'IT-события', 'Гейминг', 'Робототехника', 'VR/AR', 'Космос', 'Будущее', 'Программирование']
  },
  {
    id: 'business',
    name: 'Бизнес',
    icon: '💼',
    subcategories: ['Нетворкинг', 'Стартапы', 'Инвестиции', 'Недвижимость', 'Конференции', 'Коворкинг', 'Выставки', 'Экономика']
  }
];

interface CompanionProfile {
  id: string;
  name: string;
  age: number;
  gender: 'male' | 'female' | 'other';
  interests: Record<string, string[]>;
  customInterests: Record<string, string>;
  route: string;
  startDate: string;
  endDate: string;
  companionshipType: 'companion' | 'company' | 'joint_rest';
  preferredGender: 'male' | 'female' | 'any';
  photo: string;
  description: string;
  likes: number;
}

const MOCK_COMPANIONS: CompanionProfile[] = [
  {
    id: '1',
    name: 'Елена',
    age: 28,
    gender: 'female',
    interests: {
      'sport': ['Йога', 'Велоспорт'],
      'culture': ['Живопись', 'Музеи']
    },
    customInterests: {},
    route: 'Ялта - Севастополь',
    startDate: '2026-03-10',
    endDate: '2026-03-17',
    companionshipType: 'companion',
    preferredGender: 'female',
    photo: 'https://picsum.photos/seed/elena/400/600',
    description: 'Ищу попутчицу для спокойного отдыха и посещения музеев.',
    likes: 15
  },
  {
    id: '2',
    name: 'Дмитрий',
    age: 34,
    gender: 'male',
    interests: {
      'sport': ['Джиппинг', 'Походы'],
      'nature': ['Горы', 'Кемпинг']
    },
    customInterests: {},
    route: 'Бахчисарай - Ай-Петри',
    startDate: '2026-03-12',
    endDate: '2026-03-15',
    companionshipType: 'company',
    preferredGender: 'any',
    photo: 'https://picsum.photos/seed/dmitry/400/600',
    description: 'Собираю компанию для активного похода в горы.',
    likes: 24
  },
  {
    id: '3',
    name: 'Мария',
    age: 25,
    gender: 'female',
    interests: {
      'music': ['Рок', 'Фестивали'],
      'nightlife': ['Бары', 'Концерты']
    },
    customInterests: {},
    route: 'Севастополь - Балаклава',
    startDate: '2026-03-08',
    endDate: '2026-03-12',
    companionshipType: 'joint_rest',
    preferredGender: 'any',
    photo: 'https://picsum.photos/seed/maria/400/600',
    description: 'Люблю живую музыку и ночной город. Поехали вместе!',
    likes: 42
  }
];

export const CompanionFinder = ({ onClose, userProfile: initialProfile }: any) => {
  const [step, setStep] = useState<'form' | 'matching'>('form');
  const [matchingView, setMatchingView] = useState<'discover' | 'matches'>('discover');
  const [formStep, setFormStep] = useState(1);
  const [profile, setProfile] = useState<Partial<CompanionProfile>>({
    name: initialProfile?.fullName || '',
    age: 25,
    gender: 'male',
    interests: {},
    customInterests: {},
    route: '',
    startDate: '',
    endDate: '',
    companionshipType: 'companion',
    preferredGender: 'any',
    description: '',
    photo: initialProfile?.photo || 'https://picsum.photos/seed/myprofile/400/600'
  });

  const [matches, setMatches] = useState<CompanionProfile[]>([]);
  const [sortBy, setSortBy] = useState<'date' | 'interests' | 'route'>('interests');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showChat, setShowChat] = useState<string | null>(null);
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());
  const [dislikedIds, setDislikedIds] = useState<Set<string>>(new Set());
  const [showMatchSuccess, setShowMatchSuccess] = useState(false);
  const [notifications, setNotifications] = useState<{id: string, title: string, body: string}[]>([]);

  const sortedMatches = useMemo(() => {
    const sorted = [...matches];
    
    if (sortBy === 'date') {
      return sorted.sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
    }
    
    if (sortBy === 'interests') {
      const getScore = (companion: CompanionProfile) => {
        let score = 0;
        Object.keys(profile.interests || {}).forEach(catId => {
          const userSubcats = profile.interests?.[catId] || [];
          const companionSubcats = companion.interests[catId] || [];
          score += userSubcats.filter(s => companionSubcats.includes(s)).length;
        });
        return score;
      };
      return sorted.sort((a, b) => getScore(b) - getScore(a));
    }
    
    if (sortBy === 'route') {
      const userRoute = (profile.route || '').toLowerCase();
      const getRouteScore = (companion: CompanionProfile) => {
        const compRoute = companion.route.toLowerCase();
        if (compRoute === userRoute) return 100;
        const userWords = userRoute.split(/[\s-]+/).filter(w => w.length > 3);
        const compWords = compRoute.split(/[\s-]+/).filter(w => w.length > 3);
        return userWords.filter(w => compWords.includes(w)).length;
      };
      return sorted.sort((a, b) => getRouteScore(b) - getRouteScore(a));
    }
    
    return sorted;
  }, [matches, sortBy, profile.interests, profile.route]);

  const addNotification = (title: string, body: string) => {
    const id = Math.random().toString(36).substr(2, 9);
    setNotifications(prev => [...prev, { id, title, body }]);
    
    // Try browser notification
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification(title, { body });
    }

    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 5000);
  };

  // Request notification permission on mount
  React.useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  const handleInterestToggle = (categoryId: string, subcategory: string) => {
    setProfile(prev => {
      const currentInterests = prev.interests || {};
      const categoryInterests = currentInterests[categoryId] || [];
      
      let newCategoryInterests;
      if (categoryInterests.includes(subcategory)) {
        newCategoryInterests = categoryInterests.filter(s => s !== subcategory);
      } else {
        newCategoryInterests = [...categoryInterests, subcategory];
      }

      return {
        ...prev,
        interests: {
          ...currentInterests,
          [categoryId]: newCategoryInterests
        }
      };
    });
  };

  const handleCustomInterestChange = (categoryId: string, value: string) => {
    setProfile(prev => ({
      ...prev,
      customInterests: {
        ...(prev.customInterests || {}),
        [categoryId]: value
      }
    }));
  };

  const handleSubmit = () => {
    // Logic to find matches
    const userStartDate = new Date(profile.startDate || '');
    
    const filteredMatches = MOCK_COMPANIONS.filter(companion => {
      const companionStartDate = new Date(companion.startDate);
      const diffTime = Math.abs(companionStartDate.getTime() - userStartDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      // Match within 7 days
      const dateMatch = diffDays <= 7;
      
      // Interest match (at least one common interest)
      let interestMatch = false;
      Object.keys(profile.interests || {}).forEach(catId => {
        const userSubcats = profile.interests?.[catId] || [];
        const companionSubcats = companion.interests[catId] || [];
        if (userSubcats.some(s => companionSubcats.includes(s))) {
          interestMatch = true;
        }
      });

      return dateMatch || interestMatch;
    });

    setMatches(filteredMatches);
    setShowMatchSuccess(true);
    setTimeout(() => {
      setShowMatchSuccess(false);
      setStep('matching');
    }, 2000);
  };

  const handleShowChat = (id: string) => {
    setShowChat(id);
    const match = matches.find(m => m.id === id);
    if (match) {
      setTimeout(() => {
        addNotification(
          `Новое сообщение от ${match.name}`,
          "Привет! Вижу, наши интересы совпадают..."
        );
      }, 1000);
    }
  };

  const handleLike = (id: string) => {
    setLikedIds(prev => new Set(prev).add(id));
    
    // Simulate a mutual match notification
    if (Math.random() > 0.4) {
      const match = matches.find(m => m.id === id);
      setTimeout(() => {
        addNotification(
          "Взаимная симпатия! 🎉",
          `${match?.name} тоже хочет поехать с вами! Теперь вы можете написать сообщение.`
        );
      }, 1500);
    }

    setTimeout(() => {
      if (currentIndex < matches.length - 1) {
        setCurrentIndex(prev => prev + 1);
      } else {
        setMatches([]); // Show waiting list after all matches are seen
      }
    }, 300);
  };

  const handleDislike = (id: string) => {
    setDislikedIds(prev => new Set(prev).add(id));
    setTimeout(() => {
      if (currentIndex < matches.length - 1) {
        setCurrentIndex(prev => prev + 1);
      } else {
        setMatches([]); // Show waiting list after all matches are seen
      }
    }, 300);
  };

  const renderForm = () => {
    switch (formStep) {
      case 1:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-serif">Расскажите о себе</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs uppercase font-semibold opacity-50 mb-1">Ваше имя</label>
                <input 
                  type="text" 
                  value={profile.name}
                  onChange={e => setProfile({...profile, name: e.target.value})}
                  className="w-full p-3 bg-white border border-black/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block text-xs uppercase font-semibold opacity-50 mb-1">Возраст</label>
                <input 
                  type="number" 
                  value={profile.age}
                  onChange={e => setProfile({...profile, age: parseInt(e.target.value)})}
                  className="w-full p-3 bg-white border border-black/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block text-xs uppercase font-semibold opacity-50 mb-1">Ваш пол</label>
                <select 
                  value={profile.gender}
                  onChange={e => setProfile({...profile, gender: e.target.value as any})}
                  className="w-full p-3 bg-white border border-black/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="male">Мужчина</option>
                  <option value="female">Женщина</option>
                  <option value="other">Другое</option>
                </select>
              </div>
              <div>
                <label className="block text-xs uppercase font-semibold opacity-50 mb-1">Кого ищете?</label>
                <select 
                  value={profile.companionshipType}
                  onChange={e => setProfile({...profile, companionshipType: e.target.value as any})}
                  className="w-full p-3 bg-white border border-black/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="companion">Попутчика</option>
                  <option value="company">Компанию</option>
                  <option value="joint_rest">Совместный отдых</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end">
              <button 
                onClick={() => setFormStep(2)}
                className="bg-black text-white px-8 py-3 rounded-full flex items-center gap-2 hover:bg-zinc-800 transition-colors"
              >
                Далее <ChevronRight size={18} />
              </button>
            </div>
          </div>
        );
      case 2:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-serif">Ваши интересы</h2>
            <p className="text-sm text-black/60">Выберите категории и подкатегории, которые вам близки.</p>
            
            <div className="grid grid-cols-1 gap-8 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
              {INTEREST_CATEGORIES.map(category => (
                <div key={category.id} className="space-y-3 p-4 bg-white rounded-2xl border border-black/5 shadow-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl">{category.icon}</span>
                    <h3 className="font-semibold text-lg">{category.name}</h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {category.subcategories.map(sub => (
                      <button
                        key={sub}
                        onClick={() => handleInterestToggle(category.id, sub)}
                        className={`px-3 py-1.5 rounded-full text-xs transition-all ${
                          profile.interests?.[category.id]?.includes(sub)
                            ? 'bg-purple-600 text-white shadow-md'
                            : 'bg-black/5 text-black/60 hover:bg-black/10'
                        }`}
                      >
                        {sub}
                      </button>
                    ))}
                  </div>
                  <div className="pt-2">
                    <label className="block text-[10px] uppercase font-bold opacity-30 mb-1">Другое</label>
                    <input 
                      type="text"
                      placeholder="Свой вариант..."
                      value={profile.customInterests?.[category.id] || ''}
                      onChange={e => handleCustomInterestChange(category.id, e.target.value)}
                      className="w-full p-2 text-sm bg-transparent border-b border-black/10 focus:border-purple-500 outline-none"
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-between pt-4">
              <button 
                onClick={() => setFormStep(1)}
                className="px-6 py-3 rounded-full flex items-center gap-2 hover:bg-black/5 transition-colors"
              >
                <ChevronLeft size={18} /> Назад
              </button>
              <button 
                onClick={() => setFormStep(3)}
                className="bg-black text-white px-8 py-3 rounded-full flex items-center gap-2 hover:bg-zinc-800 transition-colors"
              >
                Далее <ChevronRight size={18} />
              </button>
            </div>
          </div>
        );
      case 3:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-serif">Детали поездки</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-xs uppercase font-semibold opacity-50 mb-1">Желаемый маршрут</label>
                <input 
                  type="text" 
                  placeholder="Например: Ялта - Севастополь - Балаклава"
                  value={profile.route}
                  onChange={e => setProfile({...profile, route: e.target.value})}
                  className="w-full p-3 bg-white border border-black/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block text-xs uppercase font-semibold opacity-50 mb-1">Дата начала</label>
                <input 
                  type="date" 
                  value={profile.startDate}
                  onChange={e => setProfile({...profile, startDate: e.target.value})}
                  className="w-full p-3 bg-white border border-black/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block text-xs uppercase font-semibold opacity-50 mb-1">Дата окончания</label>
                <input 
                  type="date" 
                  value={profile.endDate}
                  onChange={e => setProfile({...profile, endDate: e.target.value})}
                  className="w-full p-3 bg-white border border-black/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block text-xs uppercase font-semibold opacity-50 mb-1">Пол попутчика</label>
                <select 
                  value={profile.preferredGender}
                  onChange={e => setProfile({...profile, preferredGender: e.target.value as any})}
                  className="w-full p-3 bg-white border border-black/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="any">Любой</option>
                  <option value="male">Мужчина</option>
                  <option value="female">Женщина</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs uppercase font-semibold opacity-50 mb-1">О себе и планах</label>
                <textarea 
                  rows={4}
                  placeholder="Расскажите подробнее о ваших целях и предпочтениях..."
                  value={profile.description}
                  onChange={e => setProfile({...profile, description: e.target.value})}
                  className="w-full p-3 bg-white border border-black/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>

            <div className="flex justify-between pt-4">
              <button 
                onClick={() => setFormStep(2)}
                className="px-6 py-3 rounded-full flex items-center gap-2 hover:bg-black/5 transition-colors"
              >
                <ChevronLeft size={18} /> Назад
              </button>
              <button 
                onClick={handleSubmit}
                className="bg-purple-600 text-white px-8 py-3 rounded-full flex items-center gap-2 hover:bg-purple-700 transition-all shadow-lg shadow-purple-200"
              >
                Найти попутчиков <Check size={18} />
              </button>
            </div>
          </div>
        );
    }
  };

  const renderMatching = () => {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between border-b border-black/5 pb-2">
          <div className="flex gap-4">
            <button 
              onClick={() => setMatchingView('discover')}
              className={`text-sm font-bold pb-2 transition-all relative ${matchingView === 'discover' ? 'text-purple-600' : 'text-black/40'}`}
            >
              Поиск
              {matchingView === 'discover' && <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-600" />}
            </button>
            <button 
              onClick={() => setMatchingView('matches')}
              className={`text-sm font-bold pb-2 transition-all relative ${matchingView === 'matches' ? 'text-purple-600' : 'text-black/40'}`}
            >
              Мои симпатии
              {likedIds.size > 0 && (
                <span className="ml-1 px-1.5 py-0.5 bg-purple-600 text-white text-[8px] rounded-full align-top">
                  {likedIds.size}
                </span>
              )}
              {matchingView === 'matches' && <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-600" />}
            </button>
          </div>
        </div>

        {matchingView === 'discover' ? renderDiscover() : renderMatchesList()}
      </div>
    );
  };

  const renderDiscover = () => {
    if (matches.length === 0 || currentIndex >= matches.length) {
      return (
        <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
          <div className="w-20 h-20 bg-black/5 rounded-full flex items-center justify-center">
            <Users size={40} className="opacity-20" />
          </div>
          <h3 className="text-xl font-serif">Вы в листе ожидания</h3>
          <p className="text-black/50 max-w-xs">Мы сохранили ваш профиль. Как только появится кто-то подходящий, мы пришлем уведомление.</p>
          <button 
            onClick={() => {
              setStep('form');
              setFormStep(1);
            }}
            className="text-purple-600 font-semibold hover:underline"
          >
            Изменить параметры поиска
          </button>
        </div>
      );
    }

    const currentMatch = sortedMatches[currentIndex];
    const isLiked = likedIds.has(currentMatch.id);
    const isDisliked = dislikedIds.has(currentMatch.id);

    return (
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <h2 className="text-2xl font-serif">Подходящие попутчики</h2>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-white border border-black/5 px-2 py-1 rounded-lg shadow-sm">
              <ArrowUpDown size={14} className="opacity-40" />
              <select 
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="text-xs font-medium bg-transparent outline-none border-none cursor-pointer"
              >
                <option value="interests">По интересам</option>
                <option value="date">По дате</option>
                <option value="route">По маршруту</option>
              </select>
            </div>
            <span className="text-xs font-bold bg-black/5 px-3 py-1 rounded-full">
              {currentIndex + 1} / {matches.length}
            </span>
          </div>
        </div>

        <motion.div 
          key={currentMatch.id}
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ 
            scale: 1, 
            opacity: 1,
            x: isLiked ? 200 : isDisliked ? -200 : 0,
            rotate: isLiked ? 10 : isDisliked ? -10 : 0
          }}
          transition={{ type: 'spring', damping: 20, stiffness: 100 }}
          className="relative aspect-[3/4] md:aspect-video rounded-3xl overflow-hidden shadow-2xl group"
        >
          <img 
            src={currentMatch.photo} 
            alt={currentMatch.name}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
          
          {isLiked && (
            <div className="absolute top-10 left-10 border-4 border-emerald-500 text-emerald-500 font-bold text-4xl px-4 py-2 rounded-xl rotate-[-20deg] z-20">
              LIKE
            </div>
          )}
          {isDisliked && (
            <div className="absolute top-10 right-10 border-4 border-red-500 text-red-500 font-bold text-4xl px-4 py-2 rounded-xl rotate-[20deg] z-20">
              NOPE
            </div>
          )}

          <div className="absolute bottom-0 left-0 right-0 p-6 text-white space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-3xl font-serif">{currentMatch.name}, {currentMatch.age}</h3>
                <div className="flex items-center gap-2 text-white/70 text-sm">
                  <MapPin size={14} /> {currentMatch.route}
                </div>
              </div>
              <div className="flex items-center gap-1 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-sm">
                <ThumbsUp size={14} /> {currentMatch.likes}
              </div>
            </div>
            
            <div className="flex items-center gap-4 text-xs font-medium pt-2">
              <div className="flex items-center gap-1">
                <Calendar size={14} /> {new Date(currentMatch.startDate).toLocaleDateString()} - {new Date(currentMatch.endDate).toLocaleDateString()}
              </div>
              <div className="flex items-center gap-1">
                <UserIcon size={14} /> {currentMatch.companionshipType === 'companion' ? 'Попутчик' : currentMatch.companionshipType === 'company' ? 'Компания' : 'Совместный отдых'}
              </div>
            </div>

            <p className="text-sm text-white/80 line-clamp-2 pt-2">
              {currentMatch.description}
            </p>

            <div className="flex flex-wrap gap-1 pt-3">
              {Object.entries(currentMatch.interests).map(([catId, subcats]) => (
                (subcats as string[]).map(sub => (
                  <span key={sub} className="px-2 py-0.5 bg-white/10 backdrop-blur-md rounded-full text-[10px] uppercase tracking-wider">
                    {sub}
                  </span>
                ))
              ))}
            </div>
          </div>
        </motion.div>

        <div className="flex items-center justify-center gap-6 pt-4">
          <button 
            onClick={() => handleDislike(currentMatch.id)}
            className="w-16 h-16 rounded-full bg-white border border-black/10 flex items-center justify-center text-red-500 hover:bg-red-50 transition-all shadow-lg active:scale-90"
          >
            <X size={32} />
          </button>
          <button 
            onClick={() => handleShowChat(currentMatch.id)}
            className="w-20 h-20 rounded-full bg-purple-600 text-white flex items-center justify-center hover:bg-purple-700 transition-all shadow-xl shadow-purple-200 scale-110 active:scale-95"
          >
            <MessageCircle size={36} />
          </button>
          <button 
            onClick={() => handleLike(currentMatch.id)}
            className="w-16 h-16 rounded-full bg-white border border-black/10 flex items-center justify-center text-emerald-500 hover:bg-emerald-50 transition-all shadow-lg active:scale-90"
          >
            <Check size={32} />
          </button>
        </div>

        {renderChatModal(currentMatch)}
      </div>
    );
  };

  const renderMatchesList = () => {
    const likedProfiles = MOCK_COMPANIONS.filter(m => likedIds.has(m.id));

    if (likedProfiles.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
          <div className="w-16 h-16 bg-black/5 rounded-full flex items-center justify-center">
            <Heart size={32} className="opacity-20" />
          </div>
          <h3 className="text-lg font-serif">У вас пока нет симпатий</h3>
          <p className="text-black/50 text-sm max-w-xs">Просматривайте анкеты и ставьте лайки тем, кто вам интересен!</p>
          <button 
            onClick={() => setMatchingView('discover')}
            className="bg-black text-white px-6 py-2 rounded-full text-sm hover:bg-zinc-800 transition-colors"
          >
            Начать поиск
          </button>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {likedProfiles.map(profile => (
          <motion.div 
            key={profile.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl border border-black/5 overflow-hidden shadow-sm flex flex-col"
          >
            <div className="relative aspect-square">
              <img src={profile.photo} className="w-full h-full object-cover" alt="" referrerPolicy="no-referrer" />
              <div className="absolute top-2 right-2 bg-emerald-500 text-white p-1.5 rounded-full shadow-lg">
                <Check size={12} />
              </div>
            </div>
            <div className="p-3 space-y-1">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-sm">{profile.name}, {profile.age}</h4>
                <button 
                  onClick={() => handleShowChat(profile.id)}
                  className="p-1.5 text-purple-600 hover:bg-purple-50 rounded-full transition-colors"
                >
                  <MessageCircle size={18} />
                </button>
              </div>
              <p className="text-[10px] text-black/40 flex items-center gap-1">
                <MapPin size={10} /> {profile.route}
              </p>
            </div>
          </motion.div>
        ))}
        {renderChatModal(MOCK_COMPANIONS.find(m => m.id === showChat))}
      </div>
    );
  };

  const renderChatModal = (currentMatch: any) => {
    if (!currentMatch || !showChat) return null;
    
    return (
      <AnimatePresence>
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div className="bg-white w-full max-w-md rounded-3xl overflow-hidden shadow-2xl flex flex-col h-[80vh]">
            <div className="p-4 border-b border-black/5 flex items-center justify-between bg-purple-50">
              <div className="flex items-center gap-3">
                <img src={currentMatch.photo} className="w-10 h-10 rounded-full object-cover" alt="" referrerPolicy="no-referrer" />
                <div>
                  <h4 className="font-semibold">{currentMatch.name}</h4>
                  <p className="text-[10px] text-black/40">Онлайн</p>
                </div>
              </div>
              <button onClick={() => setShowChat(null)} className="p-2 hover:bg-black/5 rounded-full">
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 p-4 space-y-4 overflow-y-auto">
              <div className="bg-black/5 p-3 rounded-2xl rounded-tl-none max-w-[80%] text-sm">
                Привет! Вижу, наши интересы совпадают. Я тоже планирую быть в Крыму в это время. Поедем вместе?
              </div>
            </div>
            <div className="p-4 border-t border-black/5 flex gap-2">
              <input 
                type="text" 
                placeholder="Напишите сообщение..."
                className="flex-1 bg-black/5 border-none rounded-full px-4 py-2 text-sm focus:ring-2 focus:ring-purple-500 outline-none"
              />
              <button className="bg-purple-600 text-white p-2 rounded-full hover:bg-purple-700 transition-colors">
                <Check size={20} />
              </button>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    );
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: 100 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 100 }}
      className="relative h-full bg-[#f5f5f0] flex flex-col overflow-hidden"
    >
      <div className="p-4 flex items-center justify-between border-b border-black/5 bg-white">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center">
            <Users size={20} />
          </div>
          <div>
            <h1 className="font-serif text-lg leading-tight">Найди попутчика</h1>
            <p className="text-[10px] uppercase tracking-wider font-bold opacity-30">Crimea Companion</p>
          </div>
        </div>
        <button 
          onClick={onClose}
          className="p-2 hover:bg-black/5 rounded-full transition-colors"
        >
          <X size={24} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 md:p-8">
        <div className="max-w-2xl mx-auto">
          {step === 'form' ? renderForm() : renderMatching()}
        </div>
      </div>

      <AnimatePresence>
        {showMatchSuccess && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-[100] bg-purple-600 flex flex-col items-center justify-center text-white p-8 text-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', damping: 12 }}
              className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center mb-6"
            >
              <Check size={48} />
            </motion.div>
            <h2 className="text-3xl font-serif mb-2">Профиль сохранен!</h2>
            <p className="opacity-80 max-w-xs">Мы ищем подходящих попутчиков среди тысяч путешественников...</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* In-app Notifications Overlay */}
      <div className="absolute top-4 right-4 z-[200] space-y-2 pointer-events-none">
        <AnimatePresence>
          {notifications.map(notification => (
            <motion.div
              key={notification.id}
              initial={{ opacity: 0, x: 50, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
              className="bg-white border border-black/5 shadow-2xl rounded-2xl p-4 w-72 pointer-events-auto flex items-start gap-3"
            >
              <div className="w-10 h-10 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center shrink-0">
                <Bell size={20} />
              </div>
              <div>
                <h4 className="text-sm font-bold text-black">{notification.title}</h4>
                <p className="text-xs text-black/60 leading-tight mt-0.5">{notification.body}</p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};
