import { useEffect, useRef } from 'react';

const COLORS = ['#e8a628', '#f2b84b', '#6ee7b7', '#7dd3fc', '#fca5a5'];

// A short celebratory burst for a strong score — hand-rolled on canvas
// rather than pulling in a confetti library for one moment in the app.
export default function Confetti({ duration = 2200 }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const particles = Array.from({ length: 120 }, () => ({
      x: Math.random() * canvas.width,
      y: -20 - Math.random() * canvas.height * 0.3,
      size: 4 + Math.random() * 5,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      vx: (Math.random() - 0.5) * 3,
      vy: 2 + Math.random() * 3,
      rotation: Math.random() * 360,
      spin: (Math.random() - 0.5) * 10,
    }));

    let frame;
    const start = performance.now();

    function draw(now) {
      const elapsed = now - start;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.03;
        p.rotation += p.spin;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = Math.max(0, 1 - elapsed / duration);
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
        ctx.restore();
      }

      if (elapsed < duration) frame = requestAnimationFrame(draw);
    }
    frame = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('resize', resize);
    };
  }, [duration]);

  return <canvas ref={canvasRef} className="pointer-events-none fixed inset-0 z-50" />;
}
