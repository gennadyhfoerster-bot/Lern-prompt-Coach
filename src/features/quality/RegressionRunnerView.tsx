import { useMemo, useState } from 'react';
import { CheckCircle2, FlaskConical, Play, ShieldCheck, XCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { MODEL_PROFILES } from '../../config/models';
import { runArenaPrompt } from '../../services/arenaApi';
import { evaluateArenaOutput } from '../../lib/gemini';
import {
  loadGoldenSets,
  saveRegressionRun,
  type RegressionCaseResult,
  type RegressionRun,
} from './qualityStore';

export function RegressionRunnerView({ onBack }: { onBack: () => void }) {
  const sets = useMemo(() => loadGoldenSets(), []);
  const [setId, setSetId] = useState(sets[0]?.id || '');
  const [modelId, setModelId] = useState('qwen25-coder-7b');
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState<RegressionCaseResult[]>([]);
  const activeSet = sets.find((set) => set.id === setId);

  const runRegression = async () => {
    if (!activeSet) return;
    setRunning(true);
    setResults([]);

    const nextResults: RegressionCaseResult[] = [];
    for (const testCase of activeSet.cases) {
      try {
        const arena = await runArenaPrompt(modelId, testCase.prompt);
        const evaluation = await evaluateArenaOutput(testCase.prompt, arena.output, arena.modelName);
        const result: RegressionCaseResult = {
          caseId: testCase.id,
          title: testCase.title,
          modelId,
          modelName: arena.modelName,
          output: arena.output,
          latencyMs: arena.latencyMs,
          totalTokens: arena.usage.totalTokens,
          score: evaluation.overallScore,
          minScore: testCase.minScore,
          passed: evaluation.overallScore >= testCase.minScore,
          recommendation: evaluation.recommendation,
        };
        nextResults.push(result);
        setResults([...nextResults]);
      } catch (error) {
        nextResults.push({
          caseId: testCase.id,
          title: testCase.title,
          modelId,
          modelName: MODEL_PROFILES.find((model) => model.id === modelId)?.name || modelId,
          output: '',
          latencyMs: 0,
          totalTokens: 0,
          score: 0,
          minScore: testCase.minScore,
          passed: false,
          recommendation: 'Test konnte nicht abgeschlossen werden.',
          error: error instanceof Error ? error.message : 'Unbekannter Fehler',
        });
        setResults([...nextResults]);
      }
    }

    const passed = nextResults.filter((item) => item.passed).length;
    const failed = nextResults.length - passed;
    const averageScore = nextResults.length
      ? Math.round(nextResults.reduce((sum, item) => sum + item.score, 0) / nextResults.length)
      : 0;

    const run: RegressionRun = {
      id: crypto.randomUUID(),
      setId: activeSet.id,
      setName: activeSet.name,
      modelIds: [modelId],
      startedAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
      passed,
      failed,
      averageScore,
      results: nextResults,
    };

    saveRegressionRun(run);
    localStorage.setItem('promptmeister-latest-regression', JSON.stringify(run));
    setRunning(false);
    toast.success(`Regression abgeschlossen: ${passed}/${nextResults.length} bestanden`);
  };

  const passed = results.filter((item) => item.passed).length;
  const average = results.length
    ? Math.round(results.reduce((sum, item) => sum + item.score, 0) / results.length)
    : 0;

  return (
    <main className="flex-1 h-screen overflow-y-auto p-6 xl:p-8 relative z-10">
      <div className="max-w-[1650px] mx-auto space-y-6">
        <header className="bento-card border-primary/20 bg-gradient-to-br from-primary/10 to-transparent">
          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
            <div>
              <div className="card-title flex items-center gap-2"><ShieldCheck className="w-4 h-4" /> REGRESSION RUNNER</div>
              <h1 className="text-4xl xl:text-6xl font-black tracking-[-0.05em] mt-2">Prompts wie Software testen.</h1>
              <p className="text-text-secondary mt-3 max-w-3xl">Führe ein Golden Set sequenziell gegen ein Modell aus und prüfe automatisch, ob Qualitätsgrenzen eingehalten werden.</p>
            </div>
            <button onClick={onBack} className="btn-secondary-dynamic self-start">← Zurück</button>
          </div>
        </header>

        <section className="grid grid-cols-1 xl:grid-cols-[0.7fr_1.3fr] gap-6">
          <div className="space-y-5">
            <div className="bento-card">
              <div className="card-title">TESTKONFIGURATION</div>
              <label className="block mt-4 text-[10px] font-black uppercase tracking-widest text-text-secondary">Golden Set</label>
              <select value={setId} onChange={(e) => setSetId(e.target.value)} className="mt-2 w-full bg-bg-elevated border border-border rounded-xl px-4 py-3 outline-none focus:border-primary">
                {sets.map((set) => <option key={set.id} value={set.id}>{set.name}</option>)}
              </select>

              <label className="block mt-4 text-[10px] font-black uppercase tracking-widest text-text-secondary">Modell</label>
              <select value={modelId} onChange={(e) => setModelId(e.target.value)} className="mt-2 w-full bg-bg-elevated border border-border rounded-xl px-4 py-3 outline-none focus:border-primary">
                {MODEL_PROFILES.filter((model) => model.local).map((model) => <option key={model.id} value={model.id}>{model.name}</option>)}
              </select>

              <button onClick={runRegression} disabled={running} className="btn-primary-dynamic w-full mt-5 py-4 disabled:opacity-50">
                <Play className="w-4 h-4" /> {running ? 'Regression läuft sequenziell...' : 'Regression starten'}
              </button>
            </div>

            <div className="bento-card">
              <div className="card-title">STATUS</div>
              <div className="grid grid-cols-3 gap-3 mt-4">
                <Stat label="Bestanden" value={String(passed)} />
                <Stat label="Gesamt" value={String(results.length)} />
                <Stat label="Ø Score" value={results.length ? String(average) : '—'} />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {!results.length ? (
              <div className="bento-card min-h-[500px] grid place-items-center text-center">
                <div>
                  <FlaskConical className="w-12 h-12 mx-auto text-primary mb-4 opacity-70" />
                  <h2 className="text-2xl font-black">Golden Set bereit</h2>
                  <p className="text-text-secondary mt-2 max-w-lg">Die Testfälle werden bewusst nacheinander ausgeführt. Das reduziert Last und macht die Ergebnisse auf kleineren lokalen Systemen stabiler.</p>
                </div>
              </div>
            ) : results.map((result) => (
              <article key={result.caseId} className="bento-card">
                <div className="flex items-start justify-between gap-5">
                  <div>
                    <div className="text-[10px] uppercase tracking-[0.22em] font-black text-text-secondary">{result.modelName}</div>
                    <h3 className="text-xl font-black mt-1">{result.title}</h3>
                  </div>
                  {result.passed ? <CheckCircle2 className="w-6 h-6 text-success" /> : <XCircle className="w-6 h-6 text-danger" />}
                </div>
                <div className="grid sm:grid-cols-4 gap-3 mt-5">
                  <Stat label="Score" value={String(result.score)} />
                  <Stat label="Minimum" value={String(result.minScore)} />
                  <Stat label="Latenz" value={result.latencyMs ? `${result.latencyMs} ms` : '—'} />
                  <Stat label="Tokens" value={String(result.totalTokens)} />
                </div>
                {result.error ? (
                  <div className="mt-4 p-4 rounded-xl bg-danger/5 border border-danger/20 text-danger text-sm">{result.error}</div>
                ) : (
                  <div className="mt-4 p-4 rounded-xl bg-white/5 border border-white/10 text-sm text-text-secondary">{result.recommendation}</div>
                )}
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return <div className="p-3 rounded-xl bg-white/5 border border-white/10"><div className="text-[10px] uppercase tracking-widest font-black text-text-secondary">{label}</div><div className="text-xl font-black mt-1">{value}</div></div>;
}
