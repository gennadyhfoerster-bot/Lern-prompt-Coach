import { useState, useCallback, useEffect } from 'react';

export function useVoice() {
  const [isMuted, setIsMuted] = useState(() => {
    const saved = localStorage.getItem('mia_voice_muted');
    return saved ? JSON.parse(saved) : false;
  });

  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);

  useEffect(() => {
    const updateVoices = () => {
      setVoices(window.speechSynthesis.getVoices());
    };
    window.speechSynthesis.onvoiceschanged = updateVoices;
    updateVoices();
  }, []);

  const speak = useCallback((text: string) => {
    if (isMuted || !text) return;

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    
    // Try to find a high-quality female German voice
    const preferredVoice = voices.find(v => 
      (v.name.includes('Google') || v.name.includes('Premium') || v.name.includes('Natural')) && 
      v.lang.startsWith('de')
    ) || voices.find(v => v.lang.startsWith('de'));

    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    utterance.pitch = 1.05; // Slightly higher for a friendly tone
    utterance.rate = 0.95;  // Slightly slower for clarity
    utterance.volume = 0.8;

    window.speechSynthesis.speak(utterance);
  }, [isMuted, voices]);

  const toggleMute = useCallback(() => {
    setIsMuted((prev: boolean) => {
      const next = !prev;
      localStorage.setItem('mia_voice_muted', JSON.stringify(next));
      if (next) window.speechSynthesis.cancel();
      return next;
    });
  }, []);

  return { speak, isMuted, toggleMute };
}
