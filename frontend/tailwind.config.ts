import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "#12261E",
        paper: "#F6F3ED",
        moss: "#3F5A46",
        clay: "#B9773A",
        line: "#D8D2C4",
      },
      fontFamily: {
        // TODO(design): swap for real display/body typefaces once
        // /content or a design pass picks them. Left as safe system stacks
        // for now — no build-time network fetch, no extra dependency.
        display: [
          "Georgia",
          "Iowan Old Style",
          "Palatino Linotype",
          "serif",
        ],
        body: [
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Helvetica Neue",
          "Arial",
          "sans-serif",
        ],
      },
    },
  },
  plugins: [],
};

export default config;
