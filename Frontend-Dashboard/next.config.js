/** @type {import('next').NextConfig} */
function normalizedBackendOrigin() {
  const candidates = [
    process.env.BACKEND_INTERNAL_URL,
    process.env.DJANGO_API_BASE,
    process.env.SYNDICATE_DJANGO_ORIGIN,
    process.env.NEXT_PUBLIC_API_BASE,
    process.env.NEXT_PUBLIC_API_BASE_URL,
    process.env.NEXT_PUBLIC_SYNDICATE_API_URL,
  ]
    .map((v) => (v || "").trim())
    .filter(Boolean);

  for (const raw of candidates) {
    try {
      const u = new URL(raw);
      // If user provided .../api, use service origin only.
      const path = u.pathname.replace(/\/+$/, "");
      if (path.endsWith("/api")) return u.origin;
      return `${u.origin}${path}`.replace(/\/+$/, "");
    } catch {
      // Skip invalid URL-ish values.
    }
  }

  return "http://127.0.0.1:8000";
}

const backendOrigin = normalizedBackendOrigin();

function backendMediaRemotePattern() {
  try {
    const u = new URL(backendOrigin);
    if (u.hostname === "127.0.0.1" || u.hostname === "localhost") {
      return null;
    }
    return {
      protocol: u.protocol.replace(":", ""),
      hostname: u.hostname,
      pathname: "/media/**",
    };
  } catch {
    return null;
  }
}

const mediaRemote = backendMediaRemotePattern();

const nextConfig = {
  output: "standalone",
  reactStrictMode: true,
  experimental: {
    optimizePackageImports: ["lucide-react", "framer-motion", "recharts"]
  },
  devIndicators: {
    buildActivity: false
  },
  images: {
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 60 * 60 * 24 * 30,
    /** Any `quality` passed to `<Image />` must be listed here (Next 15+). */
    qualities: [55, 60, 62, 70, 72, 75, 78, 85, 88],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [256, 384, 480, 640, 768],
    remotePatterns: [
      { protocol: "http", hostname: "127.0.0.1", port: "8000", pathname: "/media/**" },
      { protocol: "http", hostname: "localhost", port: "8000", pathname: "/media/**" },
      // TikTok oEmbed poster URLs (home “Most viewed” marquee).
      { protocol: "https", hostname: "p16-common-sign.tiktokcdn.com", pathname: "/**" },
      { protocol: "https", hostname: "p19-common-sign.tiktokcdn.com", pathname: "/**" },
      // Cloudinary image CDN (program thumbnails / covers from API).
      { protocol: "https", hostname: "res.cloudinary.com", pathname: "/**" },
      ...(mediaRemote ? [mediaRemote] : [])
    ]
  },
  async rewrites() {
    return {
      beforeFiles: [
        {
          source: "/api/portal-proxy/:path*",
          destination: `${backendOrigin}/api/:path*`
        },
        {
          source: "/api/portal/:path*",
          destination: `${backendOrigin}/api/portal/:path*`
        },
        {
          source: "/api/affiliate/:path*",
          destination: `${backendOrigin}/api/affiliate/:path*`
        },
        {
          source: "/api/track/:path*",
          destination: `${backendOrigin}/api/track/:path*`
        },
        // Programs API (same-origin as dashboard). Without these, fetches to `/api/courses/`
        // hit Next 404; portal-proxy also works via resolveClientApiUrl.
        {
          source: "/api/courses",
          destination: `${backendOrigin}/api/courses/`
        },
        {
          source: "/api/courses/:path*",
          destination: `${backendOrigin}/api/courses/:path*`
        },
        {
          source: "/api/videos",
          destination: `${backendOrigin}/api/videos/`
        },
        {
          source: "/api/videos/:path*",
          destination: `${backendOrigin}/api/videos/:path*`
        },
        {
          source: "/api/streaming",
          destination: `${backendOrigin}/api/streaming/`
        },
        {
          source: "/api/streaming/:path*",
          destination: `${backendOrigin}/api/streaming/:path*`
        },
        {
          source: "/api/auth/:path*",
          destination: `${backendOrigin}/api/auth/:path*`
        },
        // Uploaded course covers & video thumbnails (Django MEDIA_URL)
        {
          source: "/media/:path*",
          destination: `${backendOrigin}/media/:path*`
        }
      ]
    };
  },
  async redirects() {
    return [
      { source: "/challenges", destination: "/", permanent: false },
      { source: "/challenges/:path*", destination: "/", permanent: false }
    ];
  }
};

module.exports = nextConfig;
