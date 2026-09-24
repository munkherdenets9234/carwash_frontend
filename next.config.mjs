/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // The dev overlay's floating badge sits bottom-left, exactly where the
  // phone shells put their first tab — it covers "Today" and "Garage" in
  // every screenshot. Off, because these screens get demonstrated in dev.
  devIndicators: false,

  images: {
    // Photographs are uploaded by the business and served from the image
    // host, so next/image has to be told the host is allowed — it refuses
    // remote URLs by default, and that default is the right one: without it
    // any string that reached an <Image src> would turn this server into an
    // open image proxy for the whole internet.
    //
    // Narrowed to the delivery hostname and the /image/upload/ path rather
    // than the whole domain, so only what was actually uploaded can be
    // optimised through here.
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: "/**/image/upload/**",
      },
    ],
  },
};

export default nextConfig;
