import { useMemo, type ReactNode } from 'react';
import { Activity, BarChart3, Clock3, History, ShieldCheck } from 'lucide-react';
import { loadRegressionRuns } from './qualityStore';

export function EvaluationHistoryView({ onBack }: { onBack: () => void }) {
  const runs = useMemo(() => loadRegressionRuns(), []);
  const totalCases = runs.reduce((sum, run) => sum + run.results.length, 0);
  const totalPassed = runs.reduce((sum, run) => sum + run.passed, 0);
  const avg = runs.length ? Math.round(runs.reduce((sum, run) => sum + run.averageScore, 0) / runs.length) : 0;

  return (
    <main className="flex-1 h-screen overflow-y-auto p-6 xl:p-8 relative z-10">
      <div className="max-w-[1600px] mx-auto space-y-6">
        <header className="bento-card border-primary/20 bg-gradient-to-br from-secondary/10 to-transparent">
          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
            <div>
              <div className="card-title flex items-center gap-2"><History className="w-4 h-4" /> QUALITY HISTORY</div>
              <h1 className="text-4xl xl:text-6xl font-black tracking-[-0.05em] mt-2">Qualität über Zeit beobachten.</h1>
              <p className="text-text-secondary mt-3 max-w-3xl">Historie aller lokalen Regression-Läufe mit Pass-Rate, Durchschnittsscore, Modell und Golden Set.</p>
            </div>
            <button onClick={onBack} className="btn-secondary-dynamic self-start">← Zurück</button>
          </div>
        </header>

        <section className="grid md:grid-cols-3 gap-5">
          <Metric icon={<Activity className="w-5 h-5" />} label="Regression Runs" value={String(runs.length)} />
          <Metric icon={<ShieldCheck className="w-5 h-5" />} label="Pass Rate" value={totalCases ? `${Math.round(totalPassed / totalCases * 100)}%` : '—'} />
          <Metric icon={<BarChart3 className="w-5 h-5" />} label="Ø Quality Score" value={runs.length ? String(avg) : '—'} />
        </section>

        <section className="space-y-4">
          {!runs.length ? (
            <div className="bento-card min-h-[380px] grid place-items-center text-center text-text-secondary">Noch keine Regression-Historie vorhanden.</div>
          ) : runs.map((run) => (
            <article key={run.id} className="bento-card">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div>
                  <div className="text-[10px] uppercase tracking-[0.22em] font-black text-text-secondary">{run.setName}</div>
                  <h3 className="text-2xl font-black mt-1">{run.modelIds.join(', ')}</h3>
                  <div className="flex items-center gap-2 text-xs text-text-secondary mt-2"><Clock3 className="w-4 h-4" /> {new Date(run.completedAt).toLocaleString('de-DE')}</div>
                </div>
                <div className="grid grid-cols-3 gap-3 min-w-[320px]">
                  <Small label="Bestanden" value={String(run.passed)} />
                  <Small label="Fehler" value={String(run.failed)} />
                  <Small label="Ø Score" value={String(run.averageScore)} />
                </div>
              </div>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}

function Metric({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return <div className="bento-card"><div className="flex items-center gap-2 text-text-secondary">{icon}<span className="text-xs font-black uppercase tracking-widest">{label}</span></div><div className="text-5xl font-black mt-3">{value}</div></div>;
}

function Small({ label, value }: { label: string; value: string }) {
  return <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-center"><div className="text-[10px] uppercase tracking-widest font-black text-text-secondary">{label}</div><div className="text-xl font-black mt-1">{value}</div></div>;
}
