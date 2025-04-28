/** @type {import('next').NextConfig} */
const nextConfig = {
  // تمكين وضع Strict Mode لتحسين جودة الكود
  reactStrictMode: true,

  // تكوين الميزات التجريبية
  experimental: {
    // تمكين ميزات الخادم الحديثة
    serverActions: {
      allowedOrigins: ['localhost:3000'],
    },
  },

  // تكوين الأمان
  headers: async () => {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
