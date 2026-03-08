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
        surface: {
          0: '#0a0c10',
          1: '#0f1117',
          2: '#161b25',
          3: '#1e2535',
          4: '#252e42',
        },
        brand: {
          DEFAULT: '#3b82f6',
          hover: '#2563eb',
          dim: '#1d3461',
          glow: 'rgba(59,130,246,0.15)',
        },
        border: {
          DEFAULT: 'rgba(255,255,255,0.06)',
          strong: 'rgba(255,255,255,0.12)',
        },
        text: {
          primary: '#f0f4ff',
          secondary: '#8b9ab8',
          muted: '#4d5a74',
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
        'grid-pattern': `
          linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)
        `,
        'brand-gradient': 'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)',
      },
      backgroundSize: {
        grid: '32px 32px',
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
