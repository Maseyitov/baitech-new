/** @type {import('next').NextConfig} */
const nextConfig = {
  trailingSlash: true,
  
  async headers() {
    const isDev = process.env.NODE_ENV === "development";
    const cspValue = isDev
      ? "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://fonts.googleapis.com https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdn.jsdelivr.net; font-src 'self' https://fonts.gstatic.com https://cdn.jsdelivr.net data:; img-src 'self' data: https: blob:; media-src 'self' https: blob:; frame-src 'self' https:; connect-src 'self' https: wss: ws: http://localhost:*; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'self';"
      : "default-src 'self'; script-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdn.jsdelivr.net; font-src 'self' https://fonts.gstatic.com https://cdn.jsdelivr.net data:; img-src 'self' data: https: blob:; media-src 'self' https: blob:; frame-src 'self' https:; connect-src 'self' https: wss:; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'self'; upgrade-insecure-requests; block-all-mixed-content;";

    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Content-Security-Policy",
            value: cspValue,
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "SAMEORIGIN",
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "geolocation=(), microphone=(), camera=(), payment=(), usb=(), magnetometer=(), gyroscope=(), accelerometer=()",
          },
        ],
      },
    ];
  },

  async redirects() {
    return [
      { source: "/camera", destination: "/products", permanent: true },
      { source: "/camera/:path*", destination: "/products", permanent: true },
      { source: "/admin/camera", destination: "/products", permanent: true },
      { source: "/admin/camera/:path*", destination: "/products", permanent: true },

      // Legacy/SEO links that should open catalog sections instead of 404.
      { source: "/cameras", destination: "/catalog/cameras", permanent: true },
      { source: "/video-surveillance", destination: "/catalog/cameras", permanent: true },
      { source: "/cameras-and-video-surveillance", destination: "/catalog/cameras", permanent: true },
      { source: "/kamery-i-videonablyudenie", destination: "/catalog/cameras", permanent: true },
      { source: "/камеры-и-видеонаблюдение", destination: "/catalog/cameras", permanent: true },

      { source: "/recommendations", destination: "/catalog", permanent: true },
      { source: "/rekomendatsii", destination: "/catalog", permanent: true },
      { source: "/рекомендации", destination: "/catalog", permanent: true },

      { source: "/similar-products", destination: "/catalog", permanent: true },
      { source: "/pokhozhie-tovary", destination: "/catalog", permanent: true },
      { source: "/похожие-товары", destination: "/catalog", permanent: true },

      { source: "/raspredelitelnaya-korobka", destination: "/catalog/networking", permanent: true },
      { source: "/распределительная-коробка", destination: "/catalog/networking", permanent: true },
    ];
  },

    async rewrites() {
    return [
      { source: "/backend/:path*", destination: "https://baitech.kg/:path*/" },
    ];
  },

  images: {
    unoptimized: true,
    qualities: [75, 80],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "avatars.mds.yandex.net",
      },
      {
        protocol: "https",
        hostname: "img.championat.com",
      },
      {
        protocol: "https",
        hostname: "**.yandex.net",
      },
      {
        protocol: "https",
        hostname: "cdn.example.com",
      },
      {
        protocol: "https",
        // Allow all HTTPS domains for external images.
        hostname: "**",
      },
      {
        protocol: "https",
        hostname: "ayla-diandrous-unobscenely.ngrok-free.dev",
        pathname: "/media/**",
      },
      {
        protocol: "https",
        hostname: "157.230.138.217",
        pathname: "/media/**",
      },
    ],
  },
};

export default nextConfig;
