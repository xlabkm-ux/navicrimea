import React, { useState, useEffect, useRef } from 'react';
import { Mic, X, MessageSquare, Sparkles, Loader2, Volume2, VolumeX } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { externalAI, AIResponse } from '../services/externalAI';

interface ExternalVoiceAssistantProps {
  onAction: (action: any) => void;
  currentContext: any;
}

export const ExternalVoiceAssistant: React.FC<ExternalVoiceAssistantProps> = ({ onAction, currentContext }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [lastResponse, setLastResponse] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeechSupported, setIsSpeechSupported] = useState(true);
  
  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const voiceRef = useRef<SpeechSynthesisVoice | null>(null);
  const transcriptRef = useRef('');
  const shouldProcessRef = useRef(false);

  const selectPreferredVoice = () => {
    if (!window.speechSynthesis) return null;

    const voices = window.speechSynthesis.getVoices();
    if (!voices.length) return null;

    const preferredNames = [
      'Milena',
      'Alena',
      'Katya',
      'Yana',
      'Alice',
      'Мария',
      'Алиса',
      'Milena Premium',
      'Google русский',
      'Microsoft Irina',
      'Microsoft Svetlana',
      'Microsoft Ekaterina',
    ];

    const russianVoices = voices.filter((voice) => voice.lang.toLowerCase().startsWith('ru'));
    const femaleCandidate =
      russianVoices.find((voice) =>
        preferredNames.some((name) => voice.name.toLowerCase().includes(name.toLowerCase())),
      ) ??
      russianVoices.find((voice) =>
        /(female|woman|zina|irina|svetlana|maria|milena|alena|katya|yana|anna|victoria)/i.test(voice.name),
      ) ??
      russianVoices[0] ??
      voices.find((voice) => voice.lang.toLowerCase().startsWith('en')) ??
      voices[0];

    return femaleCandidate ?? null;
  };

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setIsSpeechSupported(false);
    } else {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'ru-RU';

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        let nextTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i += 1) {
          nextTranscript += event.results[i][0].transcript;
        }

        transcriptRef.current = nextTranscript.trim();
        setTranscript(transcriptRef.current);
      };

      recognition.onend = () => {
        setIsListening(false);
        if (shouldProcessRef.current && transcriptRef.current) {
          void handleProcessInput(transcriptRef.current);
        }
        shouldProcessRef.current = false;
      };

      recognition.onerror = (event: any) => {
        console.error("Speech recognition error", event.error);
        shouldProcessRef.current = false;
        setIsListening(false);
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          setLastResponse('Браузер заблокировал доступ к микрофону. Разрешите доступ и повторите.');
        } else if (event.error === 'no-speech') {
          setLastResponse('Речь не распознана. Повторите запрос чуть громче или ближе к микрофону.');
        } else {
          setLastResponse('Не удалось распознать голосовой запрос. Попробуйте еще раз.');
        }
      };

      recognitionRef.current = recognition;
    }

    synthRef.current = window.speechSynthesis;
    voiceRef.current = selectPreferredVoice();
    if (window.speechSynthesis) {
      window.speechSynthesis.onvoiceschanged = () => {
        voiceRef.current = selectPreferredVoice();
      };
    }

    return () => {
      if (recognitionRef.current) recognitionRef.current.stop();
      if (synthRef.current) synthRef.current.cancel();
      if (window.speechSynthesis) {
        window.speechSynthesis.onvoiceschanged = null;
      }
    };
  }, []);

  const toggleListening = () => {
    if (!isSpeechSupported) {
      setLastResponse('Голосовой ввод не поддерживается в этом браузере.');
      return;
    }

    if (isListening) {
      shouldProcessRef.current = false;
      recognitionRef.current?.stop();
    } else {
      transcriptRef.current = '';
      setTranscript('');
      setLastResponse(null);
      shouldProcessRef.current = true;
      recognitionRef.current?.start();
    }
  };

  const handleProcessInput = async (text: string) => {
    setIsProcessing(true);
    try {
      const response: AIResponse = await externalAI.processVoiceInput(text, currentContext);
      setLastResponse(response.text);
      
      if (!isMuted && response.text) {
        speak(response.text);
      }

      if (response.actions) {
        response.actions.forEach(action => onAction(action));
      }
    } catch (error) {
      setLastResponse("Произошла ошибка при обработке вашего запроса.");
    } finally {
      setIsProcessing(false);
    }
  };

  const speak = (text: string) => {
    if (!synthRef.current) return;
    synthRef.current.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    const preferredVoice = voiceRef.current ?? selectPreferredVoice();
    if (preferredVoice) {
      utterance.voice = preferredVoice;
      utterance.lang = preferredVoice.lang;
    } else {
      utterance.lang = 'ru-RU';
    }
    utterance.pitch = 1.08;
    utterance.rate = 0.95;
    utterance.volume = 1;
    synthRef.current.speak(utterance);
  };

  return (
    <div className="fixed bottom-8 left-8 z-[100]">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="absolute bottom-20 left-0 w-80 bg-white rounded-[32px] shadow-2xl border border-accent-purple/10 overflow-hidden"
          >
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-accent-purple rounded-full animate-pulse" />
                  <span className="text-[10px] font-bold uppercase tracking-widest opacity-40">Алиса (Яндекс)</span>
                </div>
                <button onClick={() => setIsOpen(false)} className="opacity-20 hover:opacity-100 transition-opacity">
                  <X size={16} />
                </button>
              </div>

              <div className="min-h-[100px] flex flex-col justify-center">
                {isProcessing ? (
                  <div className="flex flex-col items-center gap-3 py-4">
                    <Loader2 className="animate-spin text-accent-purple" size={32} />
                    <p className="text-xs font-medium opacity-40">Анализирую ваши мысли...</p>
                  </div>
                ) : lastResponse ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="space-y-3"
                  >
                    <p className="text-sm leading-relaxed text-gray-800 font-medium italic">
                      "{lastResponse}"
                    </p>
                    <div className="flex justify-end">
                      <button 
                        onClick={() => setIsMuted(!isMuted)}
                        className="p-2 hover:bg-accent-purple/5 rounded-full transition-colors opacity-40 hover:opacity-100"
                      >
                        {isMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
                      </button>
                    </div>
                  </motion.div>
                ) : (
                  <div className="text-center space-y-2">
                    <p className="text-sm opacity-60">
                      {isSpeechSupported
                        ? 'Нажмите на микрофон и расскажите о ваших пожеланиях к отдыху.'
                        : 'Голосовой ввод недоступен в этом браузере.'}
                    </p>
                    <p className="text-[10px] uppercase tracking-widest opacity-30 font-bold">Например: "Хочу тихий отель в горах с видом на море"</p>
                  </div>
                )}
              </div>

              {transcript && isListening && (
                <div className="p-3 bg-peach-bg rounded-2xl border border-accent-purple/5">
                  <p className="text-xs text-accent-purple opacity-60 italic">"{transcript}..."</p>
                </div>
              )}
            </div>

            <div className="p-4 bg-peach-bg/50 border-t border-accent-purple/10 flex justify-center">
              <button
                onClick={toggleListening}
                disabled={!isSpeechSupported || isProcessing}
                className={`w-16 h-16 rounded-full flex items-center justify-center transition-all shadow-lg disabled:opacity-40 disabled:cursor-not-allowed ${
                  isListening 
                    ? 'bg-red-500 text-white animate-pulse scale-110 shadow-red-200' 
                    : 'bg-accent-purple text-white hover:scale-105 shadow-accent-purple/20'
                }`}
              >
                {isListening ? <X size={24} /> : <Mic size={24} />}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-all ${
          isOpen ? 'bg-white text-accent-purple border border-accent-purple/20' : 'bg-accent-purple text-white shadow-accent-purple/30'
        }`}
      >
        {isOpen ? <MessageSquare size={20} /> : <Sparkles size={20} />}
      </motion.button>
    </div>
  );
};
