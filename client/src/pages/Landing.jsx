import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Users, Swords, Youtube, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';

const FEATURES = [
  {
    icon: Users,
    title: '3 interviewers, not 1',
    body: 'Every answer is judged independently by a friendly HR persona, a rigorous technical lead, and a skeptical hiring manager — and they don’t always agree.',
  },
  {
    icon: Swords,
    title: 'It pushes back',
    body: 'A weak or disputed answer triggers a live cross-examination from the skeptical panelist, targeting your exact weakest point — like a real tough interviewer would.',
  },
  {
    icon: Youtube,
    title: 'Real resources, not AI guesses',
    body: 'Every tagged knowledge gap gets matched to actual YouTube videos via search, not hallucinated advice — the app teaches, not just grades.',
  },
  {
    icon: ShieldCheck,
    title: 'Your keys, your control',
    body: 'Bring your own Gemini/OpenAI key if you want, encrypted at rest with envelope encryption — never stored or shown in plaintext.',
  },
];

function AmbientGlow() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      <motion.div
        animate={{ x: [0, 40, 0], y: [0, -20, 0] }}
        transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute -left-24 top-0 h-80 w-80 rounded-full bg-amber-500/20 blur-3xl"
      />
      <motion.div
        animate={{ x: [0, -30, 0], y: [0, 30, 0] }}
        transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute right-0 top-24 h-72 w-72 rounded-full bg-panel-skeptical/10 blur-3xl"
      />
    </div>
  );
}

export default function Landing() {
  const { user } = useAuth();

  return (
    <main>
      <section className="relative mx-auto max-w-5xl px-6 pb-16 pt-20 text-center">
        <AmbientGlow />
        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="font-display text-4xl font-bold leading-tight text-slate-50 sm:text-5xl"
        >
          A panel of interviewers who
          <span className="text-amber-400"> disagree with each other.</span>
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mx-auto mt-5 max-w-2xl text-lg text-slate-400"
        >
          Crucible runs a real multi-persona interview panel against your answers, cross-examines the weak
          ones, tracks your recurring weaknesses across sessions, and points you to real resources to fix
          them.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mt-8 flex justify-center gap-4"
        >
          <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
            <Link to={user ? '/dashboard' : '/register'} className="btn-primary">
              {user ? 'Go to dashboard' : 'Start practicing free'}
            </Link>
          </motion.div>
          <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
            <Link to="/login" className="btn-secondary">
              Log in
            </Link>
          </motion.div>
        </motion.div>
      </section>

      <section className="mx-auto grid max-w-5xl gap-5 px-6 pb-24 sm:grid-cols-2">
        {FEATURES.map(({ icon: Icon, title, body }, i) => (
          <motion.div
            key={title}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            whileHover={{ scale: 1.015 }}
            transition={{ duration: 0.4, delay: i * 0.08 }}
            className="card-interactive group"
          >
            <Icon className="mb-3 text-amber-400 transition-transform group-hover:scale-110" size={26} />
            <h3 className="font-display text-lg font-semibold text-slate-100">{title}</h3>
            <p className="mt-2 text-sm text-slate-400">{body}</p>
          </motion.div>
        ))}
      </section>
    </main>
  );
}
