import { Router, type IRouter } from "express";
import { HealthCheckResponse } from "@workspace/api-zod";
import { pool } from "@workspace/db";

const router: IRouter = Router();

router.get("/healthz", (_req, res) => {
  const data = HealthCheckResponse.parse({ status: "ok" });
  res.json(data);
});

router.get("/api-check", async (_req, res): Promise<void> => {
  try {
    const result = await pool.query("SELECT NOW() as time, current_database() as db");
    res.json({
      status: "ok",
      db: result.rows[0].db,
      time: result.rows[0].time,
      env: process.env.NODE_ENV ?? "unknown",
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ status: "error", message });
  }
});

export default router;
