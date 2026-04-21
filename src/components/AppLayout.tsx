import { Link, Outlet, useLocation, useRouter } from "@tanstack/react-router";
import {
  LayoutDashboard, FileText, Wallet, CheckSquare, BarChart3, Users,
  Bell, ScrollText, Settings, Search, ChevronDown, LogOut, User, Menu, X, Building2,
} from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useNotifikasi } from "@/lib/queries";
import { cn } from "@/lib/utils";

const menu = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/ajuan", label: "Ajuan Anggaran", icon: FileText },
  { to: "/pencairan", label: "Pencairan Dana", icon: Wallet },
  { to: "/approval", label: "Approval", icon: CheckSquare },
  { to: "/laporan", label: "Laporan Keuangan", icon: BarChart3 },
  { to: "/pengguna", label: "Manajemen Pengguna", icon: Users },
  { to: "/notifikasi", label: "Notifikasi", icon: Bell },
  { to: "/audit", label: "Audit Log", icon: ScrollText },
  { to: "/pengaturan", label: "Pengaturan", icon: Settings },
] as const;

export function AppLayout({ children }: { children?: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const location = useLocation();
  const router = useRouter();
  const { user, profile, role, signOut, loading } = useAuth();
  const { data: notifList = [] } = useNotifikasi();
  const unread = notifList.filter((n) => !n.dibaca).length;
  const initials = (profile?.nama_lengkap ?? user?.email ?? "U")
    .split(" ").map(p => p[0]).slice(0, 2).join("").toUpperCase();

  const isActive = (to: string, exact?: boolean) =>
    exact ? location.pathname === to : location.pathname === to || location.pathname.startsWith(to + "/");

  // Auth guard
  if (loading) {
    return <div className="flex min-h-screen items-center justify-center bg-background"><div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" /></div>;
  }
  if (!user) {
    if (typeof window !== "undefined" && location.pathname !== "/auth") {
      router.navigate({ to: "/auth" });
    }
    return null;
  }

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside className={cn(
        "fixed lg:sticky top-0 left-0 z-40 h-screen w-72 shrink-0 border-r border-sidebar-border bg-sidebar transition-transform duration-300",
        mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        <div className="flex h-16 items-center gap-3 border-b border-sidebar-border px-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-soft">
            <Building2 className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-sidebar-foreground">E-Budgeting</p>
            <p className="truncate text-[11px] text-muted-foreground">Pesantren Raudhatussalam</p>
          </div>
        </div>
        <nav className="scrollbar-thin h-[calc(100vh-4rem)] overflow-y-auto px-3 py-4">
          <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Menu Utama</p>
          <ul className="space-y-1">
            {menu.map(item => {
              const active = isActive(item.to, "exact" in item ? item.exact : false);
              const Icon = item.icon;
              return (
                <li key={item.to}>
                  <Link
                    to={item.to}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                      active
                        ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-soft"
                        : "text-sidebar-foreground hover:bg-secondary hover:translate-x-0.5"
                    )}
                  >
                    <Icon className={cn("h-[18px] w-[18px] transition-colors", active ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} />
                    <span className="flex-1">{item.label}</span>
                    {item.to === "/notifikasi" && unread > 0 && (
                      <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-destructive px-1.5 text-[10px] font-bold text-destructive-foreground">{unread}</span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>

          <div className="mt-6 rounded-xl border border-primary/20 bg-gradient-to-br from-primary-soft to-transparent p-4">
            <p className="text-xs font-semibold text-foreground">Periode Anggaran</p>
            <p className="mt-1 text-lg font-bold text-primary">2025 / 2026</p>
            <p className="mt-1 text-[11px] text-muted-foreground">Tahun ajaran aktif</p>
          </div>
        </nav>
      </aside>

      {mobileOpen && <div className="fixed inset-0 z-30 bg-black/40 lg:hidden" onClick={() => setMobileOpen(false)} />}

      {/* Main */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Navbar */}
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-border bg-card/80 px-4 backdrop-blur-md md:px-6">
          <button onClick={() => setMobileOpen(v => !v)} className="lg:hidden rounded-lg p-2 hover:bg-secondary">
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>

          <div className="relative max-w-md flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Cari ajuan, pengguna, atau dokumen..."
              className="h-10 w-full rounded-lg border border-input bg-background pl-9 pr-3 text-sm outline-none transition-all placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/20"
            />
          </div>

          <Link to="/notifikasi" className="relative rounded-lg p-2.5 hover:bg-secondary transition-colors">
            <Bell className="h-5 w-5 text-muted-foreground" />
            {unread > 0 && <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-destructive ring-2 ring-card" />}
          </Link>

          <div className="relative">
            <button
              onClick={() => setProfileOpen(v => !v)}
              className="flex items-center gap-2 rounded-lg p-1.5 pr-2 hover:bg-secondary transition-colors"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">{initials}</div>
              <div className="hidden text-left md:block">
                <p className="text-sm font-semibold leading-tight">{profile?.nama_lengkap ?? "Pengguna"}</p>
                <p className="text-[11px] leading-tight text-muted-foreground capitalize">{role ?? "—"}</p>
              </div>
              <ChevronDown className="hidden h-4 w-4 text-muted-foreground md:block" />
            </button>
            {profileOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setProfileOpen(false)} />
                <div className="absolute right-0 top-full z-20 mt-2 w-56 animate-fade-in rounded-xl border border-border bg-popover p-1.5 shadow-elevated">
                  <div className="px-3 py-2.5 border-b border-border mb-1">
                    <p className="text-sm font-semibold">{profile?.nama_lengkap ?? "Pengguna"}</p>
                    <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                  </div>
                  <button className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-secondary"><User className="h-4 w-4" /> Profil Saya</button>
                  <button onClick={() => { setProfileOpen(false); router.navigate({ to: "/pengaturan" }); }} className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-secondary"><Settings className="h-4 w-4" /> Pengaturan</button>
                  <div className="my-1 border-t border-border" />
                  <button onClick={async () => { await signOut(); router.navigate({ to: "/auth" }); }} className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-destructive hover:bg-destructive/10"><LogOut className="h-4 w-4" /> Keluar</button>
                </div>
              </>
            )}
          </div>
        </header>

        <main className="flex-1 p-4 md:p-6 lg:p-8">
          <div className="animate-fade-in mx-auto max-w-[1400px]">
            {children ?? <Outlet />}
          </div>
        </main>
      </div>
    </div>
  );
}
