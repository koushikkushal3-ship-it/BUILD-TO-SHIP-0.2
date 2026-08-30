import { useEffect, useRef } from 'react';

// Live microphone waveform, purely a visual affordance while SpeechRecognition
// is listening — it does NOT feed audio into recognition itself (the browser's
// SpeechRecognition API captures its own stream internally); this opens a
// second, independent getUserMedia stream just to drive the bars.
export default function WaveformVisualizer({ active }) {
  const canvasRef = useRef(null);
  const rafRef = useRef(null);
  const streamRef = useRef(null);
  const audioCtxRef = useRef(null);

  useEffect(() => {
    if (!active) return;
    let cancelled = false;

    async function start() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;

        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        audioCtxRef.current = audioCtx;
        const source = audioCtx.createMediaStreamSource(stream);
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 64;
        source.connect(analyser);

        const data = new Uint8Array(analyser.frequencyBinCount);
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        // Read the live theme variable rather than hardcoding a hex — canvas
        // fillStyle can't respond to CSS like a Tailwind class would.
        const amberRgb = getComputedStyle(document.documentElement).getPropertyValue('--amber-500').trim();
        const barColor = `rgb(${amberRgb.split(' ').join(' ')})`;

        function draw() {
          if (!ctx) return;
          analyser.getByteFrequencyData(data);
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          const barWidth = canvas.width / data.length;
          for (let i = 0; i < data.length; i++) {
            const barHeight = (data[i] / 255) * canvas.height;
            ctx.fillStyle = barColor;
            ctx.fillRect(i * barWidth, canvas.height - barHeight, barWidth - 2, barHeight);
          }
          rafRef.current = requestAnimationFrame(draw);
        }
        draw();
      } catch {
        // Mic permission denied or unavailable — waveform simply won't render;
        // SpeechRecognition may still work independently.
      }
    }

    start();

    return () => {
      cancelled = true;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
      audioCtxRef.current?.close();
    };
  }, [active]);

  if (!active) return null;

  return <canvas ref={canvasRef} width={200} height={40} className="rounded bg-charcoal-800" />;
}
