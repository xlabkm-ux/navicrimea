/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * NaviCrimea - Travel & Stay Platform
 * 
 * ПОШАГОВАЯ ИНСТРУКЦИЯ ПО УСТАНОВКЕ (BACKEND DEVELOPER CHECKLIST):
 * 1. Установка зависимостей: npm install
 * 2. Настройка окружения: скопируйте .env.example в .env
 * 3. Настройка AI_MODE: выберите 'local' или 'yandex'
 * 4. Ввод ключей API: через интерфейс "Кабинет -> Настройки"
 * 5. Сборка проекта: npm run build
 * 6. Запуск сервера: npm start
 * 
 * CHECKPOINT: 2026-03-14 (YandexGPT & On-Premise Ready)
 */

import React, { lazy, Suspense, useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { 
  Map as MapIcon, 
  List, 
  Search, 
  Calendar, 
  Navigation, 
  ShieldCheck, 
  ChevronRight,
  ChevronLeft,
  MapPin,
  RefreshCw,
  User,
  X,
  Globe,
  ChevronDown,
  Mic,
  Route,
  Clock,
  CreditCard,
  Download,
  CheckCircle2,
  Car,
  Fuel,
  Utensils,
  Camera,
  WifiOff,
  CloudDownload,
  Star,
  Check,
  Activity,
  Image as ImageIcon,
  Edit2,
  LogOut,
  Mail,
  Plus,
  ThumbsUp,
  Trash2,
  Send,
  Share2,
  Users,
  Gamepad2,
  Trophy,
  Zap,
  Target,
  Layers,
  Sparkles,
  Info,
  Handshake,
  Briefcase,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Impression, VisitedPlace } from './types';
import { ExternalVoiceAssistant } from './components/ExternalVoiceAssistant';

const CompanionFinder = lazy(() =>
  import('./components/CompanionFinder').then((module) => ({ default: module.CompanionFinder })),
);
const AIVoiceRoutePlanner = lazy(() =>
  import('./components/AIVoiceRoutePlanner').then((module) => ({ default: module.AIVoiceRoutePlanner })),
);
const ImpressionsManager = lazy(() =>
  import('./components/ImpressionsManager').then((module) => ({ default: module.ImpressionsManager })),
);
const SettingsPanel = lazy(() =>
  import('./components/SettingsPanel').then((module) => ({ default: module.SettingsPanel })),
);
const LocalMap = lazy(() =>
  import('./components/LocalMap').then((module) => ({ default: module.LocalMap })),
);

const loadJsPdf = async () => {
  const module = await import('jspdf');
  return module.jsPDF;
};

const LazyPanelFallback = () => (
  <div className="p-10 text-center opacity-20">
    <RefreshCw className="animate-spin mx-auto" />
  </div>
);

interface UserProfile {
  id: string;
  fullName: string;
  birthDate: string;
  address: string;
  phone: string;
  phoneVerified: boolean;
  email: string;
  emailVerified: boolean;
  photo: string;
  rating: number;
  completedOrders: number;
  verifications: {
    gosuslugi: boolean;
    yandex: boolean;
    google: boolean;
    vk: boolean;
  };
}

interface OutboxItem {
  id: string;
  type: 'message' | 'booking' | 'ad' | 'support';
  data: any;
  timestamp: number;
  status: 'pending' | 'syncing' | 'failed';
}

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
  region?: string;
  distance_to_sea?: string;
  distance_to_stop?: string;
}

const CRIMEA_CITIES = [
  { 
    id: 'yalta', 
    name: 'Ялта', 
    districts: ['Центр', 'Массандра', 'Ливадия', 'Гаспра', 'Кореиз', 'Симеиз', 'Форос', 'Гурзуф'] 
  },
  { 
    id: 'sevastopol', 
    name: 'Севастополь', 
    districts: ['Гагаринский', 'Ленинский', 'Нахимовский', 'Балаклавский', 'Инкерман', 'Северная сторона'] 
  },
  { 
    id: 'simferopol', 
    name: 'Симферополь', 
    districts: ['Центральный', 'Железнодорожный', 'Киевский', 'Грэсовский'] 
  },
  { 
    id: 'evpatoria', 
    name: 'Евпатория', 
    districts: ['Старый город', 'Курортная зона', 'Заозерное', 'Мирный', 'Новоозерное'] 
  },
  { 
    id: 'feodosia', 
    name: 'Феодосия', 
    districts: ['Центр', 'Береговое', 'Приморский', 'Орджоникидзе', 'Коктебель'] 
  },
  { 
    id: 'sudak', 
    name: 'Судак', 
    districts: ['Центр', 'Новый Свет', 'Дачное', 'Солнечная Долина'] 
  },
  { 
    id: 'kerch', 
    name: 'Керчь', 
    districts: ['Центр', 'Аршинцево', 'Войково', 'Героевское'] 
  },
  { 
    id: 'alushta', 
    name: 'Алушта', 
    districts: ['Центр', 'Профессорский уголок', 'Партенит', 'Малореченское', 'Рыбачье'] 
  },
];

const LOCAL_FALLBACK_IMAGES = [
  '/images/hero-coast-1.svg',
  '/images/hero-coast-2.svg',
  '/images/hero-cliff-1.svg',
  '/images/hero-cliff-2.svg',
  '/images/hero-palace.svg',
  '/images/hero-sea-night.svg',
];

const getFallbackImage = (index: number) => LOCAL_FALLBACK_IMAGES[index % LOCAL_FALLBACK_IMAGES.length];

const CRIMEA_REGIONS = [
  { id: 'yalta', name: 'Ялта', image: getFallbackImage(0), fallbackImage: getFallbackImage(0) },
  { id: 'sevastopol', name: 'Севастополь', image: getFallbackImage(1), fallbackImage: getFallbackImage(1) },
  { id: 'simferopol', name: 'Симферополь', image: getFallbackImage(2), fallbackImage: getFallbackImage(2) },
  { id: 'evpatoria', name: 'Евпатория', image: getFallbackImage(3), fallbackImage: getFallbackImage(3) },
  { id: 'kerch', name: 'Керчь', image: getFallbackImage(4), fallbackImage: getFallbackImage(4) },
  { id: 'feodosia', name: 'Феодосия', image: getFallbackImage(5), fallbackImage: getFallbackImage(5) },
  { id: 'sudak', name: 'Судак', image: getFallbackImage(0), fallbackImage: getFallbackImage(0) },
  { id: 'bakhchisaray', name: 'Бахчисарай', image: getFallbackImage(1), fallbackImage: getFallbackImage(1) },
  { id: 'koktebel', name: 'Коктебель', image: getFallbackImage(2), fallbackImage: getFallbackImage(2) },
  { id: 'alushta', name: 'Алушта', image: getFallbackImage(3), fallbackImage: getFallbackImage(3) },
  { id: 'gurzuf', name: 'Гурзуф', image: getFallbackImage(4), fallbackImage: getFallbackImage(4) },
  { id: 'foros', name: 'Форос', image: getFallbackImage(5), fallbackImage: getFallbackImage(5) },
  { id: 'balaklava', name: 'Балаклава', image: getFallbackImage(0), fallbackImage: getFallbackImage(0) },
  { id: 'inkerman', name: 'Инкерман', image: getFallbackImage(1), fallbackImage: getFallbackImage(1) },
  { id: 'saki', name: 'Саки', image: getFallbackImage(2), fallbackImage: getFallbackImage(2) },
  { id: 'chernomorskoe', name: 'Черноморское', image: getFallbackImage(3), fallbackImage: getFallbackImage(3) },
  { id: 'shchelkino', name: 'Щёлкино', image: getFallbackImage(4), fallbackImage: getFallbackImage(4) },
  { id: 'belogorsk', name: 'Белогорск', image: getFallbackImage(5), fallbackImage: getFallbackImage(5) },
];

interface POI {
  id: number;
  name: string;
  type: 'gas' | 'restaurant' | 'attraction';
  lat: number;
  lng: number;
}

const MOCK_POIS: POI[] = [
  { id: 1, name: 'АЗС Атан', type: 'gas', lat: 44.95, lng: 34.11 },
  { id: 2, name: 'Ресторан "Крым"', type: 'restaurant', lat: 44.51, lng: 33.52 },
  { id: 3, name: 'Ласточкино гнездо', type: 'attraction', lat: 44.43, lng: 34.12 },
  { id: 4, name: 'АЗС ТЭС', type: 'gas', lat: 44.72, lng: 34.51 },
  { id: 5, name: 'Кафе "У моря"', type: 'restaurant', lat: 44.61, lng: 33.85 },
  { id: 6, name: 'Воронцовский дворец', type: 'attraction', lat: 44.41, lng: 34.05 },
];

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
    findCompanion: 'Попутчики',
    safety: 'Безопасность',
    cabinet: 'Кабинет',
    search: 'Поиск по названию или типу...',
    list: 'Список',
    regions: 'Регионы',
    distanceToSea: 'До моря',
    distanceToStop: 'До остановки',
    map: 'Карта',
    night: 'ночь',
    syncStatus: 'Статус синхронизации',
    icalActive: 'iCal Активен',
    manualOnly: 'Только вручную',
    verification: 'Верификация',
    verifiedHost: 'Проверенный хост',
    checkAvailability: 'Проверить наличие',
    syncCalendar: 'Синхронизировать календарь',
    icalUrlPlaceholder: 'Введите iCal URL...',
    syncing: 'Синхронизация...',
    planRoute: 'Планировать маршрут',
    clearRoute: 'Очистить',
    addToRoute: 'В маршрут',
    removeFromRoute: 'Удалить',
    estimatedTime: 'Время в пути',
    routePoints: 'Точки маршрута',
    totalCost: 'Общая стоимость',
    travelTimeWithSleep: 'Время с учетом отдыха',
    letsGo: 'Поехали!',
    confirmAndBook: 'Подтвердить маршрут и бронь',
    downloadPdf: 'Скачать PDF файл с вашим маршрутом',
    paymentRequired: 'Оплата обязательна для получения PDF',
    payRoute: 'Оплатить маршрут',
    processingPayment: 'Обработка оплаты...',
    routeSummary: 'Резюме маршрута',
    priceVerified: 'Цена проверена сообществом',
    safeDeal: 'Безопасная сделка',
    escrowAgent: 'Эскроу-агент: ООО "Навигатор Крым"',
    guarantee: 'Средства защищены до подтверждения заселения',
    openDispute: 'Открыть спор',
    notes: 'Заметки для владельца или провайдера',
    cancel: 'Отмена',
    optional: 'необязательно',
    nearbyPois: 'Объекты рядом',
    noObjects: 'Объекты не найдены в этой области.',
    postgis: 'PostGIS: Активен',
    s3: 'S3 Хранилище: Подключено',
    systemTime: 'Системное время',
    region: 'Регион: Крым (RU)',
    offlineMode: 'Оффлайн режим',
    onlineMode: 'Онлайн',
    downloadOffline: 'Скачать для оффлайн',
    dataCached: 'Данные сохранены локально',
    caching: 'Сохранение...',
    rating: 'Рейтинг',
    completedOrders: 'Завершенные заказы',
    personalInfo: 'Личные сведения',
    editPhoto: 'Изменить фото',
    verifyWith: 'Верификация через',
    gosuslugi: 'Госуслуги',
    yandexId: 'Яндекс ID',
    google: 'Google',
    vk: 'ВКонтакте',
    verified: 'Верифицирован',
    notVerified: 'Не верифицирован',
    saveChanges: 'Сохранить изменения',
    fullName: 'ФИО',
    birthDate: 'Дата рождения',
    address: 'Адрес проживания',
    connectServices: 'Подключить через сервисы',
    back: 'Назад',
    phone: 'Телефон',
    sendCode: 'Отправить код',
    enterCode: 'Введите код',
    confirm: 'Подтвердить',
    phoneVerified: 'Телефон подтвержден',
    emailVerified: 'Email подтвержден',
    placeAd: 'Разместить объявление',
    myListings: 'Мои объявления',
    downloadMap: 'Скачать карту Крыма',
    mapDataCached: 'Карта сохранена',
    landlordCabinet: 'Кабинет арендодателя',
    adDescription: 'Описание жилья',
    nearbyNotes: 'Что находится рядом (музеи, кафе и т.д.)',
    photos: 'Фотографии (макс. 15)',
    videos: 'Видео (макс. 2, до 150МБ)',
    askConsultant: 'Спросить',
    consultantHelp: 'Консультант поможет вам разместить объявление',
    voiceInput: 'Голосовой ввод',
    category: 'Категория',
    realEstate: 'Недвижимость',
    apartment: 'Квартира',
    house: 'Дом',
    hotel: 'Отель',
    hostel: 'Хостел',
    room: 'Комната',
    equipment: 'Оборудование',
    vehicle: 'Аренда снаряжения для туризма',
    roomsCount: 'Количество комнат',
    bathroomsCount: 'Количество ванных комнат',
    hotelStars: 'Звездность отеля',
    pricePerNight: 'Цена за сутки',
    pricePerHour: 'Цена за час',
    currency: 'Валюта',
    equipmentType: 'Тип оборудования',
    vehicleType: 'Тип техники',
    capacity: 'Вместимость (чел.)',
    year: 'Год выпуска',
    captainIncluded: 'Капитан/Водитель включен',
    insuranceIncluded: 'Страховка включена',
    diving: 'Дайвинг',
    bikes: 'Велосипеды',
    jeeps: 'Джипы',
    atv: 'Квадроциклы',
    yachts: 'Яхты',
    minDuration: 'Мин. срок аренды',
    maxDuration: 'Макс. срок аренды',
    securityDeposit: 'Залог (депозит)',
    instantBooking: 'Мгновенное бронирование',
    requestToBook: 'Бронирование по запросу',
    cancellationPolicy: 'Правила отмены',
    flexible: 'Гибкие',
    moderate: 'Умеренные',
    strict: 'Строгие',
    amenities: 'Удобства и опции',
    wifi: 'Wi-Fi',
    ac: 'Кондиционер',
    parking: 'Парковка',
    kitchen: 'Кухня',
    helmet: 'Шлем',
    lock: 'Замок',
    lifeJacket: 'Спасательный жилет',
    fishingGear: 'Снасти для рыбалки',
    transfer: 'Трансфер',
    availability: 'Доступность',
    availableNow: 'Доступно сейчас',
    blockedDates: 'Заблокированные даты',
    reviews: 'Отзывы',
    averageRating: 'Средний рейтинг',
    totalReviews: 'Всего отзывов',
    noReviews: 'Отзывов пока нет',
    clientFeedback: 'Обратная связь от клиентов',
    reply: 'Ответить',
    helpful: 'Полезно',
    listening: 'Слушаю...',
    voiceSearch: 'Голосовой поиск',
    transferPartner: 'Трансфер от партнеров',
    transferFixed: 'Фиксированный тариф: Аэропорт Симферополь → Отель',
    transferPrice: 'Стоимость трансфера: ₽2,500',
    addTransfer: 'Добавить трансфер к заказу',
    bookings: 'Бронирования',
    messages: 'Сообщения',
    passport: 'Паспорт',
    verifyIdentity: 'Подтвердить личность',
    guest: 'Гость',
    status: 'Статус',
    confirmed: 'Подтверждено',
    pending: 'Ожидает',
    chat: 'Чат',
    typeMessage: 'Введите сообщение...',
    send: 'Отправить',
    outbox: 'Исходящие (ожидают синхронизации)',
    syncPending: 'Синхронизация...',
    offlineMessage: 'Сообщение будет отправлено при появлении сети',
    show: 'Показать',
    hide: 'Скрыть',
    support: 'Поддержка',
    offlineNav: 'Офлайн Навигация',
    yandexMaps: 'Яндекс Карты',
    googleMaps: 'Google Карты',
    switchMap: 'Сменить провайдера карт',
    objectName: 'Название объекта',
    exactAddress: 'Точный адрес',
    floor: 'Этажность',
    area: 'Площадь (кв. м.)',
    sleepingPlaces: 'Спальные места',
    maxGuests: 'Максимальное кол-во гостей',
    childrenAllowed: 'Можно с детьми',
    petsAllowed: 'Можно с животными',
    climate: 'Климат',
    connectivity: 'Связь',
    kitchenEquipment: 'Кухня',
    bathroomEquipment: 'Ванная',
    additionalAmenities: 'Дополнительно',
    checkInTime: 'Время заезда',
    checkOutTime: 'Время выезда',
    verificationPhoto: 'Фото верификации',
    transportType: 'Тип транспорта',
    carMakeModel: 'Марка и модель авто',
    carYearCondition: 'Год выпуска и состояние',
    carCapacity: 'Вместимость (пассажиры + багаж)',
    basePoint: 'Базовая точка',
    serviceArea: 'Зона обслуживания',
    fixedRoutes: 'Фиксированные маршруты',
    pricePerKm: 'Цена за км',
    extraServices: 'Доп. услуги',
    serviceCategory: 'Категория услуги',
    serviceName: 'Название программы/товара',
    duration: 'Длительность',
    startPoint: 'Место старта',
    deliveryAvailable: 'Возможность доставки',
    technicalCondition: 'Техническое состояние',
    partnerStatus: 'Юридический статус',
    inn: 'ИНН',
    bankAccount: 'Реквизиты счета',
    passportScan: 'Скан паспорта',
    objectClassification: 'Классификация объекта',
    ownershipRegistration: 'Право собственности (ЕГРН)',
    routeFromTo: 'Маршрут (Откуда — Куда)',
    dateTime: 'Дата и время',
    purpose: 'Цель',
    fellowTravelerRequirements: 'Требования к попутчику',
    housing: 'Жилье',
    transport: 'Транспорт',
    services: 'Услуги',
    legal: 'Юридический блок',
    social: 'Попутчик',
    share: 'Поделиться',
    invoices: 'Счета',
    grants: 'Гранты',
    standards: 'Стандарты',
    monitoring: 'Мониторинг',
    fleet: 'Автопарк',
    inspector: 'Инспектор',
    ministry: 'Министерство',
    hotelier: 'Отельер',
    tourist: 'Турист',
    fixedFee: 'Фикс. сбор (500₽)',
    grantStatus: 'Статус гранта',
    qualityAudit: 'Аудит качества',
    shadowMarket: 'Теневой рынок',
    heatMap: 'Тепловая карта',
    migrationControl: 'Миграционный контроль',
    aboutUs: 'О нас',
    partnerProgram: 'Партнеры',
    manifestoTitle: 'МАНИФЕСТ ЭКОСИСТЕМЫ «НАВИГАТОР КРЫМ»',
    manifestoSubtitle: 'От хаоса «дикого» туризма к цифровому государству будущего',
    manifestoText: `1. Наша Миссия
Мы не создаем «еще один сайт для бронирования». Мы строим Цифровую Операционную Систему Региона. Наша цель — превратить Крым в мировой стандарт travel-индустрии, используя технологии как мост между интересами Гражданина, Бизнеса и Государства.

2. Философия «Золотого Треугольника»
Мы первыми в индустрии решаем вечный конфликт трех сторон, превращая противоречия в синергию:

I. ПОЛЬЗОВАТЕЛЬСКИЙ ФУНКЦИОНАЛ (Продаем мечту)
Для туриста мы — «Цифровой консьерж».
Бесшовный опыт: От порога дома до шезлонга в одной корзине (жилье + трансфер + досуг + страховка).
Интуитивность: Голосовой AI-помощник и интерактивная 3D-карта, понятная даже ребенку или пожилому человеку.
Гарантия качества: Только верифицированные объекты, соответствующие «Крымскому стандарту».

II. ПРОЗРАЧНАЯ ОТЧЕТНОСТЬ (Цифровое доверие)
Для государства мы — «Глаза и аналитический центр».
Легализация за один клик: Мы выводим «теневой» сектор (квартиры, гостевые дома) в правовое поле без бюрократии.
Автоматизация МВД/ФМС: Мгновенная регистрация иностранных граждан без визитов в органы.
Big Data региона: Поток достоверной статистики в реальном времени для принятия управленческих решений.

III. ПОДДЕРЖКА И РАЗВИТИЕ (Инвестиции в рост)
Для отельеров мы — «Акселератор бизнеса».
Доступ к капиталу: Мы — верификатор для получения госсубсидий и грантов на реновацию фонда. Если отель в системе — он качественный налогоплательщик и имеет право на помощь.
Электронное администрирование: Мы забираем на себя всю «боль» — календари, брони, налоги, отчеты. Отельеру остается только встречать гостей.

3. Технологический фундамент (Архитектура Доверия)
Проект базируется на передовых High-load решениях:
Гео-ядро (PostGIS + Yandex API): Вся логистика и навигация на одном экране.
Интеллектуальный калькулятор: Автоматический расчет бюджета всей поездки «под ключ».
Безопасная сделка (Escrow): Защита денег туриста и гарантия выплаты владельцу.
Масштабируемый Python/FastAPI бэкенд: Готовность к нагрузкам в 6 000 000+ туристов в сезон.
Защищенный контур: Хранение данных в соответствии с ФЗ-152 и требованиями безопасности РФ.

4. Экосистема услуг: Все в одном окне
Жилье: От уютной комнаты «у бабушки» до премиум-отеля.
Транспорт: Единый агрегатор трансферов и собственный парк автомобилей для самозанятых водителей.
Впечатления: Джиппинг, дайвинг, экскурсии и аренда инвентаря.
Помощь: Кнопка экстренной связи, страхование и юридическая поддержка.

5. Путь к ГЧП (Государственно-Частное Партнерство)
Мы предлагаем государству не тратить бюджеты на создание мертворожденных порталов, а стать соучредителем живого, коммерчески эффективного продукта.
Фиксированная цена успеха: 500 рублей за счастливого туриста. Это прозрачно, честно и выгодно всем.
Результат: 100% контроль турпотока, рост налоговых поступлений и Крым, в который хочется возвращаться.

ЭПИЛОГ: Навигатор Крым — это точка сборки.
Мы объединяем усилия частных предпринимателей и государственную волю, чтобы создать лучший туристический сервис в России. Мы не просто пишем код — мы строим будущее Крыма.`,
  },
  en: {
    stays: 'Stays',
    routes: 'Routes',
    experiences: 'Experiences',
    findCompanion: 'Find a Companion',
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
    syncCalendar: 'Sync Calendar',
    icalUrlPlaceholder: 'Enter iCal URL...',
    syncing: 'Syncing...',
    planRoute: 'Plan Route',
    clearRoute: 'Clear',
    addToRoute: 'Add to Route',
    removeFromRoute: 'Remove',
    estimatedTime: 'Est. Time',
    routePoints: 'Route Points',
    totalCost: 'Total Cost',
    travelTimeWithSleep: 'Time with Rest',
    letsGo: "Let's Go!",
    confirmAndBook: 'Confirm Route & Booking',
    downloadPdf: 'Download PDF with your route',
    paymentRequired: 'Payment required for PDF',
    payRoute: 'Pay for Route',
    processingPayment: 'Processing Payment...',
    routeSummary: 'Route Summary',
    priceVerified: 'Price verified by community',
    safeDeal: 'Safe Deal',
    escrowAgent: 'Escrow Agent: Navicrimea LLC',
    guarantee: 'Funds protected until check-in confirmation',
    openDispute: 'Open Dispute',
    notes: 'Notes for owner or provider',
    cancel: 'Cancel',
    optional: 'optional',
    nearbyPois: 'Nearby POIs',
    noObjects: 'No objects found in this area.',
    postgis: 'PostGIS: Active',
    s3: 'S3 Storage: Connected',
    systemTime: 'System Time',
    region: 'Region: Crimea (RU)',
    offlineMode: 'Offline Mode',
    onlineMode: 'Online',
    downloadOffline: 'Download for Offline',
    dataCached: 'Data cached locally',
    caching: 'Caching...',
    rating: 'Rating',
    completedOrders: 'Completed Orders',
    personalInfo: 'Personal Info',
    editPhoto: 'Edit Photo',
    verifyWith: 'Verify with',
    gosuslugi: 'Gosuslugi',
    yandexId: 'Yandex ID',
    google: 'Google',
    vk: 'VK',
    verified: 'Verified',
    notVerified: 'Not Verified',
    saveChanges: 'Save Changes',
    fullName: 'Full Name',
    birthDate: 'Date of Birth',
    address: 'Address of Residence',
    connectServices: 'Connect via Services',
    back: 'Back',
    phone: 'Phone',
    sendCode: 'Send code',
    enterCode: 'Enter code',
    confirm: 'Confirm',
    phoneVerified: 'Phone verified',
    emailVerified: 'Email verified',
    placeAd: 'Place an Ad',
    myListings: 'My Listings',
    downloadMap: 'Download Crimea Map',
    mapDataCached: 'Map Data Cached',
    landlordCabinet: 'Landlord Cabinet',
    adDescription: 'Housing Description',
    nearbyNotes: 'Nearby Notes (museums, cafes, etc.)',
    photos: 'Photos (max 15)',
    videos: 'Videos (max 2, up to 150MB)',
    askConsultant: 'Ask',
    consultantHelp: 'Consultant will help you place an ad',
    voiceInput: 'Voice Input',
    category: 'Category',
    realEstate: 'Real Estate',
    apartment: 'Apartment',
    house: 'House',
    hotel: 'Hotel',
    hostel: 'Hostel',
    room: 'Room',
    equipment: 'Equipment',
    vehicle: 'Tourism Equipment Rental',
    roomsCount: 'Number of Rooms',
    bathroomsCount: 'Number of Bathrooms',
    hotelStars: 'Hotel Stars',
    pricePerNight: 'Price per Night',
    pricePerHour: 'Price per Hour',
    currency: 'Currency',
    equipmentType: 'Equipment Type',
    vehicleType: 'Vehicle Type',
    capacity: 'Capacity (people)',
    year: 'Year of Manufacture',
    captainIncluded: 'Captain/Driver Included',
    insuranceIncluded: 'Insurance Included',
    diving: 'Diving',
    bikes: 'Bikes',
    jeeps: 'Jeeps',
    atv: 'ATV',
    yachts: 'Yachts',
    minDuration: 'Min Duration',
    maxDuration: 'Max Duration',
    securityDeposit: 'Security Deposit',
    instantBooking: 'Instant Booking',
    requestToBook: 'Request to Book',
    cancellationPolicy: 'Cancellation Policy',
    flexible: 'Flexible',
    moderate: 'Moderate',
    strict: 'Strict',
    amenities: 'Amenities & Options',
    wifi: 'Wi-Fi',
    ac: 'Air Conditioning',
    parking: 'Parking',
    kitchen: 'Kitchen',
    helmet: 'Helmet',
    lock: 'Lock',
    lifeJacket: 'Life Jacket',
    fishingGear: 'Fishing Gear',
    transfer: 'Transfer',
    availability: 'Availability',
    availableNow: 'Available Now',
    blockedDates: 'Blocked Dates',
    reviews: 'Reviews',
    averageRating: 'Average Rating',
    totalReviews: 'Total Reviews',
    noReviews: 'No reviews yet',
    clientFeedback: 'Client Feedback',
    reply: 'Reply',
    helpful: 'Helpful',
    listening: 'Listening...',
    voiceSearch: 'Voice Search',
    transferPartner: 'Airport Transfer',
    transferFixed: 'Fixed Rate: Simferopol Airport → Hotel',
    transferPrice: 'Transfer Cost: ₽2,500',
    addTransfer: 'Add transfer to order',
    regions: 'Crimea Regions',
    backToRegions: 'Back to regions',
    bookings: 'Bookings',
    messages: 'Messages',
    passport: 'Passport',
    verifyIdentity: 'Verify Identity',
    guest: 'Guest',
    status: 'Status',
    confirmed: 'Confirmed',
    pending: 'Pending',
    chat: 'Chat',
    typeMessage: 'Type a message...',
    send: 'Send',
    outbox: 'Outbox (pending sync)',
    syncPending: 'Syncing...',
    offlineMessage: 'Message will be sent when connection is restored',
    show: 'Show',
    hide: 'Hide',
    support: 'Support',
    offlineNav: 'Offline Navigation',
    yandexMaps: 'Yandex Maps',
    googleMaps: 'Google Maps',
    switchMap: 'Switch Map Provider',
    objectName: 'Object Name',
    exactAddress: 'Exact Address',
    floor: 'Floor / Total Floors',
    area: 'Area (sq. m.)',
    sleepingPlaces: 'Sleeping Places',
    maxGuests: 'Max Guests',
    childrenAllowed: 'Children Allowed',
    petsAllowed: 'Pets Allowed',
    climate: 'Climate',
    connectivity: 'Connectivity',
    kitchenEquipment: 'Kitchen Equipment',
    bathroomEquipment: 'Bathroom Equipment',
    additionalAmenities: 'Additional Amenities',
    checkInTime: 'Check-in Time',
    checkOutTime: 'Check-out Time',
    verificationPhoto: 'Verification Photo',
    transportType: 'Transport Type',
    carMakeModel: 'Car Make & Model',
    carYearCondition: 'Year & Condition',
    carCapacity: 'Capacity (Passengers + Luggage)',
    basePoint: 'Base Point',
    serviceArea: 'Service Area',
    fixedRoutes: 'Fixed Routes',
    pricePerKm: 'Price per Km',
    extraServices: 'Extra Services',
    serviceCategory: 'Service Category',
    serviceName: 'Program/Product Name',
    duration: 'Duration',
    startPoint: 'Start Point',
    deliveryAvailable: 'Delivery Available',
    technicalCondition: 'Technical Condition',
    partnerStatus: 'Legal Status',
    inn: 'INN (Tax ID)',
    bankAccount: 'Bank Account Details',
    passportScan: 'Passport Scan',
    objectClassification: 'Object Classification',
    ownershipRegistration: 'Ownership Registration (EGRN)',
    routeFromTo: 'Route (From — To)',
    dateTime: 'Date & Time',
    purpose: 'Purpose',
    fellowTravelerRequirements: 'Fellow Traveler Requirements',
    housing: 'Housing',
    transport: 'Transport',
    services: 'Services',
    legal: 'Legal',
    social: 'Social',
    share: 'Share',
    invoices: 'Invoices',
    grants: 'Grants',
    standards: 'Standards',
    monitoring: 'Monitoring',
    fleet: 'Fleet',
    inspector: 'Inspector',
    ministry: 'Ministry',
    hotelier: 'Hotelier',
    tourist: 'Tourist',
    fixedFee: 'Fixed Fee (500₽)',
    grantStatus: 'Grant Status',
    qualityAudit: 'Quality Audit',
    shadowMarket: 'Shadow Market',
    heatMap: 'Heat Map',
    migrationControl: 'Migration Control',
    aboutUs: 'About Us',
    partnerProgram: 'Partner Program',
    manifestoTitle: 'NAVICRIMEA ECOSYSTEM MANIFESTO',
    manifestoSubtitle: 'From the chaos of "wild" tourism to the digital state of the future',
    manifestoText: `1. Our Mission
We are not creating "just another booking site". We are building the Digital Operating System of the Region. Our goal is to turn Crimea into a world standard for the travel industry, using technology as a bridge between the interests of the Citizen, Business, and the State.

2. The "Golden Triangle" Philosophy
We are the first in the industry to resolve the eternal conflict of three parties, turning contradictions into synergy:

I. USER FUNCTIONALITY (Selling the dream)
For the tourist, we are a "Digital Concierge".
Seamless experience: From the doorstep to the sun lounger in one basket (housing + transfer + leisure + insurance).
Intuitiveness: AI voice assistant and interactive 3D map, understandable even to a child or an elderly person.
Quality guarantee: Only verified objects that meet the "Crimean Standard".

II. TRANSPARENT REPORTING (Digital trust)
For the state, we are the "Eyes and analytical center".
Legalization in one click: We bring the "shadow" sector (apartments, guest houses) into the legal field without bureaucracy.
MVD/FMS Automation: Instant registration of foreign citizens without visits to authorities.
Regional Big Data: A stream of reliable real-time statistics for making management decisions.

III. SUPPORT AND DEVELOPMENT (Investment in growth)
For hoteliers, we are a "Business Accelerator".
Access to capital: We are a verifier for obtaining state subsidies and grants for fund renovation. If a hotel is in the system, it is a quality taxpayer and has the right to help.
Electronic administration: We take on all the "pain" - calendars, bookings, taxes, reports. The hotelier only has to meet the guests.

3. Technological Foundation (Architecture of Trust)
The project is based on advanced High-load solutions:
Geo-core (PostGIS + Yandex API): All logistics and navigation on one screen.
Intelligent calculator: Automatic calculation of the budget for the entire trip "turnkey".
Safe deal (Escrow): Protection of the tourist's money and guarantee of payment to the owner.
Scalable Python/FastAPI backend: Readiness for loads of 6,000,000+ tourists per season.
Protected circuit: Data storage in accordance with FZ-152 and RF security requirements.

4. Ecosystem of Services: All in one window
Housing: From a cozy room "at grandma's" to a premium hotel.
Transport: A single aggregator of transfers and its own fleet of cars for self-employed drivers.
Experiences: Jipping, diving, excursions, and equipment rental.
Help: Emergency button, insurance, and legal support.

5. Path to GCHP (State-Private Partnership)
We offer the state not to waste budgets on creating stillborn portals, but to become a co-founder of a live, commercially effective product.
Fixed price of success: 500 rubles for a happy tourist. This is transparent, honest, and beneficial to everyone.
Result: 100% control of tourist flow, growth of tax revenues, and Crimea that you want to return to.

EPILOGUE: NaviCrimea is the assembly point.
We combine the efforts of private entrepreneurs and state will to create the best tourist service in Russia. We don't just write code - we build the future of Crimea.`,
  },
  zh: {
    stays: '住宿',
    routes: '路线',
    experiences: '体验',
    findCompanion: '找伴',
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
    region: '地区: 克里米亚 (RU)',
    share: '分享',
  },
  hi: {
    stays: 'ठहरने की जगह',
    routes: 'मार्ग',
    experiences: 'अनुभव',
    findCompanion: 'साथी खोजें',
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
    region: 'क्षेत्र: क्रीमिया (RU)',
    share: 'साझा करें',
  },
  es: {
    stays: 'Estancias',
    routes: 'Rutas',
    experiences: 'Experiencias',
    findCompanion: 'Encontrar un Compañero',
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
    region: 'Región: Crimea (RU)',
    share: 'Compartir',
  },
  fr: {
    stays: 'Séjours',
    routes: 'Itinéraires',
    experiences: 'Expériences',
    findCompanion: 'Trouver un Compagnon',
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
    region: 'Région: Crimée (RU)',
    share: 'Partager',
  },
  ar: {
    stays: 'الإقامة',
    routes: 'الطرق',
    experiences: 'التجارب',
    findCompanion: 'ابحث عن رفيق',
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
    region: 'المنطقة: القرم (RU)',
    share: 'مشاركة',
  },
  bn: {
    stays: 'থাকার জায়গা',
    routes: 'রুট',
    experiences: 'অভিজ্ঞতা',
    findCompanion: 'সঙ্গী খুঁজুন',
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
    region: 'অঞ্চল: ক্রিমিয়া (RU)',
    share: 'শেয়ার করুন',
  },
  pt: {
    stays: 'Estadias',
    routes: 'Rotas',
    experiences: 'Experiências',
    findCompanion: 'Encontrar um Companheiro',
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
    region: 'Região: Crimeia (RU)',
    share: 'Compartilhar',
  },
  ja: {
    stays: '宿泊',
    routes: 'ルート',
    experiences: '体験',
    findCompanion: '同行者を探す',
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
    region: '地域: クリミア (RU)',
    share: '共有',
  }
};

let ymapsPromise: Promise<any> | null = null;
let googleMapsPromise: Promise<any> | null = null;

const loadYandexMaps = (apiKey: string): Promise<any> => {
  if (ymapsPromise) return ymapsPromise;

  ymapsPromise = new Promise((resolve, reject) => {
    if ((window as any).ymaps) {
      (window as any).ymaps.ready(() => resolve((window as any).ymaps));
      return;
    }

    const script = document.createElement('script');
    script.src = `https://api-maps.yandex.ru/2.1/?apikey=${apiKey}&lang=ru_RU`;
    script.type = 'text/javascript';
    script.async = true;
    script.onload = () => {
      (window as any).ymaps.ready(() => resolve((window as any).ymaps));
    };
    script.onerror = (err) => {
      ymapsPromise = null; // Allow retry on error
      reject(err);
    };
    document.head.appendChild(script);
  });

  return ymapsPromise;
};

const loadGoogleMaps = (apiKey: string): Promise<any> => {
  if (googleMapsPromise) return googleMapsPromise;

  googleMapsPromise = new Promise((resolve, reject) => {
    if ((window as any).google && (window as any).google.maps) {
      resolve((window as any).google);
      return;
    }

    // Check if script already exists in DOM to prevent multiple inclusions
    const scripts = document.getElementsByTagName('script');
    for (let i = 0; i < scripts.length; i++) {
      if (scripts[i].src && scripts[i].src.includes('maps.googleapis.com/maps/api/js')) {
        // Script already exists, wait for it to load
        const checkGoogle = setInterval(() => {
          if ((window as any).google && (window as any).google.maps) {
            clearInterval(checkGoogle);
            resolve((window as any).google);
          }
        }, 100);
        return;
      }
    }

    if (!apiKey || apiKey.trim() === '' || apiKey.includes('YOUR_')) {
      googleMapsPromise = null;
      reject(new Error("Invalid Google Maps API Key"));
      return;
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve((window as any).google);
    script.onerror = (err) => {
      googleMapsPromise = null;
      reject(err);
    };
    document.head.appendChild(script);
  });

  return googleMapsPromise;
};

const YandexHeroMap = () => {
  const mapRef = React.useRef<HTMLDivElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const apiKey = (import.meta as any).env.VITE_YANDEX_MAPS_API_KEY || '';
    loadYandexMaps(apiKey).then((ymaps) => {
      if (!mapRef.current) return;
      new ymaps.Map(mapRef.current, {
        center: [44.9521, 34.1024], // Crimea center
        zoom: 8,
        controls: []
      }, {
        searchControlProvider: 'yandex#search'
      });
      setIsLoaded(true);
    }).catch(err => console.error("Failed to load Yandex Maps", err));
  }, []);

  return (
    <div className="w-full h-full relative bg-purple-200">
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-purple-100">
          <RefreshCw className="animate-spin opacity-20" />
        </div>
      )}
      <div ref={mapRef} className="w-full h-full" />
    </div>
  );
};

const InteractiveMap = ({ objects, selectedObject, onSelect, routePoints, nearbyPois, onSelectPOI, provider = 'local', isCached, onDownload }: any) => {
  const yandexRef = React.useRef<HTMLDivElement>(null);
  const googleRef = React.useRef<HTMLDivElement>(null);
  const yandexInstance = React.useRef<any>(null);
  const googleInstance = React.useRef<any>(null);
  const yandexMarkers = React.useRef<Map<string, any>>(new Map());
  const googleMarkers = React.useRef<Map<string, any>>(new Map());
  
  const [isYandexLoaded, setIsYandexLoaded] = useState(false);
  const [isGoogleLoaded, setIsGoogleLoaded] = useState(false);
  
  // Default to local if no internet or no keys
  const initialProvider = (!navigator.onLine || provider === 'local') ? 'local' : provider;
  const [activeProvider, setActiveProvider] = useState(initialProvider);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Initialize Yandex Map
  useEffect(() => {
    if (!yandexRef.current || !navigator.onLine || yandexInstance.current) return;
    
    const apiKey = (import.meta as any).env.VITE_YANDEX_MAPS_API_KEY || '';
    loadYandexMaps(apiKey).then((ymaps) => {
      if (!yandexRef.current) return;
      const map = new ymaps.Map(yandexRef.current, {
        center: [44.9521, 34.1024],
        zoom: 8,
        controls: ['zoomControl', 'typeSelector', 'fullscreenControl']
      });
      yandexInstance.current = map;
      setIsYandexLoaded(true);
    });
  }, []);

  // Google Maps support intentionally disabled for this deployment.
  useEffect(() => {
    setIsGoogleLoaded(false);
  }, []);

  // Handle Provider Switch with Transition
  useEffect(() => {
    if (provider !== activeProvider) {
      setIsTransitioning(true);
      setTimeout(() => {
        setActiveProvider(provider);
        setIsTransitioning(false);
      }, 300);
    }
  }, [provider, activeProvider]);

  // Update Yandex Content
  useEffect(() => {
    if (!yandexInstance.current || !isYandexLoaded) return;
    const map = yandexInstance.current;
    map.geoObjects.removeAll();
    yandexMarkers.current.clear();

    objects.forEach((obj: any) => {
      const isSelected = selectedObject?.id === obj.id;
      const placemark = new (window as any).ymaps.Placemark([obj.lat, obj.lng], {
        balloonContent: `<strong>${obj.name}</strong><br/>${obj.type}`,
        hintContent: obj.name
      }, {
        preset: isSelected ? 'islands#redDotIconWithCaption' : 'islands#violetCircleDotIcon',
        iconColor: isSelected ? '#EF4444' : '#A855F7',
        zIndex: isSelected ? 1000 : 0
      });
      placemark.events.add('click', () => onSelect(obj));
      map.geoObjects.add(placemark);
      yandexMarkers.current.set(obj.id, placemark);
    });

    if (routePoints.length > 1) {
      const route = new (window as any).ymaps.Polyline(
        routePoints.map((p: any) => [p.lat, p.lng]),
        {},
        { strokeColor: "#A855F7", strokeWidth: 4, strokeOpacity: 0.6 }
      );
      map.geoObjects.add(route);
    }

    nearbyPois.forEach((poi: any) => {
      const color = poi.type === 'gas' ? '#EF4444' : poi.type === 'restaurant' ? '#F59E0B' : '#3B82F6';
      const placemark = new (window as any).ymaps.Placemark([poi.lat, poi.lng], {
        hintContent: poi.name
      }, {
        iconColor: color,
        preset: 'islands#dotIcon'
      });
      placemark.events.add('click', () => onSelectPOI(poi));
      map.geoObjects.add(placemark);
    });
  }, [objects, routePoints, nearbyPois, isYandexLoaded, selectedObject]);

  // Update Google Content
  useEffect(() => {
    if (!googleInstance.current || !isGoogleLoaded) return;
    const map = googleInstance.current;
    googleMarkers.current.forEach(m => m.setMap(null));
    googleMarkers.current.clear();

    objects.forEach((obj: any) => {
      const isSelected = selectedObject?.id === obj.id;
      const marker = new (window as any).google.maps.Marker({
        position: { lat: obj.lat, lng: obj.lng },
        map: map,
        title: obj.name,
        zIndex: isSelected ? 1000 : 0,
        icon: {
          path: (window as any).google.maps.SymbolPath.CIRCLE,
          scale: isSelected ? 12 : 8,
          fillColor: isSelected ? "#EF4444" : "#A855F7",
          fillOpacity: 1,
          strokeWeight: isSelected ? 4 : 2,
          strokeColor: "#FFFFFF",
        }
      });
      marker.addListener('click', () => onSelect(obj));
      googleMarkers.current.set(obj.id, marker);
    });

    if (routePoints.length > 1) {
      const routePath = new (window as any).google.maps.Polyline({
        path: routePoints.map((p: any) => ({ lat: p.lat, lng: p.lng })),
        geodesic: true,
        strokeColor: "#A855F7",
        strokeOpacity: 0.6,
        strokeWeight: 4,
      });
      routePath.setMap(map);
      googleMarkers.current.set('route', routePath);
    }

    nearbyPois.forEach((poi: any) => {
      const color = poi.type === 'gas' ? '#EF4444' : poi.type === 'restaurant' ? '#F59E0B' : '#3B82F6';
      const marker = new (window as any).google.maps.Marker({
        position: { lat: poi.lat, lng: poi.lng },
        map: map,
        title: poi.name,
        icon: {
          path: (window as any).google.maps.SymbolPath.CIRCLE,
          scale: 5,
          fillColor: color,
          fillOpacity: 1,
          strokeWeight: 1,
          strokeColor: "#FFFFFF",
        }
      });
      marker.addListener('click', () => onSelectPOI(poi));
      googleMarkers.current.set(`poi-${poi.id}`, marker);
    });
  }, [objects, routePoints, nearbyPois, isGoogleLoaded, selectedObject]);

  // Center on selection
  useEffect(() => {
    if (selectedObject) {
      if (activeProvider === 'yandex' && yandexInstance.current) {
        yandexInstance.current.setCenter([selectedObject.lat, selectedObject.lng], 12, {
          checkZoomRange: true,
          duration: 500
        });
      } else if (activeProvider === 'google' && googleInstance.current) {
        googleInstance.current.panTo({ lat: selectedObject.lat, lng: selectedObject.lng });
        googleInstance.current.setZoom(12);
      }
    }
  }, [selectedObject, activeProvider]);

  const isOffline = !navigator.onLine;
  const isLoaded = activeProvider === 'local' ? true : (activeProvider === 'yandex' ? isYandexLoaded : isGoogleLoaded);

  return (
    <div className="w-full h-full relative overflow-hidden">
      {!isLoaded && !isOffline && (
        <div className="absolute inset-0 flex items-center justify-center bg-purple-50 z-[60]">
          <RefreshCw className="animate-spin opacity-20" />
        </div>
      )}
      
      {isOffline && activeProvider !== 'local' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-purple-50 z-[70] p-8 text-center">
          {isCached ? (
            <div className="w-full h-full relative flex flex-col items-center justify-center">
              <img 
                src="https://static-maps.yandex.ru/1.x/?ll=34.1024,44.9521&z=8&l=map&size=450,450" 
                className="absolute inset-0 w-full h-full object-cover opacity-40 grayscale" 
                alt="Offline Map"
                referrerPolicy="no-referrer"
              />
              <div className="relative z-10 flex flex-col items-center">
                <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-4 shadow-lg">
                  <Check size={24} />
                </div>
                <h3 className="font-serif text-lg mb-2">Оффлайн карта Крыма</h3>
                <p className="text-[10px] opacity-60 max-w-[180px]">Данные объектов и маршрутов доступны. Карта работает в ограниченном режиме.</p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <WifiOff size={48} className="text-black/20 mb-4" />
              <h3 className="font-serif text-lg mb-2">Оффлайн режим</h3>
              <p className="text-xs opacity-40 max-w-[200px] mb-6">Карта недоступна без интернета. Скачайте данные заранее для доступа без сети.</p>
              <button 
                onClick={onDownload}
                className="px-6 py-3 bg-purple-600 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-purple-700 transition-colors shadow-lg shadow-purple-200"
              >
                Скачать данные
              </button>
            </div>
          )}
        </div>
      )}

      {/* Local Map Layer */}
      {activeProvider === 'local' && (
        <div className="absolute inset-0 z-10">
          <Suspense fallback={<LazyPanelFallback />}>
            <LocalMap
              objects={objects}
              onSelect={onSelect}
              routePoints={routePoints}
            />
          </Suspense>
        </div>
      )}

      {/* Yandex Map Container */}
      <div 
        ref={yandexRef} 
        className={`absolute inset-0 w-full h-full transition-opacity duration-500 ease-in-out ${activeProvider === 'yandex' ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
      />

      {/* Google Map Container */}
      <div 
        ref={googleRef} 
        className={`absolute inset-0 w-full h-full transition-opacity duration-500 ease-in-out ${activeProvider === 'google' ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
      />
    </div>
  );
};

export default function App() {
  const [uiScale, setUiScale] = useState(() => {
    if (typeof window === 'undefined') return 1;
    const stored = window.localStorage.getItem('navicrimea-ui-scale');
    const parsed = stored ? Number(stored) : 1;
    return Number.isFinite(parsed) ? Math.min(1.35, Math.max(0.8, parsed)) : 1;
  });
  const [view, setView] = useState<'map' | 'list'>('map');
  const [showHero, setShowHero] = useState(true);
  const [objects, setObjects] = useState<GeoObject[]>([]);
  const [selectedObject, setSelectedObject] = useState<GeoObject | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    if (id && objects.length > 0) {
      const obj = objects.find(o => o.id === parseInt(id));
      if (obj) {
        setSelectedObject(obj);
      }
    }
  }, [objects]);

  const handleShare = async (obj: GeoObject) => {
    const shareUrl = `${window.location.origin}${window.location.pathname}?id=${obj.id}`;
    const shareData = {
      title: obj.name,
      text: obj.description,
      url: shareUrl,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(shareUrl);
        alert(lang === 'ru' ? 'Ссылка скопирована в буфер обмена' : 'Link copied to clipboard');
      }
    } catch (err) {
      console.error('Error sharing:', err);
    }
  };

  const handleVisit = (place: any) => {
    const newVisit: VisitedPlace = {
      id: place.id.toString(),
      name: place.name,
      lat: place.lat,
      lng: place.lng,
      category: place.type === 'attraction' ? 'culture' : place.type === 'restaurant' ? 'gastronomy' : 'nature',
      visitDate: Date.now()
    };
    
    setVisitedPlaces(prev => {
      if (prev.find(v => v.id === newVisit.id)) return prev;
      return [...prev, newVisit];
    });

    // Show notification
    setNotifications(prev => [{
      id: Math.random().toString(),
      title: 'Место посещено!',
      message: `Вы посетили "${place.name}". Поделитесь впечатлениями!`,
      type: 'info',
      timestamp: Date.now(),
      read: false
    }, ...prev]);

    // Open impressions manager
    setShowImpressions(true);
  };
  const [selectedPOI, setSelectedPOI] = useState<POI | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [budgetMax, setBudgetMax] = useState<number | null>(null);
  const [searchDestination, setSearchDestination] = useState('');
  const [searchDates, setSearchDates] = useState('');
  const [searchGuests, setSearchGuests] = useState('2 взрослых · 0 детей · 1 номер');
  const [showDestinationPicker, setShowDestinationPicker] = useState(false);
  const [selectedCityForDistricts, setSelectedCityForDistricts] = useState<string | null>(null);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [lang, setLang] = useState<Language>('ru');
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [icalUrl, setIcalUrl] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [routePoints, setRoutePoints] = useState<GeoObject[]>([]);
  const [showCalcPopup, setShowCalcPopup] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isPaid, setIsPaid] = useState(false);
  const [isPaying, setIsPaying] = useState(false);
  const [userNotes, setUserNotes] = useState('');
  const [nearbyPois, setNearbyPois] = useState<POI[]>([]);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [isCaching, setIsCaching] = useState(false);
  const [isCached, setIsCached] = useState(!!localStorage.getItem('offline_objects'));
  const [showCabinet, setShowCabinet] = useState(false);
  const [showAboutUs, setShowAboutUs] = useState(false);
  const [showPartnerMenu, setShowPartnerMenu] = useState(false);
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [assistantResults, setAssistantResults] = useState<{
    query: string;
    objectIds: Array<number | string>;
    externalResults: Array<{
      id: string;
      title: string;
      category: string;
      source: string;
      summary: string;
      url: string;
    }>;
    regionId?: string | null;
    budgetMax?: number | null;
  } | null>(null);
  const [showVerificationMethods, setShowVerificationMethods] = useState(false);
  const [verifyingPhone, setVerifyingPhone] = useState(false);
  const [verifyingEmail, setVerifyingEmail] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [showLandlordForm, setShowLandlordForm] = useState(false);
  const [showProfileSaveSuccess, setShowProfileSaveSuccess] = useState(false);
  const [showRoutePlanner, setShowRoutePlanner] = useState(false);
  const [showImpressions, setShowImpressions] = useState(false);
  const [yandexPhotos, setYandexPhotos] = useState<string[]>([]);
  const [showPhotoGallery, setShowPhotoGallery] = useState(false);
  const [regionCoverById, setRegionCoverById] = useState<Record<string, string>>({});
  const [regionPhotoPoolById, setRegionPhotoPoolById] = useState<Record<string, string[]>>({});
  const [visitNonce] = useState(() => `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`);
  const [preferences, setPreferences] = useState<{
    budget?: string;
    interests: string[];
    duration?: string;
    vibe?: string;
  }>({
    interests: []
  });

  const handleImageFallback = (event: React.SyntheticEvent<HTMLImageElement>, fallbackSrc: string) => {
    const image = event.currentTarget;
    image.onerror = null;
    image.src = fallbackSrc;
  };

  const uniqueImageUrls = (urls: string[]) => {
    const seen = new Set<string>();
    const result: string[] = [];
    for (const raw of urls) {
      if (typeof raw !== 'string' || !raw.trim()) continue;
      const normalized = raw.split('?')[0].split('#')[0];
      if (seen.has(normalized)) continue;
      seen.add(normalized);
      result.push(raw);
    }
    return result;
  };

  const shuffleByVisit = (items: string[], key: string) => {
    const input = [...items];
    for (let i = input.length - 1; i > 0; i--) {
      const mixed = `${visitNonce}:${key}:${i}`;
      let hash = 0;
      for (let j = 0; j < mixed.length; j++) {
        hash = (hash * 31 + mixed.charCodeAt(j)) | 0;
      }
      const next = Math.abs(hash) % (i + 1);
      [input[i], input[next]] = [input[next], input[i]];
    }
    return input;
  };

  useEffect(() => {
    let cancelled = false;

    const loadRegionPhotos = async () => {
      const results = await Promise.all(
        CRIMEA_REGIONS.map(async (region) => {
          try {
            const response = await fetch(`/api/v2/photos/search?query=${encodeURIComponent(region.name)}`);
            const data = await response.json();
            const images = Array.isArray(data?.images) ? data.images : [];
            const fallbackImages = Array.isArray(data?.fallbackImages) ? data.fallbackImages : [];
            const diskFallbackImages = Array.isArray(data?.diskFallbackImages) ? data.diskFallbackImages : [];
            const pool = uniqueImageUrls([...images, ...fallbackImages, ...diskFallbackImages].filter((value) => typeof value === 'string'));
            const shuffledPool = shuffleByVisit(pool.length ? pool : [region.fallbackImage], region.id);
            return [region.id, shuffledPool] as [string, string[]];
          } catch {
            const shuffledFallback = shuffleByVisit([region.fallbackImage], region.id);
            return [region.id, shuffledFallback] as [string, string[]];
          }
        })
      );

      if (cancelled) return;

      const covers: Record<string, string> = {};
      const pools: Record<string, string[]> = {};
      for (const [regionId, pool] of results) {
        pools[regionId] = pool;
        covers[regionId] = pool[0];
      }
      setRegionPhotoPoolById(pools);
      setRegionCoverById(covers);
    };

    void loadRegionPhotos();
    return () => {
      cancelled = true;
    };
  }, [visitNonce]);

  const handleAIAction = (action: any) => {
    if (action.type === 'update_preferences') {
      setPreferences(prev => ({
        ...prev,
        ...action.payload,
        interests: action.payload.interests 
          ? Array.from(new Set([...prev.interests, ...action.payload.interests]))
          : prev.interests
      }));
    } else if (action.type === 'show_region') {
      setSelectedRegion(null);
      setCatalogRegionId(action.payload?.regionId ?? null);
      setViewMode('list');
      setShowHero(false);
    } else if (action.type === 'add_route_point') {
      const point = action.payload.point;
      if (point && !routePoints.find(p => p.id === point.id)) {
        setRoutePoints(prev => [...prev, point]);
        setShowRoutePlanner(true);
      }
    } else if (action.type === 'search_photos') {
        fetch(`/api/v2/photos/search?query=${encodeURIComponent(action.payload.query)}`)
        .then(res => res.json())
        .then(data => {
          const images = Array.isArray(data.images) ? data.images : [];
          const fallbackImages = Array.isArray(data.fallbackImages) ? data.fallbackImages : [];
          const diskFallbackImages = Array.isArray(data.diskFallbackImages) ? data.diskFallbackImages : [];
          const pool = [...images, ...fallbackImages, ...diskFallbackImages];
          if (pool.length) {
            setYandexPhotos(pool);
            setShowPhotoGallery(true);
          }
        });
    } else if (action.type === 'set_view_mode') {
      if (action.payload?.mode === 'grid' || action.payload?.mode === 'list') {
        setViewMode(action.payload.mode);
      }
    } else if (action.type === 'search_objects') {
      setShowHero(false);
      setAssistantOpen(true);
      setSelectedObject(null);
      setSelectedPOI(null);
      setSelectedRegion(null);
      const nextQuery = String(action.payload?.query || '').trim();
      const nextBudget = typeof action.payload?.budgetMax === 'number' ? action.payload.budgetMax : null;
      setSearchQuery(nextQuery);
      setBudgetMax(nextBudget);
      setCatalogRegionId(action.payload?.regionId ?? null);
      setViewMode('list');
      setAssistantResults({
        query: nextQuery,
        objectIds: Array.isArray(action.payload?.objectIds) ? action.payload.objectIds : [],
        externalResults: Array.isArray(action.payload?.externalResults) ? action.payload.externalResults : [],
        regionId: action.payload?.regionId ?? null,
        budgetMax: nextBudget,
      });
      window.requestAnimationFrame(() => {
        assistantSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    } else if (action.type === 'focus_object') {
      const objectId = action.payload?.objectId;
      if (objectId != null) {
        const object = objects.find((item) => String(item.id) === String(objectId));
        if (object) {
          setSelectedObject(object);
        }
      }
    }
  };
  const assistantSectionRef = React.useRef<HTMLDivElement | null>(null);

  const handleGoHome = () => {
    setShowHero(false);
    setSelectedRegion(null);
    setCatalogRegionId(null);
    setSelectedObject(null);
    setSelectedPOI(null);
    setShowRoutePlanner(false);
    setShowImpressions(false);
    setShowCompanionFinder(false);
    setShowPartnerMenu(false);
    setShowSettingsMenu(false);
    setLangMenuOpen(false);
    setViewMode('grid');
    setSearchQuery('');
    setBudgetMax(null);
    setAssistantResults(null);
  };

  const toggleAssistantPanel = () => {
    setShowHero(false);
    setAssistantOpen((prev) => {
      const next = !prev;
      if (next) {
        window.requestAnimationFrame(() => {
          assistantSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
      }
      return next;
    });
  };

  const openRegionsCatalog = () => {
    setShowHero(false);
    setSelectedRegion(null);
    setCatalogRegionId(null);
    setSelectedObject(null);
    setSelectedPOI(null);
    setViewMode('grid');
  };
  const calculateNights = (start: Date | null, end: Date | null) => {
    if (!start || !end) return 0;
    const diffTime = Math.abs(end.getTime() - start.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const formatDate = (date: Date | null) => {
    if (!date) return '';
    return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
  };

  const DatePicker = () => {
    const today = new Date();
    const [currentMonth, setCurrentMonth] = useState(new Date(today.getFullYear(), today.getMonth(), 1));

    const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

    const handleDateClick = (date: Date) => {
      if (!startDate || (startDate && endDate)) {
        setStartDate(date);
        setEndDate(null);
      } else if (date > startDate) {
        setEndDate(date);
        setShowDatePicker(false);
      } else {
        setStartDate(date);
        setEndDate(null);
      }
    };

    const isSelected = (date: Date) => {
      if (startDate && date.toDateString() === startDate.toDateString()) return 'start';
      if (endDate && date.toDateString() === endDate.toDateString()) return 'end';
      if (startDate && endDate && date > startDate && date < endDate) return 'range';
      return null;
    };

    const renderCalendar = () => {
      const year = currentMonth.getFullYear();
      const month = currentMonth.getMonth();
      const totalDays = daysInMonth(year, month);
      const startDay = (firstDayOfMonth(year, month) + 6) % 7; // Adjust to Monday start
      const days = [];

      for (let i = 0; i < startDay; i++) {
        days.push(<div key={`empty-${i}`} className="h-10 w-10" />);
      }

      for (let d = 1; d <= totalDays; d++) {
        const date = new Date(year, month, d);
        const status = isSelected(date);
        const isPast = date < new Date(today.getFullYear(), today.getMonth(), today.getDate());

        days.push(
          <button
            key={d}
            disabled={isPast}
            onClick={() => handleDateClick(date)}
            className={`h-10 w-10 rounded-full flex items-center justify-center text-[10px] font-bold transition-all relative
              ${isPast ? 'opacity-20 cursor-not-allowed' : 'hover:bg-emerald-50'}
              ${status === 'start' ? 'bg-emerald-600 text-white z-10' : ''}
              ${status === 'end' ? 'bg-emerald-600/30 text-emerald-900 z-10' : ''}
              ${status === 'range' ? 'bg-emerald-50 text-emerald-900 rounded-none' : ''}
            `}
          >
            {d}
            {status === 'range' && (
              <div className="absolute inset-0 bg-emerald-50 -z-10" />
            )}
          </button>
        );
      }

      return days;
    };

    const modal = (
      <div className="fixed inset-0 z-[210] grid place-items-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setShowDatePicker(false)}
          className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.96, x: -80 }}
          animate={{ opacity: 1, scale: 1, x: 0 }}
          exit={{ opacity: 0, scale: 0.96, x: -80 }}
          className="relative bg-white rounded-3xl shadow-2xl border border-black/10 p-6 w-full max-w-md max-h-[88vh] overflow-y-auto custom-scrollbar"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-4">
            <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))} className="p-2 hover:bg-black/5 rounded-xl transition-colors">
              <ChevronLeft size={16} />
            </button>
            <div className="text-[10px] font-bold uppercase tracking-widest">
              {currentMonth.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' })}
            </div>
            <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))} className="p-2 hover:bg-black/5 rounded-xl transition-colors">
              <ChevronRight size={16} />
            </button>
          </div>
          <div className="grid grid-cols-7 gap-1 mb-2">
            {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map(day => (
              <div key={day} className="h-10 w-10 flex items-center justify-center text-[8px] font-bold opacity-30 uppercase tracking-widest">
                {day}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {renderCalendar()}
          </div>
          {startDate && endDate && (
            <div className="mt-6 pt-6 border-t border-black/5">
              <div className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mb-1">
                {calculateNights(startDate, endDate)} {calculateNights(startDate, endDate) === 1 ? 'ночь' : 'ночи'}
              </div>
              <div className="text-[8px] opacity-40 uppercase tracking-widest font-bold">
                с {formatDate(startDate)} по {formatDate(endDate)}
              </div>
            </div>
          )}
        </motion.div>
      </div>
    );
    return typeof document !== 'undefined' ? createPortal(modal, document.body) : modal;
  };

  const DestinationPicker = () => {
    const filteredCities = CRIMEA_CITIES.filter(city => 
      city.name.toLowerCase().includes(searchDestination.toLowerCase()) ||
      city.districts.some(d => d.toLowerCase().includes(searchDestination.toLowerCase()))
    );

    const modal = (
      <div className="fixed inset-0 z-[210] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setShowDestinationPicker(false)}
          className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.96, x: -80 }}
          animate={{ opacity: 1, scale: 1, x: 0 }}
          exit={{ opacity: 0, scale: 0.96, x: -80 }}
          className="relative bg-white rounded-3xl shadow-2xl border border-black/10 overflow-hidden w-full max-w-md max-h-[88vh] py-2"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="px-4 py-2 text-[8px] font-bold uppercase tracking-widest opacity-30 border-b border-black/5">
            {selectedCityForDistricts ? 'Выберите район' : 'Популярные направления'}
          </div>
          
          <div className="max-h-[72vh] overflow-y-auto custom-scrollbar">
            {selectedCityForDistricts ? (
              <>
                <button 
                  onClick={() => setSelectedCityForDistricts(null)}
                  className="w-full text-left px-4 py-3 text-[10px] font-bold uppercase tracking-widest hover:bg-black/5 text-accent-purple flex items-center gap-2"
                >
                  <ChevronLeft size={12} /> Назад к городам
                </button>
                {CRIMEA_CITIES.find(c => c.id === selectedCityForDistricts)?.districts.map(district => (
                  <button
                    key={district}
                    onClick={() => {
                      const cityName = CRIMEA_CITIES.find(c => c.id === selectedCityForDistricts)?.name;
                      setSearchDestination(`${cityName}, ${district}`);
                      setShowDestinationPicker(false);
                      setSelectedCityForDistricts(null);
                    }}
                    className="w-full text-left px-4 py-3 text-[10px] font-bold uppercase tracking-widest hover:bg-black/5 text-black/60 flex items-center gap-3"
                  >
                    <MapPin size={14} className="opacity-30" />
                    {district}
                  </button>
                ))}
              </>
            ) : (
              filteredCities.map(city => (
                <button
                  key={city.id}
                  onClick={() => setSelectedCityForDistricts(city.id)}
                  className="w-full text-left px-4 py-3 text-[10px] font-bold uppercase tracking-widest hover:bg-black/5 text-black/60 flex items-center justify-between group"
                >
                  <div className="flex items-center gap-3">
                    <Globe size={14} className="opacity-30" />
                    {city.name}
                  </div>
                  <ChevronRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              ))
            )}
            {filteredCities.length === 0 && (
              <div className="px-4 py-8 text-center text-[10px] font-bold uppercase tracking-widest opacity-30">
                Ничего не найдено
              </div>
            )}
          </div>
        </motion.div>
      </div>
    );
    return typeof document !== 'undefined' ? createPortal(modal, document.body) : modal;
  };

  const [isVip, setIsVip] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [visitedPlaces, setVisitedPlaces] = useState<VisitedPlace[]>([
    { id: 'v1', name: 'Ласточкино гнездо', lat: 44.43, lng: 34.12, category: 'culture', visitDate: Date.now() - 86400000 * 2 },
    { id: 'v2', name: 'Велопрогулка по набережной', lat: 44.49, lng: 34.16, category: 'cycling', visitDate: Date.now() - 86400000 * 5 },
    { id: 'v3', name: 'Прокат скутеров', lat: 44.50, lng: 34.17, category: 'scooter', visitDate: Date.now() - 86400000 * 1 },
  ]);
  const [impressions, setImpressions] = useState<Impression[]>([
    { 
      id: 'i1', 
      placeId: 'v1', 
      placeName: 'Ласточкино гнездо', 
      category: 'culture', 
      rating: 5, 
      comment: 'Потрясающий вид на море! Обязательно к посещению.', 
      photos: ['/images/hero-palace.svg'],
      timestamp: Date.now() - 86400000 * 2,
      yandexSynced: true
    }
  ]);
  const [showCompanionFinder, setShowCompanionFinder] = useState(false);
  const [showPresentation, setShowPresentation] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [catalogRegionId, setCatalogRegionId] = useState<string | null>(null);
  const [addTransfer, setAddTransfer] = useState(false);
  const [landlordAd, setLandlordAd] = useState({
    category: 'housing', // housing, transport, services, legal, social
    // Section 1: Housing
    subCategory: 'apartment',
    objectName: '',
    exactAddress: '',
    lat: 44.95,
    lng: 34.11,
    floor: '',
    area: '',
    rooms: 1,
    sleepingPlaces: { double: 1, single: 0, sofa: 0 },
    maxGuests: 2,
    childrenAllowed: true,
    petsAllowed: false,
    amenities: [] as string[],
    price: '',
    minDuration: 1,
    bookingType: 'instant', // instant or request
    cancellationPolicy: 'flexible',
    checkInTime: '14:00',
    checkOutTime: '12:00',
    photos: [] as string[],
    videoUrl: '',
    verificationPhoto: '',
    // Section 2: Transport
    transportType: 'sedan',
    carMakeModel: '',
    carYear: '',
    carCondition: '',
    carCapacity: { passengers: 4, luggage: 2 },
    basePoint: '',
    serviceArea: 'all',
    fixedRoutes: [] as { from: string, to: string, price: string }[],
    pricePerKm: '',
    extraServices: [] as string[],
    // Section 3: Services
    serviceCategory: 'excursion',
    serviceName: '',
    duration: '',
    startPoint: { lat: 44.95, lng: 34.11 },
    securityDeposit: '',
    deliveryAvailable: false,
    technicalCondition: '',
    // Section 4: Legal
    partnerStatus: 'individual',
    inn: '',
    bankAccount: '',
    passportScan: '',
    objectClassification: '',
    ownershipRegistration: '',
    // Section 5: Social
    routeFrom: '',
    routeTo: '',
    dateTime: '',
    purpose: 'split_costs',
    fellowTravelerRequirements: '',
  });
  useEffect(() => {
    document.documentElement.style.setProperty('--ui-scale', String(uiScale));
    window.localStorage.setItem('navicrimea-ui-scale', String(uiScale));
  }, [uiScale]);

  useEffect(() => {
    const handleWheel = (event: WheelEvent) => {
      if (!event.ctrlKey) return;
      event.preventDefault();
      setUiScale((current) => {
        const next = current + (event.deltaY < 0 ? 0.05 : -0.05);
        return Math.min(1.35, Math.max(0.8, Number(next.toFixed(2))));
      });
    };

    window.addEventListener('wheel', handleWheel, { passive: false });
    return () => window.removeEventListener('wheel', handleWheel);
  }, []);
  const [consultantResponse, setConsultantResponse] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [showOutbox, setShowOutbox] = useState(false);
  const [userRole, setUserRole] = useState<'tourist' | 'hotelier' | 'ministry' | 'inspector'>('tourist');
  const [activeCabinetTab, setActiveCabinetTab] = useState<'listings' | 'ad' | 'bookings' | 'messages' | 'reviews' | 'invoices' | 'grants' | 'standards' | 'monitoring' | 'fleet' | 'settings'>('listings');
  const [mapProvider] = useState<'yandex'>('yandex');
  const [outbox, setOutbox] = useState<OutboxItem[]>(() => {
    const saved = localStorage.getItem('navicrimea_outbox');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('navicrimea_outbox', JSON.stringify(outbox));
  }, [outbox]);

  const processOutbox = async () => {
    if (isOffline || outbox.length === 0) return;

    const pending = outbox.filter(item => item.status === 'pending');
    if (pending.length === 0) return;

    setOutbox(prev => prev.map(item => 
      item.status === 'pending' ? { ...item, status: 'syncing' } : item
    ));

    for (const item of pending) {
      try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        setOutbox(prev => prev.filter(i => i.id !== item.id));
      } catch (err) {
        setOutbox(prev => prev.map(i => 
          i.id === item.id ? { ...i, status: 'failed' } : i
        ));
      }
    }
  };

  useEffect(() => {
    if (!isOffline) {
      processOutbox();
    }
  }, [isOffline]);

  const addToOutbox = (type: OutboxItem['type'], data: any) => {
    const newItem: OutboxItem = {
      id: Math.random().toString(36).substr(2, 9),
      type,
      data,
      timestamp: Date.now(),
      status: 'pending'
    };
    setOutbox(prev => [...prev, newItem]);
    
    if (!isOffline) {
      processOutbox();
    }
  };

  const mockBookings = [
    {
      id: 1,
      guest: 'Иван Петров',
      object: 'Уютная квартира в центре',
      dates: '12.03 - 15.03',
      status: 'confirmed',
      price: 12500,
      photo: '/images/hero-coast-1.svg'
    },
    {
      id: 2,
      guest: 'Анна Сидорова',
      object: 'Дом у моря',
      dates: '20.03 - 25.03',
      status: 'pending',
      price: 45000,
      photo: '/images/hero-coast-2.svg'
    }
  ];

  const mockMessages = [
    {
      id: 1,
      user: 'Иван Петров',
      lastMessage: 'Здравствуйте! Можно ли заехать пораньше?',
      time: '10:30',
      unread: true,
      photo: '/images/hero-cliff-1.svg'
    },
    {
      id: 2,
      user: 'Мария',
      lastMessage: 'Спасибо за отличный отдых!',
      time: 'Вчера',
      unread: false,
      photo: '/images/hero-cliff-2.svg'
    }
  ];

  const mockReviews = [
    {
      id: 1,
      user: 'Мария',
      rating: 5,
      date: '24.02.2026',
      text: 'Все прошло отлично! Техника в идеальном состоянии, очень вежливый владелец. Рекомендую!',
      helpful: 12
    },
    {
      id: 2,
      user: 'Александр',
      rating: 4,
      date: '20.02.2026',
      text: 'Хороший джип, проехали по всем сложным маршрутам. Снял одну звезду за небольшую задержку при передаче ключей.',
      helpful: 5
    },
    {
      id: 3,
      user: 'Елена',
      rating: 5,
      date: '15.02.2026',
      text: 'Брали оборудование для дайвинга. Все чистое, исправное. Спасибо за подробный инструктаж!',
      helpful: 8
    }
  ];

  const formProgress = useMemo(() => {
    const fields = [
      landlordAd.objectName,
      landlordAd.price,
      landlordAd.amenities.length > 0,
    ];
    const filled = fields.filter(Boolean).length;
    return Math.round((filled / fields.length) * 100);
  }, [landlordAd]);

  const [selectedMessageId, setSelectedMessageId] = useState<number | null>(null);
  const [replyText, setReplyText] = useState('');

  const handleSendReply = (messageId: number) => {
    if (!replyText.trim()) return;
    
    const messageData = {
      messageId,
      text: replyText,
      sender: userProfile.fullName || 'Landlord'
    };

    if (isOffline) {
      addToOutbox('message', messageData);
      alert(t.offlineMessage);
    } else {
      // Normal send logic
      console.log('Sending message:', messageData);
    }
    
    setReplyText('');
    setSelectedMessageId(null);
  };

  const handleSaveAd = () => {
    if (isOffline) {
      addToOutbox('ad', landlordAd);
      alert(t.offlineMessage);
    } else {
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    }
  };

  const [userProfile, setUserProfile] = useState<UserProfile>({
    id: 'user_123',
    fullName: '',
    birthDate: '',
    address: '',
    phone: '',
    phoneVerified: false,
    email: 'alex@crimea.ru',
    emailVerified: false,
    photo: '/images/hero-sea-night.svg',
    rating: 4.9,
    completedOrders: 12,
    verifications: {
      gosuslugi: false,
      yandex: false,
      google: false,
      vk: false,
    }
  });

  const handleMockVerify = (method: keyof UserProfile['verifications']) => {
    // Mock data based on method
    const mockData = {
      fullName: 'Иванов Иван Иванович',
      birthDate: '15.05.1985',
      address: 'г. Симферополь, ул. Пушкина, д. 10',
      phone: '+7 (978) 000-00-00',
      phoneVerified: true,
      email: 'ivanov@crimea.ru',
      emailVerified: true,
    };

    setUserProfile(prev => ({
      ...prev,
      ...mockData,
      verifications: {
        ...prev.verifications,
        [method]: true
      }
    }));
    setShowVerificationMethods(false);
  };

  const handleConfirmCode = (type: 'phone' | 'email') => {
    if (verificationCode === '1234') {
      setUserProfile(prev => ({
        ...prev,
        [type === 'phone' ? 'phoneVerified' : 'emailVerified']: true
      }));
      setVerifyingPhone(false);
      setVerifyingEmail(false);
      setVerificationCode('');
    } else {
      alert('Неверный код (попробуйте 1234)');
    }
  };

  const handleConsultantAsk = async () => {
    if (isOffline) {
      const transcript = prompt(t.typeMessage);
      if (transcript) {
        addToOutbox('support', { text: transcript });
        alert(t.offlineMessage);
      }
      return;
    }
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Voice recognition is not supported in this browser.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = lang === 'ru' ? 'ru-RU' : 'en-US';
    
    recognition.onstart = () => setIsListening(true);
    recognition.onresult = async (event: any) => {
      const transcript = event.results[0][0].transcript;
      setIsListening(false);
      
      try {
        const response = await fetch('/api/v1/ai/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: transcript,
            context: {
              mode: 'landlord_consultant',
              landlordAd,
              instruction: 'Вы консультант для арендодателей в Крыму. Помогайте составить объявление и описывать окрестности. Отвечайте кратко и по делу на русском языке.'
            }
          })
        });
        const data = await response.json();
        setConsultantResponse(data.text || '');
      } catch (err) {
        console.error(err);
        setConsultantResponse('Извините, произошла ошибка при обращении к консультанту.');
      }
    };
    recognition.onerror = () => setIsListening(false);
    recognition.start();
  };

  const handleFieldVoiceInput = (field: 'description' | 'nearby') => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.lang = lang === 'ru' ? 'ru-RU' : 'en-US';
    
    recognition.onstart = () => setIsListening(true);
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setLandlordAd(prev => ({ ...prev, [field]: (prev[field] ? prev[field] + ' ' : '') + transcript }));
      setIsListening(false);
    };
    recognition.onerror = () => setIsListening(false);
    recognition.start();
  };

  const t = translations[lang];

  const calculateComplexRoute = () => {
    if (routePoints.length < 2) return { distance: 0, time: 0, cost: 0, sleepNights: 0, sortedPoints: [] };
    
    // Simple Nearest Neighbor heuristic for "optimal" route
    const unvisited = [...routePoints];
    const sortedPoints = [unvisited.shift()!];
    
    while (unvisited.length > 0) {
      const last = sortedPoints[sortedPoints.length - 1];
      let closestIdx = 0;
      let minDist = Infinity;
      
      for (let i = 0; i < unvisited.length; i++) {
        const d = Math.sqrt(Math.pow(unvisited[i].lat - last.lat, 2) + Math.pow(unvisited[i].lng - last.lng, 2));
        if (d < minDist) {
          minDist = d;
          closestIdx = i;
        }
      }
      sortedPoints.push(unvisited.splice(closestIdx, 1)[0]);
    }

    let totalDist = 0;
    let totalCost = 0;
    let sleepNights = 0;

    for (let i = 0; i < sortedPoints.length - 1; i++) {
      const p1 = sortedPoints[i];
      const p2 = sortedPoints[i+1];
      const d = Math.sqrt(Math.pow(p2.lat - p1.lat, 2) + Math.pow(p2.lng - p1.lng, 2));
      const distKm = d * 111;
      totalDist += distKm;

      if (distKm > 150) { // If distance between points > 150km, assume a rest stop
        sleepNights++;
      }
      
      totalCost += (p1 as any).price_per_night || 0;
    }
    totalCost += (sortedPoints[sortedPoints.length - 1] as any).price_per_night || 0;
    totalCost += totalDist * 15; // 15 rub per km for fuel/wear

    const travelHours = totalDist / 60; // 60 km/h average
    const totalHours = travelHours + (sleepNights * 8);

    return { 
      distance: totalDist.toFixed(1), 
      time: Math.round(totalHours * 60), 
      cost: Math.round(totalCost),
      sleepNights,
      sortedPoints
    };
  };

  const generatePDF = async () => {
    if (!isPaid) return;
    const JsPDF = await loadJsPdf();
    const doc = new JsPDF();
    const stats = calculateComplexRoute();
    
    doc.setFontSize(22);
    doc.text("Навигатор Крым - Маршрутный лист", 20, 20);
    
    doc.setFontSize(14);
    doc.text(`Дата: ${new Date().toLocaleDateString()}`, 20, 30);
    doc.text(`Общая стоимость: ${stats.cost} руб.`, 20, 40);
    doc.text(`Общее время: ${Math.floor(stats.time / 60)} ч. ${stats.time % 60} мин.`, 20, 50);
    doc.text(`Количество ночевок: ${stats.sleepNights}`, 20, 60);
    
    if (userNotes) {
      doc.setFontSize(10);
      doc.text("Заметки:", 20, 70);
      doc.setFontSize(9);
      const splitNotes = doc.splitTextToSize(userNotes, 170);
      doc.text(splitNotes, 20, 75);
    }
    
    doc.setFontSize(12);
    doc.setTextColor(0, 128, 0);
    doc.text("СТАТУС: ОПЛАЧЕНО ЧЕРЕЗ БЕЗОПАСНУЮ СДЕЛКУ", 20, 90);
    doc.setTextColor(0, 0, 0);
    doc.text(`Эскроу-агент: ООО "Навигатор Крым" (СЭЗ Крым)`, 20, 95);
    doc.text("Средства удерживаются на номинальном счете до подтверждения.", 20, 100);

    doc.setFontSize(14);
    doc.text("Точки маршрута:", 20, 115);
    routePoints.forEach((p, i) => {
      doc.text(`${i + 1}. ${p.name} (${p.type})`, 30, 125 + (i * 10));
    });
    
    doc.save("navicrimea-route.pdf");
  };

  const handleConfirmRoute = () => {
    setShowCalcPopup(true);
    setTimeout(() => setShowCalcPopup(false), 5000);
    setShowConfirmModal(true);
  };

  const handlePayment = async () => {
    setIsPaying(true);
    // Simulate payment gateway delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsPaid(true);
    setIsPaying(false);
  };

  const calculateRouteStats = () => {
    // Keep for backward compatibility if needed, but we use calculateComplexRoute now
    return calculateComplexRoute();
  };

  const toggleRoutePoint = (obj: GeoObject) => {
    if (routePoints.find(p => p.id === obj.id)) {
      setRoutePoints(routePoints.filter(p => p.id !== obj.id));
    } else {
      setRoutePoints([...routePoints, obj]);
    }
  };

  const heroImages = [
    { url: "/images/hero-coast-1.svg", title: "Coast" },
    { url: "/images/hero-coast-2.svg", title: "Coast 2" },
    { url: "/images/hero-cliff-1.svg", title: "Cliff" },
    { url: "/images/hero-cliff-2.svg", title: "Cliff 2" },
    { url: "/images/hero-palace.svg", title: "Palace" },
    { url: "", title: "Map" }, // Placeholder for Yandex Map
  ];

  const handleVoiceSearch = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Voice recognition is not supported in this browser.');
      return;
    }

    // Stop if already listening
    if (isListening) return;

    const recognition = new SpeechRecognition();
    
    const langMap: Record<Language, string> = {
      ru: 'ru-RU',
      en: 'en-US',
      zh: 'zh-CN',
      hi: 'hi-IN',
      es: 'es-ES',
      fr: 'fr-FR',
      ar: 'ar-SA',
      bn: 'bn-BD',
      pt: 'pt-PT',
      ja: 'ja-JP'
    };
    
    recognition.lang = langMap[lang] || 'ru-RU';
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript.toLowerCase();
      
      // Voice Commands for View Switching
      if (transcript.includes('покажи карту') || transcript.includes('открой карту') || transcript.includes('show map') || transcript.includes('open map')) {
        setView('map');
        setIsListening(false);
        recognition.stop();
        return;
      }
      if (transcript.includes('покажи список') || transcript.includes('открой список') || transcript.includes('show list') || transcript.includes('open list')) {
        setView('list');
        setIsListening(false);
        recognition.stop();
        return;
      }

      setSearchQuery(transcript);
      if (event.results[0].isFinal) {
        setIsListening(false);
      }
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    try {
      recognition.start();
    } catch (e) {
      console.error('Speech recognition start failed:', e);
      setIsListening(false);
    }
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

  useEffect(() => {
    const pointsToSearch = [...routePoints];
    if (selectedObject && !pointsToSearch.some(p => p.id === selectedObject.id)) {
      pointsToSearch.push(selectedObject);
    }

    if (pointsToSearch.length === 0) {
      setNearbyPois([]);
      return;
    }

    // Simple 5km radius check from any point
    const filtered = MOCK_POIS.filter(poi => {
      return pointsToSearch.some(p => {
        const d = Math.sqrt(Math.pow(poi.lat - p.lat, 2) + Math.pow(poi.lng - p.lng, 2));
        return d < 0.045; // ~5km
      });
    });
    setNearbyPois(filtered);
  }, [routePoints, selectedObject]);

  useEffect(() => {
    if (selectedObject) {
      setIcalUrl(selectedObject.ical_sync_url || '');
    }
  }, [selectedObject]);

  const handleSync = async () => {
    if (!selectedObject) return;
    setIsSyncing(true);
    try {
      const res = await fetch(`/api/v1/objects/${selectedObject.id}/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ical_sync_url: icalUrl }),
      });
      if (res.ok) {
        // Update local state
        const updatedObjects = objects.map(obj => 
          obj.id === selectedObject.id ? { ...obj, ical_sync_url: icalUrl } : obj
        );
        setObjects(updatedObjects);
        setSelectedObject({ ...selectedObject, ical_sync_url: icalUrl });
        alert('Calendar synced successfully!');
      }
    } catch (err) {
      console.error(err);
      alert('Failed to sync calendar.');
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const downloadForOffline = async () => {
    setIsCaching(true);
    // Simulate downloading/caching process
    await new Promise(resolve => setTimeout(resolve, 2000));
    localStorage.setItem('offline_objects', JSON.stringify(objects));
    localStorage.setItem('offline_pois', JSON.stringify(MOCK_POIS));
    setIsCached(true);
    setIsCaching(false);
  };

  const fetchObjects = async () => {
    if (!navigator.onLine) {
      const cached = localStorage.getItem('offline_objects');
      if (cached) {
        setObjects(JSON.parse(cached));
        setLoading(false);
        return;
      }
    }

    setLoading(true);
    try {
      const res = await fetch('/api/v1/objects/search');
      const data = await res.json();
      setObjects(data);
    } catch (err) {
      console.error(err);
      // Fallback to cache if request fails
      const cached = localStorage.getItem('offline_objects');
      if (cached) setObjects(JSON.parse(cached));
    } finally {
      setLoading(false);
    }
  };

  const filteredObjects = useMemo(() => {
    const activeRegionId = selectedRegion ?? catalogRegionId;
    return objects.filter(obj => {
      const normalizedQuery = searchQuery.toLowerCase().trim();
      const haystack = `${obj.name} ${obj.type} ${obj.description} ${obj.region}`.toLowerCase();
      const matchesSearch = !normalizedQuery || haystack.includes(normalizedQuery);
      const matchesRegion = activeRegionId ? obj.region === activeRegionId : true;
      const matchesBudget = budgetMax ? Number(obj.price_per_night) <= budgetMax : true;
      return matchesSearch && matchesRegion && matchesBudget;
    });
  }, [objects, searchQuery, selectedRegion, catalogRegionId, budgetMax]);

  const assistantMatchedObjects = useMemo(() => {
    if (!assistantResults?.objectIds?.length) return [];
    const ids = new Set(assistantResults.objectIds.map((id) => String(id)));
    return objects.filter((obj) => ids.has(String(obj.id)));
  }, [assistantResults, objects]);

  const regionGallery = useMemo(() => {
    if (!selectedRegion) return [];
    
    const regionName = CRIMEA_REGIONS.find(r => r.id === selectedRegion)?.name || '';
    const photoPool = regionPhotoPoolById[selectedRegion] || [];
    const regionObjects = filteredObjects.slice(0, 9);
    
    const selectedRegionMeta = CRIMEA_REGIONS.find((r) => r.id === selectedRegion);
    const fallbackImage = selectedRegionMeta?.fallbackImage || LOCAL_FALLBACK_IMAGES[0];
    // Generate 18 photos: mix of remote Yandex photos and local fallbacks
    const gallery = [];
    
    const getPoolImage = (index: number) => {
      if (photoPool.length === 0) return fallbackImage;
      return photoPool[index % photoPool.length] || fallbackImage;
    };

    // Add location views
    for (let i = 1; i <= 9; i++) {
      gallery.push({
        id: `view-${selectedRegion}-${i}`,
        url: getPoolImage(i - 1),
        title: `${regionName} - Вид ${i}`,
        type: 'view',
        fallback: fallbackImage,
      });
    }
    
    // Add properties
    regionObjects.forEach((obj, i) => {
      gallery.push({
        id: `prop-${obj.id}`,
        url: obj.image_url,
        title: obj.name,
        type: 'property',
        fallback: fallbackImage,
        originalObj: obj
      });
    });
    
    // Fill up to 18 if needed
    let fillCounter = 10;
    while (gallery.length < 18) {
      gallery.push({
        id: `view-fill-${fillCounter}`,
        url: getPoolImage(fillCounter),
        title: `${regionName} - Пейзаж`,
        type: 'view',
        fallback: fallbackImage,
      });
      fillCounter++;
    }
    
    return gallery.slice(0, 18);
  }, [selectedRegion, filteredObjects, regionPhotoPoolById]);

  // Simple coordinate to SVG percentage conversion
  const getPos = (lat: number, lng: number) => {
    const x = ((lng - bounds.minLng) / (bounds.maxLng - bounds.minLng)) * 100;
    const y = 100 - ((lat - bounds.minLat) / (bounds.maxLat - bounds.minLat)) * 100;
    return { x, y };
  };

  return (
    <div className="min-h-screen bg-peach-bg text-[#1A1A1A] font-sans">
      <AnimatePresence>
        {showAboutUs && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-md z-[100] flex items-center justify-center p-4 md:p-8"
            onClick={() => setShowAboutUs(false)}
          >
            <motion.div 
              initial={{ opacity: 0, scale: 0.96, x: -80 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.96, x: -80 }}
              className="bg-white w-full max-w-4xl max-h-[90vh] rounded-[40px] shadow-2xl overflow-hidden flex flex-col"
              onClick={e => e.stopPropagation()}
            >
              <div className="p-8 md:p-12 border-b border-black/5 flex items-center justify-between bg-gradient-to-br from-accent-purple/5 to-pink-500/5">
                <div>
                  <h2 className="text-3xl md:text-4xl font-serif mb-2">{t.manifestoTitle}</h2>
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-accent-purple opacity-60">{t.manifestoSubtitle}</p>
                </div>
                <button onClick={() => setShowAboutUs(false)} className="p-3 hover:bg-black/5 rounded-full transition-colors">
                  <X size={24} />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-8 md:p-12 space-y-8 custom-scrollbar">
                <div className="prose prose-sm max-w-none">
                  {t.manifestoText.split('\n\n').map((paragraph, i) => (
                    <p key={i} className="text-sm md:text-base leading-relaxed text-black/70 whitespace-pre-line">
                      {paragraph}
                    </p>
                  ))}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-8 border-t border-black/5">
                  <div className="p-6 bg-accent-purple/5 rounded-3xl">
                    <div className="w-10 h-10 bg-accent-purple text-white rounded-xl flex items-center justify-center mb-4 shadow-lg shadow-accent-purple/20">
                      <Zap size={20} />
                    </div>
                    <h4 className="text-sm font-bold uppercase tracking-widest mb-2">Миссия</h4>
                    <p className="text-[10px] leading-relaxed opacity-60">Цифровая Операционная Система Региона для трансформации Крыма.</p>
                  </div>
                  <div className="p-6 bg-pink-500/5 rounded-3xl">
                    <div className="w-10 h-10 bg-pink-500 text-white rounded-xl flex items-center justify-center mb-4 shadow-lg shadow-pink-500/20">
                      <ShieldCheck size={20} />
                    </div>
                    <h4 className="text-sm font-bold uppercase tracking-widest mb-2">Доверие</h4>
                    <p className="text-[10px] leading-relaxed opacity-60">Прозрачность для государства и гарантии для бизнеса.</p>
                  </div>
                  <div className="p-6 bg-blue-500/5 rounded-3xl">
                    <div className="w-10 h-10 bg-blue-500 text-white rounded-xl flex items-center justify-center mb-4 shadow-lg shadow-blue-500/20">
                      <Trophy size={20} />
                    </div>
                    <h4 className="text-sm font-bold uppercase tracking-widest mb-2">Результат</h4>
                    <p className="text-[10px] leading-relaxed opacity-60">100% контроль турпотока и рост экономики региона.</p>
                  </div>
                </div>
              </div>
              
              <div className="p-8 bg-black text-white flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="text-center md:text-left">
                  <div className="text-xl font-serif italic mb-1">Навигатор Крым — это точка сборки.</div>
                  <div className="text-[8px] font-bold uppercase tracking-widest opacity-40">Мы строим будущее Крыма сегодня.</div>
                </div>
                <button 
                  onClick={() => setShowAboutUs(false)}
                  className="px-10 py-4 bg-white text-black rounded-full font-bold uppercase tracking-widest text-[10px] hover:scale-105 transition-all"
                >
                  Присоединиться к экосистеме
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showCabinet && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCabinet(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.96, opacity: 0, x: -80 }}
              animate={{ scale: 1, opacity: 1, x: 0 }}
              exit={{ scale: 0.96, opacity: 0, x: -80 }}
              className="relative bg-white rounded-[40px] shadow-2xl border border-black/5 w-full max-w-5xl h-[min(88vh,980px)] overflow-hidden flex flex-col md:flex-row"
            >
              {/* Sidebar Profile Info */}
              <div className="w-full md:w-1/3 bg-peach-bg p-8 flex flex-col items-center border-b md:border-b-0 md:border-r border-accent-purple/10 overflow-y-auto">
                <div className="relative mb-6 group">
                  <img 
                    src={userProfile.photo} 
                    alt={userProfile.name} 
                    className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-lg"
                    referrerPolicy="no-referrer"
                  />
                  <button className="absolute bottom-0 right-0 p-2 bg-white rounded-full shadow-md hover:bg-accent-purple/10 transition-colors border border-accent-purple/20">
                    <Camera size={16} className="text-accent-purple" />
                  </button>
                </div>
                <h3 className="text-xl font-serif mb-1 text-center">{userProfile.fullName || 'Новый пользователь'}</h3>
                <div className="flex items-center gap-1.5 mb-2">
                  {Object.values(userProfile.verifications).some(v => v) || userProfile.phoneVerified || userProfile.emailVerified ? (
                    <div className="flex items-center gap-1 px-2 py-0.5 bg-emerald-100 text-emerald-600 rounded-full text-[8px] font-bold uppercase tracking-widest">
                      <ShieldCheck size={10} />
                      {t.verified}
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 px-2 py-0.5 bg-amber-100 text-amber-600 rounded-full text-[8px] font-bold uppercase tracking-widest">
                      <ShieldCheck size={10} className="opacity-40" />
                      {t.notVerified}
                    </div>
                  )}
                </div>
                <p className="text-xs opacity-40 mb-6">{userProfile.email}</p>
                
                <div className="grid grid-cols-2 gap-4 w-full">
                  <div className="bg-white p-3 rounded-2xl border border-accent-purple/10 flex flex-col items-center">
                    <div className="flex items-center gap-1 text-amber-500 mb-1">
                      <Star size={14} fill="currentColor" />
                      <span className="text-sm font-bold">{userProfile.rating}</span>
                    </div>
                    <span className="text-[8px] uppercase font-bold opacity-30 tracking-widest">{t.rating}</span>
                  </div>
                  <div className="bg-white p-3 rounded-2xl border border-accent-purple/10 flex flex-col items-center">
                    <span className="text-sm font-bold mb-1">{userProfile.completedOrders}</span>
                    <span className="text-[8px] uppercase font-bold opacity-30 tracking-widest text-center leading-tight">{t.completedOrders}</span>
                  </div>
                </div>

                <div className="mt-8 w-full space-y-2">
                  <div className="p-4 bg-white rounded-2xl border border-accent-purple/10 mb-4">
                    <label className="text-[8px] font-bold uppercase tracking-widest opacity-30 block mb-2">Системная роль (РИС)</label>
                    <div className="grid grid-cols-2 gap-2">
                      {(['tourist', 'hotelier', 'ministry', 'inspector'] as const).map(role => (
                        <button
                          key={role}
                          onClick={() => {
                            setUserRole(role);
                            if (role === 'ministry') setActiveCabinetTab('monitoring');
                            else if (role === 'inspector') setActiveCabinetTab('monitoring');
                            else setActiveCabinetTab('listings');
                          }}
                          className={`py-2 px-1 rounded-lg text-[8px] font-bold uppercase tracking-widest border transition-all ${userRole === role ? 'bg-accent-purple text-white border-accent-purple' : 'bg-transparent text-black/40 border-black/5 hover:border-accent-purple/20'}`}
                        >
                          {t[role]}
                        </button>
                      ))}
                    </div>
                  </div>
                  <button 
                    onClick={() => setShowLandlordForm(false)}
                    className={`w-full py-3 text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 rounded-xl transition-all border ${!showLandlordForm ? 'bg-accent-purple text-white border-accent-purple shadow-lg shadow-accent-purple/20' : 'text-black/40 border-transparent hover:bg-accent-purple/5'}`}
                  >
                    <User size={14} />
                    {t.personalInfo}
                  </button>
                  <button 
                    onClick={() => setShowLandlordForm(true)}
                    className={`w-full py-3 text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 rounded-xl transition-all border ${showLandlordForm ? 'bg-accent-purple text-white border-accent-purple shadow-lg shadow-accent-purple/20' : 'text-black/40 border-transparent hover:bg-accent-purple/5'}`}
                  >
                    <ShieldCheck size={14} />
                    {userRole === 'ministry' ? t.ministry : userRole === 'inspector' ? t.inspector : t.landlordCabinet}
                  </button>
                </div>

                <div className="mt-auto pt-8 w-full">
                  <button className="w-full py-3 text-red-500 text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-red-50 rounded-xl transition-colors">
                    <LogOut size={14} />
                    Выйти
                  </button>
                </div>
              </div>

              {/* Main Settings Area */}
              <div className="flex-1 p-8 overflow-y-auto">
                <AnimatePresence mode="wait">
                  {!showLandlordForm ? (
                    <motion.div
                      key="settings"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className="space-y-8"
                    >
                      <div className="flex justify-between items-center mb-8">
                        <h2 className="text-2xl font-serif">{t.personalInfo}</h2>
                        <button onClick={() => setShowCabinet(false)} className="p-2 hover:bg-black/5 rounded-full">
                          <X size={24} />
                        </button>
                      </div>

                      <div className="space-y-8">
                        {/* VIP Subscription Toggle */}
                        <section className="p-6 bg-purple-50 rounded-[32px] border border-purple-100 flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-purple-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-purple-200">
                              <Star size={24} fill="currentColor" />
                            </div>
                            <div>
                              <h4 className="text-sm font-bold">VIP Статус</h4>
                              <p className="text-[10px] opacity-40 uppercase tracking-widest">Доступ к AI-маршрутам</p>
                            </div>
                          </div>
                          <button 
                            onClick={() => setIsVip(!isVip)}
                            className={`w-12 h-6 rounded-full transition-colors relative ${isVip ? 'bg-purple-600' : 'bg-black/20'}`}
                          >
                            <motion.div 
                              animate={{ x: isVip ? 26 : 2 }}
                              className="absolute top-1 left-0 w-4 h-4 bg-white rounded-full shadow-sm"
                            />
                          </button>
                        </section>

                        {/* Verification Section */}
                        <section>
                          <h4 className="text-[10px] font-bold uppercase tracking-widest opacity-40 mb-4">{t.verifyWith}</h4>
                          
                          <AnimatePresence mode="wait">
                            {!showVerificationMethods ? (
                              <motion.button
                                key="connect-btn"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                onClick={() => setShowVerificationMethods(true)}
                                className="w-full p-6 bg-purple-600 text-white rounded-[24px] font-bold uppercase tracking-widest text-xs hover:bg-purple-700 transition-all shadow-lg shadow-purple-200 flex items-center justify-center gap-3"
                              >
                                <ShieldCheck size={20} />
                                {t.connectServices}
                              </motion.button>
                            ) : (
                              <motion.div
                                key="methods-list"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="space-y-3"
                              >
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                  {[
                                    { id: 'gosuslugi', name: t.gosuslugi, verified: userProfile.verifications.gosuslugi, color: 'bg-blue-600' },
                                    { id: 'yandex', name: t.yandexId, verified: userProfile.verifications.yandex, color: 'bg-red-500' },
                                    { id: 'google', name: t.google, verified: userProfile.verifications.google, color: 'bg-white border border-black/10' },
                                    { id: 'vk', name: t.vk, verified: userProfile.verifications.vk, color: 'bg-[#0077FF]' },
                                    { id: 'passport', name: t.passport, verified: false, color: 'bg-emerald-600' },
                                  ].map(method => (
                                    <div 
                                      key={method.id} 
                                      onClick={() => !method.verified && handleMockVerify(method.id as any)}
                                      className="p-4 rounded-2xl border border-black/5 flex items-center justify-between hover:bg-black/5 transition-colors cursor-pointer group"
                                    >
                                      <div className="flex items-center gap-3">
                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-xs ${method.color} ${method.id === 'google' ? 'text-black' : ''}`}>
                                          {method.name[0]}
                                        </div>
                                        <span className="text-xs font-medium">{method.name}</span>
                                      </div>
                                      {method.verified ? (
                                        <div className="flex items-center gap-1 text-emerald-600 text-[10px] font-bold uppercase">
                                          <Check size={12} />
                                          {t.verified}
                                        </div>
                                      ) : (
                                        <span className="text-[10px] font-bold uppercase opacity-30 group-hover:opacity-100 transition-opacity">
                                          Подключить
                                        </span>
                                      )}
                                    </div>
                                  ))}
                                </div>
                                <button 
                                  onClick={() => setShowVerificationMethods(false)}
                                  className="w-full py-3 text-[10px] font-bold uppercase tracking-widest opacity-40 hover:opacity-100 transition-opacity"
                                >
                                  ← {t.back}
                                </button>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </section>

                        {/* Form Section */}
                        <section className="space-y-4">
                          <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-widest opacity-40 ml-1">{t.fullName}</label>
                            <input 
                              type="text" 
                              placeholder="Иванов Иван Иванович"
                              value={userProfile.fullName}
                              onChange={(e) => setUserProfile({...userProfile, fullName: e.target.value})}
                              className="w-full p-4 bg-purple-50 rounded-2xl text-sm focus:outline-none focus:ring-1 focus:ring-purple-200 border border-purple-100"
                            />
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <label className="text-[10px] font-bold uppercase tracking-widest opacity-40 ml-1">{t.birthDate}</label>
                              <input 
                                type="text" 
                                placeholder="ДД.ММ.ГГГГ"
                                value={userProfile.birthDate}
                                onChange={(e) => setUserProfile({...userProfile, birthDate: e.target.value})}
                                className="w-full p-4 bg-purple-50 rounded-2xl text-sm focus:outline-none focus:ring-1 focus:ring-purple-200 border border-purple-100"
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="text-[10px] font-bold uppercase tracking-widest opacity-40 ml-1">{t.phone}</label>
                              <div className="relative">
                                <input 
                                  type="tel" 
                                  placeholder="+7 (___) ___-__-__"
                                  value={userProfile.phone}
                                  onChange={(e) => setUserProfile({...userProfile, phone: e.target.value})}
                                  className={`w-full p-4 bg-purple-50 rounded-2xl text-sm focus:outline-none focus:ring-1 focus:ring-purple-200 border border-purple-100 ${userProfile.phoneVerified ? 'pr-12' : ''}`}
                                />
                                {!userProfile.phoneVerified && userProfile.phone && (
                                  <button 
                                    onClick={() => setVerifyingPhone(true)}
                                    className="absolute right-2 top-2 bottom-2 px-3 bg-purple-600 text-white text-[10px] font-bold uppercase rounded-xl hover:bg-purple-700 transition-colors"
                                  >
                                    {t.sendCode}
                                  </button>
                                )}
                                {userProfile.phoneVerified && (
                                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-emerald-600">
                                    <Check size={18} />
                                  </div>
                                )}
                              </div>
                              <AnimatePresence>
                                {verifyingPhone && (
                                  <motion.div 
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="overflow-hidden"
                                  >
                                    <div className="flex gap-2 mt-2">
                                      <input 
                                        type="text" 
                                        placeholder={t.enterCode}
                                        value={verificationCode}
                                        onChange={(e) => setVerificationCode(e.target.value)}
                                        className="flex-1 p-3 bg-white border border-purple-200 rounded-xl text-sm"
                                      />
                                      <button 
                                        onClick={() => handleConfirmCode('phone')}
                                        className="px-4 bg-[#1A1A1A] text-white text-[10px] font-bold uppercase rounded-xl"
                                      >
                                        {t.confirm}
                                      </button>
                                    </div>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <label className="text-[10px] font-bold uppercase tracking-widest opacity-40 ml-1">Email</label>
                              <div className="relative">
                                <input 
                                  type="email" 
                                  value={userProfile.email}
                                  onChange={(e) => setUserProfile({...userProfile, email: e.target.value})}
                                  className={`w-full p-4 bg-purple-50 rounded-2xl text-sm focus:outline-none focus:ring-1 focus:ring-purple-200 border border-purple-100 ${userProfile.emailVerified ? 'pr-12' : ''}`}
                                />
                                {!userProfile.emailVerified && userProfile.email && (
                                  <button 
                                    onClick={() => setVerifyingEmail(true)}
                                    className="absolute right-2 top-2 bottom-2 px-3 bg-purple-600 text-white text-[10px] font-bold uppercase rounded-xl hover:bg-purple-700 transition-colors"
                                  >
                                    {t.sendCode}
                                  </button>
                                )}
                                {userProfile.emailVerified && (
                                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-emerald-600">
                                    <Check size={18} />
                                  </div>
                                )}
                              </div>
                              <AnimatePresence>
                                {verifyingEmail && (
                                  <motion.div 
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="overflow-hidden"
                                  >
                                    <div className="flex gap-2 mt-2">
                                      <input 
                                        type="text" 
                                        placeholder={t.enterCode}
                                        value={verificationCode}
                                        onChange={(e) => setVerificationCode(e.target.value)}
                                        className="flex-1 p-3 bg-white border border-purple-200 rounded-xl text-sm"
                                      />
                                      <button 
                                        onClick={() => handleConfirmCode('email')}
                                        className="px-4 bg-[#1A1A1A] text-white text-[10px] font-bold uppercase rounded-xl"
                                      >
                                        {t.confirm}
                                      </button>
                                    </div>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                            <div className="space-y-2 opacity-40">
                              <label className="text-[10px] font-bold uppercase tracking-widest ml-1">ID</label>
                              <input 
                                type="text" 
                                disabled
                                value={userProfile.id}
                                className="w-full p-4 bg-black/5 rounded-2xl text-sm border border-transparent"
                              />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-widest opacity-40 ml-1">{t.address}</label>
                            <input 
                              type="text" 
                              placeholder="г. Севастополь, ул. Ленина, д. 1"
                              value={userProfile.address}
                              onChange={(e) => setUserProfile({...userProfile, address: e.target.value})}
                              className="w-full p-4 bg-purple-50 rounded-2xl text-sm focus:outline-none focus:ring-1 focus:ring-purple-200 border border-purple-100"
                            />
                          </div>
                        </section>

                        {/* Invoices Section for Regular User */}
                        <section className="space-y-4">
                          <h4 className="text-[10px] font-bold uppercase tracking-widest opacity-40 ml-1">{t.invoices}</h4>
                          <div className="space-y-3">
                            {[
                              { id: 'PAY-772', date: '15.05.2024', amount: 4500, status: 'paid', type: 'Аренда снаряжения' },
                              { id: 'PAY-812', date: '18.05.2024', amount: 12000, status: 'pending', type: 'Бронирование жилья' },
                            ].map(pay => (
                              <div key={pay.id} className="p-4 bg-white rounded-2xl border border-black/5 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <div className={`p-2 rounded-xl ${pay.status === 'paid' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                                    <CreditCard size={16} />
                                  </div>
                                  <div>
                                    <div className="text-[10px] font-bold">{pay.type}</div>
                                    <div className="text-[8px] opacity-40 uppercase tracking-widest font-bold">{pay.date} • {pay.id}</div>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className="text-xs font-bold">₽{pay.amount.toLocaleString()}</div>
                                  <button 
                                    onClick={async () => {
                                      if (pay.status === 'pending') alert('Оплата...');
                                      else {
                                        const JsPDF = await loadJsPdf();
                                        const doc = new JsPDF();
                                        doc.text(`Квитанция ${pay.id}`, 20, 20);
                                        doc.text(`Тип: ${pay.type}`, 20, 30);
                                        doc.text(`Сумма: ${pay.amount} руб.`, 20, 40);
                                        doc.save(`receipt-${pay.id}.pdf`);
                                      }
                                    }}
                                    className={`text-[8px] font-bold uppercase tracking-widest mt-1 ${pay.status === 'paid' ? 'text-emerald-600' : 'text-amber-600 underline'}`}
                                  >
                                    {pay.status === 'paid' ? 'Квитанция' : 'Оплатить'}
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </section>

                        <div className="relative">
                          <AnimatePresence>
                            {showProfileSaveSuccess && (
                              <motion.div 
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="absolute -top-12 left-0 right-0 p-3 bg-emerald-500 text-white text-center rounded-xl text-[10px] font-bold uppercase tracking-widest shadow-lg z-10"
                              >
                                {t.saveChanges} — {t.verified}
                              </motion.div>
                            )}
                          </AnimatePresence>
                          <button 
                            onClick={() => {
                              setShowProfileSaveSuccess(true);
                              setTimeout(() => setShowProfileSaveSuccess(false), 3000);
                            }}
                            className="w-full py-4 bg-[#1A1A1A] text-white rounded-2xl font-bold uppercase tracking-widest text-xs hover:bg-black/80 transition-all shadow-xl"
                          >
                            {t.saveChanges}
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="landlord-form"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-8"
                    >
                      <div className="flex justify-between items-center mb-8">
                        <div className="space-y-1">
                          <h2 className="text-2xl font-serif">{t.landlordCabinet}</h2>
                          <div className="flex items-center gap-2">
                            <div className="w-24 h-1 bg-black/5 rounded-full overflow-hidden">
                              <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: `${formProgress}%` }}
                                className="h-full bg-purple-600"
                              />
                            </div>
                            <span className="text-[8px] font-bold uppercase tracking-widest opacity-30">{formProgress}% заполнено</span>
                          </div>
                        </div>
                        <button onClick={() => setShowLandlordForm(false)} className="p-2 hover:bg-black/5 rounded-full">
                          <X size={24} />
                        </button>
                      </div>

                      {/* Tab Switcher */}
                      <div className="flex gap-1 p-1 bg-black/5 rounded-2xl mb-8 overflow-x-auto no-scrollbar">
                        {userRole === 'hotelier' && (
                          <>
                            <button 
                              onClick={() => setActiveCabinetTab('listings')}
                              className={`flex-none px-6 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${activeCabinetTab === 'listings' ? 'bg-white shadow-sm text-black' : 'text-black/40 hover:text-black/60'}`}
                            >
                              {t.myListings}
                            </button>
                            <button 
                              onClick={() => setActiveCabinetTab('ad')}
                              className={`flex-none px-6 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${activeCabinetTab === 'ad' ? 'bg-white shadow-sm text-black' : 'text-black/40 hover:text-black/60'}`}
                            >
                              {t.placeAd}
                            </button>
                            <button 
                              onClick={() => setActiveCabinetTab('grants')}
                              className={`flex-none px-6 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${activeCabinetTab === 'grants' ? 'bg-white shadow-sm text-black' : 'text-black/40 hover:text-black/60'}`}
                            >
                              {t.grants}
                            </button>
                            <button 
                              onClick={() => setActiveCabinetTab('standards')}
                              className={`flex-none px-6 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${activeCabinetTab === 'standards' ? 'bg-white shadow-sm text-black' : 'text-black/40 hover:text-black/60'}`}
                            >
                              {t.standards}
                            </button>
                          </>
                        )}
                        {(userRole === 'ministry' || userRole === 'inspector') && (
                          <>
                            <button 
                              onClick={() => setActiveCabinetTab('monitoring')}
                              className={`flex-none px-6 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${activeCabinetTab === 'monitoring' ? 'bg-white shadow-sm text-black' : 'text-black/40 hover:text-black/60'}`}
                            >
                              {t.monitoring}
                            </button>
                            <button 
                              onClick={() => setActiveCabinetTab('fleet')}
                              className={`flex-none px-6 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${activeCabinetTab === 'fleet' ? 'bg-white shadow-sm text-black' : 'text-black/40 hover:text-black/60'}`}
                            >
                              {t.fleet}
                            </button>
                          </>
                        )}
                        <button 
                          onClick={() => setActiveCabinetTab('bookings')}
                          className={`flex-none px-6 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${activeCabinetTab === 'bookings' ? 'bg-white shadow-sm text-black' : 'text-black/40 hover:text-black/60'}`}
                        >
                          {t.bookings}
                        </button>
                        <button 
                          onClick={() => setActiveCabinetTab('messages')}
                          className={`flex-none px-6 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${activeCabinetTab === 'messages' ? 'bg-white shadow-sm text-black' : 'text-black/40 hover:text-black/60'}`}
                        >
                          {t.messages}
                        </button>
                        <button 
                          onClick={() => setActiveCabinetTab('reviews')}
                          className={`flex-none px-6 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${activeCabinetTab === 'reviews' ? 'bg-white shadow-sm text-black' : 'text-black/40 hover:text-black/60'}`}
                        >
                          {t.reviews}
                        </button>
                        <button 
                          onClick={() => setActiveCabinetTab('invoices')}
                          className={`flex-none px-6 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${activeCabinetTab === 'invoices' ? 'bg-white shadow-sm text-black' : 'text-black/40 hover:text-black/60'}`}
                        >
                          {t.invoices}
                        </button>
                        <button 
                          onClick={() => setActiveCabinetTab('settings')}
                          className={`flex-none px-6 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${activeCabinetTab === 'settings' ? 'bg-white shadow-sm text-black' : 'text-black/40 hover:text-black/60'}`}
                        >
                          Настройки
                        </button>
                      </div>

                      {outbox.length > 0 && (
                        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-100 rounded-2xl flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center text-yellow-700">
                              <RefreshCw size={16} className="animate-spin" />
                            </div>
                            <div>
                              <div className="text-[10px] font-bold uppercase tracking-widest text-yellow-800">{t.outbox}</div>
                              <div className="text-[8px] text-yellow-600 uppercase font-bold tracking-widest">{outbox.length} {t.syncPending}</div>
                            </div>
                          </div>
                          <button 
                            onClick={() => setShowOutbox(!showOutbox)}
                            className="text-[8px] font-bold uppercase tracking-widest text-yellow-700 hover:underline"
                          >
                            {showOutbox ? t.hide : t.show}
                          </button>
                        </div>
                      )}

                      <AnimatePresence mode="wait">
                        {showOutbox && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="mb-6 space-y-2 overflow-hidden"
                          >
                            {outbox.map(item => (
                              <div key={item.id} className="p-3 bg-white border border-black/5 rounded-xl flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <div className="text-[10px] font-bold uppercase tracking-widest opacity-40">{item.type}</div>
                                  <div className="text-[10px] truncate max-w-[150px]">{JSON.stringify(item.data).substring(0, 30)}...</div>
                                </div>
                                <div className={`text-[8px] font-bold uppercase tracking-widest ${item.status === 'syncing' ? 'text-blue-500' : 'text-yellow-600'}`}>
                                  {item.status}
                                </div>
                              </div>
                            ))}
                          </motion.div>
                        )}
                        {activeCabinetTab === 'listings' && (
                          <motion.div
                            key="listings-tab"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="space-y-4"
                          >
                            <div className="flex justify-between items-center mb-4">
                              <h4 className="text-[10px] font-bold uppercase tracking-widest opacity-40 ml-1">{t.myListings}</h4>
                              <button 
                                onClick={() => setActiveCabinetTab('ad')}
                                className="text-[10px] font-bold uppercase tracking-widest text-purple-600 hover:text-purple-700 transition-colors"
                              >
                                + {t.placeAd}
                              </button>
                            </div>
                            {objects.filter(obj => obj.id < 3).map(obj => (
                              <div key={obj.id} className="p-4 bg-white border border-black/5 rounded-[32px] flex gap-4 group">
                                <div className="w-24 h-24 rounded-2xl overflow-hidden shrink-0">
                                  <img src={obj.image_url} alt={obj.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" referrerPolicy="no-referrer" />
                                </div>
                                <div className="flex-1 min-w-0 py-1">
                                  <div className="flex justify-between items-start mb-1">
                                    <h5 className="font-serif text-lg truncate">{obj.name}</h5>
                                    <div className="text-right">
                                      <div className="text-sm font-bold">₽{obj.price_per_night}</div>
                                      <div className="text-[8px] opacity-40 uppercase font-bold tracking-widest">/ {t.night}</div>
                                    </div>
                                  </div>
                                  <p className="text-[10px] opacity-40 uppercase font-bold tracking-widest mb-3">{obj.type}</p>
                                  <div className="flex gap-2">
                                    <button className="px-3 py-1.5 bg-black/5 hover:bg-black/10 rounded-lg text-[8px] font-bold uppercase tracking-widest transition-colors flex items-center gap-1.5">
                                      <Edit2 size={10} />
                                      {t.edit}
                                    </button>
                                    <button className="px-3 py-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg text-[8px] font-bold uppercase tracking-widest transition-colors flex items-center gap-1.5">
                                      <Trash2 size={10} />
                                      {t.delete}
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </motion.div>
                        )}

                        {activeCabinetTab === 'ad' && (
                          <motion.div
                            key="ad-tab"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="space-y-8"
                          >
                            {/* Consultant Section */}
                            <section className="p-6 bg-purple-50 rounded-[32px] border border-purple-100 relative overflow-hidden">
                              <div className="flex items-center gap-4 mb-4">
                                <div className="w-12 h-12 bg-purple-600 rounded-2xl flex items-center justify-center text-white">
                                  <User size={24} />
                                </div>
                                <div className="flex-1">
                                  <h4 className="text-sm font-bold">{t.askConsultant}</h4>
                                  <p className="text-[10px] opacity-40 uppercase tracking-widest">{t.consultantHelp}</p>
                                </div>
                                <button 
                                  onClick={handleConsultantAsk}
                                  className={`p-3 rounded-full transition-all ${isListening ? 'bg-red-500 text-white animate-pulse' : 'bg-white hover:bg-purple-100 text-purple-600 border border-purple-100 shadow-sm'}`}
                                >
                                  <Mic size={20} />
                                </button>
                              </div>
                              {consultantResponse && (
                                <motion.div 
                                  initial={{ opacity: 0, y: 10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  className="p-4 bg-white rounded-2xl text-xs leading-relaxed border border-purple-100"
                                >
                                  {consultantResponse}
                                </motion.div>
                              )}
                            </section>

                            {/* Ad Form */}
                            <div className="space-y-6">
                              <div className="space-y-2">
                                <label className="text-[10px] font-bold uppercase tracking-widest opacity-40 ml-1">{t.category}</label>
                                <div className="flex flex-wrap gap-2">
                                  {[
                                    { id: 'housing', name: t.housing, icon: <MapIcon size={14} /> },
                                    { id: 'transport', name: t.transport, icon: <Car size={14} /> },
                                    { id: 'services', name: t.services, icon: <Star size={14} /> },
                                    { id: 'legal', name: t.legal, icon: <ShieldCheck size={14} /> },
                                    { id: 'social', name: t.social, icon: <User size={14} /> },
                                  ].map(cat => (
                                    <button
                                      key={cat.id}
                                      onClick={() => setLandlordAd({ ...landlordAd, category: cat.id })}
                                      className={`flex-1 min-w-[120px] py-3 px-4 rounded-2xl text-[10px] font-bold uppercase tracking-widest transition-all border flex items-center justify-center gap-2 ${
                                        landlordAd.category === cat.id 
                                          ? 'bg-purple-600 text-white border-purple-600 shadow-lg shadow-purple-100' 
                                          : 'bg-purple-50 text-purple-600 border-purple-100 hover:bg-purple-100'
                                      }`}
                                    >
                                      {cat.icon}
                                      {cat.name}
                                    </button>
                                  ))}
                                </div>
                              </div>

                              <AnimatePresence mode="wait">
                                {landlordAd.category === 'housing' && (
                                  <motion.div
                                    key="housing-section"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="space-y-6"
                                  >
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                      <div className="space-y-2">
                                        <label className="text-[10px] font-bold uppercase tracking-widest opacity-40 ml-1">{t.objectName}</label>
                                        <input 
                                          type="text" 
                                          value={landlordAd.objectName}
                                          onChange={(e) => setLandlordAd({...landlordAd, objectName: e.target.value})}
                                          placeholder="Уютная студия у моря"
                                          className="w-full p-4 bg-purple-50 rounded-2xl text-sm border border-purple-100"
                                        />
                                      </div>
                                      <div className="space-y-2">
                                        <label className="text-[10px] font-bold uppercase tracking-widest opacity-40 ml-1">Тип объекта</label>
                                        <select 
                                          value={landlordAd.subCategory}
                                          onChange={(e) => setLandlordAd({...landlordAd, subCategory: e.target.value})}
                                          className="w-full p-4 bg-purple-50 rounded-2xl text-sm border border-purple-100 appearance-none"
                                        >
                                          <option value="apartment">{t.apartment}</option>
                                          <option value="room">{t.room}</option>
                                          <option value="house">{t.house}</option>
                                          <option value="hotel">{t.hotel}</option>
                                          <option value="hostel">{t.hostel}</option>
                                          <option value="elling">Эллинг</option>
                                          <option value="glamping">Глэмпинг</option>
                                        </select>
                                      </div>
                                    </div>

                                    <div className="space-y-2">
                                      <label className="text-[10px] font-bold uppercase tracking-widest opacity-40 ml-1">{t.exactAddress}</label>
                                      <input 
                                        type="text" 
                                        value={landlordAd.exactAddress}
                                        onChange={(e) => setLandlordAd({...landlordAd, exactAddress: e.target.value})}
                                        placeholder="г. Ялта, ул. Пушкина, 10"
                                        className="w-full p-4 bg-purple-50 rounded-2xl text-sm border border-purple-100"
                                      />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                      <div className="space-y-2">
                                        <label className="text-[10px] font-bold uppercase tracking-widest opacity-40 ml-1">{t.floor}</label>
                                        <input 
                                          type="text" 
                                          value={landlordAd.floor}
                                          onChange={(e) => setLandlordAd({...landlordAd, floor: e.target.value})}
                                          placeholder="3 / 5"
                                          className="w-full p-4 bg-purple-50 rounded-2xl text-sm border border-purple-100"
                                        />
                                      </div>
                                      <div className="space-y-2">
                                        <label className="text-[10px] font-bold uppercase tracking-widest opacity-40 ml-1">{t.area}</label>
                                        <input 
                                          type="number" 
                                          value={landlordAd.area}
                                          onChange={(e) => setLandlordAd({...landlordAd, area: e.target.value})}
                                          placeholder="45"
                                          className="w-full p-4 bg-purple-50 rounded-2xl text-sm border border-purple-100"
                                        />
                                      </div>
                                    </div>

                                    <div className="space-y-4 p-6 bg-black/5 rounded-[32px]">
                                      <h4 className="text-[10px] font-bold uppercase tracking-widest opacity-40">{t.sleepingPlaces}</h4>
                                      <div className="grid grid-cols-3 gap-4">
                                        <div className="space-y-1">
                                          <label className="text-[8px] font-bold uppercase opacity-40">Двуспальные</label>
                                          <input type="number" value={landlordAd.sleepingPlaces.double} onChange={(e) => setLandlordAd({...landlordAd, sleepingPlaces: {...landlordAd.sleepingPlaces, double: parseInt(e.target.value)}})} className="w-full p-2 bg-white rounded-lg text-xs" />
                                        </div>
                                        <div className="space-y-1">
                                          <label className="text-[8px] font-bold uppercase opacity-40">Односпальные</label>
                                          <input type="number" value={landlordAd.sleepingPlaces.single} onChange={(e) => setLandlordAd({...landlordAd, sleepingPlaces: {...landlordAd.sleepingPlaces, single: parseInt(e.target.value)}})} className="w-full p-2 bg-white rounded-lg text-xs" />
                                        </div>
                                        <div className="space-y-1">
                                          <label className="text-[8px] font-bold uppercase opacity-40">Диваны</label>
                                          <input type="number" value={landlordAd.sleepingPlaces.sofa} onChange={(e) => setLandlordAd({...landlordAd, sleepingPlaces: {...landlordAd.sleepingPlaces, sofa: parseInt(e.target.value)}})} className="w-full p-2 bg-white rounded-lg text-xs" />
                                        </div>
                                      </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                      <div className="space-y-2">
                                        <label className="text-[10px] font-bold uppercase tracking-widest opacity-40 ml-1">{t.maxGuests}</label>
                                        <input type="number" value={landlordAd.maxGuests} onChange={(e) => setLandlordAd({...landlordAd, maxGuests: parseInt(e.target.value)})} className="w-full p-4 bg-purple-50 rounded-2xl text-sm border border-purple-100" />
                                      </div>
                                      <div className="flex gap-4 items-end pb-4">
                                        <label className="flex items-center gap-2 cursor-pointer">
                                          <input type="checkbox" checked={landlordAd.childrenAllowed} onChange={(e) => setLandlordAd({...landlordAd, childrenAllowed: e.target.checked})} className="w-4 h-4 rounded border-purple-200 text-purple-600" />
                                          <span className="text-[10px] font-bold uppercase opacity-40">{t.childrenAllowed}</span>
                                        </label>
                                        <label className="flex items-center gap-2 cursor-pointer">
                                          <input type="checkbox" checked={landlordAd.petsAllowed} onChange={(e) => setLandlordAd({...landlordAd, petsAllowed: e.target.checked})} className="w-4 h-4 rounded border-purple-200 text-purple-600" />
                                          <span className="text-[10px] font-bold uppercase opacity-40">{t.petsAllowed}</span>
                                        </label>
                                      </div>
                                    </div>

                                    <div className="space-y-4">
                                      <label className="text-[10px] font-bold uppercase tracking-widest opacity-40 ml-1">{t.amenities}</label>
                                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                        {[
                                          { id: 'ac', name: t.ac },
                                          { id: 'wifi', name: t.wifi },
                                          { id: 'kitchen', name: t.kitchen },
                                          { id: 'parking', name: t.parking },
                                          { id: 'balcony', name: 'Балкон' },
                                          { id: 'seaView', name: 'Вид на море' },
                                          { id: 'mountainView', name: 'Вид на горы' },
                                          { id: 'elevator', name: 'Лифт' },
                                        ].map(item => (
                                          <button
                                            key={item.id}
                                            onClick={() => {
                                              const newAmenities = landlordAd.amenities.includes(item.id)
                                                ? landlordAd.amenities.filter(a => a !== item.id)
                                                : [...landlordAd.amenities, item.id];
                                              setLandlordAd({ ...landlordAd, amenities: newAmenities });
                                            }}
                                            className={`p-3 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all border text-center ${
                                              landlordAd.amenities.includes(item.id)
                                                ? 'bg-purple-600 text-white border-purple-600'
                                                : 'bg-white text-black/60 border-black/5 hover:border-purple-200'
                                            }`}
                                          >
                                            {item.name}
                                          </button>
                                        ))}
                                      </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                      <div className="space-y-2">
                                        <label className="text-[10px] font-bold uppercase tracking-widest opacity-40 ml-1">{t.pricePerNight}</label>
                                        <input type="number" value={landlordAd.price} onChange={(e) => setLandlordAd({...landlordAd, price: e.target.value})} className="w-full p-4 bg-purple-50 rounded-2xl text-sm border border-purple-100" />
                                      </div>
                                      <div className="space-y-2">
                                        <label className="text-[10px] font-bold uppercase tracking-widest opacity-40 ml-1">{t.minDuration}</label>
                                        <input type="number" value={landlordAd.minDuration} onChange={(e) => setLandlordAd({...landlordAd, minDuration: parseInt(e.target.value)})} className="w-full p-4 bg-purple-50 rounded-2xl text-sm border border-purple-100" />
                                      </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                      <div className="space-y-2">
                                        <label className="text-[10px] font-bold uppercase tracking-widest opacity-40 ml-1">{t.checkInTime}</label>
                                        <input type="time" value={landlordAd.checkInTime} onChange={(e) => setLandlordAd({...landlordAd, checkInTime: e.target.value})} className="w-full p-4 bg-purple-50 rounded-2xl text-sm border border-purple-100" />
                                      </div>
                                      <div className="space-y-2">
                                        <label className="text-[10px] font-bold uppercase tracking-widest opacity-40 ml-1">{t.checkOutTime}</label>
                                        <input type="time" value={landlordAd.checkOutTime} onChange={(e) => setLandlordAd({...landlordAd, checkOutTime: e.target.value})} className="w-full p-4 bg-purple-50 rounded-2xl text-sm border border-purple-100" />
                                      </div>
                                    </div>
                                  </motion.div>
                                )}

                                {landlordAd.category === 'transport' && (
                                  <motion.div
                                    key="transport-section"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="space-y-6"
                                  >
                                    <div className="grid grid-cols-2 gap-4">
                                      <div className="space-y-2">
                                        <label className="text-[10px] font-bold uppercase tracking-widest opacity-40 ml-1">{t.transportType}</label>
                                        <select 
                                          value={landlordAd.transportType}
                                          onChange={(e) => setLandlordAd({...landlordAd, transportType: e.target.value})}
                                          className="w-full p-4 bg-purple-50 rounded-2xl text-sm border border-purple-100 appearance-none"
                                        >
                                          <option value="sedan">Легковой</option>
                                          <option value="minivan">Минивэн</option>
                                          <option value="bus">Микроавтобус</option>
                                          <option value="jeep">Внедорожник</option>
                                        </select>
                                      </div>
                                      <div className="space-y-2">
                                        <label className="text-[10px] font-bold uppercase tracking-widest opacity-40 ml-1">{t.carMakeModel}</label>
                                        <input type="text" value={landlordAd.carMakeModel} onChange={(e) => setLandlordAd({...landlordAd, carMakeModel: e.target.value})} placeholder="Toyota Camry" className="w-full p-4 bg-purple-50 rounded-2xl text-sm border border-purple-100" />
                                      </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                      <div className="space-y-2">
                                        <label className="text-[10px] font-bold uppercase tracking-widest opacity-40 ml-1">{t.carYearCondition}</label>
                                        <input type="text" value={landlordAd.carYear} onChange={(e) => setLandlordAd({...landlordAd, carYear: e.target.value})} placeholder="2022, отл. состояние" className="w-full p-4 bg-purple-50 rounded-2xl text-sm border border-purple-100" />
                                      </div>
                                      <div className="space-y-2">
                                        <label className="text-[10px] font-bold uppercase tracking-widest opacity-40 ml-1">{t.carCapacity}</label>
                                        <input type="text" value={`${landlordAd.carCapacity.passengers} пас / ${landlordAd.carCapacity.luggage} баг`} disabled className="w-full p-4 bg-black/5 rounded-2xl text-sm border border-transparent" />
                                      </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                      <div className="space-y-2">
                                        <label className="text-[10px] font-bold uppercase tracking-widest opacity-40 ml-1">{t.basePoint}</label>
                                        <input type="text" value={landlordAd.basePoint} onChange={(e) => setLandlordAd({...landlordAd, basePoint: e.target.value})} placeholder="Симферополь" className="w-full p-4 bg-purple-50 rounded-2xl text-sm border border-purple-100" />
                                      </div>
                                      <div className="space-y-2">
                                        <label className="text-[10px] font-bold uppercase tracking-widest opacity-40 ml-1">{t.pricePerKm}</label>
                                        <input type="number" value={landlordAd.pricePerKm} onChange={(e) => setLandlordAd({...landlordAd, pricePerKm: e.target.value})} placeholder="50" className="w-full p-4 bg-purple-50 rounded-2xl text-sm border border-purple-100" />
                                      </div>
                                    </div>
                                  </motion.div>
                                )}

                                {landlordAd.category === 'services' && (
                                  <motion.div
                                    key="services-section"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="space-y-6"
                                  >
                                    <div className="grid grid-cols-2 gap-4">
                                      <div className="space-y-2">
                                        <label className="text-[10px] font-bold uppercase tracking-widest opacity-40 ml-1">{t.serviceCategory}</label>
                                        <select 
                                          value={landlordAd.serviceCategory}
                                          onChange={(e) => setLandlordAd({...landlordAd, serviceCategory: e.target.value})}
                                          className="w-full p-4 bg-purple-50 rounded-2xl text-sm border border-purple-100 appearance-none"
                                        >
                                          <option value="excursion">Экскурсия</option>
                                          <option value="rental">Аренда инвентаря</option>
                                          <option value="water">Водный спорт</option>
                                          <option value="horse">Конные прогулки</option>
                                          <option value="spa">СПА/Массаж</option>
                                        </select>
                                      </div>
                                      <div className="space-y-2">
                                        <label className="text-[10px] font-bold uppercase tracking-widest opacity-40 ml-1">{t.serviceName}</label>
                                        <input type="text" value={landlordAd.serviceName} onChange={(e) => setLandlordAd({...landlordAd, serviceName: e.target.value})} placeholder="Прогулка на SUP-досках" className="w-full p-4 bg-purple-50 rounded-2xl text-sm border border-purple-100" />
                                      </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                      <div className="space-y-2">
                                        <label className="text-[10px] font-bold uppercase tracking-widest opacity-40 ml-1">{t.duration}</label>
                                        <input type="text" value={landlordAd.duration} onChange={(e) => setLandlordAd({...landlordAd, duration: e.target.value})} placeholder="3 часа" className="w-full p-4 bg-purple-50 rounded-2xl text-sm border border-purple-100" />
                                      </div>
                                      <div className="space-y-2">
                                        <label className="text-[10px] font-bold uppercase tracking-widest opacity-40 ml-1">{t.securityDeposit}</label>
                                        <input type="text" value={landlordAd.securityDeposit} onChange={(e) => setLandlordAd({...landlordAd, securityDeposit: e.target.value})} placeholder="5000 руб или паспорт" className="w-full p-4 bg-purple-50 rounded-2xl text-sm border border-purple-100" />
                                      </div>
                                    </div>
                                  </motion.div>
                                )}

                                {landlordAd.category === 'legal' && (
                                  <motion.div
                                    key="legal-section"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="space-y-6"
                                  >
                                    <div className="grid grid-cols-2 gap-4">
                                      <div className="space-y-2">
                                        <label className="text-[10px] font-bold uppercase tracking-widest opacity-40 ml-1">{t.partnerStatus}</label>
                                        <select 
                                          value={landlordAd.partnerStatus}
                                          onChange={(e) => setLandlordAd({...landlordAd, partnerStatus: e.target.value})}
                                          className="w-full p-4 bg-purple-50 rounded-2xl text-sm border border-purple-100 appearance-none"
                                        >
                                          <option value="individual">Физлицо</option>
                                          <option value="self_employed">Самозанятый</option>
                                          <option value="ip">ИП</option>
                                          <option value="ooo">ООО</option>
                                        </select>
                                      </div>
                                      <div className="space-y-2">
                                        <label className="text-[10px] font-bold uppercase tracking-widest opacity-40 ml-1">{t.inn}</label>
                                        <input type="text" value={landlordAd.inn} onChange={(e) => setLandlordAd({...landlordAd, inn: e.target.value})} placeholder="123456789012" className="w-full p-4 bg-purple-50 rounded-2xl text-sm border border-purple-100" />
                                      </div>
                                    </div>

                                    <div className="space-y-2">
                                      <label className="text-[10px] font-bold uppercase tracking-widest opacity-40 ml-1">{t.bankAccount}</label>
                                      <textarea 
                                        value={landlordAd.bankAccount} 
                                        onChange={(e) => setLandlordAd({...landlordAd, bankAccount: e.target.value})} 
                                        placeholder="БИК, Корр. счет, Номер счета..." 
                                        className="w-full p-4 bg-purple-50 rounded-2xl text-sm border border-purple-100 h-24 resize-none"
                                      />
                                    </div>
                                  </motion.div>
                                )}

                                {landlordAd.category === 'social' && (
                                  <motion.div
                                    key="social-section"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="space-y-6"
                                  >
                                    <div className="grid grid-cols-2 gap-4">
                                      <div className="space-y-2">
                                        <label className="text-[10px] font-bold uppercase tracking-widest opacity-40 ml-1">Откуда</label>
                                        <input type="text" value={landlordAd.routeFrom} onChange={(e) => setLandlordAd({...landlordAd, routeFrom: e.target.value})} placeholder="Симферополь" className="w-full p-4 bg-purple-50 rounded-2xl text-sm border border-purple-100" />
                                      </div>
                                      <div className="space-y-2">
                                        <label className="text-[10px] font-bold uppercase tracking-widest opacity-40 ml-1">Куда</label>
                                        <input type="text" value={landlordAd.routeTo} onChange={(e) => setLandlordAd({...landlordAd, routeTo: e.target.value})} placeholder="Ялта" className="w-full p-4 bg-purple-50 rounded-2xl text-sm border border-purple-100" />
                                      </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                      <div className="space-y-2">
                                        <label className="text-[10px] font-bold uppercase tracking-widest opacity-40 ml-1">{t.dateTime}</label>
                                        <input type="datetime-local" value={landlordAd.dateTime} onChange={(e) => setLandlordAd({...landlordAd, dateTime: e.target.value})} className="w-full p-4 bg-purple-50 rounded-2xl text-sm border border-purple-100" />
                                      </div>
                                      <div className="space-y-2">
                                        <label className="text-[10px] font-bold uppercase tracking-widest opacity-40 ml-1">{t.purpose}</label>
                                        <select 
                                          value={landlordAd.purpose}
                                          onChange={(e) => setLandlordAd({...landlordAd, purpose: e.target.value})}
                                          className="w-full p-4 bg-purple-50 rounded-2xl text-sm border border-purple-100 appearance-none"
                                        >
                                          <option value="split_costs">Разделить расходы</option>
                                          <option value="company">Веселая компания</option>
                                          <option value="guide">Поиск гида в складчину</option>
                                        </select>
                                      </div>
                                    </div>
                                  </motion.div>
                                )}
                              </AnimatePresence>

                              {/* Common Media Section */}
                              <div className="space-y-4">
                                <label className="text-[10px] font-bold uppercase tracking-widest opacity-40 ml-1">{t.photos}</label>
                                <div className="grid grid-cols-4 gap-2">
                                  <button className="aspect-square bg-purple-50 rounded-2xl border border-dashed border-purple-200 flex flex-col items-center justify-center text-purple-400 hover:bg-purple-100 transition-colors">
                                    <Camera size={20} />
                                    <span className="text-[8px] font-bold mt-1">ADD</span>
                                  </button>
                                  {[1, 2, 3].map(i => (
                                    <div key={i} className="aspect-square bg-black/5 rounded-2xl overflow-hidden relative group">
                                      <img src={LOCAL_FALLBACK_IMAGES[i % LOCAL_FALLBACK_IMAGES.length]} alt="Preview" className="w-full h-full object-cover opacity-50" />
                                      <button className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Trash2 size={16} className="text-white" />
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              {/* Booking Settings */}
                              <div className="p-6 bg-black/5 rounded-[32px] space-y-6">
                                <div className="flex items-center justify-between">
                                  <div className="space-y-1">
                                    <h4 className="text-sm font-bold">{t.instantBooking}</h4>
                                    <p className="text-[10px] opacity-40 uppercase tracking-widest">Подтверждение без участия владельца</p>
                                  </div>
                                  <button 
                                    onClick={() => setLandlordAd({ ...landlordAd, instantBooking: !landlordAd.instantBooking })}
                                    className={`w-12 h-6 rounded-full transition-colors relative ${landlordAd.instantBooking ? 'bg-purple-600' : 'bg-black/20'}`}
                                  >
                                    <motion.div 
                                      animate={{ x: landlordAd.instantBooking ? 26 : 2 }}
                                      className="absolute top-1 left-0 w-4 h-4 bg-white rounded-full shadow-sm"
                                    />
                                  </button>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                  <div className="space-y-2">
                                    <label className="text-[10px] font-bold uppercase tracking-widest opacity-40 ml-1">{t.minDuration}</label>
                                    <input 
                                      type="number" 
                                      value={landlordAd.minDuration}
                                      onChange={(e) => setLandlordAd({...landlordAd, minDuration: parseInt(e.target.value)})}
                                      className="w-full p-3 bg-white rounded-xl text-xs border border-black/5"
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <label className="text-[10px] font-bold uppercase tracking-widest opacity-40 ml-1">{t.securityDeposit}</label>
                                    <div className="relative">
                                      <input 
                                        type="number" 
                                        value={landlordAd.deposit}
                                        onChange={(e) => setLandlordAd({...landlordAd, deposit: e.target.value})}
                                        placeholder="0"
                                        className="w-full p-3 bg-white rounded-xl text-xs border border-black/5 pr-8"
                                      />
                                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold opacity-30">₽</span>
                                    </div>
                                  </div>
                                </div>

                                <div className="space-y-2">
                                  <label className="text-[10px] font-bold uppercase tracking-widest opacity-40 ml-1">{t.cancellationPolicy}</label>
                                  <div className="flex gap-2">
                                    {[
                                      { id: 'flexible', name: t.flexible },
                                      { id: 'moderate', name: t.moderate },
                                      { id: 'strict', name: t.strict },
                                    ].map(policy => (
                                      <button
                                        key={policy.id}
                                        onClick={() => setLandlordAd({ ...landlordAd, cancellationPolicy: policy.id })}
                                        className={`flex-1 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all border ${
                                          landlordAd.cancellationPolicy === policy.id
                                            ? 'bg-purple-600 text-white border-purple-600'
                                            : 'bg-white text-black/40 border-black/5'
                                        }`}
                                      >
                                        {policy.name}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              </div>

                              <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                  <label className="text-[10px] font-bold uppercase tracking-widest opacity-40 ml-1">{t.adDescription}</label>
                                  <button onClick={() => handleFieldVoiceInput('description')} className="p-1.5 hover:bg-purple-50 rounded-lg text-purple-600 transition-colors">
                                    <Mic size={14} />
                                  </button>
                                </div>
                                <textarea 
                                  value={landlordAd.description}
                                  onChange={(e) => setLandlordAd({...landlordAd, description: e.target.value})}
                                  placeholder="..."
                                  className="w-full p-4 bg-purple-50 rounded-2xl text-sm focus:outline-none focus:ring-1 focus:ring-purple-200 border border-purple-100 min-h-[120px] resize-none"
                                />
                              </div>

                              <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                  <label className="text-[10px] font-bold uppercase tracking-widest opacity-40 ml-1">{t.nearbyNotes}</label>
                                  <button onClick={() => handleFieldVoiceInput('nearby')} className="p-1.5 hover:bg-purple-50 rounded-lg text-purple-600 transition-colors">
                                    <Mic size={14} />
                                  </button>
                                </div>
                                <textarea 
                                  value={landlordAd.nearby}
                                  onChange={(e) => setLandlordAd({...landlordAd, nearby: e.target.value})}
                                  placeholder="..."
                                  className="w-full p-4 bg-purple-50 rounded-2xl text-sm focus:outline-none focus:ring-1 focus:ring-purple-200 border border-purple-100 min-h-[100px] resize-none"
                                />
                              </div>

                              {/* Photos Grid */}
                              <div className="space-y-2">
                                <label className="text-[10px] font-bold uppercase tracking-widest opacity-40 ml-1">{t.photos}</label>
                                <div className="grid grid-cols-5 gap-2">
                                  {Array.from({ length: 15 }).map((_, i) => (
                                    <div key={i} className="aspect-square bg-purple-50 rounded-xl border border-dashed border-purple-200 flex items-center justify-center cursor-pointer hover:bg-purple-100 transition-colors group">
                                      <Camera size={16} className="opacity-20 group-hover:opacity-40 transition-opacity" />
                                    </div>
                                  ))}
                                </div>
                              </div>

                              {/* Videos Section */}
                              <div className="space-y-2">
                                <label className="text-[10px] font-bold uppercase tracking-widest opacity-40 ml-1">{t.videos}</label>
                                <div className="grid grid-cols-2 gap-4">
                                  {Array.from({ length: 2 }).map((_, i) => (
                                    <div key={i} className="p-6 bg-purple-50 rounded-2xl border border-dashed border-purple-200 flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-purple-100 transition-colors group">
                                      <RefreshCw size={24} className="opacity-20 group-hover:opacity-40 transition-opacity" />
                                      <span className="text-[8px] font-bold uppercase tracking-widest opacity-30">до 150 МБ</span>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              <div className="space-y-2">
                                <label className="text-[10px] font-bold uppercase tracking-widest opacity-40 ml-1">{t.availability}</label>
                                <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                                    <span className="text-xs font-bold text-emerald-900">{t.availableNow}</span>
                                  </div>
                                  <button className="text-[10px] font-bold uppercase tracking-widest text-emerald-700 hover:underline">
                                    {t.blockedDates}
                                  </button>
                                </div>
                              </div>

                              <div className="relative">
                                <AnimatePresence>
                                  {showSuccess && (
                                    <motion.div 
                                      initial={{ opacity: 0, y: 10 }}
                                      animate={{ opacity: 1, y: 0 }}
                                      exit={{ opacity: 0, y: -10 }}
                                      className="absolute -top-12 left-0 right-0 p-3 bg-emerald-500 text-white text-center rounded-xl text-[10px] font-bold uppercase tracking-widest shadow-lg"
                                    >
                                      {t.dataCached}
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                                <button 
                                  onClick={handleSaveAd}
                                  className="w-full py-4 bg-[#1A1A1A] text-white rounded-2xl font-bold uppercase tracking-widest text-xs hover:bg-black/80 transition-all shadow-xl"
                                >
                                  {t.saveChanges}
                                </button>
                              </div>
                            </div>
                          </motion.div>
                        )}

                        {activeCabinetTab === 'bookings' && (
                          <motion.div
                            key="bookings-tab"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="space-y-4"
                          >
                            <h4 className="text-[10px] font-bold uppercase tracking-widest opacity-40 ml-1">{t.bookings}</h4>
                            {mockBookings.map(booking => (
                              <div key={booking.id} className="p-6 bg-white border border-black/5 rounded-[32px] flex items-center gap-4">
                                <img src={booking.photo} alt={booking.guest} className="w-12 h-12 rounded-full object-cover" referrerPolicy="no-referrer" />
                                <div className="flex-1">
                                  <div className="text-sm font-bold">{booking.guest}</div>
                                  <div className="text-[10px] opacity-40">{booking.object}</div>
                                  <div className="text-[10px] font-bold text-purple-600">{booking.dates}</div>
                                </div>
                                <div className="text-right">
                                  <div className="text-sm font-bold">₽{booking.price}</div>
                                  <div className={`text-[8px] font-bold uppercase px-2 py-1 rounded-md ${booking.status === 'confirmed' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                                    {booking.status === 'confirmed' ? t.confirmed : t.pending}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </motion.div>
                        )}

                        {activeCabinetTab === 'messages' && (
                          <motion.div
                            key="messages-tab"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="space-y-4"
                          >
                            <h4 className="text-[10px] font-bold uppercase tracking-widest opacity-40 ml-1">{t.messages}</h4>
                            {mockMessages.map(msg => (
                              <div key={msg.id} className="p-6 bg-white border border-black/5 rounded-[32px] flex items-center gap-4 cursor-pointer hover:bg-black/5 transition-colors">
                                <div className="relative">
                                  <img src={msg.photo} alt={msg.user} className="w-12 h-12 rounded-full object-cover" referrerPolicy="no-referrer" />
                                  {msg.unread && <div className="absolute top-0 right-0 w-3 h-3 bg-purple-600 border-2 border-white rounded-full" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex justify-between items-center mb-1">
                                    <div className="text-sm font-bold">{msg.user}</div>
                                    <div className="text-[10px] opacity-40">{msg.time}</div>
                                  </div>
                                  <p className="text-xs opacity-60 truncate">{msg.lastMessage}</p>
                                  {msg.unread && (
                                    <div className="mt-3 flex gap-2">
                                      <input 
                                        type="text" 
                                        placeholder="Написать ответ..."
                                        className="flex-1 px-4 py-2 bg-purple-50 rounded-xl text-[10px] focus:outline-none focus:ring-1 focus:ring-purple-200"
                                        onClick={(e) => e.stopPropagation()}
                                      />
                                      <button 
                                        className="p-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors"
                                        onClick={(e) => e.stopPropagation()}
                                      >
                                        <Send size={12} />
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </motion.div>
                        )}

                        {activeCabinetTab === 'reviews' && (
                          <motion.div
                            key="reviews-tab"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="space-y-8"
                          >
                            {/* Stats Summary */}
                            <div className="grid grid-cols-2 gap-4">
                              <div className="p-6 bg-purple-50 rounded-[32px] border border-purple-100 text-center">
                                <div className="text-3xl font-serif text-purple-600 mb-1">4.8</div>
                                <div className="text-[10px] font-bold uppercase tracking-widest opacity-40">{t.averageRating}</div>
                              </div>
                              <div className="p-6 bg-black/5 rounded-[32px] text-center">
                                <div className="text-3xl font-serif mb-1">{mockReviews.length}</div>
                                <div className="text-[10px] font-bold uppercase tracking-widest opacity-40">{t.totalReviews}</div>
                              </div>
                            </div>

                            {/* Reviews List */}
                            <div className="space-y-4">
                              <h4 className="text-[10px] font-bold uppercase tracking-widest opacity-40 ml-1">{t.clientFeedback}</h4>
                              {mockReviews.map(review => (
                                <div key={review.id} className="p-6 bg-white border border-black/5 rounded-[32px] space-y-4">
                                  <div className="flex justify-between items-start">
                                    <div className="flex items-center gap-3">
                                      <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 font-bold">
                                        {review.user[0]}
                                      </div>
                                      <div>
                                        <div className="text-sm font-bold">{review.user}</div>
                                        <div className="text-[10px] opacity-40">{review.date}</div>
                                      </div>
                                    </div>
                                    <div className="flex gap-0.5">
                                      {Array.from({ length: 5 }).map((_, i) => (
                                        <Star 
                                          key={i} 
                                          size={12} 
                                          className={i < review.rating ? 'fill-purple-600 text-purple-600' : 'text-black/10'} 
                                        />
                                      ))}
                                    </div>
                                  </div>
                                  <p className="text-sm leading-relaxed opacity-70">{review.text}</p>
                                  <div className="flex items-center justify-between pt-2">
                                    <button className="text-[10px] font-bold uppercase tracking-widest text-purple-600 hover:underline">
                                      {t.reply}
                                    </button>
                                    <div className="flex items-center gap-2 opacity-40">
                                      <button className="hover:text-purple-600 transition-colors">
                                        <ThumbsUp size={14} />
                                      </button>
                                      <span className="text-[10px] font-bold">{review.helpful}</span>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </motion.div>
                        )}

                        {activeCabinetTab === 'invoices' && (
                          <motion.div
                            key="invoices-tab"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="space-y-6"
                          >
                            <div className="flex items-center justify-between">
                              <h4 className="text-[10px] font-bold uppercase tracking-widest opacity-40 ml-1">{t.invoices}</h4>
                              <div className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-bold uppercase tracking-widest">
                                {t.fixedFee}: ₽500 / чел.
                              </div>
                            </div>
                            
                            <div className="space-y-4">
                              {[
                                { id: 'INV-001', date: '24.05.2024', guests: 25, status: 'paid', object: 'Вилла "Морской Бриз"' },
                                { id: 'INV-002', date: '22.05.2024', guests: 12, status: 'pending', object: 'Апартаменты в Ялте' },
                                { id: 'INV-003', date: '20.05.2024', guests: 30, status: 'paid', object: 'Гостевой дом "Уют"' },
                              ].map(inv => {
                                const amount = inv.guests * 500;
                                return (
                                  <div key={inv.id} className="p-6 bg-white rounded-[32px] border border-black/5 flex items-center justify-between group hover:border-purple-200 transition-all">
                                    <div className="flex items-center gap-4">
                                      <div className={`p-3 rounded-2xl ${inv.status === 'paid' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                                        <CreditCard size={20} />
                                      </div>
                                      <div>
                                        <div className="flex items-center gap-2 mb-1">
                                          <span className="text-xs font-bold">{inv.id}</span>
                                          <span className={`text-[8px] px-2 py-0.5 rounded-full font-bold uppercase tracking-widest ${inv.status === 'paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                            {inv.status === 'paid' ? 'Оплачено' : 'Ожидает'}
                                          </span>
                                        </div>
                                        <p className="text-[10px] opacity-60">{inv.object} • {inv.guests} {t.guests}</p>
                                        <p className="text-[8px] opacity-40 uppercase font-bold tracking-widest mt-1">{inv.date}</p>
                                      </div>
                                    </div>
                                    <div className="text-right">
                                      <div className="text-sm font-bold mb-2">₽{amount.toLocaleString()}</div>
                                      <button 
                                        onClick={async () => {
                                          if (inv.status === 'paid') {
                                            const JsPDF = await loadJsPdf();
                                            const doc = new JsPDF();
                                            doc.text(`Счет ${inv.id}`, 20, 20);
                                            doc.text(`Объект: ${inv.object}`, 20, 30);
                                            doc.text(`Гостей: ${inv.guests}`, 20, 40);
                                            doc.text(`Сумма (Фикс 500): ${amount} руб.`, 20, 50);
                                            doc.text(`Статус: ОПЛАЧЕНО`, 20, 60);
                                            doc.save(`invoice-${inv.id}.pdf`);
                                          } else {
                                            alert('Переход к оплате...');
                                          }
                                        }}
                                        className="px-4 py-2 bg-[#1A1A1A] text-white rounded-xl text-[8px] font-bold uppercase tracking-widest hover:bg-black/80 transition-all"
                                      >
                                        {inv.status === 'paid' ? 'PDF' : 'Оплатить'}
                                      </button>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </motion.div>
                        )}

                        {activeCabinetTab === 'grants' && (
                          <motion.div
                            key="grants-tab"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="space-y-6"
                          >
                            <div className="flex items-center justify-between">
                              <h4 className="text-[10px] font-bold uppercase tracking-widest opacity-40 ml-1">{t.grants}</h4>
                              <button className="px-4 py-2 bg-purple-600 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-purple-700 transition-all">
                                Подать заявку
                              </button>
                            </div>
                            
                            <div className="space-y-4">
                              {[
                                { id: 'GR-2024-01', type: 'Реновация', amount: 500000, status: 'approved', date: '12.03.2024' },
                                { id: 'GR-2024-02', type: 'Оборудование', amount: 150000, status: 'paid', date: '05.02.2024' },
                              ].map(grant => (
                                <div key={grant.id} className="p-6 bg-white rounded-[32px] border border-black/5 flex items-center justify-between">
                                  <div className="flex items-center gap-4">
                                    <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
                                      <Trophy size={20} />
                                    </div>
                                    <div>
                                      <div className="text-xs font-bold mb-1">{grant.type} • {grant.id}</div>
                                      <div className={`text-[8px] px-2 py-0.5 rounded-full font-bold uppercase tracking-widest inline-block ${grant.status === 'approved' ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'}`}>
                                        {grant.status === 'approved' ? 'Одобрено' : 'Выплачено'}
                                      </div>
                                      <p className="text-[8px] opacity-40 uppercase font-bold tracking-widest mt-1">{grant.date}</p>
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <div className="text-sm font-bold">₽{grant.amount.toLocaleString()}</div>
                                    <button className="text-[8px] font-bold uppercase tracking-widest text-purple-600 hover:underline mt-1">Детали</button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </motion.div>
                        )}

                        {activeCabinetTab === 'standards' && (
                          <motion.div
                            key="standards-tab"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="space-y-6"
                          >
                            <div className="p-6 bg-purple-600 text-white rounded-[32px] shadow-xl shadow-purple-200">
                              <h4 className="text-lg font-serif mb-2">Крымский Стандарт</h4>
                              <p className="text-xs opacity-80 leading-relaxed">Ваш объект соответствует стандарту на 85%. Пройдите аудит для получения знака качества.</p>
                            </div>

                            <div className="space-y-3">
                              {[
                                { label: 'Наличие Wi-Fi во всех номерах', passed: true },
                                { label: 'Система пожарной безопасности', passed: true },
                                { label: 'Доступная среда (пандусы)', passed: false },
                                { label: 'Электронные замки', passed: true },
                                { label: 'Завтрак включен', passed: false },
                              ].map((item, i) => (
                                <div key={i} className="p-4 bg-white rounded-2xl border border-black/5 flex items-center justify-between">
                                  <span className="text-xs font-medium">{item.label}</span>
                                  {item.passed ? (
                                    <CheckCircle2 size={18} className="text-emerald-500" />
                                  ) : (
                                    <div className="w-4 h-4 rounded-full border-2 border-black/10" />
                                  )}
                                </div>
                              ))}
                            </div>
                            
                            <button className="w-full py-4 bg-[#1A1A1A] text-white rounded-2xl font-bold uppercase tracking-widest text-xs hover:bg-black/80 transition-all">
                              Записаться на аудит
                            </button>
                          </motion.div>
                        )}

                        {activeCabinetTab === 'monitoring' && (
                          <motion.div
                            key="monitoring-tab"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="space-y-6"
                          >
                            <div className="grid grid-cols-2 gap-4">
                              <div className="p-6 bg-black text-white rounded-[32px]">
                                <div className="text-2xl font-serif mb-1">45,201</div>
                                <div className="text-[8px] font-bold uppercase tracking-widest opacity-60">Туристов в регионе</div>
                              </div>
                              <div className={`p-6 rounded-[32px] ${userRole === 'inspector' ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'}`}>
                                <div className="text-2xl font-serif mb-1">{userRole === 'inspector' ? '12' : '82%'}</div>
                                <div className="text-[8px] font-bold uppercase tracking-widest opacity-60">{userRole === 'inspector' ? 'Теневых объектов' : 'Загрузка фонда'}</div>
                              </div>
                            </div>

                            {/* Alice Monitoring Section */}
                            <div className="p-6 bg-gradient-to-br from-purple-500/10 to-indigo-500/10 border border-purple-500/20 rounded-[32px] space-y-4">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center text-white">
                                  <Activity size={16} />
                                </div>
                                <div>
                                  <h4 className="text-xs font-bold uppercase tracking-widest">Мониторинг Алисы</h4>
                                  <p className="text-[8px] opacity-60 uppercase tracking-widest font-bold">Яндекс Интеллект активен</p>
                                </div>
                              </div>
                              <div className="space-y-2">
                                <div className="p-3 bg-white/50 backdrop-blur-sm rounded-xl border border-purple-500/10">
                                  <p className="text-[10px] italic opacity-80">"Я проанализировала загрузку отелей в Ялте. Рекомендую увеличить количество инспекций в районе Массандры."</p>
                                </div>
                                <div className="flex gap-2">
                                  <div className="flex-1 h-1 bg-purple-500/20 rounded-full overflow-hidden">
                                    <motion.div 
                                      className="h-full bg-purple-500" 
                                      initial={{ width: 0 }}
                                      animate={{ width: '85%' }}
                                    />
                                  </div>
                                  <span className="text-[8px] font-bold opacity-40">85% точность</span>
                                </div>
                              </div>
                            </div>

                            {userRole === 'ministry' ? (
                              <div className="space-y-4">
                                <h4 className="text-[10px] font-bold uppercase tracking-widest opacity-40 ml-1">{t.heatMap}</h4>
                                <div className="aspect-video bg-purple-50 rounded-[32px] border border-purple-100 flex items-center justify-center relative overflow-hidden">
                                  <div className="absolute inset-0 opacity-20">
                                    <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-red-500 rounded-full blur-3xl animate-pulse" />
                                    <div className="absolute bottom-1/3 right-1/4 w-48 h-48 bg-orange-500 rounded-full blur-3xl animate-pulse" />
                                  </div>
                                  <MapIcon size={48} className="text-purple-200" />
                                  <div className="absolute bottom-4 left-4 right-4 p-3 bg-white/80 backdrop-blur-md rounded-xl text-[8px] font-bold uppercase tracking-widest text-center">
                                    Пиковая нагрузка: Ялта, Алушта
                                  </div>
                                </div>

                                <div className="p-6 bg-white border border-black/5 rounded-[32px] space-y-4">
                                  <h5 className="text-xs font-bold">{t.migrationControl}</h5>
                                  <div className="space-y-2">
                                    {[
                                      { name: 'Иванов А.', status: 'registered', time: '10:15' },
                                      { name: 'Smith J.', status: 'visa_check', time: '09:45' },
                                      { name: 'Petrov K.', status: 'registered', time: '09:20' },
                                    ].map((p, i) => (
                                      <div key={i} className="flex items-center justify-between text-[10px]">
                                        <span className="font-medium">{p.name}</span>
                                        <span className="opacity-40">{p.time}</span>
                                        <span className={`font-bold uppercase tracking-widest ${p.status === 'registered' ? 'text-emerald-600' : 'text-amber-600'}`}>
                                          {p.status === 'registered' ? 'Оформлен' : 'Проверка'}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div className="space-y-4">
                                <h4 className="text-[10px] font-bold uppercase tracking-widest opacity-40 ml-1">{t.shadowMarket}</h4>
                                <div className="space-y-3">
                                  {[
                                    { address: 'ул. Чехова, 15', owner: 'Баба Галя', risk: 'high' },
                                    { address: 'пер. Морской, 3', owner: 'Неизвестно', risk: 'medium' },
                                    { address: 'ул. Пушкина, 42', owner: 'Квартира 5', risk: 'high' },
                                  ].map((obj, i) => (
                                    <div key={i} className="p-4 bg-white rounded-2xl border border-black/5 flex items-center justify-between">
                                      <div>
                                        <div className="text-xs font-bold">{obj.address}</div>
                                        <div className="text-[8px] opacity-40 uppercase tracking-widest font-bold">{obj.owner}</div>
                                      </div>
                                      <button className="px-3 py-1 bg-red-600 text-white rounded-lg text-[8px] font-bold uppercase tracking-widest">Проверить</button>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </motion.div>
                        )}

                        {activeCabinetTab === 'settings' && (
                          <Suspense fallback={<LazyPanelFallback />}>
                            <SettingsPanel />
                          </Suspense>
                        )}

                        {activeCabinetTab === 'fleet' && (
                          <motion.div
                            key="fleet-tab"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="space-y-6"
                          >
                            <div className="flex items-center justify-between">
                              <h4 className="text-[10px] font-bold uppercase tracking-widest opacity-40 ml-1">{t.fleet}</h4>
                              <div className="flex gap-2">
                                <button className="p-2 bg-black/5 rounded-xl hover:bg-black/10 transition-colors"><Plus size={16} /></button>
                                <button className="p-2 bg-black/5 rounded-xl hover:bg-black/10 transition-colors"><RefreshCw size={16} /></button>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 gap-4">
                              {[
                                { model: 'Skoda Octavia', plate: 'А777КР 82', status: 'rented', driver: 'Сергей П.', income: 3500 },
                                { model: 'Hyundai Solaris', plate: 'В123ОМ 82', status: 'available', driver: '-', income: 0 },
                                { model: 'Toyota Camry', plate: 'Е555КХ 82', status: 'maintenance', driver: '-', income: 0 },
                              ].map((car, i) => (
                                <div key={i} className="p-6 bg-white rounded-[32px] border border-black/5 flex items-center justify-between">
                                  <div className="flex items-center gap-4">
                                    <div className={`p-3 rounded-2xl ${car.status === 'rented' ? 'bg-emerald-50 text-emerald-600' : car.status === 'available' ? 'bg-blue-50 text-blue-600' : 'bg-red-50 text-red-600'}`}>
                                      <Car size={20} />
                                    </div>
                                    <div>
                                      <div className="text-xs font-bold mb-1">{car.model} • {car.plate}</div>
                                      <div className="flex gap-2">
                                        <span className={`text-[8px] px-2 py-0.5 rounded-full font-bold uppercase tracking-widest ${car.status === 'rented' ? 'bg-emerald-100 text-emerald-700' : car.status === 'available' ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'}`}>
                                          {car.status === 'rented' ? 'В аренде' : car.status === 'available' ? 'Свободен' : 'ТО'}
                                        </span>
                                        {car.driver !== '-' && <span className="text-[8px] opacity-40 font-bold uppercase tracking-widest">Водитель: {car.driver}</span>}
                                      </div>
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <div className="text-sm font-bold">₽{car.income.toLocaleString()}</div>
                                    <div className="text-[8px] opacity-40 font-bold uppercase tracking-widest">Доход сегодня</div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
            </motion.div>
          </div>
        )}
        {showHero && (
          <motion.div 
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-[#130a26] overflow-hidden"
          >
            <div className="grid grid-cols-3 grid-rows-2 h-full w-full">
              {heroImages.map((img, i) => (
                <div key={i} className="relative overflow-hidden group">
                  {i === 5 ? (
                    <YandexHeroMap />
                  ) : (
                    <>
                      <img 
                        src={img.url} 
                        alt={img.title} 
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />
                    </>
                  )}
                </div>
              ))}
            </div>
            <div className="absolute inset-0 bg-gradient-to-br from-[#120722]/80 via-[#1D1034]/70 to-[#2E1A52]/75" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_22%_18%,rgba(255,214,118,0.22),transparent_42%),radial-gradient(circle_at_82%_84%,rgba(128,83,255,0.34),transparent_38%)]" />
            <div className="absolute inset-0 flex items-center justify-center px-4 sm:px-6 pointer-events-none">
              <motion.div
                initial={{ y: 22, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.25, duration: 0.6 }}
                className="relative w-full max-w-4xl rounded-[36px] border border-white/20 bg-white/12 backdrop-blur-2xl shadow-[0_24px_90px_rgba(12,7,25,0.55)] p-6 sm:p-8 lg:p-10 pointer-events-auto"
              >
                <div className="absolute -top-16 -right-10 w-44 h-44 bg-amber-300/25 rounded-full blur-3xl" />
                <div className="absolute -bottom-20 -left-12 w-52 h-52 bg-violet-500/30 rounded-full blur-3xl" />

                <div className="relative flex flex-col gap-8">
                  <div className="flex items-center gap-4 sm:gap-5">
                    <div className="shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white/90 p-2 shadow-xl">
                      <img
                        src="/android-chrome-192x192.png"
                        alt="Герб Крыма"
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.32em] text-white/65 mb-2">
                        Туристическая экосистема
                      </p>
                      <h1 className="text-white text-3xl sm:text-5xl lg:text-6xl font-serif leading-[0.95] tracking-tight">
                        Навигатор Крыма
                      </h1>
                    </div>
                  </div>

                  <p className="text-white/80 text-sm sm:text-base lg:text-lg uppercase tracking-[0.24em] font-light">
                    Исследуй лучшее
                  </p>

                  <div className="flex flex-wrap gap-2.5 sm:gap-3 text-[10px] sm:text-[11px] font-bold uppercase tracking-widest">
                    <span className="px-3 py-1.5 rounded-full bg-white/12 border border-white/20 text-white/85">Море и горы</span>
                    <span className="px-3 py-1.5 rounded-full bg-white/12 border border-white/20 text-white/85">Жилье и маршруты</span>
                    <span className="px-3 py-1.5 rounded-full bg-white/12 border border-white/20 text-white/85">Алиса и рекомендации</span>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                    <button
                      onClick={() => setShowHero(false)}
                      className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-[#7A12FF] to-[#4A2DFF] text-white rounded-2xl font-bold uppercase tracking-[0.2em] text-xs hover:brightness-110 active:scale-[0.99] transition-all shadow-2xl shadow-violet-700/35"
                    >
                      Начать путешествие
                    </button>
                    <button
                      onClick={() => {
                        setShowHero(false);
                        setShowPresentation(true);
                      }}
                      className="w-full sm:w-auto px-8 py-4 rounded-2xl border border-white/35 bg-white/10 text-white font-bold uppercase tracking-[0.2em] text-xs hover:bg-white/18 transition-colors"
                    >
                      Концепция проекта
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Presentation / Grant Concept View */}
      <AnimatePresence>
        {showCompanionFinder && (
          <div className="fixed inset-0 z-[95] flex items-center justify-center p-3 md:p-6 lg:p-8">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCompanionFinder(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.96, x: -80 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.96, x: -80 }}
              className="relative w-full max-w-6xl h-[min(88vh,960px)] bg-white rounded-[32px] border border-black/10 shadow-2xl overflow-hidden"
            >
              <Suspense fallback={<LazyPanelFallback />}>
                <CompanionFinder 
                  onClose={() => setShowCompanionFinder(false)} 
                  userProfile={userProfile}
                />
              </Suspense>
            </motion.div>
          </div>
        )}
        {showPresentation && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-[#050505] text-white overflow-y-auto custom-scrollbar selection:bg-purple-500"
          >
            <button 
              onClick={() => setShowPresentation(false)}
              className="fixed top-8 right-8 z-[110] p-4 bg-white/10 hover:bg-white/20 rounded-full backdrop-blur-md transition-all border border-white/10"
            >
              <X size={32} />
            </button>

            {/* Hero Section - The Game Concept */}
            <section className="min-h-screen flex flex-col items-center justify-center p-8 relative overflow-hidden">
              <div className="absolute inset-0">
                <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-purple-600/20 rounded-full blur-[160px] animate-pulse" />
                <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-blue-600/20 rounded-full blur-[160px] animate-pulse" />
              <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_1px_1px,rgba(0,0,0,0.28)_1px,transparent_0)] [background-size:14px_14px]" />
              </div>

              <motion.div 
                initial={{ y: 50, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                className="text-center relative z-10"
              >
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500/10 border border-purple-500/20 rounded-full mb-12"
                >
                  <Gamepad2 size={16} className="text-purple-400" />
                  <span className="text-purple-400 font-mono text-[10px] tracking-[0.3em] uppercase font-bold">Interactive Experience 2026</span>
                </motion.div>
                
                <h1 className="text-[12vw] font-serif leading-[0.85] uppercase tracking-tighter mb-12">
                  Больше чем <br/>
                  <span className="italic font-light text-purple-400">Сервис</span>
                </h1>
                
                <p className="text-xl md:text-3xl font-light max-w-3xl mx-auto leading-tight opacity-80 mb-12">
                  Навигатор Крым — это интерактивная гонка по интересам, где каждое путешествие открывает новые грани полуострова и самого себя.
                </p>

                <div className="flex flex-wrap justify-center gap-6">
                  <div className="flex items-center gap-3 px-6 py-3 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-md">
                    <Zap size={20} className="text-amber-400" />
                    <span className="text-sm font-bold uppercase tracking-widest">Интерактив</span>
                  </div>
                  <div className="flex items-center gap-3 px-6 py-3 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-md">
                    <Target size={20} className="text-emerald-400" />
                    <span className="text-sm font-bold uppercase tracking-widest">Открытия</span>
                  </div>
                  <div className="flex items-center gap-3 px-6 py-3 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-md">
                    <Users size={20} className="text-blue-400" />
                    <span className="text-sm font-bold uppercase tracking-widest">Комьюнити</span>
                  </div>
                </div>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.5 }}
                className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-40"
              >
                <span className="text-[10px] uppercase tracking-widest font-bold">Погрузиться в идею</span>
                <div className="w-px h-12 bg-gradient-to-b from-white to-transparent" />
              </motion.div>
            </section>

            {/* The "Unopened Possibilities" Concept */}
            <section className="py-32 px-8 max-w-7xl mx-auto">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-24 items-center">
                <div className="relative">
                  <div className="absolute -inset-4 bg-purple-600/20 blur-3xl rounded-full" />
                  <div className="relative grid grid-cols-3 gap-4 p-8 bg-white/5 border border-white/10 rounded-[48px] backdrop-blur-xl overflow-hidden group">
                    {Array.from({ length: 9 }).map((_, i) => (
                      <motion.div 
                        key={i}
                        initial={{ opacity: 0.2, scale: 0.9 }}
                        whileInView={{ 
                          opacity: [0.2, 0.5, 0.2], 
                          scale: [0.9, 0.95, 0.9],
                        }}
                        transition={{ 
                          duration: 3, 
                          repeat: Infinity, 
                          delay: i * 0.2 
                        }}
                        className={`aspect-square rounded-2xl flex items-center justify-center border ${i === 4 ? 'bg-purple-600 border-purple-400 shadow-[0_0_30px_rgba(168,85,247,0.4)] opacity-100' : 'bg-white/5 border-white/10'}`}
                      >
                        {i === 4 ? (
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                          >
                            <Sparkles size={24} />
                          </motion.div>
                        ) : (
                          <div className="w-2 h-2 bg-white/20 rounded-full" />
                        )}
                      </motion.div>
                    ))}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-transparent to-transparent pointer-events-none" />
                  </div>
                  <motion.div 
                    initial={{ x: 20, opacity: 0 }}
                    whileInView={{ x: 0, opacity: 1 }}
                    className="absolute -bottom-8 -right-8 p-6 bg-white text-black rounded-3xl shadow-2xl max-w-[240px] z-20"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-2 h-2 bg-purple-600 rounded-full animate-ping" />
                      <div className="text-[10px] font-bold uppercase tracking-widest opacity-40">Обнаружен потенциал</div>
                    </div>
                    <div className="text-sm font-bold leading-tight mb-3">94% ваших предпочтений еще не раскрыты в этом регионе</div>
                    <div className="w-full h-1 bg-gray-100 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        whileInView={{ width: '6%' }}
                        transition={{ duration: 2, ease: "easeOut" }}
                        className="h-full bg-purple-600"
                      />
                    </div>
                  </motion.div>
                </div>
                
                <div className="space-y-12">
                  <h2 className="text-6xl font-serif leading-tight">Гонка за <br/><span className="italic text-purple-400">открытиями</span></h2>
                  <div className="space-y-8 text-xl opacity-70 font-light leading-relaxed">
                    <p>
                      Мы превращаем туризм в увлекательную <span className="text-white font-medium">гонку по интересам.</span> Пользователь не просто ищет жилье — он заполняет карту своего внутреннего мира через призму Крыма.
                    </p>
                    <p>
                      Пустые ячейки в профиле — это не просто отсутствие данных. Это <span className="text-purple-400 italic">непрожитые моменты</span>, которые система подсвечивает, создавая мягкий стимул наверстать упущенное и приоткрыть для себя новые возможности.
                    </p>
                  </div>
                  <div className="flex gap-6">
                    <div className="flex items-center gap-4 group cursor-help">
                      <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-purple-600/20 transition-colors">
                        <Trophy className="text-amber-400" size={20} />
                      </div>
                      <div>
                        <div className="text-[10px] font-bold uppercase tracking-widest opacity-40">Мотивация</div>
                        <div className="text-sm font-bold">Система ачивок</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 group cursor-help">
                      <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-blue-600/20 transition-colors">
                        <Layers className="text-blue-400" size={20} />
                      </div>
                      <div>
                        <div className="text-[10px] font-bold uppercase tracking-widest opacity-40">Прогресс</div>
                        <div className="text-sm font-bold">Уровни исследователя</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Community & Collaboration */}
            <section className="py-32 px-8 bg-white/5 relative overflow-hidden">
              <div className="absolute inset-0 opacity-5">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(circle,white_1px,transparent_1px)] [background-size:40px_40px]" />
              </div>

              <div className="max-w-7xl mx-auto relative z-10">
                <div className="text-center mb-24">
                  <h3 className="text-[10px] uppercase tracking-[0.5em] font-bold opacity-40 mb-6">Коллективный разум</h3>
                  <h2 className="text-7xl font-serif mb-8">Синергия <span className="italic">сообщества</span></h2>
                  <p className="text-2xl font-light opacity-60 max-w-3xl mx-auto">
                    Навигатор Крым — это не просто приложение, это живое комьюнити, где каждый участник помогает другому "открыть" Крым.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <motion.div 
                    whileHover={{ y: -10 }}
                    className="p-12 bg-white/5 border border-white/10 rounded-[48px] hover:bg-white/10 transition-all group"
                  >
                    <Users size={48} className="mb-8 text-purple-400 group-hover:scale-110 transition-transform" />
                    <h4 className="text-3xl font-serif mb-4">Коллаборации</h4>
                    <p className="opacity-60 leading-relaxed">
                      Создавайте совместные квесты, объединяйтесь для посещения закрытых локаций и делитесь уникальным опытом в реальном времени.
                    </p>
                  </motion.div>
                  
                  <motion.div 
                    whileHover={{ y: -10 }}
                    className="p-12 bg-purple-600 rounded-[48px] shadow-2xl shadow-purple-600/20 relative overflow-hidden"
                  >
                    <div className="relative z-10">
                      <Share2 size={48} className="mb-8" />
                      <h4 className="text-3xl font-serif mb-4">Движение знаний</h4>
                      <p className="opacity-90 leading-relaxed">
                        Внутренняя экосистема обмена информацией: ваши открытия помогают другим заполнять их "белые пятна" на карте интересов.
                      </p>
                    </div>
                    <div className="absolute -right-8 -bottom-8 opacity-10">
                      <Share2 size={200} />
                    </div>
                  </motion.div>

                  <motion.div 
                    whileHover={{ y: -10 }}
                    className="p-12 bg-white/5 border border-white/10 rounded-[48px] hover:bg-white/10 transition-all group"
                  >
                    <Sparkles size={48} className="mb-8 text-blue-400 group-hover:scale-110 transition-transform" />
                    <h4 className="text-3xl font-serif mb-4">Развитие через общение</h4>
                    <p className="opacity-60 leading-relaxed">
                      Мы стимулируем социальную активность, превращая обычное общение в инструмент развития сервиса и личного роста каждого туриста.
                    </p>
                  </motion.div>
                </div>
              </div>
            </section>

            {/* Business Value */}
            <section className="py-32 px-8 max-w-7xl mx-auto">
              <div className="bg-gradient-to-br from-purple-900/40 to-blue-900/40 border border-white/10 rounded-[64px] p-16 md:p-24 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-12 opacity-10">
                  <Trophy size={300} />
                </div>
                
                <div className="max-w-3xl relative z-10">
                  <h2 className="text-5xl md:text-7xl font-serif mb-12 leading-tight">Рентабельность через <span className="italic">азарт</span></h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                    <div>
                      <h4 className="text-xl font-bold mb-4 flex items-center gap-2 text-purple-400">
                        <Zap size={20} />
                        LTV & Retention
                      </h4>
                      <p className="opacity-60">
                        Желание "закрыть гештальт" и заполнить все ячейки интересов создает мощный Retention. Пользователь возвращается, чтобы завершить свою личную гонку.
                      </p>
                    </div>
                    <div>
                      <h4 className="text-xl font-bold mb-4 flex items-center gap-2 text-blue-400">
                        <Target size={20} />
                        Привлекательность
                      </h4>
                      <p className="opacity-60">
                        Интерактивная модель превращает рутинный поиск жилья в приключение, делая наш продукт уникальным на рынке и крайне привлекательным для инвесторов.
                      </p>
                    </div>
                  </div>
                  
                  <button 
                    onClick={() => setShowPresentation(false)}
                    className="mt-16 px-12 py-6 bg-white text-black rounded-full font-bold uppercase tracking-[0.2em] text-sm hover:scale-105 transition-all shadow-2xl group"
                  >
                    Начать свою гонку <ChevronRight className="inline-block ml-2 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>
            </section>

            {/* Tech Stack */}
            <section className="py-32 px-8 border-t border-white/5">
              <div className="max-w-4xl mx-auto text-center">
                <h3 className="text-5xl font-serif mb-16 italic">Технологический стек</h3>
                <div className="flex flex-wrap justify-center gap-4">
                  {['React 18+', 'Vite', 'TypeScript', 'Tailwind CSS', 'PostgreSQL/PostGIS', 'Gemini AI', 'Motion', 'Yandex Maps API'].map(tech => (
                    <span key={tech} className="px-8 py-4 bg-white/5 border border-white/10 rounded-full text-sm font-mono tracking-wider hover:bg-white/10 transition-colors cursor-default">
                      {tech}
                    </span>
                  ))}
                </div>
              </div>
            </section>

            {/* Footer Presentation */}
            <footer className="py-24 px-8 border-t border-white/10 text-center">
              <h1 className="text-4xl font-serif mb-4 opacity-40">Нави<span className="italic">Крым</span></h1>
              <p className="text-[10px] uppercase tracking-[0.5em] opacity-20">Interactive Tourism Ecosystem © 2026</p>
            </footer>

            {/* Footer / Call to Action */}
            <section className="py-32 px-8 text-center border-t border-white/10">
              <h2 className="text-[10vw] font-serif uppercase mb-12">Будущее <br/>Крыма</h2>
              <button 
                onClick={() => setShowPresentation(false)}
                className="px-16 py-6 bg-purple-600 text-white rounded-full font-bold uppercase tracking-[0.3em] text-sm hover:scale-105 transition-all shadow-2xl shadow-purple-500/20"
              >
                Вернуться к приложению
              </button>
              <p className="mt-12 text-[10px] uppercase tracking-widest opacity-30">© 2026 Навигатор Крым — Проект для грантовой поддержки</p>
            </section>
          </motion.div>
        )}
      </AnimatePresence>

      <Suspense fallback={null}>
        <ExternalVoiceAssistant 
          onAction={handleAIAction} 
          currentContext={{ 
            selectedRegion: selectedRegion ?? catalogRegionId,
            routePointsCount: routePoints.length,
            preferences,
            language: lang
          }}
          containerClassName="hidden"
        />
      </Suspense>

      {/* Navigation Rail */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-xl border-b border-accent-purple/10 px-3 md:px-5 py-2 flex flex-col gap-2">
        <div className="flex items-center justify-between min-h-10 gap-3 flex-wrap">
          <div className="flex items-center gap-2 md:gap-3 shrink-0">
            <div className="flex items-center gap-2 cursor-pointer group" onClick={openRegionsCatalog}>
              <img
                src="/android-chrome-192x192.png"
                alt="Герб Навигатор Крым"
                className="w-7 h-7 object-contain drop-shadow-md group-hover:scale-110 transition-transform"
              />
              <span className="font-bold tracking-tight text-[1.5rem] md:text-[1.8rem] leading-none logo-gradient whitespace-nowrap">Навигатор Крым</span>
            </div>
          </div>
          <div className="nav-menu flex items-center justify-center gap-1 2xl:gap-2.5 font-semibold text-black/88 flex-wrap flex-1 min-w-0">
            <button 
              onClick={openRegionsCatalog}
              className={`nav-menu-item compact flex items-center gap-2 px-3 py-2 rounded-xl border transition-all ${viewMode === 'grid' && !selectedRegion ? 'border-accent-purple text-accent-purple bg-accent-purple/5' : 'border-accent-purple/15 text-black/62 hover:text-black hover:bg-accent-purple/5'}`}
            >
              <Layers size={14} />
              {t.regions || 'Регионы'}
            </button>
            <button 
              onClick={() => setShowRoutePlanner(!showRoutePlanner)}
              className={`nav-menu-item compact transition-all flex items-center gap-2 px-3 py-2 rounded-xl border ${showRoutePlanner ? 'border-accent-purple text-accent-purple bg-accent-purple/5' : 'border-transparent hover:bg-black/5'}`}
            >
              {t.routes}
              {isVip && (
                <span className="bg-amber-400 text-amber-900 px-1.5 py-0.5 rounded text-[8px] font-black tracking-tighter shadow-sm">
                  VIP
                </span>
              )}
              {routePoints.length > 0 && (
                <span className="bg-purple-600 text-white w-4 h-4 rounded-full flex items-center justify-center text-[8px] animate-pulse">
                  {routePoints.length}
                </span>
              )}
            </button>
            <button 
              onClick={() => {
                setShowImpressions(true);
                setShowRoutePlanner(false);
                setShowCompanionFinder(false);
              }}
              className={`nav-menu-item compact transition-all flex items-center gap-2 px-3 py-2 rounded-xl border ${showImpressions ? 'border-accent-purple text-accent-purple bg-accent-purple/5' : 'border-transparent hover:bg-black/5'}`}
            >
              {t.experiences}
            </button>
            <button 
              onClick={() => setShowCompanionFinder(true)}
              className={`nav-menu-item compact transition-all flex items-center gap-2 px-3 py-2 rounded-xl border ${showCompanionFinder ? 'border-accent-purple text-accent-purple bg-accent-purple/5' : 'border-transparent hover:bg-black/5'}`}
            >
              {t.findCompanion}
            </button>

            <div className="hidden lg:block">
              <button 
                onClick={() => setShowPartnerMenu(!showPartnerMenu)}
                className={`nav-meta nav-pill flex items-center gap-2 px-3 py-2 rounded-xl font-semibold transition-all border bg-white whitespace-nowrap ${showPartnerMenu ? 'border-accent-purple text-accent-purple' : 'border-accent-purple/15 text-black/70 hover:text-black hover:border-accent-purple/30'}`}
              >
                <Handshake size={14} />
                {t.partnerProgram}
                <ChevronDown size={12} className={`transition-transform ${showPartnerMenu ? 'rotate-180' : ''}`} />
              </button>
            </div>

            <div>
              <button 
                onClick={() => setShowSettingsMenu(!showSettingsMenu)}
                className={`nav-meta nav-pill flex items-center gap-2 px-3 py-2 rounded-xl font-semibold transition-all border bg-white whitespace-nowrap ${showSettingsMenu ? 'border-accent-purple text-accent-purple' : 'border-accent-purple/15 text-black/70 hover:text-black hover:border-accent-purple/30'}`}
              >
                <User size={14} />
                <span>Настройки</span>
                <ChevronDown size={12} className={`transition-transform ${showSettingsMenu ? 'rotate-180' : ''}`} />
              </button>
            </div>
          </div>
        </div>

        {/* Booking-style Search Bar */}
        <div className="hidden lg:flex items-center gap-3 pb-1">
          <button
            onClick={toggleAssistantPanel}
            className="w-16 h-14 shrink-0 rounded-2xl flex items-center justify-center bg-accent-purple text-white shadow-2xl shadow-accent-purple/30 border border-accent-purple/20 transition-all hover:scale-[1.02]"
            title={assistantOpen ? 'Закрыть Алису' : 'Открыть Алису'}
          >
            <Sparkles size={26} />
          </button>
          <button
            onClick={() =>
              window.open(
                'https://yandex.ru/maps/?ll=34.102417%2C45.317338&z=8',
                '_blank',
                'noopener,noreferrer'
              )
            }
            className="w-16 h-14 shrink-0 rounded-2xl flex items-center justify-center bg-white text-accent-purple shadow-lg border border-accent-purple/20 transition-all hover:scale-[1.02]"
            title="Открыть Яндекс Карты (Крым)"
          >
            <MapIcon size={24} />
          </button>

          <div className="flex items-center bg-white border-2 border-amber-400 rounded-xl overflow-hidden shadow-lg flex-1 min-w-0">
            <div 
              className="relative flex items-center px-4 border-r border-gray-200 flex-1"
              onClick={() => setShowDestinationPicker(true)}
            >
              <MapPin size={18} className="text-gray-400 mr-3" />
              <input 
                type="text" 
                placeholder="Куда вы хотите поехать?" 
                className="w-full py-3 text-[11px] font-bold uppercase tracking-widest focus:outline-none placeholder:text-gray-400"
                value={searchDestination}
                onChange={(e) => {
                  setSearchDestination(e.target.value);
                  setShowDestinationPicker(true);
                }}
                onFocus={() => setShowDestinationPicker(true)}
              />
              <AnimatePresence>
                {showDestinationPicker && <DestinationPicker />}
              </AnimatePresence>
            </div>
            <div className="relative flex items-center px-4 border-r border-gray-200 cursor-pointer hover:bg-gray-50 flex-1" onClick={() => setShowDatePicker(true)}>
              <Calendar size={18} className="text-gray-400 mr-3" />
              <div className="flex flex-col py-3 overflow-hidden">
                <span className="text-[11px] font-bold uppercase tracking-widest text-gray-600 whitespace-nowrap">
                  {startDate && endDate 
                    ? `${formatDate(startDate)} — ${formatDate(endDate)}`
                    : 'Дата заезда — Дата отъезда'}
                </span>
                {startDate && endDate && (
                  <span className="text-[8px] text-emerald-600 font-bold uppercase tracking-widest">
                    {calculateNights(startDate, endDate)} {calculateNights(startDate, endDate) === 1 ? 'ночь' : 'ночи'}
                  </span>
                )}
              </div>
              <AnimatePresence>
                {showDatePicker && <DatePicker />}
              </AnimatePresence>
            </div>
            <div className="flex items-center px-4 border-r border-gray-200 cursor-pointer hover:bg-gray-50 flex-1">
              <Users size={18} className="text-gray-400 mr-3" />
              <span className="py-3 text-[11px] font-bold uppercase tracking-widest text-gray-600 whitespace-nowrap">
                2 взрослых · 0 детей · 1 номер
              </span>
            </div>
            <button 
              onClick={() => setSearchQuery(searchDestination)}
              className="bg-blue-600 text-white px-10 py-3 font-bold uppercase tracking-widest text-[11px] hover:bg-blue-700 transition-colors inline-flex items-center justify-center gap-2"
            >
              <Calendar size={14} />
              Забронировать
            </button>
          </div>
        </div>
      </nav>

      <AnimatePresence>
        {showPartnerMenu && (
          <div className="fixed inset-0 z-[205] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowPartnerMenu(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.96, x: -80 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.96, x: -80 }}
              className="relative w-full max-w-md max-h-[88vh] overflow-y-auto custom-scrollbar bg-white rounded-[28px] border border-black/10 shadow-2xl py-2"
              onClick={(e) => e.stopPropagation()}
            >
              {(['tourist', 'hotelier', 'ministry', 'inspector'] as const).map(role => (
                <button
                  key={role}
                  onClick={() => {
                    setUserRole(role);
                    setShowPartnerMenu(false);
                    if (role !== 'tourist') {
                      setShowCabinet(true);
                      setShowLandlordForm(true);
                      if (role === 'ministry' || role === 'inspector') setActiveCabinetTab('monitoring');
                      else setActiveCabinetTab('listings');
                    }
                  }}
                  className={`w-full px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest transition-colors flex items-center justify-between ${userRole === role ? 'bg-accent-purple/10 text-accent-purple' : 'hover:bg-black/5 text-black/70'}`}
                >
                  <div className="flex items-center gap-3">
                    {role === 'tourist' && <User size={14} />}
                    {role === 'hotelier' && <Briefcase size={14} />}
                    {role === 'ministry' && <ShieldCheck size={14} />}
                    {role === 'inspector' && <Search size={14} />}
                    {t[role]}
                  </div>
                  {userRole === role && <Check size={12} />}
                </button>
              ))}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showSettingsMenu && (
          <div className="fixed inset-0 z-[205] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSettingsMenu(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.96, x: -80 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.96, x: -80 }}
              className="relative w-full max-w-md max-h-[88vh] overflow-y-auto custom-scrollbar bg-white rounded-[28px] border border-black/10 shadow-2xl py-2"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => {
                  setShowCabinet(true);
                  setShowSettingsMenu(false);
                }}
                className="w-full text-left px-4 py-3 text-[10px] font-bold uppercase tracking-widest hover:bg-black/5 transition-colors flex items-center gap-3 text-black/70"
              >
                <User size={14} />
                Личные сведения
              </button>
              <button
                onClick={() => {
                  setShowAboutUs(true);
                  setShowSettingsMenu(false);
                }}
                className="w-full text-left px-4 py-3 text-[10px] font-bold uppercase tracking-widest hover:bg-black/5 transition-colors flex items-center gap-3 text-black/70"
              >
                <Info size={14} />
                {t.aboutUs}
              </button>
              <a
                href="#"
                onClick={() => setShowSettingsMenu(false)}
                className="w-full px-4 py-3 text-[10px] font-bold uppercase tracking-widest hover:bg-black/5 transition-colors flex items-center gap-3 text-black/70"
              >
                <ShieldCheck size={14} />
                {t.safety}
              </a>
              <div className="px-4 py-3 border-t border-black/5 space-y-2">
                <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-widest text-black/70">
                  <Globe size={14} />
                  <span>Язык ({languages.find(l => l.code === lang)?.native})</span>
                </div>
                <div>
                  <label htmlFor="settings-language-select" className="sr-only">
                    Выбор языка
                  </label>
                  <select
                    id="settings-language-select"
                    value={lang}
                    onChange={(event) => setLang(event.target.value)}
                    className="w-full px-3 py-2 rounded-xl text-[11px] font-bold uppercase tracking-wide border border-black/10 bg-white text-black/70 focus:outline-none focus:ring-2 focus:ring-accent-purple/40 focus:border-accent-purple/30"
                  >
                    {languages.map((l) => (
                      <option key={l.code} value={l.code}>
                        {l.native}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <button
                onClick={() => {
                  void downloadForOffline();
                  setShowSettingsMenu(false);
                }}
                disabled={isCaching || isOffline}
                className="w-full text-left px-4 py-3 text-[10px] font-bold uppercase tracking-widest hover:bg-black/5 transition-colors flex items-center gap-3 text-black/70 disabled:opacity-50"
              >
                {isCaching ? <RefreshCw size={14} className="animate-spin" /> : <CloudDownload size={14} />}
                Скачать для оффлайн
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <main className="pt-28 lg:pt-32 min-h-screen bg-white flex flex-col md:flex-row">
        {/* Impressions Sidebar */}
        <AnimatePresence>
          {showImpressions && (
            <div className="fixed inset-0 z-[95] flex items-center justify-center p-3 md:p-6 lg:p-8">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowImpressions(false)}
                className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.96, x: -80 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.96, x: -80 }}
                className="relative w-full max-w-5xl h-[min(88vh,920px)] bg-white rounded-[32px] border border-black/10 shadow-2xl overflow-hidden"
              >
                <Suspense fallback={<LazyPanelFallback />}>
                  <ImpressionsManager 
                    visitedPlaces={visitedPlaces}
                    impressions={impressions}
                    onAddImpression={(imp) => setImpressions(prev => [...prev, imp])}
                    onSyncYandex={() => {
                      // Simulate syncing with Yandex
                      console.log("Syncing with Yandex...");
                    }}
                    isYandexLinked={userProfile.verifications.yandex}
                    onClose={() => setShowImpressions(false)}
                  />
                </Suspense>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
        <AnimatePresence>
          {showRoutePlanner && (
            <div className="fixed inset-0 z-[95] flex items-center justify-center p-3 md:p-6 lg:p-8">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowRoutePlanner(false)}
                className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.96, x: -80 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.96, x: -80 }}
                className="relative w-full max-w-5xl h-[min(88vh,920px)] bg-white rounded-[32px] border border-black/10 shadow-2xl overflow-hidden"
              >
                <Suspense fallback={<LazyPanelFallback />}>
                  <AIVoiceRoutePlanner 
                    isVip={isVip}
                    onClose={() => setShowRoutePlanner(false)}
                    onRouteGenerated={(route: any) => {
                      setRoutePoints(route.stops);
                      // Optionally set selected object to first stop
                      if (route.stops.length > 0) {
                        setSelectedObject(route.stops[0]);
                      }
                    }}
                  />
                </Suspense>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Left Sidebar - Hidden on mobile, moved to bottom of feed */}
        {/* Center - Regions Grid or Region Details or Simplified List */}
        <div className="flex-1 bg-white p-4 md:p-8 lg:pr-4">
          <AnimatePresence mode="wait">
            {selectedRegion ? (
              <motion.div
                key="region-details"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-8"
              >
                <div className="flex items-center justify-between">
                  <h2 className="text-4xl font-serif">{CRIMEA_REGIONS.find(r => r.id === selectedRegion)?.name}</h2>
                  <button 
                    onClick={() => {
                      setSelectedRegion(null);
                      setCatalogRegionId(null);
                    }}
                    className="px-6 py-2 bg-purple-50 text-purple-600 rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-purple-100 transition-colors"
                  >
                    {t.backToRegions}
                  </button>
                </div>

                {/* Region Gallery - 18 Photos */}
                <div className="space-y-4">
                  <h3 className="text-xl font-serif opacity-60">Галерея региона и жилья</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                    {regionGallery.map((item) => (
                      <motion.div
                        key={item.id}
                        whileHover={{ scale: 1.02 }}
                        onClick={() => item.type === 'property' && setSelectedObject(item.originalObj)}
                        className="relative aspect-square rounded-2xl overflow-hidden cursor-pointer group shadow-sm"
                      >
                        <img 
                          src={item.url} 
                          alt={item.title} 
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
                          referrerPolicy="no-referrer"
                          onError={(event) => handleImageFallback(event, item.fallback || LOCAL_FALLBACK_IMAGES[0])}
                        />
                        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                          <span className="text-[8px] text-white font-bold uppercase tracking-widest truncate">{item.title}</span>
                        </div>
                        {item.type === 'property' && (
                          <div className="absolute top-2 right-2 px-1.5 py-0.5 bg-purple-600 text-white text-[6px] font-bold uppercase tracking-tighter rounded-md shadow-lg">
                            Жилье
                          </div>
                        )}
                      </motion.div>
                    ))}
                  </div>
                </div>
                
                <div className="pt-8 border-t border-black/5">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredObjects.map(obj => (
                      <motion.div 
                        key={obj.id}
                        onClick={() => setSelectedObject(obj)}
                        className="group cursor-pointer bg-white rounded-3xl overflow-hidden border border-black/5 hover:shadow-xl transition-all"
                      >
                        <div className="aspect-video relative overflow-hidden">
                          <img src={obj.image_url} alt={obj.name} className="w-full h-full object-cover transition-transform group-hover:scale-105" referrerPolicy="no-referrer" />
                        </div>
                        <div className="p-6">
                          <h3 className="text-lg font-serif mb-2">{obj.name}</h3>
                          <p className="text-xs opacity-60 line-clamp-2 mb-4">{obj.description}</p>
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-bold">₽{obj.price_per_night} / {t.night}</span>
                            <div className="flex items-center gap-1 text-amber-500">
                              <Star size={14} fill="currentColor" />
                              <span className="text-xs font-bold">4.9</span>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="catalog-content"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-6"
              >
                {!showHero && (
                  <section
                    ref={assistantSectionRef}
                    className={`max-w-5xl mx-auto mb-4 ${assistantOpen ? '' : 'hidden'}`}
                  >
                    <div className="rounded-[40px] border border-black/5 bg-gradient-to-br from-white via-[#FCFAFF] to-[#F3EEFF] shadow-xl shadow-accent-purple/5 p-6 md:p-8">
                      <div className="flex items-center justify-between gap-4 mb-6">
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-accent-purple/60 mb-2">Голосовой помощник</p>
                          <h2 className="text-3xl md:text-4xl font-serif leading-none">Алиса для Навигатор Крым</h2>
                        </div>
                        <div className="hidden md:flex w-14 h-14 rounded-2xl bg-accent-purple text-white items-center justify-center shadow-lg shadow-accent-purple/20">
                          <Sparkles size={26} />
                        </div>
                      </div>
                      <Suspense fallback={null}>
                        <ExternalVoiceAssistant 
                          onAction={handleAIAction}
                          currentContext={{ 
                            selectedRegion: selectedRegion ?? catalogRegionId,
                            routePointsCount: routePoints.length,
                            preferences,
                            language: lang
                          }}
                          embedded
                          title="Алиса"
                          containerClassName="relative"
                          panelClassName="relative w-full bg-white/80 backdrop-blur-sm rounded-[32px] shadow-none border border-accent-purple/10 overflow-hidden"
                        />
                      </Suspense>
                    </div>
                  </section>
                )}
                {assistantResults && (
                  <section className="max-w-5xl mx-auto rounded-[32px] border border-black/5 bg-white p-6 md:p-8 shadow-sm">
                    <div className="flex items-center justify-between mb-8 gap-4">
                      <div>
                        <h2 className="text-3xl font-serif uppercase tracking-tighter">Результаты подбора</h2>
                        <p className="text-[10px] font-bold uppercase tracking-widest opacity-40 mt-2">
                          {assistantResults.query ? `Запрос: ${assistantResults.query}` : 'Подобрано по диалогу с Алисой'}
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          setAssistantResults(null);
                          setSearchQuery('');
                          setBudgetMax(null);
                          setSelectedRegion(null);
                          setCatalogRegionId(null);
                          setSelectedObject(null);
                          setViewMode('grid');
                        }}
                        className="px-4 py-2 rounded-xl border border-black/10 text-[10px] font-bold uppercase tracking-widest hover:bg-black/5 transition-colors"
                      >
                        Сбросить подбор
                      </button>
                    </div>

                    <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.6fr)_minmax(320px,0.9fr)] gap-6">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h3 className="text-xl font-serif">В базе Навигатор Крым</h3>
                          <div className="text-[10px] font-bold uppercase tracking-widest opacity-40">
                            Найдено: {assistantMatchedObjects.length}
                          </div>
                        </div>
                        <div className="space-y-4">
                          {assistantMatchedObjects.map(obj => (
                            <motion.div
                              key={`assistant-result-${obj.id}`}
                              onClick={() => setSelectedObject(obj)}
                              className="p-6 bg-white rounded-2xl border border-black/5 hover:border-accent-purple/30 hover:shadow-lg transition-all cursor-pointer group"
                            >
                              <div className="flex justify-between items-start mb-2 gap-4">
                                <div>
                                  <h3 className="text-xl font-serif group-hover:text-accent-purple transition-colors">{obj.name}</h3>
                                  <p className="text-[10px] uppercase font-bold opacity-40 tracking-widest mt-1">{obj.type}</p>
                                </div>
                                <div className="text-right shrink-0">
                                  <div className="text-lg font-bold">₽{obj.price_per_night}</div>
                                  <div className="text-[8px] uppercase font-bold opacity-40 tracking-widest">за {t.night}</div>
                                </div>
                              </div>
                              <p className="text-sm opacity-60 mb-4 leading-relaxed">{obj.description}</p>
                              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-[10px] font-bold uppercase tracking-widest opacity-60">
                                <div className="flex items-center gap-2">
                                  <MapPin size={12} className="text-accent-purple" />
                                  {CRIMEA_REGIONS.find(r => r.id === obj.region)?.name || obj.region}
                                </div>
                                <div className="flex items-center gap-2">
                                  <Utensils size={12} className="text-blue-500" />
                                  {t.distanceToSea}: {obj.distance_to_sea || '—'}
                                </div>
                                <div className="flex items-center gap-2">
                                  <Car size={12} className="text-emerald-500" />
                                  {t.distanceToStop}: {obj.distance_to_stop || '—'}
                                </div>
                              </div>
                            </motion.div>
                          ))}
                          {assistantMatchedObjects.length === 0 && (
                            <div className="text-center py-10 opacity-40 text-[10px] uppercase font-bold tracking-widest">{t.noObjects}</div>
                          )}
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h3 className="text-xl font-serif">Из интернета и справки</h3>
                          <div className="text-[10px] font-bold uppercase tracking-widest opacity-40">
                            {assistantResults.externalResults.length}
                          </div>
                        </div>
                        <div className="space-y-3">
                          {assistantResults.externalResults.map((item) => (
                            <a
                              key={item.id}
                              href={item.url}
                              target="_blank"
                              rel="noreferrer"
                              className="block p-4 rounded-2xl border border-black/5 hover:border-accent-purple/20 hover:bg-accent-purple/5 transition-colors"
                            >
                              <div className="text-[10px] font-bold uppercase tracking-widest text-accent-purple/70 mb-2">
                                {item.category} · {item.source}
                              </div>
                              <h4 className="text-base font-bold mb-2">{item.title}</h4>
                              <p className="text-sm opacity-60 leading-relaxed">{item.summary}</p>
                            </a>
                          ))}
                          {assistantResults.externalResults.length === 0 && (
                            <div className="text-center py-10 opacity-40 text-[10px] uppercase font-bold tracking-widest">
                              Внешних рекомендаций пока нет
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </section>
                )}

                <section className="max-w-5xl mx-auto rounded-[32px] border border-black/5 bg-white p-6 md:p-8 shadow-sm">
                  <div className="flex items-center justify-between mb-8">
                    <h2 className="text-3xl font-serif uppercase tracking-tighter">
                      {viewMode === 'grid' ? 'Регионы' : 'Результаты каталога'}
                    </h2>
                    <div className="text-[10px] font-bold uppercase tracking-widest opacity-40">
                      {viewMode === 'grid' ? `Регионов: ${CRIMEA_REGIONS.length}` : `Найдено вариантов: ${filteredObjects.length}`}
                    </div>
                  </div>

                  {viewMode === 'grid' ? (
                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                      {CRIMEA_REGIONS.map(region => (
                        <motion.div
                          key={region.id}
                          whileHover={{ y: -4 }}
                          onClick={() => {
                            setCatalogRegionId(null);
                            setSelectedRegion(region.id);
                          }}
                          className="relative aspect-[4/3] rounded-xl md:rounded-[32px] overflow-hidden cursor-pointer group shadow-lg"
                        >
                          <img
                            src={regionCoverById[region.id] || region.image}
                            alt={region.name}
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                            referrerPolicy="no-referrer"
                            onError={(event) => handleImageFallback(event, region.fallbackImage)}
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                          <div className="absolute bottom-3 left-4 md:bottom-6 md:left-6">
                            <h3 className="text-white text-sm md:text-2xl font-serif">{region.name}</h3>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {filteredObjects.map(obj => (
                        <motion.div
                          key={obj.id}
                          onClick={() => setSelectedObject(obj)}
                          className="p-6 bg-white rounded-2xl border border-black/5 hover:border-accent-purple/30 hover:shadow-lg transition-all cursor-pointer group"
                        >
                          <div className="flex justify-between items-start mb-2 gap-4">
                            <div>
                              <h3 className="text-xl font-serif group-hover:text-accent-purple transition-colors">{obj.name}</h3>
                              <p className="text-[10px] uppercase font-bold opacity-40 tracking-widest mt-1">{obj.type}</p>
                            </div>
                            <div className="text-right shrink-0">
                              <div className="text-lg font-bold">₽{obj.price_per_night}</div>
                              <div className="text-[8px] uppercase font-bold opacity-40 tracking-widest">за {t.night}</div>
                            </div>
                          </div>
                          <p className="text-sm opacity-60 mb-4 leading-relaxed">{obj.description}</p>
                          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-[10px] font-bold uppercase tracking-widest opacity-60">
                            <div className="flex items-center gap-2">
                              <MapPin size={12} className="text-accent-purple" />
                              {CRIMEA_REGIONS.find(r => r.id === obj.region)?.name || obj.region}
                            </div>
                            <div className="flex items-center gap-2">
                              <Utensils size={12} className="text-blue-500" />
                              {t.distanceToSea}: {obj.distance_to_sea || '—'}
                            </div>
                            <div className="flex items-center gap-2">
                              <Car size={12} className="text-emerald-500" />
                              {t.distanceToStop}: {obj.distance_to_stop || '—'}
                            </div>
                            <div className="flex items-center gap-2 ml-auto">
                              <Star size={12} className="text-amber-500" fill="currentColor" />
                              4.9
                            </div>
                          </div>
                        </motion.div>
                      ))}
                      {filteredObjects.length === 0 && (
                        <div className="text-center py-10 opacity-40 text-[10px] uppercase font-bold tracking-widest">{t.noObjects}</div>
                      )}
                    </div>
                  )}
                </section>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Mobile-only Bottom Feed - Left Sidebar Content */}
          <div className="md:hidden mt-12 pt-12 border-t border-black/5 space-y-8">
            <div className="space-y-4">
              <h3 className="text-lg font-serif uppercase tracking-widest opacity-40">Поиск и объекты</h3>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 opacity-30" size={14} />
                <input 
                  type="text" 
                  placeholder={isListening ? t.listening : t.search} 
                  className={`w-full pl-8 pr-10 py-3 rounded-xl text-xs focus:outline-none focus:ring-1 transition-all ${isListening ? 'bg-purple-100 ring-2 ring-purple-500 placeholder-purple-700' : 'bg-peach-bg focus:ring-accent-purple/20'}`}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <button 
                  onClick={handleVoiceSearch}
                  className={`absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg transition-all ${isListening ? 'bg-red-500 text-white animate-pulse shadow-lg' : 'hover:bg-black/5 opacity-30'}`}
                >
                  <Mic size={14} />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {loading ? (
                  <div className="col-span-2 flex items-center justify-center h-20 opacity-20">
                    <RefreshCw className="animate-spin" />
                  </div>
                ) : filteredObjects.length === 0 ? (
                  <div className="col-span-2 text-center py-6 opacity-40 text-[10px] uppercase font-bold tracking-widest">{t.noObjects}</div>
                ) : (
                  filteredObjects.slice(0, 6).map(obj => (
                    <motion.div 
                      key={obj.id} 
                      onClick={() => setSelectedObject(obj)}
                      className="group cursor-pointer rounded-xl overflow-hidden border border-black/5"
                    >
                      <div className="aspect-[4/3] relative overflow-hidden">
                        <img src={obj.image_url} alt={obj.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        <div className="absolute top-1 right-1 px-1.5 py-0.5 bg-white/90 backdrop-blur-md rounded-lg text-[6px] font-bold uppercase tracking-widest">
                          ₽{obj.price_per_night}
                        </div>
                      </div>
                      <div className="p-2">
                        <h3 className="text-[8px] font-bold uppercase tracking-tight truncate">{obj.name}</h3>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

      </main>

      {/* Footer / Status Bar */}
      <footer className="bg-white border-t border-black/5 px-4 md:px-6 py-3 flex flex-col gap-2 md:h-8 md:flex-row md:items-center md:justify-between text-[10px] font-medium uppercase tracking-widest opacity-40">
        <div className="flex gap-4 items-center">
          {isOffline ? (
            <div className="flex items-center gap-1 text-red-500 font-bold">
              <WifiOff size={12} />
              <span>{t.offlineMode}</span>
            </div>
          ) : (
            <div className="flex items-center gap-1 text-emerald-600">
              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
              <span>{t.onlineMode}</span>
            </div>
          )}
          <button 
            onClick={handleConsultantAsk}
            className="flex items-center gap-1.5 px-3 py-1 bg-purple-50 text-purple-600 rounded-full text-[8px] font-bold uppercase tracking-widest hover:bg-purple-100 transition-colors border border-purple-100"
          >
            <ShieldCheck size={10} />
            {t.support}
          </button>
          <div className="h-3 w-[1px] bg-black/10" />
          <span>{t.postgis}</span>
          <span>{t.s3}</span>
        </div>
        <div className="flex gap-4">
          <span>{t.systemTime}: {new Date().toLocaleTimeString()}</span>
          <span>{t.region}</span>
        </div>
      </footer>

      {/* Calculator Popup (5 seconds) */}
      <AnimatePresence>
        {showCalcPopup && (
          <motion.div 
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 50, opacity: 0 }}
            className="fixed bottom-12 left-1/2 -translate-x-1/2 z-[110] bg-white rounded-3xl shadow-2xl border border-purple-100 p-6 w-[320px]"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-purple-100 rounded-2xl flex items-center justify-center text-purple-600">
                <Clock size={20} />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest opacity-40 block">{t.travelTimeWithSleep}</span>
                <span className="text-sm font-bold">{Math.floor(calculateComplexRoute().time / 60)} ч. {calculateComplexRoute().time % 60} мин.</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-100 rounded-2xl flex items-center justify-center text-emerald-600">
                <CreditCard size={20} />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest opacity-40 block">{t.totalCost}</span>
                <span className="text-sm font-bold">₽{calculateComplexRoute().cost.toLocaleString()}</span>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-black/5 flex items-center gap-2 text-[10px] font-medium text-emerald-600">
              <CheckCircle2 size={12} />
              {t.priceVerified}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {showConfirmModal && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowConfirmModal(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.96, opacity: 0, x: -80 }}
              animate={{ scale: 1, opacity: 1, x: 0 }}
              exit={{ scale: 0.96, opacity: 0, x: -80 }}
              className="relative bg-white rounded-[40px] shadow-2xl border border-black/5 w-full max-w-md max-h-[88vh] overflow-y-auto custom-scrollbar"
            >
              <div className="p-8">
                <div className="flex justify-between items-start mb-8">
                  <h2 className="text-3xl font-serif">{t.confirmAndBook}</h2>
                  <button onClick={() => setShowConfirmModal(false)} className="p-2 hover:bg-black/5 rounded-full"><X size={24} /></button>
                </div>

                <div className="space-y-6 mb-8">
                  {/* Logistics Module: Transfer */}
                  <div className="p-6 bg-purple-50 rounded-3xl border border-purple-100">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center text-purple-600">
                          <Car size={18} />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold uppercase tracking-widest">{t.transfer}</h4>
                          <p className="text-[10px] opacity-40">{t.partnerTaxi}</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => setAddTransfer(!addTransfer)}
                        className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all ${addTransfer ? 'bg-purple-600 text-white' : 'bg-white text-purple-600 border border-purple-100'}`}
                      >
                        {addTransfer ? t.added : t.add}
                      </button>
                    </div>
                    {addTransfer && (
                      <div className="p-3 bg-white rounded-2xl border border-purple-100 space-y-2">
                        <div className="flex justify-between items-center text-[10px]">
                          <span className="opacity-60">{t.fromSimferopolAirport}</span>
                          <span className="font-bold">₽2,500</span>
                        </div>
                        <div className="h-px bg-black/5" />
                        <div className="flex justify-between items-center text-[10px]">
                          <span className="opacity-60">{t.toHotel}</span>
                          <span className="font-bold truncate max-w-[120px]">{selectedObject?.name}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="p-6 bg-purple-50 rounded-3xl border border-purple-100">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="px-3 py-1 bg-emerald-500 text-white rounded-full text-[10px] font-bold uppercase tracking-widest flex items-center gap-1">
                        <ShieldCheck size={10} /> {t.safeDeal}
                      </div>
                      <span className="text-[10px] font-medium opacity-40">{t.escrowAgent}</span>
                    </div>
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-xs font-bold uppercase tracking-widest opacity-40">{t.routeSummary}</span>
                      <span className="px-3 py-1 bg-white rounded-full text-[10px] font-bold uppercase tracking-widest text-purple-600 border border-purple-100">
                        {routePoints.length} {t.routePoints}
                      </span>
                    </div>
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="opacity-60">{t.estimatedTime}</span>
                        <span className="font-bold">{Math.floor(calculateComplexRoute().time / 60)} ч. {calculateComplexRoute().time % 60} мин.</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="opacity-60">{t.totalCost}</span>
                        <span className="font-bold text-xl">₽{calculateComplexRoute().cost.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  {nearbyPois.length > 0 && (
                    <div className="p-4 bg-blue-50 rounded-3xl border border-blue-100">
                      <span className="text-[10px] font-bold uppercase tracking-widest opacity-40 block mb-3">{t.nearbyPois}</span>
                      <div className="flex flex-wrap gap-2">
                        {nearbyPois.map(poi => (
                          <div key={poi.id} className="flex items-center gap-1.5 px-2 py-1 bg-white rounded-lg text-[10px] font-medium border border-blue-100">
                            {poi.type === 'gas' && <Fuel size={10} className="text-red-500" />}
                            {poi.type === 'restaurant' && <Utensils size={10} className="text-amber-500" />}
                            {poi.type === 'attraction' && <Camera size={10} className="text-blue-500" />}
                            {poi.name}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest opacity-40 ml-1">
                      {t.notes} <span className="lowercase font-normal italic">({t.optional})</span>
                    </label>
                    <textarea 
                      value={userNotes}
                      onChange={(e) => setUserNotes(e.target.value)}
                      className="w-full p-4 bg-purple-50 rounded-2xl text-sm focus:outline-none focus:ring-1 focus:ring-purple-200 border border-purple-100 min-h-[100px] resize-none"
                      placeholder="..."
                    />
                  </div>

                  {!isPaid ? (
                    <div className="flex gap-3">
                      <button 
                        onClick={() => setShowConfirmModal(false)}
                        className="flex-1 py-5 bg-white text-[#1A1A1A] border border-black/10 rounded-2xl font-bold uppercase tracking-widest text-sm hover:bg-black/5 transition-all"
                      >
                        {t.cancel}
                      </button>
                      <button 
                        onClick={handlePayment}
                        disabled={isPaying}
                        className="flex-[2] py-5 bg-[#1A1A1A] text-white rounded-2xl font-bold uppercase tracking-widest text-sm hover:bg-black/80 transition-all flex items-center justify-center gap-3 shadow-xl disabled:opacity-50"
                      >
                        {isPaying ? (
                          <>
                            <RefreshCw size={20} className="animate-spin" />
                            {t.processingPayment}
                          </>
                        ) : (
                          <>
                            <CreditCard size={20} />
                            {t.payRoute}
                          </>
                        )}
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex gap-3">
                        <button 
                          onClick={() => setShowConfirmModal(false)}
                          className="flex-1 py-5 bg-white text-accent-purple border border-accent-purple/30 rounded-xl font-bold uppercase tracking-widest text-sm hover:bg-accent-purple/5 active:bg-accent-purple active:text-white transition-all"
                        >
                          {t.cancel}
                        </button>
                        <button 
                          onClick={() => setShowConfirmModal(false)}
                          className="flex-[2] py-5 border border-accent-purple/30 text-accent-purple rounded-xl font-bold uppercase tracking-widest text-sm hover:bg-accent-purple/5 active:bg-accent-purple active:text-white transition-all flex items-center justify-center gap-3 shadow-xl shadow-accent-purple/5"
                        >
                          <CheckCircle2 size={20} />
                          {t.letsGo}
                        </button>
                      </div>
                      <button 
                        onClick={generatePDF}
                        className="w-full py-4 bg-white text-[#1A1A1A] border border-black/10 rounded-2xl font-bold uppercase tracking-widest text-xs hover:bg-black/5 transition-all flex flex-col items-center gap-1"
                      >
                        <div className="flex items-center gap-2">
                          <Download size={16} />
                          {t.downloadPdf}
                        </div>
                        <span className="text-[8px] opacity-40 font-light">Все брони закреплены за вашим аккаунтом</span>
                      </button>
                      <button className="w-full py-2 text-red-500 text-[10px] font-bold uppercase tracking-widest hover:underline">
                        {t.openDispute}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Yandex Photo Gallery Modal */}
      <AnimatePresence>
        {showPhotoGallery && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.96, opacity: 0, x: -80 }}
              animate={{ scale: 1, opacity: 1, x: 0 }}
              exit={{ scale: 0.96, opacity: 0, x: -80 }}
              className="w-full max-w-4xl max-h-[88vh] bg-white rounded-[40px] overflow-y-auto custom-scrollbar relative"
            >
              <button 
                onClick={() => setShowPhotoGallery(false)}
                className="absolute top-6 right-6 z-10 w-10 h-10 bg-black/10 hover:bg-black/20 rounded-full flex items-center justify-center transition-colors"
              >
                <X size={20} />
              </button>

              <div className="p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center text-white">
                    <ImageIcon size={20} />
                  </div>
                  <div>
                    <h3 className="text-xl font-serif">Яндекс Фото</h3>
                    <p className="text-[10px] font-bold uppercase tracking-widest opacity-40">Результаты поиска по вашему запросу</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                  {yandexPhotos.map((url, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="aspect-square rounded-3xl overflow-hidden group relative"
                    >
                      <img
                        src={url}
                        alt={`Yandex ${i}`}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        referrerPolicy="no-referrer"
                        onError={(event) => handleImageFallback(event, LOCAL_FALLBACK_IMAGES[i % LOCAL_FALLBACK_IMAGES.length])}
                      />
                      <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <button className="px-4 py-2 bg-white rounded-full text-[10px] font-bold uppercase tracking-widest">Сохранить</button>
                      </div>
                    </motion.div>
                  ))}
                </div>

                <div className="mt-8 pt-6 border-t border-black/5 flex justify-between items-center">
                  <div className="text-[10px] font-bold uppercase tracking-widest opacity-40">
                    Источник: Яндекс Поиск
                  </div>
                  <button 
                    onClick={() => setShowPhotoGallery(false)}
                    className="px-8 py-3 bg-black text-white rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-black/80 transition-colors"
                  >
                    Закрыть
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Global Notifications */}
      <div className="fixed bottom-12 right-6 z-[200] flex flex-col gap-3 pointer-events-none">
        <AnimatePresence>
          {notifications.map((n) => (
            <motion.div
              key={n.id}
              initial={{ opacity: 0, x: 100, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
              className="w-80 bg-white rounded-2xl shadow-2xl border border-black/5 p-4 pointer-events-auto flex gap-3 items-start relative overflow-hidden group"
            >
              <div className={`p-2 rounded-xl shrink-0 ${n.type === 'success' ? 'bg-emerald-50 text-emerald-600' : n.type === 'info' ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600'}`}>
                {n.type === 'success' ? <CheckCircle2 size={18} /> : n.type === 'info' ? <MapPin size={18} /> : <Star size={18} />}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-xs font-bold text-gray-900 mb-0.5">{n.title}</h4>
                <p className="text-[10px] text-gray-500 leading-relaxed">{n.message}</p>
              </div>
              <button 
                onClick={() => setNotifications(prev => prev.filter(item => item.id !== n.id))}
                className="p-1 hover:bg-black/5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X size={14} />
              </button>
              <motion.div 
                initial={{ width: '100%' }}
                animate={{ width: 0 }}
                transition={{ duration: 5, ease: 'linear' }}
                onAnimationComplete={() => setNotifications(prev => prev.filter(item => item.id !== n.id))}
                className="absolute bottom-0 left-0 h-0.5 bg-purple-500/20"
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}


