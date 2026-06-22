/** @type {import('next').NextConfig} */
const nextConfig = {
  reactCompiler: true,

  // Proxy ML services through Next.js so the browser sees same-origin
  // requests (avoids CORS). The FastAPI containers expose host ports
  // 9000 and 9001; the frontend calls /ml-proxy/... instead.
  async rewrites() {
    return [
      { source: "/ml-proxy/match/:path*",  destination: "http://localhost:9000/:path*" },
      { source: "/ml-proxy/player/:path*", destination: "http://localhost:9001/:path*" },
    ];
  },
};

export default nextConfig;
