import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { BookOpen } from "lucide-react";
import { motion } from "framer-motion";

export default function NotFound() {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4"
    >
      <div className="bg-secondary/50 p-6 rounded-full mb-6">
        <BookOpen className="w-12 h-12 text-muted-foreground" />
      </div>
      <h1 className="text-4xl md:text-5xl font-serif font-medium text-foreground mb-4 tracking-tight">
        Page Not Found
      </h1>
      <p className="text-lg text-muted-foreground mb-8 max-w-md font-light">
        This page seems to have gone missing from the library archives. Let's get you back to your collection.
      </p>
      <Button asChild size="lg" className="rounded-full shadow-md">
        <Link href="/">Return to Dashboard</Link>
      </Button>
    </motion.div>
  );
}
