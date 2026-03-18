import { useEffect, useState } from 'react';
import { Info, RefreshCw } from 'lucide-react';
import { motion } from 'motion/react';

export function SettingsPanel() {
  const [settings, setSettings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/v1/settings')
      .then((res) => res.json())
      .then((data) => {
        setSettings(data);
        setLoading(false);
      });
  }, []);

  const handleSave = async (key: string, value: string) => {
    setSaving(key);
    try {
      await fetch('/api/v1/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, value }),
      });

      setSettings((prev) => {
        const existing = prev.find((setting) => setting.key === key);
        if (existing) {
          return prev.map((setting) => (setting.key === key ? { ...setting, value } : setting));
        }

        return [...prev, { key, value }];
      });
    } finally {
      setSaving(null);
    }
  };

  const getVal = (key: string) => settings.find((setting) => setting.key === key)?.value || '';

  if (loading) {
    return (
      <div className="p-10 text-center opacity-20">
        <RefreshCw className="animate-spin mx-auto" />
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8 p-6">
      <div className="space-y-2">
        <h3 className="text-xl font-serif">Настройки API и Сервисов</h3>
        <p className="text-[10px] uppercase tracking-widest opacity-40">
          Укажите ключи для работы ИИ и Карт. Данные сохраняются в локальную БД.
        </p>
      </div>

      <div className="grid gap-6">
        {[
          { key: 'YANDEX_API_KEY', label: 'Yandex Cloud API Key (SpeechKit / GPT)', type: 'password' },
          { key: 'YANDEX_GPT_KEY', label: 'Yandex GPT API Key', type: 'password' },
          { key: 'YANDEX_FOLDER_ID', label: 'Yandex Cloud Folder ID', type: 'text' },
          { key: 'YANDEX_GPT_MODEL', label: 'Yandex GPT Model', type: 'text' },
          { key: 'YANDEX_TTS_VOICE', label: 'Yandex TTS Voice', type: 'text' },
          { key: 'YANDEX_SEARCH_API_KEY', label: 'Yandex Search API Key (Photos)', type: 'password' },
          { key: 'YANDEX_MAPS_SEARCH_API_KEY', label: 'Yandex Maps Search API Key (Tourism Objects)', type: 'password' },
          { key: 'VITE_YANDEX_MAPS_API_KEY', label: 'Yandex Maps API Key', type: 'password' },
          { key: 'AI_MODE', label: 'AI Mode (local / yandex)', type: 'text' },
        ].map((field) => (
          <div key={field.key} className="space-y-2 p-6 bg-black/5 rounded-[32px] border border-black/5">
            <label className="text-[10px] font-bold uppercase tracking-widest opacity-40 ml-1">{field.label}</label>
            <div className="flex gap-4">
              <input
                type={field.type}
                defaultValue={getVal(field.key)}
                onBlur={(e) => handleSave(field.key, e.target.value)}
                placeholder="Введите значение..."
                className="flex-1 p-4 bg-white rounded-2xl text-sm border border-black/5 focus:ring-2 focus:ring-purple-500 outline-none transition-all"
              />
              <div className="w-12 flex items-center justify-center">
                {saving === field.key ? (
                  <RefreshCw size={16} className="animate-spin text-purple-600" />
                ) : (
                  <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/20" />
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="p-6 bg-purple-50 rounded-[32px] border border-purple-100">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-purple-600 rounded-2xl flex items-center justify-center text-white">
            <Info size={20} />
          </div>
          <div>
            <div className="text-xs font-bold mb-1">Безопасность</div>
            <p className="text-[10px] opacity-60 leading-relaxed">
              Ключи сохраняются в зашифрованном виде (если настроено) в `platform.db`. Переменные в `.env` имеют
              приоритет над базой данных.
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
