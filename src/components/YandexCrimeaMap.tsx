import { useEffect, useRef, useState } from 'react';

declare global {
  interface Window {
    ymaps?: {
      Map: new (element: HTMLElement, state: unknown, options?: unknown) => {
        destroy: () => void;
      };
      ready: (callback: () => void) => void;
    };
  }
}

const SCRIPT_ID = 'yandex-maps-api';
const SIMFEROPOL_CENTER = [44.9521, 34.1024];

function loadYandexMaps(apiKey: string) {
  return new Promise<void>((resolve, reject) => {
    if (window.ymaps) {
      window.ymaps.ready(() => resolve());
      return;
    }

    const existingScript = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;
    if (existingScript) {
      existingScript.addEventListener('load', () => window.ymaps?.ready(() => resolve()), { once: true });
      existingScript.addEventListener('error', () => reject(new Error('Failed to load Yandex Maps script.')), { once: true });
      return;
    }

    const script = document.createElement('script');
    script.id = SCRIPT_ID;
    script.src = `https://api-maps.yandex.ru/2.1/?apikey=${encodeURIComponent(apiKey)}&lang=ru_RU`;
    script.async = true;
    script.onload = () => window.ymaps?.ready(() => resolve());
    script.onerror = () => reject(new Error('Failed to load Yandex Maps script.'));
    document.head.appendChild(script);
  });
}

export function YandexCrimeaMap() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<{ destroy: () => void } | null>(null);
  const [status, setStatus] = useState<'idle' | 'ready' | 'missing-key' | 'error'>('idle');
  const apiKey = import.meta.env.VITE_YANDEX_MAPS_API_KEY;

  useEffect(() => {
    if (!apiKey) {
      setStatus('missing-key');
      return;
    }

    let disposed = false;

    loadYandexMaps(apiKey)
      .then(() => {
        if (disposed || !containerRef.current || !window.ymaps) {
          return;
        }

        mapRef.current?.destroy();
        mapRef.current = new window.ymaps.Map(
          containerRef.current,
          {
            center: SIMFEROPOL_CENTER,
            zoom: 8,
            controls: [],
          },
          {
            suppressMapOpenBlock: true,
          },
        );

        setStatus('ready');
      })
      .catch((error) => {
        console.error(error);
        if (!disposed) {
          setStatus('error');
        }
      });

    return () => {
      disposed = true;
      mapRef.current?.destroy();
      mapRef.current = null;
    };
  }, [apiKey]);

  return (
    <div className="relative h-full w-full overflow-hidden bg-[#d9dce8]">
      <div ref={containerRef} className="h-full w-full" />
      {status !== 'ready' && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#e6dcf2] p-8 text-center">
          <div className="max-w-md rounded-[32px] border border-black/5 bg-white/85 p-8 shadow-xl backdrop-blur">
            <div className="mb-3 text-[10px] font-bold uppercase tracking-[0.25em] text-black/40">Yandex JavaScript API</div>
            {status === 'missing-key' ? (
              <>
                <h3 className="mb-3 font-serif text-3xl">Нужен API key</h3>
                <p className="text-sm leading-6 opacity-60">
                  Добавьте `VITE_YANDEX_MAPS_API_KEY` в `.env.local`, затем перезапустите `npm run dev`.
                </p>
              </>
            ) : (
              <>
                <h3 className="mb-3 font-serif text-3xl">Карта не загрузилась</h3>
                <p className="text-sm leading-6 opacity-60">
                  Проверьте ключ JavaScript API, сеть и ограничения доступа в кабинете Yandex.
                </p>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
