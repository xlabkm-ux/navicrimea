import React, { useEffect, useMemo, useState } from "react";
import { ArrowUpDown, CalendarDays, Database, FileText, Filter, MapPin, MessageSquare, ShieldCheck, Star, Users, X } from "lucide-react";

type ListingCategory = {
  id: string;
  title: string;
  icon?: string | null;
  sort_order?: number;
};

type ListingOffer = {
  id: number;
  category_id: string;
  category_title: string;
  title: string;
  short_description?: string | null;
  district?: string | null;
  price_from?: number | null;
  rating?: number | null;
  reviews_count?: number | null;
  distance_to_sea_m?: number | null;
  has_discount?: number | null;
  discount_percent?: number | null;
  is_verified?: number | null;
  urgent_badge?: string | null;
  cover_image_url?: string | null;
};

type OfferDetails = ListingOffer & {
  full_description?: string | null;
  amenities?: string[];
  policies?: string[];
  included?: string[];
  fullCardReady?: boolean;
};

type DesignFeedback = {
  id: number;
  topic: string;
  comment: string;
  author: string;
  status: "new" | "in_review" | "planned" | "done";
  priority: "low" | "normal" | "high";
  created_at: string;
  updated_at: string;
};

type DesignDocsPayload = {
  interfaceDocName: string;
  interfaceDoc: string;
  databaseDocName: string;
  databaseDoc: string;
};

type Props = {
  open: boolean;
  onClose: () => void;
};

const SORT_OPTIONS = [
  { value: "recommended", label: "Рекомендуемое" },
  { value: "price_asc", label: "Цена: дешевле" },
  { value: "price_desc", label: "Цена: дороже" },
  { value: "distance_asc", label: "Ближе к морю" },
  { value: "rating_desc", label: "Рейтинг" },
  { value: "discount_desc", label: "Акции" },
  { value: "newest", label: "Новые" },
];

const STATUS_LABELS: Record<DesignFeedback["status"], string> = {
  new: "Новый",
  in_review: "В работе",
  planned: "Запланирован",
  done: "Готово",
};

const statusOrder: DesignFeedback["status"][] = ["new", "in_review", "planned", "done"];

export function DesignWorkshopPanel({ open, onClose }: Props) {
  const [categories, setCategories] = useState<ListingCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [sortBy, setSortBy] = useState("recommended");
  const [familyOnly, setFamilyOnly] = useState(false);
  const [petsOnly, setPetsOnly] = useState(false);
  const [freeCancellationOnly, setFreeCancellationOnly] = useState(false);
  const [offers, setOffers] = useState<ListingOffer[]>([]);
  const [compareIds, setCompareIds] = useState<number[]>([]);
  const [selectedOffer, setSelectedOffer] = useState<OfferDetails | null>(null);
  const [docs, setDocs] = useState<DesignDocsPayload | null>(null);
  const [feedback, setFeedback] = useState<DesignFeedback[]>([]);
  const [topic, setTopic] = useState("Список объектов");
  const [comment, setComment] = useState("");
  const [author, setAuthor] = useState("Команда");
  const [priority, setPriority] = useState<DesignFeedback["priority"]>("normal");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const loadOffers = async () => {
    const params = new URLSearchParams();
    if (selectedCategory) params.set("categoryId", selectedCategory);
    params.set("sortBy", sortBy);
    if (familyOnly) params.set("family", "1");
    if (petsOnly) params.set("pets", "1");
    if (freeCancellationOnly) params.set("freeCancellation", "1");
    const response = await fetch(`/api/v2/listings/offers?${params.toString()}`);
    const data = (await response.json().catch(() => [])) as ListingOffer[];
    setOffers(Array.isArray(data) ? data : []);
  };

  const loadFeedback = async () => {
    const response = await fetch("/api/v2/design/feedback");
    const data = (await response.json().catch(() => [])) as DesignFeedback[];
    setFeedback(Array.isArray(data) ? data : []);
  };

  useEffect(() => {
    if (!open) return;
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      try {
        const [categoriesRes, docsRes] = await Promise.all([
          fetch("/api/v2/listings/categories"),
          fetch("/api/v2/design/docs"),
        ]);

        if (cancelled) return;
        const categoriesData = (await categoriesRes.json().catch(() => [])) as ListingCategory[];
        const docsData = (await docsRes.json().catch(() => null)) as DesignDocsPayload | null;
        const safeCategories = Array.isArray(categoriesData) ? categoriesData : [];
        setCategories(safeCategories);
        setDocs(docsData);
        if (!selectedCategory && safeCategories.length > 0) {
          setSelectedCategory(safeCategories[0].id);
        }
        await Promise.all([loadOffers(), loadFeedback()]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    void loadOffers();
  }, [selectedCategory, sortBy, familyOnly, petsOnly, freeCancellationOnly, open]);

  useEffect(() => {
    const available = new Set(offers.map((item) => item.id));
    setCompareIds((prev) => prev.filter((id) => available.has(id)));
  }, [offers]);

  const openOfferDetails = async (offerId: number) => {
    const response = await fetch(`/api/v2/listings/offers/${offerId}`);
    const data = (await response.json().catch(() => null)) as OfferDetails | null;
    setSelectedOffer(data);
  };

  const toggleCompare = (offerId: number) => {
    setCompareIds((prev) => {
      if (prev.includes(offerId)) return prev.filter((id) => id !== offerId);
      if (prev.length >= 3) return [...prev.slice(1), offerId];
      return [...prev, offerId];
    });
  };

  const handleSaveFeedback = async () => {
    const trimmedTopic = topic.trim();
    const trimmedComment = comment.trim();
    if (!trimmedTopic || !trimmedComment) return;
    setSaving(true);
    try {
      const response = await fetch("/api/v2/design/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: trimmedTopic,
          comment: trimmedComment,
          author: author.trim() || "Команда",
          priority,
        }),
      });
      if (response.ok) {
        setComment("");
        await loadFeedback();
      }
    } finally {
      setSaving(false);
    }
  };

  const updateFeedbackStatus = async (id: number, status: DesignFeedback["status"]) => {
    const response = await fetch(`/api/v2/design/feedback/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (response.ok) {
      await loadFeedback();
    }
  };

  const selectedCategoryTitle = useMemo(() => {
    const found = categories.find((item) => item.id === selectedCategory);
    return found?.title || "Все категории";
  }, [categories, selectedCategory]);

  const comparedOffers = useMemo(
    () => offers.filter((offer) => compareIds.includes(offer.id)),
    [offers, compareIds],
  );

  const filtersStats = useMemo(() => {
    const total = offers.length;
    const withDiscount = offers.filter((item) => Number(item.has_discount) === 1).length;
    const topRated = offers.filter((item) => Number(item.rating || 0) >= 4.7).length;
    const nearSea = offers.filter((item) => Number(item.distance_to_sea_m || 999999) <= 300).length;
    return { total, withDiscount, topRated, nearSea };
  }, [offers]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[240] bg-black/55 backdrop-blur-sm p-3 md:p-6" onClick={onClose}>
      <div
        className="mx-auto w-full max-w-[1280px] h-[92vh] bg-white rounded-3xl border border-black/10 shadow-2xl overflow-hidden flex flex-col"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="px-4 md:px-6 py-4 border-b border-black/10 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-black/45">Проектирование</p>
            <h2 className="text-xl md:text-2xl font-serif leading-none">Интерфейс обсуждения и доработки</h2>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-xl border border-black/10 inline-flex items-center justify-center text-black/60 hover:bg-black/5"
            aria-label="Закрыть"
          >
            <X size={18} />
          </button>
        </header>

        <div className="flex-1 min-h-0 grid grid-cols-1 xl:grid-cols-[1.45fr_1fr]">
          <div className="min-h-0 overflow-y-auto p-4 md:p-6 space-y-5">
            <section className="rounded-2xl border border-black/10 p-4 bg-[#FCFEFF]">
              <div className="flex items-center gap-2 mb-3">
                <FileText size={15} className="text-[#0E6D87]" />
                <p className="text-[11px] font-bold uppercase tracking-widest text-black/65">Документы</p>
              </div>
              <div className="grid md:grid-cols-2 gap-3">
                <article className="rounded-xl border border-black/10 bg-white p-3">
                  <h3 className="text-xs font-bold uppercase tracking-wide mb-2">{docs?.interfaceDocName || "Описние интерфейса"}</h3>
                  <pre className="text-[11px] leading-5 whitespace-pre-wrap font-sans max-h-52 overflow-auto text-black/70">
                    {docs?.interfaceDoc || "Документ загружается..."}
                  </pre>
                </article>
                <article className="rounded-xl border border-black/10 bg-white p-3">
                  <h3 className="text-xs font-bold uppercase tracking-wide mb-2">{docs?.databaseDocName || "База данных, структура и данные"}</h3>
                  <pre className="text-[11px] leading-5 whitespace-pre-wrap font-sans max-h-52 overflow-auto text-black/70">
                    {docs?.databaseDoc || "Документ загружается..."}
                  </pre>
                </article>
              </div>
            </section>

            <section className="rounded-2xl border border-black/10 p-4 bg-white">
              <div className="rounded-2xl border border-[#0E6D87]/20 bg-[#F5FBFD] p-3 mb-4">
                <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-[#0E6D87]/70 mb-2">Референс паттерна Яндекс</p>
                <div className="grid md:grid-cols-3 gap-2 text-[11px]">
                  <div className="rounded-xl border border-black/10 bg-white px-3 py-2 inline-flex items-center gap-2">
                    <MapPin size={13} />
                    Зеленоградск
                  </div>
                  <div className="rounded-xl border border-black/10 bg-white px-3 py-2 inline-flex items-center gap-2">
                    <CalendarDays size={13} />
                    20 мар - 21 мар
                  </div>
                  <div className="rounded-xl border border-black/10 bg-white px-3 py-2 inline-flex items-center gap-2">
                    <Users size={13} />
                    2 взрослых
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mb-3">
                {categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wide border ${
                      selectedCategory === category.id
                        ? "bg-[#0E6D87]/10 text-[#0E6D87] border-[#0E6D87]/35"
                        : "border-black/15 text-black/65 hover:bg-black/5"
                    }`}
                  >
                    {category.title}
                  </button>
                ))}
              </div>

              <div className="grid lg:grid-cols-[260px_1fr] gap-3">
                <aside className="rounded-xl border border-black/10 bg-[#FCFEFF] p-3 space-y-3">
                  <div className="inline-flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-[#EAF5F8] text-[#0E6D87] text-[10px] font-bold uppercase tracking-wide">
                    <Filter size={12} />
                    Фильтры
                  </div>
                  <div className="space-y-2">
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
                      Можно с животными
                    </button>
                    <button
                      onClick={() => setFreeCancellationOnly((prev) => !prev)}
                      className={`w-full px-2.5 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wide border text-left ${freeCancellationOnly ? "bg-[#0E6D87]/10 text-[#0E6D87] border-[#0E6D87]/30" : "text-black/60 border-black/15"}`}
                    >
                      Бесплатная отмена
                    </button>
                  </div>
                  <div className="rounded-lg border border-black/10 bg-white p-2 text-[11px] text-black/65">
                    <p>Найдено: {filtersStats.total}</p>
                    <p>Со скидкой: {filtersStats.withDiscount}</p>
                    <p>Рейтинг 4.7+: {filtersStats.topRated}</p>
                    <p>До 300м до моря: {filtersStats.nearSea}</p>
                  </div>
                </aside>

                <div className="space-y-3 min-w-0">
                  <div className="rounded-xl border border-black/10 bg-[#FFF9F3] p-2 flex flex-wrap items-center justify-between gap-2">
                    <div className="inline-flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-white text-[#B85A3B] text-[10px] font-bold uppercase tracking-wide border border-[#F5D6BF]">
                      <ArrowUpDown size={12} />
                      Сортировка
                    </div>
                    <select
                      value={sortBy}
                      onChange={(event) => setSortBy(event.target.value)}
                      className="px-3 py-2 rounded-xl border border-black/10 text-sm font-semibold"
                    >
                      {SORT_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {compareIds.length > 0 ? (
                    <div className="rounded-xl border border-[#0E6D87]/20 bg-[#F4FBFD] px-3 py-2 text-[11px] text-[#0E6D87]">
                      Для сравнения выбрано: {compareIds.length} (максимум 3)
                    </div>
                  ) : null}

                  {comparedOffers.length >= 2 ? (
                    <div className="rounded-xl border border-black/10 overflow-auto">
                      <table className="w-full text-[11px]">
                        <thead className="bg-[#F7FAFC]">
                          <tr>
                            <th className="text-left px-2 py-2">Параметр</th>
                            {comparedOffers.map((item) => (
                              <th key={item.id} className="text-left px-2 py-2 min-w-[160px]">{item.title}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="border-t border-black/10">
                            <td className="px-2 py-2 font-semibold">Цена</td>
                            {comparedOffers.map((item) => (
                              <td key={item.id} className="px-2 py-2">{item.price_from || 0} ₽</td>
                            ))}
                          </tr>
                          <tr className="border-t border-black/10">
                            <td className="px-2 py-2 font-semibold">Рейтинг</td>
                            {comparedOffers.map((item) => (
                              <td key={item.id} className="px-2 py-2">{(item.rating || 0).toFixed(1)}</td>
                            ))}
                          </tr>
                          <tr className="border-t border-black/10">
                            <td className="px-2 py-2 font-semibold">До моря</td>
                            {comparedOffers.map((item) => (
                              <td key={item.id} className="px-2 py-2">{item.distance_to_sea_m || "-"} м</td>
                            ))}
                          </tr>
                          <tr className="border-t border-black/10">
                            <td className="px-2 py-2 font-semibold">Скидка</td>
                            {comparedOffers.map((item) => (
                              <td key={item.id} className="px-2 py-2">{item.has_discount ? `${item.discount_percent || 0}%` : "-"}</td>
                            ))}
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  ) : null}

                  <div className="space-y-3 max-h-[470px] overflow-auto pr-1">
                    {loading && <p className="text-sm text-black/45">Загрузка...</p>}
                    {!loading && offers.length === 0 && <p className="text-sm text-black/45">Нет предложений по выбранным фильтрам.</p>}
                    {offers.map((offer) => {
                      const withDiscount = Number(offer.has_discount) === 1;
                      const basePrice = Number(offer.price_from || 0);
                      const oldPrice = withDiscount
                        ? Math.round((basePrice * 100) / (100 - Number(offer.discount_percent || 0)))
                        : basePrice;

                      return (
                        <article
                          key={offer.id}
                          className="rounded-2xl border border-black/10 bg-white p-3 hover:bg-[#F8FCFD] transition-colors"
                        >
                          <div className="flex flex-col md:flex-row gap-3">
                            <button onClick={() => void openOfferDetails(offer.id)} className="shrink-0">
                              <img
                                src={offer.cover_image_url || "/images/hero-coast-1.svg"}
                                alt={offer.title}
                                className="w-full md:w-32 h-24 rounded-xl object-cover border border-black/5"
                                loading="lazy"
                              />
                            </button>

                            <button
                              onClick={() => void openOfferDetails(offer.id)}
                              className="min-w-0 flex-1 text-left"
                            >
                              <div className="flex flex-wrap items-center gap-2 mb-1">
                                <h4 className="text-sm font-bold truncate">{offer.title}</h4>
                                {offer.is_verified ? (
                                  <span className="inline-flex items-center gap-1 text-[10px] text-[#0E6D87] font-bold uppercase tracking-wide">
                                    <ShieldCheck size={11} />
                                    Проверено
                                  </span>
                                ) : null}
                              </div>
                              <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] font-semibold text-black/70">
                                <span className="inline-flex items-center gap-1">
                                  <MapPin size={11} />
                                  {offer.district || "Крым"}
                                </span>
                                <span className="inline-flex items-center gap-1">
                                  <Star size={11} className="text-amber-500" />
                                  {(offer.rating || 0).toFixed(1)} ({offer.reviews_count || 0})
                                </span>
                                {offer.distance_to_sea_m ? <span>{offer.distance_to_sea_m} м до моря</span> : null}
                              </div>
                              <p className="mt-1 text-xs text-black/65">{offer.short_description}</p>
                              {offer.urgent_badge ? (
                                <span className="mt-2 inline-flex px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wide bg-[#EEF5FF] text-[#2E5B9F]">
                                  {offer.urgent_badge}
                                </span>
                              ) : null}
                            </button>

                            <div className="w-full md:w-[170px] rounded-xl border border-black/10 bg-[#FCFDFE] p-2.5 flex flex-col gap-2">
                              <div>
                                {withDiscount ? (
                                  <p className="text-[11px] text-black/45 line-through">{oldPrice} ₽</p>
                                ) : null}
                                <p className="text-lg font-black leading-none">{basePrice} ₽</p>
                                {withDiscount ? (
                                  <p className="text-[10px] font-bold uppercase tracking-wide text-[#B85A3B]">-{offer.discount_percent || 0}%</p>
                                ) : null}
                                <p className="text-[10px] text-black/55 mt-0.5">До 15% баллами</p>
                              </div>
                              <button
                                onClick={() => void openOfferDetails(offer.id)}
                                className="w-full px-3 py-2 rounded-xl bg-[#0E6D87] text-white text-[10px] font-bold uppercase tracking-wide"
                              >
                                Выбрать
                              </button>
                              <label className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-wide text-black/60">
                                <input
                                  type="checkbox"
                                  checked={compareIds.includes(offer.id)}
                                  onChange={() => toggleCompare(offer.id)}
                                />
                                Сравнить
                              </label>
                            </div>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                </div>
              </div>
            </section>
          </div>

          <aside className="min-h-0 border-t xl:border-t-0 xl:border-l border-black/10 overflow-y-auto p-4 md:p-6 bg-[#FCFDFE] space-y-4">
            <section className="rounded-2xl border border-black/10 bg-white p-4">
              <div className="flex items-center gap-2 mb-2">
                <Database size={15} className="text-[#0E6D87]" />
                <h3 className="text-xs font-bold uppercase tracking-wide">Полная карточка объекта</h3>
              </div>
              {selectedOffer ? (
                <div className="space-y-2">
                  <p className="text-sm font-bold">{selectedOffer.title}</p>
                  <p className="text-xs text-black/65">{selectedOffer.full_description}</p>
                  <div className="text-[11px] text-black/65">
                    {selectedOffer.amenities?.length ? `Удобства: ${selectedOffer.amenities.join(", ")}` : "Удобства пока не заполнены."}
                  </div>
                  <div className="text-[11px] text-black/65">
                    {selectedOffer.policies?.length ? `Условия: ${selectedOffer.policies.join(", ")}` : "Условия пока не заполнены."}
                  </div>
                  <div className="text-[10px] font-bold uppercase tracking-wide text-[#B85A3B]">Контент полной карточки в разработке</div>
                </div>
              ) : (
                <p className="text-sm text-black/45">Выберите элемент списка, чтобы открыть карточку объекта.</p>
              )}
            </section>

            <section className="rounded-2xl border border-black/10 bg-white p-4">
              <div className="flex items-center gap-2 mb-3">
                <MessageSquare size={15} className="text-[#0E6D87]" />
                <h3 className="text-xs font-bold uppercase tracking-wide">Обсуждение и доработка</h3>
              </div>
              <div className="space-y-2 mb-3">
                <input
                  value={topic}
                  onChange={(event) => setTopic(event.target.value)}
                  placeholder="Тема"
                  className="w-full px-3 py-2 rounded-xl border border-black/10 text-sm"
                />
                <textarea
                  value={comment}
                  onChange={(event) => setComment(event.target.value)}
                  placeholder="Комментарий по доработке"
                  className="w-full px-3 py-2 rounded-xl border border-black/10 text-sm min-h-[84px]"
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    value={author}
                    onChange={(event) => setAuthor(event.target.value)}
                    placeholder="Автор"
                    className="w-full px-3 py-2 rounded-xl border border-black/10 text-sm"
                  />
                  <select
                    value={priority}
                    onChange={(event) => setPriority(event.target.value as DesignFeedback["priority"])}
                    className="w-full px-3 py-2 rounded-xl border border-black/10 text-sm"
                  >
                    <option value="low">Низкий</option>
                    <option value="normal">Средний</option>
                    <option value="high">Высокий</option>
                  </select>
                </div>
                <button
                  onClick={() => void handleSaveFeedback()}
                  disabled={saving || !topic.trim() || !comment.trim()}
                  className="w-full px-3 py-2 rounded-xl bg-[#0E6D87] text-white text-xs font-bold uppercase tracking-wide disabled:opacity-60"
                >
                  {saving ? "Сохранение..." : "Добавить комментарий"}
                </button>
              </div>

              <div className="space-y-2 max-h-[260px] overflow-auto pr-1">
                {feedback.map((item) => (
                  <div key={item.id} className="rounded-xl border border-black/10 p-3">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <p className="text-xs font-bold">{item.topic}</p>
                      <span className="text-[10px] text-black/45">{item.author}</span>
                    </div>
                    <p className="text-[11px] text-black/70 mb-2 whitespace-pre-wrap">{item.comment}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {statusOrder.map((status) => (
                        <button
                          key={status}
                          onClick={() => void updateFeedbackStatus(item.id, status)}
                          className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wide border ${
                            item.status === status
                              ? "bg-[#0E6D87]/10 text-[#0E6D87] border-[#0E6D87]/30"
                              : "text-black/55 border-black/15"
                          }`}
                        >
                          {STATUS_LABELS[status]}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </aside>
        </div>
      </div>
    </div>
  );
}
