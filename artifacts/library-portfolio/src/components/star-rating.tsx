import { Star } from "lucide-react";

export function StarRating({ rating, max = 5 }: { rating: number | null | undefined, max?: number }) {
  if (!rating) return <span className="text-muted-foreground text-xs font-medium tracking-wide uppercase">Unrated</span>;
  return (
    <div className="flex gap-0.5" aria-label={`Rating: ${rating} out of ${max}`}>
      {Array.from({ length: max }).map((_, i) => (
        <Star
          key={i}
          className={`w-3.5 h-3.5 ${i < rating ? "fill-accent text-accent" : "fill-muted text-muted"}`}
        />
      ))}
    </div>
  );
}
