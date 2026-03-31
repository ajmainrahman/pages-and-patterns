import { Link, useLocation } from "wouter";
import { BookMarked, Home, Library as LibraryIcon, BarChart2, Plus } from "lucide-react";

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  const navItems = [
    { href: "/", label: "Home", icon: Home },
    { href: "/library", label: "Library", icon: LibraryIcon },
    { href: "/stats", label: "Stats", icon: BarChart2 },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col md:flex-row font-sans">
      {/* Sidebar Desktop */}
      <aside className="hidden md:flex flex-col w-64 border-r bg-sidebar px-6 py-8 fixed inset-y-0 left-0">
        <Link href="/" className="flex items-center gap-3 mb-12 group">
          <div className="bg-primary text-primary-foreground p-2 rounded-lg group-hover:bg-primary/90 transition-colors shadow-sm">
            <BookMarked className="w-6 h-6" />
          </div>
          <span className="font-serif text-2xl font-bold tracking-tight text-sidebar-foreground">Folio.</span>
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
                <item.icon className={`w-5 h-5 ${isActive ? "text-primary" : "opacity-70"}`} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto pt-8">
          <Link 
            href="/add"
            className="flex items-center justify-center gap-2 w-full bg-primary hover:bg-primary/90 text-primary-foreground py-3.5 rounded-xl font-medium transition-all duration-200 shadow-md hover:shadow-lg hover:-translate-y-0.5"
          >
            <Plus className="w-5 h-5" />
            Add Book
          </Link>
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="md:hidden flex items-center justify-center px-4 py-4 border-b bg-background/80 backdrop-blur-md sticky top-0 z-20">
        <Link href="/" className="flex items-center gap-2">
          <BookMarked className="w-5 h-5 text-primary" />
          <span className="font-serif text-xl font-bold">Folio.</span>
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
              <span className="text-[10px] font-medium">{item.label}</span>
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
