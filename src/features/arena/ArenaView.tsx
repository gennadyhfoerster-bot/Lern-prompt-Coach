import { useMemo, useState } from 'react';
import { Activity, CheckCircle2, Cpu, Gauge, Play, Server, Timer, XCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { DEFAULT_ARENA_MODELS, MODEL_PROFILES } from '../../config/models';
import { runArenaPrompt, type ArenaResponse } from '../../services/arenaApi';

type ArenaRun = ArenaResponse & { error?: string };

export function ArenaView({ onBack }: { onBack: () => void }) {
  const [prompt, setPrompt] = useState('');
  const [selected, setSelected] = useState<string[]>(DEFAULT_ARENA_MODELS);
  const [results, setResults] = useState<ArenaRun[]>([]);
  const [running, setRunning] = useState(false);

  const selectedModels = useMemo(
    () => MODEL_PROFILES.filter((model) => selected.includes(model.id)),
    [selected],
  );

  const toggleModel = (id: string) => {
    setSelected((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    );
  };

  const runArena = async () => {
    if (!prompt.trim()) return toast.error('Gib zuerst einen Prompt ein.');
    if (selected.length === 0) return toast.error('Wähle mindestens ein Modell.');
    setRunning(true);
    setResults([]);

    const settled = await Promise.allSettled(
      selected.map((modelId) => runArenaPrompt(modelId, prompt)),
    );

    setResults(
      settled.map((entry, index) => {
        const model = MODEL_PROFILES.find((item) => item.id === selected[index])!;
        return entry.status === 'fulfilled'
          ? entry.value
          : {
              modelId: model.id,
              modelName: model.name,
              provider: model.provider,
              output: '',
              latencyMs: 0,
              usage: { inputTokens: 0, outputTokens: 0, totalTokens: 0 },
              error: entry.reason instanceof Error ? entry.reason.message : 'Unbekannter Fehler',
            };
      }),
    );
    setRunning(false);
  };

  return (
    <main className="flex-1 h-screen overflow-y-auto p-6 xl:p-8 relative z-10">
      <div className="max-w-[1700px] mx-auto space-y-6">
        <header className="bento-card border-primary/20 bg-gradient-to-br from-primary/10 to-transparent">
          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
            <div>
              <div className="card-title flex items-center gap-2"><Activity className="w-4 h-4" /> MULTI MODEL ARENA</div>
              <h1 className="text-4xl xl:text-6xl font-black tracking-[-0.05em] mt-2">Ein Prompt. Mehrere Modelle.</h1>
              <p className="text-text-secondary max-w-3xl mt-3">
                Teste denselben Prompt gegen mehrere lokale Modelle und vergleiche Ausgabe, Latenz und Tokenverbrauch.
              </p>
            </div>
            <button onClick={onBack} className="btn-secondary-dynamic self-start">← Zurück</button>
          </div>
        </header>

        <section className="grid grid-cols-1 2xl:grid-cols-[0.8fr_1.2fr] gap-6">
          <div className="space-y-5">
            <div className="bento-card">
              <div className="card-title">PROMPT</div>
              <textarea
                value={prompt}
                onChange={(event) => setPrompt(event.target.value)}
                className="mt-4 w-full min-h-52 bg-bg-elevated border border-border rounded-2xl p-5 outline-none focus:border-primary resize-y"
                placeholder="Beispiel: Erkläre mir closures in JavaScript und gib danach eine kleine Übung..."
              />
              <button onClick={runArena} disabled={running} className="btn-primary-dynamic w-full mt-4 py-4 disabled:opacity-50">
                <Play className="w-4 h-4" /> {running ? 'Arena läuft...' : 'Arena starten'}
              </button>
            </div>

            <div className="bento-card">
              <div className="card-title flex items-center gap-2"><Cpu className="w-4 h-4" /> MODELLE</div>
              <div className="space-y-3 mt-4">
                {MODEL_PROFILES.map((model) => {
                  const active = selected.includes(model.id);
                  return (
                    <button
                      key={model.id}
                      onClick={() => toggleModel(model.id)}
                      className={`w-full text-left p-4 rounded-2xl border transition-all ${active ? 'border-primary/60 bg-primary/10' : 'border-white/10 bg-white/[0.025]'}`}
                    >
                      <div className="flex justify-between items-start gap-4">
                        <div>
                          <div className="font-black">{model.name}</div>
                          <div className="text-xs text-text-secondary mt-1">{model.description}</div>
                          <div className="flex flex-wrap gap-2 mt-3">
                            {model.tags.map((tag) => <span key={tag} className="text-[10px] px-2 py-1 rounded-lg bg-white/5 border border-white/10">{tag}</span>)}
                          </div>
                        </div>
                        {active ? <CheckCircle2 className="w-5 h-5 text-primary shrink-0" /> : <div className="w-5 h-5 rounded-full border border-white/20 shrink-0" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="space-y-5">
            {results.length === 0 ? (
              <div className="bento-card min-h-[520px] grid place-items-center text-center">
                <div>
                  <Server className="w-12 h-12 mx-auto text-primary mb-4 opacity-70" />
                  <h2 className="text-2xl font-black">Noch kein Arena-Lauf</h2>
                  <p className="text-text-secondary mt-2 max-w-md">Starte links einen Prompt. Die Antworten der gewählten Modelle erscheinen hier nebeneinander.</p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
                {results.map((result) => (
                  <article key={result.modelId} className="bento-card min-h-[330px]">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="text-[10px] uppercase tracking-[0.22em] font-black text-text-secondary">{result.provider}</div>
                        <h2 className="text-2xl font-black mt-1">{result.modelName}</h2>
                      </div>
                      {result.error ? <XCircle className="w-5 h-5 text-danger" /> : <CheckCircle2 className="w-5 h-5 text-success" />}
                    </div>

                    {result.error ? (
                      <div className="mt-6 p-4 rounded-2xl bg-danger/5 border border-danger/20 text-sm text-danger break-words">
                        {result.error}
                      </div>
                    ) : (
                      <>
                        <div className="grid grid-cols-2 gap-3 mt-5">
                          <Metric icon={<Timer className="w-4 h-4" />} label="Latenz" value={`${result.latencyMs} ms`} />
                          <Metric icon={<Gauge className="w-4 h-4" />} label="Tokens" value={String(result.usage.totalTokens)} />
                        </div>
                        <div className="mt-5 p-4 rounded-2xl bg-black/20 border border-white/10 whitespace-pre-wrap text-sm leading-7">
                          {result.output}
                        </div>
                      </>
                    )}
                  </article>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

function Metric({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="p-3 rounded-xl bg-white/5 border border-white/10">
      <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-text-secondary">{icon}{label}</div>
      <div className="text-lg font-black mt-1">{value}</div>
    </div>
  );
}
