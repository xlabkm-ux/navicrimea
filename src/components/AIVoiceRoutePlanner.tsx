import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mic, X, Clock, CreditCard, Navigation, Star, CheckCircle2, ChevronRight, Sparkles } from 'lucide-react';

type GeneratedRoute = {
  id: string;
  title: string;
  description: string;
  totalDuration: string;
  totalCost: number;
  stops: Array<{ id: string; name: string; description: string; durationMinutes: number; arrivalTime: string; costEstimate?: number }>;
  alternativeRoutes?: GeneratedRoute[];
};

const BEST_CASES = [
  { id: 1, title: 'Золотое кольцо ЮБК', image: 'https://picsum.photos/seed/crimea1/800/600', description: 'Дворцы, парки и море' },
  { id: 2, title: 'Винный путь', image: 'https://picsum.photos/seed/crimea2/800/600', description: 'Лучшие винодельни Севастополя' },
  { id: 3, title: 'Пещерные города', image: 'https://picsum.photos/seed/crimea3/800/600', description: 'История Бахчисарая' },
  { id: 4, title: 'Активный Тарханкут', image: 'https://picsum.photos/seed/crimea4/800/600', description: 'Дайвинг и скалы' },
];

export const AIVoiceRoutePlanner = ({ onClose, onRouteGenerated, isVip = false }: any) => {
  const [isListening, setIsListening] = useState(false);
  const [chatHistory, setChatHistory] = useState<{ role: 'user' | 'bot'; text: string }[]>([]);
  const [currentRoute, setCurrentRoute] = useState<GeneratedRoute | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showVipModal, setShowVipModal] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, currentRoute]);

  const addBotMessage = (text: string) => setChatHistory((prev) => [...prev, { role: 'bot', text }]);

  const processAIRequest = async (input: string) => {
    setIsGenerating(true);
    addBotMessage('Анализирую запрос и строю маршрут...');

    try {
      const response = await fetch('/api/v1/ai/route', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: input }),
      });
      const data = await response.json();
      if (data.reply) {
        setChatHistory((prev) => [...prev, { role: 'bot', text: data.reply }]);
      }
      if (data.route) {
        setCurrentRoute(data.route);
        onRouteGenerated?.(data.route);
      }
    } catch (error) {
      console.error(error);
      addBotMessage('Не удалось построить маршрут. Попробуйте еще раз.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleVoiceInput = () => {
    if (!isVip) {
      setShowVipModal(true);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Ваш браузер не поддерживает голосовой ввод.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'ru-RU';
    recognition.onstart = () => setIsListening(true);
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setIsListening(false);
      setChatHistory((prev) => [...prev, { role: 'user', text: transcript }]);
      void processAIRequest(transcript);
    };
    recognition.onerror = recognition.onend = () => setIsListening(false);
    recognition.start();
  };

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="p-6 border-b border-accent-purple/10 flex items-center justify-between bg-peach-bg">
        <div>
          <h2 className="text-xl font-serif flex items-center gap-2"><Sparkles className="text-accent-purple" size={20} />AI Гид-Навигатор</h2>
          <p className="text-[10px] uppercase font-bold tracking-widest opacity-40">Персональные маршруты</p>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-accent-purple/10 rounded-full"><X size={20} /></button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
        {chatHistory.length === 0 && !currentRoute && (
          <div className="space-y-8">
            <div className="grid grid-cols-2 gap-3">
              {BEST_CASES.map((item) => <div key={item.id} className="relative aspect-[4/3] rounded-2xl overflow-hidden opacity-80"><img src={item.image} className="w-full h-full object-cover" alt={item.title} /><div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" /><div className="absolute bottom-3 left-3 right-3 text-white"><p className="text-[10px] font-bold leading-tight">{item.title}</p><p className="text-[8px] text-white/60 uppercase tracking-tighter">{item.description}</p></div></div>)}
            </div>
            <div className="bg-peach-bg rounded-3xl p-6 text-center space-y-4 border border-accent-purple/10"><div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto border border-accent-purple/10"><Mic className="text-accent-purple" size={32} /></div><div><h3 className="font-serif text-lg">Создайте свой идеальный день</h3><p className="text-xs text-black/50 leading-relaxed">Нажмите на кнопку и опишите маршрут голосом.</p></div></div>
          </div>
        )}

        <div className="space-y-4">
          {chatHistory.map((msg, idx) => <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}><div className={`max-w-[85%] p-4 rounded-2xl text-sm ${msg.role === 'user' ? 'bg-purple-600 text-white rounded-tr-none' : 'bg-black/5 text-black rounded-tl-none'}`}>{msg.text}</div></motion.div>)}
          {isGenerating && <div className="flex justify-start"><div className="bg-black/5 p-4 rounded-2xl rounded-tl-none">Строю маршрут...</div></div>}
          <div ref={chatEndRef} />
        </div>

        {currentRoute && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-4">
            <div className="p-5 bg-white border border-accent-purple/10 rounded-3xl shadow-xl shadow-accent-purple/5 space-y-4">
              <div className="flex items-center justify-between"><h4 className="font-serif text-lg text-accent-purple">{currentRoute.title}</h4><div className="flex items-center gap-1 bg-accent-purple/10 text-accent-purple px-2 py-1 rounded-full text-[10px] font-bold"><Star size={10} fill="currentColor" />VIP</div></div>
              <p className="text-xs text-black/60 leading-relaxed">{currentRoute.description}</p>
              <div className="grid grid-cols-2 gap-3"><div className="p-3 bg-peach-bg rounded-2xl flex items-center gap-3 border border-accent-purple/5"><Clock className="text-accent-purple" size={16} /><div><p className="text-[8px] uppercase font-bold opacity-40">Время</p><p className="text-xs font-bold">{currentRoute.totalDuration}</p></div></div><div className="p-3 bg-peach-bg rounded-2xl flex items-center gap-3 border border-accent-purple/5"><CreditCard className="text-accent-purple" size={16} /><div><p className="text-[8px] uppercase font-bold opacity-40">Бюджет</p><p className="text-xs font-bold">₽{currentRoute.totalCost.toLocaleString()}</p></div></div></div>
              <div className="space-y-3 pt-2">{currentRoute.stops.map((stop, idx) => <div key={stop.id} className="flex gap-3"><div className="w-6 h-6 rounded-full bg-purple-600 text-white flex items-center justify-center text-[10px] font-bold">{idx + 1}</div><div className="flex-1 pb-2"><div className="flex items-center justify-between mb-1"><p className="text-xs font-bold">{stop.name}</p><span className="text-[10px] font-mono opacity-40">{stop.arrivalTime}</span></div><p className="text-[10px] text-black/50 leading-tight mb-2">{stop.description}</p><div className="text-[9px] font-bold uppercase tracking-wider text-purple-600/60">{stop.durationMinutes} мин</div></div></div>)}</div>
              <button className="w-full py-4 bg-accent-purple text-white rounded-xl font-bold uppercase tracking-widest text-[10px] flex items-center justify-center gap-2"><Navigation size={14} />Начать маршрут</button>
            </div>
            {currentRoute.alternativeRoutes && currentRoute.alternativeRoutes.length > 0 && <div className="space-y-3"><p className="text-[10px] uppercase font-bold tracking-widest opacity-40 px-2">Альтернативные варианты</p>{currentRoute.alternativeRoutes.map((alt, idx) => <button key={idx} onClick={() => setCurrentRoute(alt)} className="w-full p-4 bg-white border border-black/5 rounded-2xl flex items-center justify-between hover:border-purple-200 text-left"><div><p className="text-xs font-bold">{alt.title}</p><p className="text-[10px] opacity-40">{alt.totalDuration} • ₽{alt.totalCost.toLocaleString()}</p></div><ChevronRight size={16} className="opacity-20" /></button>)}</div>}
          </motion.div>
        )}
      </div>

      <div className="p-6 border-t border-black/5 bg-white"><button onClick={handleVoiceInput} disabled={isGenerating} className={`w-full py-6 rounded-3xl flex items-center justify-center gap-4 border ${isListening ? 'bg-red-500 text-white border-red-400' : 'bg-accent-purple text-white border-accent-purple'}`}><div className={`p-3 rounded-full ${isListening ? 'bg-white text-red-500' : 'bg-white/20'}`}><Mic size={24} /></div><div className="text-left"><p className="text-xs font-bold uppercase tracking-widest">{isListening ? 'Слушаю вас...' : 'Создать маршрут'}</p><p className="text-[10px] opacity-60">Голосовой помощник</p></div></button></div>

      <AnimatePresence>{showVipModal && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[110] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"><motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} className="bg-white w-full max-w-sm rounded-[40px] overflow-hidden shadow-2xl p-8 text-center space-y-6"><div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto"><Star className="text-purple-600" size={40} fill="currentColor" /></div><div><h3 className="text-2xl font-serif">VIP Подписка</h3><p className="text-sm text-black/50 leading-relaxed">Умные маршруты с AI-гидом доступны только владельцам VIP-статуса.</p></div><div className="space-y-3"><div className="flex items-center gap-3 text-left p-3 bg-black/5 rounded-2xl"><CheckCircle2 className="text-emerald-500" size={20} /><span className="text-xs font-bold">Безлимитные AI маршруты</span></div><div className="flex items-center gap-3 text-left p-3 bg-black/5 rounded-2xl"><CheckCircle2 className="text-emerald-500" size={20} /><span className="text-xs font-bold">Персональные рекомендации</span></div></div><button onClick={() => setShowVipModal(false)} className="w-full py-4 bg-accent-purple text-white rounded-xl font-bold uppercase tracking-widest text-[10px]">Активировать за ₽990/мес</button><button onClick={() => setShowVipModal(false)} className="text-[10px] font-bold uppercase tracking-widest opacity-40">Позже</button></motion.div></motion.div>}</AnimatePresence>
    </div>
  );
};
