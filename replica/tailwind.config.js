import { defineConfig } from 'tailwindcss';
import type { Config } from 'tailwindcss';

export default defineConfig({
  content: ['./app/**/*.{js,jsx,ts,tsx}', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: 'var(--color-bg)',
        surface: 'var(--color-surface)',
        'surface-elevated': 'var(--color-surface-elevated)',
        border: 'var(--color-border)',
        'border-input': 'var(--color-border-input)',
        text: 'var(--color-text)',
        'text-muted': 'var(--color-text-muted)',
        'text-subtle': 'var(--color-text-subtle)',
        accent: 'var(--color-accent)',
        'accent-light': 'var(--color-accent-light)',
        'on-accent': 'var(--color-on-accent)',
        'accent-secondary': 'var(--color-accent-secondary)',
        danger: 'var(--color-danger)',
        'danger-light': 'var(--color-danger-light)',
        success: 'var(--color-success)',
        'success-light': 'var(--color-success-light)',
        warning: 'var(--color-warning)',
        'warning-light': 'var(--color-warning-light)',
        sos: 'var(--color-sos)',
        'sos-dark': 'var(--color-sos-dark)',
        'tier-silver': 'var(--color-tier-silver)',
        'tier-gold': 'var(--color-tier-gold)',
        'tier-platinum': 'var(--color-tier-platinum)',
        online: 'var(--color-online)',
        offline: 'var(--color-offline)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      borderRadius: {
        sm: 'var(--radius-sm)',
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
        xl: 'var(--radius-xl)',
        pill: 'var(--radius-pill)',
      },
      boxShadow: {
        sm: 'var(--shadow-sm)',
        card: 'var(--shadow-card)',
        md: 'var(--shadow-md)',
        lg: 'var(--shadow-lg)',
        pop: 'var(--shadow-pop)',
      },
      transitionDuration: {
        fast: 'var(--motion-fast)',
        base: 'var(--motion-base)',
        slow: 'var(--motion-slow)',
      },
      transitionTimingFunction: {
        ease: 'var(--motion-ease)',
      },
      maxWidth: {
        'content': 'var(--max-content-width)',
      },
    },
  },
  plugins: [],
}) satisfies Config;