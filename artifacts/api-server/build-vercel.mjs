/**
 * Bundles the Express app into a single self-contained JS file
 * for Vercel serverless function deployment.
 * Output: <repo_root>/api/index.js
 */
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { build as esbuild } from "esbuild";

globalThis.require = createRequire(import.meta.url);

const artifactDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(artifactDir, "../..");

async function buildVercel() {
  console.log("Building Vercel serverless handler...");

  await esbuild({
    entryPoints: [path.resolve(artifactDir, "src/app.ts")],
    platform: "node",
    bundle: true,
    format: "esm",
    outfile: path.resolve(repoRoot, "api/index.js"),
    logLevel: "info",
    external: [
      "*.node",
      "pg-native",
    ],
    banner: {
      js: `import { createRequire as __cr } from 'node:module';
import __path from 'node:path';
import __url from 'node:url';
globalThis.require = __cr(import.meta.url);
globalThis.__filename = __url.fileURLToPath(import.meta.url);
globalThis.__dirname = __path.dirname(globalThis.__filename);
`,
    },
  });

  console.log("Vercel handler built → api/index.js");
}

buildVercel().catch((err) => {
  console.error(err);
  process.exit(1);
});
