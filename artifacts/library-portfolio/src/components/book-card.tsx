import { Link } from "wouter";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "./status-badge";
import { StarRating } from "./star-rating";
import { Book } from "@workspace/api-client-react/src/generated/api.schemas";

export function BookCard({ book, index = 0, bengali = false }: { book: Book, index?: number, bengali?: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.05, ease: "easeOut" }}
      className="h-full"
    >
      <Link href={`/books/${book.id}`} className="block group h-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-xl">
        <Card className="h-full overflow-hidden transition-all duration-400 hover:shadow-lg hover:-translate-y-1.5 border-border/50 hover:border-primary/20 bg-card">
          <CardContent className="p-0 flex flex-col h-full">
            <div className="relative aspect-[2/3] w-full bg-secondary overflow-hidden flex items-center justify-center">
              {book.coverUrl ? (
                <img 
                  src={book.coverUrl} 
                  alt={`Cover of ${book.title}`} 
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
                  loading="lazy"
                />
              ) : (
                <div className="w-full h-full bg-secondary flex items-center justify-center text-5xl font-serif text-muted-foreground/30">
                  {book.title.charAt(0).toUpperCase()}
                </div>
              )}
              {/* Overlay Gradient for contrast */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              
              {book.isFavorite && (
                <div className="absolute top-3 right-3 bg-background/95 backdrop-blur-md p-2 rounded-full shadow-sm z-10">
                  <svg className="w-4 h-4 text-primary fill-primary" viewBox="0 0 24 24">
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                  </svg>
                </div>
              )}
            </div>
            
            <div className="p-4 flex flex-col flex-grow bg-card z-10 relative">
              <div className="flex justify-between items-center gap-2 mb-2">
                <StatusBadge status={book.status} className="text-[10px] px-1.5 py-0" />
                <StarRating rating={book.rating} />
              </div>
              <h3 className={`font-bold text-lg leading-snug mb-1 line-clamp-2 group-hover:text-primary transition-colors ${bengali || book.language === 'bengali' ? 'font-bengali' : 'font-serif'}`}>{book.title}</h3>
              <p className={`text-sm text-muted-foreground mb-4 line-clamp-1 ${bengali || book.language === 'bengali' ? 'font-bengali' : ''}`}>{book.author}</p>
              
              <div className="mt-auto space-y-2">
                <div className="flex flex-wrap gap-1.5">
                  {book.genres?.slice(0, 2).map(g => (
                    <span key={g} className="text-[10px] px-2 py-0.5 rounded-md bg-secondary text-secondary-foreground font-medium tracking-wide uppercase">
                      {g}
                    </span>
                  ))}
                  {(book.genres?.length ?? 0) > 2 && (
                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-secondary text-secondary-foreground font-medium">
                      +{(book.genres?.length ?? 0) - 2}
                    </span>
                  )}
                </div>

                {book.status === "reading" && book.pageCount && book.pageCount > 0 && book.currentPage != null && (
                  <div className="space-y-1 pt-1">
                    <div className="flex justify-between text-[10px] text-muted-foreground">
                      <span>p. {book.currentPage} / {book.pageCount}</span>
                      <span>{Math.round((book.currentPage / book.pageCount) * 100)}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-secondary rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, Math.round((book.currentPage / book.pageCount) * 100))}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </Link>
    </motion.div>
  );
}

export function BookGridSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="space-y-3 animate-pulse">
          <div className="w-full aspect-[2/3] rounded-xl bg-secondary" />
          <div className="h-5 bg-secondary rounded w-3/4" />
          <div className="h-4 bg-secondary rounded w-1/2" />
        </div>
      ))}
    </div>
  );
}
