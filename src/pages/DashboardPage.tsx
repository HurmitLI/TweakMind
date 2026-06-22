import { ArrowRight, BookOpen, CheckCircle2, CloudOff, History, MonitorCheck, RotateCcw, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";

const trustCards = [
  {
    title: "本地扫描",
    description: "不会上传任何系统数据。"
  },
  {
    title: "永不自动优化",
    description: "所有修改都需要你的确认。"
  },
  {
    title: "可验证",
    description: "应用之后重新检测真实状态。"
  },
  {
    title: "可恢复",
    description: "所有修改都支持恢复。"
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

const featuredOptimization = supportedOptimizations[0];
const otherOptimizations = supportedOptimizations.slice(1);

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
    <div className="tm-home-page">
      <section className="tm-home-hero">
        <div className="tm-home-hero-inner">
          <div className="tm-home-hero-copy">
            <h2 className="tm-typo-hero">
              让每一次 Windows 优化，
              <br />
              都心里有数。
            </h2>
            <p className="tm-home-hero-lead">
              扫描你的 Windows 配置，了解每项优化意味着什么，确认以后再决定是否应用。
            </p>
          </div>

          <div className="tm-home-hero-aside">
            <Link className="tm-home-cta tm-button-primary" to="/scan">
              立即扫描 Windows
              <ArrowRight size={18} aria-hidden="true" />
            </Link>
            <ul className="tm-home-trust-strip">
              {heroTrustIndicators.map((indicator) => {
                const Icon = indicator.icon;

                return (
                  <li className="tm-home-trust-item" key={indicator.label}>
                    <Icon aria-hidden="true" size={11} />
                    <span>{indicator.label}</span>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </section>

      <section className="tm-home-section tm-home-section-quiet">
        <h3 className="tm-home-section-title">为什么值得信任</h3>
        <div className="tm-home-trust-detail">
          {trustCards.map((card) => (
            <article className="tm-home-trust-detail-item" key={card.title}>
              <h4>{card.title}</h4>
              <p>{card.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="tm-home-section">
        <h3 className="tm-home-section-title">已支持优化</h3>
        <article className="tm-home-optimization-featured">
          <p className="tm-home-optimization-eyebrow">重点支持</p>
          <p className="tm-home-optimization-featured-name">{featuredOptimization}</p>
          <p className="tm-home-optimization-featured-caption">共 {supportedOptimizations.length} 项 Windows 优化能力</p>
        </article>
        <ul className="tm-home-optimization-list">
          {otherOptimizations.map((name) => (
            <li className="tm-home-optimization-list-item" key={name}>
              {name}
            </li>
          ))}
        </ul>
        <div className="tm-home-section-footer">
          <Link className="tm-link-accent" to="/knowledge">
            查看全部 →
          </Link>
        </div>
      </section>

      <section className="tm-home-section">
        <h3 className="tm-home-section-title">Quick Actions</h3>
        <div className="tm-home-actions">
          <Link className="tm-home-action-primary tm-card-accent" to="/scan">
            <div className="tm-home-action-primary-icon">
              <MonitorCheck size={22} aria-hidden="true" />
            </div>
            <div>
              <h3 className="tm-home-action-primary-title">立即扫描 Windows</h3>
              <span className="tm-home-action-primary-caption">
                立即开始
                <ArrowRight size={15} aria-hidden="true" />
              </span>
            </div>
          </Link>

          <Link className="tm-home-action-secondary" to="/knowledge">
            <BookOpen size={18} aria-hidden="true" />
            <div>
              <h3>浏览知识库</h3>
              <p>了解每项优化的含义</p>
            </div>
          </Link>

          <Link className="tm-home-action-secondary" to="/history">
            <History size={18} aria-hidden="true" />
            <div>
              <h3>查看历史</h3>
              <p>回顾已应用的修改</p>
            </div>
          </Link>
        </div>
      </section>

      <section className="tm-home-section tm-home-section-quiet">
        <h3 className="tm-home-section-title">为什么是 TweakMind</h3>
        <div className="tm-home-philosophy">
          {philosophyCards.map((card) => (
            <blockquote className="tm-home-philosophy-item" key={card}>
              {card}
            </blockquote>
          ))}
        </div>
      </section>
    </div>
  );
}
