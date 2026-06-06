import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Picaflor · Técnica diaria de guitarra",
    short_name: "Picaflor",
    description:
      "Un lick o ejercicio de técnica cada día. Metrónomo integrado, biblioteca de ejercicios y seguimiento de tu racha. Para guitarristas que quieren mejorar de verdad.",
    start_url: "/practica",
    scope: "/",
    display: "standalone",
    orientation: "portrait-primary",
    background_color: "#0c0a09",
    theme_color: "#0c0a09",
    categories: ["music", "education", "lifestyle"],
    icons: [
      {
        src: "/icon",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/apple-icon",
        sizes: "180x180",
        type: "image/png",
        purpose: "any",
      },
    ],
    screenshots: [],
  };
}
