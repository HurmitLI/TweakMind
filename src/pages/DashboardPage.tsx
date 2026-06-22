import { ArrowRight, BookOpen, CheckCircle2, CloudOff, History, MonitorCheck, RotateCcw, ScanLine, ShieldCheck } from "lucide-react";
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

const heroTrustIndicators = [
  { label: "本地扫描", icon: ShieldCheck },
  { label: "不上传数据", icon: CloudOff },
  { label: "不自动修改", icon: CheckCircle2 },
  { label: "支持恢复", icon: RotateCcw }
];

export function DashboardPage() {
  return (
    <div className="tm-page">
      <section className="tm-home-hero">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent dark:via-slate-700" />
        <div className="flex flex-col tm-gap-section xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-4xl">
            <h2 className="tm-typo-hero-title">
              让每一次 Windows 优化，
              <br />
              都心里有数。
            </h2>
            <div className="tm-mt-section tm-stack-md tm-typo-body">
              <p>扫描你的 Windows 配置。</p>
              <p>了解每项优化意味着什么。</p>
              <p>确认以后，再决定是否应用。</p>
            </div>
          </div>

          <div className="tm-stack-lg shrink-0 xl:w-80">
            <Link className="tm-button-primary" to="/scan">
              立即扫描 Windows
              <ArrowRight size={18} aria-hidden="true" />
            </Link>
            <div className="tm-stack-sm">
              {heroTrustIndicators.map((indicator) => {
                const Icon = indicator.icon;

                return (
                  <span className="tm-trust-indicator" key={indicator.label}>
                    <Icon className="tm-trust-indicator-icon" size={14} aria-hidden="true" />
                    {indicator.label}
                  </span>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <section className="tm-section-card">
        <h3 className="tm-typo-section-title">为什么值得信任</h3>
        <div className="tm-mt-lg grid tm-gap-md md:grid-cols-2 xl:grid-cols-4">
          {trustCards.map((card) => {
            const Icon = card.icon;

            return (
              <article className="tm-metadata-panel" key={card.title}>
                <div className="tm-icon-tile">
                  <Icon size={20} aria-hidden="true" />
                </div>
                <h4 className="tm-mt-md tm-typo-body-emphasis">{card.title}</h4>
                <p className="tm-mt-md tm-typo-body">{card.description}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="tm-section-card">
        <h3 className="tm-typo-section-title">已支持优化</h3>
        <div className="tm-mt-lg flex flex-wrap tm-gap-sm">
          {supportedOptimizations.map((name) => (
            <span className="tm-tag" key={name}>
              {name}
            </span>
          ))}
          <span className="tm-tag">...</span>
        </div>
        <div className="tm-mt-lg flex items-center justify-between border-t border-[color:var(--tm-color-divider)] pt-4">
          <p className="tm-typo-caption">共11项优化</p>
          <Link className="tm-link-accent" to="/knowledge">
            查看全部 →
          </Link>
        </div>
      </section>

      <section className="tm-section-card">
        <h3 className="tm-typo-section-title">Quick Actions</h3>
        <div className="tm-mt-lg grid tm-gap-md xl:grid-cols-[1.4fr_1fr_1fr]">
          <Link className="tm-card-hero tm-card-hover tm-card-accent group" to="/scan">
            <div className="tm-icon-tile">
              <MonitorCheck size={23} aria-hidden="true" />
            </div>
            <h3 className="tm-card-accent-title tm-mt-lg tm-typo-section-title">立即扫描 Windows</h3>
            <span className="tm-card-accent-caption tm-mt-lg inline-flex items-center tm-gap-sm tm-typo-caption">
              立即开始
              <ArrowRight size={16} aria-hidden="true" />
            </span>
          </Link>

          <Link className="tm-card-hover" to="/knowledge">
            <div className="tm-icon-tile">
              <BookOpen size={21} aria-hidden="true" />
            </div>
            <h3 className="tm-mt-lg tm-typo-body-emphasis">浏览知识库</h3>
          </Link>

          <Link className="tm-card-hover" to="/history">
            <div className="tm-icon-tile">
              <History size={21} aria-hidden="true" />
            </div>
            <h3 className="tm-mt-lg tm-typo-body-emphasis">查看历史</h3>
          </Link>
        </div>
      </section>

      <section className="tm-section-card">
        <h3 className="tm-typo-section-title">为什么是 TweakMind</h3>
        <div className="tm-mt-lg grid tm-gap-md md:grid-cols-3">
          {philosophyCards.map((card) => (
            <article className="tm-metadata-panel" key={card}>
              <p className="whitespace-pre-line tm-typo-body-emphasis">{card}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
