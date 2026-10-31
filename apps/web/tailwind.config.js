/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: ["class"],
    content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
    theme: {
        extend: {
            colors: {
                background: "hsl(var(--background) / <alpha-value>)",
                foreground: "hsl(var(--foreground) / <alpha-value>)",
                surface: {
                    DEFAULT: "hsl(var(--surface) / <alpha-value>)",
                    raised: "hsl(var(--surface-raised) / <alpha-value>)",
                    sunken: "hsl(var(--surface-sunken) / <alpha-value>)",
                },
                card: {
                    DEFAULT: "hsl(var(--card) / <alpha-value>)",
                    foreground: "hsl(var(--card-foreground) / <alpha-value>)",
                },
                muted: {
                    DEFAULT: "hsl(var(--muted) / <alpha-value>)",
                    foreground: "hsl(var(--muted-foreground) / <alpha-value>)",
                },
                subtle: "hsl(var(--subtle-foreground) / <alpha-value>)",
                accent: {
                    DEFAULT: "hsl(var(--accent) / <alpha-value>)",
                    foreground: "hsl(var(--accent-foreground) / <alpha-value>)",
                    soft: "hsl(var(--accent-soft) / <alpha-value>)",
                    "soft-foreground": "hsl(var(--accent-soft-foreground) / <alpha-value>)",
                },
                border: "hsl(var(--border) / <alpha-value>)",
                "border-strong": "hsl(var(--border-strong) / <alpha-value>)",
                input: "hsl(var(--input) / <alpha-value>)",
                ring: "hsl(var(--ring) / <alpha-value>)",
                overlay: "hsl(var(--overlay) / <alpha-value>)",
                success: "hsl(var(--success) / <alpha-value>)",
            },
            borderRadius: {
                sm: "var(--radius-sm)",
                md: "var(--radius-md)",
                lg: "var(--radius-lg)",
            },
            fontFamily: {
                sans: ["var(--font-sans)", "system-ui", "sans-serif"],
                mono: ["var(--font-mono)", "ui-monospace", "monospace"],
            },
            maxWidth: {
                shell: "92rem",
            },
        },
    },
    plugins: [],
};
