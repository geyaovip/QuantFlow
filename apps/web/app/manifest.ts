import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "QuantFlow",
    short_name: "QuantFlow",
    description: "策略研究与模拟验证平台",
    lang: "zh-CN",
    start_url: "/app/strategies",
    display: "standalone",
    background_color: "#F7F8FA",
    theme_color: "#F7F8FA",
    icons: [
      { src: "/brand/pwa-icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/brand/pwa-icon-512.png", sizes: "512x512", type: "image/png" },
      {
        src: "/brand/pwa-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
