interface RecoveryPanelProps {
  method: string;
  time: string;
  difficulty: string;
  expectedResult: string;
}

export function RecoveryPanel({ method, time, difficulty, expectedResult }: RecoveryPanelProps) {
  return (
    <section className="rounded-lg border border-blue-100 bg-blue-50/70 p-6 shadow-sm">
      <h3 className="text-lg font-semibold tracking-tight text-slate-950">Recovery</h3>
      <div className="mt-4 grid gap-4 md:grid-cols-4">
        <div className="rounded-lg border border-white/70 bg-white/80 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Method</p>
          <p className="mt-2 text-sm leading-6 text-slate-700">{method}</p>
        </div>
        <div className="rounded-lg border border-white/70 bg-white/80 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Estimated time</p>
          <p className="mt-2 text-sm leading-6 text-slate-700">{time}</p>
        </div>
        <div className="rounded-lg border border-white/70 bg-white/80 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Difficulty</p>
          <p className="mt-2 text-sm leading-6 text-slate-700">{difficulty}</p>
        </div>
        <div className="rounded-lg border border-white/70 bg-white/80 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Expected result</p>
          <p className="mt-2 text-sm leading-6 text-slate-700">{expectedResult}</p>
        </div>
      </div>
    </section>
  );
}
