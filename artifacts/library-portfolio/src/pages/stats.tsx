import { useGetStats } from "@workspace/api-client-react";
import { BarChart, Bar, XAxis, Tooltip as RechartsTooltip, ResponsiveContainer, YAxis } from "recharts";
import { motion } from "framer-motion";
import { Book, FileText, Star, Trophy, Target } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function Stats() {
  const { data: stats, isLoading } = useGetStats();

  if (isLoading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="h-10 w-48 bg-secondary rounded" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-40 rounded-2xl" />
          <Skeleton className="h-40 rounded-2xl" />
          <Skeleton className="h-40 rounded-2xl" />
        </div>
        <Skeleton className="h-[400px] rounded-2xl w-full" />
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="space-y-12">
      <div>
        <h1 className="text-4xl md:text-5xl font-serif font-medium mb-3 tracking-tight">Reading Statistics</h1>
        <p className="text-xl text-muted-foreground font-light">The numbers behind your reading life.</p>
      </div>

      {/* Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatHighlight 
          icon={<FileText className="w-6 h-6 text-primary" />}
          label="Total Pages Read"
          value={stats.totalPages.toLocaleString()}
          delay={0.1}
        />
        <StatHighlight 
          icon={<Trophy className="w-6 h-6 text-[#f5a623]" />}
          label="Completion Rate"
          value={stats.totalBooks > 0 ? `${Math.round((stats.booksRead / stats.totalBooks) * 100)}%` : "0%"}
          delay={0.2}
        />
        <StatHighlight 
          icon={<Target className="w-6 h-6 text-[#35634f]" />}
          label="Books Read"
          value={stats.booksRead.toString()}
          delay={0.3}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Genre Chart */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-card border rounded-3xl p-8 shadow-sm"
        >
          <h2 className="text-xl font-serif font-medium mb-8">Genre Breakdown</h2>
          {stats.genreBreakdown.length > 0 ? (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.genreBreakdown} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <XAxis dataKey="genre" tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                  <RechartsTooltip 
                    cursor={{ fill: 'hsl(var(--secondary))' }}
                    contentStyle={{ borderRadius: '12px', border: '1px solid hsl(var(--border))', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', backgroundColor: 'hsl(var(--card))', color: 'hsl(var(--foreground))' }}
                  />
                  <Bar dataKey="count" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-72 flex items-center justify-center text-muted-foreground border border-dashed rounded-xl bg-secondary/30">
              Not enough data for chart
            </div>
          )}
        </motion.div>

        {/* Top Authors */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-card border rounded-3xl p-8 shadow-sm flex flex-col"
        >
          <h2 className="text-xl font-serif font-medium mb-6">Most Read Authors</h2>
          {stats.topAuthors.length > 0 ? (
            <div className="space-y-4 flex-1">
              {stats.topAuthors.slice(0, 5).map((author, i) => (
                <div key={author.author} className="flex items-center justify-between p-4 bg-secondary/50 rounded-2xl transition-colors hover:bg-secondary">
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold font-serif text-sm">
                      {i + 1}
                    </div>
                    <span className="font-medium text-foreground">{author.author}</span>
                  </div>
                  <span className="text-muted-foreground font-serif bg-background px-3 py-1 rounded-full text-sm shadow-sm border border-border/50">
                    {author.count} {author.count === 1 ? 'book' : 'books'}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground border border-dashed rounded-xl bg-secondary/30">
              Not enough data for list
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}

function StatHighlight({ icon, label, value, delay }: { icon: React.ReactNode, label: string, value: string, delay: number }) {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, delay }}
      className="bg-card border shadow-sm rounded-3xl p-6 flex items-center gap-6 relative overflow-hidden"
    >
      <div className="bg-secondary p-4 rounded-2xl">
        {icon}
      </div>
      <div>
        <p className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-1">{label}</p>
        <p className="text-3xl font-serif font-semibold text-foreground">{value}</p>
      </div>
    </motion.div>
  );
}
