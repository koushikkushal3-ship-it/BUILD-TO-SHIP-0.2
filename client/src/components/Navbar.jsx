import { Link, useNavigate } from 'react-router-dom';
import { Gavel, LayoutDashboard, Newspaper, Settings, LogOut, Sun, Moon } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext.jsx';
import { useTheme } from '../context/ThemeContext.jsx';

function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      aria-label="Toggle light/dark theme"
      className="relative flex h-8 w-8 items-center justify-center overflow-hidden rounded-full text-slate-300 transition hover:bg-charcoal-800 hover:text-amber-400"
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={theme}
          initial={{ opacity: 0, rotate: -90, scale: 0.5 }}
          animate={{ opacity: 1, rotate: 0, scale: 1 }}
          exit={{ opacity: 0, rotate: 90, scale: 0.5 }}
          transition={{ duration: 0.2 }}
          className="flex items-center justify-center"
        >
          {theme === 'dark' ? <Moon size={16} /> : <Sun size={16} />}
        </motion.span>
      </AnimatePresence>
    </button>
  );
}

export default function Navbar() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-40 border-b border-charcoal-700 bg-charcoal-950/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link to="/" className="flex items-center gap-2 font-display text-lg font-semibold text-amber-400">
          <Gavel size={20} />
          Crucible
        </Link>

        <div className="flex items-center gap-4">
          {user && (
            <nav className="flex items-center gap-4 text-sm text-slate-300">
              <Link to="/dashboard" className="flex items-center gap-1.5 transition hover:text-amber-400">
                <LayoutDashboard size={16} /> Dashboard
              </Link>
              <Link to="/news" className="flex items-center gap-1.5 transition hover:text-amber-400">
                <Newspaper size={16} /> News
              </Link>
              <Link to="/settings" className="flex items-center gap-1.5 transition hover:text-amber-400">
                <Settings size={16} /> Settings
              </Link>
              <button
                onClick={async () => {
                  await signOut();
                  navigate('/');
                }}
                className="flex items-center gap-1.5 transition hover:text-amber-400"
              >
                <LogOut size={16} /> Logout
              </button>
            </nav>
          )}
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
