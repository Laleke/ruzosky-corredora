import withSerwistInit from "@serwist/next";

const withSerwist = withSerwistInit({
  // Service worker fuente y destino compilado.
  swSrc: "src/app/sw.ts",
  swDest: "public/sw.js",
  // Desactiva el SW en desarrollo para no cachear cambios de HMR.
  disable: process.env.NODE_ENV === "development",
});

const nextConfig = {
  reactStrictMode: true,
};

export default withSerwist(nextConfig);
