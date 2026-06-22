import { ArrowRight, BookOpen, CheckCircle2, History, MonitorCheck, RotateCcw, ScanLine, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";

const trustCards = [
  {
    title: "本地扫描",
    description: "不会上传任何系统数据。",
    icon: ShieldCheck
  },
  {
    title: "永不自动优化",
    description: "所有修改都需要你的确认。",
    icon: CheckCircle2
  },
  {
    title: "可验证",
    description: "应用之后重新检测真实状态。",
    icon: ScanLine
  },
  {
    title: "可恢复",
    description: "所有修改都支持恢复。",
    icon: RotateCcw
  }
];

const supportedOptimizations = [
  "Windows Search",
  "Game Mode",
  "Core Isolation",
  "Delivery Optimization",
  "SysMain",
  "Power Plan",
  "HAGS",
  "Background Apps",
  "Startup Apps",
  "Visual Effects",
  "Windows Update Active Hours"
];

const philosophyCards = [
  "先理解，再优化。",
  "AI 提供建议，\n由你决定。",
  "每一次修改，\n都可以恢复。"
];

export function DashboardPage() {
  return (
    <div className="tm-page gap-5">
      <section className="relative overflow-hidden rounded-lg border border-blue-100 bg-white/95 px-8 py-14 shadow-xl shadow-blue-100/60 dark:border-blue-500/30 dark:bg-slate-900/95 dark:shadow-blue-950/20">
        <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-blue-600 via-cyan-400 to-emerald-400" />
        <div className="flex flex-col gap-8 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-4xl">
            <h2 className="text-6xl font-semibold leading-tight tracking-tight text-slate-950 dark:text-slate-100">
              让每一次 Windows 优化，
              <br />
              都心里有数。
            </h2>
            <div className="mt-6 space-y-2 text-xl font-medium leading-8 text-slate-700 dark:text-slate-200">
              <p>扫描你的 Windows 配置。</p>
              <p>了解每项优化意味着什么。</p>
              <p>确认以后，再决定是否应用。</p>
            </div>
          </div>

          <div className="flex shrink-0 flex-col gap-4 xl:w-80">
            <Link
              className="inline-flex h-16 items-center justify-center gap-2.5 rounded-lg bg-blue-600 px-8 text-lg font-semibold text-white shadow-xl shadow-blue-600/35 ring-1 ring-blue-500/20 transition hover:bg-blue-700 hover:shadow-blue-600/40 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900"
              to="/scan"
            >
              立即扫描 Windows
              <ArrowRight size={20} aria-hidden="true" />
            </Link>
            <div className="flex flex-wrap gap-2">
              {["本地扫描", "不上传数据", "不自动修改", "支持恢复"].map((tag) => (
                <span
                  className="rounded-full border border-blue-200 bg-blue-50 px-3.5 py-1.5 text-xs font-semibold tracking-wide text-blue-800 dark:border-blue-400/50 dark:bg-blue-950/50 dark:text-blue-100"
                  key={tag}
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="tm-section-card">
        <h3 className="text-2xl font-semibold tracking-tight text-slate-950 dark:text-slate-100">为什么值得信任</h3>
        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {trustCards.map((card) => {
            const Icon = card.icon;

            return (
              <article className="tm-info-card" key={card.title}>
                <div className="tm-icon-tile">
                  <Icon size={20} aria-hidden="true" />
                </div>
                <h4 className="mt-4 text-base font-semibold tracking-tight text-slate-950 dark:text-slate-100">{card.title}</h4>
                <p className="mt-2 tm-body">{card.description}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="tm-section-card">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <h3 className="text-2xl font-semibold tracking-tight text-slate-950 dark:text-slate-100">已支持优化</h3>
        </div>
        <div className="mt-5 flex flex-wrap gap-2">
          {supportedOptimizations.map((name) => (
            <span
              className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 shadow-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              key={name}
            >
              {name}
            </span>
          ))}
          <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm font-semibold text-slate-500 dark:border-slate-700 dark:bg-slate-800/70 dark:text-slate-400">
            ...
          </span>
        </div>
        <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4 dark:border-slate-800">
          <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">共11项优化</p>
          <Link className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-700 hover:text-blue-800 dark:text-blue-300 dark:hover:text-blue-200" to="/knowledge">
            查看全部 →
          </Link>
        </div>
      </section>

      <section className="tm-section-card">
        <h3 className="text-2xl font-semibold tracking-tight text-slate-950 dark:text-slate-100">Quick Actions</h3>
        <div className="mt-5 grid gap-4 xl:grid-cols-[1.4fr_1fr_1fr]">
          <Link
            className="group rounded-lg border border-blue-200 bg-gradient-to-br from-blue-600 to-blue-700 p-7 text-white shadow-lg shadow-blue-600/20 transition hover:-translate-y-0.5 hover:shadow-xl dark:border-blue-400/40"
            to="/scan"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-white/15">
              <MonitorCheck size={23} aria-hidden="true" />
            </div>
            <h3 className="mt-5 text-2xl font-semibold tracking-tight">立即扫描 Windows</h3>
            <span className="mt-6 inline-flex items-center gap-2 text-sm font-semibold">
              立即开始
              <ArrowRight className="transition group-hover:translate-x-0.5" size={16} aria-hidden="true" />
            </span>
          </Link>

          <Link className="tm-card" to="/knowledge">
            <div className="tm-icon-tile">
              <BookOpen size={21} aria-hidden="true" />
            </div>
            <h3 className="mt-5 text-xl font-semibold tracking-tight text-slate-950 dark:text-slate-100">浏览知识库</h3>
          </Link>

          <Link className="tm-card" to="/history">
            <div className="tm-icon-tile">
              <History size={21} aria-hidden="true" />
            </div>
            <h3 className="mt-5 text-xl font-semibold tracking-tight text-slate-950 dark:text-slate-100">查看历史</h3>
          </Link>
        </div>
      </section>

      <section className="tm-section-card">
        <h3 className="text-2xl font-semibold tracking-tight text-slate-950 dark:text-slate-100">为什么是 TweakMind</h3>
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          {philosophyCards.map((card) => (
            <article className="tm-info-card" key={card}>
              <p className="whitespace-pre-line text-xl font-semibold leading-8 tracking-tight text-slate-950 dark:text-slate-100">{card}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
