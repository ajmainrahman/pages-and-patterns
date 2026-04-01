import express, { type Express } from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import router from "./routes";

const app: Express = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);

// In production, serve the built React frontend static files.
// The vite build outputs to <repo_root>/public/
// This file compiles to artifacts/api-server/dist/index.mjs, so ../../../ = repo root
if (process.env["NODE_ENV"] === "production") {
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const publicDir = path.resolve(__dirname, "../../../public");

  if (fs.existsSync(publicDir)) {
    app.use(express.static(publicDir));

    // SPA fallback: all non-API routes serve index.html
    app.get("*", (_req, res) => {
      res.sendFile(path.join(publicDir, "index.html"));
    });
  }
}

export default app;
