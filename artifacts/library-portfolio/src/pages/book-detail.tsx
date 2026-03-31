import { useRoute, Link, useLocation } from "wouter";
import { 
  useGetBook, 
  useDeleteBook, 
  getGetBookQueryKey,
  getListBooksQueryKey, 
  getListRecentBooksQueryKey, 
  getListFavoriteBooksQueryKey,
  getGetStatsQueryKey
} from "@workspace/api-client-react";
import { StatusBadge } from "@/components/status-badge";
import { StarRating } from "@/components/star-rating";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Trash2, Calendar, BookOpen, Clock, Heart, Quote } from "lucide-react";
import { motion } from "framer-motion";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

export default function BookDetail() {
  const [, params] = useRoute("/books/:id");
  const id = parseInt(params?.id || "0", 10);
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: book, isLoading } = useGetBook(id, { 
    query: { enabled: !!id, queryKey: getGetBookQueryKey(id) } 
  });

  const deleteMutation = useDeleteBook();

  const handleDelete = async () => {
    if (window.confirm(`Are you sure you want to remove "${book?.title}" from your library?`)) {
      deleteMutation.mutate({ id }, {
        onSuccess: () => {
          toast({ title: "Book removed from library" });
          queryClient.invalidateQueries({ queryKey: getListBooksQueryKey() });
          queryClient.invalidateQueries({ queryKey: getListRecentBooksQueryKey() });
          queryClient.invalidateQueries({ queryKey: getListFavoriteBooksQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetStatsQueryKey() });
          setLocation("/library");
        }
      });
    }
  };

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-8 max-w-4xl mx-auto">
        <div className="h-8 w-24 bg-secondary rounded" />
        <div className="flex flex-col md:flex-row gap-8 md:gap-12">
          <div className="w-full md:w-1/3 aspect-[2/3] bg-secondary rounded-xl" />
          <div className="flex-1 space-y-4">
            <div className="h-10 w-3/4 bg-secondary rounded" />
            <div className="h-6 w-1/2 bg-secondary rounded" />
            <div className="h-24 w-full bg-secondary rounded mt-8" />
          </div>
        </div>
      </div>
    );
  }

  if (!book) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-serif">Book not found</h2>
        <Button variant="link" onClick={() => setLocation("/library")} className="mt-4">
          Return to Library
        </Button>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }} 
      transition={{ duration: 0.5 }}
      className="max-w-5xl mx-auto pb-12"
    >
      <div className="flex items-center justify-between mb-8">
        <Button variant="ghost" asChild className="text-muted-foreground hover:text-foreground -ml-4">
          <Link href="/library" className="flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" /> Back to Library
          </Link>
        </Button>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            className="text-destructive hover:bg-destructive/10 hover:text-destructive border-transparent"
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
          >
            <Trash2 className="w-4 h-4 mr-2" /> Delete
          </Button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-8 md:gap-16">
        {/* Left Column: Cover & Meta */}
        <div className="w-full md:w-1/3 shrink-0 space-y-6">
          <div className="relative aspect-[2/3] w-full rounded-2xl overflow-hidden shadow-xl bg-secondary flex items-center justify-center">
            {book.coverUrl ? (
              <img src={book.coverUrl} alt={book.title} className="w-full h-full object-cover" />
            ) : (
              <div className="text-7xl font-serif text-muted-foreground/30">
                {book.title.charAt(0).toUpperCase()}
              </div>
            )}
            {book.isFavorite && (
              <div className="absolute top-4 right-4 bg-background/90 backdrop-blur p-2 rounded-full shadow-lg">
                <Heart className="w-6 h-6 text-primary fill-primary" />
              </div>
            )}
          </div>
          
          <div className="bg-card border rounded-2xl p-6 space-y-4 shadow-sm">
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <Calendar className="w-4 h-4" />
              <span>Published {book.publishedYear || "Unknown"}</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <BookOpen className="w-4 h-4" />
              <span>{book.pageCount ? `${book.pageCount} pages` : "Unknown pages"}</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <Clock className="w-4 h-4" />
              <span>Added {format(new Date(book.createdAt), 'MMM d, yyyy')}</span>
            </div>
          </div>
        </div>

        {/* Right Column: Content */}
        <div className="flex-1 min-w-0 pt-2">
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <StatusBadge status={book.status} />
            <div className="h-4 w-px bg-border"></div>
            <StarRating rating={book.rating} />
          </div>
          
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-foreground mb-2 leading-tight">
            {book.title}
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground font-serif italic mb-8">
            by {book.author}
          </p>
          
          <div className="flex flex-wrap gap-2 mb-10">
            {book.genres?.map(g => (
              <span key={g} className="text-xs px-3 py-1 rounded-full bg-secondary text-secondary-foreground font-medium uppercase tracking-wider">
                {g}
              </span>
            ))}
          </div>

          <div className="space-y-12">
            {book.summary && (
              <section>
                <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-4">Synopsis</h3>
                <p className="text-lg leading-relaxed text-foreground/90 whitespace-pre-line">
                  {book.summary}
                </p>
              </section>
            )}

            {book.review && (
              <section className="bg-primary/5 border border-primary/10 rounded-2xl p-6 md:p-8 relative">
                <div className="absolute top-0 right-8 -translate-y-1/2 bg-background px-4">
                  <h3 className="text-sm font-bold uppercase tracking-widest text-primary">Personal Review</h3>
                </div>
                <p className="text-lg leading-relaxed font-serif text-foreground/90 whitespace-pre-line">
                  {book.review}
                </p>
              </section>
            )}

            {book.quotes && book.quotes.length > 0 && (
              <section>
                <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-6 flex items-center gap-2">
                  <Quote className="w-4 h-4" /> Notable Passages
                </h3>
                <div className="space-y-6">
                  {book.quotes.map((quote, i) => (
                    <motion.blockquote 
                      initial={{ opacity: 0, x: -10 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.1 }}
                      key={i} 
                      className="border-l-4 border-accent pl-6 py-2 text-xl font-serif italic text-foreground/80 leading-relaxed bg-gradient-to-r from-accent/5 to-transparent pr-4 rounded-r-xl"
                    >
                      "{quote}"
                    </motion.blockquote>
                  ))}
                </div>
              </section>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
