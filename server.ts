import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";

const db = new Database("platform.db");

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
