// @ts-nocheck
import { useState, useCallback, useRef } from 'react';
import * as Speech from 'expo-speech';

interface UseASISVoiceReturn {
  isListening: boolean;
  isSpeaking: boolean;
  startListening: () => void;
  stopListening: () => void;
  speak: (text: string) => void;
  stopSpeaking: () => void;
}

export function useASISVoice(onTranscript: (text: string) => void): UseASISVoiceReturn {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const startListening = useCallback(() => {
    setIsListening(true);
    setTimeout(() => {
      const mockTranscript = "Open my wallet and show my balance";
      setIsListening(false);
      onTranscript(mockTranscript);
    }, 1500);
  }, [onTranscript]);

  const stopListening = useCallback(() => {
    setIsListening(false);
  }, []);

  const speak = useCallback((text: string) => {
    if (isSpeaking) return;
    setIsSpeaking(true);
    Speech.speak(text, {
      language: 'en-US',
      pitch: 1.0,
      rate: 1.0,
      onDone: () => setIsSpeaking(false),
      onStopped: () => setIsSpeaking(false),
    });
  }, [isSpeaking]);

  const stopSpeaking = useCallback(() => {
    Speech.stop();
    setIsSpeaking(false);
  }, []);

  return { isListening, isSpeaking, startListening, stopListening, speak, stopSpeaking };
}
