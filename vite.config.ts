import react from "@vitejs/plugin-react";
import { resolve } from "path";
import { defineConfig, PluginOption } from "vite";
import compression from "vite-plugin-compression";
import { crx, ManifestV3Export } from "@crxjs/vite-plugin";
import merge from "lodash/merge";
import { nodePolyfills } from "vite-plugin-node-polyfills";
import manifest from "./public/manifest.json";
import pkg from "./package.json";

// Routes
const root = resolve(__dirname, "src");
const outDir = resolve(__dirname, "dist");
const publicDir = resolve(__dirname, "public");

// Alias
const aliasConfig = {
  "@src": root,
  "@assets": resolve(root, "ui/assets"),
  "@pages": resolve(root, "ui/pages"),
  "@components": resolve(root, "ui/components"),
};

function loadManifestConfig() {
  return {
    ...merge(manifest),
    manifest_version: 3,
    name: pkg.name,
    description: pkg.description,
    version: pkg.version,
  };
}

function getVitePlugins(): PluginOption[] {
  const extensionManifest = loadManifestConfig();

  return [
    react(),
    crx({
      manifest: extensionManifest as ManifestV3Export,
      contentScripts: {
        injectCss: true,
      },
    }),
    nodePolyfills(),
    compression(),
  ];
}

export default defineConfig({
  resolve: {
    alias: aliasConfig,
  },
  plugins: getVitePlugins(),
  publicDir,
  build: {
    outDir,
    sourcemap: true,
    emptyOutDir: false,
    rollupOptions: {
      input: {
        popup: resolve(__dirname, "src/ui/pages/popup/index.html"),
        options: resolve(__dirname, "src/ui/pages/options/index.html"),
        qrScanner: resolve(__dirname, "src/ui/pages/qrScanner/index.html")
      },
    },
  },
});
