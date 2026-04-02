import { Router, type IRouter } from "express";
import { eq, and, desc } from "drizzle-orm";
import { db, journalEntriesTable } from "@workspace/db";
import {
  CreateJournalEntryBody,
  UpdateJournalEntryBody,
  GetJournalEntryParams,
  UpdateJournalEntryParams,
  DeleteJournalEntryParams,
  GetJournalEntryResponse,
  UpdateJournalEntryResponse,
  ListJournalEntriesResponseItem,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/journal", async (req, res): Promise<void> => {
  const userId = req.user!.userId;
  const entries = await db
    .select()
    .from(journalEntriesTable)
    .where(eq(journalEntriesTable.userId, userId))
    .orderBy(desc(journalEntriesTable.createdAt));
  res.json(entries.map((e) => ListJournalEntriesResponseItem.parse(e)));
});

router.post("/journal", async (req, res): Promise<void> => {
  const userId = req.user!.userId;
  const parsed = CreateJournalEntryBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [entry] = await db
    .insert(journalEntriesTable)
    .values({
      userId,
      title: parsed.data.title,
      content: parsed.data.content ?? "",
      mood: (parsed.data.mood ?? "neutral") as "happy" | "reflective" | "inspired" | "melancholic" | "neutral",
      domain: parsed.data.domain ?? null,
      tags: parsed.data.tags ?? [],
      bookId: parsed.data.bookId ?? null,
      quote: parsed.data.quote ?? null,
      minutesRead: parsed.data.minutesRead ?? null,
      pinned: parsed.data.pinned ?? false,
      isReread: parsed.data.isReread ?? false,
    })
    .returning();
  res.status(201).json(GetJournalEntryResponse.parse(entry));
});

router.get("/journal/:id", async (req, res): Promise<void> => {
  const userId = req.user!.userId;
  const params = GetJournalEntryParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [entry] = await db
    .select()
    .from(journalEntriesTable)
    .where(and(eq(journalEntriesTable.id, params.data.id), eq(journalEntriesTable.userId, userId)));
  if (!entry) {
    res.status(404).json({ error: "Entry not found" });
    return;
  }
  res.json(GetJournalEntryResponse.parse(entry));
});

router.patch("/journal/:id", async (req, res): Promise<void> => {
  const userId = req.user!.userId;
  const params = UpdateJournalEntryParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateJournalEntryBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [entry] = await db
    .update(journalEntriesTable)
    .set(parsed.data)
    .where(and(eq(journalEntriesTable.id, params.data.id), eq(journalEntriesTable.userId, userId)))
    .returning();
  if (!entry) {
    res.status(404).json({ error: "Entry not found" });
    return;
  }
  res.json(UpdateJournalEntryResponse.parse(entry));
});

router.delete("/journal/:id", async (req, res): Promise<void> => {
  const userId = req.user!.userId;
  const params = DeleteJournalEntryParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [entry] = await db
    .delete(journalEntriesTable)
    .where(and(eq(journalEntriesTable.id, params.data.id), eq(journalEntriesTable.userId, userId)))
    .returning();
  if (!entry) {
    res.status(404).json({ error: "Entry not found" });
    return;
  }
  res.sendStatus(204);
});

export default router;
