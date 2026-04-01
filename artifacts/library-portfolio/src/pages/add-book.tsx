import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  useCreateBook,
  getListBooksQueryKey,
  getListRecentBooksQueryKey,
  getGetStatsQueryKey,
} from "@workspace/api-client-react";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { BookOpen, Sparkles, Target, Home, ShoppingCart, FileText } from "lucide-react";

const formSchema = z.object({
  title: z.string().min(1, "Title is required"),
  author: z.string().min(1, "Author is required"),
  genres: z.string(),
  summary: z.string().optional(),
  review: z.string().optional(),
  rating: z.coerce.number().min(0).max(5).optional(),
  status: z.enum(["read", "reading", "want_to_read"]),
  language: z.enum(["english", "bengali"]).default("english"),
  format: z.enum(["pdf", "physical"]).optional().or(z.literal("")),
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

export default function AddBook() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const createBook = useCreateBook();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "", author: "", genres: "", summary: "", review: "",
      rating: 0, status: "want_to_read", language: "english", format: "",
      isOwned: false, wantToBuy: false, coverUrl: "",
      publishedYear: 0, pageCount: 0, currentPage: 0,
      readingDeadline: "", isFavorite: false, quotes: "",
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    const data = {
      title: values.title,
      author: values.author,
      genres: values.genres ? values.genres.split(",").map((g) => g.trim()).filter(Boolean) : [],
      status: values.status,
      language: values.language,
      format: values.format && values.format !== "none" ? (values.format as "pdf" | "physical") : null,
      isOwned: values.isOwned,
      wantToBuy: values.wantToBuy,
      summary: values.summary || null,
      review: values.review || null,
      rating: values.rating || null,
      coverUrl: values.coverUrl || null,
      publishedYear: values.publishedYear || null,
      pageCount: values.pageCount || null,
      currentPage: values.currentPage || null,
      readingDeadline: values.readingDeadline || null,
      isFavorite: values.isFavorite,
      quotes: values.quotes ? values.quotes.split("\n").map((q) => q.trim()).filter(Boolean) : [],
    };

    createBook.mutate({ data }, {
      onSuccess: (newBook) => {
        queryClient.invalidateQueries({ queryKey: getListBooksQueryKey() });
        queryClient.invalidateQueries({ queryKey: getListRecentBooksQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetStatsQueryKey() });
        toast({ title: "Added to Library", description: `"${newBook.title}" has been cataloged.` });
        setLocation(`/books/${newBook.id}`);
      },
      onError: (err: unknown) => {
        const message =
          err instanceof Error ? err.message : "Unknown error";
        toast({ title: "Failed to add book", description: message, variant: "destructive" });
      },
    });
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-3xl mx-auto">
      <div className="mb-10">
        <h1 className="text-4xl font-serif font-medium mb-2 tracking-tight">Catalog a New Book</h1>
        <p className="text-muted-foreground text-lg font-light">Add a new entry to your personal library.</p>
      </div>

      <div className="bg-card border shadow-sm rounded-3xl p-6 md:p-10">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">

            <div className="space-y-6">
              <h2 className="text-xl font-serif border-b pb-2 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-primary" /> Core Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField control={form.control} name="title" render={({ field }) => (
                  <FormItem><FormLabel>Title *</FormLabel><FormControl><Input placeholder="e.g. The Secret History" className="bg-background" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="author" render={({ field }) => (
                  <FormItem><FormLabel>Author *</FormLabel><FormControl><Input placeholder="e.g. Donna Tartt" className="bg-background" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <FormField control={form.control} name="status" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reading Status *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl><SelectTrigger className="bg-background"><SelectValue placeholder="Select a status" /></SelectTrigger></FormControl>
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
                      <FormControl><SelectTrigger className="bg-background"><SelectValue placeholder="Select language" /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="english">English</SelectItem>
                        <SelectItem value="bengali" className="font-bengali">বাংলা (Bengali)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="genres" render={({ field }) => (
                  <FormItem><FormLabel>Genres (comma separated)</FormLabel><FormControl><Input placeholder="e.g. Fiction, Mystery" className="bg-background" {...field} /></FormControl><FormMessage /></FormItem>
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
                    <FormControl><SelectTrigger className="bg-background w-full md:w-64"><SelectValue placeholder="How did you read it?" /></SelectTrigger></FormControl>
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
                <FormItem><FormLabel>Personal Review</FormLabel><FormControl><Textarea placeholder="What did you think of it?" className="min-h-[120px] bg-background resize-y" {...field} /></FormControl><FormMessage /></FormItem>
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
                  <FormItem><FormLabel>Current Page</FormLabel><FormControl><Input type="number" min={0} className="bg-background" placeholder="e.g. 120" {...field} value={field.value || ""} /></FormControl><FormDescription>How far you've read</FormDescription><FormMessage /></FormItem>
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
              <Button type="button" variant="ghost" onClick={() => setLocation("/library")}>Cancel</Button>
              <Button type="submit" size="lg" className="rounded-full px-8 shadow-md" disabled={createBook.isPending}>
                {createBook.isPending ? "Adding..." : "Add to Library"}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </motion.div>
  );
}
