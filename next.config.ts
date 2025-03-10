/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  webpack: (config) => {
    // ตั้งค่า fallbacks สำหรับโมดูลที่ไม่มีบนเบราว์เซอร์
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      path: false,
      os: false,
      crypto: false,
    };

    return config;
  },
};

module.exports = nextConfig;
