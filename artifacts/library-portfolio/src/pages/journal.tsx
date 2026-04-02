import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  NotebookPen, Plus, Search, Tag, Folder, Smile, BookOpen,
  Trash2, Pencil, X, ChevronDown, ChevronUp, Calendar,
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
} from "@workspace/api-client-react";
import {
  useQueryClient,
} from "@tanstack/react-query";
import { getListJournalEntriesQueryKey } from "@workspace/api-client-react";
import { format } from "date-fns";
import { JournalEntry } from "@workspace/api-client-react/src/generated/api.schemas";

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

type Mood = "happy" | "reflective" | "inspired" | "melancholic" | "neutral";

function getMoodEmoji(mood: string) {
  return MOODS.find((m) => m.value === mood)?.emoji ?? "😐";
}

function EntryCard({ entry, onEdit, onDelete }: {
  entry: JournalEntry;
  onEdit: (e: JournalEntry) => void;
  onDelete: (id: number) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const moodColor = MOOD_COLORS[entry.mood] ?? MOOD_COLORS.neutral;
  const preview = entry.content.length > 160 ? entry.content.slice(0, 160) + "…" : entry.content;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="bg-card border border-border/60 rounded-2xl p-5 hover:shadow-md transition-all duration-300 hover:border-primary/20"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${moodColor}`}>
              {getMoodEmoji(entry.mood)} {MOODS.find((m) => m.value === entry.mood)?.label}
            </span>
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
          <h3 className="font-serif font-semibold text-lg leading-tight mb-1 text-foreground">{entry.title}</h3>
          <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
            {expanded ? entry.content : preview}
          </p>
          {entry.content.length > 160 && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="text-xs text-primary mt-1 flex items-center gap-1 hover:underline"
            >
              {expanded ? <><ChevronUp className="w-3 h-3" /> Show less</> : <><ChevronDown className="w-3 h-3" /> Read more</>}
            </button>
          )}
          {entry.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {entry.tags.map((tag) => (
                <span key={tag} className="text-[11px] text-muted-foreground bg-secondary px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Tag className="w-2.5 h-2.5" /> {tag}
                </span>
              ))}
            </div>
          )}
        </div>
        <div className="flex gap-1 shrink-0">
          <button onClick={() => onEdit(entry)} className="p-2 text-muted-foreground hover:text-primary rounded-lg hover:bg-primary/5 transition-colors">
            <Pencil className="w-4 h-4" />
          </button>
          <button onClick={() => onDelete(entry.id)} className="p-2 text-muted-foreground hover:text-destructive rounded-lg hover:bg-destructive/5 transition-colors">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

function EntryForm({ initial, onSave, onCancel, isSaving }: {
  initial?: Partial<JournalEntry>;
  onSave: (data: { title: string; content: string; mood: Mood; domain: string; tags: string }) => void;
  onCancel: () => void;
  isSaving: boolean;
}) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [content, setContent] = useState(initial?.content ?? "");
  const [mood, setMood] = useState<Mood>((initial?.mood as Mood) ?? "neutral");
  const [domain, setDomain] = useState(initial?.domain ?? "");
  const [tags, setTags] = useState(initial?.tags?.join(", ") ?? "");
  const [showDomains, setShowDomains] = useState(false);

  return (
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
        <button onClick={onCancel} className="text-muted-foreground hover:text-foreground">
          <X className="w-5 h-5" />
        </button>
      </div>

      <Input
        placeholder="Entry title..."
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="text-lg font-serif bg-background border-0 border-b rounded-none px-0 focus-visible:ring-0 focus-visible:border-primary"
      />

      <Textarea
        placeholder="Write your thoughts here..."
        value={content}
        onChange={(e) => setContent(e.target.value)}
        className="bg-background min-h-[180px] resize-none text-sm leading-relaxed"
      />

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

      <div className="flex justify-end gap-3 pt-2">
        <Button variant="ghost" onClick={onCancel}>Cancel</Button>
        <Button
          onClick={() => onSave({ title, content, mood, domain, tags })}
          disabled={!title.trim() || isSaving}
          className="rounded-full px-6 shadow-sm"
        >
          {isSaving ? "Saving..." : initial?.id ? "Save Changes" : "Add Entry"}
        </Button>
      </div>
    </motion.div>
  );
}

export default function Journal() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: entries, isLoading } = useListJournalEntries();
  const createEntry = useCreateJournalEntry();
  const updateEntry = useUpdateJournalEntry();
  const deleteEntry = useDeleteJournalEntry();

  const [showForm, setShowForm] = useState(false);
  const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null);
  const [search, setSearch] = useState("");
  const [filterMood, setFilterMood] = useState<string>("");
  const [filterDomain, setFilterDomain] = useState<string>("");

  const invalidate = () => queryClient.invalidateQueries({ queryKey: getListJournalEntriesQueryKey() });

  const handleSave = (data: { title: string; content: string; mood: Mood; domain: string; tags: string }) => {
    const payload = {
      title: data.title,
      content: data.content,
      mood: data.mood,
      domain: data.domain || null,
      tags: data.tags ? data.tags.split(",").map((t) => t.trim()).filter(Boolean) : [],
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

  const allDomains = Array.from(new Set((entries ?? []).map((e) => e.domain).filter(Boolean))) as string[];

  const filtered = (entries ?? []).filter((e) => {
    const q = search.toLowerCase();
    const matchSearch = !search || e.title.toLowerCase().includes(q) || e.content.toLowerCase().includes(q) || e.tags.some((t) => t.toLowerCase().includes(q));
    const matchMood = !filterMood || e.mood === filterMood;
    const matchDomain = !filterDomain || e.domain === filterDomain;
    return matchSearch && matchMood && matchDomain;
  });

  const isSaving = createEntry.isPending || updateEntry.isPending;

  return (
    <div className="space-y-10 max-w-3xl mx-auto">
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

      <AnimatePresence mode="popLayout">
        {(showForm || editingEntry) && (
          <EntryForm
            key="form"
            initial={editingEntry ?? undefined}
            onSave={handleSave}
            onCancel={() => { setShowForm(false); setEditingEntry(null); }}
            isSaving={isSaving}
          />
        )}
      </AnimatePresence>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search entries..."
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
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-36 bg-secondary animate-pulse rounded-2xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-24 bg-secondary/40 rounded-3xl border border-dashed border-border">
          <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-40" />
          <p className="font-serif text-xl text-foreground mb-2">
            {search || filterMood || filterDomain ? "No matching entries." : "Your journal is empty."}
          </p>
          <p className="text-muted-foreground mb-6">
            {search || filterMood || filterDomain
              ? "Try clearing your filters."
              : "Start writing your first entry to capture your thoughts."}
          </p>
          {!showForm && !search && !filterMood && !filterDomain && (
            <Button onClick={() => setShowForm(true)} className="rounded-full">
              <Plus className="w-4 h-4 mr-1" /> Write First Entry
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">{filtered.length} {filtered.length === 1 ? "entry" : "entries"}</p>
          <AnimatePresence>
            {filtered.map((entry) => (
              <EntryCard
                key={entry.id}
                entry={entry}
                onEdit={(e) => { setEditingEntry(e); setShowForm(false); }}
                onDelete={handleDelete}
              />
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
