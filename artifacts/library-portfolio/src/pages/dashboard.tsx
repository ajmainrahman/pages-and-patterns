import { Link } from "wouter";
import {
  Book, Plus, ArrowRight, Library as LibraryIcon, BookOpen, Star, Sparkles, Clock, Target, FileText,
} from "lucide-react";
import {
  useGetStats,
  useListRecentBooks,
  useListFavoriteBooks,
  useListBooks,
} from "@workspace/api-client-react";
import { Book as BookType } from "@workspace/api-client-react/src/generated/api.schemas";
import { BookCard, BookGridSkeleton } from "@/components/book-card";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/use-auth";

function daysUntil(dateStr: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr);
  target.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function ReadingProgressCard({ book, index }: { book: BookType; index: number }) {
  const pct =
    book.pageCount && book.pageCount > 0 && book.currentPage != null
      ? Math.min(100, Math.round((book.currentPage / book.pageCount) * 100))
      : null;
  const pagesLeft =
    book.pageCount && book.currentPage != null ? book.pageCount - book.currentPage : null;
  const days = book.readingDeadline ? daysUntil(book.readingDeadline) : null;
  const dailyTarget =
    days != null && days > 0 && pagesLeft != null ? Math.ceil(pagesLeft / days) : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.07 }}
    >
      <Link href={`/books/${book.id}`} className="block group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-2xl">
        <div className="bg-card border border-border/50 hover:border-primary/30 rounded-2xl p-5 hover:shadow-md transition-all duration-300 hover:-translate-y-0.5">
          <div className="flex gap-4">
            <div className="shrink-0 w-14 h-20 rounded-lg overflow-hidden bg-secondary flex items-center justify-center shadow-sm">
              {book.coverUrl ? (
                <img src={book.coverUrl} alt={book.title} className="w-full h-full object-cover" />
              ) : (
                <span className="text-2xl font-serif text-muted-foreground/40">
                  {book.title.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            <div className="flex-1 min-w-0 space-y-2">
              <div>
                <h3 className={`font-semibold leading-tight line-clamp-1 group-hover:text-primary transition-colors ${book.language === "bengali" ? "font-bengali" : "font-serif"}`}>
                  {book.title}
                </h3>
                <p className={`text-sm text-muted-foreground line-clamp-1 ${book.language === "bengali" ? "font-bengali" : ""}`}>
                  {book.author}
                </p>
              </div>
              {pct !== null ? (
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <FileText className="w-3 h-3" />
                      {book.currentPage} / {book.pageCount} pages
                    </span>
                    <span className="font-semibold text-primary">{pct}%</span>
                  </div>
                  <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-primary rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.8, delay: 0.3 + index * 0.1, ease: "easeOut" }}
                    />
                  </div>
                </div>
              ) : (
                <div className="w-full h-2 bg-secondary rounded-full" />
              )}
              <div className="flex flex-wrap gap-3 text-xs">
                {pagesLeft !== null && (
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <BookOpen className="w-3 h-3" />
                    <strong className="text-foreground">{pagesLeft}</strong> pages left
                  </span>
                )}
                {days !== null && (
                  <span className={`flex items-center gap-1 ${days < 0 ? "text-red-500" : days <= 3 ? "text-amber-500" : "text-muted-foreground"}`}>
                    <Clock className="w-3 h-3" />
                    {days < 0
                      ? `${Math.abs(days)} days overdue`
                      : days === 0
                      ? "Due today!"
                      : `${days} days left`}
                  </span>
                )}
                {dailyTarget !== null && days !== null && days > 0 && (
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <Target className="w-3 h-3" />
                    <strong className="text-foreground">{dailyTarget}</strong> pages/day
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const { data: stats, isLoading: statsLoading } = useGetStats();
  const { data: recentBooks, isLoading: recentLoading } = useListRecentBooks({ limit: 4 });
  const { data: favoriteBooks, isLoading: favoritesLoading } = useListFavoriteBooks();
  const { data: readingBooks, isLoading: readingLoading } = useListBooks({ status: "reading" });

  const currentlyReading = readingBooks?.slice(0, 3) ?? [];
  const displayName = user?.name || user?.email?.split("@")[0] || "Reader";

  return (
    <div className="space-y-16">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b pb-8"
      >
        <div>
          <h1 className="text-4xl md:text-5xl font-serif text-foreground mb-3 font-medium tracking-tight">
            Welcome to {displayName}'s library.
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground font-light max-w-2xl">
            A quiet space for your reading life. Curate your collection, record your thoughts, and track your journey.
          </p>
        </div>
        <Button asChild size="lg" className="shrink-0 rounded-full px-8 shadow-md">
          <Link href="/add" className="flex items-center gap-2">
            <Plus className="w-5 h-5" /> Add a Book
          </Link>
        </Button>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.1 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6"
      >
        <StatCard title="Total Books" value={stats?.totalBooks} icon={<LibraryIcon className="w-5 h-5 text-primary/60" />} loading={statsLoading} />
        <StatCard title="Read" value={stats?.booksRead} icon={<Book className="w-5 h-5 text-[#35634f]/60" />} loading={statsLoading} />
        <StatCard title="Reading" value={stats?.booksReading} icon={<BookOpen className="w-5 h-5 text-[#f5a623]/60" />} loading={statsLoading} />
        <StatCard title="Avg Rating" value={stats?.averageRating ? stats.averageRating.toFixed(1) : "-"} icon={<Star className="w-5 h-5 text-accent" />} loading={statsLoading} />
      </motion.div>

      {!readingLoading && currentlyReading.length > 0 && (
        <section>
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-amber-500" />
                <h2 className="text-2xl md:text-3xl font-serif font-medium tracking-tight">Currently Reading</h2>
                {currentlyReading.length > 1 && (
                  <span className="text-sm text-muted-foreground bg-secondary px-2.5 py-0.5 rounded-full font-medium">
                    {currentlyReading.length} books
                  </span>
                )}
              </div>
              <Button variant="ghost" asChild className="text-muted-foreground hover:text-primary">
                <Link href="/library" className="flex items-center gap-1">
                  View all <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
            </div>
            <div className={`grid gap-4 ${currentlyReading.length === 1 ? "grid-cols-1 max-w-lg" : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"}`}>
              {currentlyReading.map((book, i) => (
                <ReadingProgressCard key={book.id} book={book} index={i} />
              ))}
            </div>
          </motion.div>
        </section>
      )}

      {!favoritesLoading && favoriteBooks && favoriteBooks.length > 0 && (
        <section>
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-accent" />
              <h2 className="text-2xl md:text-3xl font-serif font-medium tracking-tight">Favorites</h2>
            </div>
            <Button variant="ghost" asChild className="text-muted-foreground hover:text-primary">
              <Link href="/library" className="flex items-center gap-1">
                View all <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {favoriteBooks.slice(0, 4).map((book, i) => (
              <BookCard key={book.id} book={book} index={i} />
            ))}
          </div>
        </section>
      )}

      <section>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl md:text-3xl font-serif font-medium tracking-tight">Recently Added</h2>
          <Button variant="ghost" asChild className="text-muted-foreground hover:text-primary">
            <Link href="/library" className="flex items-center gap-1">
              View library <ArrowRight className="w-4 h-4" />
            </Link>
          </Button>
        </div>
        {recentLoading ? (
          <BookGridSkeleton count={4} />
        ) : recentBooks?.length ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {recentBooks.map((book, i) => (
              <BookCard key={book.id} book={book} index={i} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-secondary/50 rounded-2xl border border-dashed border-border">
            <LibraryIcon className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <p className="text-lg text-foreground font-serif mb-2">Your library awaits its first book.</p>
            <p className="text-muted-foreground mb-6">Start building your collection today.</p>
            <Button asChild variant="default" className="rounded-full shadow-sm">
              <Link href="/add">Add Your First Book</Link>
            </Button>
          </div>
        )}
      </section>
    </div>
  );
}

function StatCard({ title, value, icon, loading }: { title: string; value?: number | string; icon: React.ReactNode; loading: boolean }) {
  return (
    <div className="bg-card border border-border/50 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
      <div className="flex justify-between items-start mb-4 relative z-10">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">{title}</h3>
        {icon}
      </div>
      <div className="relative z-10">
        {loading ? (
          <div className="h-10 w-16 bg-secondary animate-pulse rounded" />
        ) : (
          <p className="text-4xl font-serif font-semibold text-foreground">{value}</p>
        )}
      </div>
    </div>
  );
}
