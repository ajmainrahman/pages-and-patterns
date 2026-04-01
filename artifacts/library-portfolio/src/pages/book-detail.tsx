import { useRoute, Link, useLocation } from "wouter";
import { useState } from "react";
import {
  useGetBook,
  useDeleteBook,
  useUpdateBook,
  getGetBookQueryKey,
  getListBooksQueryKey,
  getListRecentBooksQueryKey,
  getListFavoriteBooksQueryKey,
  getGetStatsQueryKey,
} from "@workspace/api-client-react";
import { StatusBadge } from "@/components/status-badge";
import { StarRating } from "@/components/star-rating";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Trash2, Calendar, BookOpen, Clock, Heart, Quote, Target, Flag, CheckCircle2, Pencil, Home, ShoppingCart, FileText } from "lucide-react";
import { motion } from "framer-motion";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { format, differenceInDays, parseISO, isValid } from "date-fns";

function ReadingProgress({ currentPage, pageCount, onUpdate }: {
  currentPage: number | null | undefined;
  pageCount: number | null | undefined;
  onUpdate: (page: number) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [inputVal, setInputVal] = useState(String(currentPage ?? ""));

  const progress = (pageCount && currentPage) ? Math.min(100, Math.round((currentPage / pageCount) * 100)) : 0;

  const handleSave = () => {
    const p = parseInt(inputVal, 10);
    if (!isNaN(p) && p >= 0) onUpdate(p);
    setEditing(false);
  };

  return (
    <div className="bg-card border rounded-2xl p-6 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
          <BookOpen className="w-3.5 h-3.5" /> Reading Progress
        </h4>
        {!editing && (
          <button onClick={() => { setInputVal(String(currentPage ?? "")); setEditing(true); }}
            className="text-muted-foreground hover:text-primary transition-colors">
            <Pencil className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
      <div className="flex items-end gap-2">
        {editing ? (
          <div className="flex items-center gap-2 w-full">
            <Input type="number" value={inputVal} min={0} max={pageCount ?? undefined}
              onChange={e => setInputVal(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") handleSave(); if (e.key === "Escape") setEditing(false); }}
              className="h-8 w-24 text-sm" autoFocus />
            {pageCount && <span className="text-sm text-muted-foreground">/ {pageCount} pages</span>}
            <Button size="sm" className="h-8 ml-auto" onClick={handleSave}>Save</Button>
            <Button size="sm" variant="ghost" className="h-8" onClick={() => setEditing(false)}>Cancel</Button>
          </div>
        ) : (
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl font-bold font-serif text-foreground">{currentPage ?? 0}</span>
            {pageCount && <span className="text-muted-foreground text-sm">/ {pageCount} pages</span>}
          </div>
        )}
      </div>
      {pageCount && pageCount > 0 && (
        <>
          <div className="relative w-full h-2.5 bg-secondary rounded-full overflow-hidden">
            <motion.div initial={{ width: 0 }} animate={{ width: `${progress}%` }} transition={{ duration: 0.8, ease: "easeOut" }}
              className="absolute inset-y-0 left-0 bg-primary rounded-full" />
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{progress}% complete</span>
            <span>{Math.max(0, pageCount - (currentPage ?? 0))} pages left</span>
          </div>
        </>
      )}
    </div>
  );
}

function DeadlineTracker({ deadline, currentPage, pageCount, onUpdate }: {
  deadline: string | null | undefined;
  currentPage: number | null | undefined;
  pageCount: number | null | undefined;
  onUpdate: (deadline: string | null) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [inputVal, setInputVal] = useState(deadline ?? "");

  const today = new Date(); today.setHours(0, 0, 0, 0);
  const deadlineDate = deadline ? parseISO(deadline) : null;
  const isValidDeadline = deadlineDate && isValid(deadlineDate);
  const daysLeft = isValidDeadline ? differenceInDays(deadlineDate, today) : null;
  const pagesLeft = pageCount && currentPage != null ? Math.max(0, pageCount - currentPage) : null;
  const dailyTarget = (daysLeft != null && daysLeft > 0 && pagesLeft != null) ? Math.ceil(pagesLeft / daysLeft) : null;
  const isOverdue = daysLeft != null && daysLeft < 0;
  const isDoneToday = daysLeft === 0;

  const handleSave = () => { onUpdate(inputVal || null); setEditing(false); };
  const handleClear = () => { onUpdate(null); setInputVal(""); setEditing(false); };

  return (
    <div className="bg-card border rounded-2xl p-6 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
          <Target className="w-3.5 h-3.5" /> Reading Deadline
        </h4>
        {!editing && (
          <button onClick={() => { setInputVal(deadline ?? ""); setEditing(true); }}
            className="text-muted-foreground hover:text-primary transition-colors">
            <Pencil className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
      {editing ? (
        <div className="space-y-3">
          <Input type="date" value={inputVal} min={format(today, "yyyy-MM-dd")}
            onChange={e => setInputVal(e.target.value)} className="h-8 text-sm" autoFocus />
          <div className="flex gap-2">
            <Button size="sm" className="h-8 flex-1" onClick={handleSave}>Set Deadline</Button>
            {deadline && <Button size="sm" variant="outline" className="h-8" onClick={handleClear}>Clear</Button>}
            <Button size="sm" variant="ghost" className="h-8" onClick={() => setEditing(false)}>Cancel</Button>
          </div>
        </div>
      ) : !isValidDeadline ? (
        <button onClick={() => setEditing(true)}
          className="w-full border-2 border-dashed border-border rounded-xl py-4 text-sm text-muted-foreground hover:border-primary/40 hover:text-primary transition-colors flex items-center justify-center gap-2">
          <Flag className="w-4 h-4" /> Set a reading deadline
        </button>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center gap-3 text-sm">
            <Calendar className="w-4 h-4 text-muted-foreground shrink-0" />
            <span className="font-medium">{format(deadlineDate!, "MMMM d, yyyy")}</span>
          </div>
          {isOverdue ? (
            <div className="bg-destructive/10 text-destructive rounded-xl p-4 text-sm font-medium flex items-center gap-2">
              <Clock className="w-4 h-4" /> Overdue by {Math.abs(daysLeft!)} {Math.abs(daysLeft!) === 1 ? "day" : "days"}
            </div>
          ) : isDoneToday ? (
            <div className="bg-amber-500/10 text-amber-600 rounded-xl p-4 text-sm font-medium flex items-center gap-2">
              <Flag className="w-4 h-4" /> Deadline is today!
            </div>
          ) : (
            <div className="bg-primary/5 rounded-xl p-4 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Days remaining</span>
                <span className="font-bold text-foreground text-xl">{daysLeft}</span>
              </div>
              {dailyTarget != null && pagesLeft != null && (
                <>
                  <div className="h-px bg-border" />
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Daily target</span>
                    <span className="font-semibold text-primary">{dailyTarget} pages/day</span>
                  </div>
                  {pagesLeft === 0 && (
                    <div className="flex items-center gap-2 text-sm text-green-600 font-medium pt-1">
                      <CheckCircle2 className="w-4 h-4" /> All pages read!
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function BookDetail() {
  const [, params] = useRoute("/books/:id");
  const id = parseInt(params?.id || "0", 10);
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: book, isLoading } = useGetBook(id, {
    query: { enabled: !!id, queryKey: getGetBookQueryKey(id) },
  });

  const deleteMutation = useDeleteBook();
  const updateMutation = useUpdateBook();

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: getGetBookQueryKey(id) });
    queryClient.invalidateQueries({ queryKey: getListBooksQueryKey() });
  };

  const handleDelete = () => {
    if (window.confirm(`Are you sure you want to remove "${book?.title}" from your library?`)) {
      deleteMutation.mutate({ id }, {
        onSuccess: () => {
          toast({ title: "Book removed from library" });
          queryClient.invalidateQueries({ queryKey: getListBooksQueryKey() });
          queryClient.invalidateQueries({ queryKey: getListRecentBooksQueryKey() });
          queryClient.invalidateQueries({ queryKey: getListFavoriteBooksQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetStatsQueryKey() });
          setLocation("/library");
        },
      });
    }
  };

  const handleCurrentPageUpdate = (currentPage: number) => {
    updateMutation.mutate({ id, data: { currentPage } }, {
      onSuccess: () => { toast({ title: "Progress updated" }); invalidate(); },
    });
  };

  const handleDeadlineUpdate = (readingDeadline: string | null) => {
    updateMutation.mutate({ id, data: { readingDeadline } }, {
      onSuccess: () => { toast({ title: readingDeadline ? "Deadline set" : "Deadline cleared" }); invalidate(); },
    });
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
        <Button variant="link" onClick={() => setLocation("/library")} className="mt-4">Return to Library</Button>
      </div>
    );
  }

  const showProgress = book.status === "reading" || (book.currentPage != null && book.currentPage > 0);

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="max-w-5xl mx-auto pb-12">
      <div className="flex items-center justify-between mb-8">
        <Button variant="ghost" asChild className="text-muted-foreground hover:text-foreground -ml-4">
          <Link href="/library" className="flex items-center gap-2"><ArrowLeft className="w-4 h-4" /> Back to Library</Link>
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" asChild className="border-border hover:bg-secondary">
            <Link href={`/books/${id}/edit`} className="flex items-center gap-2"><Pencil className="w-4 h-4" /> Edit</Link>
          </Button>
          <Button variant="outline" className="text-destructive hover:bg-destructive/10 hover:text-destructive border-transparent"
            onClick={handleDelete} disabled={deleteMutation.isPending}>
            <Trash2 className="w-4 h-4 mr-2" /> Delete
          </Button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-8 md:gap-16">
        <div className="w-full md:w-1/3 shrink-0 space-y-4">
          <div className="relative aspect-[2/3] w-full rounded-2xl overflow-hidden shadow-xl bg-secondary flex items-center justify-center">
            {book.coverUrl ? (
              <img src={book.coverUrl} alt={book.title} className="w-full h-full object-cover" />
            ) : (
              <div className="text-7xl font-serif text-muted-foreground/30">{book.title.charAt(0).toUpperCase()}</div>
            )}
            {book.isFavorite && (
              <div className="absolute top-4 right-4 bg-background/90 backdrop-blur p-2 rounded-full shadow-lg">
                <Heart className="w-6 h-6 text-primary fill-primary" />
              </div>
            )}
          </div>

          <div className="bg-card border rounded-2xl p-6 space-y-4 shadow-sm">
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <Calendar className="w-4 h-4 shrink-0" /><span>Published {book.publishedYear || "Unknown"}</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <BookOpen className="w-4 h-4 shrink-0" /><span>{book.pageCount ? `${book.pageCount} pages` : "Unknown pages"}</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <Clock className="w-4 h-4 shrink-0" /><span>Added {format(new Date(book.createdAt), "MMM d, yyyy")}</span>
            </div>
            {book.format && (
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <FileText className="w-4 h-4 shrink-0" /><span>{book.format === "physical" ? "📚 Physical Copy" : "📄 PDF / Digital"}</span>
              </div>
            )}
            {book.isOwned && (
              <div className="flex items-center gap-3 text-sm text-emerald-600 font-medium">
                <Home className="w-4 h-4 shrink-0" /><span>In my home</span>
              </div>
            )}
            {book.wantToBuy && (
              <div className="flex items-center gap-3 text-sm text-amber-600 font-medium">
                <ShoppingCart className="w-4 h-4 shrink-0" /><span>Want to buy</span>
              </div>
            )}
          </div>

          {showProgress && (
            <ReadingProgress currentPage={book.currentPage} pageCount={book.pageCount} onUpdate={handleCurrentPageUpdate} />
          )}
          {(book.status === "reading" || book.readingDeadline) && (
            <DeadlineTracker deadline={book.readingDeadline} currentPage={book.currentPage} pageCount={book.pageCount} onUpdate={handleDeadlineUpdate} />
          )}
        </div>

        <div className="flex-1 min-w-0 pt-2">
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <StatusBadge status={book.status} />
            <div className="h-4 w-px bg-border"></div>
            <StarRating rating={book.rating} />
          </div>
          <h1 className={`text-4xl md:text-5xl font-bold text-foreground mb-2 leading-tight ${book.language === "bengali" ? "font-bengali" : "font-serif"}`}>
            {book.title}
          </h1>
          <p className={`text-xl md:text-2xl text-muted-foreground italic mb-8 ${book.language === "bengali" ? "font-bengali" : "font-serif"}`}>
            by {book.author}
          </p>
          <div className="flex flex-wrap gap-2 mb-10">
            {book.genres?.map((g) => (
              <span key={g} className="text-xs px-3 py-1 rounded-full bg-secondary text-secondary-foreground font-medium uppercase tracking-wider">{g}</span>
            ))}
          </div>

          <div className="space-y-12">
            {book.summary && (
              <section>
                <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-4">Synopsis</h3>
                <p className="text-lg leading-relaxed text-foreground/90 whitespace-pre-line">{book.summary}</p>
              </section>
            )}
            {book.review && (
              <section className="bg-primary/5 border border-primary/10 rounded-2xl p-6 md:p-8 relative">
                <div className="absolute top-0 right-8 -translate-y-1/2 bg-background px-4">
                  <h3 className="text-sm font-bold uppercase tracking-widest text-primary">Personal Review</h3>
                </div>
                <p className="text-lg leading-relaxed font-serif text-foreground/90 whitespace-pre-line">{book.review}</p>
              </section>
            )}
            {book.quotes && book.quotes.length > 0 && (
              <section>
                <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-6 flex items-center gap-2">
                  <Quote className="w-4 h-4" /> Notable Passages
                </h3>
                <div className="space-y-6">
                  {book.quotes.map((quote, i) => (
                    <motion.blockquote key={i}
                      initial={{ opacity: 0, x: -10 }} whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                      className="border-l-4 border-accent pl-6 py-2 text-xl font-serif italic text-foreground/80 leading-relaxed bg-gradient-to-r from-accent/5 to-transparent pr-4 rounded-r-xl">
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
