import React, { useState, useEffect, useRef } from 'react';
import { Mic, X, MessageSquare, Sparkles, Loader2, Volume2, VolumeX } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { externalAI, AIResponse } from '../services/externalAI';

interface AssistantMessage {
  id: string;
  role: 'assistant' | 'user';
  text: string;
}

interface ExternalVoiceAssistantProps {
  onAction: (action: any) => void;
  currentContext: any;
  containerClassName?: string;
  panelClassName?: string;
  triggerClassName?: string;
  compact?: boolean;
  showCompactLabel?: boolean;
  embedded?: boolean;
  title?: string;
}

export const ExternalVoiceAssistant: React.FC<ExternalVoiceAssistantProps> = ({
  onAction,
  currentContext,
  containerClassName = 'fixed bottom-8 left-8 z-[100]',
  panelClassName = 'absolute bottom-20 left-0 w-80 bg-white rounded-[32px] shadow-2xl border border-accent-purple/10 overflow-hidden',
  triggerClassName,
  compact = false,
  showCompactLabel = true,
  embedded = false,
  title = 'Алиса (Яндекс)',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [lastResponse, setLastResponse] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeechSupported, setIsSpeechSupported] = useState(true);
  const [recordingMode, setRecordingMode] = useState<'ogg' | 'lpcm' | 'unsupported'>('unsupported');
  const [speechStatus, setSpeechStatus] = useState<'idle' | 'synthesizing' | 'playing' | 'muted' | 'error'>('idle');
  const [messages, setMessages] = useState<AssistantMessage[]>([
    {
      id: 'assistant-welcome',
      role: 'assistant',
      text: 'Скажите, что вы хотите найти: отель, апартаменты, маршрут или спокойный отдых у моря.',
    },
  ]);
  
  const transcriptRef = useRef('');
  const shouldProcessRef = useRef(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioUrlRef = useRef<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const recordingTimeoutRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const processorNodeRef = useRef<ScriptProcessorNode | null>(null);
  const pcmChunksRef = useRef<Float32Array[]>([]);
  const pcmSampleRateRef = useRef<number>(48000);
  const messagesContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const supportsOggRecording =
      typeof window !== 'undefined' &&
      typeof navigator !== 'undefined' &&
      !!navigator.mediaDevices?.getUserMedia &&
      typeof MediaRecorder !== 'undefined' &&
      MediaRecorder.isTypeSupported('audio/ogg;codecs=opus');
    const supportsLpcmRecording =
      typeof window !== 'undefined' &&
      typeof navigator !== 'undefined' &&
      !!navigator.mediaDevices?.getUserMedia &&
      typeof AudioContext !== 'undefined';

    const nextMode = supportsOggRecording ? 'ogg' : supportsLpcmRecording ? 'lpcm' : 'unsupported';
    setRecordingMode(nextMode);
    setIsSpeechSupported(nextMode !== 'unsupported');

    return () => {
      if (recordingTimeoutRef.current) {
        window.clearTimeout(recordingTimeoutRef.current);
      }
      if (mediaRecorderRef.current?.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
      mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
      processorNodeRef.current?.disconnect();
      sourceNodeRef.current?.disconnect();
      void audioContextRef.current?.close();
      audioRef.current?.pause();
      if (audioUrlRef.current) {
        URL.revokeObjectURL(audioUrlRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!messagesContainerRef.current) return;
    messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
  }, [messages, isProcessing, transcript, lastResponse]);

  const stopAudioPlayback = () => {
    audioRef.current?.pause();
    audioRef.current = null;
    if (audioUrlRef.current) {
      URL.revokeObjectURL(audioUrlRef.current);
      audioUrlRef.current = null;
    }
    setSpeechStatus(isMuted ? 'muted' : 'idle');
  };

  const stopRecordingStream = () => {
    mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
    mediaStreamRef.current = null;
  };

  const cleanupPcmRecorder = async () => {
    processorNodeRef.current?.disconnect();
    processorNodeRef.current = null;
    sourceNodeRef.current?.disconnect();
    sourceNodeRef.current = null;
    if (audioContextRef.current) {
      await audioContextRef.current.close();
      audioContextRef.current = null;
    }
  };

  const convertPcmChunksToBlob = () => {
    const totalLength = pcmChunksRef.current.reduce((acc, chunk) => acc + chunk.length, 0);
    const pcm16 = new Int16Array(totalLength);
    let offset = 0;

    for (const chunk of pcmChunksRef.current) {
      for (let i = 0; i < chunk.length; i += 1) {
        const sample = Math.max(-1, Math.min(1, chunk[i]));
        pcm16[offset] = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
        offset += 1;
      }
    }

    return new Blob([pcm16.buffer], { type: 'application/octet-stream' });
  };

  const startListening = async () => {
    if (!isSpeechSupported) {
      setLastResponse('Для голосового ввода нужен браузер с поддержкой записи OGG/Opus или Web Audio API.');
      return;
    }

    try {
      stopAudioPlayback();
      transcriptRef.current = '';
      setTranscript('');
      setLastResponse(null);
      shouldProcessRef.current = true;

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      mediaStreamRef.current = stream;
      if (recordingMode === 'ogg') {
        const chunks: Blob[] = [];
        const mimeType = 'audio/ogg;codecs=opus';
        const recorder = new MediaRecorder(stream, {
          mimeType,
          audioBitsPerSecond: 32000,
        });

        recorder.onstart = () => {
          setIsListening(true);
        };

        recorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            chunks.push(event.data);
          }
        };

        recorder.onerror = (event: any) => {
          console.error('SpeechKit recorder error', event);
          shouldProcessRef.current = false;
          setIsListening(false);
          setIsProcessing(false);
          stopRecordingStream();
          setLastResponse('Не удалось записать голосовой запрос. Проверьте доступ к микрофону.');
        };

        recorder.onstop = async () => {
          setIsListening(false);
          if (recordingTimeoutRef.current) {
            window.clearTimeout(recordingTimeoutRef.current);
            recordingTimeoutRef.current = null;
          }

          const audioBlob = new Blob(chunks, { type: mimeType });
          stopRecordingStream();

          if (!shouldProcessRef.current) {
            return;
          }

          setIsProcessing(true);
          try {
            const text = await externalAI.transcribeAudio(audioBlob, { format: 'oggopus' });
            transcriptRef.current = text;
            setTranscript(text);

            if (!text) {
              setLastResponse('Не удалось распознать речь. Скажите фразу короче и повторите.');
              return;
            }

            await handleProcessInput(text);
          } catch (error) {
            console.error('SpeechKit STT error', error);
            const message = error instanceof Error ? error.message : 'Неизвестная ошибка SpeechKit STT';
            setLastResponse(`Не удалось распознать голосовой запрос через SpeechKit: ${message}`);
          } finally {
            shouldProcessRef.current = false;
            setIsProcessing(false);
          }
        };

        mediaRecorderRef.current = recorder;
        recorder.start();
        recordingTimeoutRef.current = window.setTimeout(() => {
          if (mediaRecorderRef.current?.state === 'recording') {
            mediaRecorderRef.current.stop();
          }
        }, 10000);
        return;
      }

      if (recordingMode === 'lpcm') {
        pcmChunksRef.current = [];
        const audioContext = new AudioContext();
        audioContextRef.current = audioContext;
        pcmSampleRateRef.current = audioContext.sampleRate;
        const sourceNode = audioContext.createMediaStreamSource(stream);
        sourceNodeRef.current = sourceNode;
        const processorNode = audioContext.createScriptProcessor(4096, 1, 1);
        processorNodeRef.current = processorNode;

        processorNode.onaudioprocess = (event) => {
          const input = event.inputBuffer.getChannelData(0);
          pcmChunksRef.current.push(new Float32Array(input));
        };

        sourceNode.connect(processorNode);
        processorNode.connect(audioContext.destination);
        setIsListening(true);
        recordingTimeoutRef.current = window.setTimeout(async () => {
          setIsListening(false);
          if (recordingTimeoutRef.current) {
            window.clearTimeout(recordingTimeoutRef.current);
            recordingTimeoutRef.current = null;
          }
          stopRecordingStream();
          await cleanupPcmRecorder();

          if (!shouldProcessRef.current) {
            return;
          }

          setIsProcessing(true);
          try {
            const audioBlob = convertPcmChunksToBlob();
            const text = await externalAI.transcribeAudio(audioBlob, {
              format: 'lpcm',
              sampleRateHertz: pcmSampleRateRef.current,
            });
            transcriptRef.current = text;
            setTranscript(text);

            if (!text) {
              setLastResponse('Не удалось распознать речь. Скажите фразу короче и повторите.');
              return;
            }

            await handleProcessInput(text);
          } catch (error) {
            console.error('SpeechKit LPCM STT error', error);
            const message = error instanceof Error ? error.message : 'Неизвестная ошибка SpeechKit STT';
            setLastResponse(`Не удалось распознать голосовой запрос через SpeechKit: ${message}`);
          } finally {
            shouldProcessRef.current = false;
            setIsProcessing(false);
          }
        }, 9000);
      }
    } catch (error) {
      console.error('Microphone access error', error);
      shouldProcessRef.current = false;
      setLastResponse('Браузер заблокировал доступ к микрофону. Разрешите доступ и повторите.');
    }
  };

  const toggleListening = () => {
    if (!isSpeechSupported) {
      setLastResponse('Голосовой ввод SpeechKit недоступен в этом браузере.');
      return;
    }

    if (isListening) {
      if (recordingMode === 'ogg') {
        mediaRecorderRef.current?.stop();
      } else if (recordingMode === 'lpcm') {
        setIsListening(false);
        if (recordingTimeoutRef.current) {
          window.clearTimeout(recordingTimeoutRef.current);
          recordingTimeoutRef.current = null;
        }
        stopRecordingStream();
        void cleanupPcmRecorder().then(async () => {
          if (!shouldProcessRef.current) return;
          setIsProcessing(true);
          try {
            const audioBlob = convertPcmChunksToBlob();
            const text = await externalAI.transcribeAudio(audioBlob, {
              format: 'lpcm',
              sampleRateHertz: pcmSampleRateRef.current,
            });
            transcriptRef.current = text;
            setTranscript(text);
            if (!text) {
              setLastResponse('Не удалось распознать речь. Скажите фразу короче и повторите.');
              return;
            }
            await handleProcessInput(text);
          } catch (error) {
            console.error('SpeechKit LPCM STT error', error);
            const message = error instanceof Error ? error.message : 'Неизвестная ошибка SpeechKit STT';
            setLastResponse(`Не удалось распознать голосовой запрос через SpeechKit: ${message}`);
          } finally {
            shouldProcessRef.current = false;
            setIsProcessing(false);
          }
        });
      }
    } else {
      void startListening();
    }
  };

  const handleProcessInput = async (text: string) => {
    try {
      if (isMuted) {
        setSpeechStatus('muted');
      } else {
        setSpeechStatus('idle');
      }
      const conversation = messages.slice(-12).map((item) => ({
        role: item.role,
        text: item.text,
      }));
      setMessages((prev) => [
        ...prev,
        { id: `user-${Date.now()}`, role: 'user', text },
      ]);
      const response: AIResponse = await externalAI.processVoiceInput(text, {
        ...currentContext,
        conversation,
      });
      const assistantText = response.text?.trim() || 'Я подобрала варианты и вывела результаты ниже.';
      setLastResponse(assistantText);
      setMessages((prev) => [
        ...prev,
        { id: `assistant-${Date.now()}`, role: 'assistant', text: assistantText },
      ]);
      
      if (!isMuted && assistantText) {
        await speak(assistantText);
      }

      if (response.actions) {
        response.actions.forEach(action => onAction(action));
      }
    } catch (error) {
      setLastResponse("Произошла ошибка при обработке вашего запроса.");
    }
  };

  const speak = async (text: string) => {
    try {
      setSpeechStatus('synthesizing');
      stopAudioPlayback();
      const audioUrl = await externalAI.synthesizeSpeech(text);
      if (!audioUrl) {
        setSpeechStatus('error');
        return;
      }
      audioUrlRef.current = audioUrl;
      const audio = new Audio(audioUrl);
      audioRef.current = audio;
      audio.onplay = () => {
        setSpeechStatus('playing');
      };
      audio.onended = () => {
        stopAudioPlayback();
      };
      audio.onerror = () => {
        setSpeechStatus('error');
      };
      await audio.play();
    } catch (error) {
      console.error('SpeechKit TTS error', error);
      setLastResponse('Ответ получен, но озвучить его через SpeechKit не удалось.');
      setSpeechStatus('error');
    }
  };

  const speechStatusLabel = (() => {
    if (isMuted) return 'Звук выключен';
    if (speechStatus === 'synthesizing') return 'Озвучка: синтезирую ответ...';
    if (speechStatus === 'playing') return 'Озвучка: воспроизвожу ответ';
    if (speechStatus === 'error') return 'Озвучка: ошибка воспроизведения';
    return 'Озвучка: готова';
  })();

  return (
    <div className={containerClassName}>
      <AnimatePresence>
        {(embedded || isOpen) && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={embedded ? undefined : { opacity: 0, scale: 0.9, y: 20 }}
            className={panelClassName}
          >
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-accent-purple rounded-full animate-pulse" />
                  <span className="text-[10px] font-bold uppercase tracking-widest opacity-40">{title}</span>
                </div>
                {!embedded && (
                  <button onClick={() => setIsOpen(false)} className="opacity-20 hover:opacity-100 transition-opacity">
                    <X size={16} />
                  </button>
                )}
              </div>

              <div ref={messagesContainerRef} className="min-h-[220px] max-h-[420px] overflow-y-auto custom-scrollbar pr-1">
                {isProcessing ? (
                  <div className="flex flex-col items-center gap-3 py-4">
                    <Loader2 className="animate-spin text-accent-purple" size={32} />
                    <p className="text-xs font-medium opacity-40">Анализирую ваши мысли...</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {messages.map((message) => (
                      <motion.div
                        key={message.id}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[85%] rounded-[24px] px-4 py-3 text-sm leading-relaxed shadow-sm ${
                            message.role === 'user'
                              ? 'bg-accent-purple text-white'
                              : 'bg-white border border-accent-purple/10 text-gray-800'
                          }`}
                        >
                          {message.text}
                        </div>
                      </motion.div>
                    ))}
                    {!isSpeechSupported && (
                      <div className="text-center space-y-2 pt-2">
                        <p className="text-sm opacity-60">Для голосового режима нужен браузер с доступом к микрофону и Web Audio API.</p>
                      </div>
                    )}
                    {lastResponse && (
                      <div className="text-center pt-1">
                        <p className="text-[11px] opacity-55">{lastResponse}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between gap-3">
                <div className="text-[10px] uppercase tracking-widest opacity-30 font-bold">
                  Например: "Хочу тихий отель в горах с видом на море"
                </div>
                <button 
                  onClick={() => {
                    if (!isMuted) {
                      stopAudioPlayback();
                    }
                    const nextMuted = !isMuted;
                    setIsMuted(nextMuted);
                    setSpeechStatus(nextMuted ? 'muted' : 'idle');
                  }}
                  className="p-2 hover:bg-accent-purple/5 rounded-full transition-colors opacity-40 hover:opacity-100 shrink-0"
                >
                  {isMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
                </button>
              </div>

              <div className="text-[10px] font-bold uppercase tracking-widest opacity-50">
                {speechStatusLabel}
              </div>

              {transcript && isListening && (
                <div className="p-3 bg-peach-bg rounded-2xl border border-accent-purple/5">
                  <p className="text-xs text-accent-purple opacity-60 italic">"{transcript}{isListening ? '...' : ''}"</p>
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

      {!embedded && (
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsOpen(!isOpen)}
          className={triggerClassName ?? `${compact ? 'h-11 px-4 rounded-xl gap-2 text-[11px] font-bold uppercase tracking-widest' : 'w-14 h-14 rounded-full'} flex items-center justify-center shadow-2xl transition-all ${
            isOpen ? 'bg-white text-accent-purple border border-accent-purple/20' : 'bg-accent-purple text-white shadow-accent-purple/30'
          }`}
        >
          {isOpen ? <MessageSquare size={compact ? 22 : 20} /> : <Sparkles size={compact ? 22 : 20} />}
          {compact && showCompactLabel && <span>ИИ Алиса</span>}
        </motion.button>
      )}
    </div>
  );
};
