
import React, { useState, useRef } from 'react';
import { 
  Star, 
  Camera, 
  Video, 
  CheckCircle2, 
  Circle, 
  MapPin, 
  Calendar, 
  ChevronRight, 
  Plus, 
  X, 
  RefreshCw, 
  Bike, 
  Music, 
  Trophy, 
  Palette, 
  Mic2, 
  Utensils, 
  Library, 
  Trees, 
  Zap,
  Image as ImageIcon,
  MessageSquare,
  ExternalLink
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Impression, QuestCategory, VisitedPlace } from '../types';

interface ImpressionsManagerProps {
  visitedPlaces: VisitedPlace[];
  impressions: Impression[];
  onAddImpression: (impression: Impression) => void;
  onSyncYandex: () => void;
  isYandexLinked: boolean;
  onClose: () => void;
}

const CATEGORIES: { id: string; name: string; icon: any; total: number }[] = [
  { id: 'cycling', name: 'Велосипед', icon: Bike, total: 10 },
  { id: 'scooter', name: 'Скутер', icon: Zap, total: 10 },
  { id: 'music', name: 'Музыка', icon: Music, total: 5 },
  { id: 'sport', name: 'Спорт', icon: Trophy, total: 10 },
  { id: 'culture', name: 'Культура', icon: Library, total: 8 },
  { id: 'painting', name: 'Живопись', icon: Palette, total: 5 },
  { id: 'opera', name: 'Опера', icon: Mic2, total: 3 },
  { id: 'gastronomy', name: 'Гастрономия', icon: Utensils, total: 12 },
  { id: 'museums', name: 'Музеи', icon: Library, total: 15 },
  { id: 'nature', name: 'Природа', icon: Trees, total: 20 },
  { id: 'active', name: 'Активный отдых', icon: Trophy, total: 10 },
  { id: 'news', name: 'Новости', icon: MessageSquare, total: 5 },
];

export const ImpressionsManager: React.FC<ImpressionsManagerProps> = ({
  visitedPlaces,
  impressions,
  onAddImpression,
  onSyncYandex,
  isYandexLinked,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<'quest' | 'history'>('quest');
  const [selectedPlace, setSelectedPlace] = useState<VisitedPlace | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [video, setVideo] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const getCategoryStats = (catId: string) => {
    const count = visitedPlaces.filter(p => p.category === catId).length;
    const cat = CATEGORIES.find(c => c.id === catId);
    return {
      count,
      total: cat?.total || 10,
      discovered: count > 0
    };
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newPhotos = Array.from(files).slice(0, 10).map(f => URL.createObjectURL(f as Blob));
      setPhotos(prev => [...prev, ...newPhotos].slice(0, 10));
    }
  };

  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 30 * 1024 * 1024) {
        alert("Видео не должно превышать 30 МБ");
        return;
      }
      setVideo(URL.createObjectURL(file as Blob));
    }
  };

  const handleSubmit = () => {
    if (!selectedPlace) return;
    
    const newImpression: Impression = {
      id: Math.random().toString(36).substr(2, 9),
      placeId: selectedPlace.id,
      placeName: selectedPlace.name,
      category: selectedPlace.category,
      rating,
      comment,
      photos,
      video: video || undefined,
      timestamp: Date.now(),
      yandexSynced: false
    };

    onAddImpression(newImpression);
    setIsAdding(false);
    setSelectedPlace(null);
    setRating(0);
    setComment('');
    setPhotos([]);
    setVideo(null);
  };

  const handleSync = async () => {
    setIsSyncing(true);
    onSyncYandex();
    // Simulate sync delay
    await new Promise(r => setTimeout(r, 2000));
    setIsSyncing(false);
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="p-6 border-b border-black/5 flex items-center justify-between bg-purple-50/50">
        <div>
          <h2 className="text-2xl font-serif italic text-purple-900">Мои Впечатления</h2>
          <p className="text-[10px] uppercase tracking-widest text-purple-600/60 font-bold">Квест-карта ваших путешествий</p>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-black/5 rounded-full transition-colors">
          <X size={20} />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-black/5">
        <button 
          onClick={() => setActiveTab('quest')}
          className={`flex-1 py-4 text-[10px] font-bold uppercase tracking-widest transition-all ${activeTab === 'quest' ? 'text-purple-600 border-b-2 border-purple-600' : 'opacity-40'}`}
        >
          Квест-карта
        </button>
        <button 
          onClick={() => setActiveTab('history')}
          className={`flex-1 py-4 text-[10px] font-bold uppercase tracking-widest transition-all ${activeTab === 'history' ? 'text-purple-600 border-b-2 border-purple-600' : 'opacity-40'}`}
        >
          История посещений
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {activeTab === 'quest' ? (
          <div className="space-y-8">
            {/* Yandex Sync Section */}
            <div className="bg-gradient-to-br from-purple-600 to-indigo-700 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden">
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                      <RefreshCw size={16} className={isSyncing ? 'animate-spin' : ''} />
                    </div>
                    <span className="text-xs font-bold uppercase tracking-wider">Синхронизация с Яндекс</span>
                  </div>
                  {isYandexLinked ? (
                    <span className="text-[8px] bg-emerald-500/30 px-2 py-1 rounded-full font-bold uppercase">Подключено</span>
                  ) : (
                    <span className="text-[8px] bg-white/20 px-2 py-1 rounded-full font-bold uppercase">Не привязано</span>
                  )}
                </div>
                <p className="text-sm opacity-80 mb-6">Синхронизируйте ваши отзывы и оценки с Яндекс Картами автоматически.</p>
                <button 
                  onClick={handleSync}
                  disabled={isSyncing}
                  className="w-full py-3 bg-white text-purple-700 rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-purple-50 transition-colors flex items-center justify-center gap-2"
                >
                  {isSyncing ? 'Синхронизация...' : 'Обновить данные'}
                  <ExternalLink size={12} />
                </button>
              </div>
              <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-white/10 rounded-full blur-3xl" />
            </div>

            {/* Quest Grid */}
            <div className="grid grid-cols-2 gap-4">
              {CATEGORIES.map(cat => {
                const stats = getCategoryStats(cat.id);
                const Icon = cat.icon;
                return (
                  <div 
                    key={cat.id}
                    className={`p-4 rounded-2xl border transition-all ${stats.discovered ? 'bg-white border-purple-100 shadow-sm' : 'bg-gray-50 border-transparent opacity-50 grayscale'}`}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${stats.discovered ? 'bg-purple-100 text-purple-600' : 'bg-gray-200 text-gray-400'}`}>
                        <Icon size={20} />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-gray-900">{cat.name}</h4>
                        <p className="text-[8px] uppercase tracking-tighter opacity-40">
                          {stats.count} / {stats.total} посещений
                        </p>
                      </div>
                    </div>
                    <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${(stats.count / stats.total) * 100}%` }}
                        className="h-full bg-purple-500"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {visitedPlaces.length === 0 ? (
              <div className="text-center py-12 opacity-40">
                <MapPin size={48} className="mx-auto mb-4" />
                <p className="text-sm">Вы еще не посетили ни одного места.</p>
                <p className="text-[10px] uppercase mt-2">Начните свое путешествие!</p>
              </div>
            ) : (
              visitedPlaces.map(place => {
                const impression = impressions.find(i => i.placeId === place.id);
                return (
                  <div key={place.id} className="bg-white border border-black/5 rounded-2xl p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex gap-3">
                        <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center text-purple-600">
                          {CATEGORIES.find(c => c.id === place.category)?.icon({ size: 24 }) || <MapPin size={24} />}
                        </div>
                        <div>
                          <h4 className="font-bold text-sm">{place.name}</h4>
                          <div className="flex items-center gap-2 text-[10px] opacity-40">
                            <Calendar size={10} />
                            <span>{new Date(place.visitDate).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                      {!impression && (
                        <button 
                          onClick={() => {
                            setSelectedPlace(place);
                            setIsAdding(true);
                          }}
                          className="px-3 py-1.5 bg-purple-600 text-white rounded-lg text-[8px] font-bold uppercase tracking-widest hover:bg-purple-700 transition-colors flex items-center gap-1"
                        >
                          <Plus size={10} />
                          Оставить отзыв
                        </button>
                      )}
                    </div>

                    {impression && (
                      <div className="mt-4 pt-4 border-t border-black/5">
                        <div className="flex items-center gap-1 mb-2">
                          {[1, 2, 3, 4, 5].map(s => (
                            <Star key={s} size={12} className={s <= impression.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-200'} />
                          ))}
                        </div>
                        <p className="text-xs text-gray-600 italic mb-4">"{impression.comment}"</p>
                        
                        {(impression.photos.length > 0 || impression.video) && (
                          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                            {impression.photos.map((p, idx) => (
                              <img key={idx} src={p} className="w-16 h-16 rounded-lg object-cover flex-shrink-0" alt="Impression" />
                            ))}
                            {impression.video && (
                              <div className="w-16 h-16 rounded-lg bg-black/5 flex items-center justify-center flex-shrink-0 relative">
                                <Video size={16} className="text-purple-600" />
                                <div className="absolute bottom-1 right-1 w-2 h-2 bg-purple-600 rounded-full animate-pulse" />
                              </div>
                            )}
                          </div>
                        )}

                        <div className="mt-4 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {impression.yandexSynced ? (
                              <span className="flex items-center gap-1 text-[8px] font-bold text-emerald-600 uppercase">
                                <CheckCircle2 size={10} />
                                Синхронизировано с Яндекс
                              </span>
                            ) : (
                              <span className="text-[8px] font-bold text-amber-600 uppercase">Ожидает синхронизации</span>
                            )}
                          </div>
                          <button className="text-[8px] font-bold uppercase text-purple-600 hover:underline">Изменить</button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* Add Impression Modal */}
      <AnimatePresence>
        {isAdding && selectedPlace && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl"
            >
              <div className="p-6 border-b border-black/5 flex items-center justify-between bg-purple-50/50">
                <div>
                  <h3 className="text-xl font-serif italic text-purple-900">Ваши впечатления</h3>
                  <p className="text-[10px] uppercase tracking-widest text-purple-600/60 font-bold">{selectedPlace.name}</p>
                </div>
                <button onClick={() => setIsAdding(false)} className="p-2 hover:bg-black/5 rounded-full transition-colors">
                  <X size={20} />
                </button>
              </div>

              <div className="p-6 space-y-6">
                {/* Rating */}
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest opacity-40 mb-3 block">Оценка</label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map(s => (
                      <button 
                        key={s} 
                        onClick={() => setRating(s)}
                        className={`p-2 transition-all ${s <= rating ? 'text-amber-400 scale-110' : 'text-gray-200 hover:text-amber-200'}`}
                      >
                        <Star size={32} className={s <= rating ? 'fill-current' : ''} />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Comment */}
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest opacity-40 mb-3 block">Отзыв</label>
                  <textarea 
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Поделитесь вашими впечатлениями от этого места..."
                    className="w-full h-32 p-4 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-purple-500/20 resize-none text-sm"
                  />
                </div>

                {/* Media */}
                <div className="grid grid-cols-2 gap-4">
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="flex flex-col items-center justify-center p-4 bg-purple-50 rounded-2xl border-2 border-dashed border-purple-200 hover:bg-purple-100 transition-colors gap-2"
                  >
                    <Camera size={24} className="text-purple-600" />
                    <span className="text-[8px] font-bold uppercase tracking-widest text-purple-600">Фото (до 10)</span>
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      onChange={handlePhotoUpload} 
                      multiple 
                      accept="image/*" 
                      className="hidden" 
                    />
                  </button>
                  <button 
                    onClick={() => videoInputRef.current?.click()}
                    className="flex flex-col items-center justify-center p-4 bg-purple-50 rounded-2xl border-2 border-dashed border-purple-200 hover:bg-purple-100 transition-colors gap-2"
                  >
                    <Video size={24} className="text-purple-600" />
                    <span className="text-[8px] font-bold uppercase tracking-widest text-purple-600">Видео (до 30МБ)</span>
                    <input 
                      type="file" 
                      ref={videoInputRef} 
                      onChange={handleVideoUpload} 
                      accept="video/*" 
                      className="hidden" 
                    />
                  </button>
                </div>

                {/* Media Preview */}
                {(photos.length > 0 || video) && (
                  <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                    {photos.map((p, idx) => (
                      <div key={idx} className="relative flex-shrink-0">
                        <img src={p} className="w-16 h-16 rounded-lg object-cover" alt="Preview" />
                        <button 
                          onClick={() => setPhotos(prev => prev.filter((_, i) => i !== idx))}
                          className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5"
                        >
                          <X size={10} />
                        </button>
                      </div>
                    ))}
                    {video && (
                      <div className="relative flex-shrink-0">
                        <div className="w-16 h-16 rounded-lg bg-black/5 flex items-center justify-center">
                          <Video size={16} className="text-purple-600" />
                        </div>
                        <button 
                          onClick={() => setVideo(null)}
                          className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5"
                        >
                          <X size={10} />
                        </button>
                      </div>
                    )}
                  </div>
                )}

                <button 
                  onClick={handleSubmit}
                  disabled={rating === 0 || !comment}
                  className="w-full py-4 bg-purple-600 text-white rounded-2xl font-bold uppercase tracking-[0.2em] text-xs hover:bg-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-xl shadow-purple-500/20"
                >
                  Сохранить впечатления
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
