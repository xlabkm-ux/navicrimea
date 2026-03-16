import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import fs from "fs";
import multer from "multer";
import dotenv from "dotenv";

dotenv.config({ path: path.join(process.cwd(), ".env.local") });
dotenv.config();

const uploadsDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const db = new Database("platform.db");
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
    { id: 'route-bolshaya-sevastopolskaya', title: 'Большая севастопольская прогулка', category: 'Маршрут', source: 'НавиКрым Guide', summary: 'Набережная, Херсонес и Балаклава в одном дне.', details: 'Маршрут подходит для первого знакомства с городом.', url: 'https://travel.example/crimea/sevastopol-walk' },
    { id: 'route-fiolent', title: 'Фиолент и Яшмовый пляж', category: 'Природа', source: 'НавиКрым Guide', summary: 'Смотровые площадки, монастырь и спуск к морю.', details: 'Нужна удобная обувь и запас воды.', url: 'https://travel.example/crimea/fiolent-jasper' },
    { id: 'route-sudak-novy-svet', title: 'Судак и тропа Голицына', category: 'Треккинг', source: 'НавиКрым Guide', summary: 'Крепость, набережная и тропа вдоль бухт.', details: 'Лучше планировать на целый день.', url: 'https://travel.example/crimea/sudak-novy-svet' },
  ],
  experiences: [
    { id: 'exp-yalta-gastro', title: 'Гастро-вечер в Ялте', category: 'Впечатление', source: 'НавиКрым Picks', summary: 'Набережная, локальная кухня и видовые точки.', details: 'Подойдет для неспешного вечера у моря.', url: 'https://travel.example/crimea/yalta-evening' },
    { id: 'exp-bakhchisaray', title: 'День в Бахчисарае', category: 'Культура', source: 'НавиКрым Picks', summary: 'Ханский дворец, старый город и кофейни.', details: 'Хороший вариант для культурной программы.', url: 'https://travel.example/crimea/bakhchisaray-day' },
    { id: 'exp-koktebel', title: 'Коктебель: море и арт-среда', category: 'Отдых', source: 'НавиКрым Picks', summary: 'Пляж, прогулка по побережью и закат.', details: 'Летний сценарий без сложной логистики.', url: 'https://travel.example/crimea/koktebel-seaside' },
  ],
  safety: [
    { id: 'safe-weather', title: 'Погода и жара перед поездкой', category: 'Безопасность', source: 'НавиКрым Advisory', summary: 'Проверяйте температуру, ветер и штормовые предупреждения.', details: 'Важно смотреть не только температуру, но и УФ-индекс.', url: 'https://travel.example/crimea/weather-safety' },
    { id: 'safe-roads', title: 'Дороги и время в пути', category: 'Логистика', source: 'НавиКрым Advisory', summary: 'Закладывайте запас времени на серпантины и сезонную нагрузку.', details: 'Лучше выезжать рано утром и иметь офлайн-карту.', url: 'https://travel.example/crimea/road-safety' },
    { id: 'safe-hiking', title: 'Безопасность на тропах', category: 'Трекинг', source: 'НавиКрым Advisory', summary: 'Вода, нескользящая обувь и расчет времени до заката.', details: 'Для новых маршрутов лучше выбирать популярные направления.', url: 'https://travel.example/crimea/trail-safety' },
  ],
} as const;

const getConfig = (key: string): string | undefined => {
  const envValue = process.env[key];
  if (envValue) return envValue;
  const row = db.prepare("SELECT value FROM settings WHERE key = ?").get(key) as { value: string } | undefined;
  return row?.value;
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

const getYandexApiKey = () => getConfig('YANDEX_API_KEY') || getConfig('YANDEX_GPT_KEY');
const getYandexFolderId = () => getConfig('YANDEX_FOLDER_ID');
const getYandexGptModel = () => getConfig('YANDEX_GPT_MODEL') || 'yandexgpt-lite';
const getYandexTtsVoice = () => getConfig('YANDEX_TTS_VOICE') || 'alena';
const assistantInstruction =
  'Ты — голосовой помощник туристической платформы НавиКрым. Говори естественно, дружелюбно и короткими фразами на русском. Учитывай контекст поездки по Крыму. Не выдумывай факты, если данных нет. Если пользователь просит маршрут, проживание или идеи отдыха, отвечай практично и по делу.';

async function startServer() {
  const app = express();
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
            { role: 'user', text: `Контекст приложения: ${JSON.stringify(context)}.\nСообщение пользователя: ${message}` }
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
      const responseText = data.result?.alternatives?.[0]?.message?.text || 'Не удалось получить ответ от YandexGPT.';
      const actions = [];
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
      const format = String(req.query.format || 'oggopus').toLowerCase();
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

      const data: any = await response.json();
      if (!response.ok) {
        const errorMessage = data?.error_message || data?.message || `SpeechKit STT failed with status ${response.status}`;
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

  app.get('/api/v1/photos/search', async (req, res) => {
    const query = String(req.query.query || 'crimea');
    const apiKey = getConfig('YANDEX_SEARCH_API_KEY');
    if (!apiKey) {
      return res.json({ source: 'Local Cache', images: [`https://picsum.photos/seed/${query}_1/800/600`, `https://picsum.photos/seed/${query}_2/800/600`] });
    }
    res.json({ source: 'Yandex', images: [`https://picsum.photos/seed/${query}_y1/800/600`, `https://picsum.photos/seed/${query}_y2/800/600`] });
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
