export type BookStatus = "read" | "reading" | "want_to_read";
export type BookLanguage = "english" | "bengali";
export type BookFormat = "pdf" | "physical" | null;

export interface Book {
  id: number;
  title: string;
  author: string;
  genres: string[];
  status: BookStatus;
  language: BookLanguage;
  format: BookFormat;
  isOwned: boolean;
  wantToBuy: boolean;
  summary: string | null;
  review: string | null;
  rating: number | null;
  coverUrl: string | null;
  publishedYear: number | null;
  pageCount: number | null;
  currentPage: number | null;
  readingDeadline: string | null;
  isFavorite: boolean;
  quotes: string[];
  createdAt: string;
}

const STORAGE_KEY = "pages-and-patterns-books";

function notify() {
  window.dispatchEvent(new Event("books-updated"));
}

export function getBooks(): Book[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveBooks(books: Book[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(books));
  notify();
}

function nextId(books: Book[]): number {
  if (books.length === 0) return 1;
  return Math.max(...books.map((b) => b.id)) + 1;
}

export function createBook(data: Omit<Book, "id" | "createdAt">): Book {
  const books = getBooks();
  const book: Book = { ...data, id: nextId(books), createdAt: new Date().toISOString() };
  saveBooks([...books, book]);
  return book;
}

export function updateBook(id: number, data: Partial<Omit<Book, "id" | "createdAt">>): Book | null {
  const books = getBooks();
  const idx = books.findIndex((b) => b.id === id);
  if (idx === -1) return null;
  books[idx] = { ...books[idx], ...data };
  saveBooks(books);
  return books[idx];
}

export function deleteBook(id: number): void {
  saveBooks(getBooks().filter((b) => b.id !== id));
}

export function computeStats(books: Book[]) {
  const totalBooks = books.length;
  const booksRead = books.filter((b) => b.status === "read").length;
  const booksReading = books.filter((b) => b.status === "reading").length;
  const booksWantToRead = books.filter((b) => b.status === "want_to_read").length;

  const rated = books.filter((b) => b.rating != null);
  const averageRating = rated.length > 0
    ? rated.reduce((s, b) => s + (b.rating ?? 0), 0) / rated.length
    : null;

  const withPages = books.filter((b) => b.pageCount != null && b.status === "read");
  const pagesReadTotal = withPages.reduce((s, b) => s + (b.pageCount ?? 0), 0);
  const avgPagesPerBook = withPages.length > 0 ? Math.round(pagesReadTotal / withPages.length) : 0;

  const langMap = new Map<string, number>();
  for (const b of books) langMap.set(b.language, (langMap.get(b.language) ?? 0) + 1);
  const languageBreakdown = Array.from(langMap.entries()).map(([language, count]) => ({ language, count }));

  const fmtMap = new Map<string, number>();
  for (const b of books) {
    const f = b.format ?? "unspecified";
    fmtMap.set(f, (fmtMap.get(f) ?? 0) + 1);
  }
  const formatBreakdown = Array.from(fmtMap.entries()).map(([format, count]) => ({ format, count }));

  const ratingMap = new Map<number, number>();
  for (const b of books) {
    if (b.rating != null) ratingMap.set(b.rating, (ratingMap.get(b.rating) ?? 0) + 1);
  }
  const ratingDistribution = Array.from(ratingMap.entries())
    .map(([rating, count]) => ({ rating, count }))
    .sort((a, b) => a.rating - b.rating);

  const genreMap = new Map<string, number>();
  for (const b of books) for (const g of b.genres ?? []) genreMap.set(g, (genreMap.get(g) ?? 0) + 1);
  const genreBreakdown = Array.from(genreMap.entries())
    .map(([genre, count]) => ({ genre, count }))
    .sort((a, b) => b.count - a.count);

  const now = new Date();
  const booksPerMonth = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (11 - i), 1);
    const label = d.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
    const count = books.filter((b) => {
      const c = new Date(b.createdAt);
      return c.getFullYear() === d.getFullYear() && c.getMonth() === d.getMonth();
    }).length;
    return { month: label, count };
  });

  const authorMap = new Map<string, number>();
  for (const b of books) authorMap.set(b.author, (authorMap.get(b.author) ?? 0) + 1);
  const topAuthors = Array.from(authorMap.entries())
    .map(([author, count]) => ({ author, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  return {
    totalBooks, booksRead, booksReading, booksWantToRead,
    averageRating, pagesReadTotal, avgPagesPerBook,
    languageBreakdown, formatBreakdown, ratingDistribution,
    genreBreakdown, booksPerMonth, topAuthors,
  };
}
