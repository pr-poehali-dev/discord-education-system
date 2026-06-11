import { useState, useRef } from "react";
import Icon from "@/components/ui/icon";

// ─── Types ───────────────────────────────────────────────
type Role = "cadet" | "jr_instructor" | "instructor" | "deputy" | "chief";
type Rank = "private" | "jr_sergeant" | "sergeant";
type Page = "home" | "profile" | "report" | "stats" | "moderation";

const ROLE_LABEL: Record<Role, string> = {
  cadet: "Курсант",
  jr_instructor: "Мл. инструктор",
  instructor: "Инструктор",
  deputy: "Зам.Нач.АВНГ",
  chief: "Нач.АВНГ",
};
const RANK_LABEL: Record<Rank, string> = {
  private: "Рядовой",
  jr_sergeant: "Младший сержант",
  sergeant: "Сержант",
};
const RANK_NEXT: Partial<Record<Rank, Rank>> = {
  private: "jr_sergeant",
  jr_sergeant: "sergeant",
};

// ─── Mock DB ─────────────────────────────────────────────
type UserRecord = {
  id: string; login: string; password: string;
  name: string; tabNumber: string;
  role: Role; rank: Rank;
  joinDate: string;
  progress: {
    lecturesListened: string[];
    practicesDone: string[];
    examsPassed: string[];
  };
};

const INITIAL_USERS: UserRecord[] = [
  {
    id: "1", login: "chief", password: "admin123",
    name: "Романов Александр Игоревич", tabNumber: "АВ-0001",
    role: "chief", rank: "sergeant",
    joinDate: "01.01.2026",
    progress: { lecturesListened: [], practicesDone: [], examsPassed: [] },
  },
  {
    id: "2", login: "deputy1", password: "deputy123",
    name: "Сидоров Виктор Константинович", tabNumber: "АВ-0002",
    role: "deputy", rank: "sergeant",
    joinDate: "01.01.2026",
    progress: { lecturesListened: [], practicesDone: [], examsPassed: [] },
  },
  {
    id: "3", login: "instr1", password: "instr123",
    name: "Кузнецов Павел Андреевич", tabNumber: "АВ-0010",
    role: "instructor", rank: "jr_sergeant",
    joinDate: "10.02.2026",
    progress: { lecturesListened: [], practicesDone: [], examsPassed: [] },
  },
  {
    id: "4", login: "ivanov", password: "pass1234",
    name: "Иванов Дмитрий Сергеевич", tabNumber: "АВ-2847",
    role: "cadet", rank: "private",
    joinDate: "15.03.2026",
    progress: { lecturesListened: [], practicesDone: [], examsPassed: [] },
  },
  {
    id: "5", login: "petrov", password: "pass5678",
    name: "Петров Андрей Викторович", tabNumber: "АВ-2848",
    role: "cadet", rank: "private",
    joinDate: "15.03.2026",
    progress: { lecturesListened: [], practicesDone: [], examsPassed: [] },
  },
];

// ─── Lectures & Practices ────────────────────────────────
const LECTURES_P2J = [
  { id: "l1", type: "Лекция", title: "Вступительная лекция", link: "https://docs.google.com/presentation/d/1TunNnou9K9ZH_QDsmx0N-OKhSSRQot6o6J09dMgcp5c/edit?usp=sharing" },
  { id: "l2", type: "Лекция", title: "ФЗ о ФСВНГ и Устав ФСВНГ", link: "https://docs.google.com/document/d/1fir1wtveTcp5n5MQ-dJ25syfUWJ_QsyOaxjpjx6Vci8/edit?usp=sharing" },
  { id: "l3", type: "Экзамен", title: "Тест: Устав ФСВНГ + ФЗ о ФСВНГ", link: "https://discord.com" },
];
const LECTURES_J2S = [
  { id: "l4", type: "Лекция", title: "УК, ПК, КоАП", link: "https://docs.google.com/presentation/d/18NqJPtXdvhpl5ChP-1VRfBP77ZsCmVSYOhGbDVqdygA/edit?usp=sharing" },
  { id: "l5", type: "Лекция", title: "Допуск к закрытой и охраняемой территории", link: "https://docs.google.com/presentation/d/1rk_v4cruYlBn4gd1zI2jgemZycuJnQqYseNnP5ARsG8/edit?usp=sharing" },
  { id: "l6", type: "Экзамен", title: "Тесты: УК, ПК, КоАП", link: "https://discord.com" },
];

const PRACTICES_P2J = [
  { id: "p1", title: "Вышка — 30 мин", desc: "Доклад каждые 10 мин" },
  { id: "p2", title: "Патруль по прилегающей территории — 30 мин", desc: "Доклад каждые 10 мин" },
  { id: "p3", title: "Наряд на КПП-1 — 30 минут", desc: "Доклад каждые 10 минут" },
  { id: "p4", title: "Наряд на КПП-2 (Внутренний пост) — 1 час", desc: "Доклад каждые 20 минут" },
  { id: "p5", title: "Участие в государственной поставке (4 шт.)", desc: "В сопровождении инструктора АВНГ | СС" },
  { id: "p6", title: "Участие в досмотровых мероприятиях", desc: "На двух собеседованиях" },
];

const PRACTICES_J2S = [
  { id: "q1", title: "Практика: Штраф", desc: "Отработка процедуры оформления штрафа" },
  { id: "q2", title: "Практика: Задержание", desc: "Отработка процедуры задержания" },
  { id: "q3", title: "Практика: Арест", desc: "Отработка процедуры ареста" },
  { id: "q4", title: "Экзамен: Штраф (практика)", desc: "Приём инструктором" },
  { id: "q5", title: "Экзамен: Задержание (практика)", desc: "Приём инструктором" },
  { id: "q6", title: "Экзамен: Арест (практика)", desc: "Приём инструктором" },
  { id: "q7", title: "Экзамен: УК (теория)", desc: "Тест в Discord #экзамен-2" },
  { id: "q8", title: "Экзамен: ПК (теория)", desc: "Тест в Discord #экзамен-2" },
  { id: "q9", title: "Экзамен: КоАП (теория)", desc: "Тест в Discord #экзамен-2" },
];

const STATUS_MAP: Record<string, { label: string; cls: string }> = {
  pending:  { label: "На рассмотрении", cls: "bg-yellow-100 text-yellow-700 border border-yellow-300" },
  approved: { label: "Одобрено",         cls: "bg-green-100  text-green-700  border border-green-300"  },
  rejected: { label: "Отклонено",        cls: "bg-red-100    text-red-700    border border-red-300"    },
};

type Report = {
  id: number; authorId: string; authorName: string; tabNumber: string;
  direction: string; date: string; status: string;
  signature: string; photoName: string;
};

// ─── Main ─────────────────────────────────────────────────
export default function Index() {
  const [users, setUsers] = useState<UserRecord[]>(INITIAL_USERS);
  const [currentUser, setCurrentUser] = useState<UserRecord | null>(null);
  const [reports, setReports] = useState<Report[]>([
    { id: 1, authorId: "4", authorName: "Иванов Д.С.", tabNumber: "АВ-2847", direction: "Рядовой → Мл.сержант", date: "10.06.2026", status: "pending", signature: "Иванов Д.С.", photoName: "" },
  ]);
  const [page, setPage] = useState<Page>("home");
  const [mobileMenu, setMobileMenu] = useState(false);

  // Login form
  const [loginVal, setLoginVal] = useState("");
  const [passVal, setPassVal]   = useState("");
  const [loginErr, setLoginErr] = useState("");

  // Registration (deputy/chief only)
  const [regOpen, setRegOpen]       = useState(false);
  const [regName, setRegName]       = useState("");
  const [regLogin, setRegLogin]     = useState("");
  const [regPass, setRegPass]       = useState("");
  const [regRole, setRegRole]       = useState<Role>("cadet");
  const [regTab, setRegTab]         = useState("");
  const [regMsg, setRegMsg]         = useState("");

  // Report form
  const [repDir, setRepDir]         = useState<"p2j"|"j2s">("p2j");
  const [repSign, setRepSign]       = useState("");
  const [repPhoto, setRepPhoto]     = useState<string>("");
  const [repPhotoName, setRepPhotoName] = useState("");
  const [repMsg, setRepMsg]         = useState("");
  const photoInputRef = useRef<HTMLInputElement>(null);

  const canModerate = currentUser?.role === "deputy" || currentUser?.role === "chief";
  const canInstruct = ["instructor","jr_instructor","deputy","chief"].includes(currentUser?.role || "");
  const isChief     = currentUser?.role === "chief";

  function handleLogin() {
    const u = users.find(u => u.login === loginVal && u.password === passVal);
    if (!u) { setLoginErr("Неверный логин или пароль"); return; }
    setCurrentUser(u);
    setLoginErr("");
    setLoginVal(""); setPassVal("");
  }

  function handleRegister() {
    if (!regName || !regLogin || !regPass || !regTab) { setRegMsg("Заполните все поля"); return; }
    if (users.find(u => u.login === regLogin)) { setRegMsg("Логин уже занят"); return; }
    const newUser: UserRecord = {
      id: String(Date.now()),
      login: regLogin, password: regPass,
      name: regName, tabNumber: regTab,
      role: regRole, rank: "private",
      joinDate: new Date().toLocaleDateString("ru-RU"),
      progress: { lecturesListened: [], practicesDone: [], examsPassed: [] },
    };
    setUsers(p => [...p, newUser]);
    setRegMsg(`✓ Аккаунт создан. Логин: ${regLogin} / Пароль: ${regPass}`);
    setRegName(""); setRegLogin(""); setRegPass(""); setRegTab(""); setRegRole("cadet");
  }

  function setProgress(userId: string, field: keyof UserRecord["progress"], itemId: string, val: boolean) {
    setUsers(prev => prev.map(u => {
      if (u.id !== userId) return u;
      const list = u.progress[field];
      const updated = val ? [...list, itemId] : list.filter(x => x !== itemId);
      return { ...u, progress: { ...u.progress, [field]: updated } };
    }));
    if (currentUser?.id === userId) {
      setCurrentUser(prev => {
        if (!prev) return prev;
        const list = prev.progress[field];
        const updated = val ? [...list, itemId] : list.filter(x => x !== itemId);
        return { ...prev, progress: { ...prev.progress, [field]: updated } };
      });
    }
  }

  function setRank(userId: string, rank: Rank) {
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, rank } : u));
    if (currentUser?.id === userId) setCurrentUser(p => p ? { ...p, rank } : p);
  }

  function setUserRole(userId: string, role: Role) {
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, role } : u));
    if (currentUser?.id === userId) setCurrentUser(p => p ? { ...p, role } : p);
  }

  function submitReport() {
    if (!currentUser) return;
    if (!repSign) { setRepMsg("Укажите подпись"); return; }
    const newReport: Report = {
      id: Date.now(), authorId: currentUser.id,
      authorName: currentUser.name.split(" ").slice(0,2).join(" "),
      tabNumber: currentUser.tabNumber,
      direction: repDir === "p2j" ? "Рядовой → Мл.сержант" : "Мл.сержант → Сержант",
      date: new Date().toLocaleDateString("ru-RU"),
      status: "pending", signature: repSign, photoName: repPhotoName,
    };
    setReports(p => [newReport, ...p]);
    setRepMsg("✓ Рапорт отправлен на рассмотрение");
    setRepSign(""); setRepPhoto(""); setRepPhotoName("");
  }

  function updateReportStatus(id: number, status: string) {
    setReports(p => p.map(r => r.id === id ? { ...r, status } : r));
  }

  // Rank-based lecture access
  function getLecturesForUser(u: UserRecord) {
    if (u.rank === "private")     return { show: LECTURES_P2J, practices: PRACTICES_P2J, label: "Рядовой → Мл.сержант" };
    if (u.rank === "jr_sergeant") return { show: LECTURES_J2S, practices: PRACTICES_J2S, label: "Мл.сержант → Сержант" };
    return { show: [] as typeof LECTURES_P2J, practices: [] as typeof PRACTICES_P2J, label: "" };
  }

  const cadets = users.filter(u => u.role === "cadet");
  const targetUser = currentUser; // viewing own profile

  // ── LOGIN SCREEN ─────────────────────────────────────────
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-[#f5f7fa] font-golos flex flex-col">
        {/* Top bar */}
        <div className="bg-[hsl(220,30%,14%)] text-white py-3 px-6 flex items-center gap-3">
          <Icon name="Shield" size={18} className="text-amber-400" />
          <span className="font-oswald text-base tracking-widest uppercase font-semibold">АВНГ — Академия</span>
        </div>

        {/* Hero */}
        <div className="bg-white border-b border-border py-12 px-4 text-center">
          <div className="w-16 h-16 rounded-2xl bg-[hsl(220,60%,28%)]/10 border-2 border-[hsl(220,60%,28%)]/30 flex items-center justify-center mx-auto mb-5">
            <Icon name="Shield" size={28} className="text-[hsl(220,60%,28%)]" />
          </div>
          <h1 className="font-oswald text-4xl font-bold text-foreground tracking-wide mb-2">
            Учебный портал АВНГ
          </h1>
          <p className="text-muted-foreground text-sm max-w-sm mx-auto">
            Академия войск национальной гвардии — вход только для сотрудников
          </p>
        </div>

        {/* Login card */}
        <div className="flex-1 flex items-start justify-center pt-12 px-4">
          <div className="w-full max-w-sm">
            <div className="card-accent p-8">
              <h2 className="font-oswald text-2xl font-bold text-foreground mb-1 tracking-wide">Вход</h2>
              <p className="text-muted-foreground text-xs mb-6">Введите выданные логин и пароль</p>

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-foreground uppercase tracking-wide mb-1.5 block">Логин</label>
                  <input
                    value={loginVal}
                    onChange={e => setLoginVal(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && handleLogin()}
                    placeholder="Введите логин"
                    className="w-full border border-border rounded-lg px-4 py-2.5 text-sm text-foreground bg-white placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-foreground uppercase tracking-wide mb-1.5 block">Пароль</label>
                  <input
                    type="password"
                    value={passVal}
                    onChange={e => setPassVal(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && handleLogin()}
                    placeholder="Введите пароль"
                    className="w-full border border-border rounded-lg px-4 py-2.5 text-sm text-foreground bg-white placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30"
                  />
                </div>
                {loginErr && (
                  <p className="text-red-600 text-xs font-semibold flex items-center gap-1.5">
                    <Icon name="AlertCircle" size={13} /> {loginErr}
                  </p>
                )}
                <button
                  onClick={handleLogin}
                  className="w-full bg-[hsl(220,60%,28%)] hover:bg-[hsl(220,60%,22%)] text-white font-bold py-2.5 rounded-lg text-sm transition-colors"
                >
                  Войти
                </button>
              </div>
            </div>
            <p className="text-center text-xs text-muted-foreground mt-4">
              Доступ только по выданным учётным данным
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ── MAIN APP ─────────────────────────────────────────────
  const { show: curLectures, practices: curPractices, label: curLabel } = getLecturesForUser(currentUser);
  const listenedCount  = curLectures.filter(l => currentUser.progress.lecturesListened.includes(l.id)).length;
  const practiceCount  = curPractices.filter(p => currentUser.progress.practicesDone.includes(p.id)).length;

  const NAV: { page: Page; icon: string; label: string; allow: Role[] }[] = [
    { page: "home",       icon: "BookOpen",   label: "Лекции",      allow: ["cadet","jr_instructor","instructor","deputy","chief"] },
    { page: "profile",    icon: "User",        label: "Профиль",     allow: ["cadet","jr_instructor","instructor","deputy","chief"] },
    { page: "report",     icon: "FileText",    label: "Рапорт",      allow: ["cadet","jr_instructor","instructor","deputy","chief"] },
    { page: "stats",      icon: "BarChart3",   label: "Статистика",  allow: ["jr_instructor","instructor","deputy","chief"] },
    { page: "moderation", icon: "ShieldAlert", label: "Модерация",   allow: ["deputy","chief"] },
  ];

  const visibleNav = NAV.filter(n => n.allow.includes(currentUser.role));

  return (
    <div className="min-h-screen bg-[#f5f7fa] font-golos">

      {/* ── TOP BAR ── */}
      <div className="bg-[hsl(220,30%,14%)] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Icon name="Shield" size={16} className="text-amber-400" />
            <span className="font-oswald text-sm tracking-widest uppercase font-semibold">АВНГ — Академия</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-400 hidden sm:block">{currentUser.tabNumber}</span>
            <span className="text-xs text-slate-300 font-semibold hidden sm:block">{ROLE_LABEL[currentUser.role]}</span>
            <button onClick={() => setCurrentUser(null)} className="text-xs text-slate-400 hover:text-white flex items-center gap-1 transition-colors">
              <Icon name="LogOut" size={13} /> Выйти
            </button>
          </div>
        </div>
      </div>

      {/* ── HEADER / NAV ── */}
      <header className="bg-white border-b border-border shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-14">
            {/* User chip */}
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-[hsl(220,60%,28%)]/10 border border-[hsl(220,60%,28%)]/30 flex items-center justify-center">
                <Icon name="User" size={14} className="text-[hsl(220,60%,28%)]" />
              </div>
              <div className="leading-tight">
                <p className="text-xs font-bold text-foreground">{currentUser.name.split(" ").slice(0,2).join(" ")}</p>
                <p className="text-[10px] text-muted-foreground">{RANK_LABEL[currentUser.rank]}</p>
              </div>
            </div>

            {/* Desktop nav */}
            <nav className="hidden md:flex items-center gap-0.5">
              {visibleNav.map(({ page: p, icon, label }) => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-semibold transition-all duration-150 ${
                    page === p
                      ? "bg-[hsl(220,60%,28%)] text-white"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                  }`}
                >
                  <Icon name={icon} size={14} />
                  {label}
                </button>
              ))}
            </nav>

            <button className="md:hidden p-2 text-muted-foreground" onClick={() => setMobileMenu(!mobileMenu)}>
              <Icon name={mobileMenu ? "X" : "Menu"} size={20} />
            </button>
          </div>

          {mobileMenu && (
            <div className="md:hidden border-t border-border py-2 space-y-0.5 animate-fade-in">
              {visibleNav.map(({ page: p, icon, label }) => (
                <button
                  key={p}
                  onClick={() => { setPage(p); setMobileMenu(false); }}
                  className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-md text-sm font-semibold ${
                    page === p ? "bg-[hsl(220,60%,28%)] text-white" : "text-muted-foreground"
                  }`}
                >
                  <Icon name={icon} size={14} /> {label}
                </button>
              ))}
            </div>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">

        {/* ══════════ ЛЕКЦИИ ══════════ */}
        {page === "home" && (
          <div className="space-y-6 animate-slide-up">
            <div className="page-header">
              <h1 className="font-oswald text-3xl font-bold text-foreground tracking-wide">Лекции и практика</h1>
              <p className="text-muted-foreground text-sm mt-0.5">
                {currentUser.rank === "sergeant"
                  ? "Все аттестации пройдены"
                  : `Программа: ${curLabel}`}
              </p>
            </div>

            {currentUser.rank === "sergeant" ? (
              <div className="card-accent p-8 text-center">
                <Icon name="Award" size={40} className="text-amber-500 mx-auto mb-3" />
                <h2 className="font-oswald text-2xl font-bold text-foreground">Звание Сержант</h2>
                <p className="text-muted-foreground text-sm mt-1">Вы прошли все ступени аттестации</p>
              </div>
            ) : (
              <>
                {/* Progress summary */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {[
                    { label: "Лекций пройдено", val: `${listenedCount}/${curLectures.length}`, icon: "BookOpen", color: "text-blue-600" },
                    { label: "Практик выполнено", val: `${practiceCount}/${curPractices.length}`, icon: "CheckSquare", color: "text-green-600" },
                    { label: "Следующее звание", val: RANK_LABEL[RANK_NEXT[currentUser.rank] || "sergeant"], icon: "TrendingUp", color: "text-amber-600" },
                  ].map(m => (
                    <div key={m.label} className="card-base p-4">
                      <Icon name={m.icon} size={18} className={`${m.color} mb-2`} />
                      <div className={`text-2xl font-oswald font-bold ${m.color}`}>{m.val}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">{m.label}</div>
                    </div>
                  ))}
                </div>

                {/* Lectures */}
                <div className="card-base overflow-hidden">
                  <div className="px-6 py-3.5 border-b border-border bg-secondary/40 flex items-center justify-between">
                    <h2 className="font-oswald text-base font-bold tracking-widest uppercase text-foreground">Лекции и экзамены</h2>
                  </div>
                  <div className="divide-y divide-border">
                    {curLectures.map((item) => {
                      const done = currentUser.progress.lecturesListened.includes(item.id);
                      return (
                        <div key={item.id} className={`flex items-center gap-4 px-6 py-4 ${done ? "bg-green-50" : "bg-white"}`}>
                          <div className="rank-bar" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <span className={`status-badge text-xs ${item.type === "Экзамен"
                                ? "bg-orange-100 text-orange-700 border border-orange-300"
                                : "bg-blue-100 text-blue-700 border border-blue-300"}`}>
                                {item.type}
                              </span>
                              {done && <span className="status-badge bg-green-100 text-green-700 border border-green-300">✓ Пройдено</span>}
                            </div>
                            <p className="font-semibold text-foreground text-sm">{item.title}</p>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <a href={item.link} target="_blank" rel="noopener noreferrer"
                              className="flex items-center gap-1 px-3 py-1.5 rounded-md bg-white border border-border text-xs font-semibold text-muted-foreground hover:border-primary/50 hover:text-primary transition-colors">
                              <Icon name="ExternalLink" size={11} /> Открыть
                            </a>
                            {canInstruct && item.type === "Лекция" && (
                              <button
                                onClick={() => setProgress(currentUser.id, "lecturesListened", item.id, !done)}
                                className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-bold transition-colors ${
                                  done
                                    ? "bg-green-100 text-green-700 border border-green-300 hover:bg-red-50 hover:text-red-600 hover:border-red-300"
                                    : "bg-[hsl(220,60%,28%)] text-white hover:bg-[hsl(220,60%,22%)]"
                                }`}
                              >
                                <Icon name={done ? "CheckCircle2" : "Check"} size={11} />
                                {done ? "Зачтено" : "Зачесть"}
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Practices */}
                <div className="card-base overflow-hidden">
                  <div className="px-6 py-3.5 border-b border-border bg-secondary/40">
                    <h2 className="font-oswald text-base font-bold tracking-widest uppercase text-foreground">
                      Практические задания
                    </h2>
                  </div>
                  <div className="divide-y divide-border">
                    {curPractices.map((item) => {
                      const done = currentUser.progress.practicesDone.includes(item.id);
                      return (
                        <div key={item.id} className={`flex items-center gap-4 px-6 py-3.5 ${done ? "bg-green-50" : "bg-white"}`}>
                          <div className={`w-5 h-5 rounded border flex items-center justify-center flex-shrink-0 ${done ? "bg-green-100 border-green-400" : "border-border"}`}>
                            {done && <Icon name="Check" size={11} className="text-green-600" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-semibold ${done ? "text-foreground" : "text-foreground"}`}>{item.title}</p>
                            <p className="text-xs text-muted-foreground">{item.desc}</p>
                          </div>
                          {canInstruct && (
                            <button
                              onClick={() => setProgress(currentUser.id, "practicesDone", item.id, !done)}
                              className={`text-xs px-3 py-1.5 rounded-md font-bold flex-shrink-0 transition-colors ${
                                done
                                  ? "bg-green-100 text-green-700 border border-green-300 hover:bg-red-50 hover:text-red-600 hover:border-red-300"
                                  : "bg-[hsl(220,60%,28%)] text-white hover:bg-[hsl(220,60%,22%)]"
                              }`}
                            >
                              {done ? "Зачтено" : "Зачесть"}
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* ══════════ ПРОФИЛЬ ══════════ */}
        {page === "profile" && targetUser && (
          <div className="space-y-6 animate-slide-up max-w-2xl">
            <div className="page-header">
              <h1 className="font-oswald text-3xl font-bold text-foreground tracking-wide">Профиль</h1>
            </div>

            <div className="card-accent p-6">
              <div className="flex items-start gap-5">
                <div className="w-16 h-16 rounded-xl bg-[hsl(220,60%,28%)]/10 border-2 border-[hsl(220,60%,28%)]/30 flex items-center justify-center flex-shrink-0">
                  <Icon name="User" size={28} className="text-[hsl(220,60%,28%)]" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-foreground">{targetUser.name}</h2>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <span className="status-badge bg-secondary border border-border text-muted-foreground">{targetUser.tabNumber}</span>
                    <span className="status-badge bg-[hsl(220,60%,28%)]/10 text-[hsl(220,60%,28%)] border border-[hsl(220,60%,28%)]/30">
                      {RANK_LABEL[targetUser.rank]}
                    </span>
                    <span className="status-badge bg-amber-100 text-amber-700 border border-amber-300">
                      {ROLE_LABEL[targetUser.role]}
                    </span>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 mt-5">
                {[
                  { label: "Табельный", value: targetUser.tabNumber, icon: "Hash" },
                  { label: "Дата зачисления", value: targetUser.joinDate, icon: "Calendar" },
                  { label: "Звание", value: RANK_LABEL[targetUser.rank], icon: "Award" },
                  { label: "Должность", value: ROLE_LABEL[targetUser.role], icon: "Briefcase" },
                ].map(it => (
                  <div key={it.label} className="bg-secondary/40 rounded-lg border border-border p-3">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <Icon name={it.icon} size={12} className="text-primary" />
                      <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wide">{it.label}</span>
                    </div>
                    <p className="font-bold text-foreground text-sm">{it.value}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Progress checklist */}
            <div className="card-base p-6">
              <h3 className="font-oswald text-base font-bold tracking-widest uppercase text-foreground mb-4">Прогресс</h3>
              {targetUser.rank === "sergeant" ? (
                <p className="text-green-600 font-bold text-sm">✓ Все аттестации пройдены</p>
              ) : (
                <div className="space-y-2">
                  {[...curLectures, ...curPractices].map(item => {
                    const field = "link" in item ? "lecturesListened" : "practicesDone";
                    const done = targetUser.progress[field].includes(item.id);
                    return (
                      <div key={item.id} className="flex items-center gap-2.5">
                        <div className={`w-5 h-5 rounded flex-shrink-0 border flex items-center justify-center ${done ? "bg-green-100 border-green-400" : "border-border"}`}>
                          {done && <Icon name="Check" size={11} className="text-green-600" />}
                        </div>
                        <span className={`text-sm font-semibold ${done ? "text-foreground" : "text-muted-foreground"}`}>{item.title}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ══════════ РАПОРТ ══════════ */}
        {page === "report" && (
          <div className="space-y-6 animate-slide-up max-w-2xl">
            <div className="page-header">
              <h1 className="font-oswald text-3xl font-bold text-foreground tracking-wide">Рапорт</h1>
              <p className="text-muted-foreground text-sm mt-0.5">Подача рапорта на повышение</p>
            </div>

            {/* Form */}
            <div className="card-accent p-6 space-y-5">
              <div>
                <label className="text-xs font-bold uppercase tracking-wide text-foreground mb-1.5 block">Направление</label>
                <div className="flex gap-3 flex-wrap">
                  {[
                    { val: "p2j" as const, label: "Рядовой → Мл.сержант" },
                    { val: "j2s" as const, label: "Мл.сержант → Сержант" },
                  ].map(d => (
                    <button
                      key={d.val}
                      onClick={() => setRepDir(d.val)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-semibold transition-all ${
                        repDir === d.val
                          ? "border-primary bg-[hsl(220,60%,28%)] text-white"
                          : "border-border bg-white text-muted-foreground hover:border-primary/50"
                      }`}
                    >
                      <Icon name="ChevronUp" size={14} /> {d.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Auto-filled info */}
              <div className="bg-secondary/50 rounded-lg border border-border p-4 space-y-1.5 text-sm">
                <p><span className="font-bold text-foreground">ФИО:</span> <span className="text-muted-foreground">{currentUser.name}</span></p>
                <p><span className="font-bold text-foreground">Табельный:</span> <span className="text-muted-foreground">{currentUser.tabNumber}</span></p>
                <p><span className="font-bold text-foreground">Текущее звание:</span> <span className="text-muted-foreground">{RANK_LABEL[currentUser.rank]}</span></p>
                <p><span className="font-bold text-foreground">Дата:</span> <span className="text-muted-foreground">{new Date().toLocaleDateString("ru-RU")}</span></p>
              </div>

              {/* Report preview */}
              <div className="bg-white rounded-lg border border-border p-4 font-mono text-xs leading-7 text-muted-foreground">
                <p className="font-bold text-foreground">• Отчёт о прослушанных лекциях:</p>
                {(repDir === "p2j" ? LECTURES_P2J : LECTURES_J2S).filter(l => l.type === "Лекция").map(l => {
                  const done = currentUser.progress.lecturesListened.includes(l.id);
                  return (
                    <p key={l.id} className={done ? "text-green-600" : "text-muted-foreground/50"}>
                      &nbsp;&nbsp;— {l.title} {done ? "✓" : "(не зачтено)"}
                    </p>
                  );
                })}
                <p className="font-bold text-foreground mt-2">• Практические задания:</p>
                {(repDir === "p2j" ? PRACTICES_P2J : PRACTICES_J2S).map(p => {
                  const done = currentUser.progress.practicesDone.includes(p.id);
                  return (
                    <p key={p.id} className={done ? "text-green-600" : "text-muted-foreground/50"}>
                      &nbsp;&nbsp;— {p.title} {done ? "✓" : "(не выполнено)"}
                    </p>
                  );
                })}
              </div>

              {/* Photo upload */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wide text-foreground mb-1.5 block">Фото</label>
                <input ref={photoInputRef} type="file" accept=".jpg,.jpeg,.png" className="hidden"
                  onChange={e => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    setRepPhotoName(file.name);
                    const reader = new FileReader();
                    reader.onload = ev => setRepPhoto(ev.target?.result as string);
                    reader.readAsDataURL(file);
                  }}
                />
                {repPhoto ? (
                  <div className="relative inline-block">
                    <img src={repPhoto} alt="фото" className="w-40 h-40 object-cover rounded-lg border border-border" />
                    <button onClick={() => { setRepPhoto(""); setRepPhotoName(""); }}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600">
                      <Icon name="X" size={11} />
                    </button>
                  </div>
                ) : (
                  <button onClick={() => photoInputRef.current?.click()}
                    className="w-full border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary/50 transition-colors bg-white">
                    <Icon name="Upload" size={22} className="text-muted-foreground mx-auto mb-1.5" />
                    <p className="text-sm text-muted-foreground font-semibold">Нажмите для загрузки фото</p>
                    <p className="text-xs text-muted-foreground/60 mt-0.5">.jpg, .png</p>
                  </button>
                )}
              </div>

              {/* Signature */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wide text-foreground mb-1.5 block">Подпись</label>
                <input
                  value={repSign}
                  onChange={e => setRepSign(e.target.value)}
                  placeholder="Введите ФИО для подписи"
                  className="w-full border border-border rounded-lg px-4 py-2.5 text-sm bg-white text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30"
                />
              </div>

              {repMsg && (
                <p className={`text-sm font-semibold ${repMsg.startsWith("✓") ? "text-green-600" : "text-red-600"}`}>
                  {repMsg}
                </p>
              )}

              <button onClick={submitReport}
                className="flex items-center gap-2 px-6 py-2.5 bg-[hsl(220,60%,28%)] hover:bg-[hsl(220,60%,22%)] text-white rounded-lg font-bold text-sm transition-colors">
                <Icon name="Send" size={14} /> Отправить рапорт
              </button>
            </div>

            {/* My reports history */}
            <div className="card-base overflow-hidden">
              <div className="px-6 py-3.5 border-b border-border bg-secondary/40">
                <h2 className="font-oswald text-base font-bold tracking-widest uppercase text-foreground">История рапортов</h2>
              </div>
              <div className="divide-y divide-border">
                {reports.filter(r => canModerate || r.authorId === currentUser.id).length === 0 && (
                  <p className="px-6 py-4 text-sm text-muted-foreground">Рапортов пока нет</p>
                )}
                {reports.filter(r => canModerate || r.authorId === currentUser.id).map(r => (
                  <div key={r.id} className="px-6 py-4 flex flex-col sm:flex-row sm:items-center gap-2">
                    <div className="flex-1">
                      <p className="font-bold text-foreground text-sm">{r.direction}</p>
                      <p className="text-xs text-muted-foreground">{r.authorName} · {r.tabNumber} · {r.date}</p>
                      {r.signature && <p className="text-xs text-muted-foreground">Подпись: {r.signature}</p>}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`status-badge ${STATUS_MAP[r.status].cls}`}>{STATUS_MAP[r.status].label}</span>
                      {canModerate && (
                        <>
                          <button onClick={() => updateReportStatus(r.id, "approved")} className="text-xs px-3 py-1 rounded bg-green-100 text-green-700 border border-green-300 hover:bg-green-200 font-bold transition-colors">Одобрить</button>
                          <button onClick={() => updateReportStatus(r.id, "rejected")} className="text-xs px-3 py-1 rounded bg-red-100 text-red-700 border border-red-300 hover:bg-red-200 font-bold transition-colors">Отклонить</button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ══════════ СТАТИСТИКА ══════════ */}
        {page === "stats" && canInstruct && (
          <div className="space-y-6 animate-slide-up">
            <div className="page-header">
              <h1 className="font-oswald text-3xl font-bold text-foreground tracking-wide">Статистика</h1>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: "Курсантов", val: cadets.length, icon: "Users", color: "text-blue-600" },
                { label: "Рапортов", val: reports.length, icon: "FileText", color: "text-amber-600" },
                { label: "На рассмотрении", val: reports.filter(r=>r.status==="pending").length, icon: "Clock", color: "text-yellow-600" },
                { label: "Одобрено", val: reports.filter(r=>r.status==="approved").length, icon: "CheckCircle2", color: "text-green-600" },
              ].map(m => (
                <div key={m.label} className="card-base p-5">
                  <Icon name={m.icon} size={20} className={`${m.color} mb-2`} />
                  <div className={`text-3xl font-oswald font-bold ${m.color}`}>{m.val}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{m.label}</div>
                </div>
              ))}
            </div>

            {/* Cadets progress table */}
            <div className="card-base overflow-hidden">
              <div className="px-6 py-3.5 border-b border-border bg-secondary/40">
                <h2 className="font-oswald text-base font-bold tracking-widest uppercase text-foreground">Прогресс курсантов</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-secondary/20 text-xs font-bold text-muted-foreground uppercase tracking-wide">
                      <th className="px-6 py-3 text-left">ФИО</th>
                      <th className="px-6 py-3 text-left">Таб. №</th>
                      <th className="px-6 py-3 text-left">Звание</th>
                      <th className="px-6 py-3 text-left">Лекции</th>
                      <th className="px-6 py-3 text-left">Практика</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {cadets.map(u => {
                      const { show: lecs, practices: pracs } = getLecturesForUser(u);
                      const ld = lecs.filter(l => u.progress.lecturesListened.includes(l.id)).length;
                      const pd = pracs.filter(p => u.progress.practicesDone.includes(p.id)).length;
                      return (
                        <tr key={u.id} className="hover:bg-secondary/20 transition-colors">
                          <td className="px-6 py-3 font-semibold text-foreground">{u.name}</td>
                          <td className="px-6 py-3 text-muted-foreground font-mono">{u.tabNumber}</td>
                          <td className="px-6 py-3">
                            <span className="status-badge bg-[hsl(220,60%,28%)]/10 text-[hsl(220,60%,28%)] border border-[hsl(220,60%,28%)]/20">
                              {RANK_LABEL[u.rank]}
                            </span>
                          </td>
                          <td className="px-6 py-3">
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-1.5 bg-secondary rounded-full w-20 overflow-hidden">
                                <div className="h-full bg-blue-500 rounded-full" style={{ width: lecs.length ? `${(ld/lecs.length)*100}%` : "0" }} />
                              </div>
                              <span className="text-xs text-muted-foreground">{ld}/{lecs.length}</span>
                            </div>
                          </td>
                          <td className="px-6 py-3">
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-1.5 bg-secondary rounded-full w-20 overflow-hidden">
                                <div className="h-full bg-green-500 rounded-full" style={{ width: pracs.length ? `${(pd/pracs.length)*100}%` : "0" }} />
                              </div>
                              <span className="text-xs text-muted-foreground">{pd}/{pracs.length}</span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Reports table */}
            <div className="card-base overflow-hidden">
              <div className="px-6 py-3.5 border-b border-border bg-secondary/40">
                <h2 className="font-oswald text-base font-bold tracking-widest uppercase text-foreground">Все рапорты</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-secondary/20 text-xs font-bold text-muted-foreground uppercase tracking-wide">
                      <th className="px-6 py-3 text-left">#</th>
                      <th className="px-6 py-3 text-left">Курсант</th>
                      <th className="px-6 py-3 text-left">Направление</th>
                      <th className="px-6 py-3 text-left">Дата</th>
                      <th className="px-6 py-3 text-left">Статус</th>
                      {canModerate && <th className="px-6 py-3 text-left">Действия</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {reports.map(r => (
                      <tr key={r.id} className="hover:bg-secondary/20 transition-colors">
                        <td className="px-6 py-3 font-mono text-muted-foreground text-xs">#{r.id.toString().slice(-4)}</td>
                        <td className="px-6 py-3 font-semibold text-foreground">{r.authorName}</td>
                        <td className="px-6 py-3 text-muted-foreground">{r.direction}</td>
                        <td className="px-6 py-3 text-muted-foreground">{r.date}</td>
                        <td className="px-6 py-3">
                          <span className={`status-badge ${STATUS_MAP[r.status].cls}`}>{STATUS_MAP[r.status].label}</span>
                        </td>
                        {canModerate && (
                          <td className="px-6 py-3">
                            <div className="flex gap-1.5">
                              <button onClick={() => updateReportStatus(r.id,"approved")} className="text-xs px-2.5 py-1 rounded bg-green-100 text-green-700 border border-green-300 font-bold hover:bg-green-200 transition-colors">Одобрить</button>
                              <button onClick={() => updateReportStatus(r.id,"rejected")} className="text-xs px-2.5 py-1 rounded bg-red-100 text-red-700 border border-red-300 font-bold hover:bg-red-200 transition-colors">Отклонить</button>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ══════════ МОДЕРАЦИЯ ══════════ */}
        {page === "moderation" && canModerate && (
          <div className="space-y-6 animate-slide-up">
            <div className="page-header">
              <h1 className="font-oswald text-3xl font-bold text-foreground tracking-wide">Модерация</h1>
              <p className="text-muted-foreground text-sm mt-0.5">Управление пользователями — {ROLE_LABEL[currentUser.role]}</p>
            </div>

            {/* Register new user */}
            <div className="card-accent p-6">
              <div className="flex items-center gap-2 mb-4">
                <Icon name="UserPlus" size={18} className="text-primary" />
                <h2 className="font-oswald text-lg font-bold tracking-widest uppercase text-foreground">Зарегистрировать пользователя</h2>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                {[
                  { label: "ФИО", val: regName, set: setRegName, ph: "Фамилия Имя Отчество" },
                  { label: "Табельный номер", val: regTab, set: setRegTab, ph: "АВ-ХXXX" },
                  { label: "Логин", val: regLogin, set: setRegLogin, ph: "Логин для входа" },
                  { label: "Пароль", val: regPass, set: setRegPass, ph: "Пароль" },
                ].map(f => (
                  <div key={f.label}>
                    <label className="text-xs font-bold uppercase tracking-wide text-foreground mb-1.5 block">{f.label}</label>
                    <input value={f.val} onChange={e => f.set(e.target.value)} placeholder={f.ph}
                      className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-white text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary" />
                  </div>
                ))}
              </div>
              <div className="mt-4">
                <label className="text-xs font-bold uppercase tracking-wide text-foreground mb-1.5 block">Роль</label>
                <select value={regRole} onChange={e => setRegRole(e.target.value as Role)}
                  className="border border-border rounded-lg px-3 py-2 text-sm bg-white text-foreground focus:outline-none focus:border-primary">
                  <option value="cadet">Курсант</option>
                  <option value="jr_instructor">Мл. инструктор</option>
                  <option value="instructor">Инструктор</option>
                  {isChief && <option value="deputy">Зам.Нач.АВНГ</option>}
                </select>
              </div>
              {regMsg && (
                <p className={`mt-3 text-sm font-semibold ${regMsg.startsWith("✓") ? "text-green-600" : "text-red-600"}`}>{regMsg}</p>
              )}
              <button onClick={handleRegister}
                className="mt-4 flex items-center gap-2 px-6 py-2.5 bg-[hsl(220,60%,28%)] hover:bg-[hsl(220,60%,22%)] text-white rounded-lg font-bold text-sm transition-colors">
                <Icon name="UserPlus" size={14} /> Создать аккаунт
              </button>
            </div>

            {/* Users list */}
            <div className="card-base overflow-hidden">
              <div className="px-6 py-3.5 border-b border-border bg-secondary/40">
                <h2 className="font-oswald text-base font-bold tracking-widest uppercase text-foreground">Все пользователи</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-secondary/20 text-xs font-bold text-muted-foreground uppercase tracking-wide">
                      <th className="px-6 py-3 text-left">ФИО</th>
                      <th className="px-6 py-3 text-left">Логин</th>
                      <th className="px-6 py-3 text-left">Роль</th>
                      <th className="px-6 py-3 text-left">Звание</th>
                      {canModerate && <th className="px-6 py-3 text-left">Управление</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {users.map(u => (
                      <tr key={u.id} className="hover:bg-secondary/20 transition-colors">
                        <td className="px-6 py-3 font-semibold text-foreground">{u.name}</td>
                        <td className="px-6 py-3 font-mono text-muted-foreground text-xs">{u.login}</td>
                        <td className="px-6 py-3">
                          {canModerate ? (
                            <select
                              value={u.role}
                              onChange={e => setUserRole(u.id, e.target.value as Role)}
                              disabled={u.role === "chief" && !isChief}
                              className="text-xs border border-border rounded px-2 py-1 bg-white focus:outline-none focus:border-primary"
                            >
                              <option value="cadet">Курсант</option>
                              <option value="jr_instructor">Мл. инструктор</option>
                              <option value="instructor">Инструктор</option>
                              <option value="deputy">Зам.Нач.АВНГ</option>
                              {isChief && <option value="chief">Нач.АВНГ</option>}
                            </select>
                          ) : (
                            <span className="status-badge bg-secondary border border-border text-muted-foreground">{ROLE_LABEL[u.role]}</span>
                          )}
                        </td>
                        <td className="px-6 py-3">
                          {canModerate ? (
                            <select
                              value={u.rank}
                              onChange={e => setRank(u.id, e.target.value as Rank)}
                              className="text-xs border border-border rounded px-2 py-1 bg-white focus:outline-none focus:border-primary"
                            >
                              <option value="private">Рядовой</option>
                              <option value="jr_sergeant">Мл. сержант</option>
                              <option value="sergeant">Сержант</option>
                            </select>
                          ) : (
                            <span className="status-badge bg-[hsl(220,60%,28%)]/10 text-[hsl(220,60%,28%)] border border-[hsl(220,60%,28%)]/20">{RANK_LABEL[u.rank]}</span>
                          )}
                        </td>
                        {canModerate && (
                          <td className="px-6 py-3">
                            <span className="text-xs text-muted-foreground">Пароль: <span className="font-mono font-bold text-foreground">{u.password}</span></span>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className="border-t border-border mt-16 py-4 px-4 bg-white">
        <div className="max-w-7xl mx-auto flex items-center justify-between text-xs text-muted-foreground">
          <span className="font-oswald tracking-widest uppercase text-[hsl(220,60%,28%)] font-bold">АВНГ Академия</span>
          <span>© 2026 · Учебный портал</span>
        </div>
      </footer>
    </div>
  );
}
