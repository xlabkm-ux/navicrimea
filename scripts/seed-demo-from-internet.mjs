import path from "path";
import Database from "better-sqlite3";

const dbPath = path.join(process.cwd(), process.env.DATABASE_PATH?.trim() || "platform.db");
const db = new Database(dbPath);

const REGION_CONFIG = [
  { id: "yalta", name: "Ялта", lat: 44.4952, lng: 34.1663 },
  { id: "sevastopol", name: "Севастополь", lat: 44.6167, lng: 33.5254 },
  { id: "simferopol", name: "Симферополь", lat: 44.9521, lng: 34.1024 },
  { id: "evpatoria", name: "Евпатория", lat: 45.1904, lng: 33.3669 },
  { id: "kerch", name: "Керчь", lat: 45.3562, lng: 36.4674 },
  { id: "feodosia", name: "Феодосия", lat: 45.0319, lng: 35.3824 },
  { id: "sudak", name: "Судак", lat: 44.8505, lng: 34.9769 },
  { id: "bakhchisaray", name: "Бахчисарай", lat: 44.7517, lng: 33.8756 },
  { id: "koktebel", name: "Коктебель", lat: 44.9605, lng: 35.242 },
  { id: "alushta", name: "Алушта", lat: 44.6764, lng: 34.4102 },
  { id: "gurzuf", name: "Гурзуф", lat: 44.5462, lng: 34.2784 },
  { id: "foros", name: "Форос", lat: 44.3925, lng: 33.7876 },
  { id: "balaklava", name: "Балаклава", lat: 44.5112, lng: 33.6001 },
  { id: "inkerman", name: "Инкерман", lat: 44.6134, lng: 33.6087 },
  { id: "saki", name: "Саки", lat: 45.1328, lng: 33.5998 },
  { id: "chernomorskoe", name: "Черноморское", lat: 45.5064, lng: 32.6997 },
  { id: "shchelkino", name: "Щёлкино", lat: 45.4299, lng: 35.8244 },
  { id: "belogorsk", name: "Белогорск", lat: 45.0542, lng: 34.6019 },
];

const IMAGES = [
  "/images/hero-coast-1.svg",
  "/images/hero-coast-2.svg",
  "/images/hero-cliff-1.svg",
  "/images/hero-cliff-2.svg",
  "/images/hero-palace.svg",
  "/images/hero-sea-night.svg",
];

const ACTIVITY_TAGS = [
  "трекинг",
  "веломаршруты",
  "морские прогулки",
  "дайвинг",
  "скалистые бухты",
  "закатные точки",
  "авторские маршруты",
];

const ensureColumn = (tableName, columnName, definition) => {
  const columns = db.prepare(`PRAGMA table_info(${tableName})`).all();
  const hasColumn = columns.some((column) => column.name === columnName);
  if (!hasColumn) {
    db.exec(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${definition}`);
  }
};

ensureColumn("objects", "address", "TEXT");
ensureColumn("objects", "region", "TEXT");
ensureColumn("objects", "distance_to_sea", "TEXT");
ensureColumn("objects", "distance_to_stop", "TEXT");

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const getOwnerId = () => {
  const existing = db.prepare("SELECT id FROM users WHERE email = ? LIMIT 1").get("demo@navicrimea.local");
  if (existing?.id) return Number(existing.id);
  const result = db.prepare("INSERT INTO users (email, role) VALUES (?, ?)").run("demo@navicrimea.local", "owner");
  return Number(result.lastInsertRowid);
};

const ownerId = getOwnerId();

const inferType = (value) => {
  const normalized = String(value || "").toLowerCase();
  if (normalized.includes("apartment")) return "Апартаменты";
  if (normalized.includes("guest")) return "Гостевой дом";
  if (normalized.includes("hostel")) return "Хостел";
  if (normalized.includes("camp")) return "Кемпинг";
  return "Отель";
};

const normalizeName = (value) => {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim();
};

const fetchFromNominatim = async (region, searchTerm) => {
  const dLng = 0.23;
  const dLat = 0.18;
  const minLon = region.lng - dLng;
  const maxLon = region.lng + dLng;
  const minLat = region.lat - dLat;
  const maxLat = region.lat + dLat;

  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("limit", "50");
  url.searchParams.set("q", searchTerm);
  url.searchParams.set("accept-language", "ru");
  url.searchParams.set("bounded", "1");
  url.searchParams.set("viewbox", `${minLon},${maxLat},${maxLon},${minLat}`);
  url.searchParams.set("addressdetails", "1");

  const response = await fetch(url, {
    headers: {
      "User-Agent": "NaviCrimeaDemoSeeder/1.0 (contact: demo@navicrimea.local)",
      "Accept": "application/json",
    },
  });

  if (!response.ok) return [];
  const items = await response.json().catch(() => []);
  if (!Array.isArray(items)) return [];

  return items
    .map((item) => {
      const nameCandidate = normalizeName(item?.name || String(item?.display_name || "").split(",")[0]);
      if (!nameCandidate) return null;
      const lat = Number(item?.lat);
      const lng = Number(item?.lon);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
      return {
        name: nameCandidate,
        lat,
        lng,
        address: normalizeName(item?.display_name || `${region.name}, Крым`),
        osmType: item?.type || "",
      };
    })
    .filter(Boolean);
};

const insertObject = db.prepare(`
  INSERT INTO objects (
    name, type, description, address, lat, lng, price_per_night,
    image_url, owner_id, ical_sync_url, region, distance_to_sea, distance_to_stop
  )
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const upsertListingOfferIfNeeded = (objectId, obj, regionIndex, itemIndex) => {
  const hasTable = db
    .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'listing_offers'")
    .get();
  if (!hasTable) return;

  const exists = db.prepare("SELECT id FROM listing_offers WHERE object_id = ? LIMIT 1").get(objectId);
  if (exists?.id) return;

  const categoryId = String(obj.type || "").toLowerCase().includes("апартамент")
    ? "apartments"
    : String(obj.type || "").toLowerCase().includes("гостев")
      ? "guesthouses"
      : "hotels";

  const distSea = Number(String(obj.distance_to_sea || "").replace(/[^\d]/g, "")) || 300 + itemIndex * 70;
  const hasDiscount = itemIndex % 2 === 0 ? 1 : 0;
  const discount = hasDiscount ? 8 + (itemIndex % 5) : 0;
  const rating = Number((4.4 + ((regionIndex + itemIndex) % 6) / 10).toFixed(1));
  const reviews = 40 + ((regionIndex + 1) * (itemIndex + 3) * 7) % 220;

  const insertOffer = db.prepare(`
    INSERT INTO listing_offers (
      object_id, category_id, title, short_description, region, district, distance_to_sea_m, distance_to_center_m,
      price_from, rating, reviews_count, has_discount, discount_percent, is_verified, free_cancellation,
      breakfast_included, pets_allowed, family_friendly, urgent_badge, cover_image_url
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertDetails = db.prepare(`
    INSERT INTO listing_offer_details (offer_id, full_description, amenities_json, policies_json, included_json)
    VALUES (?, ?, ?, ?, ?)
  `);

  const offerRes = insertOffer.run(
    objectId,
    categoryId,
    obj.name,
    obj.description,
    obj.region,
    obj.address,
    distSea,
    900 + itemIndex * 80,
    obj.price_per_night,
    rating,
    reviews,
    hasDiscount,
    discount,
    1,
    1,
    categoryId === "hotels" ? 1 : 0,
    itemIndex % 3 === 0 ? 1 : 0,
    1,
    itemIndex % 2 === 0 ? "Цена недели" : "Новый маршрут рядом",
    obj.image_url,
  );

  insertDetails.run(
    Number(offerRes.lastInsertRowid),
    `Полная карточка "${obj.name}" сформирована как демо-описание на основе интернет-источников (OSM/Nominatim).`,
    JSON.stringify(["Wi-Fi", "Парковка", "Туристические консультации"]),
    JSON.stringify(["Бесплатная отмена за 48 часов", "Заезд после 14:00"]),
    JSON.stringify(["Подбор активностей", "Помощь с маршрутами"]),
  );
};

const seededSummary = [];

for (let regionIndex = 0; regionIndex < REGION_CONFIG.length; regionIndex += 1) {
  const region = REGION_CONFIG[regionIndex];
  const existing = db
    .prepare("SELECT id, name FROM objects WHERE region = ? ORDER BY id ASC")
    .all(region.id);

  const needed = Math.max(0, 10 - existing.length);
  if (needed === 0) {
    seededSummary.push({ region: region.id, added: 0, total: existing.length });
    continue;
  }

  const collected = [];
  const seenNames = new Set(existing.map((item) => normalizeName(item.name).toLowerCase()));
  const terms = [
    `hotel ${region.name} crimea`,
    `guest house ${region.name} crimea`,
    `apartments ${region.name} crimea`,
  ];

  for (const term of terms) {
    const candidates = await fetchFromNominatim(region, term);
    for (const candidate of candidates) {
      const key = normalizeName(candidate.name).toLowerCase();
      if (!key || seenNames.has(key)) continue;
      seenNames.add(key);
      collected.push(candidate);
      if (collected.length >= needed) break;
    }
    if (collected.length >= needed) break;
    await sleep(1200);
  }

  while (collected.length < needed) {
    const idx = collected.length + 1;
    collected.push({
      name: `${region.name} Active Demo ${idx}`,
      lat: region.lat + (idx % 5) * 0.01,
      lng: region.lng + (idx % 4) * 0.01,
      address: `${region.name}, Крым`,
      osmType: "hotel",
    });
  }

  let added = 0;
  for (let i = 0; i < collected.length; i += 1) {
    const item = collected[i];
    const image = IMAGES[(regionIndex + i) % IMAGES.length];
    const type = inferType(item.osmType);
    const activity = ACTIVITY_TAGS[(regionIndex + i) % ACTIVITY_TAGS.length];
    const price = 2800 + ((regionIndex * 9 + i * 13) % 75) * 120;
    const distSea = 90 + ((regionIndex + i * 2) % 18) * 70;
    const distStop = 120 + ((regionIndex * 3 + i * 5) % 16) * 60;
    const description = `Демо-объект на основе интернет-источника (OpenStreetMap). Подходит для увлеченных туристов: ${activity}, новые локации и насыщенные впечатления каждый день.`;

    const res = insertObject.run(
      item.name,
      type,
      description,
      item.address,
      item.lat,
      item.lng,
      price,
      image,
      ownerId,
      null,
      region.id,
      `${distSea}м`,
      `${distStop}м`,
    );

    const objectId = Number(res.lastInsertRowid);
    upsertListingOfferIfNeeded(
      objectId,
      {
        name: item.name,
        description,
        address: item.address,
        region: region.id,
        distance_to_sea: `${distSea}м`,
        price_per_night: price,
        image_url: image,
        type,
      },
      regionIndex,
      i,
    );
    added += 1;
  }

  const total = db.prepare("SELECT COUNT(*) AS count FROM objects WHERE region = ?").get(region.id).count;
  seededSummary.push({ region: region.id, added, total });
  await sleep(1200);
}

const totals = db.prepare("SELECT region, COUNT(*) AS count FROM objects WHERE region IS NOT NULL GROUP BY region ORDER BY region").all();
console.log(JSON.stringify({ dbPath, seededSummary, totals }, null, 2));

db.close();
