import { useState, useRef, useEffect, useCallback } from "react";
import Icon from "@/components/ui/icon";

const API = "https://functions.poehali.dev/8b907f25-a8c7-45ad-a766-3602ffe63a40";

async function api(body: Record<string, unknown>) {
  const res = await fetch(API, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return res.json();
}

// ─── Types ────────────────────────────────────────────────
type Role = "cadet" | "jr_instructor" | "instructor" | "deputy" | "chief";
type Rank = "private" | "jr_sergeant" | "sergeant";
type Page = "home" | "profile" | "cadets" | "report" | "report_instr" | "exams" | "stats" | "moderation" | "blacklist";

const ROLE_LABEL: Record<Role, string> = {
  cadet: "Курсант", jr_instructor: "Мл. инструктор",
  instructor: "Инструктор", deputy: "Зам.Нач.АВНГ", chief: "Нач.АВНГ",
};
const RANK_LABEL: Record<Rank, string> = {
  private: "Рядовой", jr_sergeant: "Мл. сержант", sergeant: "Сержант",
};

// ─── User ─────────────────────────────────────────────────
type Progress = {
  lecturesChecked: Record<string, { done: boolean; confirmedBy?: string; confirmLink?: string }>;
  practicesDone: Record<string, { done: boolean; photoUrl?: string; confirmedBy?: string }>;
};
type UserRecord = {
  id: string; login: string; password: string;
  name: string; tabNumber: string; role: Role; rank: Rank;
  joinDate: string; isSuperAdmin?: boolean;
  progress: Progress;
};

// ─── Exam requests ────────────────────────────────────────
type ExamRequest = {
  id: number; authorId: string; authorName: string; tabNumber: string;
  examTitle: string; rank: Rank; date: string;
  status: "pending" | "answered"; answer?: string; answeredBy?: string;
};

// ─── Blacklist ────────────────────────────────────────────
type BlacklistEntry = {
  id: number; name: string; tabNumber: string; reason: string;
  addedBy: string; date: string;
};

// ─── Reports ─────────────────────────────────────────────
type Report = {
  id: number; authorId: string; authorName: string; tabNumber: string;
  direction: string; date: string; status: string; signature: string;
  photoUrl?: string;
  lecturesSnapshot: { title: string; done: boolean; confirmLink?: string }[];
  practicesSnapshot: { title: string; done: boolean; photoUrl?: string }[];
};

// ─── Data ─────────────────────────────────────────────────
const mkProgress = (): Progress => ({ lecturesChecked: {}, practicesDone: {} });

const LECTURES_P2J = [
  { id: "l1", type: "Лекция", title: "Вступительная лекция", link: "https://docs.google.com/presentation/d/1TunNnou9K9ZH_QDsmx0N-OKhSSRQot6o6J09dMgcp5c/edit?usp=sharing" },
  { id: "l2", type: "Лекция", title: "ФЗ о ФСВНГ и Устав ФСВНГ", link: "https://docs.google.com/document/d/1fir1wtveTcp5n5MQ-dJ25syfUWJ_QsyOaxjpjx6Vci8/edit?usp=sharing" },
  { id: "l3", type: "Экзамен", title: "Тест: Устав ФСВНГ + ФЗ о ФСВНГ", link: "" },
];
const LECTURES_J2S = [
  { id: "l4", type: "Лекция", title: "УК, ПК, КоАП", link: "https://docs.google.com/presentation/d/18NqJPtXdvhpl5ChP-1VRfBP77ZsCmVSYOhGbDVqdygA/edit?usp=sharing" },
  { id: "l5", type: "Лекция", title: "Допуск к закрытой и охраняемой территории", link: "https://docs.google.com/presentation/d/1rk_v4cruYlBn4gd1zI2jgemZycuJnQqYseNnP5ARsG8/edit?usp=sharing" },
  { id: "l6", type: "Экзамен", title: "Тесты: УК, ПК, КоАП", link: "" },
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
  { id: "q1", title: "Практика: Штраф", desc: "Отработка процедуры оформления штрафа", group: "practice" },
  { id: "q2", title: "Практика: Задержание", desc: "Отработка процедуры задержания", group: "practice" },
  { id: "q3", title: "Практика: Арест", desc: "Отработка процедуры ареста", group: "practice" },
  { id: "q4", title: "Экзамен: Штраф (практика)", desc: "Приём инструктором — прикрепи фото", group: "exam" },
  { id: "q5", title: "Экзамен: Задержание (практика)", desc: "Приём инструктором — прикрепи фото", group: "exam" },
  { id: "q6", title: "Экзамен: Арест (практика)", desc: "Приём инструктором — прикрепи фото", group: "exam" },
];

function getLecturesFor(rank: Rank) {
  if (rank === "private")     return { lectures: LECTURES_P2J, practices: PRACTICES_P2J, label: "Рядовой → Мл. сержант" };
  if (rank === "jr_sergeant") return { lectures: LECTURES_J2S, practices: PRACTICES_J2S, label: "Мл. сержант → Сержант" };
  return { lectures: [], practices: [], label: "" };
}

const STATUS_MAP: Record<string, { label: string; cls: string }> = {
  pending:  { label: "На рассмотрении", cls: "bg-yellow-100 text-yellow-700 border border-yellow-200" },
  approved: { label: "Одобрено",         cls: "bg-green-100 text-green-700 border border-green-200"   },
  rejected: { label: "Отклонено",        cls: "bg-red-100 text-red-700 border border-red-200"         },
  answered: { label: "Отвечено",         cls: "bg-blue-100 text-blue-700 border border-blue-200"      },
};

const RANK_COLOR: Record<Rank, string> = {
  private: "bg-slate-100 text-slate-600 border-slate-300",
  jr_sergeant: "bg-blue-100 text-blue-700 border-blue-300",
  sergeant: "bg-amber-100 text-amber-700 border-amber-300",
};

// ─── Component ────────────────────────────────────────────
export default function Index() {
  const [users, setUsers]           = useState<UserRecord[]>([]);
  const [currentUser, setCurrent]   = useState<UserRecord | null>(null);
  const [reports, setReports]       = useState<Report[]>([]);
  const [examReqs, setExamReqs]     = useState<ExamRequest[]>([]);
  const [blacklist, setBlacklist]   = useState<BlacklistEntry[]>([]);
  const [loading, setLoading]       = useState(false);
  const [blName, setBlName]         = useState("");
  const [blTab, setBlTab]           = useState("");
  const [blReason, setBlReason]     = useState("");
  const [blMsg, setBlMsg]           = useState("");
  const [viewReportId, setViewReportId] = useState<number | null>(null);
  const [page, setPage]             = useState<Page>("home");
  const [mobileMenu, setMobileMenu] = useState(false);

  // ── Auth ──
  const [loginVal, setLoginVal] = useState("");
  const [passVal, setPassVal]   = useState("");
  const [loginErr, setLoginErr] = useState("");

  // ── Reg form ──
  const [regName, setRegName]   = useState("");
  const [regLogin, setRegLogin] = useState("");
  const [regPass, setRegPass]   = useState("");
  const [regTab, setRegTab]     = useState("");
  const [regRole, setRegRole]   = useState<Role>("cadet");
  const [regMsg, setRegMsg]     = useState("");

  // ── Report form ──
  const [repSign, setRepSign]         = useState("");
  const [repPhotoUrl, setRepPhotoUrl] = useState("");
  const [repPhotoName, setRepPhotoName] = useState("");
  const [repMsg, setRepMsg]           = useState("");
  const photoRef = useRef<HTMLInputElement>(null);

  // ── Exam request form ──
  const [examTitle, setExamTitle]   = useState("");
  const [examMsg, setExamMsg]       = useState("");
  const [answerMap, setAnswerMap]   = useState<Record<number, string>>({});

  // ── Instructor panel: selected cadet ──
  const [selCadet, setSelCadet]           = useState<string | null>(null);
  const [instrLink, setInstrLink]         = useState<Record<string, string>>({});
  const [practicePhotoUrl, setPracticePhotoUrl] = useState<Record<string, string>>({});

  // ── Cadet practice photos (key = practiceId) ──
  const [cadetPracticePhotos, setCadetPracticePhotos] = useState<Record<string, string>>({});
  const practicePhotoRef = useRef<Record<string, HTMLInputElement | null>>({});

  const canModerate = currentUser?.role === "deputy" || currentUser?.role === "chief" || !!currentUser?.isSuperAdmin;
  const canInstruct = ["jr_instructor","instructor","deputy","chief"].includes(currentUser?.role || "") || !!currentUser?.isSuperAdmin;
  const isChief     = currentUser?.role === "chief";
  const isSuperAdmin = !!currentUser?.isSuperAdmin;

  // ── Load shared data after login ──
  const loadAll = useCallback(async () => {
    const [uRes, rRes, eRes, bRes] = await Promise.all([
      api({ action: "get_users" }),
      api({ action: "get_reports" }),
      api({ action: "get_exams" }),
      api({ action: "get_blacklist" }),
    ]);
    if (uRes.users) setUsers(uRes.users.map((u: UserRecord) => ({ ...u, id: String(u.id) })));
    if (rRes.reports) setReports(rRes.reports.map((r: Report) => ({ ...r, id: Number(r.id), authorId: String(r.authorId) })));
    if (eRes.exams) setExamReqs(eRes.exams.map((e: ExamRequest) => ({ ...e, id: Number(e.id), authorId: String(e.authorId) })));
    if (bRes.blacklist) setBlacklist(bRes.blacklist.map((b: BlacklistEntry) => ({ ...b, id: Number(b.id) })));
  }, []);

  useEffect(() => { if (currentUser) loadAll(); }, [currentUser, loadAll]);

  function syncUser(u: UserRecord) {
    setUsers(prev => prev.map(x => x.id === u.id ? u : x));
    if (currentUser?.id === u.id) setCurrent(u);
  }

  // ── Login ──
  async function handleLogin() {
    setLoading(true);
    const res = await api({ action: "login", login: loginVal, password: passVal });
    setLoading(false);
    if (res.error) { setLoginErr(res.error); return; }
    const u = { ...res.user, id: String(res.user.id) };
    setCurrent(u);
    setLoginErr(""); setLoginVal(""); setPassVal("");
  }

  // ── Register ──
  async function handleRegister() {
    if (!regName || !regLogin || !regPass || !regTab) { setRegMsg("Заполните все поля"); return; }
    const res = await api({ action: "register", login: regLogin, password: regPass, name: regName, tabNumber: regTab, role: regRole });
    if (res.error) { setRegMsg(res.error); return; }
    const nu = { ...res.user, id: String(res.user.id) };
    setUsers(p => [...p, nu]);
    setRegMsg(`✓ Создан. Логин: ${regLogin}  Пароль: ${regPass}`);
    setRegName(""); setRegLogin(""); setRegPass(""); setRegTab(""); setRegRole("cadet");
  }

  // ── Instructor: check lecture ──
  async function checkLecture(userId: string, lectureId: string, done: boolean, confirmLink: string) {
    await api({ action: "check_lecture", userId: Number(userId), lectureId, done, confirmLink, confirmedBy: currentUser?.name || "" });
    const u = users.find(u => u.id === userId)!;
    syncUser({ ...u, progress: { ...u.progress, lecturesChecked: { ...u.progress.lecturesChecked, [lectureId]: { done, confirmLink, confirmedBy: currentUser?.name } } } });
  }

  // ── Instructor: check practice ──
  async function checkPractice(userId: string, practiceId: string, done: boolean) {
    const u = users.find(u => u.id === userId)!;
    const photoUrl = u.progress.practicesDone[practiceId]?.photoUrl || "";
    await api({ action: "check_practice", userId: Number(userId), practiceId, done, photoUrl, confirmedBy: done ? (currentUser?.name || "") : "" });
    syncUser({ ...u, progress: { ...u.progress, practicesDone: { ...u.progress.practicesDone, [practiceId]: { done, photoUrl, confirmedBy: done ? currentUser?.name : undefined } } } });
  }

  // ── Cadet: attach photo to practice ──
  async function attachPracticePhoto(practiceId: string, photoUrl: string) {
    if (!cu) return;
    setCadetPracticePhotos(p => ({ ...p, [practiceId]: photoUrl }));
    const u = users.find(u => u.id === cu.id)!;
    const existing = u.progress.practicesDone[practiceId];
    await api({ action: "check_practice", userId: Number(cu.id), practiceId, done: existing?.done || false, photoUrl, confirmedBy: existing?.confirmedBy || "" });
    syncUser({ ...u, progress: { ...u.progress, practicesDone: { ...u.progress.practicesDone, [practiceId]: { ...existing, done: existing?.done || false, photoUrl } } } });
  }

  // ── Set rank ──
  async function setRank(userId: string, rank: Rank) {
    await api({ action: "set_rank", userId: Number(userId), rank });
    const u = users.find(u => u.id === userId)!;
    syncUser({ ...u, rank });
  }

  // ── Set role ──
  async function setRole(userId: string, role: Role) {
    await api({ action: "set_role", userId: Number(userId), role });
    const u = users.find(u => u.id === userId)!;
    syncUser({ ...u, role });
  }

  // ── Submit exam request ──
  async function submitExamRequest() {
    if (!currentUser || !examTitle) { setExamMsg("Укажите тему экзамена"); return; }
    const res = await api({ action: "add_exam", authorId: Number(currentUser.id), examTitle, rank: currentUser.rank });
    const newReq: ExamRequest = {
      id: res.id, authorId: currentUser.id, authorName: currentUser.name,
      tabNumber: currentUser.tabNumber, examTitle, rank: currentUser.rank,
      date: new Date().toLocaleDateString("ru-RU"), status: "pending",
    };
    setExamReqs(p => [newReq, ...p]);
    setExamMsg("✓ Запрос отправлен"); setExamTitle("");
  }

  // ── Answer exam request ──
  async function answerExam(id: number) {
    const txt = answerMap[id];
    if (!txt) return;
    await api({ action: "answer_exam", examId: id, answer: txt, answeredBy: currentUser?.name || "" });
    setExamReqs(p => p.map(r => r.id === id ? { ...r, status: "answered", answer: txt, answeredBy: currentUser?.name } : r));
    setAnswerMap(p => { const n = { ...p }; delete n[id]; return n; });
  }

  // ── Submit report ──
  async function submitReport() {
    if (!currentUser) return;
    if (!repSign) { setRepMsg("Укажите подпись"); return; }
    const cu2 = users.find(u => u.id === currentUser.id) || currentUser;
    const { lectures, practices, label } = getLecturesFor(cu2.rank);
    if (!label) { setRepMsg("Нет доступных аттестаций для вашего звания"); return; }
    const lSnap = lectures.filter(l => l.type === "Лекция").map(l => ({
      title: l.title, done: !!cu2.progress.lecturesChecked[l.id]?.done,
      confirmLink: cu2.progress.lecturesChecked[l.id]?.confirmLink,
    }));
    const pSnap = practices.map(p => ({
      title: p.title, done: !!cu2.progress.practicesDone[p.id]?.done,
      photoUrl: cu2.progress.practicesDone[p.id]?.photoUrl,
    }));
    const res = await api({ action: "add_report", authorId: Number(currentUser.id), direction: label, signature: repSign, photoUrl: repPhotoUrl, lecturesSnapshot: lSnap, practicesSnapshot: pSnap });
    const nr: Report = {
      id: res.id, authorId: currentUser.id, authorName: currentUser.name,
      tabNumber: currentUser.tabNumber, direction: label,
      date: new Date().toLocaleDateString("ru-RU"),
      status: "pending", signature: repSign, photoUrl: repPhotoUrl,
      lecturesSnapshot: lSnap, practicesSnapshot: pSnap,
    };
    setReports(prev => [nr, ...prev]);
    setRepMsg("✓ Рапорт отправлен"); setRepSign(""); setRepPhotoUrl(""); setRepPhotoName("");
  }

  // ─── Resolved current user from state ───────────────────
  const cu = currentUser ? (users.find(u => u.id === currentUser.id) || currentUser) : null;

  // ─── LOGIN SCREEN ────────────────────────────────────────
  if (!cu) {
    return (
      <div className="min-h-screen bg-[#f3f4f6] font-golos flex flex-col">
        <div className="bg-[hsl(220,30%,14%)] text-white py-3 px-6 flex items-center gap-3">
          <Icon name="Shield" size={18} className="text-amber-400" />
          <span className="font-oswald text-base tracking-widest uppercase font-semibold">АВНГ — Академия</span>
        </div>
        <div className="bg-white border-b border-border py-12 px-4 text-center">
          <div className="w-16 h-16 rounded-2xl bg-[hsl(220,60%,28%)]/10 border-2 border-[hsl(220,60%,28%)]/25 flex items-center justify-center mx-auto mb-4">
            <Icon name="Shield" size={28} className="text-[hsl(220,60%,28%)]" />
          </div>
          <h1 className="font-oswald text-4xl font-bold tracking-wide text-foreground mb-1">Учебный портал АВНГ</h1>
          <p className="text-muted-foreground text-sm">Академия войск национальной гвардии</p>
        </div>
        <div className="flex-1 flex items-start justify-center pt-10 px-4">
          <div className="w-full max-w-sm">
            <div className="bg-white rounded-xl border border-border border-t-[3px] border-t-[hsl(220,60%,28%)] shadow-md p-8">
              <h2 className="font-oswald text-2xl font-bold text-foreground mb-1 tracking-wide">Вход</h2>
              <p className="text-muted-foreground text-xs mb-6">Введите выданные логин и пароль</p>
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wide text-foreground mb-1.5 block">Логин</label>
                  <input value={loginVal} onChange={e => setLoginVal(e.target.value)} onKeyDown={e => e.key === "Enter" && handleLogin()} placeholder="Логин"
                    className="w-full border border-border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[hsl(220,60%,28%)] focus:ring-1 focus:ring-[hsl(220,60%,28%)]/20" />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wide text-foreground mb-1.5 block">Пароль</label>
                  <input type="password" value={passVal} onChange={e => setPassVal(e.target.value)} onKeyDown={e => e.key === "Enter" && handleLogin()} placeholder="Пароль"
                    className="w-full border border-border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[hsl(220,60%,28%)] focus:ring-1 focus:ring-[hsl(220,60%,28%)]/20" />
                </div>
                {loginErr && <p className="text-red-600 text-xs font-semibold flex items-center gap-1"><Icon name="AlertCircle" size={13} />{loginErr}</p>}
                <button onClick={handleLogin} disabled={loading} className="w-full bg-[hsl(220,60%,28%)] hover:bg-[hsl(220,60%,22%)] disabled:opacity-60 text-white font-bold py-2.5 rounded-lg text-sm transition-colors flex items-center justify-center gap-2">
                  {loading ? <><Icon name="Loader2" size={14} className="animate-spin" /> Вход...</> : "Войти"}
                </button>
              </div>
            </div>
            <p className="text-center text-xs text-muted-foreground mt-3">Доступ только по выданным учётным данным</p>
          </div>
        </div>
      </div>
    );
  }

  // ─── MAIN APP ────────────────────────────────────────────
  const { lectures: curLectures, practices: curPractices, label: curLabel } = getLecturesFor(cu.rank);
  const canInstr = ["jr_instructor","instructor","deputy","chief"].includes(cu.role) || isSuperAdmin;
  const canMod   = cu.role === "deputy" || cu.role === "chief" || isSuperAdmin;

  // Nav per role
  type NavItem = { page: Page; icon: string; label: string };
  const NAV: NavItem[] = [
    { page: "home",         icon: "BookOpen",      label: "Лекции" },
    { page: "profile",      icon: "User",           label: "Профиль" },
    { page: "exams",        icon: "MessageSquare",  label: "Экзамены" },
    { page: "report",       icon: "FileText",       label: "Рапорт" },
    ...(canInstr ? [{ page: "report_instr" as Page, icon: "ClipboardList", label: "Рапорты" }] : []),
    ...(canInstr ? [{ page: "cadets"       as Page, icon: "Users",         label: "Курсанты" }] : []),
    ...(canInstr ? [{ page: "stats"        as Page, icon: "BarChart3",     label: "Статистика" }] : []),
    ...(canMod   ? [{ page: "blacklist"    as Page, icon: "Ban",           label: "Чёрный список" }] : []),
    ...(canMod   ? [{ page: "moderation"   as Page, icon: "ShieldAlert",   label: "Модерация" }] : []),
  ];

  const selectedCadetUser = selCadet ? users.find(u => u.id === selCadet) : null;

  return (
    <div className="min-h-screen bg-[#f3f4f6] font-golos">

      {/* TOP BAR */}
      <div className="bg-[hsl(220,30%,14%)] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon name="Shield" size={15} className="text-amber-400" />
            <span className="font-oswald text-sm tracking-widest uppercase font-semibold">АВНГ — Академия</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-400 hidden sm:block">{cu.tabNumber}</span>
            <span className="text-xs font-semibold text-slate-300 hidden sm:block">{ROLE_LABEL[cu.role]}</span>
            {isSuperAdmin && <span className="text-xs font-bold text-amber-400 hidden sm:block">★ Суперадмин</span>}
            <button onClick={() => { setCurrent(null); setPage("home"); }} className="text-xs text-slate-400 hover:text-white flex items-center gap-1 transition-colors">
              <Icon name="LogOut" size={13} /> Выйти
            </button>
          </div>
        </div>
      </div>

      {/* HEADER NAV */}
      <header className="bg-white border-b border-border shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-[hsl(220,60%,28%)]/10 border border-[hsl(220,60%,28%)]/25 flex items-center justify-center">
                <Icon name="User" size={14} className="text-[hsl(220,60%,28%)]" />
              </div>
              <div className="leading-tight">
                <p className="text-xs font-bold text-foreground">{cu.name.split(" ").slice(0,2).join(" ")}</p>
                <p className="text-[10px] text-muted-foreground">{RANK_LABEL[cu.rank]}</p>
              </div>
            </div>
            <nav className="hidden md:flex items-center gap-0.5">
              {NAV.map(n => (
                <button key={n.page} onClick={() => setPage(n.page)}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-md text-sm font-semibold transition-all ${page === n.page ? "bg-[hsl(220,60%,28%)] text-white" : "text-muted-foreground hover:text-foreground hover:bg-secondary"}`}>
                  <Icon name={n.icon} size={14} />{n.label}
                </button>
              ))}
            </nav>
            <button className="md:hidden p-2 text-muted-foreground" onClick={() => setMobileMenu(!mobileMenu)}>
              <Icon name={mobileMenu ? "X" : "Menu"} size={20} />
            </button>
          </div>
          {mobileMenu && (
            <div className="md:hidden border-t border-border py-2 space-y-0.5 animate-fade-in pb-3">
              {NAV.map(n => (
                <button key={n.page} onClick={() => { setPage(n.page); setMobileMenu(false); }}
                  className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-md text-sm font-semibold ${page === n.page ? "bg-[hsl(220,60%,28%)] text-white" : "text-muted-foreground"}`}>
                  <Icon name={n.icon} size={14} />{n.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">

        {/* ══ ЛЕКЦИИ ══ */}
        {page === "home" && (
          <div className="space-y-6 animate-slide-up">
            <div className="border-b-2 border-[hsl(220,60%,28%)] pb-3 mb-6">
              <h1 className="font-oswald text-3xl font-bold text-foreground tracking-wide">Лекции и практика</h1>
              <p className="text-muted-foreground text-sm mt-0.5">{cu.rank === "sergeant" ? "Все аттестации пройдены" : curLabel}</p>
            </div>

            {cu.rank === "sergeant" ? (
              <div className="bg-white rounded-xl border border-t-[3px] border-t-amber-400 border-border p-8 text-center shadow-sm">
                <Icon name="Award" size={40} className="text-amber-500 mx-auto mb-3" />
                <h2 className="font-oswald text-2xl font-bold text-foreground">Звание «Сержант»</h2>
                <p className="text-muted-foreground text-sm mt-1">Вы прошли все ступени аттестации АВНГ</p>
              </div>
            ) : (
              <>
                {/* Stats mini */}
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { label: "Лекций зачтено", val: curLectures.filter(l => l.type==="Лекция" && cu.progress.lecturesChecked[l.id]?.done).length + "/" + curLectures.filter(l=>l.type==="Лекция").length, icon: "BookOpen", c: "text-blue-600" },
                    { label: "Практик зачтено", val: curPractices.filter(p => cu.progress.practicesDone[p.id]?.done).length + "/" + curPractices.length, icon: "CheckSquare", c: "text-green-600" },
                    { label: "Следующее звание", val: cu.rank === "private" ? "Мл. сержант" : "Сержант", icon: "TrendingUp", c: "text-amber-600" },
                  ].map(m => (
                    <div key={m.label} className="bg-white rounded-xl border border-border shadow-sm p-4">
                      <Icon name={m.icon} size={18} className={`${m.c} mb-2`} />
                      <div className={`text-xl font-oswald font-bold ${m.c}`}>{m.val}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">{m.label}</div>
                    </div>
                  ))}
                </div>

                {/* Lectures */}
                <div className="bg-white rounded-xl border border-border shadow-sm overflow-hidden">
                  <div className="px-6 py-3 border-b border-border bg-secondary/30">
                    <span className="font-oswald text-sm font-bold tracking-widest uppercase text-foreground">Лекции и экзамены</span>
                  </div>
                  <div className="divide-y divide-border">
                    {curLectures.map(item => {
                      const chk = cu.progress.lecturesChecked[item.id];
                      const done = !!chk?.done;
                      return (
                        <div key={item.id} className={`flex items-center gap-4 px-6 py-4 ${done ? "bg-green-50" : ""}`}>
                          <div className="w-0.5 h-9 bg-[hsl(220,60%,28%)] rounded flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap mb-0.5">
                              <span className={`status-badge text-xs ${item.type==="Экзамен" ? "bg-orange-100 text-orange-700 border border-orange-200" : "bg-blue-100 text-blue-700 border border-blue-200"}`}>
                                {item.type}
                              </span>
                              {done && <span className="status-badge bg-green-100 text-green-700 border border-green-200">✓ Зачтено</span>}
                            </div>
                            <p className="font-semibold text-foreground text-sm">{item.title}</p>
                            {item.type === "Экзамен" && !item.link && (
                              <p className="text-xs text-muted-foreground mt-0.5">Сдаётся в канале Discord — подай запрос во вкладке «Экзамены»</p>
                            )}
                            {done && chk?.confirmLink && (
                              <a href={chk.confirmLink} target="_blank" rel="noopener noreferrer" className="text-xs text-[hsl(220,60%,28%)] underline mt-0.5 block">
                                Подтверждение инструктора ↗
                              </a>
                            )}
                          </div>
                          {item.link && (
                            <a href={item.link} target="_blank" rel="noopener noreferrer"
                              className="flex items-center gap-1 px-3 py-1.5 rounded-md bg-secondary border border-border text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors flex-shrink-0">
                              <Icon name="ExternalLink" size={11} /> Открыть
                            </a>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Practices — grouped for j2s */}
                {cu.rank === "jr_sergeant" && (
                  <>
                    {[{ key: "practice", title: "Практические задания", color: "bg-secondary/30" }, { key: "exam", title: "Аттестация — экзамены", color: "bg-orange-50" }].map(group => (
                      <div key={group.key} className="bg-white rounded-xl border border-border shadow-sm overflow-hidden">
                        <div className={`px-6 py-3 border-b border-border ${group.color}`}>
                          <span className="font-oswald text-sm font-bold tracking-widest uppercase text-foreground">{group.title}</span>
                        </div>
                        <div className="divide-y divide-border">
                          {curPractices.filter((p: typeof curPractices[0] & { group?: string }) => (p.group || "practice") === group.key).map((item: typeof curPractices[0] & { group?: string }) => {
                            const pr = cu.progress.practicesDone[item.id];
                            const done = !!pr?.done;
                            const photo = pr?.photoUrl || cadetPracticePhotos[item.id];
                            return (
                              <div key={item.id} className={`px-6 py-4 ${done ? "bg-green-50" : ""}`}>
                                <div className="flex items-start gap-4">
                                  <div className={`w-5 h-5 rounded border flex items-center justify-center flex-shrink-0 mt-0.5 ${done ? "bg-green-100 border-green-400" : "border-border bg-white"}`}>
                                    {done && <Icon name="Check" size={11} className="text-green-600" />}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-foreground">{item.title}</p>
                                    <p className="text-xs text-muted-foreground">{item.desc}</p>
                                    {done && pr?.confirmedBy && <p className="text-xs text-green-600 mt-0.5">Зачёл: {pr.confirmedBy}</p>}
                                    {photo ? (
                                      <div className="mt-2 flex items-start gap-2">
                                        <img src={photo} alt="фото" className="w-24 h-24 object-cover rounded-lg border border-border shadow-sm" />
                                        {!done && cu.role === "cadet" && (
                                          <button onClick={() => attachPracticePhoto(item.id, "")} className="text-xs text-red-500 hover:text-red-700 font-semibold mt-1">Удалить</button>
                                        )}
                                      </div>
                                    ) : cu.role === "cadet" && !done && (
                                      <div className="mt-2">
                                        <input type="file" accept=".jpg,.jpeg,.png" className="hidden"
                                          ref={el => { practicePhotoRef.current[item.id] = el; }}
                                          onChange={e => {
                                            const f = e.target.files?.[0]; if (!f) return;
                                            const r = new FileReader(); r.onload = ev => attachPracticePhoto(item.id, ev.target?.result as string); r.readAsDataURL(f);
                                          }} />
                                        <button onClick={() => practicePhotoRef.current[item.id]?.click()}
                                          className="flex items-center gap-1.5 text-xs text-[hsl(220,60%,28%)] font-bold border border-[hsl(220,60%,28%)]/30 bg-[hsl(220,60%,28%)]/5 px-3 py-1.5 rounded-lg hover:bg-[hsl(220,60%,28%)]/10 transition-colors">
                                          <Icon name="Camera" size={12} /> Прикрепить фото
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </>
                )}

                {cu.rank !== "jr_sergeant" && (
                <div className="bg-white rounded-xl border border-border shadow-sm overflow-hidden">
                  <div className="px-6 py-3 border-b border-border bg-secondary/30">
                    <span className="font-oswald text-sm font-bold tracking-widest uppercase text-foreground">Практические задания</span>
                  </div>
                  <div className="divide-y divide-border">
                    {curPractices.map(item => {
                      const pr = cu.progress.practicesDone[item.id];
                      const done = !!pr?.done;
                      const photo = pr?.photoUrl || cadetPracticePhotos[item.id];
                      return (
                        <div key={item.id} className={`px-6 py-4 ${done ? "bg-green-50" : ""}`}>
                          <div className="flex items-start gap-4">
                            <div className={`w-5 h-5 rounded border flex items-center justify-center flex-shrink-0 mt-0.5 ${done ? "bg-green-100 border-green-400" : "border-border bg-white"}`}>
                              {done && <Icon name="Check" size={11} className="text-green-600" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-foreground">{item.title}</p>
                              <p className="text-xs text-muted-foreground">{item.desc}</p>
                              {done && pr?.confirmedBy && <p className="text-xs text-green-600 mt-0.5">Зачёл: {pr.confirmedBy}</p>}

                              {/* Photo area */}
                              {photo ? (
                                <div className="mt-2 flex items-start gap-2">
                                  <img src={photo} alt="фото" className="w-24 h-24 object-cover rounded-lg border border-border shadow-sm" />
                                  {!done && cu.role === "cadet" && (
                                    <button onClick={() => attachPracticePhoto(item.id, "")}
                                      className="text-xs text-red-500 hover:text-red-700 font-semibold mt-1">
                                      Удалить
                                    </button>
                                  )}
                                </div>
                              ) : cu.role === "cadet" && !done && (
                                <div className="mt-2">
                                  <input
                                    type="file" accept=".jpg,.jpeg,.png"
                                    className="hidden"
                                    ref={el => { practicePhotoRef.current[item.id] = el; }}
                                    onChange={e => {
                                      const f = e.target.files?.[0]; if (!f) return;
                                      const r = new FileReader();
                                      r.onload = ev => attachPracticePhoto(item.id, ev.target?.result as string);
                                      r.readAsDataURL(f);
                                    }}
                                  />
                                  <button onClick={() => practicePhotoRef.current[item.id]?.click()}
                                    className="flex items-center gap-1.5 text-xs text-[hsl(220,60%,28%)] font-bold border border-[hsl(220,60%,28%)]/30 bg-[hsl(220,60%,28%)]/5 px-3 py-1.5 rounded-lg hover:bg-[hsl(220,60%,28%)]/10 transition-colors">
                                    <Icon name="Camera" size={12} /> Прикрепить фото
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
                )}
              </>
            )}
          </div>
        )}

        {/* ══ ПРОФИЛЬ ══ */}
        {page === "profile" && (
          <div className="space-y-5 animate-slide-up max-w-xl">
            <div className="border-b-2 border-[hsl(220,60%,28%)] pb-3 mb-6">
              <h1 className="font-oswald text-3xl font-bold text-foreground tracking-wide">Профиль</h1>
            </div>
            <div className="bg-white rounded-xl border border-t-[3px] border-t-[hsl(220,60%,28%)] border-border shadow-sm p-6">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-xl bg-[hsl(220,60%,28%)]/10 border-2 border-[hsl(220,60%,28%)]/25 flex items-center justify-center flex-shrink-0">
                  <Icon name="User" size={24} className="text-[hsl(220,60%,28%)]" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-foreground">{cu.name}</h2>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <span className="status-badge bg-secondary border border-border text-muted-foreground">{cu.tabNumber}</span>
                    <span className={`status-badge border ${RANK_COLOR[cu.rank]}`}>{RANK_LABEL[cu.rank]}</span>
                    <span className="status-badge bg-[hsl(220,60%,28%)]/10 text-[hsl(220,60%,28%)] border border-[hsl(220,60%,28%)]/25">{ROLE_LABEL[cu.role]}</span>
                    {isSuperAdmin && <span className="status-badge bg-amber-100 text-amber-700 border border-amber-300">★ Суперадмин</span>}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 mt-5">
                {[
                  { l: "Табельный", v: cu.tabNumber, i: "Hash" },
                  { l: "Дата зачисления", v: cu.joinDate, i: "Calendar" },
                  { l: "Звание", v: RANK_LABEL[cu.rank], i: "Award" },
                  { l: "Должность", v: ROLE_LABEL[cu.role], i: "Briefcase" },
                ].map(it => (
                  <div key={it.l} className="bg-secondary/40 rounded-lg border border-border p-3">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <Icon name={it.i} size={11} className="text-[hsl(220,60%,28%)]" />
                      <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wide">{it.l}</span>
                    </div>
                    <p className="font-bold text-foreground text-sm">{it.v}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Суперадмин: смена собственной роли */}
            {isSuperAdmin && (
              <div className="bg-amber-50 rounded-xl border border-amber-200 p-5">
                <h3 className="font-oswald text-sm font-bold uppercase tracking-wide text-amber-800 mb-3 flex items-center gap-2">
                  <Icon name="Star" size={14} /> Суперадмин — быстрая смена роли
                </h3>
                <div className="flex gap-2 flex-wrap">
                  {(["cadet","jr_instructor","instructor","deputy","chief"] as Role[]).map(r => (
                    <button key={r} onClick={() => setRole(cu.id, r)}
                      className={`text-xs px-3 py-1.5 rounded-lg font-bold border transition-colors ${cu.role === r ? "bg-[hsl(220,60%,28%)] text-white border-transparent" : "bg-white text-muted-foreground border-border hover:border-[hsl(220,60%,28%)]"}`}>
                      {ROLE_LABEL[r]}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ══ ЭКЗАМЕНЫ ══ */}
        {page === "exams" && (
          <div className="space-y-6 animate-slide-up">
            <div className="border-b-2 border-[hsl(220,60%,28%)] pb-3 mb-6">
              <h1 className="font-oswald text-3xl font-bold text-foreground tracking-wide">Запрос на экзамен</h1>
              <p className="text-muted-foreground text-sm mt-0.5">Подай заявку — инструктор назначит время и канал</p>
            </div>

            {/* Send request (cadet) */}
            {cu.role === "cadet" && (
              <div className="bg-white rounded-xl border border-t-[3px] border-t-[hsl(220,60%,28%)] border-border shadow-sm p-6 space-y-4 max-w-lg">
                <h2 className="font-oswald text-base font-bold uppercase tracking-widest text-foreground">Подать запрос</h2>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wide text-foreground mb-1.5 block">Тема / Название экзамена</label>
                  <input value={examTitle} onChange={e => setExamTitle(e.target.value)} placeholder="Напр.: Тест по Уставу ФСВНГ"
                    className="w-full border border-border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[hsl(220,60%,28%)]" />
                </div>
                {examMsg && <p className={`text-sm font-semibold ${examMsg.startsWith("✓") ? "text-green-600" : "text-red-600"}`}>{examMsg}</p>}
                <button onClick={submitExamRequest} className="flex items-center gap-2 px-5 py-2.5 bg-[hsl(220,60%,28%)] hover:bg-[hsl(220,60%,22%)] text-white font-bold text-sm rounded-lg transition-colors">
                  <Icon name="Send" size={14} /> Отправить запрос
                </button>
              </div>
            )}

            {/* Requests list */}
            <div className="bg-white rounded-xl border border-border shadow-sm overflow-hidden">
              <div className="px-6 py-3 border-b border-border bg-secondary/30 flex items-center justify-between">
                <span className="font-oswald text-sm font-bold uppercase tracking-widest text-foreground">
                  {canInstr ? "Все запросы на экзамен" : "Мои запросы"}
                </span>
                <span className="text-xs text-muted-foreground">{examReqs.filter(r => canInstr || r.authorId === cu.id).length} запросов</span>
              </div>
              <div className="divide-y divide-border">
                {examReqs.filter(r => canInstr || r.authorId === cu.id).length === 0 && (
                  <p className="px-6 py-5 text-sm text-muted-foreground">Запросов пока нет</p>
                )}
                {examReqs.filter(r => canInstr || r.authorId === cu.id).map(req => (
                  <div key={req.id} className="px-6 py-4 space-y-2">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-bold text-foreground text-sm">{req.examTitle}</p>
                        <p className="text-xs text-muted-foreground">{req.authorName} · {req.tabNumber} · {RANK_LABEL[req.rank]} · {req.date}</p>
                      </div>
                      <span className={`status-badge flex-shrink-0 ${STATUS_MAP[req.status].cls}`}>{STATUS_MAP[req.status].label}</span>
                    </div>
                    {req.status === "answered" && req.answer && (
                      <div className="bg-blue-50 rounded-lg border border-blue-200 px-4 py-2.5 text-sm">
                        <p className="text-xs text-blue-500 font-bold uppercase mb-0.5">Ответ инструктора ({req.answeredBy})</p>
                        <p className="text-foreground font-semibold">{req.answer}</p>
                      </div>
                    )}
                    {canInstr && req.status === "pending" && (
                      <div className="flex gap-2 items-center">
                        <input value={answerMap[req.id] || ""} onChange={e => setAnswerMap(p => ({ ...p, [req.id]: e.target.value }))}
                          placeholder="Напр.: Завтра в 18:00, канал #экзамен-1"
                          className="flex-1 border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[hsl(220,60%,28%)]" />
                        <button onClick={() => answerExam(req.id)} className="px-4 py-2 bg-[hsl(220,60%,28%)] text-white font-bold text-xs rounded-lg hover:bg-[hsl(220,60%,22%)] transition-colors flex-shrink-0">
                          Ответить
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ══ РАПОРТ ══ */}
        {page === "report" && (
          <div className="space-y-6 animate-slide-up max-w-2xl">
            <div className="border-b-2 border-[hsl(220,60%,28%)] pb-3 mb-6">
              <h1 className="font-oswald text-3xl font-bold text-foreground tracking-wide">Рапорт</h1>
              <p className="text-muted-foreground text-sm mt-0.5">Рядовой → Мл. сержант / Мл. сержант → Сержант</p>
            </div>

            {cu.role === "cadet" && (cu.rank === "private" || cu.rank === "jr_sergeant") ? (() => {
              const { lectures: repLecs, practices: repPracs, label: repLabel } = getLecturesFor(cu.rank);
              return (
              <div className="bg-white rounded-xl border border-t-[3px] border-t-[hsl(220,60%,28%)] border-border shadow-sm p-6 space-y-5">
                {/* Snapshot */}
                <div>
                  <h3 className="font-oswald text-sm font-bold uppercase tracking-widest text-foreground mb-3">Прогресс: {repLabel}</h3>
                  <div className="space-y-1.5">
                    {repLecs.filter(l => l.type === "Лекция").map(l => {
                      const done = !!cu.progress.lecturesChecked[l.id]?.done;
                      return (
                        <div key={l.id} className="flex items-center gap-2 text-sm">
                          <div className={`w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center ${done ? "bg-green-100 border-green-400" : "border-border"}`}>
                            {done && <Icon name="Check" size={10} className="text-green-600" />}
                          </div>
                          <span className={done ? "text-foreground font-semibold" : "text-muted-foreground"}>{l.title}</span>
                        </div>
                      );
                    })}
                    {repPracs.map(p => {
                      const done = !!cu.progress.practicesDone[p.id]?.done;
                      return (
                        <div key={p.id} className="flex items-center gap-2 text-sm">
                          <div className={`w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center ${done ? "bg-green-100 border-green-400" : "border-border"}`}>
                            {done && <Icon name="Check" size={10} className="text-green-600" />}
                          </div>
                          <span className={done ? "text-foreground font-semibold" : "text-muted-foreground"}>{p.title}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Photo */}
                <div>
                  <label className="text-xs font-bold uppercase tracking-wide text-foreground mb-1.5 block">Фото (необязательно)</label>
                  <input ref={photoRef} type="file" accept=".jpg,.jpeg,.png" className="hidden"
                    onChange={e => {
                      const f = e.target.files?.[0]; if (!f) return;
                      setRepPhotoName(f.name);
                      const r = new FileReader(); r.onload = ev => setRepPhotoUrl(ev.target?.result as string); r.readAsDataURL(f);
                    }} />
                  {repPhotoUrl ? (
                    <div className="relative inline-block">
                      <img src={repPhotoUrl} alt="фото" className="w-36 h-36 object-cover rounded-lg border border-border" />
                      <button onClick={() => { setRepPhotoUrl(""); setRepPhotoName(""); }}
                        className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600">
                        <Icon name="X" size={10} />
                      </button>
                    </div>
                  ) : (
                    <button onClick={() => photoRef.current?.click()}
                      className="border-2 border-dashed border-border rounded-lg px-6 py-5 w-full text-center hover:border-[hsl(220,60%,28%)]/40 transition-colors bg-secondary/20">
                      <Icon name="Upload" size={20} className="text-muted-foreground mx-auto mb-1" />
                      <p className="text-xs text-muted-foreground font-semibold">Нажмите для загрузки</p>
                    </button>
                  )}
                </div>

                {/* Signature */}
                <div>
                  <label className="text-xs font-bold uppercase tracking-wide text-foreground mb-1.5 block">Подпись</label>
                  <input value={repSign} onChange={e => setRepSign(e.target.value)} placeholder="ФИО для подписи"
                    className="w-full border border-border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[hsl(220,60%,28%)]" />
                </div>

                {repMsg && <p className={`text-sm font-semibold ${repMsg.startsWith("✓") ? "text-green-600" : "text-red-600"}`}>{repMsg}</p>}
                <button onClick={submitReport} className="flex items-center gap-2 px-6 py-2.5 bg-[hsl(220,60%,28%)] hover:bg-[hsl(220,60%,22%)] text-white font-bold text-sm rounded-lg transition-colors">
                  <Icon name="Send" size={14} /> Отправить рапорт
                </button>
              </div>
              );
            })() : (
              <div className="bg-secondary/40 rounded-xl border border-border p-6 text-center">
                <p className="text-sm text-muted-foreground font-semibold">Рапорт доступен курсантам со званием Рядовой или Мл. сержант.</p>
              </div>
            )}

            {/* History */}
            <div className="bg-white rounded-xl border border-border shadow-sm overflow-hidden">
              <div className="px-6 py-3 border-b border-border bg-secondary/30">
                <span className="font-oswald text-sm font-bold uppercase tracking-widest text-foreground">
                  {canMod ? "Все рапорты" : "Мои рапорты"}
                </span>
              </div>
              <div className="divide-y divide-border">
                {reports.filter(r => canMod || r.authorId === cu.id).length === 0 && (
                  <p className="px-6 py-5 text-sm text-muted-foreground">Рапортов пока нет</p>
                )}
                {reports.filter(r => canMod || r.authorId === cu.id).map(r => (
                  <div key={r.id} className="px-6 py-4 space-y-3">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-bold text-foreground text-sm">{r.direction}</p>
                        <p className="text-xs text-muted-foreground">{r.authorName} · {r.tabNumber} · {r.date}</p>
                        {r.signature && <p className="text-xs text-muted-foreground">Подпись: {r.signature}</p>}
                      </div>
                      <span className={`status-badge flex-shrink-0 ${STATUS_MAP[r.status].cls}`}>{STATUS_MAP[r.status].label}</span>
                    </div>
                    {/* Snapshot */}
                    <div className="bg-secondary/30 rounded-lg border border-border p-3 space-y-1 text-xs">
                      {r.lecturesSnapshot.map((s, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <div className={`w-3.5 h-3.5 rounded border flex-shrink-0 flex items-center justify-center ${s.done ? "bg-green-100 border-green-400" : "border-border"}`}>
                            {s.done && <Icon name="Check" size={9} className="text-green-600" />}
                          </div>
                          <span className={s.done ? "text-foreground font-semibold" : "text-muted-foreground"}>{s.title}</span>
                          {s.confirmLink && <a href={s.confirmLink} target="_blank" rel="noopener noreferrer" className="text-[hsl(220,60%,28%)] underline ml-1">↗</a>}
                        </div>
                      ))}
                      {r.practicesSnapshot.map((s, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <div className={`w-3.5 h-3.5 rounded border flex-shrink-0 flex items-center justify-center ${s.done ? "bg-green-100 border-green-400" : "border-border"}`}>
                            {s.done && <Icon name="Check" size={9} className="text-green-600" />}
                          </div>
                          <span className={s.done ? "text-foreground font-semibold" : "text-muted-foreground"}>{s.title}</span>
                        </div>
                      ))}
                      {r.photoUrl && <div className="mt-2"><img src={r.photoUrl} alt="фото" className="w-20 h-20 object-cover rounded-lg border border-border" /></div>}
                    </div>
                    {canMod && (
                      <div className="flex gap-2">
                        <button onClick={async () => { await api({ action:"set_report_status", reportId: r.id, status:"approved" }); setReports(p => p.map(x => x.id===r.id?{...x,status:"approved"}:x)); }} className="text-xs px-3 py-1 rounded bg-green-100 text-green-700 border border-green-200 font-bold hover:bg-green-200 transition-colors">Одобрить</button>
                        <button onClick={async () => { await api({ action:"set_report_status", reportId: r.id, status:"rejected" }); setReports(p => p.map(x => x.id===r.id?{...x,status:"rejected"}:x)); }} className="text-xs px-3 py-1 rounded bg-red-100 text-red-700 border border-red-200 font-bold hover:bg-red-200 transition-colors">Отклонить</button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ══ КУРСАНТЫ (инструктор) ══ */}
        {page === "cadets" && canInstr && (
          <div className="space-y-6 animate-slide-up">
            <div className="border-b-2 border-[hsl(220,60%,28%)] pb-3 mb-6">
              <h1 className="font-oswald text-3xl font-bold text-foreground tracking-wide">Карточки курсантов</h1>
              <p className="text-muted-foreground text-sm mt-0.5">Проставляйте зачёты по лекциям и практике</p>
            </div>

            <div className="grid sm:grid-cols-3 gap-3">
              {users.filter(u => u.role === "cadet").map(u => (
                <button key={u.id} onClick={() => setSelCadet(selCadet === u.id ? null : u.id)}
                  className={`bg-white rounded-xl border shadow-sm p-4 text-left transition-all ${selCadet === u.id ? "border-[hsl(220,60%,28%)] ring-2 ring-[hsl(220,60%,28%)]/20" : "border-border hover:border-[hsl(220,60%,28%)]/40"}`}>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-[hsl(220,60%,28%)]/10 border border-[hsl(220,60%,28%)]/25 flex items-center justify-center">
                      <Icon name="User" size={16} className="text-[hsl(220,60%,28%)]" />
                    </div>
                    <div>
                      <p className="font-bold text-foreground text-sm">{u.name.split(" ").slice(0,2).join(" ")}</p>
                      <p className="text-xs text-muted-foreground">{u.tabNumber}</p>
                    </div>
                  </div>
                  <div className="flex gap-1.5 mt-2.5 flex-wrap">
                    <span className={`status-badge border text-xs ${RANK_COLOR[u.rank]}`}>{RANK_LABEL[u.rank]}</span>
                  </div>
                  {(() => {
                    const { lectures: lecs, practices: pracs } = getLecturesFor(u.rank);
                    const ld = lecs.filter(l => l.type==="Лекция" && u.progress.lecturesChecked[l.id]?.done).length;
                    const lt = lecs.filter(l => l.type==="Лекция").length;
                    const pd = pracs.filter(p => u.progress.practicesDone[p.id]?.done).length;
                    return (
                      <div className="mt-2 text-xs text-muted-foreground">
                        Лекции {ld}/{lt} · Практика {pd}/{pracs.length}
                      </div>
                    );
                  })()}
                </button>
              ))}
            </div>

            {selectedCadetUser && (() => {
              const { lectures: lecs, practices: pracs } = getLecturesFor(selectedCadetUser.rank);
              return (
                <div className="bg-white rounded-xl border border-t-[3px] border-t-[hsl(220,60%,28%)] border-border shadow-sm p-6 space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[hsl(220,60%,28%)]/10 border border-[hsl(220,60%,28%)]/25 flex items-center justify-center">
                      <Icon name="User" size={18} className="text-[hsl(220,60%,28%)]" />
                    </div>
                    <div>
                      <p className="font-bold text-foreground">{selectedCadetUser.name}</p>
                      <p className="text-xs text-muted-foreground">{selectedCadetUser.tabNumber} · {RANK_LABEL[selectedCadetUser.rank]}</p>
                    </div>
                  </div>

                  {/* Lectures */}
                  <div>
                    <h3 className="font-oswald text-sm font-bold uppercase tracking-widest text-foreground mb-3">Лекции</h3>
                    <div className="space-y-3">
                      {lecs.filter(l => l.type === "Лекция").map(l => {
                        const chk = selectedCadetUser.progress.lecturesChecked[l.id];
                        const done = !!chk?.done;
                        const linkKey = `${selectedCadetUser.id}-${l.id}`;
                        return (
                          <div key={l.id} className={`rounded-lg border p-3.5 ${done ? "bg-green-50 border-green-200" : "bg-secondary/20 border-border"}`}>
                            <div className="flex items-center justify-between gap-3 mb-2">
                              <p className="font-semibold text-foreground text-sm">{l.title}</p>
                              <button onClick={() => checkLecture(selectedCadetUser.id, l.id, !done, instrLink[linkKey] || "")}
                                className={`text-xs px-3 py-1.5 rounded-lg font-bold flex-shrink-0 transition-colors ${done ? "bg-green-100 text-green-700 border border-green-300 hover:bg-red-50 hover:text-red-600 hover:border-red-200" : "bg-[hsl(220,60%,28%)] text-white hover:bg-[hsl(220,60%,22%)]"}`}>
                                {done ? "Зачтено ✓" : "Зачесть"}
                              </button>
                            </div>
                            <div className="flex gap-2 items-center">
                              <input value={instrLink[linkKey] || ""} onChange={e => setInstrLink(p => ({ ...p, [linkKey]: e.target.value }))}
                                placeholder="Ссылка-подтверждение (Discord, Google и т.д.)"
                                className="flex-1 border border-border rounded-md px-3 py-1.5 text-xs focus:outline-none focus:border-[hsl(220,60%,28%)] bg-white" />
                            </div>
                            {done && chk?.confirmLink && (
                              <a href={chk.confirmLink} target="_blank" rel="noopener noreferrer" className="text-xs text-[hsl(220,60%,28%)] underline mt-1 block">Прикреплённая ссылка ↗</a>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Practices */}
                  <div>
                    <h3 className="font-oswald text-sm font-bold uppercase tracking-widest text-foreground mb-3">Практика</h3>
                    <div className="space-y-3">
                      {pracs.map(p => {
                        const pr = selectedCadetUser.progress.practicesDone[p.id];
                        const done = !!pr?.done;
                        const photo = pr?.photoUrl;
                        return (
                          <div key={p.id} className={`rounded-lg border p-3.5 ${done ? "bg-green-50 border-green-200" : "bg-secondary/20 border-border"}`}>
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold text-foreground text-sm">{p.title}</p>
                                <p className="text-xs text-muted-foreground">{p.desc}</p>
                                {done && pr?.confirmedBy && <p className="text-xs text-green-600 mt-0.5">Зачёл: {pr.confirmedBy}</p>}
                                {photo && (
                                  <div className="mt-2">
                                    <p className="text-xs text-muted-foreground font-bold uppercase tracking-wide mb-1">Фото курсанта</p>
                                    <img src={photo} alt="фото практики" className="w-32 h-32 object-cover rounded-lg border border-border shadow-sm cursor-pointer hover:scale-105 transition-transform"
                                      onClick={() => window.open(photo, "_blank")} />
                                  </div>
                                )}
                                {!photo && (
                                  <p className="text-xs text-muted-foreground/60 italic mt-1">Фото не прикреплено</p>
                                )}
                              </div>
                              <button onClick={() => checkPractice(selectedCadetUser.id, p.id, !done)}
                                className={`text-xs px-3 py-1.5 rounded-lg font-bold flex-shrink-0 transition-colors ${done ? "bg-green-100 text-green-700 border border-green-300 hover:bg-red-50 hover:text-red-600 hover:border-red-200" : photo ? "bg-[hsl(220,60%,28%)] text-white hover:bg-[hsl(220,60%,22%)]" : "bg-secondary text-muted-foreground border border-border cursor-not-allowed"}`}
                                title={!photo && !done ? "Курсант ещё не прикрепил фото" : ""}>
                                {done ? "Зачтено ✓" : "Зачесть"}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* ══ СТАТИСТИКА ══ */}
        {page === "stats" && canInstr && (
          <div className="space-y-6 animate-slide-up">
            <div className="border-b-2 border-[hsl(220,60%,28%)] pb-3 mb-6">
              <h1 className="font-oswald text-3xl font-bold text-foreground tracking-wide">Статистика</h1>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { l: "Курсантов", v: users.filter(u=>u.role==="cadet").length, i: "Users", c: "text-blue-600" },
                { l: "Рапортов", v: reports.length, i: "FileText", c: "text-amber-600" },
                { l: "На рассмотрении", v: reports.filter(r=>r.status==="pending").length, i: "Clock", c: "text-yellow-600" },
                { l: "Одобрено", v: reports.filter(r=>r.status==="approved").length, i: "CheckCircle2", c: "text-green-600" },
              ].map(m => (
                <div key={m.l} className="bg-white rounded-xl border border-border shadow-sm p-5">
                  <Icon name={m.i} size={20} className={`${m.c} mb-2`} />
                  <div className={`text-3xl font-oswald font-bold ${m.c}`}>{m.v}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{m.l}</div>
                </div>
              ))}
            </div>
            <div className="bg-white rounded-xl border border-border shadow-sm overflow-hidden">
              <div className="px-6 py-3 border-b border-border bg-secondary/30">
                <span className="font-oswald text-sm font-bold uppercase tracking-widest text-foreground">Прогресс курсантов</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-border bg-secondary/20 text-xs font-bold text-muted-foreground uppercase tracking-wide">
                    <th className="px-6 py-3 text-left">ФИО</th>
                    <th className="px-6 py-3 text-left">Таб. №</th>
                    <th className="px-6 py-3 text-left">Звание</th>
                    <th className="px-6 py-3 text-left">Лекции</th>
                    <th className="px-6 py-3 text-left">Практика</th>
                  </tr></thead>
                  <tbody className="divide-y divide-border">
                    {users.filter(u => u.role === "cadet").map(u => {
                      const { lectures: lecs, practices: pracs } = getLecturesFor(u.rank);
                      const ld = lecs.filter(l => l.type==="Лекция" && u.progress.lecturesChecked[l.id]?.done).length;
                      const lt = lecs.filter(l => l.type==="Лекция").length;
                      const pd = pracs.filter(p => u.progress.practicesDone[p.id]?.done).length;
                      return (
                        <tr key={u.id} className="hover:bg-secondary/20 transition-colors">
                          <td className="px-6 py-3 font-semibold text-foreground">{u.name}</td>
                          <td className="px-6 py-3 font-mono text-muted-foreground text-xs">{u.tabNumber}</td>
                          <td className="px-6 py-3"><span className={`status-badge border ${RANK_COLOR[u.rank]}`}>{RANK_LABEL[u.rank]}</span></td>
                          <td className="px-6 py-3">
                            <div className="flex items-center gap-2">
                              <div className="w-20 h-1.5 bg-secondary rounded-full overflow-hidden">
                                <div className="h-full bg-blue-500 rounded-full" style={{ width: lt ? `${(ld/lt)*100}%` : "0" }} />
                              </div>
                              <span className="text-xs text-muted-foreground">{ld}/{lt}</span>
                            </div>
                          </td>
                          <td className="px-6 py-3">
                            <div className="flex items-center gap-2">
                              <div className="w-20 h-1.5 bg-secondary rounded-full overflow-hidden">
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
          </div>
        )}

        {/* ══ РАПОРТЫ (инструктор) ══ */}
        {page === "report_instr" && canInstr && (
          <div className="space-y-6 animate-slide-up">
            <div className="border-b-2 border-[hsl(220,60%,28%)] pb-3 mb-6">
              <h1 className="font-oswald text-3xl font-bold text-foreground tracking-wide">Рапорты курсантов</h1>
              <p className="text-muted-foreground text-sm mt-0.5">Просмотр, фото и одобрение рапортов</p>
            </div>

            {reports.length === 0 && (
              <div className="bg-white rounded-xl border border-border shadow-sm p-8 text-center">
                <Icon name="FileText" size={32} className="text-muted-foreground/40 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Рапортов пока не поступало</p>
              </div>
            )}

            <div className="space-y-4">
              {reports.map(r => {
                const isOpen = viewReportId === r.id;
                return (
                  <div key={r.id} className="bg-white rounded-xl border border-border shadow-sm overflow-hidden">
                    {/* Header row */}
                    <div className="px-6 py-4 flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-bold text-foreground">{r.authorName}</p>
                          <span className="font-mono text-xs text-muted-foreground">{r.tabNumber}</span>
                          <span className={`status-badge ${STATUS_MAP[r.status].cls}`}>{STATUS_MAP[r.status].label}</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">{r.direction} · {r.date}</p>
                        {r.signature && <p className="text-xs text-muted-foreground">Подпись: {r.signature}</p>}
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {canMod && (
                          <>
                            <button onClick={async () => { await api({ action:"set_report_status", reportId: r.id, status:"approved" }); setReports(p => p.map(x => x.id===r.id?{...x,status:"approved"}:x)); }} className="text-xs px-3 py-1.5 rounded bg-green-100 text-green-700 border border-green-200 font-bold hover:bg-green-200 transition-colors">Одобрить</button>
                            <button onClick={async () => { await api({ action:"set_report_status", reportId: r.id, status:"rejected" }); setReports(p => p.map(x => x.id===r.id?{...x,status:"rejected"}:x)); }} className="text-xs px-3 py-1.5 rounded bg-red-100 text-red-700 border border-red-200 font-bold hover:bg-red-200 transition-colors">Отклонить</button>
                          </>
                        )}
                        <button onClick={() => setViewReportId(isOpen ? null : r.id)}
                          className="text-xs px-3 py-1.5 rounded bg-secondary border border-border font-bold text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
                          <Icon name={isOpen ? "ChevronUp" : "ChevronDown"} size={13} />
                          {isOpen ? "Свернуть" : "Подробнее"}
                        </button>
                      </div>
                    </div>

                    {/* Expanded view */}
                    {isOpen && (
                      <div className="border-t border-border px-6 py-5 space-y-5 animate-fade-in">
                        {/* Photo */}
                        <div>
                          <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-2">Фото</p>
                          {r.photoUrl ? (
                            <img src={r.photoUrl} alt="фото рапорта" className="max-w-xs rounded-xl border border-border shadow-sm" />
                          ) : (
                            <p className="text-xs text-muted-foreground italic">Фото не прикреплено</p>
                          )}
                        </div>

                        {/* Lectures snapshot */}
                        <div>
                          <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-2">Лекции</p>
                          <div className="space-y-1.5">
                            {r.lecturesSnapshot.map((s, i) => (
                              <div key={i} className="flex items-center gap-2 text-sm">
                                <div className={`w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center ${s.done ? "bg-green-100 border-green-400" : "border-border"}`}>
                                  {s.done && <Icon name="Check" size={10} className="text-green-600" />}
                                </div>
                                <span className={s.done ? "text-foreground font-semibold" : "text-muted-foreground"}>{s.title}</span>
                                {s.confirmLink && (
                                  <a href={s.confirmLink} target="_blank" rel="noopener noreferrer" className="text-xs text-[hsl(220,60%,28%)] underline ml-1">↗ ссылка</a>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Practices snapshot */}
                        <div>
                          <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-2">Практика</p>
                          <div className="space-y-1.5">
                            {r.practicesSnapshot.map((s, i) => (
                              <div key={i} className="flex items-center gap-2 text-sm">
                                <div className={`w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center ${s.done ? "bg-green-100 border-green-400" : "border-border"}`}>
                                  {s.done && <Icon name="Check" size={10} className="text-green-600" />}
                                </div>
                                <span className={s.done ? "text-foreground font-semibold" : "text-muted-foreground"}>{s.title}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ══ ЧЁРНЫЙ СПИСОК ══ */}
        {page === "blacklist" && canMod && (
          <div className="space-y-6 animate-slide-up">
            <div className="border-b-2 border-red-500 pb-3 mb-6">
              <h1 className="font-oswald text-3xl font-bold text-foreground tracking-wide">Чёрный список</h1>
              <p className="text-muted-foreground text-sm mt-0.5">Лица, которым запрещён вход в АВНГ</p>
            </div>

            {/* Add form */}
            <div className="bg-white rounded-xl border border-t-[3px] border-t-red-500 border-border shadow-sm p-6">
              <div className="flex items-center gap-2 mb-4">
                <Icon name="UserX" size={18} className="text-red-500" />
                <h2 className="font-oswald text-base font-bold uppercase tracking-widest text-foreground">Добавить в чёрный список</h2>
              </div>
              <div className="grid sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wide text-foreground mb-1.5 block">ФИО</label>
                  <input value={blName} onChange={e => setBlName(e.target.value)} placeholder="Фамилия Имя"
                    className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:border-red-400" />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wide text-foreground mb-1.5 block">Таб. номер</label>
                  <input value={blTab} onChange={e => setBlTab(e.target.value)} placeholder="XXX-XXX"
                    className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:border-red-400" />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wide text-foreground mb-1.5 block">Причина</label>
                  <input value={blReason} onChange={e => setBlReason(e.target.value)} placeholder="Причина занесения"
                    className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:border-red-400" />
                </div>
              </div>
              {blMsg && <p className={`mt-3 text-sm font-semibold ${blMsg.startsWith("✓") ? "text-green-600" : "text-red-600"}`}>{blMsg}</p>}
              <button
                onClick={async () => {
                  if (!blName || !blReason) { setBlMsg("Заполните ФИО и причину"); return; }
                  const res = await api({ action: "add_blacklist", name: blName, tabNumber: blTab, reason: blReason, addedBy: cu.name });
                  setBlacklist(p => [{ id: res.id, name: blName, tabNumber: blTab, reason: blReason, addedBy: cu.name, date: new Date().toLocaleDateString("ru-RU") }, ...p]);
                  setBlMsg("✓ Добавлен в чёрный список");
                  setBlName(""); setBlTab(""); setBlReason("");
                }}
                className="mt-4 flex items-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold text-sm transition-colors">
                <Icon name="UserX" size={14} /> Внести в список
              </button>
            </div>

            {/* List */}
            <div className="bg-white rounded-xl border border-border shadow-sm overflow-hidden">
              <div className="px-6 py-3 border-b border-border bg-red-50 flex items-center justify-between">
                <span className="font-oswald text-sm font-bold uppercase tracking-widest text-red-700">Записи</span>
                <span className="text-xs text-red-500 font-bold">{blacklist.length} чел.</span>
              </div>
              {blacklist.length === 0 ? (
                <p className="px-6 py-5 text-sm text-muted-foreground">Список пуст</p>
              ) : (
                <div className="divide-y divide-border">
                  {blacklist.map(b => (
                    <div key={b.id} className="px-6 py-4 flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <div className="w-9 h-9 rounded-full bg-red-100 border border-red-200 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <Icon name="UserX" size={16} className="text-red-500" />
                        </div>
                        <div>
                          <p className="font-bold text-foreground">{b.name}</p>
                          {b.tabNumber && <p className="text-xs font-mono text-muted-foreground">{b.tabNumber}</p>}
                          <p className="text-xs text-red-600 font-semibold mt-0.5">Причина: {b.reason}</p>
                          <p className="text-xs text-muted-foreground">Внёс: {b.addedBy} · {b.date}</p>
                        </div>
                      </div>
                      <button
                        onClick={async () => { await api({ action: "remove_blacklist", id: b.id }); setBlacklist(p => p.filter(x => x.id !== b.id)); }}
                        className="text-xs px-3 py-1.5 rounded bg-secondary border border-border text-muted-foreground hover:text-red-600 hover:border-red-300 font-bold transition-colors flex-shrink-0">
                        Удалить
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ══ МОДЕРАЦИЯ ══ */}
        {page === "moderation" && canMod && (
          <div className="space-y-6 animate-slide-up">
            <div className="border-b-2 border-[hsl(220,60%,28%)] pb-3 mb-6">
              <h1 className="font-oswald text-3xl font-bold text-foreground tracking-wide">Модерация</h1>
              <p className="text-muted-foreground text-sm mt-0.5">{ROLE_LABEL[cu.role]} — управление пользователями</p>
            </div>

            {/* Register */}
            <div className="bg-white rounded-xl border border-t-[3px] border-t-[hsl(220,60%,28%)] border-border shadow-sm p-6">
              <div className="flex items-center gap-2 mb-4">
                <Icon name="UserPlus" size={18} className="text-[hsl(220,60%,28%)]" />
                <h2 className="font-oswald text-base font-bold uppercase tracking-widest text-foreground">Зарегистрировать пользователя</h2>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                {[
                  { l: "ФИО", v: regName, s: setRegName, p: "Фамилия Имя" },
                  { l: "Таб. номер (XXX-XXX)", v: regTab, s: setRegTab, p: "686-702" },
                  { l: "Логин", v: regLogin, s: setRegLogin, p: "login123" },
                  { l: "Пароль", v: regPass, s: setRegPass, p: "password" },
                ].map(f => (
                  <div key={f.l}>
                    <label className="text-xs font-bold uppercase tracking-wide text-foreground mb-1.5 block">{f.l}</label>
                    <input value={f.v} onChange={e => f.s(e.target.value)} placeholder={f.p}
                      className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:border-[hsl(220,60%,28%)]" />
                  </div>
                ))}
              </div>
              <div className="mt-4">
                <label className="text-xs font-bold uppercase tracking-wide text-foreground mb-1.5 block">Роль</label>
                <select value={regRole} onChange={e => setRegRole(e.target.value as Role)}
                  className="border border-border rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:border-[hsl(220,60%,28%)]">
                  <option value="cadet">Курсант</option>
                  <option value="jr_instructor">Мл. инструктор</option>
                  <option value="instructor">Инструктор</option>
                  {(isChief || isSuperAdmin) && <option value="deputy">Зам.Нач.АВНГ</option>}
                </select>
              </div>
              {regMsg && <p className={`mt-3 text-sm font-semibold ${regMsg.startsWith("✓") ? "text-green-600" : "text-red-600"}`}>{regMsg}</p>}
              <button onClick={handleRegister} className="mt-4 flex items-center gap-2 px-5 py-2.5 bg-[hsl(220,60%,28%)] hover:bg-[hsl(220,60%,22%)] text-white rounded-lg font-bold text-sm transition-colors">
                <Icon name="UserPlus" size={14} /> Создать аккаунт
              </button>
            </div>

            {/* Users table */}
            <div className="bg-white rounded-xl border border-border shadow-sm overflow-hidden">
              <div className="px-6 py-3 border-b border-border bg-secondary/30">
                <span className="font-oswald text-sm font-bold uppercase tracking-widest text-foreground">Все пользователи</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-border bg-secondary/20 text-xs font-bold text-muted-foreground uppercase tracking-wide">
                    <th className="px-6 py-3 text-left">ФИО</th>
                    <th className="px-6 py-3 text-left">Таб. №</th>
                    <th className="px-6 py-3 text-left">Логин / Пароль</th>
                    <th className="px-6 py-3 text-left">Роль</th>
                    <th className="px-6 py-3 text-left">Звание</th>
                  </tr></thead>
                  <tbody className="divide-y divide-border">
                    {users.map(u => (
                      <tr key={u.id} className="hover:bg-secondary/20 transition-colors">
                        <td className="px-6 py-3 font-semibold text-foreground">
                          {u.name}
                          {u.isSuperAdmin && <span className="ml-1.5 text-xs text-amber-600 font-bold">★</span>}
                        </td>
                        <td className="px-6 py-3 font-mono text-muted-foreground text-xs">{u.tabNumber}</td>
                        <td className="px-6 py-3 font-mono text-xs text-muted-foreground">
                          {u.login} / <span className="font-bold text-foreground">{u.password}</span>
                        </td>
                        <td className="px-6 py-3">
                          <select value={u.role} onChange={e => setRole(u.id, e.target.value as Role)}
                            disabled={u.isSuperAdmin && !isSuperAdmin}
                            className="text-xs border border-border rounded px-2 py-1 bg-white focus:outline-none focus:border-[hsl(220,60%,28%)]">
                            <option value="cadet">Курсант</option>
                            <option value="jr_instructor">Мл. инструктор</option>
                            <option value="instructor">Инструктор</option>
                            <option value="deputy">Зам.Нач.АВНГ</option>
                            {(isChief || isSuperAdmin) && <option value="chief">Нач.АВНГ</option>}
                          </select>
                        </td>
                        <td className="px-6 py-3">
                          <select value={u.rank} onChange={e => setRank(u.id, e.target.value as Rank)}
                            className="text-xs border border-border rounded px-2 py-1 bg-white focus:outline-none focus:border-[hsl(220,60%,28%)]">
                            <option value="private">Рядовой</option>
                            <option value="jr_sergeant">Мл. сержант</option>
                            <option value="sergeant">Сержант</option>
                          </select>
                        </td>
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