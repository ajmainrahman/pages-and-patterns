import { Link, useLocation } from "wouter";
import { Home, Library as LibraryIcon, BarChart2, Plus, BookHeart, LogOut } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { user, logout } = useAuth();

  const navItems = [
    { href: "/", label: "Home", icon: Home },
    { href: "/library", label: "Library", icon: LibraryIcon },
    { href: "/bangla", label: "বাংলা বই", icon: BookHeart },
    { href: "/stats", label: "Stats", icon: BarChart2 },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col md:flex-row font-sans">
      {/* Sidebar Desktop */}
      <aside className="hidden md:flex flex-col w-64 border-r bg-sidebar px-6 py-8 fixed inset-y-0 left-0">
        <Link href="/" className="flex items-center gap-3 mb-12 group">
          {/* Pages & Patterns Logo */}
          <div className="relative shrink-0">
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-sm">
              <rect width="40" height="40" rx="10" fill="hsl(var(--primary))" />
              {/* Open book pages */}
              <path d="M8 12 C8 10.9 8.9 10 10 10 L19 10 L19 30 L10 30 C8.9 30 8 29.1 8 28 Z" fill="hsl(var(--primary-foreground))" opacity="0.9" />
              <path d="M21 10 L30 10 C31.1 10 32 10.9 32 12 L32 28 C32 29.1 31.1 30 30 30 L21 30 Z" fill="hsl(var(--primary-foreground))" opacity="0.7" />
              {/* Spine line */}
              <line x1="20" y1="10" x2="20" y2="30" stroke="hsl(var(--primary-foreground))" strokeWidth="2" opacity="0.5" />
              {/* Pattern lines on left page */}
              <line x1="11" y1="15" x2="17" y2="15" stroke="hsl(var(--primary))" strokeWidth="1.5" opacity="0.6" />
              <line x1="11" y1="19" x2="17" y2="19" stroke="hsl(var(--primary))" strokeWidth="1.5" opacity="0.6" />
              <line x1="11" y1="23" x2="15" y2="23" stroke="hsl(var(--primary))" strokeWidth="1.5" opacity="0.6" />
              {/* Pattern dots on right page */}
              <circle cx="24" cy="15" r="1.5" fill="hsl(var(--primary))" opacity="0.6" />
              <circle cx="28" cy="15" r="1.5" fill="hsl(var(--primary))" opacity="0.6" />
              <circle cx="24" cy="20" r="1.5" fill="hsl(var(--primary))" opacity="0.6" />
              <circle cx="28" cy="20" r="1.5" fill="hsl(var(--primary))" opacity="0.6" />
              <circle cx="24" cy="25" r="1.5" fill="hsl(var(--primary))" opacity="0.6" />
            </svg>
          </div>
          <div className="flex flex-col leading-none">
            <span className="font-serif text-lg font-bold tracking-tight text-sidebar-foreground group-hover:text-primary transition-colors">Pages &amp;</span>
            <span className="font-serif text-lg font-bold tracking-tight text-primary">Patterns</span>
          </div>
        </Link>

        <nav className="flex-1 space-y-1.5">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4 ml-2">Menu</div>
          {navItems.map((item) => {
            const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-medium ${
                  isActive
                    ? "bg-primary/10 text-primary shadow-sm"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                }`}
              >
                <item.icon className={`w-5 h-5 shrink-0 ${isActive ? "text-primary" : "opacity-70"}`} />
                <span className={item.href === "/bangla" ? "font-bengali" : ""}>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto pt-8 space-y-3">
          <Link
            href="/add"
            className="flex items-center justify-center gap-2 w-full bg-primary hover:bg-primary/90 text-primary-foreground py-3.5 rounded-xl font-medium transition-all duration-200 shadow-md hover:shadow-lg hover:-translate-y-0.5"
          >
            <Plus className="w-5 h-5" />
            Add Book
          </Link>
          {user && (
            <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-secondary/50">
              <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                <span className="text-xs font-bold text-primary">
                  {(user.name || user.email).charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate text-foreground">{user.name || user.email}</p>
                <p className="text-[10px] text-muted-foreground truncate">{user.name ? user.email : ""}</p>
              </div>
              <button
                onClick={logout}
                title="Sign out"
                className="shrink-0 text-muted-foreground hover:text-destructive transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="md:hidden flex items-center justify-center px-4 py-4 border-b bg-background/80 backdrop-blur-md sticky top-0 z-20">
        <Link href="/" className="flex items-center gap-2">
          <svg width="28" height="28" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="40" height="40" rx="10" fill="hsl(var(--primary))" />
            <path d="M8 12 C8 10.9 8.9 10 10 10 L19 10 L19 30 L10 30 C8.9 30 8 29.1 8 28 Z" fill="hsl(var(--primary-foreground))" opacity="0.9" />
            <path d="M21 10 L30 10 C31.1 10 32 10.9 32 12 L32 28 C32 29.1 31.1 30 30 30 L21 30 Z" fill="hsl(var(--primary-foreground))" opacity="0.7" />
            <line x1="20" y1="10" x2="20" y2="30" stroke="hsl(var(--primary-foreground))" strokeWidth="2" opacity="0.5" />
          </svg>
          <div className="flex items-baseline gap-1">
            <span className="font-serif text-lg font-bold tracking-tight">Pages &amp;</span>
            <span className="font-serif text-lg font-bold text-primary tracking-tight">Patterns</span>
          </div>
        </Link>
      </header>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 border-t bg-background/90 backdrop-blur-md flex justify-around p-2 z-20 pb-safe shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
        {navItems.map((item) => {
          const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-1 p-2 flex-1 rounded-lg transition-colors ${
                isActive ? "text-primary" : "text-muted-foreground hover:bg-secondary/50"
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className={`text-[10px] font-medium ${item.href === "/bangla" ? "font-bengali" : ""}`}>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Main Content */}
      <main className="flex-1 md:ml-64 px-4 py-8 md:px-12 md:py-12 pb-24 md:pb-12">
        <div className="max-w-6xl mx-auto h-full animate-in fade-in duration-500">
          {children}
        </div>
      </main>
    </div>
  );
}
