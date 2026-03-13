import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";

const db = new Database("platform.db");

const discoveryContent = {
  routes: [
    {
      id: "route-bolshaya-sevastopolskaya",
      title: "Большая севастопольская прогулка",
      category: "Маршрут",
      source: "НавиКрым Guide",
      summary: "Дневной маршрут по набережной, Графской пристани, Херсонесу и Балаклаве с точками для остановок и фото.",
      details: "Подходит для первого знакомства с городом. Лучше стартовать утром, чтобы успеть захватить музейную часть Херсонеса и вечерний вид на Балаклавскую бухту.",
      url: "https://travel.example/crimea/sevastopol-walk",
    },
    {
      id: "route-fiolent",
      title: "Фиолент и Яшмовый пляж",
      category: "Природа",
      source: "НавиКрым Guide",
      summary: "Маршрут к смотровым площадкам Фиолента, монастырю и спуску к Яшмовому пляжу.",
      details: "Нужна удобная обувь и запас воды. Спуск длинный, поэтому это хороший вариант для полудневной поездки с акцентом на море и панорамы.",
      url: "https://travel.example/crimea/fiolent-jasper",
    },
    {
      id: "route-sudak-novy-svet",
      title: "Судак и тропа Голицына",
      category: "Треккинг",
      source: "НавиКрым Guide",
      summary: "Связка Генуэзской крепости, набережной Судака и тропы Голицына в Новом Свете.",
      details: "Лучше планировать на целый день. Утром крепость, после обеда переезд в Новый Свет и прогулка по тропе вдоль бухт.",
      url: "https://travel.example/crimea/sudak-novy-svet",
    },
  ],
  experiences: [
    {
      id: "exp-yalta-gastro",
      title: "Гастро-вечер в Ялте",
      category: "Впечатление",
      source: "НавиКрым Picks",
      summary: "Подборка мест для вечерней прогулки, локальной кухни и видов на набережной Ялты.",
      details: "Подойдет для неспешного вечера: поздний завтрак, прогулка по центру, ужин у моря и финальная остановка на смотровой точке.",
      url: "https://travel.example/crimea/yalta-evening",
    },
    {
      id: "exp-bakhchisaray",
      title: "День в Бахчисарае",
      category: "Культура",
      source: "НавиКрым Picks",
      summary: "Ханский дворец, старый город, кофейни и окрестные пещерные локации в одном сценарии.",
      details: "Хороший вариант для культурной программы с умеренной нагрузкой. Стоит заложить время на прогулку по старым кварталам и панорамам в окрестностях.",
      url: "https://travel.example/crimea/bakhchisaray-day",
    },
    {
      id: "exp-koktebel",
      title: "Коктебель: море и арт-среда",
      category: "Отдых",
      source: "НавиКрым Picks",
      summary: "Сценарий для пляжного дня с музыкальными площадками, прогулкой по побережью и закатной точкой.",
      details: "Удобно для летнего отдыха без сложной логистики. Основной акцент на атмосфере, пляже и вечернем маршруте вдоль моря.",
      url: "https://travel.example/crimea/koktebel-seaside",
    },
  ],
  safety: [
    {
      id: "safe-weather",
      title: "Погода и жара перед поездкой",
      category: "Безопасность",
      source: "НавиКрым Advisory",
      summary: "Перед выездом проверяйте температуру, силу ветра и штормовые предупреждения по нужному району Крыма.",
      details: "Для пеших маршрутов и пляжных дней критично смотреть не только общую температуру, но и ветер, осадки и ультрафиолетовый индекс.",
      url: "https://travel.example/crimea/weather-safety",
    },
    {
      id: "safe-roads",
      title: "Дороги и время в пути",
      category: "Логистика",
      source: "НавиКрым Advisory",
      summary: "Закладывайте запас времени на горные участки, серпантины и сезонную загруженность подъездов к пляжам.",
      details: "Лучше выезжать рано утром и иметь офлайн-карту. На популярных направлениях время в пути может заметно вырасти в выходные и праздники.",
      url: "https://travel.example/crimea/road-safety",
    },
    {
      id: "safe-hiking",
      title: "Безопасность на тропах",
      category: "Трекинг",
      source: "НавиКрым Advisory",
      summary: "Для троп и смотровых маршрутов нужны вода, нескользящая обувь и расчет времени до заката.",
      details: "На каменистых участках и обрывах не стоит идти без базовой подготовки. Если маршрут новый, лучше выбирать популярные направления с понятной тропой.",
      url: "https://travel.example/crimea/trail-safety",
    },
  ],
} as const;

// Initialize Database Schema
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
`);

// Seed initial data if empty
const objectCount = db.prepare("SELECT COUNT(*) as count FROM objects").get() as { count: number };
if (objectCount.count === 0) {
  const insertUser = db.prepare("INSERT INTO users (email, role) VALUES (?, ?)");
  const ownerId = insertUser.run("owner@krymgeo.ru", "owner").lastInsertRowid;

  const insertObject = db.prepare(`
    INSERT INTO objects (name, type, description, lat, lng, price_per_night, image_url, owner_id, ical_sync_url)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertObject.run(
    "Вилла Елена", 
    "Отель", 
    "Роскошный отдых в самом сердце Ялты с панорамным видом на море.", 
    44.4952, 34.1663, 
    15000, 
    "https://picsum.photos/seed/villa/800/600", 
    ownerId,
    "https://example.com/sync/villa-elena.ics"
  );
  
  insertObject.run(
    "Эко-дом Мыс Фиолент", 
    "Гостевой дом", 
    "Тихий экологичный дом рядом со знаменитым Яшмовым пляжем.", 
    44.5007, 33.4833, 
    4500, 
    "https://picsum.photos/seed/eco/800/600", 
    ownerId,
    null
  );

  insertObject.run(
    "Апартаменты с видом на Судакскую крепость", 
    "Апартаменты", 
    "Современные апартаменты с прямым видом на Генуэзскую крепость.", 
    44.8436, 34.9581, 
    3200, 
    "https://picsum.photos/seed/sudak/800/600", 
    ownerId,
    null
  );
}

async function startServer() {
  const app = express();
  app.use(express.json());
  const PORT = 3000;

  // API v1: Objects Search (Geo-Bounds)
  app.get("/api/v1/objects/search", (req, res) => {
    const { minLat, maxLat, minLng, maxLng } = req.query;
    
    let query = "SELECT * FROM objects";
    const params: any[] = [];

    if (minLat && maxLat && minLng && maxLng) {
      query += " WHERE lat BETWEEN ? AND ? AND lng BETWEEN ? AND ?";
      params.push(Number(minLat), Number(maxLat), Number(minLng), Number(maxLng));
    }

    const objects = db.prepare(query).all(...params);
    res.json(objects);
  });

  // API v1: Full Info
  app.get("/api/v1/objects/:id", (req, res) => {
    const object = db.prepare("SELECT * FROM objects WHERE id = ?").get(req.params.id);
    if (!object) return res.status(404).json({ error: "Not found" });
    
    const bookings = db.prepare("SELECT * FROM bookings WHERE object_id = ?").all(req.params.id);
    res.json({ ...object, bookings });
  });

  // API v1: Sync iCal (Mock)
  app.post("/api/v1/objects/:id/sync", (req, res) => {
    // In a real app, this would fetch the URL and parse iCal
    res.json({ status: "success", message: "Calendar synchronized with external provider" });
  });

  app.get("/api/v1/discovery/:section", (req, res) => {
    const section = req.params.section as keyof typeof discoveryContent;
    const items = discoveryContent[section];

    if (!items) {
      return res.status(404).json({ error: "Section not found" });
    }

    res.json(items);
  });

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`KrymGeo Backend running on http://localhost:${PORT}`);
  });
}

startServer();
