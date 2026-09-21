import { useMemo, useState } from 'react';
import { BarChart3, CheckCircle2, FlaskConical, Gauge, Sparkles, Target } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { evaluateArenaOutput, type ArenaEvaluation } from '../../lib/gemini';

type SavedEvaluation = {
  id: string;
  prompt: string;
  output: string;
  modelName: string;
  evaluation: ArenaEvaluation;
  createdAt: string;
};

export function EvaluationLabView({ onBack }: { onBack: () => void }) {
  const latestArena = (() => {
    try {
      const raw = localStorage.getItem('arena-latest-run');
      if (!raw) return null;
      return JSON.parse(raw) as { prompt?: string; results?: Array<{ modelName?: string; output?: string; error?: string }> };
    } catch {
      return null;
    }
  })();
  const firstSuccessful = latestArena?.results?.find((item) => item.output && !item.error);

  const [prompt, setPrompt] = useState(latestArena?.prompt || '');
  const [output, setOutput] = useState(firstSuccessful?.output || '');
  const [modelName, setModelName] = useState(firstSuccessful?.modelName || 'Arena Model');
  const [evaluation, setEvaluation] = useState<ArenaEvaluation | null>(null);
  const [running, setRunning] = useState(false);

  const metrics = useMemo(() => evaluation ? [
    ['Klarheit', evaluation.clarity],
    ['Relevanz', evaluation.relevance],
    ['Vollständigkeit', evaluation.completeness],
    ['Instruction Fit', evaluation.instructionFollowing],
    ['Robustheit', evaluation.robustness],
  ] : [], [evaluation]);

  const runEvaluation = async () => {
    if (!prompt.trim() || !output.trim()) return toast.error('Prompt und Modellantwort werden benötigt.');
    setRunning(true);
    try {
      const result = await evaluateArenaOutput(prompt, output, modelName);
      setEvaluation(result);
      const saved: SavedEvaluation[] = JSON.parse(localStorage.getItem('arena-evaluations') || '[]');
      const entry: SavedEvaluation = {
        id: crypto.randomUUID(),
        prompt,
        output,
        modelName,
        evaluation: result,
        createdAt: new Date().toISOString(),
      };
      localStorage.setItem('arena-evaluations', JSON.stringify([entry, ...saved].slice(0, 25)));
      localStorage.setItem('arena-latest-evaluation', JSON.stringify(entry));
      toast.success('Evaluation abgeschlossen');
    } catch {
      toast.error('Evaluation fehlgeschlagen');
    } finally {
      setRunning(false);
    }
  };

  return (
    <main className="flex-1 h-screen overflow-y-auto p-6 xl:p-8 relative z-10">
      <div className="max-w-[1600px] mx-auto space-y-6">
        <header className="bento-card border-primary/20 bg-gradient-to-br from-primary/10 to-transparent">
          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
            <div>
              <div className="card-title flex items-center gap-2"><FlaskConical className="w-4 h-4" /> EVALUATION LAB</div>
              <h1 className="text-4xl xl:text-6xl font-black tracking-[-0.05em] mt-2">Antwortqualität messbar machen.</h1>
              <p className="text-text-secondary mt-3 max-w-3xl">Bewerte Modellantworten gegen ihren tatsächlichen Prompt und speichere die Resultate als Grundlage für Optimierung und Regression-Tests.</p>
            </div>
            <button onClick={onBack} className="btn-secondary-dynamic self-start">← Zurück</button>
          </div>
        </header>

        <section className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <div className="bento-card space-y-4">
            <div className="card-title">TESTFALL</div>
            <input value={modelName} onChange={e => setModelName(e.target.value)} className="w-full bg-bg-elevated border border-border rounded-xl px-4 py-3 outline-none focus:border-primary" placeholder="Modellname" />
            <textarea value={prompt} onChange={e => setPrompt(e.target.value)} className="w-full min-h-48 bg-bg-elevated border border-border rounded-2xl p-4 outline-none focus:border-primary resize-y" placeholder="Original-Prompt..." />
            <textarea value={output} onChange={e => setOutput(e.target.value)} className="w-full min-h-72 bg-bg-elevated border border-border rounded-2xl p-4 outline-none focus:border-primary resize-y" placeholder="Modellantwort..." />
            <button onClick={runEvaluation} disabled={running} className="btn-primary-dynamic w-full py-4 disabled:opacity-50">
              <Sparkles className="w-4 h-4" /> {running ? 'Bewerte...' : 'Antwort evaluieren'}
            </button>
          </div>

          <div className="space-y-6">
            <div className="bento-card min-h-48">
              <div className="flex justify-between items-start">
                <div>
                  <div className="card-title">OVERALL SCORE</div>
                  <div className="text-7xl font-black mt-3">{evaluation?.overallScore ?? '—'}</div>
                </div>
                <Gauge className="w-10 h-10 text-primary" />
              </div>
              <p className="text-text-secondary mt-4">{evaluation?.recommendation || 'Nach der Evaluation erscheint hier eine konkrete Empfehlung.'}</p>
            </div>

            <div className="bento-card">
              <div className="card-title flex items-center gap-2"><BarChart3 className="w-4 h-4" /> METRIKEN</div>
              <div className="space-y-4 mt-5">
                {metrics.length === 0 && <p className="text-sm text-text-secondary">Noch keine Messwerte.</p>}
                {metrics.map(([label, value]) => (
                  <div key={String(label)}>
                    <div className="flex justify-between text-xs font-bold mb-2"><span>{label}</span><span>{value}%</span></div>
                    <div className="h-2 bg-white/5 rounded-full overflow-hidden"><div className="h-full bg-primary rounded-full" style={{ width: `${value}%` }} /></div>
                  </div>
                ))}
              </div>
            </div>

            {evaluation && (
              <div className="grid md:grid-cols-2 gap-5">
                <div className="bento-card border-success/20">
                  <div className="card-title flex items-center gap-2 text-success"><CheckCircle2 className="w-4 h-4" /> STÄRKEN</div>
                  <ul className="mt-4 space-y-2 text-sm text-text-secondary">{evaluation.strengths.map(item => <li key={item}>• {item}</li>)}</ul>
                </div>
                <div className="bento-card border-warning/20">
                  <div className="card-title flex items-center gap-2 text-warning"><Target className="w-4 h-4" /> SCHWÄCHEN</div>
                  <ul className="mt-4 space-y-2 text-sm text-text-secondary">{evaluation.weaknesses.map(item => <li key={item}>• {item}</li>)}</ul>
                </div>
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
