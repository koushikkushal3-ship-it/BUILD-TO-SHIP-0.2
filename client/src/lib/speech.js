// Thin wrappers around the browser-native Web Speech API. Voice mode is
// additive: every function here is feature-detected and callers must fall
// back to the typed flow if it returns false/null.

const SpeechRecognitionImpl = window.SpeechRecognition || window.webkitSpeechRecognition;

export function isSpeechRecognitionSupported() {
  return Boolean(SpeechRecognitionImpl);
}

export function isSpeechSynthesisSupported() {
  return 'speechSynthesis' in window;
}

// Slightly different pitch/rate per persona so the panel feels distinct even
// before its feedback card appears on screen.
const PERSONA_VOICE_PROFILE = {
  hr: { rate: 1, pitch: 1.15 },
  technical: { rate: 0.95, pitch: 0.9 },
  skeptical: { rate: 0.9, pitch: 0.75 },
  narrator: { rate: 1, pitch: 1 },
};

export function speak(text, persona = 'narrator') {
  return new Promise((resolve) => {
    if (!isSpeechSynthesisSupported()) return resolve();
    const utterance = new SpeechSynthesisUtterance(text);
    const profile = PERSONA_VOICE_PROFILE[persona] || PERSONA_VOICE_PROFILE.narrator;
    utterance.rate = profile.rate;
    utterance.pitch = profile.pitch;
    utterance.onend = () => resolve();
    utterance.onerror = () => resolve();
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  });
}

export function stopSpeaking() {
  if (isSpeechSynthesisSupported()) window.speechSynthesis.cancel();
}

// Returns a controller { start, stop } — onResult is called with the final
// transcript once the user stops talking, onInterim with live partial text.
export function createRecognizer({ onResult, onInterim, onEnd, onError }) {
  if (!isSpeechRecognitionSupported()) return null;

  const recognition = new SpeechRecognitionImpl();
  recognition.continuous = false;
  recognition.interimResults = true;
  recognition.lang = 'en-US';

  recognition.onresult = (event) => {
    let finalText = '';
    let interimText = '';
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const transcript = event.results[i][0].transcript;
      if (event.results[i].isFinal) finalText += transcript;
      else interimText += transcript;
    }
    if (interimText) onInterim?.(interimText);
    if (finalText) onResult?.(finalText);
  };

  recognition.onerror = (event) => onError?.(event.error);
  recognition.onend = () => onEnd?.();

  return {
    start: () => recognition.start(),
    stop: () => recognition.stop(),
  };
}
