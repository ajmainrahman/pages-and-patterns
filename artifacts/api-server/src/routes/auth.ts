import { Router, type IRouter } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

const SECRET = process.env.SESSION_SECRET ?? "dev-secret-change-me";
const COOKIE_OPTS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: "/",
};

router.get("/auth/me", async (req, res): Promise<void> => {
  const token = (req as Request & { cookies: Record<string, string> }).cookies?.token;
  if (!token) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  try {
    const payload = jwt.verify(token, SECRET) as { userId: number };
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, payload.userId));
    if (!user) {
      res.status(401).json({ error: "User not found" });
      return;
    }
    res.json({ id: user.id, email: user.email, name: user.name });
  } catch {
    res.status(401).json({ error: "Invalid session" });
  }
});

router.post("/auth/login", async (req, res): Promise<void> => {
  const { email, password } = req.body ?? {};
  if (!email || !password) {
    res.status(400).json({ error: "Email and password are required" });
    return;
  }
  const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email));
  if (!user) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }
  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }
  const token = jwt.sign({ userId: user.id, email: user.email }, SECRET, { expiresIn: "7d" });
  res.cookie("token", token, COOKIE_OPTS);
  res.json({ id: user.id, email: user.email, name: user.name });
});

router.post("/auth/register", async (req, res): Promise<void> => {
  const existing = await db.select({ id: usersTable.id }).from(usersTable).limit(1);
  if (existing.length > 0) {
    res.status(403).json({ error: "An account already exists. This app is for personal use only." });
    return;
  }
  const { email, password, name } = req.body ?? {};
  if (!email || !password) {
    res.status(400).json({ error: "Email and password are required" });
    return;
  }
  if (password.length < 8) {
    res.status(400).json({ error: "Password must be at least 8 characters" });
    return;
  }
  const passwordHash = await bcrypt.hash(password, 12);
  const [user] = await db
    .insert(usersTable)
    .values({ email, passwordHash, name: name ?? "" })
    .returning();
  const token = jwt.sign({ userId: user.id, email: user.email }, SECRET, { expiresIn: "7d" });
  res.cookie("token", token, COOKIE_OPTS);
  res.status(201).json({ id: user.id, email: user.email, name: user.name });
});

router.post("/auth/logout", (req, res): void => {
  res.clearCookie("token", { path: "/" });
  res.json({ ok: true });
});

export default router;
