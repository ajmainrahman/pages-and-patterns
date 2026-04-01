import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRoute, useLocation } from "wouter";
import { useGetBook, useUpdateBook } from "@/lib/hooks";
import { Book } from "@/lib/store";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { BookOpen, Sparkles, Target, Pencil, Home, ShoppingCart, FileText } from "lucide-react";

const formSchema = z.object({
  title: z.string().min(1, "Title is required"),
  author: z.string().min(1, "Author is required"),
  genres: z.string(),
  summary: z.string().optional(),
  review: z.string().optional(),
  rating: z.coerce.number().min(0).max(5).optional(),
  status: z.enum(["read", "reading", "want_to_read"]),
  language: z.enum(["english", "bengali"]).default("english"),
  format: z.enum(["pdf", "physical", "none"]).default("none"),
  isOwned: z.boolean().default(false),
  wantToBuy: z.boolean().default(false),
  coverUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  publishedYear: z.coerce.number().optional().or(z.literal(0)),
  pageCount: z.coerce.number().optional().or(z.literal(0)),
  currentPage: z.coerce.number().optional().or(z.literal(0)),
  readingDeadline: z.string().optional(),
  isFavorite: z.boolean().default(false),
  quotes: z.string().optional(),
});

function EditBookForm({ book, id }: { book: Book; id: number }) {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const updateBook = useUpdateBook();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: book.title,
      author: book.author,
      genres: book.genres?.join(", ") || "",
      summary: book.summary || "",
      review: book.review || "",
      rating: book.rating || 0,
      status: book.status,
      language: book.language,
      format: (book.format as "pdf" | "physical") || "none",
      isOwned: book.isOwned,
      wantToBuy: book.wantToBuy,
      coverUrl: book.coverUrl || "",
      publishedYear: book.publishedYear || 0,
      pageCount: book.pageCount || 0,
      currentPage: book.currentPage || 0,
      readingDeadline: book.readingDeadline || "",
      isFavorite: book.isFavorite,
      quotes: book.quotes?.join("\n") || "",
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    const data = {
      title: values.title,
      author: values.author,
      genres: values.genres ? values.genres.split(",").map((g) => g.trim()).filter(Boolean) : [],
      status: values.status,
      language: values.language,
      format: values.format !== "none" ? (values.format as "pdf" | "physical") : null,
      isOwned: values.isOwned,
      wantToBuy: values.wantToBuy,
      summary: values.summary || null,
      review: values.review || null,
      rating: values.rating ? values.rating : null,
      coverUrl: values.coverUrl || null,
      publishedYear: values.publishedYear || null,
      pageCount: values.pageCount || null,
      currentPage: values.currentPage || null,
      readingDeadline: values.readingDeadline || null,
      isFavorite: values.isFavorite,
      quotes: values.quotes ? values.quotes.split("\n").map((q) => q.trim()).filter(Boolean) : [],
    };

    updateBook.mutate({ id, data }, {
      onSuccess: (updated) => {
        toast({ title: "Book updated", description: `"${updated.title}" has been saved.` });
        setLocation(`/books/${id}`);
      },
      onError: () => {
        toast({ title: "Error", description: "Failed to save changes.", variant: "destructive" });
      },
    });
  };

  return (
    <div className="bg-card border shadow-sm rounded-3xl p-6 md:p-10">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <div className="space-y-6">
            <h2 className="text-xl font-serif border-b pb-2 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-primary" /> Core Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField control={form.control} name="title" render={({ field }) => (
                <FormItem><FormLabel>Title *</FormLabel><FormControl><Input className="bg-background" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="author" render={({ field }) => (
                <FormItem><FormLabel>Author *</FormLabel><FormControl><Input className="bg-background" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <FormField control={form.control} name="status" render={({ field }) => (
                <FormItem>
                  <FormLabel>Reading Status *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl><SelectTrigger className="bg-background"><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="read">Read</SelectItem>
                      <SelectItem value="reading">Currently Reading</SelectItem>
                      <SelectItem value="want_to_read">Want to Read</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="language" render={({ field }) => (
                <FormItem>
                  <FormLabel>Language</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl><SelectTrigger className="bg-background"><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="english">English</SelectItem>
                      <SelectItem value="bengali" className="font-bengali">বাংলা (Bengali)</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="genres" render={({ field }) => (
                <FormItem><FormLabel>Genres (comma separated)</FormLabel><FormControl><Input className="bg-background" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
            </div>
            <FormField control={form.control} name="coverUrl" render={({ field }) => (
              <FormItem><FormLabel>Cover Image URL</FormLabel><FormControl><Input placeholder="https://..." className="bg-background" {...field} /></FormControl><FormDescription>A direct link to an image of the book cover</FormDescription><FormMessage /></FormItem>
            )} />
          </div>

          <div className="space-y-6 pt-6">
            <h2 className="text-xl font-serif border-b pb-2 flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" /> Book Details
            </h2>
            <FormField control={form.control} name="format" render={({ field }) => (
              <FormItem>
                <FormLabel>Format</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl><SelectTrigger className="bg-background w-full md:w-64"><SelectValue /></SelectTrigger></FormControl>
                  <SelectContent>
                    <SelectItem value="none">Not specified</SelectItem>
                    <SelectItem value="physical">📚 Physical / Hardcopy</SelectItem>
                    <SelectItem value="pdf">📄 PDF / Digital</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField control={form.control} name="isOwned" render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-xl border p-4 bg-background">
                  <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} className="data-[state=checked]:bg-primary data-[state=checked]:border-primary mt-0.5" /></FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel className="font-medium cursor-pointer flex items-center gap-2"><Home className="w-4 h-4 text-muted-foreground" /> In my home</FormLabel>
                    <p className="text-sm text-muted-foreground">I have a physical copy at home</p>
                  </div>
                </FormItem>
              )} />
              <FormField control={form.control} name="wantToBuy" render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-xl border p-4 bg-background">
                  <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} className="data-[state=checked]:bg-primary data-[state=checked]:border-primary mt-0.5" /></FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel className="font-medium cursor-pointer flex items-center gap-2"><ShoppingCart className="w-4 h-4 text-muted-foreground" /> Want to buy</FormLabel>
                    <p className="text-sm text-muted-foreground">I'd like to purchase this book</p>
                  </div>
                </FormItem>
              )} />
            </div>
          </div>

          <div className="space-y-6 pt-6">
            <h2 className="text-xl font-serif border-b pb-2 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-accent" /> Your Thoughts
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
              <FormField control={form.control} name="rating" render={({ field }) => (
                <FormItem><FormLabel>Rating (1-5)</FormLabel><FormControl><Input type="number" min={0} max={5} className="bg-background w-32" {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="isFavorite" render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-xl border p-4 bg-background">
                  <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} className="data-[state=checked]:bg-primary data-[state=checked]:border-primary" /></FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel className="font-medium cursor-pointer">Mark as Favorite</FormLabel>
                    <p className="text-sm text-muted-foreground">Highlight this book in your portfolio.</p>
                  </div>
                </FormItem>
              )} />
            </div>
            <FormField control={form.control} name="review" render={({ field }) => (
              <FormItem><FormLabel>Personal Review</FormLabel><FormControl><Textarea className="min-h-[120px] bg-background resize-y" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="quotes" render={({ field }) => (
              <FormItem><FormLabel>Favorite Quotes (one per line)</FormLabel><FormControl><Textarea placeholder={"Quote 1\nQuote 2"} className="min-h-[120px] bg-background resize-y" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
          </div>

          <div className="space-y-6 pt-6">
            <h2 className="text-xl font-serif border-b pb-2 text-muted-foreground">Additional Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <FormField control={form.control} name="publishedYear" render={({ field }) => (
                <FormItem><FormLabel>Published Year</FormLabel><FormControl><Input type="number" className="bg-background" {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="pageCount" render={({ field }) => (
                <FormItem><FormLabel>Total Pages</FormLabel><FormControl><Input type="number" className="bg-background" {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="currentPage" render={({ field }) => (
                <FormItem><FormLabel>Current Page</FormLabel><FormControl><Input type="number" min={0} className="bg-background" {...field} value={field.value || ""} /></FormControl><FormDescription>How far you've read</FormDescription><FormMessage /></FormItem>
              )} />
            </div>
            <FormField control={form.control} name="readingDeadline" render={({ field }) => (
              <FormItem className="max-w-xs"><FormLabel className="flex items-center gap-2"><Target className="w-3.5 h-3.5" /> Reading Deadline</FormLabel><FormControl><Input type="date" className="bg-background" {...field} value={field.value || ""} /></FormControl><FormDescription>Target date to finish this book</FormDescription><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="summary" render={({ field }) => (
              <FormItem><FormLabel>Synopsis</FormLabel><FormControl><Textarea placeholder="Book description..." className="bg-background min-h-[100px]" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
          </div>

          <div className="pt-6 border-t flex justify-end gap-3">
            <Button type="button" variant="ghost" onClick={() => setLocation(`/books/${id}`)}>Cancel</Button>
            <Button type="submit" size="lg" className="rounded-full px-8 shadow-md" disabled={updateBook.isPending}>
              {updateBook.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}

export default function EditBook() {
  const [, params] = useRoute("/books/:id/edit");
  const id = parseInt(params?.id || "0", 10);
  const [, setLocation] = useLocation();

  const { data: book, isLoading } = useGetBook(id, { query: { enabled: !!id } });

  if (isLoading) {
    return (
      <div className="animate-pulse max-w-3xl mx-auto space-y-6">
        <div className="h-10 w-1/2 bg-secondary rounded" />
        <div className="h-96 bg-secondary rounded-3xl" />
      </div>
    );
  }

  if (!book) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground">Book not found.</p>
        <Button variant="link" onClick={() => setLocation("/library")} className="mt-4">Back to Library</Button>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-3xl mx-auto">
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-2">
          <Pencil className="w-5 h-5 text-primary" />
          <h1 className="text-4xl font-serif font-medium tracking-tight">Edit Book</h1>
        </div>
        <p className="text-muted-foreground text-lg font-light">
          Update the details for <span className="italic">"{book.title}"</span>
        </p>
      </div>
      <EditBookForm book={book} id={id} />
    </motion.div>
  );
}
