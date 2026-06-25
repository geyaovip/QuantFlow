import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: "https://quantflow.chat",
      lastModified: new Date("2026-06-25"),
      changeFrequency: "weekly",
      priority: 1,
    },
  ];
}
