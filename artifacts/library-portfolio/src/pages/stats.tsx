import { useGetStats } from "@workspace/api-client-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer,
  AreaChart, Area, CartesianGrid,
  PieChart, Pie, Cell,
} from "recharts";
import { motion } from "framer-motion";
import { FileText, Star, Trophy, Target, BookOpen, TrendingUp, Globe, Bookmark } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const PRIMARY = "hsl(346 77% 32%)";
const ACCENT = "hsl(36 100% 57%)";
const GREEN = "hsl(145 40% 36%)";
const BLUE = "hsl(215 60% 52%)";
const PURPLE = "hsl(270 50% 55%)";
const MUTED = "hsl(var(--muted-foreground))";

const STATUS_COLORS: Record<string, string> = { read: GREEN, reading: ACCENT, want_to_read: BLUE };
const STATUS_LABELS: Record<string, string> = { read: "Read", reading: "Reading", want_to_read: "Want to Read" };
const LANG_COLORS: Record<string, string> = { english: PRIMARY, bengali: PURPLE };
const FORMAT_COLORS: Record<string, string> = { physical: GREEN, pdf: ACCENT, unspecified: MUTED };
const FORMAT_LABELS: Record<string, string> = { physical: "📚 Physical", pdf: "📄 PDF", unspecified: "Not specified" };

const tooltipStyle = {
  borderRadius: "12px",
  border: "1px solid hsl(var(--border))",
  boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
  backgroundColor: "hsl(var(--card))",
  color: "hsl(var(--foreground))",
  fontSize: "13px",
};

function ChartCard({ title, icon, children, delay = 0 }: {
  title: string; icon: React.ReactNode; children: React.ReactNode; delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="bg-card border rounded-3xl p-6 md:p-8 shadow-sm"
    >
      <h2 className="text-lg font-serif font-medium mb-6 flex items-center gap-2 text-foreground">
        {icon} {title}
      </h2>
      {children}
    </motion.div>
  );
}

function EmptyChart() {
  return (
    <div className="h-56 flex items-center justify-center text-muted-foreground text-sm border border-dashed rounded-2xl bg-secondary/30">
      Not enough data yet
    </div>
  );
}

export default function Stats() {
  const { data: stats, isLoading } = useGetStats();

  if (isLoading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="h-10 w-48 bg-secondary rounded" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-2xl" />)}
        </div>
        <Skeleton className="h-72 rounded-3xl w-full" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-72 rounded-3xl" />
          <Skeleton className="h-72 rounded-3xl" />
        </div>
      </div>
    );
  }

  if (!stats) return null;

  const completionRate = stats.totalBooks > 0 ? Math.round((stats.booksRead / stats.totalBooks) * 100) : 0;

  const statusData = [
    { name: STATUS_LABELS.read, value: stats.booksRead, color: STATUS_COLORS.read },
    { name: STATUS_LABELS.reading, value: stats.booksReading, color: STATUS_COLORS.reading },
    { name: STATUS_LABELS.want_to_read, value: stats.booksWantToRead, color: STATUS_COLORS.want_to_read },
  ].filter((d) => d.value > 0);

  const langData = stats.languageBreakdown.map((l) => ({
    name: l.language === "bengali" ? "বাংলা" : "English",
    value: l.count,
    color: LANG_COLORS[l.language] ?? MUTED,
  }));

  const formatData = stats.formatBreakdown.map((f) => ({
    name: FORMAT_LABELS[f.format] ?? f.format,
    value: f.count,
    color: FORMAT_COLORS[f.format] ?? MUTED,
  }));

  const ratingData = stats.ratingDistribution.map((r) => ({
    name: "★".repeat(r.rating),
    count: r.count,
    rating: r.rating,
  }));

  const hasMonthData = stats.booksPerMonth.some((m) => m.count > 0);
  const hasRatingData = stats.ratingDistribution.some((r) => r.count > 0);

  return (
    <div className="space-y-10">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <h1 className="text-4xl md:text-5xl font-serif font-medium mb-2 tracking-tight">Reading Statistics</h1>
        <p className="text-xl text-muted-foreground font-light">The numbers behind your reading life.</p>
      </motion.div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MiniStat icon={<Trophy className="w-5 h-5 text-amber-500" />} label="Completion" value={`${completionRate}%`} sub="of all books read" delay={0.05} />
        <MiniStat icon={<FileText className="w-5 h-5 text-primary" />} label="Pages Read" value={(stats.pagesReadTotal ?? 0).toLocaleString()} sub="from completed books" delay={0.1} />
        <MiniStat icon={<BookOpen className="w-5 h-5 text-green-600" />} label="Avg. Pages" value={(stats.avgPagesPerBook ?? 0).toLocaleString()} sub="per book" delay={0.15} />
        <MiniStat icon={<Star className="w-5 h-5 text-accent" />} label="Avg Rating" value={stats.averageRating ? stats.averageRating.toFixed(1) + " ★" : "—"} sub="across rated books" delay={0.2} />
      </div>

      <ChartCard title="Books Added per Month" icon={<TrendingUp className="w-4 h-4 text-primary" />} delay={0.25}>
        {hasMonthData ? (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.booksPerMonth} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
                <defs>
                  <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={PRIMARY} stopOpacity={0.2} />
                    <stop offset="95%" stopColor={PRIMARY} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: MUTED }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: MUTED }} axisLine={false} tickLine={false} />
                <RechartsTooltip cursor={{ stroke: PRIMARY, strokeWidth: 1, strokeDasharray: "4 2" }} contentStyle={tooltipStyle} formatter={(v) => [`${v} book${v === 1 ? "" : "s"}`, "Added"]} />
                <Area type="monotone" dataKey="count" stroke={PRIMARY} strokeWidth={2.5} fill="url(#areaGrad)" dot={{ fill: PRIMARY, strokeWidth: 0, r: 4 }} activeDot={{ r: 6 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : <EmptyChart />}
      </ChartCard>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="Genre Breakdown" icon={<Bookmark className="w-4 h-4 text-primary" />} delay={0.3}>
          {stats.genreBreakdown.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.genreBreakdown.slice(0, 8)} layout="vertical" margin={{ top: 0, right: 12, left: 8, bottom: 0 }}>
                  <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: MUTED }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="genre" width={80} tick={{ fontSize: 11, fill: MUTED }} axisLine={false} tickLine={false} />
                  <RechartsTooltip cursor={{ fill: "hsl(var(--secondary))" }} contentStyle={tooltipStyle} formatter={(v) => [`${v} book${v === 1 ? "" : "s"}`, "Count"]} />
                  <Bar dataKey="count" fill={PRIMARY} radius={[0, 6, 6, 0]} barSize={18} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : <EmptyChart />}
        </ChartCard>

        <ChartCard title="Rating Distribution" icon={<Star className="w-4 h-4 text-accent" />} delay={0.35}>
          {hasRatingData ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={ratingData} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 14, fill: MUTED }} axisLine={false} tickLine={false} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: MUTED }} axisLine={false} tickLine={false} />
                  <RechartsTooltip cursor={{ fill: "hsl(var(--secondary))" }} contentStyle={tooltipStyle} formatter={(v, _, props) => [`${v} book${v === 1 ? "" : "s"}`, `${props.payload.rating} star${props.payload.rating === 1 ? "" : "s"}`]} />
                  <Bar dataKey="count" fill={ACCENT} radius={[6, 6, 0, 0]} barSize={36} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : <EmptyChart />}
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <ChartCard title="Reading Status" icon={<Target className="w-4 h-4 text-green-600" />} delay={0.4}>
          <DonutChart data={statusData} />
        </ChartCard>
        <ChartCard title="Language Split" icon={<Globe className="w-4 h-4 text-primary" />} delay={0.45}>
          <DonutChart data={langData} />
        </ChartCard>
        <ChartCard title="Book Format" icon={<BookOpen className="w-4 h-4 text-amber-500" />} delay={0.5}>
          {formatData.length > 0 ? <DonutChart data={formatData} /> : <EmptyChart />}
        </ChartCard>
      </div>

      {stats.booksPerYear && stats.booksPerYear.length > 0 && (
        <ChartCard title="Books Read per Year" icon={<TrendingUp className="w-4 h-4 text-green-600" />} delay={0.52}>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.booksPerYear} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="year" tick={{ fontSize: 12, fill: MUTED }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: MUTED }} axisLine={false} tickLine={false} />
                <RechartsTooltip cursor={{ fill: "hsl(var(--secondary))" }} contentStyle={tooltipStyle} formatter={(v) => [`${v} book${v === 1 ? "" : "s"}`, "Read"]} />
                <Bar dataKey="count" fill={GREEN} radius={[6, 6, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      )}

      <ChartCard title="Most Read Authors" icon={<Trophy className="w-4 h-4 text-amber-500" />} delay={0.55}>
        {stats.topAuthors.length > 0 ? (
          <div className="space-y-3">
            {stats.topAuthors.map((author, i) => {
              const maxCount = stats.topAuthors[0].count;
              const pct = Math.round((author.count / maxCount) * 100);
              return (
                <div key={author.author} className="flex items-center gap-4">
                  <div className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold font-serif text-xs shrink-0">
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-medium text-sm truncate">{author.author}</span>
                      <span className="text-xs text-muted-foreground ml-2 shrink-0">{author.count} book{author.count > 1 ? "s" : ""}</span>
                    </div>
                    <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                      <motion.div
                        className="h-full rounded-full bg-primary"
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.7, delay: 0.6 + i * 0.08, ease: "easeOut" }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : <EmptyChart />}
      </ChartCard>
    </div>
  );
}

function MiniStat({ icon, label, value, sub, delay }: { icon: React.ReactNode; label: string; value: string; sub: string; delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, delay }}
      className="bg-card border border-border/50 rounded-2xl p-5 shadow-sm flex flex-col gap-3"
    >
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{label}</p>
        {icon}
      </div>
      <div>
        <p className="text-3xl font-serif font-semibold text-foreground">{value}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>
      </div>
    </motion.div>
  );
}

function DonutChart({ data }: { data: { name: string; value: number; color: string }[] }) {
  if (data.length === 0 || data.every((d) => d.value === 0)) return <EmptyChart />;
  const total = data.reduce((s, d) => s + d.value, 0);
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="h-44 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} cx="50%" cy="50%" innerRadius={52} outerRadius={76} paddingAngle={3} dataKey="value">
              {data.map((entry, i) => <Cell key={i} fill={entry.color} stroke="transparent" />)}
            </Pie>
            <RechartsTooltip contentStyle={tooltipStyle} formatter={(v, name) => [`${v} (${Math.round((Number(v) / total) * 100)}%)`, name]} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1.5 justify-center">
        {data.map((d) => (
          <div key={d.name} className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
            <span>{d.name}</span>
            <span className="font-semibold text-foreground">({d.value})</span>
          </div>
        ))}
      </div>
    </div>
  );
}
