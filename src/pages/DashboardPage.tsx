import { ArrowRight, CheckCircle2, CloudOff, RotateCcw, ScanLine, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";

const trustPrinciples = [
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
  { name: "Windows Search", mode: "executable" },
  { name: "Game Mode", mode: "executable" },
  { name: "Core Isolation", mode: "executable" },
  { name: "Delivery Optimization", mode: "executable" },
  { name: "SysMain", mode: "executable" },
  { name: "HAGS", mode: "executable" },
  { name: "Power Plan", mode: "executable" },
  { name: "Background Apps", mode: "knowledge-only" },
  { name: "Startup Apps", mode: "knowledge-only" },
  { name: "Visual Effects", mode: "knowledge-only" },
  { name: "Windows Update Active Hours", mode: "knowledge-only" }
];

const philosophyBlocks = [
  {
    title: "先理解，再优化。",
    description: "避免不知道改了什么的盲目优化。"
  },
  {
    title: "AI 提供建议，由你决定。",
    description: "TweakMind 可以推荐，但不会替你做决定。"
  },
  {
    title: "每一次修改，都可以恢复。",
    description: "优化不是不可逆操作，历史记录会保存恢复线索。"
  }
];

const heroTrustRow = [
  { label: "本地扫描", icon: ShieldCheck },
  { label: "不上传数据", icon: CloudOff },
  { label: "不会自动修改", icon: CheckCircle2 },
  { label: "支持恢复", icon: RotateCcw }
];

export function DashboardPage() {
  return (
    <div className="tm-home-shell">
      <div className="tm-home-grid">
        <section className="tm-home-hero tm-home-panel">
          <div className="tm-home-hero-content">
            <h1 className="tm-home-hero-title">
              让每一次{" "}
              <span className="tm-home-hero-title-unit">Windows 优化，</span>
              <br />
              都心里有数。
            </h1>
            <p className="tm-home-hero-subtitle">
              扫描你的 Windows 配置，理解每项优化的作用、风险和恢复方式，再决定是否应用。
            </p>
            <Link className="tm-home-cta tm-button-primary" to="/scan">
              立即扫描 Windows
              <ArrowRight size={18} aria-hidden="true" />
            </Link>
            <ul className="tm-home-trust-row">
              {heroTrustRow.map((item) => {
                const Icon = item.icon;

                return (
                  <li className="tm-home-trust-row-item" key={item.label}>
                    <Icon aria-hidden="true" size={12} />
                    <span>{item.label}</span>
                  </li>
                );
              })}
            </ul>
          </div>
        </section>

        <section className="tm-home-block">
          <h2 className="tm-home-heading">为什么值得信任</h2>
          <div className="tm-home-panel tm-home-trust-panel">
            <div className="tm-home-trust-columns">
              {trustPrinciples.map((principle) => {
                const Icon = principle.icon;

                return (
                  <article className="tm-home-trust-column" key={principle.title}>
                    <Icon aria-hidden="true" className="tm-home-trust-column-icon" size={16} />
                    <h3>{principle.title}</h3>
                    <p>{principle.description}</p>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section className="tm-home-block">
          <div className="tm-home-panel tm-home-primary-action">
            <div className="tm-home-primary-action-copy">
              <h2 className="tm-home-primary-action-title">开始第一次扫描</h2>
              <p className="tm-home-primary-action-description">分析当前 Windows 配置，找出值得关注的优化项。</p>
              <p className="tm-home-primary-action-meta">约 30 秒 · 本地完成 · 不会自动修改</p>
            </div>
            <Link className="tm-home-cta tm-button-primary tm-home-primary-action-button" to="/scan">
              立即扫描 Windows
              <ArrowRight size={18} aria-hidden="true" />
            </Link>
          </div>
        </section>

        <section className="tm-home-block">
          <h2 className="tm-home-heading">已支持优化</h2>
          <div className="tm-home-panel tm-home-optimization-panel">
            <ul className="tm-home-optimization-columns">
              {supportedOptimizations.map((optimization) => (
                <li className="tm-home-optimization-item" key={optimization.name}>
                  <span>{optimization.name}</span>
                  <span className={optimization.mode === "executable" ? "tm-home-optimization-mode" : "tm-home-optimization-mode tm-home-optimization-mode-muted"}>
                    {optimization.mode === "executable" ? "可执行" : "仅知识"}
                  </span>
                </li>
              ))}
            </ul>
            <div className="tm-home-optimization-footer">
              <Link className="tm-link-accent" to="/knowledge">
                查看全部优化 →
              </Link>
            </div>
          </div>
        </section>

        <section className="tm-home-block">
          <h2 className="tm-home-heading">为什么是 TweakMind</h2>
          <div className="tm-home-philosophy-grid">
            {philosophyBlocks.map((block) => (
              <article className="tm-home-philosophy-block" key={block.title}>
                <h3>{block.title}</h3>
                <p>{block.description}</p>
              </article>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
