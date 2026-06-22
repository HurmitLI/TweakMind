interface PageTitleProps {
  title: string;
}

export function PageTitle({ title }: PageTitleProps) {
  return (
    <section className="tm-page-center tm-section-card">
      <h2 className="tm-typo-page-title">{title}</h2>
    </section>
  );
}
