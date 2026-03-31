import { pgTable, text, serial, timestamp, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const booksTable = pgTable("books", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  author: text("author").notNull(),
  genres: text("genres").array().notNull().default([]),
  summary: text("summary"),
  quotes: text("quotes").array().notNull().default([]),
  review: text("review"),
  rating: integer("rating"),
  status: text("status", { enum: ["read", "reading", "want_to_read"] }).notNull().default("want_to_read"),
  language: text("language", { enum: ["english", "bengali"] }).notNull().default("english"),
  coverUrl: text("cover_url"),
  publishedYear: integer("published_year"),
  pageCount: integer("page_count"),
  currentPage: integer("current_page"),
  readingDeadline: text("reading_deadline"),
  isFavorite: boolean("is_favorite").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertBookSchema = createInsertSchema(booksTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertBook = z.infer<typeof insertBookSchema>;
export type Book = typeof booksTable.$inferSelect;
