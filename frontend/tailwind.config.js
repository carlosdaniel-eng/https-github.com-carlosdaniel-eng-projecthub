/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Sora"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      colors: {
        // These now use CSS variables — dark/light themes switch automatically
        surface: {
          0: 'var(--surface-0)',
          1: 'var(--surface-1)',
          2: 'var(--surface-2)',
          3: 'var(--surface-3)',
          4: 'var(--surface-4)',
        },
        brand: {
          DEFAULT: '#3b82f6',
          hover: '#2563eb',
          dim: '#1d3461',
          glow: 'rgba(59,130,246,0.15)',
        },
        border: {
          DEFAULT: 'var(--border)',
          strong: 'var(--border-strong)',
        },
        text: {
          primary: 'var(--text-primary)',
          secondary: 'var(--text-secondary)',
          muted: 'var(--text-muted)',
        },
        status: {
          todo: '#64748b',
          in_progress: '#f59e0b',
          done: '#22c55e',
          active: '#3b82f6',
          archived: '#6b7280',
          completed: '#22c55e',
        },
        priority: {
          low: '#22c55e',
          medium: '#f59e0b',
          high: '#ef4444',
        },
      },
      boxShadow: {
        card: '0 1px 3px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.05)',
        glow: '0 0 20px rgba(59,130,246,0.2)',
        'glow-sm': '0 0 10px rgba(59,130,246,0.15)',
      },
      backgroundImage: {
        'brand-gradient': 'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease forwards',
        'slide-up': 'slideUp 0.3s ease forwards',
        'slide-in': 'slideIn 0.25s ease forwards',
        shimmer: 'shimmer 1.8s infinite linear',
      },
      keyframes: {
        fadeIn: { from: { opacity: 0 }, to: { opacity: 1 } },
        slideUp: { from: { opacity: 0, transform: 'translateY(12px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
        slideIn: { from: { opacity: 0, transform: 'translateX(-8px)' }, to: { opacity: 1, transform: 'translateX(0)' } },
        shimmer: {
          '0%': { backgroundPosition: '-400px 0' },
          '100%': { backgroundPosition: '400px 0' },
        },
      },
    },
  },
  plugins: [],
}
