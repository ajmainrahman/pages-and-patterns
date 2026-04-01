import { useState, useEffect, useMemo } from "react";
import {
  Book,
  getBooks,
  createBook as storeCreate,
  updateBook as storeUpdate,
  deleteBook as storeDelete,
  computeStats,
} from "./store";

function useBooksStore(): Book[] {
  const [books, setBooks] = useState<Book[]>(() => getBooks());
  useEffect(() => {
    const handler = () => setBooks(getBooks());
    window.addEventListener("books-updated", handler);
    return () => window.removeEventListener("books-updated", handler);
  }, []);
  return books;
}

function useMutation<TArgs, TResult = void>(fn: (args: TArgs) => TResult) {
  const [isPending, setIsPending] = useState(false);
  const mutate = (
    args: TArgs,
    options?: { onSuccess?: (result: TResult) => void; onError?: (err: Error) => void }
  ) => {
    setIsPending(true);
    try {
      const result = fn(args);
      options?.onSuccess?.(result);
    } catch (err) {
      options?.onError?.(err as Error);
    } finally {
      setIsPending(false);
    }
  };
  return { mutate, isPending };
}

export function useListBooks(params?: {
  status?: string;
  search?: string;
  genre?: string;
  language?: string;
  favorite?: boolean;
}) {
  const books = useBooksStore();
  const data = useMemo(() => {
    let result = [...books];
    if (params?.status) result = result.filter((b) => b.status === params.status);
    if (params?.search) {
      const q = params.search.toLowerCase();
      result = result.filter(
        (b) => b.title.toLowerCase().includes(q) || b.author.toLowerCase().includes(q)
      );
    }
    if (params?.genre) result = result.filter((b) => b.genres?.includes(params.genre!));
    if (params?.language) result = result.filter((b) => b.language === params.language);
    if (params?.favorite) result = result.filter((b) => b.isFavorite);
    return result.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [books, params?.status, params?.search, params?.genre, params?.language, params?.favorite]);
  return { data, isLoading: false };
}

export function useGetBook(id: number, options?: { query?: { enabled?: boolean } }) {
  const books = useBooksStore();
  const enabled = options?.query?.enabled ?? true;
  const data = enabled ? (books.find((b) => b.id === id) ?? null) : null;
  return { data, isLoading: false };
}

export function useGetStats() {
  const books = useBooksStore();
  const data = useMemo(() => computeStats(books), [books]);
  return { data, isLoading: false };
}

export function useListGenres() {
  const books = useBooksStore();
  const data = useMemo(() => {
    const genres = new Set<string>();
    for (const b of books) for (const g of b.genres ?? []) genres.add(g);
    return Array.from(genres).sort();
  }, [books]);
  return { data, isLoading: false };
}

export function useListRecentBooks(params?: { limit?: number }) {
  const books = useBooksStore();
  const data = useMemo(
    () =>
      [...books]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, params?.limit ?? 10),
    [books, params?.limit]
  );
  return { data, isLoading: false };
}

export function useListFavoriteBooks() {
  const books = useBooksStore();
  const data = useMemo(() => books.filter((b) => b.isFavorite), [books]);
  return { data, isLoading: false };
}

export function useListBengaliBooks() {
  const books = useBooksStore();
  const data = useMemo(() => books.filter((b) => b.language === "bengali"), [books]);
  return { data, isLoading: false };
}

export function useCreateBook() {
  return useMutation<{ data: Omit<Book, "id" | "createdAt"> }, Book>(({ data }) =>
    storeCreate(data)
  );
}

export function useUpdateBook() {
  return useMutation<{ id: number; data: Partial<Omit<Book, "id" | "createdAt">> }, Book>(
    ({ id, data }) => {
      const result = storeUpdate(id, data);
      if (!result) throw new Error("Book not found");
      return result;
    }
  );
}

export function useDeleteBook() {
  return useMutation<{ id: number }, void>(({ id }) => storeDelete(id));
}

export type { Book };
