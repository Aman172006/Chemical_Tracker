/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                olive: {
                    50: '#F4F7F0',
                    100: '#E3EBD8',
                    200: '#C8D6B0',
                    300: '#A8BC84',
                    400: '#8BA55E',
                    500: '#6B8C3E',
                    600: '#567230',
                    700: '#445A26',
                    800: '#33431D',
                    900: '#222D14'
                },
                badge: {
                    DEFAULT: '#1E1E1E',
                    700: '#2D2D2D',
                    600: '#3D3D3D',
                    500: '#525252',
                    400: '#6B6B6B',
                    300: '#8A8A8A',
                    200: '#B0B0B0',
                    100: '#D4D4D4'
                },
                cream: '#F1F4EE',
                mist: '#E4E9DF',
                'off-white': '#F8FAF7',
                alert: {
                    green: {
                        DEFAULT: '#16A34A',
                        bg: '#F0FDF4',
                        border: '#BBF7D0',
                    },
                    amber: {
                        DEFAULT: '#D97706',
                        bg: '#FFFBEB',
                        border: '#FDE68A',
                        text: '#92400E',
                    },
                    orange: {
                        DEFAULT: '#EA580C',
                        bg: '#FFF7ED',
                        border: '#FDBA74',
                        text: '#9A3412',
                    },
                    red: {
                        DEFAULT: '#DC2626',
                        bg: '#FEF2F2',
                        border: '#FCA5A5',
                        text: '#991B1B',
                    },
                }
            },
            fontFamily: {
                sans: ['Inter', 'system-ui', 'sans-serif'],
                mono: ['JetBrains Mono', 'SF Mono', 'monospace']
            },
            boxShadow: {
                xs: '0 1px 2px rgba(0,0,0,0.04)',
                sm: '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
                md: '0 4px 6px rgba(0,0,0,0.05), 0 2px 4px rgba(0,0,0,0.03)',
                lg: '0 10px 15px rgba(0,0,0,0.06), 0 4px 6px rgba(0,0,0,0.03)',
                xl: '0 20px 25px rgba(0,0,0,0.08), 0 8px 10px rgba(0,0,0,0.04)',
                'olive-glow': '0 0 20px rgba(107, 140, 62, 0.15)',
                'amber-glow': '0 0 20px rgba(217, 119, 6, 0.15)',
                'orange-glow': '0 0 20px rgba(234, 88, 12, 0.15)',
                'red-glow': '0 0 30px rgba(220, 38, 38, 0.2)',
            }
        },
    },
    plugins: [],
}
