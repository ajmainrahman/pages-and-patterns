import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Trash2, UserPlus, Users, BookOpen, Shield } from "lucide-react";

interface AdminUser {
  id: number;
  email: string;
  name: string;
  isAdmin: boolean;
  createdAt: string;
}

interface AdminBook {
  id: number;
  title: string;
  author: string;
  status: string;
  userId: number;
}

async function apiFetch(path: string, opts?: RequestInit) {
  const r = await fetch(path, { credentials: "include", ...opts });
  if (!r.ok) {
    const d = await r.json().catch(() => ({}));
    throw new Error(d.error ?? "Request failed");
  }
  return r.json();
}

export default function Admin() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [users, setUsers] = useState<AdminUser[] | null>(null);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [userBooks, setUserBooks] = useState<AdminBook[] | null>(null);
  const [loadingBooks, setLoadingBooks] = useState(false);

  const [showInvite, setShowInvite] = useState(false);
  const [inviteName, setInviteName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [invitePassword, setInvitePassword] = useState("");
  const [inviting, setInviting] = useState(false);

  if (!user?.isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <Shield className="w-16 h-16 text-muted-foreground mb-4" />
        <h2 className="text-2xl font-serif font-medium mb-2">Admin Only</h2>
        <p className="text-muted-foreground">You need admin access to view this page.</p>
      </div>
    );
  }

  const loadUsers = async () => {
    setLoadingUsers(true);
    try {
      const data: AdminUser[] = await apiFetch("/api/admin/users");
      setUsers(data);
    } catch (e) {
      toast({ title: "Error", description: String(e), variant: "destructive" });
    } finally {
      setLoadingUsers(false);
    }
  };

  const loadUserBooks = async (u: AdminUser) => {
    setSelectedUser(u);
    setLoadingBooks(true);
    setUserBooks(null);
    try {
      const data: AdminBook[] = await apiFetch(`/api/admin/books?userId=${u.id}`);
      setUserBooks(data);
    } catch (e) {
      toast({ title: "Error", description: String(e), variant: "destructive" });
    } finally {
      setLoadingBooks(false);
    }
  };

  const deleteUser = async (u: AdminUser) => {
    if (!confirm(`Delete ${u.name || u.email}? All their books will also be deleted.`)) return;
    try {
      await apiFetch(`/api/admin/users/${u.id}`, { method: "DELETE" });
      toast({ title: "User deleted" });
      if (selectedUser?.id === u.id) { setSelectedUser(null); setUserBooks(null); }
      setUsers((prev) => prev?.filter((x) => x.id !== u.id) ?? null);
    } catch (e) {
      toast({ title: "Error", description: String(e), variant: "destructive" });
    }
  };

  const inviteUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviting(true);
    try {
      const newUser: AdminUser = await apiFetch("/api/admin/users/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail, password: invitePassword, name: inviteName }),
      });
      toast({ title: `Account created for ${newUser.name || newUser.email}` });
      setUsers((prev) => prev ? [...prev, newUser] : [newUser]);
      setShowInvite(false);
      setInviteName(""); setInviteEmail(""); setInvitePassword("");
    } catch (e) {
      toast({ title: "Error", description: String(e), variant: "destructive" });
    } finally {
      setInviting(false);
    }
  };

  const statusLabel: Record<string, string> = {
    read: "Read",
    reading: "Reading",
    want_to_read: "Want to read",
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-serif font-medium flex items-center gap-3">
          <Shield className="w-7 h-7 text-primary" />
          Admin Panel
        </h1>
        <p className="text-muted-foreground mt-1">Manage users and browse their libraries.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-card border rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-serif font-medium flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" /> Users
            </h2>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={loadUsers} disabled={loadingUsers}>
                {loadingUsers ? "Loading…" : users ? "Refresh" : "Load Users"}
              </Button>
              <Button size="sm" onClick={() => setShowInvite((v) => !v)}>
                <UserPlus className="w-4 h-4 mr-1" />
                Add User
              </Button>
            </div>
          </div>

          {showInvite && (
            <form onSubmit={inviteUser} className="border rounded-xl p-4 space-y-3 bg-secondary/30">
              <p className="text-sm font-medium">Create account for a new user</p>
              <div className="space-y-1">
                <Label>Name</Label>
                <Input placeholder="e.g. Rahim" value={inviteName} onChange={(e) => setInviteName(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>Email</Label>
                <Input type="email" placeholder="user@example.com" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} required />
              </div>
              <div className="space-y-1">
                <Label>Password</Label>
                <Input type="password" placeholder="Min. 8 characters" value={invitePassword} onChange={(e) => setInvitePassword(e.target.value)} required />
              </div>
              <div className="flex gap-2">
                <Button type="submit" size="sm" disabled={inviting}>{inviting ? "Creating…" : "Create"}</Button>
                <Button type="button" variant="ghost" size="sm" onClick={() => setShowInvite(false)}>Cancel</Button>
              </div>
            </form>
          )}

          {users === null && !loadingUsers && (
            <p className="text-sm text-muted-foreground text-center py-6">Click "Load Users" to see all accounts.</p>
          )}

          {users && (
            <div className="space-y-2">
              {users.map((u) => (
                <div
                  key={u.id}
                  className={`flex items-center gap-3 p-3 rounded-xl border transition-colors cursor-pointer ${selectedUser?.id === u.id ? "bg-primary/10 border-primary/30" : "hover:bg-secondary/50"}`}
                  onClick={() => loadUserBooks(u)}
                >
                  <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                    <span className="text-sm font-bold text-primary">
                      {(u.name || u.email).charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{u.name || u.email}</p>
                    <p className="text-xs text-muted-foreground truncate">{u.name ? u.email : ""}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {u.isAdmin && (
                      <span className="text-[10px] bg-primary/15 text-primary font-semibold px-2 py-0.5 rounded-full">Admin</span>
                    )}
                    {u.id !== user.id && (
                      <button
                        onClick={(e) => { e.stopPropagation(); deleteUser(u); }}
                        className="text-muted-foreground hover:text-destructive transition-colors"
                        title="Delete user"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-card border rounded-2xl p-6 space-y-4">
          <h2 className="text-lg font-serif font-medium flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-primary" />
            {selectedUser ? `${selectedUser.name || selectedUser.email}'s Library` : "Library Viewer"}
          </h2>

          {!selectedUser && (
            <p className="text-sm text-muted-foreground text-center py-10">Select a user on the left to browse their library.</p>
          )}

          {loadingBooks && (
            <p className="text-sm text-muted-foreground text-center py-10">Loading books…</p>
          )}

          {userBooks && userBooks.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-10">No books in this library yet.</p>
          )}

          {userBooks && userBooks.length > 0 && (
            <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
              {userBooks.map((b) => (
                <div key={b.id} className="flex items-center gap-3 p-3 rounded-xl border bg-secondary/20">
                  <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <BookOpen className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{b.title}</p>
                    <p className="text-xs text-muted-foreground truncate">{b.author}</p>
                  </div>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${
                    b.status === "read" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" :
                    b.status === "reading" ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" :
                    "bg-secondary text-muted-foreground"
                  }`}>
                    {statusLabel[b.status] ?? b.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
