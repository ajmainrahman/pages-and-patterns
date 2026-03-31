import { Link } from "wouter";
import { Book, Plus, ArrowRight, Library as LibraryIcon, BookOpen, Star, Sparkles } from "lucide-react";
import { useGetStats, useListRecentBooks, useListFavoriteBooks } from "@workspace/api-client-react";
import { BookCard, BookGridSkeleton } from "@/components/book-card";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useGetStats();
  const { data: recentBooks, isLoading: recentLoading } = useListRecentBooks({ limit: 4 });
  const { data: favoriteBooks, isLoading: favoritesLoading } = useListFavoriteBooks();

  return (
    <div className="space-y-16">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ duration: 0.6 }}
        className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b pb-8"
      >
        <div>
          <h1 className="text-4xl md:text-5xl font-serif text-foreground mb-3 font-medium tracking-tight">
            Welcome to your library.
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

      {/* Stats Row */}
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

      {/* Favorites Highlights (Only show if there are favorites) */}
      {!favoritesLoading && favoriteBooks && favoriteBooks.length > 0 && (
        <section>
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-accent" />
              <h2 className="text-2xl md:text-3xl font-serif font-medium tracking-tight">Favorites</h2>
            </div>
            <Button variant="ghost" asChild className="text-muted-foreground hover:text-primary">
              <Link href="/library?favorite=true" className="flex items-center gap-1">
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

      {/* Recent Books */}
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

function StatCard({ title, value, icon, loading }: { title: string, value?: number | string, icon: React.ReactNode, loading: boolean }) {
  return (
    <div className="bg-card border border-border/50 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
      <div className="absolute -right-4 -top-4 opacity-5 group-hover:opacity-10 transition-opacity transform group-hover:scale-110 duration-500">
        {icon}
      </div>
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
