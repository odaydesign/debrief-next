export default function manifest() {
  return {
    name: "Debrief",
    short_name: "Debrief",
    description: "Din dagliga nyhetsbrief — handplockat, varje morgon.",
    id: "/",
    start_url: "/",
    display: "standalone",
    lang: "sv",
    background_color: "#26231f",
    theme_color: "#26231f",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/maskable-192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
