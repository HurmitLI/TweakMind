interface PageTitleProps {
  title: string;
}

export function PageTitle({ title }: PageTitleProps) {
  return (
    <section className="flex flex-1 items-center justify-center rounded-lg border border-slate-200 bg-white">
      <h2 className="text-4xl font-semibold tracking-tight text-slate-950">{title}</h2>
    </section>
  );
}
