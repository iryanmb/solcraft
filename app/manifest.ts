// The web app manifest: lets phones add Solcraft to the Home Screen as its own app
// (name, colors, icons; opens full screen). Icons are made from the sun mark.
import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Solcraft",
    short_name: "Solcraft",
    description: "Find recurring cultural gatherings in Atlanta, show up, and keep coming back.",
    start_url: "/",
    display: "standalone",
    background_color: "#0E1024",
    theme_color: "#0E1024",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
