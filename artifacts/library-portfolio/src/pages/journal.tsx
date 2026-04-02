import { useState, useMemo, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  NotebookPen, Plus, Search, Tag, Folder, Smile, BookOpen,
  Trash2, Pencil, X, ChevronDown, ChevronUp, Calendar,
  Pin, PinOff, Quote, Timer, RefreshCw, Maximize2, Minimize2,
  Flame, Clock, FileText, Sparkles, BookMarked, ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  useListJournalEntries,
  useCreateJournalEntry,
  useUpdateJournalEntry,
  useDeleteJournalEntry,
  useListBooks,
  getListJournalEntriesQueryKey,
} from "@workspace/api-client-react";
import type { JournalEntry, Book } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { format, subDays, startOfDay } from "date-fns";

const MOODS = [
  { value: "happy", label: "Happy", emoji: "😊" },
  { value: "reflective", label: "Reflective", emoji: "🤔" },
  { value: "inspired", label: "Inspired", emoji: "✨" },
  { value: "melancholic", label: "Melancholic", emoji: "🌧️" },
  { value: "neutral", label: "Neutral", emoji: "😐" },
] as const;

const DOMAINS = [
  "Reading", "Life", "Dreams", "Travel", "Learning", "Work", "Relationships", "Philosophy", "Creativity", "Gratitude",
];

const MOOD_COLORS: Record<string, string> = {
  happy: "bg-yellow-50 text-yellow-700 border-yellow-200",
  reflective: "bg-blue-50 text-blue-700 border-blue-200",
  inspired: "bg-purple-50 text-purple-700 border-purple-200",
  melancholic: "bg-slate-50 text-slate-600 border-slate-200",
  neutral: "bg-secondary text-muted-foreground border-border",
};

const TEMPLATES = [
  {
    label: "Reading Session",
    emoji: "📖",
    content: "Today I read for ___ minutes.\n\nWhat I covered:\n\nKey insight:\n\nHow it made me feel:",
  },
  {
    label: "Book Reflection",
    emoji: "💭",
    content: "What I loved:\n\nWhat confused me:\n\nWould I recommend it? Yes / No / Maybe\n\nWho would love this book:",
  },
  {
    label: "Quote Analysis",
    emoji: "💬",
    content: 'The quote that stood out:\n\n"___"\n\nWhy it resonated:\n\nHow it connects to my life:',
  },
  {
    label: "Weekly Recap",
    emoji: "📅",
    content: "Books I read this week:\n\nFavourite moment:\n\nWhat I'm reading next:\n\nReading goal progress:",
  },
  {
    label: "Closing Reflection",
    emoji: "🎯",
    content: "I just finished this book. Overall thoughts:\n\nMost memorable part:\n\nWhat changed in me:\n\nRating (1–5):",
  },
];

type Mood = "happy" | "reflective" | "inspired" | "melancholic" | "neutral";
type ViewMode = "list" | "archive";

function getMoodEmoji(mood: string) {
  return MOODS.find((m) => m.value === mood)?.emoji ?? "😐";
}

function wordCount(text: string) {
  return text.trim() ? text.trim().split(/\s+/).length : 0;
}

function calculateStreak(entries: JournalEntry[]): number {
  if (!entries.length) return 0;
  const uniqueDays = [
    ...new Set(entries.map((e) => format(startOfDay(new Date(e.createdAt)), "yyyy-MM-dd"))),
  ].sort().reverse();
  const today = format(startOfDay(new Date()), "yyyy-MM-dd");
  const yesterday = format(startOfDay(subDays(new Date(), 1)), "yyyy-MM-dd");
  if (uniqueDays[0] !== today && uniqueDays[0] !== yesterday) return 0;
  let streak = 0;
  let checkDate = uniqueDays[0] === today ? new Date() : subDays(new Date(), 1);
  for (const day of uniqueDays) {
    const expected = format(startOfDay(checkDate), "yyyy-MM-dd");
    if (day === expected) {
      streak++;
      checkDate = subDays(checkDate, 1);
    } else {
      break;
    }
  }
  return streak;
}

function StatsBar({ entries }: { entries: JournalEntry[] }) {
  const streak = calculateStreak(entries);
  const totalMinutes = entries.reduce((sum, e) => sum + (e.minutesRead ?? 0), 0);
  const totalWords = entries.reduce((sum, e) => sum + wordCount(e.content), 0);
  const thisMonth = entries.filter((e) => {
    const d = new Date(e.createdAt);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;

  const stats = [
    { icon: Flame, label: "Day streak", value: streak, color: "text-orange-500" },
    { icon: FileText, label: "This month", value: thisMonth, color: "text-primary" },
    { icon: Clock, label: "Minutes read", value: totalMinutes > 0 ? totalMinutes : "—", color: "text-blue-500" },
    { icon: NotebookPen, label: "Total words", value: totalWords > 0 ? totalWords.toLocaleString() : "—", color: "text-purple-500" },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {stats.map(({ icon: Icon, label, value, color }) => (
        <div key={label} className="bg-card border border-border/60 rounded-2xl p-4 flex flex-col gap-1">
          <Icon className={`w-4 h-4 ${color}`} />
          <p className={`text-2xl font-serif font-semibold ${color}`}>{value}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      ))}
    </div>
  );
}

function BookCover({ book }: { book: Book | undefined }) {
  if (!book) return null;
  return (
    <div className="flex items-center gap-2 mt-2 mb-1">
      {book.coverUrl ? (
        <img src={book.coverUrl} alt={book.title} className="w-8 h-11 object-cover rounded shadow-sm" />
      ) : (
        <div className="w-8 h-11 bg-primary/10 rounded flex items-center justify-center shrink-0">
          <BookOpen className="w-4 h-4 text-primary/60" />
        </div>
      )}
      <div className="min-w-0">
        <p className="text-xs font-medium text-foreground truncate">{book.title}</p>
        <p className="text-[11px] text-muted-foreground truncate">{book.author}</p>
      </div>
    </div>
  );
}

function EntryCard({
  entry, onEdit, onDelete, onPin, books,
}: {
  entry: JournalEntry;
  onEdit: (e: JournalEntry) => void;
  onDelete: (id: number) => void;
  onPin: (e: JournalEntry) => void;
  books: Book[];
}) {
  const [expanded, setExpanded] = useState(false);
  const moodColor = MOOD_COLORS[entry.mood] ?? MOOD_COLORS.neutral;
  const preview = entry.content.length > 180 ? entry.content.slice(0, 180) + "…" : entry.content;
  const book = books.find((b) => b.id === entry.bookId);
  const wc = wordCount(entry.content);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className={`bg-card border rounded-2xl p-5 hover:shadow-md transition-all duration-300 ${
        entry.pinned ? "border-primary/30 bg-primary/[0.02]" : "border-border/60 hover:border-primary/20"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            {entry.pinned && (
              <span className="text-xs font-semibold text-primary flex items-center gap-1">
                <Pin className="w-3 h-3" /> Pinned
              </span>
            )}
            <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${moodColor}`}>
              {getMoodEmoji(entry.mood)} {MOODS.find((m) => m.value === entry.mood)?.label}
            </span>
            {entry.isReread && (
              <span className="text-xs font-medium px-2.5 py-1 rounded-full border bg-amber-50 text-amber-700 border-amber-200 flex items-center gap-1">
                <RefreshCw className="w-3 h-3" /> Re-read
              </span>
            )}
            {entry.domain && (
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Folder className="w-3 h-3" /> {entry.domain}
              </span>
            )}
            <span className="text-xs text-muted-foreground flex items-center gap-1 ml-auto">
              <Calendar className="w-3 h-3" />
              {format(new Date(entry.createdAt), "MMM d, yyyy")}
            </span>
          </div>

          {book && <BookCover book={book} />}

          <h3 className="font-serif font-semibold text-lg leading-tight mb-1 text-foreground">{entry.title}</h3>

          {entry.quote && (
            <blockquote className="border-l-2 border-primary/40 pl-3 my-2 italic text-sm text-muted-foreground">
              "{entry.quote}"
            </blockquote>
          )}

          <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
            {expanded ? entry.content : preview}
          </p>
          {entry.content.length > 180 && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="text-xs text-primary mt-1 flex items-center gap-1 hover:underline"
            >
              {expanded ? <><ChevronUp className="w-3 h-3" /> Show less</> : <><ChevronDown className="w-3 h-3" /> Read more</>}
            </button>
          )}

          <div className="flex flex-wrap items-center gap-3 mt-3">
            {entry.minutesRead && (
              <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                <Timer className="w-3 h-3" /> {entry.minutesRead} min
              </span>
            )}
            {wc > 0 && (
              <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                <FileText className="w-3 h-3" /> {wc} words
              </span>
            )}
            {entry.tags && entry.tags.length > 0 && entry.tags.map((tag) => (
              <span key={tag} className="text-[11px] text-muted-foreground bg-secondary px-2 py-0.5 rounded-full flex items-center gap-1">
                <Tag className="w-2.5 h-2.5" /> {tag}
              </span>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-1 shrink-0">
          <button
            onClick={() => onPin(entry)}
            className={`p-2 rounded-lg transition-colors ${
              entry.pinned
                ? "text-primary hover:bg-primary/10"
                : "text-muted-foreground hover:text-primary hover:bg-primary/5"
            }`}
            title={entry.pinned ? "Unpin" : "Pin entry"}
          >
            {entry.pinned ? <PinOff className="w-4 h-4" /> : <Pin className="w-4 h-4" />}
          </button>
          <button
            onClick={() => onEdit(entry)}
            className="p-2 text-muted-foreground hover:text-primary rounded-lg hover:bg-primary/5 transition-colors"
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(entry.id)}
            className="p-2 text-muted-foreground hover:text-destructive rounded-lg hover:bg-destructive/5 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

function FocusMode({
  title, content, onTitleChange, onContentChange, onClose,
}: {
  title: string;
  content: string;
  onTitleChange: (v: string) => void;
  onContentChange: (v: string) => void;
  onClose: () => void;
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  useEffect(() => { textareaRef.current?.focus(); }, []);
  const wc = wordCount(content);

  return (
    <div className="fixed inset-0 z-50 bg-[#1a1612] flex flex-col">
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
        <span className="text-white/40 text-sm font-medium tracking-wide">Focus Mode</span>
        <div className="flex items-center gap-4">
          <span className="text-white/30 text-xs">{wc} words</span>
          <button onClick={onClose} className="text-white/40 hover:text-white transition-colors">
            <Minimize2 className="w-5 h-5" />
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto px-6 py-8 max-w-2xl mx-auto w-full">
        <input
          type="text"
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          placeholder="Entry title..."
          className="w-full bg-transparent text-white text-2xl font-serif font-semibold mb-6 outline-none placeholder:text-white/20 border-none"
        />
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => onContentChange(e.target.value)}
          placeholder="Write freely..."
          className="w-full bg-transparent text-white/80 text-base leading-relaxed outline-none resize-none placeholder:text-white/20 min-h-[60vh]"
        />
      </div>
    </div>
  );
}

function EntryForm({
  initial, onSave, onCancel, isSaving, books,
}: {
  initial?: Partial<JournalEntry>;
  onSave: (data: {
    title: string; content: string; mood: Mood; domain: string; tags: string;
    quote: string; minutesRead: string; pinned: boolean; isReread: boolean; bookId: number | null;
  }) => void;
  onCancel: () => void;
  isSaving: boolean;
  books: Book[];
}) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [content, setContent] = useState(initial?.content ?? "");
  const [mood, setMood] = useState<Mood>((initial?.mood as Mood) ?? "neutral");
  const [domain, setDomain] = useState(initial?.domain ?? "");
  const [tags, setTags] = useState(initial?.tags?.join(", ") ?? "");
  const [quote, setQuote] = useState(initial?.quote ?? "");
  const [minutesRead, setMinutesRead] = useState(initial?.minutesRead?.toString() ?? "");
  const [pinned, setPinned] = useState(initial?.pinned ?? false);
  const [isReread, setIsReread] = useState(initial?.isReread ?? false);
  const [bookId, setBookId] = useState<number | null>(initial?.bookId ?? null);
  const [showDomains, setShowDomains] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [focusMode, setFocusMode] = useState(false);
  const wc = wordCount(content);

  const selectedBook = books.find((b) => b.id === bookId);
  const isCompletedBook = selectedBook?.status === "completed";

  return (
    <>
      {focusMode && (
        <FocusMode
          title={title}
          content={content}
          onTitleChange={setTitle}
          onContentChange={setContent}
          onClose={() => setFocusMode(false)}
        />
      )}

      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.97 }}
        className="bg-card border rounded-3xl p-6 md:p-8 shadow-lg space-y-5"
      >
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xl font-serif font-semibold flex items-center gap-2">
            <NotebookPen className="w-5 h-5 text-primary" />
            {initial?.id ? "Edit Entry" : "New Journal Entry"}
          </h2>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setFocusMode(true)}
              className="p-2 text-muted-foreground hover:text-primary rounded-lg hover:bg-primary/5 transition-colors"
              title="Focus writing mode"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
            <button onClick={onCancel} className="text-muted-foreground hover:text-foreground">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {!initial?.id && (
          <div>
            <button
              type="button"
              onClick={() => setShowTemplates(!showTemplates)}
              className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5 hover:text-primary transition-colors mb-2"
            >
              <Sparkles className="w-3 h-3" />
              Use a template
              <ChevronDown className={`w-3 h-3 transition-transform ${showTemplates ? "rotate-180" : ""}`} />
            </button>
            <AnimatePresence>
              {showTemplates && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="flex flex-wrap gap-2 pb-2">
                    {TEMPLATES.map((t) => (
                      <button
                        key={t.label}
                        type="button"
                        onClick={() => {
                          setContent(t.content);
                          if (!title) setTitle(t.label);
                          setShowTemplates(false);
                        }}
                        className="text-xs px-3 py-1.5 rounded-full border border-border bg-secondary hover:bg-primary/10 hover:border-primary/30 hover:text-primary transition-all"
                      >
                        {t.emoji} {t.label}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        <Input
          placeholder="Entry title..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="text-lg font-serif bg-background border-0 border-b rounded-none px-0 focus-visible:ring-0 focus-visible:border-primary"
        />

        <div className="relative">
          <Textarea
            placeholder="Write your thoughts here..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="bg-background min-h-[180px] resize-none text-sm leading-relaxed"
          />
          {wc > 0 && (
            <span className="absolute bottom-2 right-3 text-[11px] text-muted-foreground/60 pointer-events-none">
              {wc} words
            </span>
          )}
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1">
            <Quote className="w-3 h-3" /> Favourite Quote (optional)
          </p>
          <Input
            placeholder="A line that stayed with you..."
            value={quote}
            onChange={(e) => setQuote(e.target.value)}
            className="bg-background italic text-sm"
          />
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1">
            <Smile className="w-3 h-3" /> Mood
          </p>
          <div className="flex flex-wrap gap-2">
            {MOODS.map((m) => (
              <button
                key={m.value}
                type="button"
                onClick={() => setMood(m.value)}
                className={`text-sm px-3 py-1.5 rounded-full border transition-all ${
                  mood === m.value
                    ? "bg-primary text-primary-foreground border-primary shadow-sm"
                    : "bg-background border-border text-muted-foreground hover:border-primary/40"
                }`}
              >
                {m.emoji} {m.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1">
              <BookMarked className="w-3 h-3" /> Link to Book (optional)
            </p>
            <select
              value={bookId ?? ""}
              onChange={(e) => setBookId(e.target.value ? Number(e.target.value) : null)}
              className="w-full h-9 rounded-lg border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">No book linked</option>
              {books.map((b) => (
                <option key={b.id} value={b.id}>{b.title}</option>
              ))}
            </select>
            {isCompletedBook && (
              <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> You finished this book — write a closing reflection!
              </p>
            )}
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1">
              <Timer className="w-3 h-3" /> Minutes Read Today (optional)
            </p>
            <Input
              type="number"
              min="0"
              placeholder="e.g. 45"
              value={minutesRead}
              onChange={(e) => setMinutesRead(e.target.value)}
              className="bg-background"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1">
              <Folder className="w-3 h-3" /> Domain / Section
            </p>
            <div className="relative">
              <Input
                placeholder="e.g. Reading, Life, Dreams..."
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                onFocus={() => setShowDomains(true)}
                onBlur={() => setTimeout(() => setShowDomains(false), 150)}
                className="bg-background"
              />
              {showDomains && (
                <div className="absolute top-full left-0 right-0 z-10 mt-1 bg-card border rounded-xl shadow-lg p-1 max-h-40 overflow-y-auto">
                  {DOMAINS.filter((d) => d.toLowerCase().includes(domain.toLowerCase())).map((d) => (
                    <button
                      key={d}
                      type="button"
                      onMouseDown={() => setDomain(d)}
                      className="w-full text-left text-sm px-3 py-2 rounded-lg hover:bg-secondary transition-colors"
                    >
                      {d}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1">
              <Tag className="w-3 h-3" /> Tags (comma separated)
            </p>
            <Input
              placeholder="e.g. growth, philosophy, habit"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className="bg-background"
            />
          </div>
        </div>

        <div className="flex items-center gap-6">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <button
              type="button"
              onClick={() => setPinned(!pinned)}
              className={`w-10 h-5 rounded-full transition-colors relative ${pinned ? "bg-primary" : "bg-border"}`}
            >
              <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${pinned ? "translate-x-5" : ""}`} />
            </button>
            <span className="text-sm text-muted-foreground flex items-center gap-1">
              <Pin className="w-3 h-3" /> Pin this entry
            </span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer select-none">
            <button
              type="button"
              onClick={() => setIsReread(!isReread)}
              className={`w-10 h-5 rounded-full transition-colors relative ${isReread ? "bg-amber-500" : "bg-border"}`}
            >
              <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${isReread ? "translate-x-5" : ""}`} />
            </button>
            <span className="text-sm text-muted-foreground flex items-center gap-1">
              <RefreshCw className="w-3 h-3" /> Re-read notes
            </span>
          </label>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button variant="ghost" onClick={onCancel}>Cancel</Button>
          <Button
            onClick={() => onSave({ title, content, mood, domain, tags, quote, minutesRead, pinned, isReread, bookId })}
            disabled={!title.trim() || isSaving}
            className="rounded-full px-6 shadow-sm"
          >
            {isSaving ? "Saving..." : initial?.id ? "Save Changes" : "Add Entry"}
          </Button>
        </div>
      </motion.div>
    </>
  );
}

function MonthlyArchive({ entries, books, onEdit, onDelete, onPin }: {
  entries: JournalEntry[];
  books: Book[];
  onEdit: (e: JournalEntry) => void;
  onDelete: (id: number) => void;
  onPin: (e: JournalEntry) => void;
}) {
  const [openMonth, setOpenMonth] = useState<string | null>(null);

  const grouped = useMemo(() => {
    const map = new Map<string, JournalEntry[]>();
    for (const e of entries) {
      const key = format(new Date(e.createdAt), "MMMM yyyy");
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(e);
    }
    return [...map.entries()];
  }, [entries]);

  return (
    <div className="space-y-3">
      {grouped.map(([month, monthEntries]) => (
        <div key={month} className="bg-card border border-border/60 rounded-2xl overflow-hidden">
          <button
            onClick={() => setOpenMonth(openMonth === month ? null : month)}
            className="w-full flex items-center justify-between px-5 py-4 hover:bg-secondary/40 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Calendar className="w-4 h-4 text-primary" />
              <span className="font-serif font-semibold text-foreground">{month}</span>
              <span className="text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">
                {monthEntries.length} {monthEntries.length === 1 ? "entry" : "entries"}
              </span>
            </div>
            <ChevronRight className={`w-4 h-4 text-muted-foreground transition-transform ${openMonth === month ? "rotate-90" : ""}`} />
          </button>
          <AnimatePresence>
            {openMonth === month && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="px-4 pb-4 space-y-3 border-t border-border/40 pt-3">
                  {monthEntries.map((e) => (
                    <EntryCard key={e.id} entry={e} books={books} onEdit={onEdit} onDelete={onDelete} onPin={onPin} />
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ))}
    </div>
  );
}

export default function Journal() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: entries, isLoading } = useListJournalEntries();
  const { data: booksData } = useListBooks();
  const createEntry = useCreateJournalEntry();
  const updateEntry = useUpdateJournalEntry();
  const deleteEntry = useDeleteJournalEntry();

  const [showForm, setShowForm] = useState(false);
  const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null);
  const [search, setSearch] = useState("");
  const [filterMood, setFilterMood] = useState<string>("");
  const [filterDomain, setFilterDomain] = useState<string>("");
  const [filterBookId, setFilterBookId] = useState<string>("");
  const [viewMode, setViewMode] = useState<ViewMode>("list");

  const books = booksData ?? [];
  const invalidate = () => queryClient.invalidateQueries({ queryKey: getListJournalEntriesQueryKey() });

  const handleSave = (data: {
    title: string; content: string; mood: Mood; domain: string; tags: string;
    quote: string; minutesRead: string; pinned: boolean; isReread: boolean; bookId: number | null;
  }) => {
    const payload = {
      title: data.title,
      content: data.content,
      mood: data.mood,
      domain: data.domain || null,
      tags: data.tags ? data.tags.split(",").map((t) => t.trim()).filter(Boolean) : [],
      quote: data.quote || null,
      minutesRead: data.minutesRead ? parseInt(data.minutesRead) : null,
      pinned: data.pinned,
      isReread: data.isReread,
      bookId: data.bookId ?? null,
    };

    if (editingEntry) {
      updateEntry.mutate({ id: editingEntry.id, data: payload }, {
        onSuccess: () => { invalidate(); setEditingEntry(null); toast({ title: "Entry updated" }); },
        onError: () => toast({ title: "Failed to update", variant: "destructive" }),
      });
    } else {
      createEntry.mutate({ data: payload }, {
        onSuccess: () => { invalidate(); setShowForm(false); toast({ title: "Entry added to your journal" }); },
        onError: () => toast({ title: "Failed to save", variant: "destructive" }),
      });
    }
  };

  const handleDelete = (id: number) => {
    deleteEntry.mutate({ id }, {
      onSuccess: () => { invalidate(); toast({ title: "Entry deleted" }); },
      onError: () => toast({ title: "Failed to delete", variant: "destructive" }),
    });
  };

  const handlePin = (entry: JournalEntry) => {
    updateEntry.mutate(
      { id: entry.id, data: { pinned: !entry.pinned } },
      {
        onSuccess: () => {
          invalidate();
          toast({ title: entry.pinned ? "Entry unpinned" : "Entry pinned" });
        },
        onError: () => toast({ title: "Failed to update pin", variant: "destructive" }),
      }
    );
  };

  const allDomains = Array.from(new Set((entries ?? []).map((e) => e.domain).filter(Boolean))) as string[];
  const linkedBookIds = new Set((entries ?? []).map((e) => e.bookId).filter(Boolean));
  const linkedBooks = books.filter((b) => linkedBookIds.has(b.id));

  const filtered = useMemo(() => {
    return (entries ?? []).filter((e) => {
      const q = search.toLowerCase();
      const matchSearch = !search
        || e.title.toLowerCase().includes(q)
        || e.content.toLowerCase().includes(q)
        || (e.quote ?? "").toLowerCase().includes(q)
        || (e.tags ?? []).some((t) => t.toLowerCase().includes(q));
      const matchMood = !filterMood || e.mood === filterMood;
      const matchDomain = !filterDomain || e.domain === filterDomain;
      const matchBook = !filterBookId || String(e.bookId) === filterBookId;
      return matchSearch && matchMood && matchDomain && matchBook;
    });
  }, [entries, search, filterMood, filterDomain, filterBookId]);

  const pinned = filtered.filter((e) => e.pinned);
  const unpinned = filtered.filter((e) => !e.pinned);
  const isSaving = createEntry.isPending || updateEntry.isPending;
  const hasFilters = search || filterMood || filterDomain || filterBookId;

  return (
    <div className="space-y-8 max-w-3xl mx-auto">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b pb-8">
          <div>
            <h1 className="text-4xl md:text-5xl font-serif font-medium mb-2 tracking-tight flex items-center gap-3">
              <NotebookPen className="w-9 h-9 text-primary" />
              Journal
            </h1>
            <p className="text-lg text-muted-foreground font-light">
              Your private space to reflect, record, and grow.
            </p>
          </div>
          {!showForm && !editingEntry && (
            <Button onClick={() => setShowForm(true)} className="rounded-full px-6 shadow-md shrink-0" size="lg">
              <Plus className="w-5 h-5 mr-1" /> New Entry
            </Button>
          )}
        </div>
      </motion.div>

      {!isLoading && (entries?.length ?? 0) > 0 && (
        <StatsBar entries={entries ?? []} />
      )}

      <AnimatePresence mode="popLayout">
        {(showForm || editingEntry) && (
          <EntryForm
            key="form"
            initial={editingEntry ?? undefined}
            onSave={handleSave}
            onCancel={() => { setShowForm(false); setEditingEntry(null); }}
            isSaving={isSaving}
            books={books}
          />
        )}
      </AnimatePresence>

      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search entries, quotes, tags..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-background"
            />
          </div>
          <select
            value={filterMood}
            onChange={(e) => setFilterMood(e.target.value)}
            className="h-9 rounded-lg border border-input bg-background px-3 text-sm text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">All moods</option>
            {MOODS.map((m) => <option key={m.value} value={m.value}>{m.emoji} {m.label}</option>)}
          </select>
          {allDomains.length > 0 && (
            <select
              value={filterDomain}
              onChange={(e) => setFilterDomain(e.target.value)}
              className="h-9 rounded-lg border border-input bg-background px-3 text-sm text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">All domains</option>
              {allDomains.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          )}
          {linkedBooks.length > 0 && (
            <select
              value={filterBookId}
              onChange={(e) => setFilterBookId(e.target.value)}
              className="h-9 rounded-lg border border-input bg-background px-3 text-sm text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">All books</option>
              {linkedBooks.map((b) => <option key={b.id} value={b.id}>{b.title}</option>)}
            </select>
          )}
        </div>

        {(entries?.length ?? 0) > 0 && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode("list")}
              className={`text-sm px-3 py-1.5 rounded-full transition-colors ${viewMode === "list" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
            >
              List
            </button>
            <button
              onClick={() => setViewMode("archive")}
              className={`text-sm px-3 py-1.5 rounded-full transition-colors ${viewMode === "archive" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
            >
              Monthly Archive
            </button>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => <div key={i} className="h-36 bg-secondary animate-pulse rounded-2xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-24 bg-secondary/40 rounded-3xl border border-dashed border-border">
          <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-40" />
          <p className="font-serif text-xl text-foreground mb-2">
            {hasFilters ? "No matching entries." : "Your journal is empty."}
          </p>
          <p className="text-muted-foreground mb-6">
            {hasFilters ? "Try clearing your filters." : "Start writing your first entry to capture your thoughts."}
          </p>
          {!showForm && !hasFilters && (
            <Button onClick={() => setShowForm(true)} className="rounded-full">
              <Plus className="w-4 h-4 mr-1" /> Write First Entry
            </Button>
          )}
        </div>
      ) : viewMode === "archive" ? (
        <MonthlyArchive
          entries={filtered}
          books={books}
          onEdit={(e) => { setEditingEntry(e); setShowForm(false); }}
          onDelete={handleDelete}
          onPin={handlePin}
        />
      ) : (
        <div className="space-y-6">
          <p className="text-sm text-muted-foreground">{filtered.length} {filtered.length === 1 ? "entry" : "entries"}</p>

          {pinned.length > 0 && (
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Pin className="w-3 h-3" /> Pinned
              </p>
              <AnimatePresence>
                {pinned.map((entry) => (
                  <EntryCard
                    key={entry.id}
                    entry={entry}
                    books={books}
                    onEdit={(e) => { setEditingEntry(e); setShowForm(false); }}
                    onDelete={handleDelete}
                    onPin={handlePin}
                  />
                ))}
              </AnimatePresence>
            </div>
          )}

          {unpinned.length > 0 && (
            <div className="space-y-3">
              {pinned.length > 0 && (
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Recent</p>
              )}
              <AnimatePresence>
                {unpinned.map((entry) => (
                  <EntryCard
                    key={entry.id}
                    entry={entry}
                    books={books}
                    onEdit={(e) => { setEditingEntry(e); setShowForm(false); }}
                    onDelete={handleDelete}
                    onPin={handlePin}
                  />
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
