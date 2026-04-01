import path from "path";
import express from "express";
import app from "../artifacts/api-server/src/app";

const publicPath = path.join(process.cwd(), "public");

app.use(express.static(publicPath));

app.get("/*splat", (_req: express.Request, res: express.Response): void => {
  res.sendFile(path.join(publicPath, "index.html"));
});

export default app;
