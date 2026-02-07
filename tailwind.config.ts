import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'ui-border': 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: '#4f46e5', // Indigo 600
          foreground: '#ffffff',
          50: '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
          950: '#1e1b4b',
        },
        secondary: {
          DEFAULT: '#f8fafc', // Slate 50
          foreground: '#0f172a',
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
          950: '#020617',
        },
        surface: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
          950: '#020617',
        },
      },
      fontFamily: {
        sans: ['var(--font-jakarta)', 'Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.15s ease-out',
        'slide-up': 'slideUp 0.15s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
  typography: (theme: any) => ({
    DEFAULT: {
      css: {
        color: theme('colors.surface.700'),
        maxWidth: 'none',
        hr: {
          borderColor: theme('colors.surface.200'),
          marginTop: '2em',
          marginBottom: '2em',
        },
        'h1, h2, h3, h4': {
          color: theme('colors.surface.900'),
          fontWeight: '900',
          letterSpacing: '-0.025em',
          marginTop: '1.5em',
          marginBottom: '0.5em',
        },
        h1: {
          fontSize: '2.25rem',
          lineHeight: '2.5rem',
        },
        h2: {
          fontSize: '1.875rem',
          lineHeight: '2.25rem',
        },
        h3: {
          fontSize: '1.5rem',
          lineHeight: '2rem',
        },
        h4: {
          fontSize: '1.25rem',
          lineHeight: '1.75rem',
        },
        a: {
          color: theme('colors.primary.600'),
          textDecoration: 'none',
          fontWeight: '600',
          transition: 'color 0.15s ease-in-out',
          '&:hover': {
            color: theme('colors.primary.700'),
            textDecoration: 'underline',
          },
        },
        'strong, b': {
          color: theme('colors.surface.900'),
          fontWeight: '800',
        },
        'ol > li::before': {
          color: theme('colors.surface.400'),
          fontWeight: '700',
        },
        'ul > li::marker': {
          color: theme('colors.surface.400'),
        },
        code: {
          color: theme('colors.primary.700'),
          backgroundColor: theme('colors.primary.50'),
          paddingLeft: '0.4rem',
          paddingRight: '0.4rem',
          paddingTop: '0.2rem',
          paddingBottom: '0.2rem',
          borderRadius: '0.375rem',
          fontWeight: '600',
          fontSize: '0.875em',
        },
        'code::before': {
          content: 'none',
        },
        'code::after': {
          content: 'none',
        },
        blockquote: {
          borderLeftWidth: '4px',
          borderLeftColor: theme('colors.primary.200'),
          color: theme('colors.surface.600'),
          fontStyle: 'italic',
          paddingLeft: '1.5rem',
          backgroundColor: theme('colors.surface.50'),
          borderRadius: '0 0.5rem 0.5rem 0',
        },
      },
    },
  }),
};

export default config;
