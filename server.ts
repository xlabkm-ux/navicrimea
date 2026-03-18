import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import multer from "multer";
import dotenv from "dotenv";

dotenv.config({ path: path.join(process.cwd(), ".env.local") });
dotenv.config();

const uploadsDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const configuredDbPath = process.env.DATABASE_PATH?.trim() || "platform.db";
const resolvedDbPath = path.isAbsolute(configuredDbPath)
  ? configuredDbPath
  : path.join(process.cwd(), configuredDbPath);
const db = new Database(resolvedDbPath);
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => cb(null, `${Date.now()}${path.extname(file.originalname)}`),
});
const upload = multer({ storage });

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE,
    role TEXT CHECK(role IN ('tourist', 'owner', 'provider'))
  );
  CREATE TABLE IF NOT EXISTS objects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    type TEXT,
    description TEXT,
    lat REAL,
    lng REAL,
    price_per_night REAL,
    image_url TEXT,
    owner_id INTEGER,
    ical_sync_url TEXT,
    region TEXT,
    distance_to_sea TEXT,
    distance_to_stop TEXT,
    FOREIGN KEY(owner_id) REFERENCES users(id)
  );
  CREATE TABLE IF NOT EXISTS bookings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    object_id INTEGER,
    user_id INTEGER,
    start_date TEXT,
    end_date TEXT,
    status TEXT,
    is_external BOOLEAN DEFAULT 0,
    FOREIGN KEY(object_id) REFERENCES objects(id),
    FOREIGN KEY(user_id) REFERENCES users(id)
  );
  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT
  );
`);

const discoveryContent = {
  routes: [
    { id: 'route-bolshaya-sevastopolskaya', title: 'Большая севастопольская прогулка', category: 'Маршрут', source: 'Навигатор Крым Guide', summary: 'Набережная, Херсонес и Балаклава в одном дне.', details: 'Маршрут подходит для первого знакомства с городом.', url: 'https://travel.example/crimea/sevastopol-walk' },
    { id: 'route-fiolent', title: 'Фиолент и Яшмовый пляж', category: 'Природа', source: 'Навигатор Крым Guide', summary: 'Смотровые площадки, монастырь и спуск к морю.', details: 'Нужна удобная обувь и запас воды.', url: 'https://travel.example/crimea/fiolent-jasper' },
    { id: 'route-sudak-novy-svet', title: 'Судак и тропа Голицына', category: 'Треккинг', source: 'Навигатор Крым Guide', summary: 'Крепость, набережная и тропа вдоль бухт.', details: 'Лучше планировать на целый день.', url: 'https://travel.example/crimea/sudak-novy-svet' },
  ],
  experiences: [
    { id: 'exp-yalta-gastro', title: 'Гастро-вечер в Ялте', category: 'Впечатление', source: 'Навигатор Крым Picks', summary: 'Набережная, локальная кухня и видовые точки.', details: 'Подойдет для неспешного вечера у моря.', url: 'https://travel.example/crimea/yalta-evening' },
    { id: 'exp-bakhchisaray', title: 'День в Бахчисарае', category: 'Культура', source: 'Навигатор Крым Picks', summary: 'Ханский дворец, старый город и кофейни.', details: 'Хороший вариант для культурной программы.', url: 'https://travel.example/crimea/bakhchisaray-day' },
    { id: 'exp-koktebel', title: 'Коктебель: море и арт-среда', category: 'Отдых', source: 'Навигатор Крым Picks', summary: 'Пляж, прогулка по побережью и закат.', details: 'Летний сценарий без сложной логистики.', url: 'https://travel.example/crimea/koktebel-seaside' },
  ],
  safety: [
    { id: 'safe-weather', title: 'Погода и жара перед поездкой', category: 'Безопасность', source: 'Навигатор Крым Advisory', summary: 'Проверяйте температуру, ветер и штормовые предупреждения.', details: 'Важно смотреть не только температуру, но и УФ-индекс.', url: 'https://travel.example/crimea/weather-safety' },
    { id: 'safe-roads', title: 'Дороги и время в пути', category: 'Логистика', source: 'Навигатор Крым Advisory', summary: 'Закладывайте запас времени на серпантины и сезонную нагрузку.', details: 'Лучше выезжать рано утром и иметь офлайн-карту.', url: 'https://travel.example/crimea/road-safety' },
    { id: 'safe-hiking', title: 'Безопасность на тропах', category: 'Трекинг', source: 'Навигатор Крым Advisory', summary: 'Вода, нескользящая обувь и расчет времени до заката.', details: 'Для новых маршрутов лучше выбирать популярные направления.', url: 'https://travel.example/crimea/trail-safety' },
  ],
} as const;

const localFallbackImages = [
  '/images/hero-coast-1.svg',
  '/images/hero-coast-2.svg',
  '/images/hero-cliff-1.svg',
  '/images/hero-cliff-2.svg',
  '/images/hero-palace.svg',
  '/images/hero-sea-night.svg',
];

const requiredPublicImageFiles = [
  "hero-coast-1.svg",
  "hero-coast-2.svg",
  "hero-cliff-1.svg",
  "hero-cliff-2.svg",
  "hero-palace.svg",
  "hero-sea-night.svg",
  "stay-fiolent.svg",
  "stay-sudak.svg",
  "stay-villa-elena.svg",
];

const publicImageSearchQueries: Record<string, string> = {
  "hero-coast-1.svg": "yalta crimea sea coast travel photo",
  "hero-coast-2.svg": "sevastopol crimea sea bay photo",
  "hero-cliff-1.svg": "crimea cliff coast landscape photo",
  "hero-cliff-2.svg": "tarhankut crimea cliffs sea photo",
  "hero-palace.svg": "vorontsov palace crimea photo",
  "hero-sea-night.svg": "crimea black sea sunset photo",
  "stay-fiolent.svg": "fiolent crimea guest house sea photo",
  "stay-sudak.svg": "sudak crimea apartment sea view photo",
  "stay-villa-elena.svg": "yalta villa hotel crimea photo",
};

const yandexRegionCoordinates: Record<string, { lat: number; lng: number }> = {
  yalta: { lat: 44.4952, lng: 34.1663 },
  sevastopol: { lat: 44.6167, lng: 33.5254 },
  simferopol: { lat: 44.9521, lng: 34.1024 },
  evpatoria: { lat: 45.1904, lng: 33.3669 },
  kerch: { lat: 45.3562, lng: 36.4674 },
  feodosia: { lat: 45.0319, lng: 35.3824 },
  sudak: { lat: 44.8505, lng: 34.9769 },
  bakhchisaray: { lat: 44.7517, lng: 33.8756 },
  koktebel: { lat: 44.9605, lng: 35.242 },
  alushta: { lat: 44.6764, lng: 34.4102 },
  gurzuf: { lat: 44.5462, lng: 34.2784 },
  foros: { lat: 44.3925, lng: 33.7876 },
  balaklava: { lat: 44.5112, lng: 33.6001 },
  inkerman: { lat: 44.6134, lng: 33.6087 },
  saki: { lat: 45.1328, lng: 33.5998 },
  chernomorskoe: { lat: 45.5064, lng: 32.6997 },
  shchelkino: { lat: 45.4299, lng: 35.8244 },
  belogorsk: { lat: 45.0542, lng: 34.6019 },
};

const photoCacheDir = path.join(uploadsDir, "photo-cache");
const photoFallbackDir = path.join(photoCacheDir, "fallback");
const publicImagesDir = path.join(process.cwd(), "public", "images");

type PhotosPayload = {
  source: string;
  images: string[];
  fallbackImages: string[];
  diskFallbackImages: string[];
  updatedAt: number;
};

const PHOTO_CACHE_TTL_MS = Number(process.env.PHOTO_CACHE_TTL_MS || 1000 * 60 * 60 * 6);
const regionPhotoCache = new Map<string, { updatedAt: number; payload: PhotosPayload }>();
const regionPhotoInFlight = new Map<string, Promise<PhotosPayload>>();

const regionNameToId: Record<string, string> = {
  "ялта": "yalta",
  "севастополь": "sevastopol",
  "симферополь": "simferopol",
  "евпатория": "evpatoria",
  "керчь": "kerch",
  "феодосия": "feodosia",
  "судак": "sudak",
  "бахчисарай": "bakhchisaray",
  "коктебель": "koktebel",
  "алушта": "alushta",
  "гурзуф": "gurzuf",
  "форос": "foros",
  "балаклава": "balaklava",
  "инкерман": "inkerman",
  "саки": "saki",
  "черноморское": "chernomorskoe",
  "щелкино": "shchelkino",
  "щёлкино": "shchelkino",
  "белогорск": "belogorsk",
};

const regionIdToSearchKeyword: Record<string, string> = {
  yalta: "yalta",
  sevastopol: "sevastopol",
  simferopol: "simferopol",
  evpatoria: "evpatoria",
  kerch: "kerch",
  feodosia: "feodosia",
  sudak: "sudak",
  bakhchisaray: "bakhchisaray",
  koktebel: "koktebel",
  alushta: "alushta",
  gurzuf: "gurzuf",
  foros: "foros",
  balaklava: "balaklava",
  inkerman: "inkerman",
  saki: "saki",
  chernomorskoe: "chernomorskoe",
  shchelkino: "shchelkino",
  belogorsk: "belogorsk",
};

const ensureDir = (dirPath: string) => {
  if (!fs.existsSync(dirPath)) fs.mkdirSync(dirPath, { recursive: true });
};

const isValidHttpUrl = (value: string) => /^https?:\/\/[^ "]+$/i.test(value);

const blockedImageHosts = [
  "shutterstock.com",
  "depositphotos.com",
  "istockphoto.com",
  "gettyimages.com",
  "adobe.com",
  "alamy.com",
  "123rf.com",
  "dreamstime.com",
  "freepik.com",
  "pikbest.com",
];

const normalizeImageUrl = (value: string) => {
  try {
    const url = new URL(value);
    return `${url.protocol}//${url.host}${url.pathname}`;
  } catch {
    return value.split("?")[0].split("#")[0];
  }
};

const isBlockedImageUrl = (value: string) => {
  const normalized = value.toLowerCase();
  if (normalized.includes("watermark")) return true;
  return blockedImageHosts.some((host) => normalized.includes(host));
};

const detectRegionIdFromQuery = (query: string): string | null => {
  const normalized = query.toLowerCase();
  for (const [name, id] of Object.entries(regionNameToId)) {
    if (normalized.includes(name)) return id;
  }
  for (const id of Object.keys(yandexRegionCoordinates)) {
    if (normalized.includes(id)) return id;
  }
  return null;
};

const buildSearchQueryText = (query: string) => {
  const regionId = detectRegionIdFromQuery(query || "");
  const regionKeyword = regionId ? regionIdToSearchKeyword[regionId] : "";
  const latinOnly = String(query || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const base = regionKeyword || latinOnly || "crimea";
  return `${base} crimea nature landscape travel photo`;
};

const buildSearchQueryVariants = (query: string) => {
  const regionId = detectRegionIdFromQuery(query || "");
  const regionKeyword = regionId ? regionIdToSearchKeyword[regionId] : "crimea";
  const variants = [
    buildSearchQueryText(query),
    `${regionKeyword} crimea sea coast panoramic view`,
    `${regionKeyword} crimea mountains nature landscape`,
    `${regionKeyword} crimea old city travel photo`,
  ];
  return Array.from(new Set(variants.map((value) => value.trim()).filter(Boolean)));
};

const buildLocalRegionFallbacks = (query: string) => {
  const regionId = detectRegionIdFromQuery(query);
  if (!regionId) return [...localFallbackImages];
  const offset = Object.keys(yandexRegionCoordinates).indexOf(regionId);
  if (offset < 0) return [...localFallbackImages];
  return localFallbackImages.map((_, index) => localFallbackImages[(index + offset) % localFallbackImages.length]);
};

const ensureFallbackFilesOnDisk = (fallbacks: string[]) => {
  ensureDir(photoFallbackDir);
  const diskUrls: string[] = [];
  for (const relativePath of fallbacks) {
    const fileName = path.basename(relativePath);
    const sourcePath = path.join(process.cwd(), "public", relativePath.replace(/^\/+/, ""));
    const destPath = path.join(photoFallbackDir, fileName);
    if (fs.existsSync(sourcePath) && !fs.existsSync(destPath)) {
      fs.copyFileSync(sourcePath, destPath);
    }
    if (fs.existsSync(destPath)) {
      diskUrls.push(`/uploads/photo-cache/fallback/${fileName}`);
    }
  }
  return diskUrls;
};

const decodeXmlEntities = (value: string) =>
  value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, "\"")
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");

const parseImageLinksFromXml = (xml: string) => {
  if (/<error code="2">/i.test(xml) || /<error[^>]*>.*пустой поисковый запрос/i.test(xml)) {
    return [];
  }
  const primaryMatches = xml.match(/<image-link>([^<]+)<\/image-link>/gi) || [];
  const secondaryMatches = xml.match(/<url>(https?:\/\/[^<]+)<\/url>/gi) || [];
  const extractValue = (tag: string) => decodeXmlEntities(tag.replace(/^<[^>]+>/, "").replace(/<\/[^>]+>$/, "").trim());

  const raw = [...primaryMatches.map(extractValue), ...secondaryMatches.map(extractValue)];
  return Array.from(new Set(raw))
    .filter((url) => isValidHttpUrl(url))
    .filter((url) => !isBlockedImageUrl(url))
    .filter((url) => !url.includes("favicon"))
    .filter((url) => !url.includes("icon"))
    .filter((url) => !url.includes("logo"))
    .filter((url) => !/thumbnail|thumb|preview/i.test(url))
    .slice(0, 24);
};

const decodeRawDataToXml = (rawData: string) => {
  const trimmed = rawData.trim();
  if (!trimmed) return "";
  if (trimmed.startsWith("<")) return trimmed;
  try {
    const decoded = Buffer.from(trimmed, "base64").toString("utf-8");
    return decoded.startsWith("<") ? decoded : "";
  } catch {
    return "";
  }
};

const createPhotoSvg = (mime: string, bytes: Buffer) => {
  const safeMime = mime.startsWith("image/") ? mime : "image/jpeg";
  const base64 = bytes.toString("base64");
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="900" viewBox="0 0 1200 900" preserveAspectRatio="xMidYMid slice">
  <image href="data:${safeMime};base64,${base64}" x="0" y="0" width="1200" height="900" preserveAspectRatio="xMidYMid slice"/>
</svg>`;
};

const createPlaceholderSvg = (title: string) => `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="900" viewBox="0 0 1200 900">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#1f2a56"/>
      <stop offset="100%" stop-color="#5f7bb0"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="900" fill="url(#bg)"/>
  <circle cx="980" cy="180" r="72" fill="#f4eecf" opacity="0.9"/>
  <text x="80" y="780" fill="#ffffff" font-size="54" font-family="Arial, sans-serif" opacity="0.88">${title}</text>
</svg>`;

const extractYandexImageUrls = async (queryText: string) => {
  const apiKey = getConfig("YANDEX_SEARCH_API_KEY") || getYandexApiKey();
  const folderId = getYandexFolderId();
  if (!apiKey || !folderId) return [];

  const response = await fetch("https://searchapi.api.cloud.yandex.net/v2/image/search", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Api-Key ${apiKey}`,
    },
    body: JSON.stringify({
      folderId,
      query: {
        queryText,
        searchType: "SEARCH_TYPE_RU",
      },
      imageSpec: {
        imageSize: "LARGE",
      },
      docsOnPage: 20,
      page: 0,
    }),
  });

  if (!response.ok) return [];
  const payload = await response.json().catch(() => null);
  const rawData = typeof payload?.rawData === "string" ? payload.rawData : "";
  const xml = decodeRawDataToXml(rawData);
  if (!xml) return [];

  return parseImageLinksFromXml(xml);
};

const downloadImageToCache = async (imageUrl: string) => {
  try {
    const response = await fetch(imageUrl, { headers: { "User-Agent": "Mozilla/5.0" } });
    if (!response.ok) return null;
    const contentType = String(response.headers.get("content-type") || "").toLowerCase();
    if (!contentType.startsWith("image/")) return null;
    const ext = contentType.includes("png")
      ? "png"
      : contentType.includes("webp")
        ? "webp"
        : "jpg";
    ensureDir(photoCacheDir);
    const bytes = Buffer.from(await response.arrayBuffer());
    if (bytes.length < 8_000) return null;
    const hash = crypto.createHash("sha1").update(bytes).digest("hex").slice(0, 20);
    const fileName = `${hash}.${ext}`;
    const fullPath = path.join(photoCacheDir, fileName);
    if (fs.existsSync(fullPath)) {
      const existingSize = fs.statSync(fullPath).size;
      if (existingSize < 60_000) {
        fs.unlinkSync(fullPath);
        return null;
      }
      return `/uploads/photo-cache/${fileName}`;
    }
    if (bytes.length < 60_000) return null;
    fs.writeFileSync(fullPath, bytes);
    return `/uploads/photo-cache/${fileName}`;
  } catch {
    return null;
  }
};

const fetchPhotoBytes = async (imageUrl: string) => {
  try {
    const response = await fetch(imageUrl, { headers: { "User-Agent": "Mozilla/5.0" } });
    if (!response.ok) return null;
    const mime = String(response.headers.get("content-type") || "").toLowerCase();
    if (!mime.startsWith("image/")) return null;
    const bytes = Buffer.from(await response.arrayBuffer());
    if (bytes.length < 8_000) return null;
    return { mime, bytes };
  } catch {
    return null;
  }
};

const getPhotoCacheKey = (query: string) => {
  const regionId = detectRegionIdFromQuery(query);
  if (regionId) return `region:${regionId}`;
  return `query:${String(query || "crimea").trim().toLowerCase() || "crimea"}`;
};

const buildPhotosPayload = async (query: string): Promise<PhotosPayload> => {
  const localFallback = buildLocalRegionFallbacks(query);
  const diskFallback = ensureFallbackFilesOnDisk(localFallback);
  const imagesFromYandex: string[] = [];

  try {
    const variants = buildSearchQueryVariants(query);
    const uniqueCandidates = new Set<string>();

    for (const variant of variants) {
      const yandexCandidates = await extractYandexImageUrls(variant);
      for (const candidateUrl of yandexCandidates) {
        const normalized = normalizeImageUrl(candidateUrl);
        if (!normalized || uniqueCandidates.has(normalized)) continue;
        uniqueCandidates.add(normalized);
        if (uniqueCandidates.size >= 40) break;
      }
      if (uniqueCandidates.size >= 40) break;
    }

    for (const candidateUrl of uniqueCandidates) {
      const cachedUrl = await downloadImageToCache(candidateUrl);
      if (cachedUrl) {
        imagesFromYandex.push(cachedUrl);
      }
      if (imagesFromYandex.length >= 12) break;
    }
  } catch (err) {
    console.error("Yandex photo search error:", err);
  }

  if (imagesFromYandex.length > 0) {
    return {
      source: "Yandex Photos (cached on server disk)",
      images: imagesFromYandex,
      fallbackImages: localFallback,
      diskFallbackImages: diskFallback,
      updatedAt: Date.now(),
    };
  }

  if (localFallback.length > 0) {
    return {
      source: "Local curated fallback",
      images: localFallback,
      fallbackImages: localFallback,
      diskFallbackImages: diskFallback,
      updatedAt: Date.now(),
    };
  }

  return {
    source: "Server disk fallback",
    images: diskFallback,
    fallbackImages: diskFallback,
    diskFallbackImages: diskFallback,
    updatedAt: Date.now(),
  };
};

const getRegionPhotos = async (query: string, forceRefresh = false): Promise<PhotosPayload> => {
  const cacheKey = getPhotoCacheKey(query);
  const now = Date.now();
  const cached = regionPhotoCache.get(cacheKey);

  if (!forceRefresh && cached && now - cached.updatedAt < PHOTO_CACHE_TTL_MS) {
    return cached.payload;
  }

  if (!forceRefresh && cached && now - cached.updatedAt >= PHOTO_CACHE_TTL_MS) {
    if (!regionPhotoInFlight.has(cacheKey)) {
      const refreshPromise = buildPhotosPayload(query)
        .then((payload) => {
          regionPhotoCache.set(cacheKey, { updatedAt: Date.now(), payload });
          return payload;
        })
        .finally(() => {
          regionPhotoInFlight.delete(cacheKey);
        });
      regionPhotoInFlight.set(cacheKey, refreshPromise);
    }
    return cached.payload;
  }

  const inFlight = regionPhotoInFlight.get(cacheKey);
  if (inFlight) {
    return inFlight;
  }

  const refreshPromise = buildPhotosPayload(query)
    .then((payload) => {
      regionPhotoCache.set(cacheKey, { updatedAt: Date.now(), payload });
      return payload;
    })
    .finally(() => {
      regionPhotoInFlight.delete(cacheKey);
    });
  regionPhotoInFlight.set(cacheKey, refreshPromise);
  return refreshPromise;
};

const populatePublicImagesIfEmpty = async () => {
  ensureDir(publicImagesDir);
  const existing = fs.readdirSync(publicImagesDir).filter((name) => !name.startsWith("."));
  if (existing.length > 0) return;

  console.log("public/images is empty, downloading a fresh image set...");
  for (const fileName of requiredPublicImageFiles) {
    const targetPath = path.join(publicImagesDir, fileName);
    const query = publicImageSearchQueries[fileName] || "crimea nature travel photo";
    let written = false;

    try {
      const candidates = await extractYandexImageUrls(query);
      for (const candidate of candidates) {
        const photo = await fetchPhotoBytes(candidate);
        if (!photo) continue;
        fs.writeFileSync(targetPath, createPhotoSvg(photo.mime, photo.bytes), "utf8");
        written = true;
        break;
      }
    } catch (error) {
      console.error(`Failed to fetch image for ${fileName}:`, error);
    }

    if (!written) {
      fs.writeFileSync(targetPath, createPlaceholderSvg(fileName.replace(".svg", "")), "utf8");
    }
  }
};

const getConfig = (key: string): string | undefined => {
  const envValue = process.env[key];
  if (typeof envValue === 'string' && envValue.trim()) return envValue.trim();
  const row = db.prepare("SELECT value FROM settings WHERE key = ?").get(key) as { value: string } | undefined;
  const value = row?.value;
  if (typeof value === 'string' && value.trim()) return value.trim();
  return undefined;
};

const objectCount = db.prepare("SELECT COUNT(*) as count FROM objects").get() as { count: number };
if (objectCount.count === 0) {
  const ownerId = db.prepare("INSERT INTO users (email, role) VALUES (?, ?)").run("owner@krymgeo.ru", "owner").lastInsertRowid;
  const insertObject = db.prepare(`
    INSERT INTO objects (name, type, description, lat, lng, price_per_night, image_url, owner_id, ical_sync_url, region, distance_to_sea, distance_to_stop)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  insertObject.run("Вилла Елена", "Отель", "Роскошный отдых в сердце Ялты с панорамным видом на море.", 44.4952, 34.1663, 15000, "/images/stay-villa-elena.svg", ownerId, "https://example.com/sync/villa-elena.ics", "yalta", "100м", "200м");
  insertObject.run("Эко-дом Мыс Фиолент", "Гостевой дом", "Тихий дом рядом со знаменитым Яшмовым пляжем.", 44.5007, 33.4833, 4500, "/images/stay-fiolent.svg", ownerId, null, "sevastopol", "300м", "500м");
  insertObject.run("Апартаменты с видом на Судакскую крепость", "Апартаменты", "Современные апартаменты с прямым видом на крепость.", 44.8436, 34.9581, 3200, "/images/stay-sudak.svg", ownerId, null, "sudak", "700м", "250м");
}

const buildLocalRoute = (prompt: string) => ({
  reply: `Собрала маршрут по запросу: ${prompt}`,
  route: {
    id: 'local-route',
    title: 'Персональный маршрут по Крыму',
    description: 'Маршрут с акцентом на видовые точки, прогулку и гастрономию.',
    totalDuration: '8 часов',
    totalCost: 5400,
    stops: [
      { id: '1', name: 'Симферополь', description: 'Старт маршрута и кофе перед выездом.', durationMinutes: 40, arrivalTime: '09:00', costEstimate: 500 },
      { id: '2', name: 'Бахчисарай', description: 'Прогулка по историческому центру.', durationMinutes: 120, arrivalTime: '11:00', costEstimate: 900 },
      { id: '3', name: 'Балаклава', description: 'Обед и прогулка у бухты.', durationMinutes: 150, arrivalTime: '15:00', costEstimate: 1800 },
      { id: '4', name: 'Фиолент', description: 'Закат на смотровой точке.', durationMinutes: 90, arrivalTime: '18:30', costEstimate: 400 }
    ]
  }
});

const searchDiscoveryRecommendations = (message: string, regionId: string | null) => {
  const normalized = normalizeSearchText(message);
  const keywords = extractSearchTokens(normalized);

  const matches = (Object.values(discoveryContent).flat() as Array<any>)
    .map((item) => {
      const haystack = normalizeSearchText(
        `${item.title} ${item.category} ${item.summary} ${item.details} ${item.source} ${item.url} ${regionId || ''}`,
      );
      let score = 0;

      for (const token of keywords) {
        if (haystack.includes(token)) score += 2;
      }

      if (regionId && haystack.includes(regionId)) score += 2;
      if (normalized.includes('маршрут') && item.category.toLowerCase().includes('маршрут')) score += 2;
      if (normalized.includes('безопас') && item.category.toLowerCase().includes('безопас')) score += 2;
      if (normalized.includes('впечатлен') && item.category.toLowerCase().includes('впечат')) score += 2;

      return { item, score };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
    .map(({ item }) => ({
      id: item.id,
      title: item.title,
      category: item.category,
      source: item.source,
      summary: item.summary,
      url: item.url,
    }));

  return matches;
};

const getYandexApiKey = () =>
  getConfig('YANDEX_API_KEY') ||
  getConfig('YANDEX_GPT_KEY') ||
  getConfig('YC_API_KEY') ||
  getConfig('YANDEX_CLOUD_API_KEY');
const getYandexFolderId = () =>
  getConfig('YANDEX_FOLDER_ID') ||
  getConfig('YC_FOLDER_ID') ||
  getConfig('YANDEX_CLOUD_FOLDER_ID');
const getYandexGptModel = () => getConfig('YANDEX_GPT_MODEL') || 'yandexgpt-lite';
const getYandexTtsVoice = () => getConfig('YANDEX_TTS_VOICE') || 'alena';
const assistantInstruction =
  'Ты — Алиса, голосовой помощник туристической платформы Навигатор Крым. Ты помогаешь путешественникам по Крыму находить и сравнивать туристические ресурсы: гостиницы, отели, апартаменты, квартиры для аренды, такси, рестораны, столовые, развлечения, экскурсии, музеи, выставки и сопутствующие сервисы. Всегда отвечай на русском языке, коротко, понятно и практично, с акцентом на конкретные варианты для поездки. Не выдумывай факты и прямо сообщай, если данных недостаточно. Всегда говори от женского лица независимо от запроса пользователя: используй формы «нашла», «подобрала», «рекомендую», «могу предложить» и избегай мужских форм.';

const regionAliases: Record<string, string[]> = {
  yalta: ['ялта', 'yalta'],
  sevastopol: ['севастополь', 'севастополе', 'севастополя', 'sevastopol'],
  simferopol: ['симферополь', 'simferopol'],
  evpatoria: ['евпатория', 'evpatoria'],
  kerch: ['керчь', 'kerch'],
  feodosia: ['феодосия', 'feodosia'],
  sudak: ['судак', 'sudak'],
  bakhchisaray: ['бахчисарай', 'bakhchisaray'],
  koktebel: ['коктебель', 'koktebel'],
  alushta: ['алушта', 'alushta'],
  gurzuf: ['гурзуф', 'gurzuf'],
  foros: ['форос', 'foros'],
  balaklava: ['балаклава', 'balaklava'],
  inkerman: ['инкерман', 'inkerman'],
  saki: ['саки', 'saki'],
  chernomorskoe: ['черноморское', 'chernomorskoe'],
  shchelkino: ['щелкино', 'щёлкино', 'shchelkino'],
  belogorsk: ['белогорск', 'belogorsk'],
};

const searchStopwords = new Set([
  'хочу', 'нужен', 'нужно', 'нужна', 'нужны', 'найди', 'найти', 'подбери', 'подобрать', 'покажи', 'посоветуй',
  'мне', 'для', 'с', 'со', 'и', 'в', 'во', 'на', 'по', 'из', 'до', 'от', 'без', 'или', 'где', 'который', 'которая',
  'какой', 'какая', 'тихий', 'тихое', 'тихая', 'уютный', 'уютная', 'хороший', 'хорошая', 'отель', 'гостиница',
  'жилье', 'жильё', 'апартаменты', 'дом', 'гостевой', 'номер', 'моря', 'море', 'видом', 'вид', 'рядом', 'около',
  'будет', 'есть', 'хотим', 'семья', 'семьей', 'семьёй', 'двое', 'трое', 'человека', 'человек'
]);

const normalizeSearchText = (value: string) =>
  String(value || '')
    .toLowerCase()
    .replace(/ё/g, 'е')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const extractBudgetMax = (message: string) => {
  const normalized = normalizeSearchText(message);
  const patterns = [
    /(?:до|не дороже|не выше|максимум|бюджет(?:ом)?(?: до)?)[^\d]{0,10}(\d[\d\s]{2,6})/,
    /(\d[\d\s]{2,6})\s*(?:руб|р|₽)/,
  ];

  for (const pattern of patterns) {
    const match = normalized.match(pattern);
    if (match?.[1]) {
      const value = Number(match[1].replace(/\s+/g, ''));
      if (Number.isFinite(value)) return value;
    }
  }

  return null;
};

const detectRegionId = (message: string) => {
  const normalized = normalizeSearchText(message);
  for (const [regionId, aliases] of Object.entries(regionAliases)) {
    if (aliases.some((alias) => normalized.includes(alias))) {
      return regionId;
    }
  }
  return null;
};

const extractSearchTokens = (message: string) =>
  normalizeSearchText(message)
    .split(' ')
    .filter((token) => token.length >= 3 && !searchStopwords.has(token));

const decodeHtmlEntities = (value: string) =>
  value
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .trim();

const collectDuckTopics = (topics: any[], bucket: any[] = []) => {
  for (const topic of topics || []) {
    if (topic?.Text && topic?.FirstURL) {
      bucket.push(topic);
      continue;
    }
    if (Array.isArray(topic?.Topics)) {
      collectDuckTopics(topic.Topics, bucket);
    }
  }
  return bucket;
};

const buildInternetQuery = (message: string, regionId: string | null) => {
  const regionToken = regionId ? `${regionId} крым` : 'крым';
  const base = normalizeSearchText(message);
  const tourismSuffix =
    'гостиницы отели апартаменты квартиры аренда такси рестораны столовые развлечения экскурсии музеи выставки';
  return `${base} ${regionToken} ${tourismSuffix}`.trim();
};

const searchInternetRecommendations = async (message: string, regionId: string | null) => {
  const normalizedMessage = normalizeSearchText(message);
  const fallback = searchDiscoveryRecommendations(normalizedMessage, regionId);
  const query = buildInternetQuery(message, regionId);

  try {
    const response = await fetch(
      `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`,
      {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'NaviCrimeaBot/1.0',
        },
      },
    );

    if (!response.ok) {
      return fallback;
    }

    const data: any = await response.json();
    const rawTopics = collectDuckTopics(Array.isArray(data?.RelatedTopics) ? data.RelatedTopics : []);
    const abstractTopic =
      data?.AbstractText && data?.AbstractURL
        ? [{ Text: String(data.AbstractText), FirstURL: String(data.AbstractURL) }]
        : [];
    const merged = [...abstractTopic, ...rawTopics];
    const tokens = extractSearchTokens(message);

    const scored = merged
      .map((topic: any, index: number) => {
        const text = decodeHtmlEntities(String(topic?.Text || ''));
        const url = String(topic?.FirstURL || '').trim();
        if (!text || !url) return null;
        const haystack = normalizeSearchText(`${text} ${url}`);
        let score = 0;
        for (const token of tokens) {
          if (haystack.includes(token)) score += 2;
        }
        if (regionId && haystack.includes(regionId)) score += 2;
        if (normalizedMessage && haystack.includes(normalizedMessage)) score += 2;
        return { topic: { text, url }, score, index };
      })
      .filter((item): item is { topic: { text: string; url: string }; score: number; index: number } => !!item)
      .sort((a, b) => b.score - a.score || a.index - b.index)
      .slice(0, 5)
      .map(({ topic, index }) => {
        const [rawTitle, ...rest] = topic.text.split(' - ');
        const title = rawTitle || topic.text;
        const summary = rest.join(' - ') || topic.text;
        let source = 'Internet';
        try {
          source = new URL(topic.url).hostname.replace(/^www\./, '');
        } catch {
          source = 'Internet';
        }
        return {
          id: `web-${index}-${Buffer.from(topic.url).toString('base64').slice(0, 8)}`,
          title,
          category: 'Интернет',
          source,
          summary,
          url: topic.url,
        };
      });

    if (!scored.length) {
      return fallback;
    }

    return scored;
  } catch {
    return fallback;
  }
};

const buildObjectSearchActions = (
  message: string,
  objects: any[],
  externalResultsInput?: Array<{
    id: string;
    title: string;
    category: string;
    source: string;
    summary: string;
    url: string;
  }>,
) => {
  const normalized = normalizeSearchText(message);
  const regionId = detectRegionId(normalized);
  const budgetMax = extractBudgetMax(normalized);
  const tokens = extractSearchTokens(normalized);

  const scored = objects
    .filter((obj) => {
      const regionMatches = regionId ? obj.region === regionId : true;
      const budgetMatches = budgetMax ? Number(obj.price_per_night) <= budgetMax : true;
      return regionMatches && budgetMatches;
    })
    .map((obj) => {
      const haystack = normalizeSearchText(`${obj.name} ${obj.type} ${obj.description} ${obj.region}`);
      let score = 0;

      if (regionId && obj.region === regionId) score += 5;
      if (budgetMax && Number(obj.price_per_night) <= budgetMax) score += 2;
      if (normalized.includes('отель') && haystack.includes('отель')) score += 3;
      if (normalized.includes('апартамент') && haystack.includes('апартамент')) score += 3;
      if (normalized.includes('дом') && haystack.includes('дом')) score += 2;

      for (const token of tokens) {
        if (haystack.includes(token)) score += 2;
      }

      return { obj, score };
    })
    .sort((a, b) => b.score - a.score || Number(a.obj.price_per_night) - Number(b.obj.price_per_night));

  const topMatches = scored.filter((item) => item.score > 0).slice(0, 6);
  const externalResults = externalResultsInput ?? searchDiscoveryRecommendations(normalized, regionId);
  if (!topMatches.length && !regionId && !budgetMax && !externalResults.length) {
    return [];
  }

  const focusObject = (topMatches[0] || scored[0])?.obj;
  const query =
    tokens.find((token) => focusObject && normalizeSearchText(`${focusObject.name} ${focusObject.type}`).includes(token)) ||
    (focusObject ? String(focusObject.type || '') : normalizeSearchText(message).slice(0, 80));

  const actions: Array<{ type: string; payload: any }> = [
    { type: 'set_view_mode', payload: { mode: 'list' } },
    {
      type: 'search_objects',
      payload: {
        query,
        regionId,
        budgetMax,
        focusObjectId: focusObject?.id ?? null,
        objectIds: topMatches.map((item) => item.obj.id),
        externalResults,
      },
    },
  ];

  if (regionId) {
    actions.unshift({ type: 'show_region', payload: { regionId } });
  }

  if (focusObject?.id) {
    actions.push({ type: 'focus_object', payload: { objectId: focusObject.id } });
  }

  return actions;
};

async function startServer() {
  const app = express();
  await populatePublicImagesIfEmpty();
  app.use(express.json());
  app.use('/uploads', express.static(uploadsDir));
  const PORT = Number(process.env.PORT ?? 3000);

  app.post('/api/v1/upload', upload.single('image'), (req: any, res) => {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    res.json({ url: `/uploads/${req.file.filename}` });
  });

  app.get('/api/v1/objects/search', (req, res) => {
    const { minLat, maxLat, minLng, maxLng } = req.query;
    let query = 'SELECT * FROM objects';
    const params: any[] = [];
    if (minLat && maxLat && minLng && maxLng) {
      query += ' WHERE lat BETWEEN ? AND ? AND lng BETWEEN ? AND ?';
      params.push(Number(minLat), Number(maxLat), Number(minLng), Number(maxLng));
    }
    res.json(db.prepare(query).all(...params));
  });

  app.get('/api/v1/objects/:id', (req, res) => {
    const object = db.prepare('SELECT * FROM objects WHERE id = ?').get(req.params.id);
    if (!object) return res.status(404).json({ error: 'Not found' });
    const bookings = db.prepare('SELECT * FROM bookings WHERE object_id = ?').all(req.params.id);
    res.json({ ...object, bookings });
  });

  app.post('/api/v1/objects/:id/sync', (req, res) => {
    db.prepare('UPDATE objects SET ical_sync_url = ? WHERE id = ?').run(req.body.ical_sync_url, req.params.id);
    res.json({ status: 'success', message: 'Calendar synchronized with external provider' });
  });

  app.get('/api/v1/discovery/:section', (req, res) => {
    const section = req.params.section as keyof typeof discoveryContent;
    const items = discoveryContent[section];
    if (!items) return res.status(404).json({ error: 'Section not found' });
    res.json(items);
  });

  app.get('/api/v1/settings', (_req, res) => res.json(db.prepare('SELECT * FROM settings').all()));
  app.post('/api/v1/settings', (req, res) => {
    db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run(req.body.key, req.body.value);
    res.json({ status: 'success' });
  });

  app.post('/api/v1/ai/chat', async (req, res) => {
    const { message, context } = req.body;
    const AI_MODE = getConfig('AI_MODE') || 'yandex';
    const YANDEX_API_KEY = getYandexApiKey();
    const YANDEX_FOLDER_ID = getYandexFolderId();
    const YANDEX_GPT_MODEL = getYandexGptModel();

    if (AI_MODE === 'local') {
      return res.json({ text: `[Локальный ИИ] ${message}` });
    }

    if (!YANDEX_API_KEY || !YANDEX_FOLDER_ID) {
      return res.json({ text: 'YandexGPT не настроен. Укажите API ключ и Folder ID в настройках.' });
    }

    try {
      const objects = db.prepare('SELECT * FROM objects').all() as any[];
      const rawConversation = Array.isArray(context?.conversation) ? context.conversation : [];
      const conversationMessages = rawConversation
        .map((entry: any) => {
          const role = entry?.role === 'assistant' ? 'assistant' : entry?.role === 'user' ? 'user' : null;
          const text = String(entry?.text || '').trim();
          if (!role || !text) return null;
          return { role, text };
        })
        .filter((entry: any): entry is { role: 'assistant' | 'user'; text: string } => !!entry)
        .slice(-12);
      const contextForPrompt =
        context && typeof context === 'object'
          ? Object.fromEntries(Object.entries(context).filter(([key]) => key !== 'conversation'))
          : {};
      const response = await fetch('https://llm.api.cloud.yandex.net/foundationModels/v1/completion', {
        method: 'POST',
        headers: {
          Authorization: `Api-Key ${YANDEX_API_KEY}`,
          'x-folder-id': YANDEX_FOLDER_ID,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          modelUri: `gpt://${YANDEX_FOLDER_ID}/${YANDEX_GPT_MODEL}`,
          completionOptions: { stream: false, temperature: 0.35, maxTokens: '2000' },
          messages: [
            { role: 'system', text: context?.instruction || assistantInstruction },
            ...conversationMessages,
            { role: 'user', text: `Контекст приложения: ${JSON.stringify(contextForPrompt)}.\nСообщение пользователя: ${message}` }
          ]
        })
      });
      const data: any = await response.json();
      if (!response.ok) {
        const errorMessage =
          data?.error?.message ||
          data?.message ||
          `YandexGPT request failed with status ${response.status}`;
        return res.status(response.status).json({ text: `YandexGPT error: ${errorMessage}` });
      }
      const plainMessage = String(message || '');
      const responseText = data.result?.alternatives?.[0]?.message?.text || 'Не удалось получить ответ от YandexGPT.';
      const internetResults = await searchInternetRecommendations(plainMessage, detectRegionId(plainMessage));
      const actions = buildObjectSearchActions(plainMessage, objects, internetResults);
      if (String(message).toLowerCase().includes('фото')) actions.push({ type: 'search_photos', payload: { query: context?.currentRegion || 'Крым' } });
      res.json({ text: responseText, actions });
    } catch (err) {
      console.error('YandexGPT Error:', err);
      res.status(500).json({ text: 'Ошибка при обращении к YandexGPT.' });
    }
  });

  app.post('/api/v1/ai/transcribe', express.raw({ type: '*/*', limit: '4mb' }), async (req, res) => {
    const AI_MODE = getConfig('AI_MODE') || 'yandex';
    const YANDEX_API_KEY = getYandexApiKey();
    const YANDEX_FOLDER_ID = getYandexFolderId();

    if (AI_MODE === 'local') {
      return res.json({ text: '' });
    }

    if (!YANDEX_API_KEY || !YANDEX_FOLDER_ID) {
      return res.status(400).json({ text: 'SpeechKit не настроен. Укажите API ключ и Folder ID в настройках.' });
    }

    if (!req.body || !(req.body as Buffer).length) {
      return res.status(400).json({ text: 'Пустой аудиофайл.' });
    }

    try {
      const lang = encodeURIComponent(String(req.query.lang || 'ru-RU'));
      const requestedFormat = String(req.query.format || '').toLowerCase();
      const contentTypeHeader = String(req.headers['content-type'] || '').toLowerCase();
      const format =
        requestedFormat === 'lpcm' || requestedFormat === 'oggopus'
          ? requestedFormat
          : contentTypeHeader.includes('application/octet-stream')
              ? 'lpcm'
              : 'oggopus';
      const sampleRateHertz = String(req.query.sampleRateHertz || '48000');
      const contentType = format === 'lpcm' ? 'application/octet-stream' : 'audio/ogg';
      const response = await fetch(
        `https://stt.api.cloud.yandex.net/speech/v1/stt:recognize?topic=general&lang=${lang}&format=${encodeURIComponent(format)}${format === 'lpcm' ? `&sampleRateHertz=${encodeURIComponent(sampleRateHertz)}` : ''}`,
        {
          method: 'POST',
          headers: {
            Authorization: `Api-Key ${YANDEX_API_KEY}`,
            'x-folder-id': YANDEX_FOLDER_ID,
            'Content-Type': contentType,
          },
          body: req.body as Buffer,
        },
      );

      const rawBody = await response.text();
      let data: any = null;
      try {
        data = rawBody ? JSON.parse(rawBody) : null;
      } catch {
        data = null;
      }
      if (!response.ok) {
        const errorMessage =
          data?.error_message ||
          data?.message ||
          rawBody ||
          `SpeechKit STT failed with status ${response.status}`;
        return res.status(response.status).json({ text: errorMessage });
      }

      res.json({ text: data?.result || '' });
    } catch (err) {
      console.error('SpeechKit STT Error:', err);
      res.status(500).json({ text: 'Ошибка при распознавании речи через SpeechKit.' });
    }
  });

  app.post('/api/v1/ai/speak', async (req, res) => {
    const AI_MODE = getConfig('AI_MODE') || 'yandex';
    const YANDEX_API_KEY = getYandexApiKey();
    const YANDEX_FOLDER_ID = getYandexFolderId();
    const YANDEX_TTS_VOICE = getYandexTtsVoice();
    const text = String(req.body?.text || '').trim();

    if (AI_MODE === 'local') {
      return res.status(204).end();
    }

    if (!YANDEX_API_KEY || !YANDEX_FOLDER_ID) {
      return res.status(400).json({ text: 'SpeechKit TTS не настроен. Укажите API ключ и Folder ID в настройках.' });
    }

    if (!text) {
      return res.status(400).json({ text: 'Нет текста для синтеза.' });
    }

    try {
      const params = new URLSearchParams({
        text,
        lang: 'ru-RU',
        voice: YANDEX_TTS_VOICE,
        folderId: YANDEX_FOLDER_ID,
        format: 'oggopus',
        sampleRateHertz: '48000',
      });

      const response = await fetch('https://tts.api.cloud.yandex.net/speech/v1/tts:synthesize', {
        method: 'POST',
        headers: {
          Authorization: `Api-Key ${YANDEX_API_KEY}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params,
      });

      if (!response.ok) {
        const errorText = await response.text();
        return res.status(response.status).json({ text: errorText || 'SpeechKit TTS request failed.' });
      }

      const audioBuffer = Buffer.from(await response.arrayBuffer());
      res.setHeader('Content-Type', response.headers.get('content-type') || 'audio/ogg');
      res.setHeader('Cache-Control', 'no-store');
      res.send(audioBuffer);
    } catch (err) {
      console.error('SpeechKit TTS Error:', err);
      res.status(500).json({ text: 'Ошибка при синтезе речи через SpeechKit.' });
    }
  });

  app.post('/api/v1/ai/route', async (req, res) => {
    const prompt = req.body?.prompt || 'Маршрут по Крыму';
    res.json(buildLocalRoute(prompt));
  });

  app.get(['/api/v1/photos/search', '/api/v2/photos/search'], async (req, res) => {
    const query = String(req.query.query || 'crimea');
    const forceRefresh = String(req.query.refresh || "").toLowerCase() === "1";
    const payload = await getRegionPhotos(query, forceRefresh);
    res.setHeader('Cache-Control', 'public, max-age=120');
    res.json(payload);
  });

  app.post('/api/v2/photos/refresh', async (req, res) => {
    const query = String(req.body?.query || '').trim();
    if (query) {
      const payload = await getRegionPhotos(query, true);
      return res.json({ refreshed: [query], payload });
    }

    const regions = Object.keys(yandexRegionCoordinates);
    const refreshed: string[] = [];
    for (const regionId of regions) {
      await getRegionPhotos(regionId, true);
      refreshed.push(regionId);
    }
    res.json({ refreshed, total: refreshed.length });
  });

  // Prevent unknown API paths from falling through to SPA HTML.
  app.use('/api', (_req, res) => {
    res.status(404).json({ error: 'API route not found' });
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      configLoader: 'runner',
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => res.sendFile(path.join(distPath, 'index.html')));
  }

  app.listen(PORT, '0.0.0.0', () => console.log(`NAVICRIMEA SERVER STARTED: http://localhost:${PORT}`));
}

startServer();
