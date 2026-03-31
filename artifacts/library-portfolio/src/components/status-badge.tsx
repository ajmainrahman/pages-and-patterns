import { Badge } from "@/components/ui/badge";

export function StatusBadge({ status, className }: { status: string, className?: string }) {
  const map = {
    read: { label: "Read", className: "bg-[#35634f] text-white hover:bg-[#35634f]/90 border-transparent shadow-sm" },
    reading: { label: "Reading", className: "bg-[#f5a623] text-[#2e2926] hover:bg-[#f5a623]/90 border-transparent shadow-sm" },
    want_to_read: { label: "Want to Read", className: "bg-muted text-muted-foreground hover:bg-muted/90 border-transparent" },
  };
  const s = map[status as keyof typeof map] || map.want_to_read;
  
  return <Badge className={`${s.className} ${className || ""}`}>{s.label}</Badge>;
}
