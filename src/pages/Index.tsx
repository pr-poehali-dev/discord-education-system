import { useState } from "react";
import Icon from "@/components/ui/icon";

type Page = "home" | "profile" | "stats" | "moderation";
type Role = "cadet" | "instructor" | "deputy" | "chief";

const ROLE_LABELS: Record<Role, string> = {
  cadet: "Рядовой",
  instructor: "Инструктор",
  deputy: "Зам.Нач.АВНГ",
  chief: "Нач.АВНГ",
};

const ROLE_COLORS: Record<Role, string> = {
  cadet: "text-blue-400",
  instructor: "text-green-400",
  deputy: "text-yellow-400",
  chief: "text-amber-400",
};

const mockUser = {
  name: "Иванов Дмитрий Сергеевич",
  tabNumber: "АВ-2847",
  rank: "Рядовой",
  discordId: "857432901234",
  joinDate: "15.03.2026",
};

const lectures = {
  p2j: [
    { id: "l1", type: "Лекция", title: "Вступительная лекция", link: "https://docs.google.com/presentation/d/1TunNnou9K9ZH_QDsmx0N-OKhSSRQot6o6J09dMgcp5c/edit?usp=sharing" },
    { id: "l2", type: "Лекция", title: "ФЗ о ФСВНГ и Устав ФСВНГ", link: "https://docs.google.com/document/d/1fir1wtveTcp5n5MQ-dJ25syfUWJ_QsyOaxjpjx6Vci8/edit?usp=sharing" },
    { id: "l3", type: "Экзамен", title: "Тест: Устав ФСВНГ + ФЗ о ФСВНГ", link: "https://discord.com" },
  ],
  j2s: [
    { id: "l4", type: "Лекция", title: "УК, ПК, КоАП", link: "https://docs.google.com/presentation/d/18NqJPtXdvhpl5ChP-1VRfBP77ZsCmVSYOhGbDVqdygA/edit?usp=sharing" },
    { id: "l5", type: "Лекция", title: "Допуск к закрытой и охраняемой территории", link: "https://docs.google.com/presentation/d/1rk_v4cruYlBn4gd1zI2jgemZycuJnQqYseNnP5ARsG8/edit?usp=sharing" },
    { id: "l6", type: "Экзамен", title: "Тесты: УК, ПК, КоАП", link: "https://discord.com" },
  ],
};

const mockReports = [
  { id: 1, cadet: "Иванов Д.С.", type: "Рядовой → Мл.сержант", date: "12.06.2026", status: "pending" },
  { id: 2, cadet: "Иванов Д.С.", type: "Мл.сержант → Сержант", date: "05.06.2026", status: "approved" },
  { id: 3, cadet: "Петров А.В.", type: "Рядовой → Мл.сержант", date: "28.05.2026", status: "rejected" },
];

const mockBlacklist = [
  { id: "123456789", name: "Петров А.С.", reason: "Нарушение устава", date: "01.06.2026" },
];
const mockWhitelist = [
  { id: "987654321", name: "Сидоров В.К.", reason: "Доверенный", date: "10.06.2026" },
];

const statusMap: Record<string, { label: string; cls: string }> = {
  pending: { label: "На рассмотрении", cls: "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30" },
  approved: { label: "Одобрено", cls: "bg-green-500/20 text-green-400 border border-green-500/30" },
  rejected: { label: "Отклонено", cls: "bg-red-500/20 text-red-400 border border-red-500/30" },
};

export default function Index() {
  const [activePage, setActivePage] = useState<Page>("home");
  const [currentRole, setCurrentRole] = useState<Role>("cadet");
  const [listenedMap, setListenedMap] = useState<Record<string, boolean>>({});
  const [direction, setDirection] = useState<"p2j" | "j2s">("p2j");
  const [mobileMenu, setMobileMenu] = useState(false);

  const canModerate = currentRole === "deputy" || currentRole === "chief";
  const canInstruct = currentRole === "instructor" || canModerate;
  const currentLectures = lectures[direction];
  const listenedCount = currentLectures.filter((l) => listenedMap[l.id]).length;

  const navItems: { page: Page; icon: string; label: string; restricted?: boolean }[] = [
    { page: "home", icon: "BookOpen", label: "Лекции" },
    { page: "profile", icon: "User", label: "Профиль" },
    { page: "stats", icon: "BarChart3", label: "Статистика" },
    { page: "moderation", icon: "ShieldAlert", label: "Модерация", restricted: true },
  ];

  return (
    <div className="min-h-screen bg-background font-golos">
      {/* ── Header ── */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur-sm nav-glow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-primary/20 border border-primary/50 flex items-center justify-center">
                <Icon name="Shield" size={17} className="text-primary" />
              </div>
              <div className="leading-none">
                <div className="font-oswald text-lg font-semibold tracking-widest uppercase gold-text">
                  АВНГ
                </div>
                <div className="text-[10px] text-muted-foreground tracking-wider uppercase">Академия</div>
              </div>
            </div>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map(({ page, icon, label, restricted }) => {
                if (restricted && !canModerate) return null;
                return (
                  <button
                    key={page}
                    onClick={() => setActivePage(page)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-semibold transition-all duration-200 ${
                      activePage === page
                        ? "bg-primary/15 text-primary"
                        : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                    }`}
                  >
                    <Icon name={icon} size={14} />
                    {label}
                  </button>
                );
              })}
            </nav>

            {/* Right */}
            <div className="flex items-center gap-3">
              <select
                value={currentRole}
                onChange={(e) => setCurrentRole(e.target.value as Role)}
                className="hidden sm:block text-xs bg-secondary border border-border rounded-md px-2 py-1.5 text-muted-foreground cursor-pointer focus:outline-none focus:border-primary/50"
              >
                <option value="cadet">Рядовой</option>
                <option value="instructor">Инструктор</option>
                <option value="deputy">Зам.Нач.АВНГ</option>
                <option value="chief">Нач.АВНГ</option>
              </select>

              <div className="flex items-center gap-2 bg-secondary rounded-full pl-1 pr-3 py-1 border border-border">
                <div className="w-6 h-6 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center">
                  <Icon name="User" size={12} className="text-primary" />
                </div>
                <span className="text-xs font-bold text-foreground hidden sm:block">{mockUser.tabNumber}</span>
              </div>

              <button
                className="md:hidden p-2 rounded-md text-muted-foreground hover:text-foreground"
                onClick={() => setMobileMenu(!mobileMenu)}
              >
                <Icon name={mobileMenu ? "X" : "Menu"} size={20} />
              </button>
            </div>
          </div>

          {/* Mobile menu */}
          {mobileMenu && (
            <div className="md:hidden border-t border-border py-2 space-y-0.5 animate-fade-in">
              {navItems.map(({ page, icon, label, restricted }) => {
                if (restricted && !canModerate) return null;
                return (
                  <button
                    key={page}
                    onClick={() => { setActivePage(page); setMobileMenu(false); }}
                    className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-md text-sm font-semibold ${
                      activePage === page ? "bg-primary/15 text-primary" : "text-muted-foreground"
                    }`}
                  >
                    <Icon name={icon} size={15} />
                    {label}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">

        {/* ══════════════ HOME ══════════════ */}
        {activePage === "home" && (
          <div className="space-y-7 animate-slide-up">
            {/* Hero banner */}
            <div className="relative overflow-hidden rounded-2xl border border-border card-military p-8">
              <div className="absolute inset-0 opacity-[0.03]" style={{
                backgroundImage: "repeating-linear-gradient(45deg,#C9A227 0,#C9A227 1px,transparent 0,transparent 50%)",
                backgroundSize: "18px 18px",
              }} />
              <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <span className="status-badge bg-primary/20 text-primary border border-primary/30 mb-3 inline-block">
                    Учебный портал
                  </span>
                  <h1 className="font-oswald text-4xl font-bold tracking-wide text-foreground">
                    Библиотека лекций
                  </h1>
                  <p className="text-muted-foreground text-sm mt-1">
                    Академия войск национальной гвардии
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-4xl font-oswald font-bold gold-text">{listenedCount}/{currentLectures.length}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">материалов пройдено</div>
                  <div className="mt-2 h-1.5 w-32 bg-secondary rounded-full overflow-hidden ml-auto">
                    <div
                      className="h-full bg-primary rounded-full transition-all duration-500"
                      style={{ width: `${(listenedCount / currentLectures.length) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Direction tabs */}
            <div className="flex gap-3 flex-wrap">
              {(["p2j", "j2s"] as const).map((dir) => {
                const labels = { p2j: "Рядовой → Мл.сержант", j2s: "Мл.сержант → Сержант" };
                return (
                  <button
                    key={dir}
                    onClick={() => setDirection(dir)}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-lg border font-semibold text-sm transition-all duration-200 ${
                      direction === dir
                        ? "border-primary bg-primary/15 text-primary"
                        : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground"
                    }`}
                  >
                    <Icon name="ChevronUp" size={15} />
                    {labels[dir]}
                  </button>
                );
              })}
            </div>

            {/* Lectures list */}
            <div className="rounded-xl border border-border overflow-hidden">
              <div className="px-6 py-3.5 border-b border-border bg-secondary/30 flex items-center justify-between">
                <h2 className="font-oswald text-base font-semibold tracking-widest uppercase text-muted-foreground">
                  {direction === "p2j" ? "Рядовой → Младший сержант" : "Младший сержант → Сержант"}
                </h2>
                <span className="text-xs text-muted-foreground">
                  {currentLectures.filter(l => l.type === "Лекция").length} лекции ·{" "}
                  {currentLectures.filter(l => l.type === "Экзамен").length} экзамен
                </span>
              </div>
              <div className="divide-y divide-border">
                {currentLectures.map((item, i) => {
                  const done = listenedMap[item.id];
                  return (
                    <div
                      key={item.id}
                      className={`flex items-center gap-4 px-6 py-4 transition-colors duration-150 ${done ? "bg-green-500/5" : "hover:bg-secondary/30"}`}
                      style={{ animationDelay: `${i * 0.06}s` }}
                    >
                      <div className="rank-stripe h-9 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`status-badge ${item.type === "Экзамен"
                            ? "bg-orange-500/15 text-orange-400 border border-orange-500/30"
                            : "bg-blue-500/15 text-blue-400 border border-blue-500/30"}`}>
                            {item.type}
                          </span>
                          {done && <span className="status-badge bg-green-500/15 text-green-400 border border-green-500/30">✓ Пройдено</span>}
                        </div>
                        <p className="font-semibold text-foreground text-sm">{item.title}</p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <a
                          href={item.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-secondary border border-border text-xs font-semibold text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors"
                        >
                          <Icon name="ExternalLink" size={11} />
                          Открыть
                        </a>
                        {item.type === "Лекция" && (
                          <button
                            onClick={() => setListenedMap(p => ({ ...p, [item.id]: !p[item.id] }))}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all duration-200 ${
                              done
                                ? "bg-green-500/20 text-green-400 border border-green-500/30 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/30"
                                : "bg-primary text-primary-foreground hover:bg-primary/80"
                            }`}
                          >
                            <Icon name={done ? "CheckCircle2" : "Check"} size={11} />
                            {done ? "Прослушано" : "Я прослушал"}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Auto-report preview */}
            <div className="card-military rounded-xl p-6 space-y-4">
              <div className="flex items-center gap-3">
                <Icon name="FileText" size={18} className="text-primary" />
                <h2 className="font-oswald text-lg font-semibold tracking-widest uppercase text-foreground">
                  Автоматический рапорт
                </h2>
              </div>
              <div className="bg-background/80 rounded-lg border border-border p-4 font-mono text-xs leading-7 text-muted-foreground">
                <p className="text-foreground font-bold">• Отчёт о прослушанных лекциях:</p>
                {currentLectures.filter(l => l.type === "Лекция").map(l => (
                  <p key={l.id} className={listenedMap[l.id] ? "text-green-400" : "text-muted-foreground/50"}>
                    &nbsp;&nbsp;— {l.title}{" "}
                    <span>{listenedMap[l.id] ? "✓ прослушано" : "(не отмечено)"}</span>
                  </p>
                ))}
                <p className="text-foreground font-bold mt-2">• Отчёт об экзамене:</p>
                {currentLectures.filter(l => l.type === "Экзамен").map(l => (
                  <p key={l.id} className="text-yellow-500/80">
                    &nbsp;&nbsp;— {l.title} — ожидает результата из Discord
                  </p>
                ))}
                <p className="text-muted-foreground mt-2">• ФИО: {mockUser.name}</p>
                <p className="text-muted-foreground">• Табельный: {mockUser.tabNumber}</p>
                <p className="text-muted-foreground">• Дата: 12.06.2026</p>
              </div>
              <button className="flex items-center gap-2 px-6 py-2.5 bg-primary text-primary-foreground rounded-lg font-bold text-sm hover:bg-primary/80 transition-colors">
                <Icon name="Send" size={14} />
                Отправить рапорт
              </button>
            </div>
          </div>
        )}

        {/* ══════════════ PROFILE ══════════════ */}
        {activePage === "profile" && (
          <div className="space-y-6 animate-slide-up max-w-2xl">
            <div>
              <h1 className="font-oswald text-4xl font-bold tracking-wide text-foreground">Профиль</h1>
              <p className="text-muted-foreground text-sm mt-1">Личная карточка курсанта</p>
            </div>

            <div className="card-military rounded-xl p-6">
              <div className="flex items-start gap-5">
                <div className="w-16 h-16 rounded-xl bg-primary/15 border-2 border-primary/40 flex items-center justify-center flex-shrink-0">
                  <Icon name="User" size={28} className="text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-foreground">{mockUser.name}</h2>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <span className="status-badge bg-secondary border border-border text-muted-foreground">{mockUser.tabNumber}</span>
                    <span className={`status-badge bg-primary/15 border border-primary/30 ${ROLE_COLORS[currentRole]}`}>
                      {ROLE_LABELS[currentRole]}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-3">
                {[
                  { label: "Табельный номер", value: mockUser.tabNumber, icon: "Hash" },
                  { label: "Discord ID", value: mockUser.discordId, icon: "MessageCircle" },
                  { label: "Звание", value: ROLE_LABELS[currentRole], icon: "Award" },
                  { label: "Дата зачисления", value: mockUser.joinDate, icon: "Calendar" },
                ].map((item) => (
                  <div key={item.label} className="bg-background rounded-lg border border-border p-3">
                    <div className="flex items-center gap-1.5 mb-1">
                      <Icon name={item.icon} size={12} className="text-primary" />
                      <span className="text-xs text-muted-foreground">{item.label}</span>
                    </div>
                    <p className="font-bold text-foreground text-sm">{item.value}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Progress */}
            <div className="card-military rounded-xl p-6">
              <h3 className="font-oswald text-base font-semibold tracking-widest uppercase text-foreground mb-4">
                Прогресс аттестации
              </h3>
              <div className="space-y-2.5">
                {[
                  { label: "ФП — Физическая подготовка", done: true },
                  { label: "СП — Стрелковая подготовка", done: false },
                  { label: "ТПО — Тактико-правовая подготовка", done: false },
                  { label: "Вступительная лекция", done: true },
                  { label: "ФЗ о ФСВНГ и Устав ФСВНГ", done: false },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-3">
                    <div className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 border ${
                      item.done ? "bg-green-500/20 border-green-500/40" : "bg-secondary border-border"
                    }`}>
                      {item.done && <Icon name="Check" size={11} className="text-green-400" />}
                    </div>
                    <span className={`text-sm font-semibold ${item.done ? "text-foreground" : "text-muted-foreground"}`}>
                      {item.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Photo upload */}
            <div className="card-military rounded-xl p-6">
              <h3 className="font-oswald text-base font-semibold tracking-widest uppercase text-foreground mb-4">
                Фото для рапорта
              </h3>
              <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary/40 transition-colors cursor-pointer">
                <Icon name="Upload" size={26} className="text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground font-semibold">Нажмите для загрузки фото</p>
                <p className="text-xs text-muted-foreground/50 mt-1">.jpg, .png — будет прикреплено к рапорту</p>
              </div>
            </div>
          </div>
        )}

        {/* ══════════════ STATS ══════════════ */}
        {activePage === "stats" && (
          <div className="space-y-6 animate-slide-up">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <h1 className="font-oswald text-4xl font-bold tracking-wide text-foreground">Статистика</h1>
                <p className="text-muted-foreground text-sm mt-1">
                  {canModerate ? "Общая статистика системы" : "Ваши личные показатели"}
                </p>
              </div>
              {canModerate && (
                <span className="status-badge bg-primary/15 text-primary border border-primary/30">
                  Режим администратора
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: "Рапортов сегодня", value: "3", icon: "FileText", color: "text-blue-400" },
                { label: "За неделю", value: "14", icon: "TrendingUp", color: "text-green-400" },
                { label: "Экзаменов сдано", value: "7", icon: "GraduationCap", color: "text-yellow-400" },
                { label: "Лекций пройдено", value: "12", icon: "BookOpen", color: "text-purple-400" },
              ].map((m, i) => (
                <div key={m.label} className="card-military rounded-xl p-5" style={{ animationDelay: `${i * 0.07}s` }}>
                  <Icon name={m.icon} size={20} className={`${m.color} mb-3`} />
                  <div className={`text-3xl font-oswald font-bold ${m.color}`}>{m.value}</div>
                  <div className="text-xs text-muted-foreground mt-1 leading-4">{m.label}</div>
                </div>
              ))}
            </div>

            <div className="card-military rounded-xl overflow-hidden">
              <div className="px-6 py-4 border-b border-border bg-secondary/30">
                <h2 className="font-oswald text-base font-semibold tracking-widest uppercase text-foreground">
                  {canModerate ? "Все рапорты" : "Мои рапорты"}
                </h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border bg-secondary/20 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">
                      <th className="px-6 py-3">#</th>
                      {canModerate && <th className="px-6 py-3">Курсант</th>}
                      <th className="px-6 py-3">Тип</th>
                      <th className="px-6 py-3">Дата</th>
                      <th className="px-6 py-3">Статус</th>
                      {canModerate && <th className="px-6 py-3">Действия</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {mockReports.map((r) => (
                      <tr key={r.id} className="hover:bg-secondary/20 transition-colors">
                        <td className="px-6 py-4 text-sm font-mono text-muted-foreground">#{String(r.id).padStart(4,"0")}</td>
                        {canModerate && <td className="px-6 py-4 text-sm font-semibold text-foreground">{r.cadet}</td>}
                        <td className="px-6 py-4 text-sm text-foreground font-semibold">{r.type}</td>
                        <td className="px-6 py-4 text-sm text-muted-foreground">{r.date}</td>
                        <td className="px-6 py-4">
                          <span className={`status-badge ${statusMap[r.status].cls}`}>{statusMap[r.status].label}</span>
                        </td>
                        {canModerate && (
                          <td className="px-6 py-4">
                            <div className="flex gap-2">
                              <button className="text-xs px-3 py-1 rounded bg-green-500/15 text-green-400 border border-green-500/30 hover:bg-green-500/25 font-bold transition-colors">Одобрить</button>
                              <button className="text-xs px-3 py-1 rounded bg-red-500/15 text-red-400 border border-red-500/30 hover:bg-red-500/25 font-bold transition-colors">Отклонить</button>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {canInstruct && (
              <div className="card-military rounded-xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Icon name="Users" size={18} className="text-primary" />
                  <h2 className="font-oswald text-base font-semibold tracking-widest uppercase text-foreground">
                    Инструкторский журнал
                  </h2>
                </div>
                <div className="space-y-2.5">
                  {[
                    { cadet: "Иванов А.С.", type: "Приём ФП", status: "pending" },
                    { cadet: "Смирнов В.В.", type: "Приём СП + ТПО", status: "approved" },
                  ].map((req, i) => (
                    <div key={i} className="flex items-center justify-between bg-background rounded-lg border border-border p-3">
                      <div>
                        <p className="font-bold text-foreground text-sm">{req.cadet}</p>
                        <p className="text-xs text-muted-foreground">{req.type}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`status-badge ${statusMap[req.status].cls}`}>{statusMap[req.status].label}</span>
                        <button className="text-xs px-3 py-1.5 rounded bg-primary text-primary-foreground font-bold hover:bg-primary/80 transition-colors">
                          Принять
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ══════════════ MODERATION ══════════════ */}
        {activePage === "moderation" && canModerate && (
          <div className="space-y-6 animate-slide-up">
            <div className="flex items-center gap-4 flex-wrap">
              <div>
                <h1 className="font-oswald text-4xl font-bold tracking-wide text-foreground">Модерация</h1>
                <p className="text-muted-foreground text-sm mt-1">Управление доступом — {ROLE_LABELS[currentRole]}</p>
              </div>
              <span className="status-badge bg-red-500/15 text-red-400 border border-red-500/30">
                Ограниченный доступ
              </span>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              {[
                { title: "Белый список", icon: "UserCheck", color: "green", desc: "Доверенные — могут повышаться в звании" },
                { title: "Чёрный список", icon: "UserX", color: "red", desc: "Блокировка подачи рапортов и доступа к лекциям" },
              ].map((list) => (
                <div key={list.title} className="card-military rounded-xl p-5">
                  <div className="flex items-center gap-2 mb-1">
                    <Icon name={list.icon} size={17} className={`text-${list.color}-400`} />
                    <h3 className="font-oswald text-base font-semibold tracking-wide uppercase text-foreground">{list.title}</h3>
                  </div>
                  <p className="text-xs text-muted-foreground mb-4">{list.desc}</p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Discord ID пользователя"
                      className="flex-1 bg-background border border-border rounded-md px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary/60 font-medium"
                    />
                    <button className={`px-4 py-2 rounded-md text-xs font-bold border transition-colors bg-${list.color}-500/15 text-${list.color}-400 border-${list.color}-500/30 hover:bg-${list.color}-500/25`}>
                      Добавить
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Blacklist */}
            <div className="card-military rounded-xl overflow-hidden">
              <div className="px-6 py-4 border-b border-border bg-red-500/5 flex items-center gap-2">
                <Icon name="UserX" size={15} className="text-red-400" />
                <h2 className="font-oswald text-base font-semibold tracking-widest uppercase text-foreground">Чёрный список</h2>
                <span className="ml-auto text-xs text-muted-foreground">{mockBlacklist.length} записей</span>
              </div>
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-secondary/20 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    <th className="px-6 py-3">Discord ID</th>
                    <th className="px-6 py-3">Имя</th>
                    <th className="px-6 py-3">Причина</th>
                    <th className="px-6 py-3">Дата</th>
                    <th className="px-6 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {mockBlacklist.map((item) => (
                    <tr key={item.id} className="hover:bg-secondary/20 transition-colors">
                      <td className="px-6 py-4 text-sm font-mono text-muted-foreground">{item.id}</td>
                      <td className="px-6 py-4 text-sm font-bold text-foreground">{item.name}</td>
                      <td className="px-6 py-4 text-sm text-red-400/80 font-semibold">{item.reason}</td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">{item.date}</td>
                      <td className="px-6 py-4">
                        <button className="text-xs px-3 py-1 rounded bg-secondary border border-border text-muted-foreground hover:text-red-400 hover:border-red-500/40 transition-colors font-bold">
                          Удалить
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Whitelist */}
            <div className="card-military rounded-xl overflow-hidden">
              <div className="px-6 py-4 border-b border-border bg-green-500/5 flex items-center gap-2">
                <Icon name="UserCheck" size={15} className="text-green-400" />
                <h2 className="font-oswald text-base font-semibold tracking-widest uppercase text-foreground">Белый список</h2>
                <span className="ml-auto text-xs text-muted-foreground">{mockWhitelist.length} записей</span>
              </div>
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-secondary/20 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    <th className="px-6 py-3">Discord ID</th>
                    <th className="px-6 py-3">Имя</th>
                    <th className="px-6 py-3">Статус</th>
                    <th className="px-6 py-3">Дата</th>
                    <th className="px-6 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {mockWhitelist.map((item) => (
                    <tr key={item.id} className="hover:bg-secondary/20 transition-colors">
                      <td className="px-6 py-4 text-sm font-mono text-muted-foreground">{item.id}</td>
                      <td className="px-6 py-4 text-sm font-bold text-foreground">{item.name}</td>
                      <td className="px-6 py-4">
                        <span className="status-badge bg-green-500/15 text-green-400 border border-green-500/30">{item.reason}</span>
                      </td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">{item.date}</td>
                      <td className="px-6 py-4">
                        <button className="text-xs px-3 py-1 rounded bg-secondary border border-border text-muted-foreground hover:text-red-400 hover:border-red-500/40 transition-colors font-bold">
                          Удалить
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Access denied */}
        {activePage === "moderation" && !canModerate && (
          <div className="animate-fade-in flex flex-col items-center justify-center py-28 text-center">
            <div className="w-20 h-20 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center mb-5">
              <Icon name="Lock" size={32} className="text-red-400" />
            </div>
            <h2 className="font-oswald text-3xl font-bold text-foreground mb-2">Доступ запрещён</h2>
            <p className="text-muted-foreground text-sm max-w-sm">
              Этот раздел доступен только для{" "}
              <span className="text-primary font-bold">@Нач.АВНГ</span> и{" "}
              <span className="text-primary font-bold">@Зам.Нач.АВНГ</span>
            </p>
          </div>
        )}
      </main>

      <footer className="border-t border-border mt-16 py-5 px-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted-foreground">
          <span className="font-oswald tracking-widest uppercase gold-text">АВНГ Академия</span>
          <span>© 2026 · Учебный портал войск национальной гвардии</span>
        </div>
      </footer>
    </div>
  );
}