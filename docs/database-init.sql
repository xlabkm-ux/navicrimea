CREATE TABLE IF NOT EXISTS listing_categories (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  icon TEXT,
  sort_order INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS listing_offers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  object_id INTEGER,
  category_id TEXT NOT NULL,
  title TEXT NOT NULL,
  short_description TEXT,
  region TEXT,
  district TEXT,
  distance_to_sea_m INTEGER,
  distance_to_center_m INTEGER,
  price_from INTEGER,
  rating REAL DEFAULT 0,
  reviews_count INTEGER DEFAULT 0,
  has_discount INTEGER DEFAULT 0,
  discount_percent INTEGER DEFAULT 0,
  is_verified INTEGER DEFAULT 0,
  free_cancellation INTEGER DEFAULT 0,
  breakfast_included INTEGER DEFAULT 0,
  pets_allowed INTEGER DEFAULT 0,
  family_friendly INTEGER DEFAULT 0,
  urgent_badge TEXT,
  cover_image_url TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY(object_id) REFERENCES objects(id),
  FOREIGN KEY(category_id) REFERENCES listing_categories(id)
);

CREATE INDEX IF NOT EXISTS idx_listing_offers_category ON listing_offers(category_id);
CREATE INDEX IF NOT EXISTS idx_listing_offers_sort ON listing_offers(price_from, rating, distance_to_sea_m);

CREATE TABLE IF NOT EXISTS listing_offer_details (
  offer_id INTEGER PRIMARY KEY,
  full_description TEXT NOT NULL,
  amenities_json TEXT,
  policies_json TEXT,
  included_json TEXT,
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY(offer_id) REFERENCES listing_offers(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS design_feedback (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  topic TEXT NOT NULL,
  comment TEXT NOT NULL,
  author TEXT DEFAULT 'Команда',
  status TEXT NOT NULL DEFAULT 'new' CHECK(status IN ('new','in_review','planned','done')),
  priority TEXT NOT NULL DEFAULT 'normal' CHECK(priority IN ('low','normal','high')),
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);
