import { Router, type IRouter } from "express";
import { eq, ilike, or, desc } from "drizzle-orm";
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

const router: IRouter = Router();

router.get("/books/bengali", async (_req, res): Promise<void> => {
  const books = await db
    .select()
    .from(booksTable)
    .where(eq(booksTable.language, "bengali"))
    .orderBy(desc(booksTable.createdAt));

  res.json(ListBengaliBooksResponse.parse(books));
});

router.get("/books/genres", async (_req, res): Promise<void> => {
  const rows = await db
    .select({ genres: booksTable.genres })
    .from(booksTable);

  const genreSet = new Set<string>();
  rows.forEach((r) => r.genres.forEach((g) => genreSet.add(g)));
  const genres = Array.from(genreSet).sort();

  res.json(ListGenresResponse.parse(genres));
});

router.get("/books/recent", async (req, res): Promise<void> => {
  const params = ListRecentBooksQueryParams.safeParse(req.query);
  const limit = params.success && params.data.limit ? params.data.limit : 5;

  const books = await db
    .select()
    .from(booksTable)
    .orderBy(desc(booksTable.createdAt))
    .limit(limit);

  res.json(ListRecentBooksResponse.parse(books));
});

router.get("/books/favorites", async (_req, res): Promise<void> => {
  const books = await db
    .select()
    .from(booksTable)
    .where(eq(booksTable.isFavorite, true))
    .orderBy(desc(booksTable.createdAt));

  res.json(ListFavoriteBooksResponse.parse(books));
});

router.get("/books", async (req, res): Promise<void> => {
  const params = ListBooksQueryParams.safeParse(req.query);

  const allBooks = await db
    .select()
    .from(booksTable)
    .orderBy(desc(booksTable.createdAt));

  let filtered = allBooks;

  if (params.success) {
    if (params.data.search) {
      const search = params.data.search.toLowerCase();
      filtered = filtered.filter(
        (b) =>
          b.title.toLowerCase().includes(search) ||
          b.author.toLowerCase().includes(search)
      );
    }
    if (params.data.status) {
      filtered = filtered.filter((b) => b.status === params.data.status);
    }
    if (params.data.genre) {
      const genre = params.data.genre.toLowerCase();
      filtered = filtered.filter((b) =>
        b.genres.some((g) => g.toLowerCase() === genre)
      );
    }
  }

  res.json(ListBooksResponse.parse(filtered));
});

router.post("/books", async (req, res): Promise<void> => {
  const parsed = CreateBookBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { title, author, ...rest } = parsed.data;
  const data = {
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
  const params = GetBookParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [book] = await db
    .select()
    .from(booksTable)
    .where(eq(booksTable.id, params.data.id));

  if (!book) {
    res.status(404).json({ error: "Book not found" });
    return;
  }

  res.json(GetBookResponse.parse(book));
});

router.patch("/books/:id", async (req, res): Promise<void> => {
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
    .where(eq(booksTable.id, params.data.id))
    .returning();

  if (!book) {
    res.status(404).json({ error: "Book not found" });
    return;
  }

  res.json(UpdateBookResponse.parse(book));
});

router.delete("/books/:id", async (req, res): Promise<void> => {
  const params = DeleteBookParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [book] = await db
    .delete(booksTable)
    .where(eq(booksTable.id, params.data.id))
    .returning();

  if (!book) {
    res.status(404).json({ error: "Book not found" });
    return;
  }

  res.sendStatus(204);
});

router.get("/stats", async (_req, res): Promise<void> => {
  const allBooks = await db.select().from(booksTable);

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

  // Pages read = sum of pageCount for "read" books
  const pagesReadTotal = allBooks
    .filter((b) => b.status === "read")
    .reduce((sum, b) => sum + (b.pageCount ?? 0), 0);

  // Average pages per book (only books with a pageCount)
  const booksWithPages = allBooks.filter((b) => b.pageCount != null && b.pageCount > 0);
  const avgPagesPerBook =
    booksWithPages.length > 0
      ? Math.round(booksWithPages.reduce((sum, b) => sum + (b.pageCount ?? 0), 0) / booksWithPages.length)
      : 0;

  // Genre breakdown
  const genreMap = new Map<string, number>();
  allBooks.forEach((b) => {
    b.genres.forEach((g) => {
      genreMap.set(g, (genreMap.get(g) ?? 0) + 1);
    });
  });
  const genreBreakdown = Array.from(genreMap.entries())
    .map(([genre, count]) => ({ genre, count }))
    .sort((a, b) => b.count - a.count);

  // Top authors
  const authorMap = new Map<string, number>();
  allBooks.forEach((b) => {
    authorMap.set(b.author, (authorMap.get(b.author) ?? 0) + 1);
  });
  const topAuthors = Array.from(authorMap.entries())
    .map(([author, count]) => ({ author, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // Books added per month — last 12 months
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
    if (monthMap.has(key)) {
      monthMap.set(key, (monthMap.get(key) ?? 0) + 1);
    }
  });
  const booksPerMonth = monthLabels.map(({ key, label }) => ({
    month: label,
    count: monthMap.get(key) ?? 0,
  }));

  // Rating distribution (1–5 stars)
  const ratingMap = new Map<number, number>([[1, 0], [2, 0], [3, 0], [4, 0], [5, 0]]);
  allBooks.forEach((b) => {
    if (b.rating != null && b.rating >= 1 && b.rating <= 5) {
      ratingMap.set(b.rating, (ratingMap.get(b.rating) ?? 0) + 1);
    }
  });
  const ratingDistribution = Array.from(ratingMap.entries())
    .map(([rating, count]) => ({ rating, count }))
    .sort((a, b) => a.rating - b.rating);

  // Language breakdown
  const langMap = new Map<string, number>();
  allBooks.forEach((b) => {
    langMap.set(b.language, (langMap.get(b.language) ?? 0) + 1);
  });
  const languageBreakdown = Array.from(langMap.entries()).map(([language, count]) => ({ language, count }));

  // Format breakdown
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
      totalBooks,
      booksRead,
      booksReading,
      booksWantToRead,
      averageRating,
      totalPages,
      genreBreakdown,
      topAuthors,
      booksPerMonth,
      ratingDistribution,
      languageBreakdown,
      formatBreakdown,
      pagesReadTotal,
      avgPagesPerBook,
    })
  );
});

export default router;
