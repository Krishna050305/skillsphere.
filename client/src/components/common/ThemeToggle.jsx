import React from 'react';
import { useTheme } from '../../context/ThemeContext.jsx';
import { IconSun, IconMoon } from '../icons';

export default function ThemeToggle() {
  const { isDark, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="relative flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-300 cursor-pointer group"
      style={{
        background: isDark ? 'var(--bg-tertiary)' : 'var(--bg-tertiary)',
        border: '1px solid var(--border-primary)',
      }}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      <IconSun className="w-[18px] h-[18px] transition-all duration-300" style={{ color: isDark ? 'var(--accent-secondary)' : 'var(--accent-primary)', transform: isDark ? 'rotate(0deg) scale(1)' : 'rotate(90deg) scale(0)', opacity: isDark ? 1 : 0, position: 'absolute' }} />
      <IconMoon className="w-[18px] h-[18px] transition-all duration-300" style={{ color: isDark ? 'var(--accent-primary)' : 'var(--text-secondary)', transform: isDark ? 'rotate(-90deg) scale(0)' : 'rotate(0deg) scale(1)', opacity: isDark ? 0 : 1, position: 'absolute' }} />
    </button>
  );
}
