import { Router, type IRouter } from "express";
import { eq, and, desc } from "drizzle-orm";
import { db, booksTable } from "@workspace/db";
import {
  CreateBookBody,
  UpdateBookBody,
  GetBookParams,
  UpdateBookParams,
  DeleteBookParams,
  ListBooksQueryParams,
  ListRecentBooksQueryParams,
  GetBookResponse,
  UpdateBookResponse,
  GetStatsResponse,
  ListGenresResponse,
  ListBooksResponse,
  ListRecentBooksResponse,
  ListFavoriteBooksResponse,
  ListBengaliBooksResponse,
} from "@workspace/api-zod";
import { adminMiddleware } from "../middleware/auth";

const router: IRouter = Router();

function getUserId(req: Express.Request): number {
  return (req as typeof req & { user: { userId: number } }).user.userId;
}

router.get("/books/bengali", async (req, res): Promise<void> => {
  const userId = getUserId(req);
  const books = await db
    .select()
    .from(booksTable)
    .where(and(eq(booksTable.userId, userId), eq(booksTable.language, "bengali")))
    .orderBy(desc(booksTable.createdAt));
  res.json(ListBengaliBooksResponse.parse(books));
});

router.get("/books/genres", async (req, res): Promise<void> => {
  const userId = getUserId(req);
  const rows = await db
    .select({ genres: booksTable.genres })
    .from(booksTable)
    .where(eq(booksTable.userId, userId));
  const genreSet = new Set<string>();
  rows.forEach((r) => r.genres.forEach((g) => genreSet.add(g)));
  res.json(ListGenresResponse.parse(Array.from(genreSet).sort()));
});

router.get("/books/recent", async (req, res): Promise<void> => {
  const userId = getUserId(req);
  const params = ListRecentBooksQueryParams.safeParse(req.query);
  const limit = params.success && params.data.limit ? params.data.limit : 5;
  const books = await db
    .select()
    .from(booksTable)
    .where(eq(booksTable.userId, userId))
    .orderBy(desc(booksTable.createdAt))
    .limit(limit);
  res.json(ListRecentBooksResponse.parse(books));
});

router.get("/books/favorites", async (req, res): Promise<void> => {
  const userId = getUserId(req);
  const books = await db
    .select()
    .from(booksTable)
    .where(and(eq(booksTable.userId, userId), eq(booksTable.isFavorite, true)))
    .orderBy(desc(booksTable.createdAt));
  res.json(ListFavoriteBooksResponse.parse(books));
});

router.get("/books", async (req, res): Promise<void> => {
  const userId = getUserId(req);
  const params = ListBooksQueryParams.safeParse(req.query);
  const allBooks = await db
    .select()
    .from(booksTable)
    .where(eq(booksTable.userId, userId))
    .orderBy(desc(booksTable.createdAt));

  let filtered = allBooks;
  if (params.success) {
    if (params.data.search) {
      const search = params.data.search.toLowerCase();
      filtered = filtered.filter(
        (b) => b.title.toLowerCase().includes(search) || b.author.toLowerCase().includes(search)
      );
    }
    if (params.data.status) filtered = filtered.filter((b) => b.status === params.data.status);
    if (params.data.genre) {
      const genre = params.data.genre.toLowerCase();
      filtered = filtered.filter((b) => b.genres.some((g) => g.toLowerCase() === genre));
    }
  }
  res.json(ListBooksResponse.parse(filtered));
});

router.post("/books", async (req, res): Promise<void> => {
  const userId = getUserId(req);
  const parsed = CreateBookBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { title, author, ...rest } = parsed.data;
  const data = {
    userId,
    title: title ?? "",
    author: author ?? "",
    ...rest,
    genres: parsed.data.genres ?? [],
    quotes: parsed.data.quotes ?? [],
    status: (parsed.data.status ?? "want_to_read") as "read" | "reading" | "want_to_read",
    isFavorite: parsed.data.isFavorite ?? false,
  };
  const [book] = await db.insert(booksTable).values(data).returning();
  res.status(201).json(GetBookResponse.parse(book));
});

router.get("/books/:id", async (req, res): Promise<void> => {
  const userId = getUserId(req);
  const params = GetBookParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [book] = await db
    .select()
    .from(booksTable)
    .where(and(eq(booksTable.id, params.data.id), eq(booksTable.userId, userId)));
  if (!book) {
    res.status(404).json({ error: "Book not found" });
    return;
  }
  res.json(GetBookResponse.parse(book));
});

router.patch("/books/:id", async (req, res): Promise<void> => {
  const userId = getUserId(req);
  const params = UpdateBookParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateBookBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [book] = await db
    .update(booksTable)
    .set(parsed.data)
    .where(and(eq(booksTable.id, params.data.id), eq(booksTable.userId, userId)))
    .returning();
  if (!book) {
    res.status(404).json({ error: "Book not found" });
    return;
  }
  res.json(UpdateBookResponse.parse(book));
});

router.delete("/books/:id", async (req, res): Promise<void> => {
  const userId = getUserId(req);
  const params = DeleteBookParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [book] = await db
    .delete(booksTable)
    .where(and(eq(booksTable.id, params.data.id), eq(booksTable.userId, userId)))
    .returning();
  if (!book) {
    res.status(404).json({ error: "Book not found" });
    return;
  }
  res.sendStatus(204);
});

router.get("/stats", async (req, res): Promise<void> => {
  const userId = getUserId(req);
  const allBooks = await db.select().from(booksTable).where(eq(booksTable.userId, userId));

  const totalBooks = allBooks.length;
  const booksRead = allBooks.filter((b) => b.status === "read").length;
  const booksReading = allBooks.filter((b) => b.status === "reading").length;
  const booksWantToRead = allBooks.filter((b) => b.status === "want_to_read").length;

  const ratedBooks = allBooks.filter((b) => b.rating != null);
  const averageRating =
    ratedBooks.length > 0
      ? ratedBooks.reduce((sum, b) => sum + (b.rating ?? 0), 0) / ratedBooks.length
      : null;

  const totalPages = allBooks.reduce((sum, b) => sum + (b.pageCount ?? 0), 0);
  const pagesReadTotal = allBooks
    .filter((b) => b.status === "read")
    .reduce((sum, b) => sum + (b.pageCount ?? 0), 0);

  const booksWithPages = allBooks.filter((b) => b.pageCount != null && b.pageCount > 0);
  const avgPagesPerBook =
    booksWithPages.length > 0
      ? Math.round(booksWithPages.reduce((sum, b) => sum + (b.pageCount ?? 0), 0) / booksWithPages.length)
      : 0;

  const genreMap = new Map<string, number>();
  allBooks.forEach((b) => b.genres.forEach((g) => genreMap.set(g, (genreMap.get(g) ?? 0) + 1)));
  const genreBreakdown = Array.from(genreMap.entries())
    .map(([genre, count]) => ({ genre, count }))
    .sort((a, b) => b.count - a.count);

  const authorMap = new Map<string, number>();
  allBooks.forEach((b) => authorMap.set(b.author, (authorMap.get(b.author) ?? 0) + 1));
  const topAuthors = Array.from(authorMap.entries())
    .map(([author, count]) => ({ author, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const now = new Date();
  const monthLabels: { key: string; label: string }[] = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = d.toLocaleString("default", { month: "short", year: "2-digit" });
    monthLabels.push({ key, label });
  }
  const monthMap = new Map<string, number>(monthLabels.map((m) => [m.key, 0]));
  allBooks.forEach((b) => {
    const d = new Date(b.createdAt);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    if (monthMap.has(key)) monthMap.set(key, (monthMap.get(key) ?? 0) + 1);
  });
  const booksPerMonth = monthLabels.map(({ key, label }) => ({ month: label, count: monthMap.get(key) ?? 0 }));

  const ratingMap = new Map<number, number>([[1, 0], [2, 0], [3, 0], [4, 0], [5, 0]]);
  allBooks.forEach((b) => {
    if (b.rating != null && b.rating >= 1 && b.rating <= 5) {
      ratingMap.set(b.rating, (ratingMap.get(b.rating) ?? 0) + 1);
    }
  });
  const ratingDistribution = Array.from(ratingMap.entries())
    .map(([rating, count]) => ({ rating, count }))
    .sort((a, b) => a.rating - b.rating);

  const langMap = new Map<string, number>();
  allBooks.forEach((b) => langMap.set(b.language, (langMap.get(b.language) ?? 0) + 1));
  const languageBreakdown = Array.from(langMap.entries()).map(([language, count]) => ({ language, count }));

  const fmtMap = new Map<string, number>([["physical", 0], ["pdf", 0], ["unspecified", 0]]);
  allBooks.forEach((b) => {
    const key = b.format ?? "unspecified";
    fmtMap.set(key, (fmtMap.get(key) ?? 0) + 1);
  });
  const formatBreakdown = Array.from(fmtMap.entries())
    .map(([format, count]) => ({ format, count }))
    .filter((f) => f.count > 0);

  res.json(
    GetStatsResponse.parse({
      totalBooks, booksRead, booksReading, booksWantToRead, averageRating,
      totalPages, genreBreakdown, topAuthors, booksPerMonth, ratingDistribution,
      languageBreakdown, formatBreakdown, pagesReadTotal, avgPagesPerBook,
    })
  );
});

router.get("/admin/books", adminMiddleware, async (req, res): Promise<void> => {
  const targetUserId = req.query.userId ? parseInt(req.query.userId as string, 10) : null;
  const where = targetUserId ? eq(booksTable.userId, targetUserId) : undefined;
  const books = where
    ? await db.select().from(booksTable).where(where).orderBy(desc(booksTable.createdAt))
    : await db.select().from(booksTable).orderBy(desc(booksTable.createdAt));
  res.json(ListBooksResponse.parse(books));
});

export default router;
