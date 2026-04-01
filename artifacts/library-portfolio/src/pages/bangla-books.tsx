import { Link } from "wouter";
import { useListBengaliBooks } from "@workspace/api-client-react";
import { BookCard, BookGridSkeleton } from "@/components/book-card";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Plus, BookHeart } from "lucide-react";

export default function BanglaBooks() {
  const { data: books, isLoading } = useListBengaliBooks();

  const banglaTotal = books?.length ?? 0;

  return (
    <div className="space-y-10">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="border-b pb-8"
      >
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div>
            <h1 className="font-bengali text-4xl md:text-5xl font-bold text-foreground mb-2 tracking-wide leading-tight">
              বাংলা বইয়ের তাক
            </h1>
            <p className="font-bengali text-lg text-muted-foreground font-light leading-relaxed">
              আপনার প্রিয় বাংলা বইগুলির সংগ্রহ — লেখক, ধারা এবং আপনার ভাবনা সহ।
            </p>
            <p className="text-sm text-muted-foreground mt-2 font-sans italic">
              Your Bengali book collection — authors, genres, and your thoughts.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-sm font-medium text-muted-foreground bg-secondary/50 px-4 py-1.5 rounded-full font-bengali">
              {isLoading ? "..." : `${banglaTotal}টি বই`}
            </div>
            <Button asChild size="sm" className="rounded-full gap-2">
              <Link href="/add">
                <Plus className="w-4 h-4" />
                <span className="font-bengali">বই যোগ করুন</span>
              </Link>
            </Button>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="flex items-center gap-4"
      >
        <div className="h-px flex-1 bg-border" />
        <span className="font-bengali text-primary font-semibold text-sm px-3 py-1 rounded-full border border-primary/20 bg-primary/5">
          সংগ্রহ
        </span>
        <div className="h-px flex-1 bg-border" />
      </motion.div>

      {isLoading ? (
        <BookGridSkeleton count={6} />
      ) : books && books.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {books.map((book, i) => (
            <BookCard key={book.id} book={book} index={i} bengali />
          ))}
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-24 bg-card rounded-3xl border border-dashed border-border shadow-sm"
        >
          <BookHeart className="w-14 h-14 text-primary/30 mx-auto mb-6" />
          <p className="font-bengali text-2xl font-bold text-foreground mb-2">
            এখনো কোনো বাংলা বই নেই।
          </p>
          <p className="font-bengali text-muted-foreground text-lg mb-2">
            আপনার প্রথম বাংলা বইটি যোগ করুন।
          </p>
          <p className="text-sm text-muted-foreground italic mb-8">
            No Bengali books yet. Add your first one!
          </p>
          <Button asChild className="rounded-full px-8 shadow-md">
            <Link href="/add">
              <Plus className="w-4 h-4 mr-2" />
              <span className="font-bengali">বই যোগ করুন</span>
            </Link>
          </Button>
        </motion.div>
      )}

      {books && books.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-8 p-6 bg-primary/5 border border-primary/10 rounded-2xl"
        >
          <h3 className="font-bengali text-xl font-semibold text-foreground mb-3">
            পড়ার পরিসংখ্যান
          </h3>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="font-bengali text-3xl font-bold text-primary">{banglaTotal}</p>
              <p className="font-bengali text-sm text-muted-foreground mt-1">মোট বই</p>
            </div>
            <div>
              <p className="font-bengali text-3xl font-bold text-green-700">
                {books.filter((b) => b.status === "read").length}
              </p>
              <p className="font-bengali text-sm text-muted-foreground mt-1">পড়া হয়েছে</p>
            </div>
            <div>
              <p className="font-bengali text-3xl font-bold text-amber-600">
                {books.filter((b) => b.status === "reading").length}
              </p>
              <p className="font-bengali text-sm text-muted-foreground mt-1">পড়ছি</p>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
