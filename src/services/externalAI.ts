export interface AIResponse {
  text: string;
  actions?: {
    type: 'update_preferences' | 'add_route_point' | 'show_region' | 'search_objects' | 'set_view_mode' | 'focus_object';
    payload: any;
  }[];
}

class ExternalAIService {
  async processVoiceInput(transcript: string, currentContext: any): Promise<AIResponse> {
    try {
      const response = await fetch('/api/v1/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: transcript,
          context: currentContext
        })
      });

      if (!response.ok) throw new Error("AI proxy request failed");
      return await response.json();
    } catch (error) {
      console.error("Error calling AI proxy:", error);
      return { text: "Извините, локальный помощник сейчас недоступен. Проверьте подключение к серверу." };
    }
  }

  async transcribeAudio(
    audioBlob: Blob,
    options: { lang?: string; format?: 'oggopus' | 'lpcm'; sampleRateHertz?: number } = {},
  ): Promise<string> {
    const lang = options.lang || 'ru-RU';
    const format = options.format || 'oggopus';
    const sampleRateParam = options.sampleRateHertz ? `&sampleRateHertz=${encodeURIComponent(String(options.sampleRateHertz))}` : '';
    const response = await fetch(`/api/v1/ai/transcribe?lang=${encodeURIComponent(lang)}&format=${encodeURIComponent(format)}${sampleRateParam}`, {
      method: 'POST',
      headers: {
        'Content-Type': audioBlob.type || (format === 'lpcm' ? 'application/octet-stream' : 'audio/ogg'),
      },
      body: audioBlob,
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data?.text || 'SpeechKit STT request failed');
    }

    return String(data?.text || '').trim();
  }

  async synthesizeSpeech(text: string): Promise<string> {
    const response = await fetch('/api/v1/ai/speak', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text }),
    });

    if (response.status === 204) {
      return '';
    }

    if (!response.ok) {
      let message = 'SpeechKit TTS request failed';
      try {
        const data = await response.json();
        message = data?.text || message;
      } catch {
        // Ignore JSON parsing errors and keep the default message.
      }
      throw new Error(message);
    }

    const audioBlob = await response.blob();
    return URL.createObjectURL(audioBlob);
  }
}

export const externalAI = new ExternalAIService();
