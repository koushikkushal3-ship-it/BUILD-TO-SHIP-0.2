import { motion } from 'framer-motion';

export default function TypingDots({ dotClassName = 'bg-neutral-900' }) {
  return (
    <span className="flex gap-0.5">
      {[0, 0.15, 0.3].map((delay) => (
        <motion.span
          key={delay}
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 1, repeat: Infinity, delay }}
          className={`h-1 w-1 rounded-full ${dotClassName}`}
        />
      ))}
    </span>
  );
}
