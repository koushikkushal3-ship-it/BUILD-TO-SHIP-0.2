import { useEffect, useRef, useState } from 'react';
import { Mic, MicOff } from 'lucide-react';
import { createRecognizer, isSpeechRecognitionSupported } from '../lib/speech.js';
import WaveformVisualizer from './WaveformVisualizer.jsx';

// Additive voice input: appends recognized speech onto whatever text the
// parent already has. If the browser doesn't support SpeechRecognition,
// renders nothing — the typed textarea remains the only input, no broken UI.
export default function VoiceCapture({ onTranscript }) {
  const [listening, setListening] = useState(false);
  const [interim, setInterim] = useState('');
  const recognizerRef = useRef(null);

  useEffect(() => {
    if (!isSpeechRecognitionSupported()) return;
    recognizerRef.current = createRecognizer({
      onInterim: setInterim,
      onResult: (text) => {
        setInterim('');
        onTranscript(text);
      },
      onEnd: () => setListening(false),
      onError: () => setListening(false),
    });
  }, [onTranscript]);

  if (!isSpeechRecognitionSupported()) return null;

  function toggle() {
    if (listening) {
      recognizerRef.current.stop();
      setListening(false);
    } else {
      recognizerRef.current.start();
      setListening(true);
    }
  }

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={toggle}
        className={`flex h-10 w-10 items-center justify-center rounded-full transition active:scale-90 ${
          listening
            ? 'animate-pulse bg-amber-500 text-neutral-900'
            : 'bg-charcoal-800 text-slate-300 hover:bg-charcoal-700'
        }`}
        title={listening ? 'Stop recording' : 'Answer by voice'}
      >
        {listening ? <Mic size={18} /> : <MicOff size={18} />}
      </button>
      <WaveformVisualizer active={listening} />
      {interim && <span className="text-sm italic text-slate-500">{interim}</span>}
    </div>
  );
}
