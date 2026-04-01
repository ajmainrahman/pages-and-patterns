import { useState } from "react";
import {
  useListBooks,
  useListGenres,
  getListBooksQueryKey,
} from "@workspace/api-client-react";
import { BookCard, BookGridSkeleton } from "@/components/book-card";
import { Input } from "@/components/ui/input";
import { Search, SlidersHorizontal } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { motion } from "framer-motion";

export default function Library() {
  const [search, setSearch] = useState("");
  const [genre, setGenre] = useState<string>("all");
  const [status, setStatus] = useState<string>("all");

  const { data: genres } = useListGenres();

  const { data: books, isLoading } = useListBooks(
    {
      search: search || undefined,
      genre: genre !== "all" ? genre : undefined,
      status: status !== "all" ? (status as "read" | "reading" | "want_to_read") : undefined,
    },
    { query: { queryKey: getListBooksQueryKey({ search, genre, status }) } }
  );

  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-end justify-between gap-6"
      >
        <div>
          <h1 className="text-4xl font-serif mb-2 font-medium tracking-tight">Your Library</h1>
          <p className="text-muted-foreground font-light text-lg">Browse and filter your complete collection.</p>
        </div>
        <div className="text-sm font-medium text-muted-foreground bg-secondary/50 px-4 py-1.5 rounded-full">
          {isLoading ? "Loading..." : `${books?.length || 0} books`}
        </div>
      </motion.div>

      <div className="bg-card p-4 rounded-2xl border shadow-sm flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground/70" />
          <Input
            placeholder="Search by title or author..."
            className="pl-11 h-12 bg-background border-border/50 text-base rounded-xl"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex w-full md:w-auto gap-3">
          <div className="flex items-center gap-2 px-2 md:hidden">
            <SlidersHorizontal className="w-4 h-4 text-muted-foreground" />
          </div>
          <Select value={genre} onValueChange={setGenre}>
            <SelectTrigger className="w-full md:w-[180px] h-12 bg-background border-border/50 rounded-xl">
              <SelectValue placeholder="All Genres" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Genres</SelectItem>
              {genres?.map((g) => (
                <SelectItem key={g} value={g}>{g}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-full md:w-[180px] h-12 bg-background border-border/50 rounded-xl">
              <SelectValue placeholder="Any Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Any Status</SelectItem>
              <SelectItem value="read">Read</SelectItem>
              <SelectItem value="reading">Reading</SelectItem>
              <SelectItem value="want_to_read">Want to Read</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading ? (
        <BookGridSkeleton count={8} />
      ) : books?.length ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {books.map((book, i) => (
            <BookCard key={book.id} book={book} index={i} />
          ))}
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-24 bg-card rounded-2xl border border-dashed border-border shadow-sm"
        >
          <p className="text-xl font-serif text-foreground mb-2">No books found.</p>
          <p className="text-muted-foreground">Try adjusting your filters or search term.</p>
        </motion.div>
      )}
    </div>
  );
}
