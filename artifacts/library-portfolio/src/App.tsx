import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import Library from "@/pages/library";
import BookDetail from "@/pages/book-detail";
import AddBook from "@/pages/add-book";
import EditBook from "@/pages/edit-book";
import Stats from "@/pages/stats";
import BanglaBooks from "@/pages/bangla-books";
import Login from "@/pages/login";
import Register from "@/pages/register";
import { Layout } from "@/components/layout";

const queryClient = new QueryClient();

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { user, isLoading } = useAuth();
  if (isLoading) return null;
  if (!user) return <Redirect to="/login" />;
  return (
    <Layout>
      <Component />
    </Layout>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/" component={() => <ProtectedRoute component={Dashboard} />} />
      <Route path="/library" component={() => <ProtectedRoute component={Library} />} />
      <Route path="/books/:id/edit" component={() => <ProtectedRoute component={EditBook} />} />
      <Route path="/books/:id" component={() => <ProtectedRoute component={BookDetail} />} />
      <Route path="/add" component={() => <ProtectedRoute component={AddBook} />} />
      <Route path="/stats" component={() => <ProtectedRoute component={Stats} />} />
      <Route path="/bangla" component={() => <ProtectedRoute component={BanglaBooks} />} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
