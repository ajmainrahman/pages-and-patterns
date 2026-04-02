import { Router, type IRouter } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { authMiddleware, adminMiddleware } from "../middleware/auth";

const router: IRouter = Router();

const SECRET = process.env.SESSION_SECRET ?? "dev-secret-change-me";
const MAX_USERS = 5;

const COOKIE_OPTS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: "/",
};

function makeToken(user: { id: number; email: string; isAdmin: boolean }) {
  return jwt.sign({ userId: user.id, email: user.email, isAdmin: user.isAdmin }, SECRET, { expiresIn: "7d" });
}

router.get("/auth/me", async (req, res): Promise<void> => {
  const token = (req as typeof req & { cookies: Record<string, string> }).cookies?.token;
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
    res.json({ id: user.id, email: user.email, name: user.name, isAdmin: user.isAdmin });
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
  const token = makeToken(user);
  res.cookie("token", token, COOKIE_OPTS);
  res.json({ id: user.id, email: user.email, name: user.name, isAdmin: user.isAdmin });
});

router.post("/auth/register", async (req, res): Promise<void> => {
  const existing = await db.select({ id: usersTable.id }).from(usersTable);
  if (existing.length >= MAX_USERS) {
    res.status(403).json({ error: `Maximum ${MAX_USERS} accounts allowed.` });
    return;
  }
  const isFirstUser = existing.length === 0;
  const { email, password, name } = req.body ?? {};
  if (!email || !password) {
    res.status(400).json({ error: "Email and password are required" });
    return;
  }
  if (password.length < 8) {
    res.status(400).json({ error: "Password must be at least 8 characters" });
    return;
  }

  const existingEmail = await db.select({ id: usersTable.id }).from(usersTable).where(eq(usersTable.email, email));
  if (existingEmail.length > 0) {
    res.status(400).json({ error: "An account with this email already exists" });
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const [user] = await db
    .insert(usersTable)
    .values({ email, passwordHash, name: name ?? "", isAdmin: isFirstUser })
    .returning();
  const token = makeToken(user);
  res.cookie("token", token, COOKIE_OPTS);
  res.status(201).json({ id: user.id, email: user.email, name: user.name, isAdmin: user.isAdmin });
});

router.post("/auth/logout", (req, res): void => {
  res.clearCookie("token", { path: "/" });
  res.json({ ok: true });
});

router.get("/admin/users", authMiddleware, adminMiddleware, async (req, res): Promise<void> => {
  const users = await db
    .select({ id: usersTable.id, email: usersTable.email, name: usersTable.name, isAdmin: usersTable.isAdmin, createdAt: usersTable.createdAt })
    .from(usersTable)
    .orderBy(usersTable.createdAt);
  res.json(users);
});

router.post("/admin/users/invite", authMiddleware, adminMiddleware, async (req, res): Promise<void> => {
  const existing = await db.select({ id: usersTable.id }).from(usersTable);
  if (existing.length >= MAX_USERS) {
    res.status(403).json({ error: `Maximum ${MAX_USERS} accounts allowed.` });
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
  const existingEmail = await db.select({ id: usersTable.id }).from(usersTable).where(eq(usersTable.email, email));
  if (existingEmail.length > 0) {
    res.status(400).json({ error: "An account with this email already exists" });
    return;
  }
  const passwordHash = await bcrypt.hash(password, 12);
  const [user] = await db
    .insert(usersTable)
    .values({ email, passwordHash, name: name ?? "", isAdmin: false })
    .returning();
  res.status(201).json({ id: user.id, email: user.email, name: user.name, isAdmin: user.isAdmin });
});

router.delete("/admin/users/:id", authMiddleware, adminMiddleware, async (req, res): Promise<void> => {
  const targetId = parseInt(req.params.id, 10);
  if (isNaN(targetId)) {
    res.status(400).json({ error: "Invalid user ID" });
    return;
  }
  if (targetId === req.user!.userId) {
    res.status(400).json({ error: "You cannot delete your own account" });
    return;
  }
  const [deleted] = await db.delete(usersTable).where(eq(usersTable.id, targetId)).returning();
  if (!deleted) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  res.json({ ok: true });
});

export default router;
