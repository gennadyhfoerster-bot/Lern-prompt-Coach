import { useMemo, useState } from 'react';
import { CopyPlus, Database, Plus, Save, Trash2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import {
  loadGoldenSets,
  saveCustomGoldenSets,
  type GoldenTestCase,
  type GoldenTestSet,
} from './qualityStore';

const emptyCase = (): GoldenTestCase => ({
  id: crypto.randomUUID(),
  title: 'Neuer Testfall',
  category: 'Coding',
  prompt: '',
  expectedSignals: [],
  minScore: 75,
});

export function GoldenSetManagerView({ onBack }: { onBack: () => void }) {
  const initial = useMemo(() => loadGoldenSets(), []);
  const builtIn = initial.filter((set) => set.builtIn);
  const [customSets, setCustomSets] = useState<GoldenTestSet[]>(initial.filter((set) => !set.builtIn));
  const [activeId, setActiveId] = useState(customSets[0]?.id || '');
  const active = customSets.find((set) => set.id === activeId);

  const persist = (sets: GoldenTestSet[]) => {
    setCustomSets(sets);
    saveCustomGoldenSets(sets);
  };

  const createSet = () => {
    const set: GoldenTestSet = {
      id: crypto.randomUUID(),
      name: 'Custom Golden Set',
      description: 'Eigene Regression-Testfälle',
      createdAt: new Date().toISOString(),
      cases: [emptyCase()],
    };
    const next = [set, ...customSets];
    persist(next);
    setActiveId(set.id);
    toast.success('Golden Set erstellt');
  };

  const duplicateBuiltIn = () => {
    const source = builtIn[0];
    if (!source) return;
    const copy: GoldenTestSet = {
      ...source,
      id: crypto.randomUUID(),
      name: `${source.name} Copy`,
      builtIn: false,
      createdAt: new Date().toISOString(),
      cases: source.cases.map((item) => ({ ...item, id: crypto.randomUUID() })),
    };
    const next = [copy, ...customSets];
    persist(next);
    setActiveId(copy.id);
    toast.success('Built-in Set dupliziert');
  };

  const updateActive = (patch: Partial<GoldenTestSet>) => {
    if (!active) return;
    persist(customSets.map((set) => set.id === active.id ? { ...set, ...patch } : set));
  };

  const updateCase = (caseId: string, patch: Partial<GoldenTestCase>) => {
    if (!active) return;
    updateActive({ cases: active.cases.map((item) => item.id === caseId ? { ...item, ...patch } : item) });
  };

  const addCase = () => {
    if (!active) return;
    updateActive({ cases: [...active.cases, emptyCase()] });
  };

  const deleteSet = () => {
    if (!active) return;
    const next = customSets.filter((set) => set.id !== active.id);
    persist(next);
    setActiveId(next[0]?.id || '');
  };

  return (
    <main className="flex-1 h-screen overflow-y-auto p-6 xl:p-8 relative z-10">
      <div className="max-w-[1650px] mx-auto space-y-6">
        <header className="bento-card border-primary/20 bg-gradient-to-br from-primary/10 to-transparent">
          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
            <div>
              <div className="card-title flex items-center gap-2"><Database className="w-4 h-4" /> GOLDEN TEST SETS</div>
              <h1 className="text-4xl xl:text-6xl font-black tracking-[-0.05em] mt-2">Deine Qualitäts-Baseline.</h1>
              <p className="text-text-secondary mt-3 max-w-3xl">Pflege feste Referenzaufgaben mit Mindestscore. Regression Runs prüfen später automatisch, ob neue Prompt- oder Modellversionen diese Baseline halten.</p>
            </div>
            <button onClick={onBack} className="btn-secondary-dynamic self-start">← Zurück</button>
          </div>
        </header>

        <section className="grid grid-cols-1 xl:grid-cols-[0.38fr_1fr] gap-6">
          <aside className="space-y-5">
            <div className="bento-card">
              <div className="grid grid-cols-2 gap-2">
                <button onClick={createSet} className="btn-primary-dynamic"><Plus className="w-4 h-4" /> Neu</button>
                <button onClick={duplicateBuiltIn} className="btn-secondary-dynamic"><CopyPlus className="w-4 h-4" /> Core kopieren</button>
              </div>
            </div>

            <div className="bento-card">
              <div className="card-title">BUILT-IN</div>
              <div className="mt-3 space-y-2">
                {builtIn.map((set) => (
                  <div key={set.id} className="p-3 rounded-xl bg-success/5 border border-success/15">
                    <div className="text-sm font-black">{set.name}</div>
                    <div className="text-[10px] text-text-secondary mt-1">{set.cases.length} Fälle · schreibgeschützt</div>
                  </div>
                ))}
              </div>
              <div className="card-title mt-6">CUSTOM</div>
              <div className="mt-3 space-y-2">
                {!customSets.length && <p className="text-xs text-text-secondary">Noch kein eigenes Set.</p>}
                {customSets.map((set) => (
                  <button key={set.id} onClick={() => setActiveId(set.id)} className={`w-full text-left p-3 rounded-xl border transition-all ${activeId === set.id ? 'bg-primary/10 border-primary/40' : 'bg-white/5 border-white/10'}`}>
                    <div className="text-sm font-black">{set.name}</div>
                    <div className="text-[10px] text-text-secondary mt-1">{set.cases.length} Testfälle</div>
                  </button>
                ))}
              </div>
            </div>
          </aside>

          <div>
            {!active ? (
              <div className="bento-card min-h-[500px] grid place-items-center text-center">
                <div><Database className="w-12 h-12 mx-auto text-primary opacity-70 mb-4" /><h2 className="text-2xl font-black">Erstelle dein erstes Golden Set</h2></div>
              </div>
            ) : (
              <div className="space-y-5">
                <div className="bento-card">
                  <div className="grid md:grid-cols-[1fr_1.5fr_auto] gap-3">
                    <input value={active.name} onChange={(e) => updateActive({ name: e.target.value })} className="bg-bg-elevated border border-border rounded-xl px-4 py-3 outline-none focus:border-primary" />
                    <input value={active.description} onChange={(e) => updateActive({ description: e.target.value })} className="bg-bg-elevated border border-border rounded-xl px-4 py-3 outline-none focus:border-primary" />
                    <button onClick={deleteSet} className="btn-secondary-dynamic text-danger"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>

                {active.cases.map((testCase, index) => (
                  <article key={testCase.id} className="bento-card">
                    <div className="flex items-center justify-between">
                      <div className="card-title">TESTFALL {index + 1}</div>
                      <button onClick={() => updateActive({ cases: active.cases.filter((item) => item.id !== testCase.id) })} className="p-2 rounded-lg hover:bg-danger/10 text-text-secondary hover:text-danger"><Trash2 className="w-4 h-4" /></button>
                    </div>
                    <div className="grid md:grid-cols-[1fr_180px_130px] gap-3 mt-4">
                      <input value={testCase.title} onChange={(e) => updateCase(testCase.id, { title: e.target.value })} className="bg-bg-elevated border border-border rounded-xl px-4 py-3 outline-none focus:border-primary" placeholder="Titel" />
                      <select value={testCase.category} onChange={(e) => updateCase(testCase.id, { category: e.target.value as GoldenTestCase['category'] })} className="bg-bg-elevated border border-border rounded-xl px-3 py-3 outline-none focus:border-primary">
                        {['Coding','Reasoning','Writing','Research','Learning','Agent'].map((item) => <option key={item}>{item}</option>)}
                      </select>
                      <input type="number" min={0} max={100} value={testCase.minScore} onChange={(e) => updateCase(testCase.id, { minScore: Number(e.target.value) })} className="bg-bg-elevated border border-border rounded-xl px-3 py-3 outline-none focus:border-primary" title="Minimum Score" />
                    </div>
                    <textarea value={testCase.prompt} onChange={(e) => updateCase(testCase.id, { prompt: e.target.value })} className="mt-3 w-full min-h-36 bg-bg-elevated border border-border rounded-2xl p-4 outline-none focus:border-primary resize-y" placeholder="Test-Prompt..." />
                    <input
                      value={testCase.expectedSignals.join(', ')}
                      onChange={(e) => updateCase(testCase.id, { expectedSignals: e.target.value.split(',').map((item) => item.trim()).filter(Boolean) })}
                      className="mt-3 w-full bg-bg-elevated border border-border rounded-xl px-4 py-3 outline-none focus:border-primary"
                      placeholder="Erwartete Signale, komma-getrennt"
                    />
                  </article>
                ))}

                <button onClick={addCase} className="btn-secondary-dynamic w-full py-4"><Plus className="w-4 h-4" /> Testfall hinzufügen</button>
                <div className="flex justify-end"><span className="inline-flex items-center gap-2 text-xs text-success"><Save className="w-4 h-4" /> Änderungen werden lokal automatisch gespeichert</span></div>
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
