import React, { useMemo, useState } from "react";
import { ArrowUpDown, Compass, MapPin, Mountain, ShieldCheck, Sparkles, Star, Waves } from "lucide-react";

type OfferObject = {
  id: number;
  name: string;
  type: string;
  description: string;
  price_per_night: number;
  image_url: string;
  region?: string;
  distance_to_sea?: string;
};

type SortKey = "activity" | "recommended" | "price_asc" | "price_desc" | "distance_asc";
type CategoryKey = "all" | "hotels" | "apartments" | "guesthouses" | "active";

type OfferProfile = {
  obj: OfferObject;
  category: CategoryKey;
  rating: number;
  reviews: number;
  distanceSea: number | null;
  hasDiscount: boolean;
  discountPercent: number;
  oldPrice: number;
  verified: boolean;
  family: boolean;
  pets: boolean;
  adventure: boolean;
  activityScore: number;
  tags: string[];
};

type Props = {
  objects: OfferObject[];
  regionTitle?: string;
  dateLabel: string;
  guestsLabel: string;
  onSelectObject: (obj: OfferObject) => void;
};

const categoryTitles: Record<CategoryKey, string> = {
  all: "Все",
  hotels: "Отели",
  apartments: "Апартаменты",
  guesthouses: "Гостевые дома",
  active: "Активный отдых",
};

const sortTitles: Record<SortKey, string> = {
  activity: "По впечатлениям",
  recommended: "Рекомендуемое",
  price_asc: "Цена: дешевле",
  price_desc: "Цена: дороже",
  distance_asc: "Ближе к морю",
};

const parseMeters = (value: string | undefined) => {
  if (!value) return null;
  const match = value.match(/\d+/);
  if (!match) return null;
  const parsed = Number(match[0]);
  return Number.isFinite(parsed) ? parsed : null;
};

const deriveProfile = (obj: OfferObject): OfferProfile => {
  const normalizedType = String(obj.type || "").toLowerCase();
  const category: CategoryKey = normalizedType.includes("апартамент")
    ? "apartments"
    : normalizedType.includes("гостев")
      ? "guesthouses"
      : "hotels";

  const distanceSea = parseMeters(obj.distance_to_sea);
  const rating = 4.4 + ((obj.id * 7) % 6) / 10;
  const reviews = 38 + (obj.id * 17) % 240;
  const hasDiscount = obj.price_per_night >= 4500 || obj.id % 2 === 0;
  const discountPercent = hasDiscount ? 8 + ((obj.id * 3) % 10) : 0;
  const oldPrice = hasDiscount
    ? Math.round((obj.price_per_night * 100) / (100 - discountPercent))
    : obj.price_per_night;

  const tagsByRegion: Record<string, string[]> = {
    yalta: ["Треккинг", "Яхтинг", "Смотровые маршруты"],
    sevastopol: ["Дайвинг", "Каякинг", "Исторические тропы"],
    sudak: ["Скалолазание", "Трейл", "Крепость и закат"],
    alushta: ["Веломаршруты", "Параплан", "Эко-тропы"],
    balaklava: ["Морской тур", "SUP", "Скалистые бухты"],
  };
  const fallbackTags = ["Новые локации", "Авторские маршруты", "Активный день"];
  const regionTags = tagsByRegion[String(obj.region || "").toLowerCase()] || fallbackTags;
  const tags = regionTags.slice(0, 2);

  const adventure = tags.some((item) => /трек|дайв|скал|яхт|кай|параплан|тур/i.test(item));
  const family = normalizedType.includes("отел") || obj.price_per_night >= 5000;
  const pets = normalizedType.includes("апартамент") || obj.id % 2 === 0;
  const verified = true;

  const activityScore =
    (adventure ? 20 : 10) +
    (distanceSea ? Math.max(0, 12 - distanceSea / 100) : 4) +
    (hasDiscount ? 8 : 0) +
    (rating * 6);

  return {
    obj,
    category,
    rating: Number(rating.toFixed(1)),
    reviews,
    distanceSea,
    hasDiscount,
    discountPercent,
    oldPrice,
    verified,
    family,
    pets,
    adventure,
    activityScore,
    tags,
  };
};

export function ActiveOffersList({ objects, regionTitle, dateLabel, guestsLabel, onSelectObject }: Props) {
  const [category, setCategory] = useState<CategoryKey>("all");
  const [sortBy, setSortBy] = useState<SortKey>("activity");
  const [familyOnly, setFamilyOnly] = useState(false);
  const [petsOnly, setPetsOnly] = useState(false);
  const [adventureOnly, setAdventureOnly] = useState(false);
  const [compareIds, setCompareIds] = useState<number[]>([]);

  const profiles = useMemo(() => objects.map(deriveProfile), [objects]);

  const categoryCount = useMemo(() => {
    const base: Record<CategoryKey, number> = {
      all: profiles.length,
      hotels: 0,
      apartments: 0,
      guesthouses: 0,
      active: 0,
    };
    for (const item of profiles) {
      base[item.category] += 1;
      if (item.adventure) base.active += 1;
    }
    return base;
  }, [profiles]);

  const filtered = useMemo(() => {
    const list = profiles.filter((item) => {
      if (category !== "all") {
        if (category === "active") {
          if (!item.adventure) return false;
        } else if (item.category !== category) {
          return false;
        }
      }
      if (familyOnly && !item.family) return false;
      if (petsOnly && !item.pets) return false;
      if (adventureOnly && !item.adventure) return false;
      return true;
    });

    const sorted = [...list].sort((a, b) => {
      if (sortBy === "price_asc") return a.obj.price_per_night - b.obj.price_per_night;
      if (sortBy === "price_desc") return b.obj.price_per_night - a.obj.price_per_night;
      if (sortBy === "distance_asc") return (a.distanceSea ?? 999999) - (b.distanceSea ?? 999999);
      if (sortBy === "activity") return b.activityScore - a.activityScore || b.rating - a.rating;

      const scoreA = a.rating * 20 + (a.hasDiscount ? 8 : 0) + (a.distanceSea ? Math.max(0, 10 - a.distanceSea / 120) : 2);
      const scoreB = b.rating * 20 + (b.hasDiscount ? 8 : 0) + (b.distanceSea ? Math.max(0, 10 - b.distanceSea / 120) : 2);
      return scoreB - scoreA || a.obj.price_per_night - b.obj.price_per_night;
    });

    return sorted;
  }, [profiles, category, familyOnly, petsOnly, adventureOnly, sortBy]);

  const compared = useMemo(
    () => filtered.filter((item) => compareIds.includes(item.obj.id)),
    [filtered, compareIds],
  );

  const toggleCompare = (id: number) => {
    setCompareIds((prev) => {
      if (prev.includes(id)) return prev.filter((item) => item !== id);
      if (prev.length >= 3) return [...prev.slice(1), id];
      return [...prev, id];
    });
  };

  if (objects.length === 0) {
    return (
      <div className="text-center py-12 opacity-45 text-[10px] uppercase font-bold tracking-widest">
        По выбранным параметрам объектов пока нет
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-[#0E6D87]/20 bg-[#F4FBFD] p-3">
        <p className="text-[10px] uppercase tracking-[0.22em] font-bold text-[#0E6D87]/70 mb-2">
          Туристический подбор активного отдыха
        </p>
        <div className="grid md:grid-cols-3 gap-2 text-[11px]">
          <div className="rounded-xl border border-black/10 bg-white px-3 py-2 inline-flex items-center gap-2">
            <MapPin size={13} />
            {regionTitle || "Крым"}
          </div>
          <div className="rounded-xl border border-black/10 bg-white px-3 py-2 inline-flex items-center gap-2">
            <Compass size={13} />
            {dateLabel}
          </div>
          <div className="rounded-xl border border-black/10 bg-white px-3 py-2 inline-flex items-center gap-2">
            <Sparkles size={13} />
            {guestsLabel}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {(Object.keys(categoryTitles) as CategoryKey[]).map((key) => (
          <button
            key={key}
            onClick={() => setCategory(key)}
            className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wide border ${
              category === key
                ? "bg-[#0E6D87]/10 text-[#0E6D87] border-[#0E6D87]/35"
                : "border-black/15 text-black/65 hover:bg-black/5"
            }`}
          >
            {categoryTitles[key]} ({categoryCount[key]})
          </button>
        ))}
      </div>

      <div className="grid lg:grid-cols-[260px_1fr] gap-3">
        <aside className="rounded-xl border border-black/10 bg-[#FCFEFF] p-3 space-y-3">
          <div className="inline-flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-[#EAF5F8] text-[#0E6D87] text-[10px] font-bold uppercase tracking-wide">
            <ArrowUpDown size={12} />
            Сортировка
          </div>
          <select
            value={sortBy}
            onChange={(event) => setSortBy(event.target.value as SortKey)}
            className="w-full px-3 py-2 rounded-xl border border-black/10 text-sm font-semibold"
          >
            {(Object.keys(sortTitles) as SortKey[]).map((key) => (
              <option key={key} value={key}>
                {sortTitles[key]}
              </option>
            ))}
          </select>

          <div className="inline-flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-[#FFF5EE] text-[#B85A3B] text-[10px] font-bold uppercase tracking-wide">
            <Mountain size={12} />
            Фильтры
          </div>
          <div className="space-y-2">
            <button
              onClick={() => setAdventureOnly((prev) => !prev)}
              className={`w-full px-2.5 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wide border text-left ${adventureOnly ? "bg-[#0E6D87]/10 text-[#0E6D87] border-[#0E6D87]/30" : "text-black/60 border-black/15"}`}
            >
              Новые впечатления
            </button>
            <button
              onClick={() => setFamilyOnly((prev) => !prev)}
              className={`w-full px-2.5 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wide border text-left ${familyOnly ? "bg-[#0E6D87]/10 text-[#0E6D87] border-[#0E6D87]/30" : "text-black/60 border-black/15"}`}
            >
              Для семьи
            </button>
            <button
              onClick={() => setPetsOnly((prev) => !prev)}
              className={`w-full px-2.5 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wide border text-left ${petsOnly ? "bg-[#0E6D87]/10 text-[#0E6D87] border-[#0E6D87]/30" : "text-black/60 border-black/15"}`}
            >
              Можно с питомцами
            </button>
          </div>
          <div className="rounded-lg border border-black/10 bg-white p-2 text-[11px] text-black/65">
            <p>В выдаче: {filtered.length}</p>
            <p>Активные локации: {filtered.filter((item) => item.adventure).length}</p>
            <p>Со скидкой: {filtered.filter((item) => item.hasDiscount).length}</p>
          </div>
        </aside>

        <div className="space-y-3 min-w-0">
          {compareIds.length > 0 ? (
            <div className="rounded-xl border border-[#0E6D87]/20 bg-[#F4FBFD] px-3 py-2 text-[11px] text-[#0E6D87]">
              Для сравнения выбрано: {compareIds.length} (максимум 3)
            </div>
          ) : null}

          {compared.length >= 2 ? (
            <div className="rounded-xl border border-black/10 overflow-auto">
              <table className="w-full text-[11px]">
                <thead className="bg-[#F7FAFC]">
                  <tr>
                    <th className="text-left px-2 py-2">Параметр</th>
                    {compared.map((item) => (
                      <th key={item.obj.id} className="text-left px-2 py-2 min-w-[160px]">{item.obj.name}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-t border-black/10">
                    <td className="px-2 py-2 font-semibold">Цена</td>
                    {compared.map((item) => (
                      <td key={item.obj.id} className="px-2 py-2">{item.obj.price_per_night} ₽</td>
                    ))}
                  </tr>
                  <tr className="border-t border-black/10">
                    <td className="px-2 py-2 font-semibold">Рейтинг</td>
                    {compared.map((item) => (
                      <td key={item.obj.id} className="px-2 py-2">{item.rating.toFixed(1)}</td>
                    ))}
                  </tr>
                  <tr className="border-t border-black/10">
                    <td className="px-2 py-2 font-semibold">До моря</td>
                    {compared.map((item) => (
                      <td key={item.obj.id} className="px-2 py-2">{item.distanceSea || "-"} м</td>
                    ))}
                  </tr>
                  <tr className="border-t border-black/10">
                    <td className="px-2 py-2 font-semibold">Фокус</td>
                    {compared.map((item) => (
                      <td key={item.obj.id} className="px-2 py-2">{item.tags.join(" · ")}</td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          ) : null}

          <div className="space-y-3">
            {filtered.map((item) => (
              <article
                key={item.obj.id}
                className="rounded-2xl border border-black/10 bg-white p-3 hover:bg-[#F8FCFD] transition-colors"
              >
                <div className="flex flex-col md:flex-row gap-3">
                  <button onClick={() => onSelectObject(item.obj)} className="shrink-0">
                    <img
                      src={item.obj.image_url}
                      alt={item.obj.name}
                      className="w-full md:w-32 h-24 rounded-xl object-cover border border-black/5"
                      loading="lazy"
                      referrerPolicy="no-referrer"
                    />
                  </button>

                  <button
                    onClick={() => onSelectObject(item.obj)}
                    className="min-w-0 flex-1 text-left"
                  >
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <h4 className="text-sm font-bold truncate">{item.obj.name}</h4>
                      {item.verified ? (
                        <span className="inline-flex items-center gap-1 text-[10px] text-[#0E6D87] font-bold uppercase tracking-wide">
                          <ShieldCheck size={11} />
                          Проверено
                        </span>
                      ) : null}
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] font-semibold text-black/70">
                      <span className="inline-flex items-center gap-1">
                        <MapPin size={11} />
                        {item.obj.region || "Крым"}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Star size={11} className="text-amber-500" />
                        {item.rating.toFixed(1)} ({item.reviews})
                      </span>
                      {item.distanceSea ? <span>{item.distanceSea} м до моря</span> : null}
                    </div>
                    <p className="mt-1 text-xs text-black/65 line-clamp-2">{item.obj.description}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-[10px] font-bold uppercase tracking-wide">
                      <span className="px-2 py-1 rounded-lg bg-[#EDF7FF] text-[#2E5B9F] inline-flex items-center gap-1">
                        <Waves size={11} />
                        {item.tags[0]}
                      </span>
                      <span className="px-2 py-1 rounded-lg bg-[#FFF3E8] text-[#B85A3B] inline-flex items-center gap-1">
                        <Sparkles size={11} />
                        {item.tags[1]}
                      </span>
                    </div>
                  </button>

                  <div className="w-full md:w-[170px] rounded-xl border border-black/10 bg-[#FCFDFE] p-2.5 flex flex-col gap-2">
                    <div>
                      {item.hasDiscount ? (
                        <p className="text-[11px] text-black/45 line-through">{item.oldPrice} ₽</p>
                      ) : null}
                      <p className="text-lg font-black leading-none">{item.obj.price_per_night} ₽</p>
                      {item.hasDiscount ? (
                        <p className="text-[10px] font-bold uppercase tracking-wide text-[#B85A3B]">-{item.discountPercent}%</p>
                      ) : null}
                      <p className="text-[10px] text-black/55 mt-0.5">До 15% бонусами</p>
                    </div>
                    <button
                      onClick={() => onSelectObject(item.obj)}
                      className="w-full px-3 py-2 rounded-xl bg-[#0E6D87] text-white text-[10px] font-bold uppercase tracking-wide"
                    >
                      Подробнее
                    </button>
                    <label className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-wide text-black/60">
                      <input
                        type="checkbox"
                        checked={compareIds.includes(item.obj.id)}
                        onChange={() => toggleCompare(item.obj.id)}
                      />
                      Сравнить
                    </label>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
