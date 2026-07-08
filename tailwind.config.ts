import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        border: "hsl(var(--border))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--foreground))",
        },
        evaluation: {
          bg: "hsl(var(--evaluation-bg))",
          header: "hsl(var(--evaluation-header))",
          "table-header": "hsl(var(--evaluation-table-header))",
          "table-border": "hsl(var(--evaluation-table-border))",
        },
        chart: {
          pre: "hsl(var(--chart-pre-training))",
          post: "hsl(var(--chart-post-training))",
        },
      },
      boxShadow: {
        elegant: "0 10px 30px -10px hsl(20 25% 29% / 0.25)",
      },
      borderRadius: {
        xl: "0.75rem",
      },
    },
  },
  plugins: [],
} satisfies Config;
