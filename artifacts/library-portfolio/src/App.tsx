import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import Library from "@/pages/library";
import BookDetail from "@/pages/book-detail";
import AddBook from "@/pages/add-book";
import Stats from "@/pages/stats";
import BanglaBooks from "@/pages/bangla-books";
import { Layout } from "@/components/layout";

const queryClient = new QueryClient();

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/library" component={Library} />
        <Route path="/books/:id" component={BookDetail} />
        <Route path="/add" component={AddBook} />
        <Route path="/stats" component={Stats} />
        <Route path="/bangla" component={BanglaBooks} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
