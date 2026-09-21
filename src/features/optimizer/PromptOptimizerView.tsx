import { useState } from 'react';
import { Copy, History, Sparkles, WandSparkles } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { optimizePromptWithGemini, type ArenaEvaluation, type PromptOptimization } from '../../lib/gemini';

type OptimizerVersion = {
  id: string;
  original: string;
  optimized: string;
  goal: string;
  createdAt: string;
};

export function PromptOptimizerView({ onBack }: { onBack: () => void }) {
  const latestEvaluation = (() => {
    try {
      const raw = localStorage.getItem('arena-latest-evaluation');
      if (!raw) return null;
      return JSON.parse(raw) as { prompt?: string; evaluation?: ArenaEvaluation };
    } catch {
      return null;
    }
  })();

  const [original, setOriginal] = useState(latestEvaluation?.prompt || '');
  const [goal, setGoal] = useState(
    latestEvaluation?.evaluation
      ? 'Behebe gezielt die Schwächen aus der letzten Arena-Evaluation.'
      : 'Mehr Klarheit, Robustheit und reproduzierbare Ergebnisse.'
  );
  const [result, setResult] = useState<PromptOptimization | null>(null);
  const [running, setRunning] = useState(false);
  const [versions, setVersions] = useState<OptimizerVersion[]>(() => JSON.parse(localStorage.getItem('prompt-optimizer-versions') || '[]'));

  const optimize = async () => {
    if (!original.trim()) return toast.error('Füge zuerst einen Prompt ein.');
    setRunning(true);
    try {
      const next = await optimizePromptWithGemini(original, goal, latestEvaluation?.evaluation || null);
      setResult(next);
      const version: OptimizerVersion = { id: crypto.randomUUID(), original, optimized: next.optimizedPrompt, goal, createdAt: new Date().toISOString() };
      const nextVersions = [version, ...versions].slice(0, 20);
      setVersions(nextVersions);
      localStorage.setItem('prompt-optimizer-versions', JSON.stringify(nextVersions));
      toast.success('Prompt optimiert');
    } catch {
      toast.error('Optimierung fehlgeschlagen');
    } finally {
      setRunning(false);
    }
  };

  return (
    <main className="flex-1 h-screen overflow-y-auto p-6 xl:p-8 relative z-10">
      <div className="max-w-[1600px] mx-auto space-y-6">
        <header className="bento-card border-primary/20 bg-gradient-to-br from-secondary/10 to-transparent">
          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
            <div>
              <div className="card-title flex items-center gap-2"><WandSparkles className="w-4 h-4" /> PROMPT OPTIMIZER</div>
              <h1 className="text-4xl xl:text-6xl font-black tracking-[-0.05em] mt-2">Vom guten Prompt zur belastbaren Version.</h1>
              <p className="text-text-secondary mt-3 max-w-3xl">Verbessert Anforderungen, Struktur, Constraints und Output-Definition, ohne die eigentliche Absicht des Prompts zu verändern.</p>
            </div>
            <button onClick={onBack} className="btn-secondary-dynamic self-start">← Zurück</button>
          </div>
        </header>

        <section className="grid grid-cols-1 xl:grid-cols-[0.9fr_1.1fr] gap-6">
          <div className="space-y-5">
            <div className="bento-card">
              <div className="card-title">ORIGINAL</div>
              <textarea value={original} onChange={e => setOriginal(e.target.value)} className="mt-4 w-full min-h-72 bg-bg-elevated border border-border rounded-2xl p-4 outline-none focus:border-primary resize-y" placeholder="Prompt einfügen..." />
              <label className="block mt-4 text-[10px] font-black uppercase tracking-widest text-text-secondary">Optimierungsziel</label>
              <input value={goal} onChange={e => setGoal(e.target.value)} className="mt-2 w-full bg-bg-elevated border border-border rounded-xl px-4 py-3 outline-none focus:border-primary" />
              <button onClick={optimize} disabled={running} className="btn-primary-dynamic w-full mt-4 py-4 disabled:opacity-50"><Sparkles className="w-4 h-4" /> {running ? 'Optimiere...' : 'Prompt optimieren'}</button>
            </div>

            <div className="bento-card">
              <div className="card-title flex items-center gap-2"><History className="w-4 h-4" /> VERSIONEN</div>
              <div className="mt-4 space-y-2">
                {versions.slice(0, 5).map(v => (
                  <button key={v.id} onClick={() => { setOriginal(v.original); setResult({ optimizedPrompt: v.optimized, changes: [], rationale: 'Geladene Version', predictedImpact: '' }); }} className="w-full text-left p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5">
                    <div className="text-xs font-bold">{new Date(v.createdAt).toLocaleString('de-DE')}</div>
                    <div className="text-[10px] text-text-secondary mt-1 line-clamp-1">{v.goal}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="bento-card min-h-[520px]">
            <div className="flex items-center justify-between">
              <div>
                <div className="card-title">OPTIMIERTE VERSION</div>
                <h2 className="text-2xl font-black mt-2">Prompt v2</h2>
              </div>
              <button onClick={() => { if (result?.optimizedPrompt) navigator.clipboard.writeText(result.optimizedPrompt); }} disabled={!result} className="btn-secondary-dynamic disabled:opacity-40"><Copy className="w-4 h-4" /> Kopieren</button>
            </div>
            {result ? (
              <div className="space-y-5 mt-5">
                <pre className="whitespace-pre-wrap font-mono text-sm leading-7 bg-black/25 border border-white/10 rounded-2xl p-5">{result.optimizedPrompt}</pre>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                    <div className="text-xs font-black uppercase tracking-widest">Änderungen</div>
                    <ul className="mt-3 space-y-2 text-sm text-text-secondary">{result.changes.map(item => <li key={item}>• {item}</li>)}</ul>
                  </div>
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                    <div className="text-xs font-black uppercase tracking-widest">Erwarteter Effekt</div>
                    <p className="mt-3 text-sm text-text-secondary">{result.predictedImpact}</p>
                  </div>
                </div>
                <div className="p-4 rounded-2xl bg-primary/5 border border-primary/20 text-sm leading-7">{result.rationale}</div>
              </div>
            ) : (
              <div className="min-h-[420px] grid place-items-center text-text-secondary">Die optimierte Version erscheint hier.</div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
