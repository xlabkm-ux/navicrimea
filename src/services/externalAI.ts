export interface AIResponse {
  text: string;
  actions?: {
    type: 'update_preferences' | 'add_route_point' | 'show_region';
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
}

export const externalAI = new ExternalAIService();
