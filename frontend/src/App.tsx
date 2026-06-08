import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import { Link, Navigate, Route, Routes, useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowRight, BarChart3, Bell, BookOpen, Building2, Check, ChevronRight, Clock3, Flame, Heart,
  IndianRupee, LayoutDashboard, LogOut, MapPin, Menu, Moon, Phone, Search, ShieldCheck, Sparkles,
  Star, Sun, TimerReset, Upload, Users, X, Plus, Trash2, MessageSquare, UserPlus, CheckCircle2,
  AlertCircle, BookMarked, Settings, Home as HomeIcon, Zap
} from "lucide-react";
import { api, type Library, type Role } from "./api";
import { AuthProvider, useAuth } from "./auth";

const money = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });

function Brand() {
  return <Link to="/" className="flex items-center gap-2 font-display text-xl font-extrabold tracking-tight">
    <span className="grid h-9 w-9 place-items-center rounded-xl bg-moss text-white"><BookOpen size={19} /></span>
    BookMySeat
  </Link>;
}

function NotificationBell() {
  const { user } = useAuth();
  const { data } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => api<{ unreadCount: number }>("/notifications"),
    enabled: Boolean(user),
    refetchInterval: 30_000
  });
  if (!user) return null;
  return <Link to="/notifications" aria-label="Notifications" className="relative grid h-10 w-10 place-items-center rounded-xl border bg-white/70 transition hover:bg-white dark:bg-white/5 dark:hover:bg-white/10">
    <Bell size={19} />
    {data?.unreadCount ? <span className="absolute -right-1 -top-1 grid min-h-5 min-w-5 place-items-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">{Math.min(data.unreadCount, 99)}</span> : null}
  </Link>;
}

function Header() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const [dark, setDark] = useState(() => localStorage.getItem("bms_theme") === "dark");
  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    localStorage.setItem("bms_theme", dark ? "dark" : "light");
  }, [dark]);
  const dashboard = user?.role === "OWNER" ? "/owner" : user?.role === "ADMIN" ? "/admin" : "/dashboard";
  return <header className="sticky top-0 z-40 border-b bg-cream/90 backdrop-blur-xl dark:bg-[#101713]/90">
    <div className="container-app flex h-18 items-center justify-between py-4">
      <Brand />
      <nav className="hidden items-center gap-7 text-sm font-semibold md:flex">
        <Link to="/discover" className="hover:text-moss">Explore libraries</Link>
        <Link to="/about" className="hover:text-moss">About</Link>
        <Link to="/for-owners" className="hover:text-moss">For owners</Link>
        {user ? <Link to={dashboard} className="hover:text-moss">Dashboard</Link> : null}
      </nav>
      <div className="hidden items-center gap-2 md:flex">
        <button aria-label="Toggle theme" className="grid h-10 w-10 place-items-center rounded-xl hover:bg-black/5 dark:hover:bg-white/10" onClick={() => setDark(!dark)}>
          {dark ? <Sun size={18} /> : <Moon size={18} />}
        </button>
        <NotificationBell />
        {user ? <>
          <span className="max-w-36 truncate px-2 text-sm font-semibold">{user.name}</span>
          <button onClick={logout} className="btn-secondary !px-3 !py-2"><LogOut size={17} /></button>
        </> : <>
          <Link to="/login" className="px-3 py-2 text-sm font-semibold">Log in</Link>
          <Link to="/register" className="btn-primary !px-4 !py-2.5">Get started</Link>
        </>}
      </div>
      <button className="md:hidden" onClick={() => setOpen(!open)}>{open ? <X /> : <Menu />}</button>
    </div>
    {open && <div className="container-app grid gap-2 border-t py-4 md:hidden">
      <Link onClick={() => setOpen(false)} to="/discover" className="py-2 font-semibold">Explore libraries</Link>
      <Link onClick={() => setOpen(false)} to="/about" className="py-2 font-semibold">About</Link>
      <Link onClick={() => setOpen(false)} to="/for-owners" className="py-2 font-semibold">For owners</Link>
      {user ? <><Link onClick={() => setOpen(false)} to={dashboard} className="py-2 font-semibold">Dashboard</Link><button onClick={logout} className="btn-secondary">Log out</button></> :
        <div className="grid grid-cols-2 gap-2"><Link to="/login" className="btn-secondary">Log in</Link><Link to="/register" className="btn-primary">Get started</Link></div>}
    </div>}
  </header>;
}

function Footer() {
  return <footer className="mt-24 bg-ink py-12 text-stone-300 dark:bg-black/30">
    <div className="container-app grid gap-10 md:grid-cols-[1.5fr_1fr_1fr]">
      <div><Brand /><p className="mt-4 max-w-sm text-sm leading-6 text-stone-400">Discover. Study. Succeed.</p></div>
      <div><p className="font-bold text-white">Explore</p><div className="mt-4 grid gap-3 text-sm"><Link to="/discover">Libraries</Link><Link to="/register">Student signup</Link></div></div>
      <div><p className="font-bold text-white">Business</p><div className="mt-4 grid gap-3 text-sm"><Link to="/for-owners">For library owners</Link><Link to="/register?role=OWNER">Owner signup</Link></div></div>
    </div>
  </footer>;
}

function Layout({ children }: { children: ReactNode }) {
  return <><Header /><main>{children}</main><Footer /></>;
}

function HeroSearch() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  return <form onSubmit={(e) => { e.preventDefault(); navigate(`/discover?search=${encodeURIComponent(search)}`); }} className="mx-auto mt-8 flex max-w-2xl flex-col gap-2 rounded-2xl border bg-white p-2 shadow-soft sm:flex-row dark:bg-white/5">
    <div className="flex flex-1 items-center gap-3 px-3"><Search className="text-moss" size={20} /><input value={search} onChange={(e) => setSearch(e.target.value)} className="w-full bg-transparent py-3 outline-none" placeholder="Search by library, area, or facility" /></div>
    <button className="btn-primary">Find a seat <ArrowRight size={18} /></button>
  </form>;
}

function Home() {
  const { data = [] } = useQuery({ queryKey: ["libraries", ""], queryFn: () => api<Library[]>("/libraries") });
  return <Layout>
    <section className="hero-grid relative overflow-hidden py-20 sm:py-28">
      <div className="absolute -right-24 top-10 h-72 w-72 rounded-full bg-leaf/20 blur-3xl" />
      <div className="container-app relative text-center">
        <h1 className="mx-auto mt-5 max-w-4xl font-display text-5xl font-extrabold leading-[1.05] tracking-[-.045em] sm:text-7xl">Find Your <span className="text-moss dark:text-leaf">Perfect Study Seat</span></h1>
        <p className="mx-auto mt-6 max-w-xl text-lg text-stone-600 dark:text-stone-300">Book nearby libraries. Study consistently. Achieve faster.</p>
        <HeroSearch />
      </div>
    </section>
    <section className="container-app py-20">
      <div className="flex items-end justify-between gap-4">
        <div><span className="eyebrow">Nearby & featured</span><h2 className="mt-2 font-display text-3xl font-extrabold sm:text-4xl">Study libraries in Mathura</h2></div>
        <Link to="/discover" className="hidden items-center gap-1 font-semibold text-moss sm:flex">View all <ChevronRight size={18} /></Link>
      </div>
      <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">{data.slice(0, 6).map((library, i) => <LibraryCard key={library.id} library={library} index={i} />)}</div>
    </section>
    <section className="container-app">
      <div className="overflow-hidden rounded-[2rem] bg-moss px-6 py-12 text-white sm:px-12 lg:flex lg:items-center lg:justify-between">
        <div><span className="text-xs font-bold uppercase tracking-[.2em] text-white/70">Built for library owners</span><h2 className="mt-3 max-w-xl font-display text-3xl font-extrabold sm:text-4xl">Students, seats, fees and attendance. One calm workspace.</h2></div>
        <Link to="/for-owners" className="mt-7 inline-flex rounded-xl bg-white px-5 py-3 font-bold text-moss lg:mt-0">See owner tools <ArrowRight className="ml-2" size={18} /></Link>
      </div>
    </section>
  </Layout>;
}

function LibraryVisual({ library }: { library: Library }) {
  const cover = library.images?.find((image) => image.isCover) || library.images?.[0];
  if (cover) return <img src={cover.url} alt={library.name} className="h-full w-full object-cover" />;
  return <div className="relative grid h-full min-h-48 place-items-center overflow-hidden bg-gradient-to-br from-[#d9eadb] via-[#f3edcf] to-[#d5e7e1] dark:from-moss/40 dark:via-stone-800 dark:to-leaf/20">
    <div className="absolute -right-6 -top-8 h-32 w-32 rounded-full border-[22px] border-white/30" />
    <div className="text-center"><BookOpen className="mx-auto text-moss dark:text-leaf" size={42} /><p className="mt-3 font-display text-xl font-extrabold text-ink dark:text-white">{library.name}</p></div>
  </div>;
}

function LibraryCard({ library, index = 0 }: { library: Library; index?: number }) {
  const lowest = Math.min(...library.pricing.map((plan) => plan.amount));
  return <Link to={`/libraries/${library.slug}`} className="card rise group overflow-hidden transition hover:-translate-y-1" style={{ animationDelay: `${index * 70}ms` }}>
    <div className="h-52 overflow-hidden"><LibraryVisual library={library} /></div>
    <div className="p-5">
      <div className="flex items-start justify-between gap-3"><div><h3 className="font-display text-xl font-extrabold">{library.name}</h3><p className="mt-1 flex items-center gap-1 text-sm text-stone-500"><MapPin size={15} /> {library.area}, {library.city}</p></div>
        {library.rating ? <span className="flex items-center gap-1 rounded-lg bg-moss px-2 py-1 text-xs font-bold text-white"><Star size={12} fill="currentColor" /> {library.rating.toFixed(1)}</span> : null}
      </div>
      <div className="mt-4 flex flex-wrap gap-2">{library.facilities.slice(0, 3).map((item) => <span key={item} className="rounded-lg border border-stone-200 bg-stone-100 px-2.5 py-1 text-xs font-semibold text-stone-700 dark:border-white/15 dark:bg-white/10 dark:text-stone-100">{item}</span>)}</div>
      <div className="mt-5 flex items-end justify-between border-t pt-4"><div><span className="text-xs text-stone-500">Starting at</span><p className="font-display text-xl font-extrabold">{money.format(lowest)}<span className="text-xs font-normal text-stone-500">/month</span></p></div><span className="text-sm font-bold text-moss dark:text-leaf">View details</span></div>
    </div>
  </Link>;
}

function Discover() {
  const [params, setParams] = useSearchParams();
  const search = params.get("search") || "";
  const facility = params.get("facility") || "";
  const { data = [], isLoading } = useQuery({
    queryKey: ["libraries", search, facility],
    queryFn: () => api<Library[]>(`/libraries?search=${encodeURIComponent(search)}&facility=${encodeURIComponent(facility)}`)
  });
  return <Layout><section className="container-app py-12">
    <span className="eyebrow">Find your place</span><h1 className="mt-2 font-display text-4xl font-extrabold sm:text-5xl">Explore study libraries</h1>
    <div className="mt-8 grid gap-3 rounded-2xl border bg-white p-3 shadow-soft sm:grid-cols-[1fr_240px] dark:bg-white/5">
      <label className="flex items-center gap-3 px-2"><Search size={20} className="text-moss" /><input className="w-full bg-transparent py-3 outline-none" value={search} onChange={(e) => setParams((old) => { old.set("search", e.target.value); return old; })} placeholder="Library, area, city..." /></label>
      <select className="input" value={facility} onChange={(e) => setParams((old) => { if (e.target.value) old.set("facility", e.target.value); else old.delete("facility"); return old; })}>
        <option value="">All facilities</option><option>AC</option><option>WiFi</option><option>24x7</option><option>RO Water</option><option>CCTV</option>
      </select>
    </div>
    <div className="mt-5 flex items-center justify-between"><p className="text-sm text-stone-500">{isLoading ? "Finding libraries..." : `${data.length} ${data.length === 1 ? "library" : "libraries"} found`}</p><button onClick={() => navigator.geolocation?.getCurrentPosition(() => undefined)} className="flex items-center gap-1.5 text-sm font-semibold text-moss"><MapPin size={16} /> Use my location</button></div>
    <div className="mt-6 grid gap-5 md:grid-cols-2 lg:grid-cols-3">{data.map((library, i) => <LibraryCard key={library.id} library={library} index={i} />)}</div>
    {!isLoading && !data.length && <Empty icon={<Search />} title="No matching libraries" text="Try a different search or remove a facility filter." />}
  </section></Layout>;
}

function LibraryDetails() {
  const { slug } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: library, isLoading } = useQuery({ queryKey: ["library", slug], queryFn: () => api<Library>(`/libraries/${slug}`) });
  const booking = useMutation({
    mutationFn: (planName: string) => api(`/libraries/${library!.id}/bookings`, { method: "POST", body: JSON.stringify({ planName }) }),
    onSuccess: () => alert("Booking request sent. You can track it in your dashboard."),
    onError: (error) => alert(error.message)
  });
  const favorite = useMutation({ mutationFn: () => api(`/libraries/${library!.id}/favorite`, { method: "POST" }), onSuccess: () => queryClient.invalidateQueries({ queryKey: ["student"] }) });
  if (isLoading) return <Layout><div className="container-app py-24 text-center">Loading library...</div></Layout>;
  if (!library) return <Layout><Empty icon={<Building2 />} title="Library not found" text="This listing is unavailable." /></Layout>;
  return <Layout><section className="container-app py-8">
    <Link to="/discover" className="text-sm font-semibold text-moss">← Back to libraries</Link>
    <div className="mt-5 grid gap-5 lg:grid-cols-[1.5fr_1fr]">
      <div className="h-80 overflow-hidden rounded-3xl sm:h-[430px]"><LibraryVisual library={library} /></div>
      <div className="card p-6 sm:p-8">
        <p className="eyebrow">{library.city}, {library.state}</p><h1 className="mt-2 font-display text-4xl font-extrabold">{library.name}</h1>
        <p className="mt-3 flex items-center gap-1.5 text-stone-500"><MapPin size={17} /> {library.address}</p>
        <div className="mt-6 grid gap-3">{library.pricing.map((plan) => <button key={plan.name} onClick={() => user ? booking.mutate(plan.name) : navigate("/login")} className="flex items-center justify-between rounded-2xl border p-4 text-left transition hover:border-moss hover:bg-moss/5"><span><b>{plan.name}</b><span className="mt-1 block text-xs text-stone-500">Monthly plan</span></span><span className="font-display text-xl font-extrabold">{money.format(plan.amount)}</span></button>)}</div>
        <div className="mt-4 grid grid-cols-2 gap-2"><a href={`tel:${library.phone}`} className="btn-primary"><Phone size={17} /> Call owner</a><button onClick={() => user ? favorite.mutate() : navigate("/login")} className="btn-secondary"><Heart size={17} /> Save</button></div>
      </div>
    </div>
    <div className="mt-10 grid gap-10 lg:grid-cols-[1.5fr_1fr]">
      <div><h2 className="font-display text-2xl font-extrabold">About this library</h2><p className="mt-4 leading-7 text-stone-600 dark:text-stone-300">{library.description}</p>
        <h2 className="mt-10 font-display text-2xl font-extrabold">Facilities</h2><div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">{library.facilities.map((item) => <div key={item} className="flex items-center gap-2 rounded-xl border bg-white p-3 text-sm font-semibold text-stone-800 dark:border-white/15 dark:bg-white/10 dark:text-stone-100"><Check size={16} className="text-moss dark:text-emerald-300" /> {item}</div>)}</div>
      </div>
      <aside><div className="rounded-2xl border p-5"><p className="text-sm text-stone-500">Opening hours</p><p className="mt-1 flex items-center gap-2 font-bold"><Clock3 size={18} className="text-moss" /> {library.timings}</p></div>
        {library.announcements?.length ? <div className="mt-4 rounded-2xl border p-5"><p className="font-bold">Announcements</p><div className="mt-3 grid gap-3">{library.announcements.slice(0, 3).map((item) => <div key={item.id} className="border-t pt-3 first:border-0 first:pt-0"><p className="text-sm font-semibold">{item.title}</p><p className="mt-1 text-sm text-stone-500">{item.message}</p></div>)}</div></div> : null}
      </aside>
    </div>
  </section></Layout>;
}

function AuthPage({ mode }: { mode: "login" | "register" }) {
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault(); setBusy(true); setError("");
    const values = Object.fromEntries(new FormData(e.currentTarget).entries()) as Record<string, string>;
    try {
      const user = mode === "login" ? await login(values.email, values.password) : await register(values);
      navigate(user.role === "OWNER" ? "/owner" : user.role === "ADMIN" ? "/admin" : "/dashboard");
    } catch (err) { setError(err instanceof Error ? err.message : "Unable to continue"); } finally { setBusy(false); }
  };
  return <Layout><section className="container-app grid min-h-[70vh] place-items-center py-14">
    <div className="card w-full max-w-md p-7 sm:p-9"><div className="text-center"><span className="eyebrow">{mode === "login" ? "Welcome back" : "Create your account"}</span><h1 className="mt-2 font-display text-3xl font-extrabold">{mode === "login" ? "Log in to BookMySeat" : "Start studying smarter"}</h1></div>
      <form onSubmit={submit} className="mt-8 grid gap-4">
        {mode === "register" && <><Field label="Full name" name="name" required /><Field label="Phone" name="phone" type="tel" /><label><span className="label">I am a</span><select name="role" className="input" defaultValue={params.get("role") || "STUDENT"}><option value="STUDENT">Student</option><option value="OWNER">Library owner</option></select></label></>}
        <Field label="Email address" name="email" type="email" required /><Field label="Password" name="password" type="password" minLength={8} required />
        {error && <p className="rounded-xl bg-red-50 p-3 text-sm font-medium text-red-700">{error}</p>}
        <button disabled={busy} className="btn-primary mt-2">{busy ? "Please wait..." : mode === "login" ? "Log in" : "Create account"} <ArrowRight size={17} /></button>
      </form>
      {mode === "login" && <p className="mt-4 text-center text-sm"><Link className="font-semibold text-moss" to="/forgot-password">Forgot password?</Link></p>}
      <p className="mt-4 text-center text-sm text-stone-500">{mode === "login" ? "New here?" : "Already have an account?"} <Link className="font-bold text-moss" to={mode === "login" ? "/register" : "/login"}>{mode === "login" ? "Create an account" : "Log in"}</Link></p>
    </div>
  </section></Layout>;
}

function Field(props: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  const { label, ...rest } = props;
  return <label><span className="label">{label}</span><input className="input" {...rest} /></label>;
}

function Protected({ role, children }: { role: Role; children: ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="grid min-h-screen place-items-center">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== role) return <Navigate to={user.role === "OWNER" ? "/owner" : user.role === "ADMIN" ? "/admin" : "/dashboard"} replace />;
  return children;
}

function Authenticated({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="grid min-h-screen place-items-center">Loading...</div>;
  return user ? children : <Navigate to="/login" replace />;
}

function StudentDashboardLayout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navItems = [
    { path: "/dashboard", label: "Dashboard", icon: <HomeIcon size={18} /> },
    { path: "/libraries", label: "My Libraries", icon: <BookOpen size={18} /> },
    { path: "/notifications", label: "Notifications", icon: <Bell size={18} /> },
    { path: "/announcements", label: "Announcements", icon: <BookMarked size={18} /> },
    { path: "/group-study", label: "Group Study", icon: <Users size={18} /> },
    { path: "/report-issue", label: "Report Issue", icon: <AlertCircle size={18} /> },
    { path: "/tasks", label: "Tasks", icon: <Zap size={18} /> },
    { path: "/membership", label: "Membership", icon: <Star size={18} /> },
    { path: "/settings", label: "Settings", icon: <Settings size={18} /> },
  ];

  return <div className="min-h-screen bg-[#f2f2ec] dark:bg-[#0d130f] flex flex-col md:flex-row">
    <header className="border-b bg-white dark:bg-[#101713] md:hidden"><div className="container-app flex h-18 items-center justify-between py-4"><Brand /><div className="flex items-center gap-2"><NotificationBell /><button onClick={logout} className="grid h-10 w-10 place-items-center rounded-xl border"><LogOut size={17} /></button></div></div></header>
    <aside className="hidden md:flex w-64 flex-col border-r bg-white dark:bg-[#101713] p-6">
      <Brand />
      <nav className="mt-8 flex-1 space-y-1">{navItems.map(({ path, label, icon }) => (
        <Link key={path} to={path} className={`flex items-center gap-3 rounded-lg px-3 py-2 transition ${location.pathname === path ? "bg-moss/10 text-moss dark:bg-moss/20" : "hover:bg-stone-100 dark:hover:bg-white/5"}`}>{icon}<span className="text-sm font-medium">{label}</span></Link>
      ))}</nav>
      <div className="border-t pt-4"><div className="flex items-center justify-between gap-2 rounded-lg px-3 py-2"><span className="text-sm font-semibold truncate">{user?.name}</span><button onClick={logout} aria-label="Logout" className="grid h-8 w-8 place-items-center rounded hover:bg-stone-100 dark:hover:bg-white/5"><LogOut size={16} /></button></div></div>
    </aside>
    <main className="flex-1 md:pb-0">{children}</main>
  </div>;
}

function StudentDashboard() {
  return <CompactStudentDashboard />;
}

function CompactStudentDashboard() {
  const { user } = useAuth();
  const { data, isLoading } = useQuery({ queryKey: ["student"], queryFn: () => api<any>("/student/dashboard") });
  if (isLoading) return <StudentDashboardLayout><div className="container-app py-16 text-center text-sm text-stone-500">Loading dashboard...</div></StudentDashboardLayout>;

  const activeMemberships = data.memberships.filter((item: any) => item.status === "ACTIVE");
  const currentMembership = activeMemberships[0] || data.memberships[0];
  const pendingRequests = data.bookings.filter((item: any) => ["PENDING", "WAITLISTED"].includes(item.status));
  const unreadNotifications = data.notifications.filter((item: any) => !item.isRead).length;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);
  const weekStart = new Date(today); weekStart.setDate(today.getDate() - today.getDay());
  const sessionsToday = data.sessions.filter((item: any) => {
    const startedAt = new Date(item.startedAt);
    return startedAt >= today && startedAt < tomorrow;
  });
  const weeklyMinutes = data.sessions.reduce((sum: number, item: any) => {
    const startedAt = new Date(item.startedAt);
    return startedAt >= weekStart ? sum + item.durationMin : sum;
  }, 0);
  const todayHours = sessionsToday.reduce((sum: number, item: any) => sum + item.durationMin, 0) / 60;
  const weeklyGoalHours = 20;
  const weeklyGoalPercent = Math.min(100, Math.round((weeklyMinutes / 60 / weeklyGoalHours) * 100));
  const activeGroups = data.groupBookings.filter((item: any) => ["INVITING", "PENDING", "APPROVED"].includes(item.status));
  const pendingInviteCount = data.groupBookings.reduce((sum: number, item: any) => sum + item.members.filter((member: any) => !member.accepted).length, 0);
  const latestAnnouncements = data.announcements.slice(0, 5);
  const firstName = user?.name?.split(" ")[0] || "Student";

  return <StudentDashboardLayout>
    <div className="min-h-screen bg-[#f2f2ec] dark:bg-[#0d130f]">
      <header className="border-b bg-white/90 backdrop-blur dark:bg-[#101713]/90">
        <div className="container-app flex items-center justify-between gap-4 py-4">
          <div className="min-w-0">
            <h1 className="truncate font-display text-2xl font-extrabold sm:text-3xl">Welcome back, {firstName}</h1>
            <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">Stay focused. One session at a time.</p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <NotificationBell />
            <div className="hidden rounded-full border bg-white px-3 py-2 text-xs font-bold text-stone-600 dark:bg-white/5 dark:text-stone-200 sm:block">{unreadNotifications} unread</div>
            <Link to="/settings" aria-label="Profile settings" className="grid h-10 w-10 place-items-center rounded-full bg-moss text-sm font-extrabold text-white">{firstName.charAt(0).toUpperCase()}</Link>
          </div>
        </div>
      </header>

      <main className="container-app py-6">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {[
            [<BookOpen size={18} />, "Active Memberships", String(activeMemberships.length)],
            [<MapPin size={18} />, "Current Seat", currentMembership?.seat?.number || "Unassigned"],
            [<Clock3 size={18} />, "Pending Requests", String(pendingRequests.length)],
            [<Bell size={18} />, "Unread Announcements", String(latestAnnouncements.length)]
          ].map(([icon, label, value]) => <div key={String(label)} className="card flex items-center gap-3 p-4">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-moss/10 text-moss dark:bg-leaf/10 dark:text-leaf">{icon}</span>
            <div className="min-w-0"><p className="text-[11px] font-bold uppercase tracking-wide text-stone-500 dark:text-stone-400">{label}</p><p className="mt-1 truncate text-lg font-extrabold">{value}</p></div>
          </div>)}
        </div>

        <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,7fr)_minmax(280px,3fr)]">
          <section className="card p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div><p className="eyebrow">My Membership</p><h2 className="mt-1 font-display text-xl font-extrabold">{currentMembership?.library?.name || "No active membership"}</h2></div>
              {currentMembership ? <Status value={currentMembership.status} /> : null}
            </div>
            {currentMembership ? <>
              <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-xl border bg-stone-50/60 p-3 dark:bg-white/5"><p className="text-xs text-stone-500">Seat Number</p><p className="mt-1 font-bold">{currentMembership.seat?.number || "Unassigned"}</p></div>
                <div className="rounded-xl border bg-stone-50/60 p-3 dark:bg-white/5"><p className="text-xs text-stone-500">Monthly Fee</p><p className="mt-1 font-bold">{money.format(currentMembership.monthlyFee)}</p></div>
                <div className="rounded-xl border bg-stone-50/60 p-3 dark:bg-white/5"><p className="text-xs text-stone-500">Status</p><p className="mt-1 font-bold">{currentMembership.status.replace("_", " ")}</p></div>
                <div className="rounded-xl border bg-stone-50/60 p-3 dark:bg-white/5"><p className="text-xs text-stone-500">Expiry Date</p><p className="mt-1 font-bold">{currentMembership.endDate ? new Date(currentMembership.endDate).toLocaleDateString() : "Not set"}</p></div>
              </div>
              <div className="mt-5 flex flex-wrap gap-2">
                <Link to={`/libraries/${currentMembership.library.slug || currentMembership.library.id}`} className="btn-primary !px-4 !py-2 text-sm">View Library</Link>
                <a href={`tel:${currentMembership.library.phone}`} className="btn-secondary !px-4 !py-2 text-sm"><Phone size={16} />Contact Owner</a>
                <Link to="/membership" className="btn-secondary !px-4 !py-2 text-sm">Renew Membership</Link>
              </div>
            </> : <div className="mt-5 flex flex-col items-start gap-3 rounded-xl border border-dashed bg-stone-50/70 p-5 dark:bg-white/5">
              <div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-moss/10 text-moss"><BookOpen size={20} /></span><div><p className="font-bold">No active membership</p><p className="text-sm text-stone-500">Explore verified study libraries and request your first seat.</p></div></div>
              <Link to="/discover" className="btn-primary !px-4 !py-2 text-sm">Explore Libraries</Link>
            </div>}
          </section>

          <section className="card p-5">
            <div className="flex items-center justify-between gap-3"><h2 className="font-display text-lg font-extrabold">Recent Announcements</h2><Link to="/announcements" className="text-sm font-bold text-moss dark:text-leaf">View All</Link></div>
            <div className="mt-4 max-h-72 overflow-y-auto pr-1">
              {latestAnnouncements.map((item: any) => <article key={item.id} className="flex gap-3 border-b py-3 last:border-0">
                <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-moss dark:bg-leaf" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold">{item.title}</p>
                  <p className="mt-1 truncate text-xs text-stone-500">{item.library.name} - {new Date(item.createdAt).toLocaleDateString()}</p>
                </div>
              </article>)}
              {!latestAnnouncements.length && <div className="rounded-xl border border-dashed p-5 text-center"><Bell className="mx-auto text-stone-400" size={24} /><p className="mt-2 text-sm font-bold">No announcements yet</p><p className="mt-1 text-xs text-stone-500">Updates from your library will appear here.</p></div>}
            </div>
          </section>
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(280px,420px)]">
          <section className="card p-5">
            <div className="flex items-center justify-between gap-3"><h2 className="font-display text-lg font-extrabold">Today's Study</h2><Flame className="text-moss dark:text-leaf" size={20} /></div>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <div><p className="text-xs text-stone-500">Current Streak</p><p className="mt-1 text-2xl font-extrabold">{data.streak?.currentDays || 0} days</p></div>
              <div><p className="text-xs text-stone-500">Hours Today</p><p className="mt-1 text-2xl font-extrabold">{todayHours.toFixed(1)}</p></div>
              <div><p className="text-xs text-stone-500">Weekly Goal</p><p className="mt-1 text-2xl font-extrabold">{weeklyGoalPercent}%</p></div>
            </div>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-stone-200 dark:bg-white/10"><div className="h-full rounded-full bg-moss dark:bg-leaf" style={{ width: `${weeklyGoalPercent}%` }} /></div>
            <p className="mt-2 text-xs text-stone-500">{Math.round(weeklyMinutes / 60)} of {weeklyGoalHours} focused hours this week</p>
          </section>

          <section className="card p-5">
            <h2 className="font-display text-lg font-extrabold">Quick Actions</h2>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <Link to="/discover" className="btn-secondary !justify-start !px-3 !py-2 text-sm"><Search size={16} />Find Library</Link>
              <Link to="/report-issue" className="btn-secondary !justify-start !px-3 !py-2 text-sm"><AlertCircle size={16} />Report Issue</Link>
              <Link to="/group-study" className="btn-secondary !justify-start !px-3 !py-2 text-sm"><Users size={16} />Create Group</Link>
              <Link to="/membership" className="btn-secondary !justify-start !px-3 !py-2 text-sm"><Star size={16} />Membership</Link>
            </div>
          </section>
        </div>

        <section className="card mt-4 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div><h2 className="font-display text-lg font-extrabold">Group Study</h2><p className="mt-1 text-sm text-stone-500">Coordinate nearby seats without leaving your dashboard.</p></div>
            <div className="flex gap-2"><Link to="/group-study" className="btn-primary !px-4 !py-2 text-sm">Create Group</Link><Link to="/group-study" className="btn-secondary !px-4 !py-2 text-sm">Join Group</Link></div>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border bg-stone-50/60 p-4 dark:bg-white/5"><p className="text-xs font-bold uppercase tracking-wide text-stone-500">Active Groups</p><p className="mt-1 text-2xl font-extrabold">{activeGroups.length}</p></div>
            <div className="rounded-xl border bg-stone-50/60 p-4 dark:bg-white/5"><p className="text-xs font-bold uppercase tracking-wide text-stone-500">Pending Invites</p><p className="mt-1 text-2xl font-extrabold">{pendingInviteCount}</p></div>
          </div>
        </section>
      </main>
    </div>
  </StudentDashboardLayout>;
}

function LegacyStudentDashboard() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["student"], queryFn: () => api<any>("/student/dashboard") });
  const refresh = () => queryClient.invalidateQueries({ queryKey: ["student"] });
  
  if (isLoading) return <StudentDashboardLayout><div className="container-app py-24 text-center">Loading...</div></StudentDashboardLayout>;
  
  return <StudentDashboardLayout>
    <div className="min-h-screen bg-[#f2f2ec] dark:bg-[#0d130f]">
      <header className="border-b bg-white dark:bg-[#101713]"><div className="container-app flex h-18 items-center justify-between py-4"><div className="flex items-center gap-3"><NotificationBell /></div><Link to="/" className="btn-secondary !px-3 !py-2">View site</Link></div></header>
      <main className="container-app py-10">
        <div className="max-w-4xl">
          <h1 className="font-display text-4xl font-extrabold">Welcome back, {data?.user?.name?.split(" ")[0]}</h1>
          <p className="mt-2 text-stone-500">Keep studying. Every session counts toward your goals.</p>
          
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <div className="card p-5">
              <p className="text-xs font-semibold text-stone-500">Active memberships</p>
              <p className="mt-2 font-display text-3xl font-extrabold">{String(data.memberships.filter((item: any) => item.status === "ACTIVE").length)}</p>
            </div>
            <div className="card p-5">
              <p className="text-xs font-semibold text-stone-500">Membership status</p>
              <p className="mt-2 text-sm font-bold">{data.memberships.length > 0 ? data.memberships[0].status : "No active memberships"}</p>
            </div>
            <div className="card p-5">
              <p className="text-xs font-semibold text-stone-500">Pending requests</p>
              <p className="mt-2 font-display text-3xl font-extrabold">{String(data.bookings.filter((item: any) => item.status === "PENDING").length)}</p>
            </div>
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            <div className="card p-6">
              <h2 className="font-display text-xl font-extrabold">Your memberships</h2>
              <div className="mt-4 grid gap-3">
                {data.memberships.map((item: any) => <div key={item.id} className="rounded-xl border p-4">
                  <div className="flex justify-between"><b>{item.library.name}</b><Status value={item.status} /></div>
                  <p className="mt-1 text-sm text-stone-500">Seat {item.seat?.number || "not assigned"} · {money.format(item.monthlyFee)}/month</p>
                </div>)}
                {data.bookings.map((item: any) => <div key={item.id} className="rounded-xl border p-4">
                  <div className="flex justify-between"><b>{item.library.name}</b><Status value={item.status} /></div>
                  <p className="mt-1 text-sm text-stone-500">Booking request · {item.planName || "Plan not selected"}</p>
                </div>)}
                {!data.memberships.length && !data.bookings.length && <p className="py-8 text-center text-sm text-stone-500">No memberships yet. <Link to="/discover" className="font-bold text-moss">Explore libraries</Link></p>}
              </div>
            </div>

            <div className="card p-6">
              <div className="flex items-center justify-between"><h2 className="font-display text-xl font-extrabold">Recent announcements</h2><Link to="/announcements" className="text-sm font-bold text-moss">View all</Link></div>
              <div className="mt-4 grid gap-3">
                {data.announcements.slice(0, 3).map((item: any) => <div key={item.id} className="rounded-xl border p-4 text-sm">
                  <p className="text-xs font-bold uppercase tracking-wide text-moss">{item.library.name}</p>
                  <b className="mt-1 block">{item.title}</b>
                  <p className="mt-1 line-clamp-1 text-stone-500">{item.message}</p>
                </div>)}
                {!data.announcements.length && <p className="py-6 text-center text-sm text-stone-500">No announcements yet.</p>}
              </div>
            </div>
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <Link to="/report-issue" className="card p-6 hover:shadow-lg transition">
              <h2 className="flex items-center gap-2 font-display text-xl font-extrabold"><AlertCircle size={20} />Report an issue</h2>
              <p className="mt-2 text-sm text-stone-500">AC, WiFi, cleanliness, or seat problems? Let your library know.</p>
            </Link>
            <Link to="/group-study" className="card p-6 hover:shadow-lg transition">
              <h2 className="flex items-center gap-2 font-display text-xl font-extrabold"><Users size={20} />Group study</h2>
              <p className="mt-2 text-sm text-stone-500">Create or join a study group with nearby seat allocation.</p>
            </Link>
          </div>
        </div>
      </main>
    </div>
  </StudentDashboardLayout>;
}

function Metric({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return <div className="card flex items-center gap-4 p-5"><span className="grid h-11 w-11 place-items-center rounded-xl bg-moss/10 text-moss">{icon}</span><div><p className="text-xs font-semibold text-stone-500">{label}</p><p className="mt-1 font-display text-2xl font-extrabold">{value}</p></div></div>;
}

function Status({ value }: { value: string }) {
  const good = ["ACTIVE", "APPROVED", "PAID", "PRESENT"].includes(value);
  return <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${good ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>{value.replace("_", " ")}</span>;
}

function CreateLibrary({ onCreated }: { onCreated: () => void }) {
  const [error, setError] = useState("");
  const mutation = useMutation({
    mutationFn: (body: unknown) => api("/libraries", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: onCreated, onError: (err) => setError(err.message)
  });
  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault(); const data = new FormData(e.currentTarget);
    mutation.mutate({
      name: data.get("name"), description: data.get("description"), address: data.get("address"), area: data.get("area"),
      city: data.get("city"), state: data.get("state"), pincode: data.get("pincode") || undefined, phone: data.get("phone"),
      whatsapp: data.get("whatsapp") || undefined, timings: data.get("timings"), capacity: Number(data.get("capacity")) || undefined,
      facilities: String(data.get("facilities")).split(",").map((item) => item.trim()).filter(Boolean),
      pricing: String(data.get("pricing")).split("\n").map((line) => { const [name, amount] = line.split(":"); return { name: name?.trim(), amount: Number(amount) }; }).filter((item) => item.name && Number.isFinite(item.amount))
    });
  };
  return <div className="card p-6 sm:p-8"><h2 className="font-display text-2xl font-extrabold">Add your library</h2><p className="mt-2 text-sm text-stone-500">Once submitted, your complete listing appears publicly.</p>
    <form onSubmit={submit} className="mt-6 grid gap-4 sm:grid-cols-2"><Field label="Library name" name="name" required /><Field label="Contact number" name="phone" required /><Field label="WhatsApp number" name="whatsapp" /><Field label="Seat capacity" name="capacity" type="number" min={1} />
      <Field label="Address" name="address" required /><Field label="Area" name="area" required /><Field label="City" name="city" defaultValue="Mathura" required /><Field label="State" name="state" defaultValue="Uttar Pradesh" required /><Field label="Pincode" name="pincode" /><Field label="Timings" name="timings" placeholder="e.g. 7 AM - 10 PM" required />
      <label className="sm:col-span-2"><span className="label">Description</span><textarea className="input min-h-24" name="description" minLength={20} required /></label>
      <label className="sm:col-span-2"><span className="label">Facilities <span className="font-normal text-stone-400">(comma separated)</span></span><input className="input" name="facilities" placeholder="AC, WiFi, RO Water, CCTV" required /></label>
      <label className="sm:col-span-2"><span className="label">Pricing <span className="font-normal text-stone-400">(one plan per line, Plan: Amount)</span></span><textarea className="input min-h-24" name="pricing" placeholder={"Fixed Seat: 800\nUnfixed Seat: 650"} required /></label>
      {error && <p className="sm:col-span-2 text-sm text-red-600">{error}</p>}<button disabled={mutation.isPending} className="btn-primary sm:col-span-2">{mutation.isPending ? "Publishing..." : "Publish library"} <ArrowRight size={17} /></button>
    </form>
  </div>;
}

function OwnerDashboard() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["owner"], queryFn: () => api<any>("/owner/dashboard") });
  const refresh = () => queryClient.invalidateQueries({ queryKey: ["owner"] });
  if (isLoading) return <DashboardShell title="Library operations" subtitle="Loading your workspace..."><div /></DashboardShell>;
  if (!data.libraries.length) return <DashboardShell title="Welcome, library owner" subtitle="Create your listing and start managing your library."><CreateLibrary onCreated={refresh} /></DashboardShell>;
  const library = data.libraries[0];
  return <DashboardShell title={library.name} subtitle="Manage your library, students, bookings and communication.">
    <div className="grid gap-4 sm:grid-cols-3"><Metric icon={<Users />} label="Students" value={String(library._count.memberships)} /><Metric icon={<BookOpen />} label="Seats" value={String(library._count.seats)} /><Metric icon={<Bell />} label="Booking requests" value={String(library.bookings.filter((item: any) => item.status === "PENDING").length)} /></div>
    <div className="mt-6 grid gap-6 xl:grid-cols-[.9fr_1.1fr]">
      <OwnerActions library={library} refresh={refresh} />
      <div className="card p-6"><div className="flex items-center justify-between"><h2 className="font-display text-xl font-extrabold">Quick access</h2></div>
        <div className="mt-5 grid gap-2"><Link to="/notifications" className="flex items-center justify-between rounded-xl border p-4 hover:bg-stone-50 dark:hover:bg-white/5 transition">
          <span className="font-semibold">Booking requests</span>
          <span className="font-display text-2xl font-extrabold text-moss">{library.bookings.filter((item: any) => item.status === "PENDING").length}</span>
        </Link>
        <Link to="/owner/complaints" className="flex items-center justify-between rounded-xl border p-4 hover:bg-stone-50 dark:hover:bg-white/5 transition">
          <span className="font-semibold">Open complaints</span>
          <span className="font-display text-2xl font-extrabold text-moss">{library.complaints.filter((item: any) => item.status !== "RESOLVED").length}</span>
        </Link></div>
        <p className="mt-5 text-xs text-stone-500">Bookings stay in notifications. Complaints have a dedicated management page.</p>
      </div>
    </div>
    <div className="card mt-6 overflow-hidden"><div className="p-6"><h2 className="font-display text-xl font-extrabold">Students</h2></div><div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="bg-stone-50 text-xs uppercase text-stone-500 dark:bg-white/5"><tr><th className="px-6 py-3">Student</th><th className="px-6 py-3">Seat</th><th className="px-6 py-3">Monthly fee</th><th className="px-6 py-3">Status</th></tr></thead><tbody>{library.memberships.map((item: any) => <tr key={item.id} className="border-t"><td className="px-6 py-4"><b>{item.student.name}</b><br/><span className="text-xs text-stone-500">{item.student.phone || item.student.email}</span></td><td className="px-6 py-4">{item.seat?.number || "Unassigned"}</td><td className="px-6 py-4">{money.format(item.monthlyFee)}</td><td className="px-6 py-4"><Status value={item.status} /></td></tr>)}</tbody></table>{!library.memberships.length && <p className="p-8 text-center text-sm text-stone-500">Add your first student using the form above.</p>}</div></div>
  </DashboardShell>;
}

function OwnerActions({ library, refresh }: { library: any; refresh: () => void }) {
  const [tab, setTab] = useState<"student" | "announcement" | "import">("student");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  
  const submitStudent = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    
    const d = Object.fromEntries(new FormData(e.currentTarget).entries());
    try {
      await api(`/libraries/${library.id}/memberships`, {
        method: "POST",
        body: JSON.stringify({ ...d, monthlyFee: Number(d.monthlyFee) })
      });
      setMessage("Student added successfully.");
      e.currentTarget.reset();
      setTimeout(refresh, 500);
    } catch (err) {
      const errorMsg = (err as Error).message;
      setMessage(errorMsg);
    } finally {
      setLoading(false);
    }
  };
  
  const submitAnnouncement = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    
    const d = Object.fromEntries(new FormData(e.currentTarget).entries());
    try {
      await api(`/libraries/${library.id}/announcements`, {
        method: "POST",
        body: JSON.stringify(d)
      });
      setMessage("Announcement sent to students.");
      e.currentTarget.reset();
      setTimeout(refresh, 500);
    } catch (err) {
      setMessage((err as Error).message || "Failed to send announcement");
    } finally {
      setLoading(false);
    }
  };
  
  const submitImport = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    
    const form = new FormData(e.currentTarget);
    try {
      const result = await api<{ imported: number }>(`/libraries/${library.id}/import`, {
        method: "POST",
        body: form
      });
      setMessage(`${result.imported} students imported successfully.`);
      e.currentTarget.reset();
      setTimeout(refresh, 500);
    } catch (err) {
      setMessage((err as Error).message || "Failed to import students");
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="card p-6">
      <div className="flex gap-1 rounded-xl bg-stone-100 p-1 dark:bg-white/5">
        {(["student", "announcement", "import"] as const).map((item) => (
          <button
            key={item}
            onClick={() => { setTab(item); setMessage(""); }}
            className={`flex-1 rounded-lg px-2 py-2 text-xs font-bold capitalize ${tab === item ? "bg-white shadow dark:bg-white/10" : ""}`}
          >
            {item}
          </button>
        ))}
      </div>
      
      {tab === "student" && (
        <form onSubmit={submitStudent} className="mt-5 grid gap-3">
          <Field label="Student name" name="name" required />
          <Field label="Email" name="email" type="email" required />
          <Field label="Phone" name="phone" />
          <div className="grid grid-cols-2 gap-3">
            <Field label="Seat number" name="seatNumber" />
            <Field label="Monthly fee" name="monthlyFee" type="number" min={0} required />
          </div>
          {message && <p className={`rounded-lg p-3 text-sm font-medium ${message.includes("success") ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>{message}</p>}
          <button disabled={loading} className="btn-primary">{loading ? "Adding student..." : "Add student"}</button>
        </form>
      )}
      
      {tab === "announcement" && (
        <form onSubmit={submitAnnouncement} className="mt-5 grid gap-3">
          <Field label="Title" name="title" required />
          <label>
            <span className="label">Message</span>
            <textarea name="message" className="input min-h-28" required />
          </label>
          {message && <p className={`rounded-lg p-3 text-sm font-medium ${message.includes("success") ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>{message}</p>}
          <button disabled={loading} className="btn-primary">{loading ? "Sending..." : "Send to students"}</button>
        </form>
      )}
      
      {tab === "import" && (
        <form onSubmit={submitImport} className="mt-5 grid gap-3">
          <div className="rounded-xl border border-dashed p-5 text-center">
            <Upload className="mx-auto text-moss" />
            <p className="mt-2 text-sm font-semibold">Upload CSV</p>
            <p className="mt-1 text-xs text-stone-500">Student Name, Phone, Seat Number, Fee Status, Joining Date</p>
            <input name="file" type="file" accept=".csv" className="mt-4 w-full text-xs" required />
          </div>
          {message && <p className={`rounded-lg p-3 text-sm font-medium ${message.includes("success") ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>{message}</p>}
          <button disabled={loading} className="btn-primary">{loading ? "Importing..." : "Import students"}</button>
        </form>
      )}
    </div>
  );
}

function OwnerComplaintsPage() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["owner"], queryFn: () => api<any>("/owner/dashboard") });
  const [filter, setFilter] = useState<"OPEN" | "IN_REVIEW" | "RESOLVED">("OPEN");
  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["owner"] });
    queryClient.invalidateQueries({ queryKey: ["notifications"] });
  };
  const complaints = (data?.libraries || []).flatMap((library: any) => library.complaints.map((complaint: any) => ({ ...complaint, libraryName: library.name })));
  const visible = complaints.filter((complaint: any) => filter === "OPEN" ? complaint.status === "PENDING" : complaint.status === filter);
  const updateComplaint = async (complaint: any, status: "IN_REVIEW" | "RESOLVED") => {
    const ownerReply = prompt(status === "RESOLVED" ? "Resolution response for the student" : "Response to the student (optional)", complaint.ownerReply || "") || undefined;
    await api(`/complaints/${complaint.id}`, { method: "PATCH", body: JSON.stringify({ status, ownerReply }) });
    refresh();
  };

  return <DashboardShell title="Complaint Management" subtitle="Review, respond to and resolve student complaints.">
    <div className="mb-5 flex flex-wrap gap-2">
      {[["OPEN", "Open Complaints"], ["IN_REVIEW", "In Review"], ["RESOLVED", "Resolved"]].map(([id, label]) => (
        <button key={id} onClick={() => setFilter(id as typeof filter)} className={`rounded-xl px-4 py-2 text-sm font-bold ${filter === id ? "bg-moss text-white" : "border bg-white dark:bg-white/5"}`}>{label}</button>
      ))}
    </div>
    <div className="grid gap-4">
      {isLoading ? <p className="card p-8 text-center text-sm text-stone-500">Loading complaints...</p> : visible.map((complaint: any) => (
        <article key={complaint.id} className="card p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[.14em] text-stone-400">{complaint.libraryName} · {complaint.category}</p>
              <h2 className="mt-1 font-display text-xl font-extrabold">{complaint.title}</h2>
              <p className="mt-2 text-sm text-stone-500">{complaint.description}</p>
              <p className="mt-3 text-xs text-stone-400">Student: {complaint.student?.name} · {new Date(complaint.createdAt).toLocaleString()}</p>
            </div>
            <Status value={complaint.status} />
          </div>
          {complaint.ownerReply && <p className="mt-4 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-200">Response: {complaint.ownerReply}</p>}
          {complaint.resolvedAt && <p className="mt-2 text-xs font-semibold text-stone-500">Resolved on {new Date(complaint.resolvedAt).toLocaleString()}</p>}
          {complaint.status !== "RESOLVED" && <div className="mt-4 flex flex-wrap gap-2">
            {complaint.status === "PENDING" && <button onClick={() => updateComplaint(complaint, "IN_REVIEW")} className="btn-secondary !px-3 !py-2 text-sm">Respond</button>}
            <button onClick={() => updateComplaint(complaint, "RESOLVED")} className="btn-primary !px-3 !py-2 text-sm">Mark Resolved</button>
          </div>}
        </article>
      ))}
      {!isLoading && !visible.length && <Empty icon={<MessageSquare />} title="No complaints here" text="Complaints will appear here as students report issues." />}
    </div>
  </DashboardShell>;
}

function AdminDashboard() {
  const { data, isLoading } = useQuery({ queryKey: ["admin"], queryFn: () => api<any>("/admin/dashboard") });
  if (isLoading) return <DashboardShell title="Platform overview" subtitle="Loading platform metrics..."><div /></DashboardShell>;
  return <DashboardShell title="Platform overview" subtitle="Monitor users, libraries and marketplace activity.">
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"><Metric icon={<Users />} label="Users" value={String(data.metrics.users)} /><Metric icon={<Building2 />} label="Libraries" value={String(data.metrics.libraries)} /><Metric icon={<BookOpen />} label="Bookings" value={String(data.metrics.bookings)} /><Metric icon={<BarChart3 />} label="Study sessions" value={String(data.metrics.studySessions)} /></div>
    <div className="card mt-6 overflow-hidden"><div className="p-6"><h2 className="font-display text-xl font-extrabold">Libraries</h2></div><div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="bg-stone-50 dark:bg-white/5"><tr><th className="px-6 py-3">Library</th><th className="px-6 py-3">Owner</th><th className="px-6 py-3">Students</th><th className="px-6 py-3">Status</th></tr></thead><tbody>{data.libraries.map((item: any) => <tr key={item.id} className="border-t"><td className="px-6 py-4 font-bold">{item.name}</td><td className="px-6 py-4">{item.owner?.email || "Seed listing"}</td><td className="px-6 py-4">{item._count.memberships}</td><td className="px-6 py-4"><Status value={item.status} /></td></tr>)}</tbody></table></div></div>
  </DashboardShell>;
}

function DashboardShell({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  const { user, logout } = useAuth();
  const ownerLinks = user?.role === "OWNER" ? [
    { to: "/owner", label: "Dashboard" },
    { to: "/owner/complaints", label: "Complaints" },
    { to: "/notifications", label: "Notifications" },
    { to: "/settings", label: "Settings" }
  ] : [];
  return <div className="min-h-screen bg-[#f2f2ec] dark:bg-[#0d130f]">
    <header className="border-b bg-white dark:bg-[#101713]"><div className="container-app flex min-h-18 flex-wrap items-center justify-between gap-3 py-4"><Brand />{ownerLinks.length ? <nav className="flex flex-wrap items-center gap-2 text-sm font-semibold">{ownerLinks.map((link) => <Link key={link.to} to={link.to} className="rounded-lg px-3 py-2 hover:bg-stone-100 dark:hover:bg-white/10">{link.label}</Link>)}</nav> : null}<div className="flex items-center gap-2"><NotificationBell /><button onClick={logout} className="btn-secondary !px-3 !py-2"><LogOut size={17} /></button></div></div></header>
    <main className="container-app py-10"><h1 className="font-display text-4xl font-extrabold">{title}</h1><p className="mt-2 text-stone-500">{subtitle}</p><div className="mt-8">{children}</div></main>
  </div>;
}

function NotificationsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["notifications"], queryFn: () => api<any>("/notifications") });
  const { data: ownerData } = useQuery({ queryKey: ["owner"], queryFn: () => api<any>("/owner/dashboard"), enabled: user?.role === "OWNER" });
  const refresh = () => { queryClient.invalidateQueries({ queryKey: ["notifications"] }); queryClient.invalidateQueries({ queryKey: ["owner"] }); queryClient.invalidateQueries({ queryKey: ["student"] }); };
  const act = async (notification: any, status: string) => {
    if (notification.type === "COMPLAINT") {
      const ownerReply = prompt("Response to the student (optional)") || undefined;
      await api(`/complaints/${notification.entityId}`, { method: "PATCH", body: JSON.stringify({ status, ownerReply }) });
    } else {
      const group = ownerData?.libraries?.flatMap((library: any) => library.groupBookings).find((item: any) => item.id === notification.entityId);
      await api(`${group ? "/group-bookings" : "/bookings"}/${notification.entityId}`, { method: "PATCH", body: JSON.stringify({ status }) });
    }
    await api(`/notifications/${notification.id}/read`, { method: "PATCH" }); refresh();
  };
  const markRead = async (id: string) => { await api(`/notifications/${id}/read`, { method: "PATCH" }); refresh(); };
  const remove = async (id: string) => { await api(`/notifications/${id}`, { method: "DELETE" }); refresh(); };
  const readAll = async () => { await api("/notifications/read-all", { method: "POST" }); refresh(); };
  return <DashboardShell title="Notifications" subtitle="Bookings, announcements, complaints and account updates in one place.">
    <div className="mx-auto max-w-4xl"><div className="mb-4 flex justify-end"><button onClick={readAll} className="text-sm font-bold text-moss">Mark all as read</button></div>
      <div className="card overflow-hidden">{isLoading ? <p className="p-8 text-center">Loading notifications...</p> : data.notifications.map((item: any) => {
        const booking = ownerData?.libraries?.flatMap((library: any) => library.bookings).find((entry: any) => entry.id === item.entityId);
        const complaint = ownerData?.libraries?.flatMap((library: any) => library.complaints).find((entry: any) => entry.id === item.entityId);
        const group = ownerData?.libraries?.flatMap((library: any) => library.groupBookings).find((entry: any) => entry.id === item.entityId);
        return <div key={item.id} className={`flex gap-4 border-b p-5 last:border-0 ${item.isRead ? "" : "bg-emerald-50/60 dark:bg-emerald-500/5"}`}><span className={`mt-1 grid h-10 w-10 shrink-0 place-items-center rounded-xl ${item.isRead ? "bg-stone-100 text-stone-500 dark:bg-white/10" : "bg-moss text-white"}`}><Bell size={18} /></span>
          <div className="min-w-0 flex-1"><div className="flex flex-wrap items-start justify-between gap-2"><div><p className="font-bold">{item.title}</p><p className="mt-1 text-sm text-stone-500">{item.message}</p><p className="mt-2 text-xs text-stone-400">{new Date(item.createdAt).toLocaleString()}</p></div><Status value={complaint?.status || booking?.status || group?.status || item.type} /></div>
            {user?.role === "OWNER" && booking?.status === "PENDING" && <div className="mt-3 flex gap-2"><button onClick={() => act(item, "APPROVED")} className="btn-primary !px-3 !py-2 text-xs">Accept</button><button onClick={() => act(item, "REJECTED")} className="btn-secondary !px-3 !py-2 text-xs">Reject</button></div>}
            {user?.role === "OWNER" && group?.status === "PENDING" && <div className="mt-3 flex gap-2"><button onClick={() => act(item, "APPROVED")} className="btn-primary !px-3 !py-2 text-xs">Allocate nearby seats</button><button onClick={() => act(item, "REJECTED")} className="btn-secondary !px-3 !py-2 text-xs">Reject group</button></div>}
            {user?.role === "OWNER" && complaint && complaint.status !== "RESOLVED" && <div className="mt-3 flex gap-2"><button onClick={() => act(item, "IN_REVIEW")} className="btn-secondary !px-3 !py-2 text-xs">Review</button><button onClick={() => act(item, "RESOLVED")} className="btn-primary !px-3 !py-2 text-xs">Resolve</button></div>}
          </div><div className="flex shrink-0 gap-1">{!item.isRead && <button aria-label="Mark read" onClick={() => markRead(item.id)} className="grid h-9 w-9 place-items-center rounded-lg hover:bg-black/5 dark:hover:bg-white/10"><CheckCircle2 size={17} /></button>}<button aria-label="Delete notification" onClick={() => remove(item.id)} className="grid h-9 w-9 place-items-center rounded-lg text-stone-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10"><Trash2 size={17} /></button></div>
        </div>;
      })}{!isLoading && !data.notifications.length && <Empty icon={<Bell />} title="You're all caught up" text="New updates will appear here." />}</div>
    </div>
  </DashboardShell>;
}

function AnnouncementsPage() {
  const { data, isLoading } = useQuery({ queryKey: ["student"], queryFn: () => api<any>("/student/dashboard") });
  return <StudentDashboardLayout>
    <div className="min-h-screen bg-[#f2f2ec] dark:bg-[#0d130f]">
      <header className="border-b bg-white dark:bg-[#101713]"><div className="container-app flex h-18 items-center justify-between py-4"><NotificationBell /></div></header>
      <main className="container-app py-10">
        <h1 className="font-display text-3xl font-extrabold">Announcements</h1>
        <p className="mt-2 text-stone-500">Updates from your study libraries.</p>
        <div className="mt-8 mx-auto grid max-w-4xl gap-4">{isLoading ? <p>Loading announcements...</p> : data.announcements.map((item: any) => <article key={item.id} className="card p-6"><div className="flex flex-wrap items-center justify-between gap-2"><p className="eyebrow">{item.library.name}</p><time className="text-xs text-stone-400">{new Date(item.createdAt).toLocaleDateString()}</time></div><h2 className="mt-2 font-display text-xl font-extrabold">{item.title}</h2><p className="mt-3 leading-7 text-stone-600 dark:text-stone-300">{item.message}</p></article>)}{!isLoading && !data.announcements.length && <Empty icon={<Bell />} title="No announcements" text="Updates from your libraries will appear here." />}</div>
      </main>
    </div>
  </StudentDashboardLayout>;
}

function TasksPage() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["student"], queryFn: () => api<any>("/student/dashboard") });
  const refresh = () => queryClient.invalidateQueries({ queryKey: ["student"] });
  const tasks = data?.tasks || [];
  const complete = tasks.filter((task: any) => task.isCompleted).length;
  const progress = tasks.length ? Math.round((complete / tasks.length) * 100) : 0;

  const add = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault(); const form = e.currentTarget; const title = String(new FormData(form).get("title") || "");
    if (!title.trim()) return; await api("/tasks", { method: "POST", body: JSON.stringify({ title }) }); form.reset(); refresh();
  };
  const update = async (id: string, body: object) => { await api(`/tasks/${id}`, { method: "PATCH", body: JSON.stringify(body) }); refresh(); };
  const remove = async (id: string) => { await api(`/tasks/${id}`, { method: "DELETE" }); refresh(); };

  return <StudentDashboardLayout>
    <div className="min-h-screen bg-[#f2f2ec] dark:bg-[#0d130f]">
      <header className="border-b bg-white dark:bg-[#101713]"><div className="container-app flex h-18 items-center justify-between py-4"><NotificationBell /></div></header>
      <main className="container-app py-10">
        <h1 className="font-display text-3xl font-extrabold">Tasks</h1>
        <p className="mt-2 text-stone-500">Track your daily study tasks.</p>
        <div className="mt-8 max-w-2xl">
          <div className="card p-6">
            <div className="flex items-center justify-between"><div><p className="text-sm font-semibold text-stone-500">{complete} completed · {tasks.length - complete} remaining</p></div><b className="text-moss">{progress}%</b></div>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-stone-100 dark:bg-white/10"><div className="h-full rounded-full bg-leaf transition-all" style={{ width: `${progress}%` }} /></div>
            <form onSubmit={add} className="mt-6 flex gap-2"><input name="title" className="input !py-2.5 flex-1" placeholder="Add a task..." required /><button className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-moss text-white"><Plus size={18} /></button></form>
            <div className="mt-6 grid gap-2">{tasks.map((task: any) => <div key={task.id} className="group flex items-center gap-3 rounded-lg border p-4 hover:bg-stone-50 dark:hover:bg-white/5">
              <button onClick={() => update(task.id, { isCompleted: !task.isCompleted })} className={`grid h-5 w-5 shrink-0 place-items-center rounded-md border transition ${task.isCompleted ? "border-moss bg-moss text-white" : ""}`}>{task.isCompleted && <Check size={13} />}</button>
              <button className={`flex-1 text-left text-sm ${task.isCompleted ? "text-stone-400 line-through" : "font-medium"}`} onClick={() => { const title = prompt("Edit task", task.title); if (title?.trim()) update(task.id, { title }); }}>{task.title}</button>
              <button aria-label="Delete task" onClick={() => remove(task.id)} className="text-stone-400 opacity-100 hover:text-red-500 sm:opacity-0 sm:group-hover:opacity-100"><Trash2 size={15} /></button>
            </div>)}
            {!tasks.length && <p className="py-8 text-center text-sm text-stone-500">No tasks yet. Add one to get started.</p>}
            </div>
          </div>
        </div>
      </main>
    </div>
  </StudentDashboardLayout>;
}

function GroupStudyPage() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["student"], queryFn: () => api<any>("/student/dashboard") });
  const refresh = () => queryClient.invalidateQueries({ queryKey: ["student"] });
  const groups = data?.groupBookings || [];
  const [open, setOpen] = useState(false);
  const { data: libraries = [] } = useQuery({ queryKey: ["libraries", "group-booking"], queryFn: () => api<Library[]>("/libraries") });

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault(); const form = e.currentTarget; const values = new FormData(form);
    const members = String(values.get("members") || "").split("\n").map((line) => { const [name, email] = line.split(","); return { name: name?.trim(), email: email?.trim() }; }).filter((item) => item.name && item.email);
    await api("/group-bookings", { method: "POST", body: JSON.stringify({ libraryId: values.get("libraryId"), name: values.get("name"), groupSize: Number(values.get("groupSize")), planName: values.get("planName") || undefined, members }) });
    form.reset(); setOpen(false); refresh();
  };
  const cancel = async (id: string) => { await api(`/group-bookings/${id}`, { method: "PATCH", body: JSON.stringify({ status: "CANCELLED" }) }); refresh(); };
  const invite = async (id: string) => {
    const name = prompt("Friend's name"); if (!name?.trim()) return;
    const email = prompt("Friend's email"); if (!email?.trim()) return;
    await api(`/group-bookings/${id}/members`, { method: "POST", body: JSON.stringify({ name, email }) }); refresh();
  };
  const removeMember = async (groupId: string, memberId: string) => { await api(`/group-bookings/${groupId}/members/${memberId}`, { method: "DELETE" }); refresh(); };

  return <StudentDashboardLayout>
    <div className="min-h-screen bg-[#f2f2ec] dark:bg-[#0d130f]">
      <header className="border-b bg-white dark:bg-[#101713]"><div className="container-app flex h-18 items-center justify-between py-4"><NotificationBell /></div></header>
      <main className="container-app py-10">
        <div className="flex items-center justify-between gap-4"><div><h1 className="font-display text-3xl font-extrabold">Group Study</h1><p className="mt-2 text-stone-500">Study together with nearby seat allocation.</p></div><button onClick={() => setOpen(!open)} className="btn-primary">{open ? "Close" : "Create group"}</button></div>
        <div className="mt-8 max-w-4xl">
          {open && <div className="card mb-6 p-6">
            <h2 className="font-display text-xl font-extrabold mb-4">Create a new group</h2>
            <form onSubmit={submit} className="grid gap-3"><select name="libraryId" className="input" required><option value="">Select library</option>{libraries.map((library) => <option key={library.id} value={library.id}>{library.name}</option>)}</select>
              <div className="grid grid-cols-[1fr_100px] gap-2"><input name="name" className="input" placeholder="Group name" required /><input name="groupSize" type="number" min={2} max={20} className="input" placeholder="Size" required /></div>
              <input name="planName" className="input" placeholder="Preferred plan (optional)" />
              <textarea name="members" className="input min-h-20" placeholder={"Friend name, email\nFriend name, email"} />
              <button className="btn-primary !py-2.5">Request nearby seats</button>
            </form>
          </div>}
          <div className="grid gap-4">{groups.map((group: any) => <div key={group.id} className="card p-6">
            <div className="flex items-center justify-between"><div><b className="text-lg">{group.name}</b><p className="mt-1 text-sm text-stone-500">{group.library.name} · {group.groupSize} seats</p></div><Status value={group.status} /></div>
            {group.members.length ? <div className="mt-4 flex flex-wrap gap-2">{group.members.map((member: any) => <span key={member.id} className="inline-flex items-center gap-2 rounded-lg bg-stone-100 px-3 py-1 text-sm dark:bg-white/10">{member.name}{group.status === "INVITING" && <button aria-label={`Remove ${member.name}`} onClick={() => removeMember(group.id, member.id)}><X size={14} /></button>}</span>)}</div> : null}
            {group.seatNumbers?.length ? <p className="mt-3 text-sm font-bold text-moss">Allocated seats: {group.seatNumbers.join(", ")}</p> : null}
            <div className="mt-4 flex gap-2">{group.status === "INVITING" && group.members.length < group.groupSize - 1 && <button onClick={() => invite(group.id)} className="text-sm font-bold text-moss">Invite friend</button>}{["INVITING", "PENDING"].includes(group.status) && <button onClick={() => cancel(group.id)} className="text-sm font-bold text-red-600">Cancel booking</button>}</div>
          </div>)}
          {!groups.length && !open && <Empty icon={<Users />} title="No groups yet" text="Create a group to book nearby seats for your study friends." />}
          </div>
        </div>
      </main>
    </div>
  </StudentDashboardLayout>;
}

function ReportIssuePage() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["student"], queryFn: () => api<any>("/student/dashboard") });
  const refresh = () => queryClient.invalidateQueries({ queryKey: ["student"] });
  const memberships = data?.memberships || [];
  const complaints = data?.complaints || [];

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault(); const form = e.currentTarget; const values = Object.fromEntries(new FormData(form).entries());
    await api("/complaints", { method: "POST", body: JSON.stringify(values) }); form.reset(); refresh();
  };

  return <StudentDashboardLayout>
    <div className="min-h-screen bg-[#f2f2ec] dark:bg-[#0d130f]">
      <header className="border-b bg-white dark:bg-[#101713]"><div className="container-app flex h-18 items-center justify-between py-4"><NotificationBell /></div></header>
      <main className="container-app py-10">
        <h1 className="font-display text-3xl font-extrabold">Report an Issue</h1>
        <p className="mt-2 text-stone-500">Let your library know about problems so they can fix them quickly.</p>
        <div className="mt-8 max-w-2xl">
          {memberships.length ? <form onSubmit={submit} className="card p-6 grid gap-4">
            <select name="libraryId" className="input" required><option value="">Select your library</option>{memberships.map((item: any) => <option key={item.id} value={item.libraryId}>{item.library.name}</option>)}</select>
            <Field label="Title" name="title" placeholder="Short issue title" required />
            <select name="category" className="input" required><option value="">Select issue type</option><option>AC Issue</option><option>WiFi Issue</option><option>Cleanliness</option><option>Seat Issue</option><option>Noise Complaint</option><option>Other</option></select>
            <textarea name="description" className="input min-h-28" placeholder="Describe the issue in detail..." required />
            <button className="btn-primary !py-2.5">Submit report</button>
          </form> : <div className="card p-6 text-center"><AlertCircle className="mx-auto text-stone-400" size={32} /><p className="mt-4 text-sm text-stone-500">You need an active membership to report issues.</p><Link to="/discover" className="mt-4 inline-block text-sm font-bold text-moss">Find a library</Link></div>}
          {complaints.length > 0 && <div className="mt-6"><h2 className="font-display text-xl font-extrabold mb-4">Your reports</h2><div className="grid gap-3">{complaints.map((complaint: any) => <div key={complaint.id} className="card p-4"><div className="flex items-start justify-between gap-3"><div><span className="font-semibold">{complaint.title}</span><p className="mt-1 text-xs font-semibold uppercase tracking-[.14em] text-stone-400">{complaint.category} · {complaint.library?.name}</p></div><Status value={complaint.status} /></div><p className="mt-2 text-sm text-stone-500">{complaint.description}</p>{complaint.ownerReply && <p className="mt-3 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-200">Owner: {complaint.ownerReply}</p>}{complaint.resolvedAt && <p className="mt-2 text-xs font-semibold text-stone-500">Resolved on {new Date(complaint.resolvedAt).toLocaleString()}</p>}</div>)}</div></div>}
        </div>
      </main>
    </div>
  </StudentDashboardLayout>;
}

function MyLibrariesPage() {
  const { data, isLoading } = useQuery({ queryKey: ["student"], queryFn: () => api<any>("/student/dashboard") });
  const memberships = data?.memberships || [];
  return <StudentDashboardLayout>
    <div className="min-h-screen bg-[#f2f2ec] dark:bg-[#0d130f]">
      <header className="border-b bg-white dark:bg-[#101713]"><div className="container-app flex h-18 items-center justify-between py-4"><NotificationBell /></div></header>
      <main className="container-app py-10">
        <h1 className="font-display text-3xl font-extrabold">My Libraries</h1>
        <p className="mt-2 text-stone-500">Libraries you have active memberships with.</p>
        <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3 max-w-6xl">{memberships.map((item: any) => <div key={item.id} className="card p-6"><h3 className="font-display text-lg font-extrabold">{item.library.name}</h3><p className="mt-1 text-sm text-stone-500">{item.library.area}, {item.library.city}</p><div className="mt-4 flex items-center justify-between"><span className="text-sm"><b>Seat:</b> {item.seat?.number || "Unassigned"}</span><Status value={item.status} /></div><p className="mt-3 text-sm font-semibold">{money.format(item.monthlyFee)}/month</p></div>)}{!memberships.length && <Empty icon={<Building2 />} title="No active memberships" text="Book a library to get started." />}</div>
      </main>
    </div>
  </StudentDashboardLayout>;
}

function MembershipPage() {
  const { data, isLoading } = useQuery({ queryKey: ["student"], queryFn: () => api<any>("/student/dashboard") });
  const memberships = data?.memberships || [];
  return <StudentDashboardLayout>
    <div className="min-h-screen bg-[#f2f2ec] dark:bg-[#0d130f]">
      <header className="border-b bg-white dark:bg-[#101713]"><div className="container-app flex h-18 items-center justify-between py-4"><NotificationBell /></div></header>
      <main className="container-app py-10">
        <h1 className="font-display text-3xl font-extrabold">Membership</h1>
        <p className="mt-2 text-stone-500">Manage your library memberships and plans.</p>
        <div className="mt-8 max-w-4xl">
          {isLoading ? <div className="card p-8 text-center">Loading memberships...</div> : <div className="grid gap-4">
            {memberships.map((item: any) => <div key={item.id} className="card p-6">
              <div className="flex items-start justify-between">
                <div><h3 className="font-display text-lg font-extrabold">{item.library.name}</h3><p className="mt-1 text-sm text-stone-500">{item.library.area}, {item.library.city}</p><p className="mt-3 text-sm"><b>Monthly fee:</b> {money.format(item.monthlyFee)}</p><p className="text-sm"><b>Seat:</b> {item.seat?.number || "Unassigned"}</p></div>
                <Status value={item.status} />
              </div>
            </div>)}
            {!memberships.length && <div className="card p-8 text-center"><Star className="mx-auto text-stone-400" size={32} /><p className="mt-4 text-sm text-stone-500">No memberships yet. Explore libraries and book your first seat.</p><Link to="/discover" className="mt-4 inline-flex btn-primary">Explore libraries</Link></div>}
          </div>}
        </div>
      </main>
    </div>
  </StudentDashboardLayout>;
}

function SettingsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"account" | "profile" | "password" | "notifications" | "library">("account");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [formData, setFormData] = useState({ name: "", phone: "", currentPassword: "", newPassword: "", confirmPassword: "" });
  const [libraryForm, setLibraryForm] = useState({ name: "", address: "", phone: "", timings: "", capacity: "", facilities: "", pricing: "", photos: "" });
  const [settings, setSettings] = useState<any>(null);
  const queryClient = useQueryClient();

  const { data } = useQuery({
    queryKey: ["settings"],
    queryFn: () => api<any>("/settings"),
    enabled: !!user
  });

  useEffect(() => {
    if (data) {
      setSettings(data);
      setFormData(prev => ({ ...prev, name: data.name || "", phone: data.phone || "" }));
      if (data.library) {
        setLibraryForm({
          name: data.library.name || "",
          address: data.library.address || "",
          phone: data.library.phone || "",
          timings: data.library.timings || "",
          capacity: data.library.capacity ? String(data.library.capacity) : "",
          facilities: Array.isArray(data.library.facilities) ? data.library.facilities.join(", ") : "",
          pricing: Array.isArray(data.library.pricing) ? data.library.pricing.map((plan: any) => `${plan.name}: ${plan.amount}`).join("\n") : "",
          photos: Array.isArray(data.library.images) ? data.library.images.map((image: any) => image.url).join("\n") : ""
        });
      }
    }
  }, [data]);

  const updateProfile = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    try {
      await api("/settings", { method: "PATCH", body: JSON.stringify({ name: formData.name, phone: formData.phone }) });
      setMessage("Profile updated successfully.");
      queryClient.invalidateQueries({ queryKey: ["settings"] });
    } catch (err) {
      setMessage((err as Error).message || "Failed to update profile.");
    } finally {
      setLoading(false);
    }
  };

  const changePassword = async (e: FormEvent) => {
    e.preventDefault();
    if (formData.newPassword !== formData.confirmPassword) {
      setMessage("Passwords do not match.");
      return;
    }
    setLoading(true);
    setMessage("");
    try {
      await api("/settings/change-password", {
        method: "POST",
        body: JSON.stringify({ currentPassword: formData.currentPassword, newPassword: formData.newPassword })
      });
      setMessage("Password changed successfully.");
      setFormData(prev => ({ ...prev, currentPassword: "", newPassword: "", confirmPassword: "" }));
    } catch (err) {
      setMessage((err as Error).message || "Failed to change password.");
    } finally {
      setLoading(false);
    }
  };

  const updateNotifications = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    const values = new FormData(e.currentTarget);
    try {
      await api("/settings", {
        method: "PATCH",
        body: JSON.stringify({
          notificationPrefs: {
            announcements: values.has("announcements"),
            bookingUpdates: values.has("bookingUpdates"),
            complaintUpdates: values.has("complaintUpdates"),
            membershipReminders: values.has("membershipReminders")
          }
        })
      });
      setMessage("Notification preferences saved successfully.");
      queryClient.invalidateQueries({ queryKey: ["settings"] });
    } catch (err) {
      setMessage((err as Error).message || "Failed to save preferences.");
    } finally {
      setLoading(false);
    }
  };

  const updateLibrary = async (e: FormEvent) => {
    e.preventDefault();
    if (!settings.library?.id) return;
    setLoading(true);
    setMessage("");
    try {
      await api("/settings/owner", {
        method: "PATCH",
        body: JSON.stringify({
          name: libraryForm.name,
          address: libraryForm.address,
          phone: libraryForm.phone,
          timings: libraryForm.timings,
          capacity: Number(libraryForm.capacity) || undefined,
          facilities: libraryForm.facilities.split(",").map((item) => item.trim()).filter(Boolean),
          pricing: libraryForm.pricing.split("\n").map((line) => {
            const [name, amount] = line.split(":");
            return { name: name?.trim(), amount: Number(amount) };
          }).filter((item) => item.name && Number.isFinite(item.amount)),
          images: libraryForm.photos.split("\n").map((item) => item.trim()).filter(Boolean)
        })
      });
      setMessage("Library settings saved successfully.");
      queryClient.invalidateQueries({ queryKey: ["settings"] });
      queryClient.invalidateQueries({ queryKey: ["owner"] });
    } catch (err) {
      setMessage((err as Error).message || "Failed to save library settings.");
    } finally {
      setLoading(false);
    }
  };

  if (!user) return <Navigate to="/login" />;
  if (!settings) return <StudentDashboardLayout><div className="container-app py-24 text-center">Loading settings...</div></StudentDashboardLayout>;

  return <StudentDashboardLayout>
    <div className="min-h-screen bg-[#f2f2ec] dark:bg-[#0d130f]">
      <header className="border-b bg-white dark:bg-[#101713]"><div className="container-app flex h-18 items-center justify-between py-4"><NotificationBell /></div></header>
      <main className="container-app py-10">
        <div className="max-w-4xl">
          <h1 className="font-display text-3xl font-extrabold">Settings</h1>
          <p className="mt-2 text-stone-500">Manage your account, security, and preferences.</p>

          <div className="mt-8 flex flex-col gap-6 lg:flex-row">
            <nav className="lg:w-48">
              <div className="grid gap-1">
                {[
                  { id: "account" as const, label: "Account", icon: <ShieldCheck size={18} /> },
                  { id: "profile" as const, label: "Profile", icon: <Users size={18} /> },
                  ...(user.role === "OWNER" ? [{ id: "library" as const, label: "Library", icon: <Building2 size={18} /> }] : []),
                  { id: "password" as const, label: "Password", icon: <TimerReset size={18} /> },
                  { id: "notifications" as const, label: "Notifications", icon: <Bell size={18} /> }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => { setActiveTab(tab.id); setMessage(""); }}
                    className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm transition ${activeTab === tab.id ? "bg-moss text-white" : "hover:bg-stone-100 dark:hover:bg-white/5"}`}
                  >
                    {tab.icon} {tab.label}
                  </button>
                ))}
              </div>
            </nav>

            <div className="flex-1">
              {activeTab === "account" && (
                <div className="card p-6">
                  <h2 className="font-display text-xl font-extrabold mb-4">Account Information</h2>
                  <div className="grid gap-4">
                    <div><span className="text-sm text-stone-500">Email</span><p className="font-semibold">{settings.email}</p></div>
                    <div><span className="text-sm text-stone-500">Account Type</span><p className="font-semibold capitalize">{user.role === "STUDENT" ? "Student" : "Library Owner"}</p></div>
                    <div><span className="text-sm text-stone-500">Member Since</span><p className="font-semibold">{new Date(settings.createdAt).toLocaleDateString()}</p></div>
                    {user.role === "STUDENT" && settings.currentMembership && <>
                      <div><span className="text-sm text-stone-500">Current Library</span><p className="font-semibold">{settings.currentMembership.library?.name}</p></div>
                      <div><span className="text-sm text-stone-500">Seat Number</span><p className="font-semibold">{settings.currentMembership.seat?.number || "Unassigned"}</p></div>
                      <div><span className="text-sm text-stone-500">Membership Status</span><p className="font-semibold">{settings.currentMembership.status}</p></div>
                      <div><span className="text-sm text-stone-500">Membership Expiry</span><p className="font-semibold">{settings.currentMembership.endDate ? new Date(settings.currentMembership.endDate).toLocaleDateString() : "Not set"}</p></div>
                    </>}
                  </div>
                </div>
              )}

              {activeTab === "profile" && (
                <div className="card p-6">
                  <h2 className="font-display text-xl font-extrabold mb-4">Edit Profile</h2>
                  <form onSubmit={updateProfile} className="grid gap-4">
                    <Field label="Full name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
                    <Field label="Phone" type="tel" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
                    {message && <p className={`rounded-lg p-3 text-sm ${message.includes("success") ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>{message}</p>}
                    <button disabled={loading} className="btn-primary">{loading ? "Saving..." : "Save Changes"}</button>
                  </form>
                </div>
              )}

              {activeTab === "password" && (
                <div className="card p-6">
                  <h2 className="font-display text-xl font-extrabold mb-4">Change Password</h2>
                  <form onSubmit={changePassword} className="grid gap-4">
                    <Field label="Current Password" type="password" value={formData.currentPassword} onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })} required />
                    <Field label="New Password" type="password" minLength={8} value={formData.newPassword} onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })} required />
                    <Field label="Confirm Password" type="password" minLength={8} value={formData.confirmPassword} onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })} required />
                    {message && <p className={`rounded-lg p-3 text-sm ${message.includes("success") ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>{message}</p>}
                    <button disabled={loading} className="btn-primary">{loading ? "Changing..." : "Change Password"}</button>
                  </form>
                </div>
              )}

              {activeTab === "library" && user.role === "OWNER" && (
                <div className="card p-6">
                  <h2 className="font-display text-xl font-extrabold mb-4">Library Settings</h2>
                  {settings.library ? <form onSubmit={updateLibrary} className="grid gap-4 sm:grid-cols-2">
                    <Field label="Library name" value={libraryForm.name} onChange={(e) => setLibraryForm({ ...libraryForm, name: e.target.value })} required />
                    <Field label="Contact number" value={libraryForm.phone} onChange={(e) => setLibraryForm({ ...libraryForm, phone: e.target.value })} required />
                    <Field label="Address" value={libraryForm.address} onChange={(e) => setLibraryForm({ ...libraryForm, address: e.target.value })} required />
                    <Field label="Timings" value={libraryForm.timings} onChange={(e) => setLibraryForm({ ...libraryForm, timings: e.target.value })} required />
                    <Field label="Capacity" type="number" min={1} value={libraryForm.capacity} onChange={(e) => setLibraryForm({ ...libraryForm, capacity: e.target.value })} />
                    <label><span className="label">Facilities</span><input className="input" value={libraryForm.facilities} onChange={(e) => setLibraryForm({ ...libraryForm, facilities: e.target.value })} required /></label>
                    <label className="sm:col-span-2"><span className="label">Fees</span><textarea className="input min-h-24" value={libraryForm.pricing} onChange={(e) => setLibraryForm({ ...libraryForm, pricing: e.target.value })} required /></label>
                    <label className="sm:col-span-2"><span className="label">Photo URLs</span><textarea className="input min-h-24" value={libraryForm.photos} onChange={(e) => setLibraryForm({ ...libraryForm, photos: e.target.value })} /></label>
                    {message && <p className={`sm:col-span-2 rounded-lg p-3 text-sm ${message.includes("success") ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>{message}</p>}
                    <button disabled={loading} className="btn-primary sm:col-span-2">{loading ? "Saving..." : "Save Library Settings"}</button>
                  </form> : <p className="text-sm text-stone-500">Create a library from the owner dashboard before editing library settings.</p>}
                </div>
              )}

              {activeTab === "notifications" && (
                <div className="card p-6">
                  <h2 className="font-display text-xl font-extrabold mb-4">Notification Preferences</h2>
                  <form onSubmit={updateNotifications} className="grid gap-4">
                    <label className="flex items-center gap-3">
                      <input name="announcements" type="checkbox" defaultChecked={settings.notificationPrefs?.announcements ?? true} className="w-4 h-4" />
                      <div><p className="font-semibold">Library Announcements</p><p className="text-xs text-stone-500">Get updates about library news and events</p></div>
                    </label>
                    <label className="flex items-center gap-3">
                      <input name="bookingUpdates" type="checkbox" defaultChecked={settings.notificationPrefs?.bookingUpdates ?? true} className="w-4 h-4" />
                      <div><p className="font-semibold">Booking Updates</p><p className="text-xs text-stone-500">Updates on your booking requests</p></div>
                    </label>
                    <label className="flex items-center gap-3">
                      <input name="complaintUpdates" type="checkbox" defaultChecked={settings.notificationPrefs?.complaintUpdates ?? true} className="w-4 h-4" />
                      <div><p className="font-semibold">Complaint Updates</p><p className="text-xs text-stone-500">Status updates on your complaints</p></div>
                    </label>
                    <label className="flex items-center gap-3">
                      <input name="membershipReminders" type="checkbox" defaultChecked={settings.notificationPrefs?.membershipReminders ?? true} className="w-4 h-4" />
                      <div><p className="font-semibold">Membership Reminders</p><p className="text-xs text-stone-500">Renewal and expiry reminders</p></div>
                    </label>
                    {message && <p className={`rounded-lg p-3 text-sm ${message.includes("success") ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>{message}</p>}
                    <button disabled={loading} className="btn-primary">{loading ? "Saving..." : "Save Preferences"}</button>
                  </form>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  </StudentDashboardLayout>;
}

function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setError("");

    try {
      await api("/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email })
      });
      setMessage("Password reset link sent. Check your email.");
      setTimeout(() => navigate("/login"), 3000);
    } catch (err) {
      setError((err as Error).message || "Failed to send reset link.");
    } finally {
      setLoading(false);
    }
  };

  return <Layout>
    <section className="container-app grid min-h-[70vh] place-items-center py-14">
      <div className="card w-full max-w-md p-7 sm:p-9">
        <div className="text-center">
          <span className="eyebrow">Recover Account</span>
          <h1 className="mt-2 font-display text-3xl font-extrabold">Forgot Password</h1>
          <p className="mt-2 text-sm text-stone-500">Enter your email to receive a password reset link</p>
        </div>
        <form onSubmit={handleSubmit} className="mt-8 grid gap-4">
          <Field label="Email address" name="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          {message && <p className="rounded-xl bg-green-50 p-3 text-sm font-medium text-green-700">{message}</p>}
          {error && <p className="rounded-xl bg-red-50 p-3 text-sm font-medium text-red-700">{error}</p>}
          <button disabled={loading} className="btn-primary">{loading ? "Sending..." : "Send Reset Link"}</button>
        </form>
        <p className="mt-6 text-center text-sm text-stone-500">
          Remember your password? <Link className="font-bold text-moss" to="/login">Log in</Link>
        </p>
      </div>
    </section>
  </Layout>;
}

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const token = params.get("token");
  const email = params.get("email");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (!token || !email) {
    return <Layout><Empty icon={<AlertCircle />} title="Invalid Link" text="The password reset link is invalid or expired." /></Layout>;
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    
    setLoading(true);
    setMessage("");
    setError("");

    try {
      await api("/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({ token, email, newPassword: password })
      });
      setMessage("Password reset successful! Redirecting to login...");
      setTimeout(() => navigate("/login"), 2000);
    } catch (err) {
      setError((err as Error).message || "Failed to reset password.");
    } finally {
      setLoading(false);
    }
  };

  return <Layout>
    <section className="container-app grid min-h-[70vh] place-items-center py-14">
      <div className="card w-full max-w-md p-7 sm:p-9">
        <div className="text-center">
          <span className="eyebrow">Reset Password</span>
          <h1 className="mt-2 font-display text-3xl font-extrabold">Set New Password</h1>
        </div>
        <form onSubmit={handleSubmit} className="mt-8 grid gap-4">
          <Field label="New Password" type="password" minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} required />
          <Field label="Confirm Password" type="password" minLength={8} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
          {message && <p className="rounded-xl bg-green-50 p-3 text-sm font-medium text-green-700">{message}</p>}
          {error && <p className="rounded-xl bg-red-50 p-3 text-sm font-medium text-red-700">{error}</p>}
          <button disabled={loading} className="btn-primary">{loading ? "Resetting..." : "Reset Password"}</button>
        </form>
      </div>
    </section>
  </Layout>;
}

function About() {
  return <Layout><section className="container-app py-16 sm:py-24"><div className="mx-auto max-w-3xl text-center"><span className="eyebrow">About BookMySeat</span><h1 className="mt-4 font-display text-5xl font-extrabold tracking-tight">Discover. Study. Succeed.</h1><p className="mt-6 text-lg leading-8 text-stone-600 dark:text-stone-300">BookMySeat connects students with focused study libraries and gives library owners one place to run daily operations.</p></div>
    <div className="mx-auto mt-14 grid max-w-5xl gap-5 md:grid-cols-2">{[
      ["Why it was built", "Finding the right study environment should be simple, and running a library should not depend on scattered registers and messages."],
      ["For students", "Compare real libraries, request seats, follow announcements, build study streaks and stay accountable with focused daily tools."],
      ["For library owners", "Manage listings, students, seats, bookings, attendance, fees, complaints and communication from one workspace."],
      ["Our vision", "Build India's trusted operating platform for study libraries and the students who rely on them."]
    ].map(([title, text]) => <article key={title} className="card p-7"><h2 className="font-display text-2xl font-extrabold">{title}</h2><p className="mt-3 leading-7 text-stone-500">{text}</p></article>)}</div>
    <div className="mx-auto mt-10 max-w-5xl rounded-3xl bg-moss p-8 text-white"><h2 className="font-display text-2xl font-extrabold">Contact BookMySeat</h2><p className="mt-2 text-white/80">Students can contact library owners directly from each listing. Registered owners and students receive platform updates through their notification center.</p><div className="mt-5 flex flex-wrap gap-3"><Link to="/discover" className="rounded-xl bg-white px-5 py-3 font-bold text-moss">Explore libraries</Link><Link to="/for-owners" className="rounded-xl border border-white/30 px-5 py-3 font-bold">For owners</Link></div></div>
  </section></Layout>;
}

function ForOwners() {
  return <Layout><section className="container-app py-20 text-center"><span className="eyebrow">BookMySeat for owners</span><h1 className="mx-auto mt-4 max-w-4xl font-display text-5xl font-extrabold tracking-tight sm:text-6xl">Run your study library from one clear dashboard.</h1><p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-stone-500">Publish your listing, accept booking requests, assign seats, manage students, track fees, mark attendance and send announcements.</p><Link to="/register?role=OWNER" className="btn-primary mt-8">Create owner account <ArrowRight size={18} /></Link>
    <div className="mt-16 grid gap-5 text-left md:grid-cols-3">{[
      [<Users />, "Student management", "Keep student contacts, seat assignments and memberships organized."],
      [<IndianRupee />, "Fees and attendance", "Record payment status and daily attendance without scattered registers."],
      [<Sparkles />, "Grow discovery", "Create your own public listing and receive new booking requests directly."]
    ].map(([icon, title, text]) => <div key={String(title)} className="card p-7"><span className="grid h-12 w-12 place-items-center rounded-xl bg-moss/10 text-moss">{icon}</span><h2 className="mt-5 font-display text-xl font-extrabold">{title}</h2><p className="mt-2 text-sm leading-6 text-stone-500">{text}</p></div>)}</div>
  </section></Layout>;
}

function Empty({ icon, title, text }: { icon: ReactNode; title: string; text: string }) {
  return <div className="container-app py-24 text-center"><span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-moss/10 text-moss">{icon}</span><h2 className="mt-4 font-display text-2xl font-extrabold">{title}</h2><p className="mt-2 text-stone-500">{text}</p></div>;
}

function AppRoutes() {
  return <Routes>
    <Route path="/" element={<Home />} /><Route path="/discover" element={<Discover />} /><Route path="/libraries/:slug" element={<LibraryDetails />} />
    <Route path="/about" element={<About />} /><Route path="/login" element={<AuthPage mode="login" />} /><Route path="/register" element={<AuthPage mode="register" />} /><Route path="/for-owners" element={<ForOwners />} />
    <Route path="/forgot-password" element={<ForgotPasswordPage />} /><Route path="/reset-password" element={<ResetPasswordPage />} />
    <Route path="/dashboard" element={<Protected role="STUDENT"><StudentDashboard /></Protected>} />
    <Route path="/tasks" element={<Protected role="STUDENT"><TasksPage /></Protected>} />
    <Route path="/group-study" element={<Protected role="STUDENT"><GroupStudyPage /></Protected>} />
    <Route path="/report-issue" element={<Protected role="STUDENT"><ReportIssuePage /></Protected>} />
    <Route path="/libraries" element={<Protected role="STUDENT"><MyLibrariesPage /></Protected>} />
    <Route path="/membership" element={<Protected role="STUDENT"><MembershipPage /></Protected>} />
    <Route path="/settings" element={<Authenticated><SettingsPage /></Authenticated>} />
    <Route path="/owner" element={<Protected role="OWNER"><OwnerDashboard /></Protected>} />
    <Route path="/owner/complaints" element={<Protected role="OWNER"><OwnerComplaintsPage /></Protected>} />
    <Route path="/admin" element={<Protected role="ADMIN"><AdminDashboard /></Protected>} />
    <Route path="/notifications" element={<Authenticated><NotificationsPage /></Authenticated>} />
    <Route path="/announcements" element={<Protected role="STUDENT"><AnnouncementsPage /></Protected>} />
    <Route path="*" element={<Layout><Empty icon={<MapPin />} title="Page not found" text="The page you requested does not exist." /></Layout>} />
  </Routes>;
}

export default function App() {
  return <AuthProvider><AppRoutes /></AuthProvider>;
}
