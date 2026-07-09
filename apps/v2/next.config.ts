import { createMDX } from 'fumadocs-mdx/next';

/** @type {import('next').NextConfig} */
const config = {
  reactStrictMode: true,
};

const withMDX = createMDX({
  // customize the config file path
  configPath: "source.config.ts"
});

export default withMDX(config);