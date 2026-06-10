import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import { Link, Navigate, Route, Routes, useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowRight, BarChart3, Bell, BookOpen, Building2, Check, ChevronRight, Clock3, Flame, Heart,
  Download, IndianRupee, LayoutDashboard, LogOut, MapPin, Menu, Moon, Phone, Search, ShieldCheck, Sparkles,
  Star, Sun, TimerReset, Upload, Users, X, Plus, Trash2, MessageSquare, UserPlus, CheckCircle2,
  AlertCircle, BookMarked, Settings, Home as HomeIcon, Zap, Image as ImageIcon, Navigation, Flag, ThumbsUp, Send, Ban,
  Paperclip, Smile, Reply, FileText, Video, MoreVertical, Award, Crown, ShieldAlert, UserCircle, MessageCircle, Megaphone
} from "lucide-react";
import { api, type CommunityChannel, type CommunityConnection, type CommunityMessage, type Library, type Role } from "./api";
import { AuthProvider, useAuth } from "./auth";
import { isIosSafari, isStandaloneDisplay, type BeforeInstallPromptEvent } from "./pwa";

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

function InstallPrompt() {
  const [prompt, setPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showIosHint, setShowIosHint] = useState(false);
  const [dismissed, setDismissed] = useState(() => localStorage.getItem("bms_install_prompt_dismissed") === "true");

  useEffect(() => {
    if (isStandaloneDisplay() || dismissed) return;

    const handlePrompt = (event: Event) => {
      event.preventDefault();
      setPrompt(event as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handlePrompt);
    setShowIosHint(isIosSafari());

    return () => window.removeEventListener("beforeinstallprompt", handlePrompt);
  }, [dismissed]);

  if (dismissed || isStandaloneDisplay() || (!prompt && !showIosHint)) return null;

  const dismiss = () => {
    localStorage.setItem("bms_install_prompt_dismissed", "true");
    setDismissed(true);
  };

  const install = async () => {
    if (!prompt) return;
    await prompt.prompt();
    const choice = await prompt.userChoice;
    if (choice.outcome === "accepted") dismiss();
    setPrompt(null);
  };

  return <div className="relative">
    {prompt ? <button type="button" onClick={install} className="btn-secondary !px-3 !py-2 text-sm" aria-label="Install BookMySeat">
      <Download size={17} /> <span className="hidden lg:inline">Install</span>
    </button> : <div className="flex items-center gap-2 rounded-xl border bg-white/80 px-3 py-2 text-xs font-semibold shadow-soft dark:bg-white/10">
      <Download size={16} className="text-moss dark:text-leaf" />
      <span>Add to Home Screen</span>
      <button type="button" onClick={dismiss} aria-label="Dismiss install prompt" className="grid h-6 w-6 place-items-center rounded-lg hover:bg-black/5 dark:hover:bg-white/10"><X size={14} /></button>
    </div>}
  </div>;
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
        <InstallPrompt />
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
      <InstallPrompt />
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
        {library.rating ? <span className="flex shrink-0 items-center gap-1 rounded-lg bg-moss px-2 py-1 text-xs font-bold text-white"><Star size={12} fill="currentColor" /> {library.rating.toFixed(1)} <span className="hidden sm:inline">({library.reviewCount ?? 0} Reviews)</span></span> : null}
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
  const { data: eligibility } = useQuery({
    queryKey: ["review-eligibility", library?.id],
    queryFn: () => api<{ eligible: boolean; review?: { rating: number; comment?: string } }>(`/libraries/${library!.id}/review-eligibility`),
    enabled: Boolean(user?.role === "STUDENT" && library?.id)
  });
  const booking = useMutation({
    mutationFn: (planName: string) => api(`/libraries/${library!.id}/bookings`, { method: "POST", body: JSON.stringify({ planName }) }),
    onSuccess: () => alert("Booking request sent. You can track it in your dashboard."),
    onError: (error) => alert(error.message)
  });
  const favorite = useMutation({ mutationFn: () => api(`/libraries/${library!.id}/favorite`, { method: "POST" }), onSuccess: () => queryClient.invalidateQueries({ queryKey: ["student"] }) });
  if (isLoading) return <Layout><div className="container-app py-24 text-center">Loading library...</div></Layout>;
  if (!library) return <Layout><Empty icon={<Building2 />} title="Library not found" text="This listing is unavailable." /></Layout>;
  const gallery = library.images || [];
  return <Layout><section className="container-app py-8">
    <Link to="/discover" className="text-sm font-semibold text-moss">← Back to libraries</Link>
    <div className="mt-5 grid gap-5 lg:grid-cols-[1.5fr_1fr]">
      <div className="grid gap-3">
        <div className="h-80 overflow-hidden rounded-3xl sm:h-[430px]"><LibraryVisual library={library} /></div>
        {gallery.length > 1 && <div className="grid grid-cols-4 gap-2">{gallery.slice(0, 4).map((image) => <div key={image.id} className="aspect-[4/3] overflow-hidden rounded-xl border bg-white"><img src={image.url} alt={image.alt || library.name} className="h-full w-full object-cover" /></div>)}</div>}
      </div>
      <div className="card p-6 sm:p-8">
        <p className="eyebrow">{library.city}, {library.state}</p><h1 className="mt-2 font-display text-4xl font-extrabold">{library.name}</h1>
        {library.rating ? <p className="mt-3 flex items-center gap-1 text-sm font-bold text-moss"><Star size={16} fill="currentColor" /> {library.rating.toFixed(1)} ({library.reviewCount ?? 0} Reviews)</p> : null}
        <p className="mt-3 flex items-start gap-1.5 text-stone-500"><MapPin size={17} className="mt-0.5 shrink-0" /> <span>{library.address}, {library.area}, {library.city}, {library.state}</span></p>
        <div className="mt-6 grid gap-3">{library.pricing.map((plan) => <button key={plan.name} onClick={() => user ? booking.mutate(plan.name) : navigate("/login")} className="flex items-center justify-between rounded-2xl border p-4 text-left transition hover:border-moss hover:bg-moss/5"><span><b>{plan.name}</b><span className="mt-1 block text-xs text-stone-500">Monthly plan</span></span><span className="font-display text-xl font-extrabold">{money.format(plan.amount)}</span></button>)}</div>
        <div className="mt-4 grid grid-cols-2 gap-2"><a href={`tel:${library.phone}`} className="btn-primary"><Phone size={17} /> Call owner</a><a href={library.mapsUrl} target="_blank" rel="noreferrer" className="btn-secondary"><Navigation size={17} /> Maps</a><button onClick={() => user ? favorite.mutate() : navigate("/login")} className="btn-secondary col-span-2"><Heart size={17} /> Save</button></div>
      </div>
    </div>
    <div className="mt-10 grid gap-10 lg:grid-cols-[1.5fr_1fr]">
      <div><h2 className="font-display text-2xl font-extrabold">About this library</h2><p className="mt-4 leading-7 text-stone-600 dark:text-stone-300">{library.description}</p>
        <h2 className="mt-10 font-display text-2xl font-extrabold">Facilities</h2><div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">{library.facilities.map((item) => <div key={item} className="flex items-center gap-2 rounded-xl border bg-white p-3 text-sm font-semibold text-stone-800 dark:border-white/15 dark:bg-white/10 dark:text-stone-100"><Check size={16} className="text-moss dark:text-emerald-300" /> {item}</div>)}</div>
        <h2 className="mt-10 font-display text-2xl font-extrabold">Reviews</h2>
        {user?.role === "STUDENT" && eligibility?.eligible ? <ReviewForm libraryId={library.id} existing={eligibility.review} onDone={() => queryClient.invalidateQueries({ queryKey: ["library", slug] })} /> : <p className="mt-3 rounded-2xl border bg-white p-4 text-sm text-stone-500 dark:bg-white/5">Verified students with an approved membership or library usage can leave reviews.</p>}
        <div className="mt-5 grid gap-3">{library.reviews?.length ? library.reviews.map((review) => <article key={review.id} className="rounded-2xl border bg-white p-4 dark:bg-white/5"><div className="flex items-center justify-between"><p className="font-bold">{review.student?.name || "Student"}</p><span className="flex items-center gap-1 text-sm font-bold text-moss"><Star size={14} fill="currentColor" /> {review.rating}</span></div>{review.comment && <p className="mt-2 text-sm leading-6 text-stone-600 dark:text-stone-300">{review.comment}</p>}</article>) : <p className="text-sm text-stone-500">No reviews yet.</p>}</div>
      </div>
      <aside><div className="rounded-2xl border p-5"><p className="text-sm text-stone-500">Opening hours</p><p className="mt-1 flex items-center gap-2 font-bold"><Clock3 size={18} className="text-moss" /> {library.timings}</p></div>
        <div className="mt-4 rounded-2xl border p-5"><p className="font-bold">Location</p><p className="mt-2 text-sm leading-6 text-stone-500">{library.address}, {library.area}, {library.city}, {library.state}</p><a href={library.mapsUrl} target="_blank" rel="noreferrer" className="btn-secondary mt-4 w-full"><Navigation size={17} /> Open in Maps</a></div>
        {library.announcements?.length ? <div className="mt-4 rounded-2xl border p-5"><p className="font-bold">Announcements</p><div className="mt-3 grid gap-3">{library.announcements.slice(0, 3).map((item) => <div key={item.id} className="border-t pt-3 first:border-0 first:pt-0"><p className="text-sm font-semibold">{item.title}</p><p className="mt-1 text-sm text-stone-500">{item.message}</p></div>)}</div></div> : null}
      </aside>
    </div>
  </section></Layout>;
}

function ReviewForm({ libraryId, existing, onDone }: { libraryId: string; existing?: { rating: number; comment?: string }; onDone: () => void }) {
  const [rating, setRating] = useState(existing?.rating || 5);
  const [comment, setComment] = useState(existing?.comment || "");
  const [message, setMessage] = useState("");
  const mutation = useMutation({
    mutationFn: () => api(`/libraries/${libraryId}/reviews`, { method: "POST", body: JSON.stringify({ rating, comment }) }),
    onSuccess: () => { setMessage("Review saved."); onDone(); },
    onError: (error) => setMessage(error.message)
  });
  return <form onSubmit={(event) => { event.preventDefault(); mutation.mutate(); }} className="mt-4 rounded-2xl border bg-white p-4 dark:bg-white/5">
    <div className="flex gap-1">{[1, 2, 3, 4, 5].map((value) => <button key={value} type="button" aria-label={`${value} star rating`} onClick={() => setRating(value)} className="grid h-10 w-10 place-items-center rounded-xl hover:bg-moss/10"><Star size={20} fill={value <= rating ? "currentColor" : "none"} className={value <= rating ? "text-moss" : "text-stone-300"} /></button>)}</div>
    <textarea className="input mt-3 min-h-24" value={comment} onChange={(event) => setComment(event.target.value)} placeholder="Share a helpful review for other students" />
    <div className="mt-3 flex items-center justify-between gap-3"><button disabled={mutation.isPending} className="btn-primary">{mutation.isPending ? "Saving..." : "Save review"}</button>{message && <span className="text-sm font-semibold text-moss">{message}</span>}</div>
  </form>;
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
  return <Layout><section className="container-app grid min-h-[76vh] items-center gap-8 py-10 lg:grid-cols-[1.1fr_.9fr]">
    <div className="hidden lg:block">
      <span className="eyebrow">{mode === "login" ? "Welcome back" : "Start with confidence"}</span>
      <h1 className="mt-4 max-w-2xl font-display text-5xl font-extrabold leading-tight">Study smarter. Track progress. Connect with serious learners.</h1>
      <div className="mt-8 grid max-w-xl gap-3">
        {[["Verified libraries", "Real listings with photos, facilities, and pricing."], ["Student tools", "Membership status, complaints, tasks, and community in one place."], ["Owner ready", "Bookings, fees, attendance, and announcements built in."]].map(([title, text]) => <div key={title} className="flex gap-3 rounded-2xl border bg-white/70 p-4 shadow-soft dark:bg-white/5"><ShieldCheck className="mt-0.5 text-moss" size={20} /><div><p className="font-bold">{title}</p><p className="text-sm text-stone-500">{text}</p></div></div>)}
      </div>
    </div>
    <div className="card w-full p-6 sm:p-9"><div><span className="eyebrow">{mode === "login" ? "Secure access" : "Create your account"}</span><h1 className="mt-2 font-display text-3xl font-extrabold">{mode === "login" ? "Log in to BookMySeat" : "Start studying smarter"}</h1><p className="mt-2 text-sm text-stone-500">Use your registered email to continue.</p></div>
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
    { path: "/community", label: "Community", icon: <MessageSquare size={18} /> },
    { path: "/notifications", label: "Notifications", icon: <Bell size={18} /> },
    { path: "/announcements", label: "Announcements", icon: <BookMarked size={18} /> },
    { path: "/group-study", label: "Group Study", icon: <Users size={18} /> },
    { path: "/report-issue", label: "Report Issue", icon: <AlertCircle size={18} /> },
    { path: "/tasks", label: "Tasks", icon: <Zap size={18} /> },
    { path: "/membership", label: "Membership", icon: <Star size={18} /> },
    { path: "/settings", label: "Settings", icon: <Settings size={18} /> },
  ];
  const bottomItems = [
    { path: "/dashboard", label: "Home", icon: <HomeIcon size={20} /> },
    { path: "/libraries", label: "Libraries", icon: <BookOpen size={20} /> },
    { path: "/community", label: "Community", icon: <MessageSquare size={20} /> },
    { path: "/report-issue", label: "Complaint", icon: <AlertCircle size={20} /> },
    { path: "/settings", label: "Settings", icon: <Settings size={20} /> },
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
    <main className="flex-1 pb-24 md:pb-0">{children}</main>
    <nav className="fixed inset-x-0 bottom-0 z-50 grid grid-cols-5 border-t bg-white/95 px-1 py-2 shadow-soft backdrop-blur md:hidden dark:bg-[#101713]/95">
      {bottomItems.map(({ path, label, icon }) => <Link key={path} to={path} className={`grid min-h-14 place-items-center rounded-xl text-[11px] font-bold ${location.pathname === path ? "bg-moss/10 text-moss" : "text-stone-500"}`}>{icon}<span>{label}</span></Link>)}
    </nav>
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
  const dailyGoalHours = 6;
  const dailyGoalPercent = Math.min(100, Math.round((todayHours / dailyGoalHours) * 100));
  const weeklyGoalHours = 20;
  const weeklyGoalPercent = Math.min(100, Math.round((weeklyMinutes / 60 / weeklyGoalHours) * 100));
  const firstName = user?.name?.split(" ")[0] || "Student";
  const currentStreak = data.streak?.currentDays || 0;
  const streak = getStreakStyle(currentStreak);
  const badges = getConsistencyBadges(currentStreak);
  const unlockedBadges = badges.filter((badge) => badge.unlocked);
  const nextBadge = badges.find((badge) => !badge.unlocked);
  const streakGoalDays = nextBadge?.days || Math.max(365, currentStreak);
  const streakPercent = streakGoalDays ? Math.min(100, Math.round((currentStreak / streakGoalDays) * 100)) : 100;
  const badgePercent = nextBadge ? streakPercent : 100;
  const progressRows = [
    ["Daily study progress", `${todayHours.toFixed(1)}h / ${dailyGoalHours}h`, dailyGoalPercent],
    ["Weekly progress", `${(weeklyMinutes / 60).toFixed(1)}h / ${weeklyGoalHours}h`, weeklyGoalPercent],
    ["Streak progress", `${currentStreak} / ${streakGoalDays} days`, streakPercent],
    ["Badge progress", nextBadge ? `Level ${nextBadge.level} at ${nextBadge.days} days` : "All core badges unlocked", badgePercent]
  ] as const;

  return <StudentDashboardLayout>
    <div className="min-h-screen bg-[#f6f6f1] dark:bg-[#0d130f]">
      <main className="container-app space-y-5 py-5 sm:py-8">
        <section className={`overflow-hidden rounded-3xl border p-5 text-white shadow-soft sm:p-7 ${streak.panel}`}>
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-[.18em] text-white/70">Study Progress</p>
              <h1 className="mt-2 max-w-xl font-display text-3xl font-extrabold leading-tight sm:text-5xl">Welcome back, {firstName}</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-white/80">Your daily focus, weekly rhythm, streak, and badge path in one place.</p>
            </div>
            <Link to="/settings" aria-label="Profile settings" className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white/15 text-lg font-extrabold ring-1 ring-white/20">{firstName.charAt(0).toUpperCase()}</Link>
          </div>
          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            {progressRows.map(([label, value, percent]) => <div key={label} className="rounded-2xl bg-white/12 p-4 ring-1 ring-white/15">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-extrabold">{label}</p>
                <p className="shrink-0 text-sm font-bold text-white/80">{value}</p>
              </div>
              <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-white/25">
                <div className="h-full rounded-full bg-white" style={{ width: `${percent}%` }} />
              </div>
            </div>)}
          </div>
          <div className="mt-5 flex flex-wrap items-center gap-3 text-sm font-semibold text-white/80">
            <span>{streak.label}</span>
            <span>{unlockedBadges.length} badge{unlockedBadges.length === 1 ? "" : "s"} unlocked</span>
          </div>
        </section>

        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {[
            [<BookOpen size={18} />, "Active Membership", currentMembership ? currentMembership.status : "None", currentMembership?.library?.name || "No active library"],
            [<MapPin size={18} />, "Current Seat", currentMembership?.seat?.number || "Unassigned", currentMembership?.library?.name || "No active library"],
            [<Flame size={18} />, "Current Streak", `${currentStreak} day${currentStreak === 1 ? "" : "s"}`, streak.label],
            [<Clock3 size={18} />, "Hours Studied Today", `${todayHours.toFixed(1)}h`, `${dailyGoalPercent}% of daily goal`]
          ].map(([icon, label, value, hint]) => <div key={String(label)} className="rounded-2xl border bg-white p-4 shadow-soft dark:bg-white/[.04]">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-ink text-white dark:bg-white dark:text-ink">{icon}</span>
            <p className="mt-4 text-xs font-bold uppercase tracking-wide text-stone-500">{label}</p>
            <p className="mt-1 truncate font-display text-2xl font-extrabold">{value}</p>
            <p className="mt-1 truncate text-xs text-stone-500">{hint}</p>
          </div>)}
        </section>
      </main>
    </div>
  </StudentDashboardLayout>;
}

function getStreakStyle(days: number) {
  if (days >= 200) return { label: "Gold consistency", panel: "bg-gradient-to-br from-[#6b4b00] via-[#b58412] to-[#f6c453]", card: "bg-[#fff4c7] text-[#6b4b00] dark:bg-[#4a3508] dark:text-[#ffe29a]" };
  if (days >= 100) return { label: "Purple discipline", panel: "bg-gradient-to-br from-[#382069] via-[#6d45c2] to-[#a78bfa]", card: "bg-[#f0e9ff] text-[#4c2a86] dark:bg-[#26183f] dark:text-[#dccdff]" };
  if (days >= 30) return { label: "Blue momentum", panel: "bg-gradient-to-br from-[#153e75] via-[#2563eb] to-[#60a5fa]", card: "bg-[#e8f1ff] text-[#174287] dark:bg-[#142844] dark:text-[#cfe3ff]" };
  if (days >= 7) return { label: "Green rhythm", panel: "bg-gradient-to-br from-[#14532d] via-[#24844b] to-[#73d88b]", card: "bg-[#e7f8ed] text-[#14532d] dark:bg-[#12301d] dark:text-[#c4f7d1]" };
  return { label: "Build the habit", panel: "bg-gradient-to-br from-[#3f3f46] via-[#71717a] to-[#a8a29e]", card: "bg-stone-100 text-stone-700 dark:bg-white/10 dark:text-stone-100" };
}

function getConsistencyBadges(days: number) {
  return [
    { level: 1, days: 50, icon: <Award size={18} />, color: "bg-emerald-50 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-200" },
    { level: 2, days: 100, icon: <ShieldCheck size={18} />, color: "bg-sky-50 text-sky-800 dark:bg-sky-500/10 dark:text-sky-200" },
    { level: 3, days: 150, icon: <Sparkles size={18} />, color: "bg-violet-50 text-violet-800 dark:bg-violet-500/10 dark:text-violet-200" },
    { level: 4, days: 200, icon: <Crown size={18} />, color: "bg-amber-50 text-amber-800 dark:bg-amber-500/10 dark:text-amber-200" },
    { level: 5, days: 365, icon: <Flame size={18} />, color: "bg-rose-50 text-rose-800 dark:bg-rose-500/10 dark:text-rose-200" }
  ].map((badge) => ({ ...badge, unlocked: days >= badge.days }));
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

function CommunityPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeChannelId, setActiveChannelId] = useState<string>("");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"TEXT" | "VACANCY" | "CURRENT_AFFAIRS" | "EXAM_UPDATE" | "NOTE" | "FILE">("TEXT");
  const [replyTo, setReplyTo] = useState<CommunityMessage | null>(null);
  const [attachment, setAttachment] = useState<{ url: string; name: string; mime: string } | null>(null);
  const [profileUser, setProfileUser] = useState<{ id: string; name: string; role: Role } | null>(null);
  const [reporting, setReporting] = useState<{ messageId?: string; userId?: string } | null>(null);
  const { data: channelData, isLoading: channelsLoading } = useQuery({ queryKey: ["community-channels"], queryFn: () => api<{ channels: CommunityChannel[] }>("/community/channels"), refetchInterval: 30_000 });
  const { data: connectionData } = useQuery({ queryKey: ["community-connections"], queryFn: () => api<{ connections: CommunityConnection[] }>("/community/connections"), refetchInterval: 30_000 });
  const channels = channelData?.channels || [];
  const connections = connectionData?.connections || [];
  const incomingRequests = connections.filter((item) => item.receiverId === user?.id && item.status === "PENDING");
  const activeChannel = channels.find((channel) => channel.id === activeChannelId) || channels[0];
  useEffect(() => { if (!activeChannelId && channels[0]) setActiveChannelId(channels[0].id); }, [activeChannelId, channels]);
  const { data: messageData, isLoading: messagesLoading } = useQuery({
    queryKey: ["community-messages", activeChannel?.id],
    queryFn: () => api<{ channel: CommunityChannel; messages: CommunityMessage[] }>(`/community/channels/${activeChannel!.id}/messages`),
    enabled: Boolean(activeChannel?.id),
    refetchInterval: 20_000
  });
  const messages = messageData?.messages || [];
  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["community-channels"] });
    queryClient.invalidateQueries({ queryKey: ["community-messages"] });
    queryClient.invalidateQueries({ queryKey: ["community-connections"] });
  };
  const sendMessage = useMutation({
    mutationFn: () => api(`/community/channels/${activeChannel!.id}/messages`, {
      method: "POST",
      body: JSON.stringify({ body: message, type: attachment ? "FILE" : messageType, replyToId: replyTo?.id, attachmentUrl: attachment?.url, attachmentName: attachment?.name, attachmentMime: attachment?.mime })
    }),
    onSuccess: () => { setMessage(""); setAttachment(null); setReplyTo(null); setMessageType("TEXT"); refresh(); }
  });
  const react = useMutation({ mutationFn: ({ id, emoji }: { id: string; emoji: string }) => api(`/community/messages/${id}/reactions`, { method: "POST", body: JSON.stringify({ emoji }) }), onSuccess: refresh });
  const removeMessage = useMutation({ mutationFn: (id: string) => api(`/community/messages/${id}`, { method: "DELETE" }), onSuccess: refresh });
  const direct = useMutation({ mutationFn: (userId: string) => api<CommunityChannel>("/community/direct", { method: "POST", body: JSON.stringify({ userId }) }), onSuccess: (channel) => { setActiveChannelId(channel.id); setProfileUser(null); refresh(); }, onError: (error) => alert(error.message) });
  const requestConnection = useMutation({ mutationFn: (userId: string) => api("/community/connections", { method: "POST", body: JSON.stringify({ userId }) }), onSuccess: refresh, onError: (error) => alert(error.message) });
  const updateConnection = useMutation({ mutationFn: ({ id, status }: { id: string; status: "ACCEPTED" | "REJECTED" }) => api(`/community/connections/${id}`, { method: "PATCH", body: JSON.stringify({ status }) }), onSuccess: refresh });
  const removeConnection = useMutation({ mutationFn: (userId: string) => api(`/community/connections/${userId}`, { method: "DELETE" }), onSuccess: () => { setProfileUser(null); refresh(); } });
  const block = useMutation({ mutationFn: (userId: string) => api(`/community/block/${userId}`, { method: "POST" }), onSuccess: () => { setProfileUser(null); refresh(); } });
  const mute = useMutation({ mutationFn: (userId: string) => api(`/community/mute/${userId}`, { method: "POST" }), onSuccess: () => setProfileUser(null) });
  const report = useMutation({
    mutationFn: ({ reason }: { reason: string }) => api("/community/reports", { method: "POST", body: JSON.stringify({ messageId: reporting?.messageId, reportedUserId: reporting?.userId, reason }) }),
    onSuccess: () => setReporting(null)
  });
  const moderateMember = useMutation({
    mutationFn: ({ userId, action }: { userId: string; action: "REMOVE" | "BAN" }) => api(`/community/channels/${activeChannel!.id}/members/${userId}`, { method: "PATCH", body: JSON.stringify({ action }) }),
    onSuccess: () => { setProfileUser(null); refresh(); }
  });

  const chooseFile = (file?: File) => {
    if (!file) return;
    if (file.size > 1_500_000) return alert("Please share a file under 1.5 MB.");
    const reader = new FileReader();
    reader.onload = () => setAttachment({ url: String(reader.result), name: file.name, mime: file.type || "application/octet-stream" });
    reader.readAsDataURL(file);
  };
  const profileConnection = profileUser ? connections.find((item) =>
    (item.requesterId === user?.id && item.receiverId === profileUser.id) ||
    (item.requesterId === profileUser.id && item.receiverId === user?.id)
  ) : null;

  return <StudentDashboardLayout>
    <main className="h-[calc(100vh-82px)] bg-[#eef1ee] p-0 dark:bg-[#0d130f] md:h-screen md:p-5">
      <div className="mx-auto grid h-full max-w-7xl overflow-hidden border bg-white shadow-soft dark:bg-[#111713] md:rounded-3xl lg:grid-cols-[320px_1fr]">
        <aside className="hidden border-r bg-[#f8f8f5] dark:bg-white/[.03] lg:block">
          <div className="border-b p-4">
            <div className="flex items-center justify-between"><div><p className="text-xs font-bold uppercase tracking-[.16em] text-moss">Community</p><h1 className="font-display text-2xl font-extrabold">Student Chats</h1></div><NotificationBell /></div>
            <p className="mt-2 text-sm text-stone-500">Group chats first. Private chat opens after approval.</p>
          </div>
          <div className="max-h-[calc(100vh-150px)] overflow-y-auto p-3">
            {incomingRequests.length > 0 && <div className="mb-3 rounded-2xl border bg-white p-3 dark:bg-white/5">
              <p className="text-xs font-bold uppercase tracking-[.14em] text-moss">Connection Requests</p>
              <div className="mt-2 grid gap-2">{incomingRequests.map((request) => <div key={request.id} className="rounded-xl bg-stone-50 p-2 dark:bg-black/15">
                <div className="flex items-center gap-2"><Avatar user={request.requester} /><span className="min-w-0 flex-1 truncate text-sm font-bold">{request.requester.name}</span></div>
                <div className="mt-2 grid grid-cols-2 gap-2"><button onClick={() => updateConnection.mutate({ id: request.id, status: "ACCEPTED" })} className="rounded-lg bg-moss px-2 py-1.5 text-xs font-bold text-white">Accept</button><button onClick={() => updateConnection.mutate({ id: request.id, status: "REJECTED" })} className="rounded-lg border px-2 py-1.5 text-xs font-bold">Reject</button></div>
              </div>)}</div>
            </div>}
            {channelsLoading && <p className="p-4 text-sm text-stone-500">Loading groups...</p>}
            {channels.map((channel) => <button key={channel.id} onClick={() => setActiveChannelId(channel.id)} className={`mb-2 flex w-full items-center gap-3 rounded-2xl p-3 text-left transition ${activeChannel?.id === channel.id ? "bg-ink text-white" : "hover:bg-stone-100 dark:hover:bg-white/5"}`}>
              <ChannelIcon channel={channel} />
              <span className="min-w-0 flex-1"><span className="block truncate text-sm font-extrabold">{directChannelName(channel, user?.id)}</span><span className={`block truncate text-xs ${activeChannel?.id === channel.id ? "text-white/65" : "text-stone-500"}`}>{channel.latestMessage?.body || channel.description || "No messages yet"}</span></span>
              {Boolean(channel.unreadCount) && <span className="grid min-h-6 min-w-6 place-items-center rounded-full bg-red-500 px-1 text-[11px] font-bold text-white">{Math.min(channel.unreadCount || 0, 99)}</span>}
            </button>)}
          </div>
        </aside>

        <section className="flex min-w-0 flex-col">
          <header className="flex min-h-16 items-center gap-3 border-b bg-white/95 px-3 backdrop-blur dark:bg-[#111713]/95 sm:px-4">
            <select className="input max-w-[44vw] !py-2 lg:hidden" value={activeChannel?.id || ""} onChange={(event) => setActiveChannelId(event.target.value)}>
              {channels.map((channel) => <option key={channel.id} value={channel.id}>{directChannelName(channel, user?.id)}</option>)}
            </select>
            {activeChannel && <><ChannelIcon channel={activeChannel} /><div className="min-w-0 flex-1"><h2 className="truncate font-display text-lg font-extrabold">{directChannelName(activeChannel, user?.id)}</h2><p className="truncate text-xs text-stone-500">{activeChannel.type === "GLOBAL" ? "Mathura Community" : activeChannel.type === "LIBRARY" ? "Library-wise Group" : "Private Direct Message"} · {activeChannel.members?.length || 0} members</p></div></>}
            <Link to="/report-issue" className="grid h-10 w-10 place-items-center rounded-xl border" aria-label="Community safety"><ShieldCheck size={18} /></Link>
          </header>
          {incomingRequests.length > 0 && <div className="border-b bg-emerald-50/70 px-3 py-2 dark:bg-emerald-500/10 lg:hidden">
            <div className="flex gap-2 overflow-x-auto">{incomingRequests.map((request) => <div key={request.id} className="flex min-w-64 items-center gap-2 rounded-xl bg-white p-2 shadow-sm dark:bg-[#111713]">
              <Avatar user={request.requester} />
              <span className="min-w-0 flex-1 truncate text-sm font-bold">{request.requester.name}</span>
              <button onClick={() => updateConnection.mutate({ id: request.id, status: "ACCEPTED" })} className="rounded-lg bg-moss px-2 py-1 text-xs font-bold text-white">Accept</button>
              <button onClick={() => updateConnection.mutate({ id: request.id, status: "REJECTED" })} className="rounded-lg border px-2 py-1 text-xs font-bold">Reject</button>
            </div>)}</div>
          </div>}

          <div className="flex-1 overflow-y-auto bg-[linear-gradient(rgba(47,107,79,.05)_1px,transparent_1px),linear-gradient(90deg,rgba(47,107,79,.05)_1px,transparent_1px)] bg-[size:28px_28px] p-3 sm:p-5">
            {messagesLoading && <p className="mx-auto mt-10 rounded-2xl bg-white p-4 text-center text-sm text-stone-500 shadow-soft dark:bg-[#111713]">Loading messages...</p>}
            <div className="mx-auto flex max-w-3xl flex-col gap-3">
              {messages.map((entry) => <ChatBubble key={entry.id} message={entry} mine={entry.senderId === user?.id} userId={user?.id || ""} canModerate={["OWNER", "ADMIN"].includes(user?.role || "")} onReply={setReplyTo} onReact={(emoji) => react.mutate({ id: entry.id, emoji })} onDelete={() => removeMessage.mutate(entry.id)} onProfile={() => setProfileUser(entry.sender)} onReport={() => setReporting({ messageId: entry.id, userId: entry.senderId })} />)}
              {!messages.length && !messagesLoading && <div className="mx-auto mt-10 max-w-sm rounded-3xl border bg-white p-6 text-center shadow-soft dark:bg-[#111713]"><MessageSquare className="mx-auto text-moss" size={30} /><h3 className="mt-3 font-display text-xl font-extrabold">Start the conversation</h3><p className="mt-1 text-sm text-stone-500">Send a message, notes, updates, vacancy information, current affairs, photos, videos or PDFs.</p></div>}
              {messages.length > 0 && <div className="ml-10 flex items-center gap-2 text-xs font-semibold text-stone-400"><span className="flex gap-1 rounded-full bg-white px-3 py-2 shadow-soft dark:bg-[#111713]"><span className="typing-dot" /><span className="typing-dot animation-delay-150" /><span className="typing-dot animation-delay-300" /></span> Students are typing</div>}
            </div>
          </div>

          <footer className="border-t bg-white p-3 dark:bg-[#111713]">
            {replyTo && <div className="mb-2 flex items-center justify-between rounded-2xl border-l-4 border-moss bg-stone-50 px-3 py-2 text-sm dark:bg-white/5"><span className="truncate"><b>Replying to {replyTo.sender.name}:</b> {replyTo.body || replyTo.attachmentName || "Attachment"}</span><button onClick={() => setReplyTo(null)} className="grid h-8 w-8 place-items-center rounded-xl"><X size={16} /></button></div>}
            {attachment && <div className="mb-2 flex items-center justify-between rounded-2xl border bg-stone-50 px-3 py-2 text-sm dark:bg-white/5"><span className="truncate"><Paperclip size={15} className="mr-1 inline" />{attachment.name}</span><button onClick={() => setAttachment(null)} className="grid h-8 w-8 place-items-center rounded-xl"><X size={16} /></button></div>}
            <form onSubmit={(event) => { event.preventDefault(); if (message.trim() || attachment) sendMessage.mutate(); }} className="flex items-end gap-2">
              <label className="grid h-11 w-11 shrink-0 cursor-pointer place-items-center rounded-2xl border bg-white dark:bg-white/5" aria-label="Attach file"><Paperclip size={19} /><input type="file" className="hidden" accept="image/*,video/*,.pdf,.doc,.docx,.txt" onChange={(event) => chooseFile(event.target.files?.[0])} /></label>
              <select value={messageType} onChange={(event) => setMessageType(event.target.value as typeof messageType)} className="hidden h-11 rounded-2xl border bg-white px-2 text-xs font-bold outline-none dark:bg-white/5 sm:block"><option value="TEXT">Chat</option><option value="VACANCY">Vacancy</option><option value="CURRENT_AFFAIRS">Current affairs</option><option value="EXAM_UPDATE">Exam update</option><option value="NOTE">Notes</option></select>
              <textarea value={message} onChange={(event) => setMessage(event.target.value)} rows={1} className="max-h-32 min-h-11 flex-1 resize-none rounded-2xl border bg-stone-50 px-4 py-3 text-sm outline-none focus:border-moss dark:bg-white/5" placeholder={activeChannel?.type === "DIRECT" ? "Message privately..." : "Message the group..."} />
              <button disabled={sendMessage.isPending || (!message.trim() && !attachment)} className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-moss text-white disabled:opacity-50" aria-label="Send message"><Send size={19} /></button>
            </form>
          </footer>
        </section>
      </div>

      {profileUser && <div className="fixed inset-0 z-[60] bg-black/30 p-4 backdrop-blur-sm" onClick={() => setProfileUser(null)}><div onClick={(event) => event.stopPropagation()} className="ml-auto h-full max-w-sm rounded-3xl bg-white p-5 shadow-soft dark:bg-[#111713]">
        <div className="flex items-center justify-between"><h2 className="font-display text-xl font-extrabold">Student Profile</h2><button onClick={() => setProfileUser(null)} className="grid h-10 w-10 place-items-center rounded-xl border"><X size={18} /></button></div>
        <div className="mt-6 text-center"><Avatar user={profileUser} size="lg" /><h3 className="mt-3 font-display text-2xl font-extrabold">{profileUser.name}</h3><p className="mt-1 text-sm font-semibold text-stone-500">{profileUser.role}</p></div>
        {profileUser.id !== user?.id && <div className="mt-6 grid gap-2">
          {profileConnection?.status === "ACCEPTED" ? <>
            <button onClick={() => direct.mutate(profileUser.id)} className="btn-primary w-full"><MessageCircle size={17} /> Open private chat</button>
            <button onClick={() => removeConnection.mutate(profileUser.id)} className="btn-secondary w-full"><UserCircle size={17} /> Remove connection</button>
          </> : profileConnection?.status === "PENDING" ? <div className="rounded-2xl border bg-stone-50 p-4 text-sm font-semibold text-stone-600 dark:bg-white/5 dark:text-stone-300">
            {profileConnection.requesterId === user?.id ? "Connection request sent. Private chat unlocks after acceptance." : "This student sent you a connection request."}
            {profileConnection.receiverId === user?.id && <div className="mt-3 grid grid-cols-2 gap-2"><button onClick={() => updateConnection.mutate({ id: profileConnection.id, status: "ACCEPTED" })} className="rounded-lg bg-moss px-3 py-2 text-xs font-bold text-white">Accept</button><button onClick={() => updateConnection.mutate({ id: profileConnection.id, status: "REJECTED" })} className="rounded-lg border px-3 py-2 text-xs font-bold">Reject</button></div>}
          </div> : <button onClick={() => requestConnection.mutate(profileUser.id)} className="btn-primary w-full"><UserPlus size={17} /> Send connection request</button>}
          <button onClick={() => setReporting({ userId: profileUser.id })} className="btn-secondary w-full"><Flag size={17} /> Report user</button>
          <button onClick={() => mute.mutate(profileUser.id)} className="btn-secondary w-full"><Bell size={17} /> Mute user</button>
          <button onClick={() => block.mutate(profileUser.id)} className="btn-secondary w-full text-red-600"><Ban size={17} /> Block user</button>
          {["OWNER", "ADMIN"].includes(user?.role || "") && activeChannel?.type !== "DIRECT" && <><button onClick={() => moderateMember.mutate({ userId: profileUser.id, action: "REMOVE" })} className="btn-secondary w-full"><UserCircle size={17} /> Remove member</button><button onClick={() => moderateMember.mutate({ userId: profileUser.id, action: "BAN" })} className="btn-secondary w-full text-red-600"><ShieldAlert size={17} /> Ban user</button></>}
        </div>}
      </div></div>}

      {reporting && <div className="fixed inset-0 z-[70] grid place-items-center bg-black/30 p-4 backdrop-blur-sm"><form onSubmit={(event) => { event.preventDefault(); report.mutate({ reason: String(new FormData(event.currentTarget).get("reason") || "") }); }} className="w-full max-w-md rounded-3xl bg-white p-5 shadow-soft dark:bg-[#111713]">
        <div className="flex items-center justify-between"><h2 className="font-display text-xl font-extrabold">Report safety concern</h2><button type="button" onClick={() => setReporting(null)} className="grid h-10 w-10 place-items-center rounded-xl border"><X size={18} /></button></div>
        <textarea name="reason" className="input mt-4 min-h-28" placeholder="Tell the moderation team what happened" required />
        <button disabled={report.isPending} className="btn-primary mt-4 w-full"><Flag size={17} /> Submit report</button>
      </form></div>}
    </main>
  </StudentDashboardLayout>;
}

function ChannelIcon({ channel }: { channel: CommunityChannel }) {
  const icon = channel.type === "GLOBAL" ? <Megaphone size={18} /> : channel.type === "DIRECT" ? <MessageCircle size={18} /> : <Users size={18} />;
  return <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl text-white ${channel.type === "GLOBAL" ? "bg-[#2563eb]" : channel.type === "DIRECT" ? "bg-[#6d45c2]" : "bg-moss"}`}>{icon}</span>;
}

function directChannelName(channel: CommunityChannel, currentUserId?: string) {
  if (channel.type !== "DIRECT") return channel.name;
  return channel.members?.map((member) => member.user).find((member) => member.id !== currentUserId)?.name || "Direct Message";
}

function Avatar({ user, size = "sm" }: { user: { name: string; role?: Role }; size?: "sm" | "lg" }) {
  const initials = user.name.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase();
  return <span className={`mx-auto grid shrink-0 place-items-center rounded-full bg-ink font-extrabold text-white ${size === "lg" ? "h-20 w-20 text-2xl" : "h-9 w-9 text-xs"}`}>{initials}</span>;
}

function ChatBubble({ message, mine, userId, canModerate, onReply, onReact, onDelete, onProfile, onReport }: { message: CommunityMessage; mine: boolean; userId: string; canModerate: boolean; onReply: (message: CommunityMessage) => void; onReact: (emoji: string) => void; onDelete: () => void; onProfile: () => void; onReport: () => void }) {
  const reactionSummary = Object.entries(message.reactions.reduce<Record<string, number>>((acc, reaction) => ({ ...acc, [reaction.emoji]: (acc[reaction.emoji] || 0) + 1 }), {}));
  return <div className={`flex gap-2 ${mine ? "justify-end" : "justify-start"}`}>
    {!mine && <button onClick={onProfile} className="mt-1"><Avatar user={message.sender} /></button>}
    <div className={`group max-w-[82%] sm:max-w-[70%] ${mine ? "items-end" : "items-start"} flex flex-col`}>
      {!mine && <button onClick={onProfile} className="mb-1 text-left text-xs font-bold text-stone-500">{message.sender.name}</button>}
      <div className={`rounded-3xl px-4 py-3 shadow-sm ${mine ? "rounded-br-md bg-moss text-white" : "rounded-bl-md bg-white text-ink dark:bg-[#18211b] dark:text-white"}`}>
        {message.replyTo && <div className={`mb-2 rounded-2xl border-l-4 px-3 py-2 text-xs ${mine ? "border-white/70 bg-white/10 text-white/80" : "border-moss bg-stone-50 text-stone-500 dark:bg-white/5"}`}><b>{message.replyTo.sender.name}</b><p className="truncate">{message.replyTo.body || message.replyTo.attachmentName || "Attachment"}</p></div>}
        {message.isDeleted ? <p className="italic opacity-70">Message deleted</p> : <>
          {message.type !== "TEXT" && <span className={`mb-2 inline-flex rounded-full px-2 py-1 text-[10px] font-extrabold uppercase tracking-wide ${mine ? "bg-white/15" : "bg-moss/10 text-moss"}`}>{message.type.replace("_", " ")}</span>}
          {message.body && <p className="whitespace-pre-wrap text-sm leading-6">{message.body}</p>}
          {message.attachmentUrl && <AttachmentPreview message={message} mine={mine} />}
        </>}
        <div className={`mt-1 text-right text-[10px] font-semibold ${mine ? "text-white/65" : "text-stone-400"}`}>{new Date(message.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</div>
      </div>
      {reactionSummary.length > 0 && <div className="mt-1 flex flex-wrap gap-1">{reactionSummary.map(([emoji, count]) => <button key={emoji} onClick={() => onReact(emoji)} className="rounded-full border bg-white px-2 py-0.5 text-xs shadow-sm dark:bg-[#111713]">{emoji} {count}</button>)}</div>}
      <div className="mt-1 flex gap-1 opacity-100 sm:opacity-0 sm:transition sm:group-hover:opacity-100">
        {["👍", "❤️", "📚"].map((emoji) => <button key={emoji} onClick={() => onReact(emoji)} className="grid h-8 w-8 place-items-center rounded-full border bg-white text-sm dark:bg-[#111713]" aria-label={`React ${emoji}`}>{emoji}</button>)}
        <button onClick={() => onReply(message)} className="grid h-8 w-8 place-items-center rounded-full border bg-white dark:bg-[#111713]" aria-label="Reply"><Reply size={14} /></button>
        {!mine && <button onClick={onReport} className="grid h-8 w-8 place-items-center rounded-full border bg-white dark:bg-[#111713]" aria-label="Report message"><Flag size={14} /></button>}
        {(mine || canModerate) && <button onClick={onDelete} className="grid h-8 w-8 place-items-center rounded-full border bg-white text-red-600 dark:bg-[#111713]" aria-label="Delete message"><Trash2 size={14} /></button>}
      </div>
    </div>
    {mine && <Avatar user={{ name: "You" }} />}
  </div>;
}

function AttachmentPreview({ message, mine }: { message: CommunityMessage; mine: boolean }) {
  const mime = message.attachmentMime || "";
  const base = mine ? "bg-white/10 text-white" : "bg-stone-50 text-ink dark:bg-white/5 dark:text-white";
  if (mime.startsWith("image/")) return <img src={message.attachmentUrl || ""} alt={message.attachmentName || "Shared image"} className="mt-2 max-h-64 rounded-2xl object-cover" />;
  if (mime.startsWith("video/")) return <video src={message.attachmentUrl || ""} controls className="mt-2 max-h-64 rounded-2xl" />;
  const icon = mime.includes("pdf") ? <FileText size={18} /> : mime.startsWith("video/") ? <Video size={18} /> : <Paperclip size={18} />;
  return <a href={message.attachmentUrl || "#"} download={message.attachmentName} className={`mt-2 flex items-center gap-2 rounded-2xl p-3 text-sm font-bold ${base}`}>{icon}<span className="truncate">{message.attachmentName || "Download file"}</span></a>;
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
            <select name="category" className="input" required><option value="">Select issue type</option><option>AC Issue</option><option>WiFi Issue</option><option>Seat Issue</option><option>Cleanliness</option><option>Noise</option><option>Other</option></select>
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
  const [activeTab, setActiveTab] = useState<"membership" | "profile" | "security" | "notifications" | "library" | "support" | "about">("profile");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [formData, setFormData] = useState({ name: "", phone: "", currentPassword: "", newPassword: "", confirmPassword: "" });
  const [libraryForm, setLibraryForm] = useState({ name: "", address: "", phone: "", timings: "", capacity: "", facilities: "", pricing: "" });
  const [imageType, setImageType] = useState("EXTERIOR");
  const [uploadFiles, setUploadFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
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
          pricing: Array.isArray(data.library.pricing) ? data.library.pricing.map((plan: any) => `${plan.name}: ${plan.amount}`).join("\n") : ""
        });
      }
    }
  }, [data]);

  useEffect(() => () => imagePreviews.forEach((url) => URL.revokeObjectURL(url)), [imagePreviews]);

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

  const uploadLibraryImages = async () => {
    if (!settings.library?.id || !uploadFiles.length) return;
    setLoading(true);
    setMessage("");
    const body = new FormData();
    uploadFiles.forEach((file) => body.append("images", file));
    body.append("type", imageType);
    try {
      await api(`/libraries/${settings.library.id}/images`, { method: "POST", body });
      setMessage("Library photos uploaded successfully.");
      setUploadFiles([]);
      setImagePreviews([]);
      queryClient.invalidateQueries({ queryKey: ["settings"] });
      queryClient.invalidateQueries({ queryKey: ["owner"] });
    } catch (err) {
      setMessage((err as Error).message || "Failed to upload photos.");
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
                  { id: "profile" as const, label: "Profile", icon: <Users size={18} /> },
                  { id: "notifications" as const, label: "Notifications", icon: <Bell size={18} /> },
                  { id: "security" as const, label: "Security", icon: <ShieldCheck size={18} /> },
                  { id: "membership" as const, label: "Membership", icon: <Star size={18} /> },
                  ...(user.role === "OWNER" ? [{ id: "library" as const, label: "Library", icon: <Building2 size={18} /> }] : []),
                  { id: "support" as const, label: "Support", icon: <MessageSquare size={18} /> },
                  { id: "about" as const, label: "About", icon: <BookOpen size={18} /> }
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
              {activeTab === "membership" && (
                <div className="card p-6">
                  <h2 className="font-display text-xl font-extrabold mb-4">Membership</h2>
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

              {activeTab === "security" && (
                <div className="card p-6">
                  <h2 className="font-display text-xl font-extrabold mb-4">Security</h2>
                  <form onSubmit={changePassword} className="grid gap-4">
                    <Field label="Current Password" type="password" value={formData.currentPassword} onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })} required />
                    <Field label="New Password" type="password" minLength={8} value={formData.newPassword} onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })} required />
                    <Field label="Confirm Password" type="password" minLength={8} value={formData.confirmPassword} onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })} required />
                    {message && <p className={`rounded-lg p-3 text-sm ${message.includes("success") ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>{message}</p>}
                    <button disabled={loading} className="btn-primary">{loading ? "Changing..." : "Change Password"}</button>
                  </form>
                </div>
              )}

              {activeTab === "support" && (
                <div className="card p-6">
                  <h2 className="font-display text-xl font-extrabold mb-4">Support</h2>
                  <div className="grid gap-3">
                    <Link to="/report-issue" className="flex items-center justify-between rounded-xl border p-4 font-semibold hover:bg-stone-50 dark:hover:bg-white/5"><span>Submit a complaint</span><ChevronRight size={18} /></Link>
                    <Link to="/community" className="flex items-center justify-between rounded-xl border p-4 font-semibold hover:bg-stone-50 dark:hover:bg-white/5"><span>Ask the community</span><ChevronRight size={18} /></Link>
                  </div>
                </div>
              )}

              {activeTab === "about" && (
                <div className="card p-6">
                  <h2 className="font-display text-xl font-extrabold mb-4">About BookMySeat</h2>
                  <p className="text-sm leading-6 text-stone-500">BookMySeat helps students find libraries, manage memberships, raise complaints, and learn together through the community portal.</p>
                  <p className="mt-4 text-sm font-semibold">Account type: {user.role}</p>
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
                    <div className="sm:col-span-2 rounded-2xl border bg-stone-50/70 p-4 dark:bg-white/5">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                        <label className="flex-1"><span className="label">Library photos</span><input className="input" type="file" accept="image/*" multiple onChange={(e) => {
                          const files = Array.from(e.target.files || []);
                          imagePreviews.forEach((url) => URL.revokeObjectURL(url));
                          setUploadFiles(files);
                          setImagePreviews(files.map((file) => URL.createObjectURL(file)));
                        }} /></label>
                        <label className="sm:w-56"><span className="label">Photo type</span><select className="input" value={imageType} onChange={(e) => setImageType(e.target.value)}><option value="EXTERIOR">Exterior</option><option value="STUDY_HALL">Study Hall</option><option value="SEAT">Seat</option><option value="FACILITIES">Facilities</option><option value="OTHER">Other</option></select></label>
                        <button type="button" onClick={uploadLibraryImages} disabled={loading || !uploadFiles.length} className="btn-primary"><Upload size={17} /> Upload</button>
                      </div>
                      {imagePreviews.length > 0 && <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">{imagePreviews.map((url) => <img key={url} src={url} alt="Selected library preview" className="aspect-[4/3] rounded-xl object-cover" />)}</div>}
                      {settings.library.images?.length > 0 && <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">{settings.library.images.map((image: any) => <div key={image.id} className="overflow-hidden rounded-xl border bg-white dark:bg-white/5"><img src={image.url} alt={image.alt || "Library"} className="aspect-[4/3] w-full object-cover" /><p className="truncate px-2 py-1 text-[11px] font-bold text-stone-500">{image.type || "PHOTO"}{image.isCover ? " · Cover" : ""}</p></div>)}</div>}
                    </div>
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
    <Route path="/community" element={<Authenticated><CommunityPage /></Authenticated>} />
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
