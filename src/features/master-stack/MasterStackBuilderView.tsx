import { useMemo, useState } from 'react';
import { Boxes, Copy, Layers3, Save, Sparkles } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { MASTER_PROMPTS } from '../prompt-studio/masterPrompts';

type SavedStack = {
  id: string;
  name: string;
  masterIds: string[];
  prompt: string;
  createdAt: string;
};

function compileStack(masterIds: string[], objective: string) {
  const masters = MASTER_PROMPTS.filter(m => masterIds.includes(m.id));
  return `# MASTER STACK

## OBJECTIVE
${objective || 'Definiere hier das gemeinsame Ziel des Master Stacks.'}

## ORCHESTRATION RULE
Die folgenden Spezialisten arbeiten als ein gemeinsames Expertensystem. Jeder prüft das Problem aus seiner Perspektive. Überschneidungen werden zusammengeführt, Widersprüche sichtbar gemacht und am Ende entsteht eine konsolidierte Antwort.

${masters.map((m, i) => `## ${i + 1}. ${m.title}
Rolle: ${m.description}
Fokus: ${m.bestFor.join(', ')}
Arbeitsstruktur: ${m.structure.join(' → ')}
Leitauftrag: ${m.starter}
`).join('\n')}

## SYNTHESIS
1. Analysiere das Ziel aus allen aktiven Meister-Perspektiven.
2. Zeige kritische Konflikte oder Trade-offs.
3. Führe die stärksten Beiträge zu einem gemeinsamen Lösungsweg zusammen.
4. Gib konkrete nächste Schritte, Risiken und Prüfkriterien aus.
5. Erfinde keine Fakten oder Fähigkeiten, die nicht vorhanden sind.
`;
}

export function MasterStackBuilderView({ onBack }: { onBack: () => void }) {
  const [name, setName] = useState('My Master Stack');
  const [objective, setObjective] = useState('');
  const [selected, setSelected] = useState<string[]>(['code-master', 'ux-strategist']);
  const [saved, setSaved] = useState<SavedStack[]>(() => JSON.parse(localStorage.getItem('master-stacks') || '[]'));

  const compiled = useMemo(() => compileStack(selected, objective), [selected, objective]);

  const toggle = (id: string) => setSelected(current => current.includes(id) ? current.filter(x => x !== id) : [...current, id]);

  const save = () => {
    if (!selected.length) return toast.error('Wähle mindestens einen Meister.');
    const entry: SavedStack = { id: crypto.randomUUID(), name, masterIds: selected, prompt: compiled, createdAt: new Date().toISOString() };
    const next = [entry, ...saved].slice(0, 20);
    setSaved(next);
    localStorage.setItem('master-stacks', JSON.stringify(next));
    toast.success('Master Stack gespeichert');
  };

  return (
    <main className="flex-1 h-screen overflow-y-auto p-6 xl:p-8 relative z-10">
      <div className="max-w-[1700px] mx-auto space-y-6">
        <header className="bento-card border-primary/20 bg-gradient-to-br from-primary/10 via-secondary/5 to-transparent">
          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
            <div>
              <div className="card-title flex items-center gap-2"><Boxes className="w-4 h-4" /> MASTER STACK BUILDER</div>
              <h1 className="text-4xl xl:text-6xl font-black tracking-[-0.05em] mt-2">Mehrere Meister. Ein Systemprompt.</h1>
              <p className="text-text-secondary mt-3 max-w-3xl">Kombiniere spezialisierte Meister zu einem orchestrierten Prompt-System mit gemeinsamer Synthese.</p>
            </div>
            <button onClick={onBack} className="btn-secondary-dynamic self-start">← Zurück</button>
          </div>
        </header>

        <section className="grid grid-cols-1 2xl:grid-cols-[1.15fr_0.85fr] gap-6">
          <div className="space-y-5">
            <div className="bento-card">
              <div className="grid md:grid-cols-2 gap-4">
                <input value={name} onChange={e => setName(e.target.value)} className="bg-bg-elevated border border-border rounded-xl px-4 py-3 outline-none focus:border-primary" placeholder="Stack-Name" />
                <input value={objective} onChange={e => setObjective(e.target.value)} className="bg-bg-elevated border border-border rounded-xl px-4 py-3 outline-none focus:border-primary" placeholder="Gemeinsames Ziel..." />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {MASTER_PROMPTS.map(master => {
                const active = selected.includes(master.id);
                return (
                  <button key={master.id} onClick={() => toggle(master.id)} className={`text-left rounded-2xl border p-4 transition-all ${active ? 'border-primary/60 bg-primary/10' : 'border-white/10 bg-white/[0.025] hover:bg-white/[0.045]'}`}>
                    <div className="flex items-start justify-between gap-4">
                      <div className="text-2xl">{master.icon}</div>
                      <div className={`w-5 h-5 rounded-md border ${active ? 'bg-primary border-primary' : 'border-white/20'}`} />
                    </div>
                    <div className="mt-4 font-black text-lg">{master.title}</div>
                    <div className="text-xs text-text-secondary mt-1">{master.category}</div>
                    <p className="text-xs text-text-secondary mt-3 leading-relaxed">{master.description}</p>
                  </button>
                );
              })}
            </div>
          </div>

          <aside className="space-y-5 2xl:sticky 2xl:top-6 self-start">
            <div className="bento-card">
              <div className="flex items-center justify-between">
                <div>
                  <div className="card-title flex items-center gap-2"><Layers3 className="w-4 h-4" /> COMPILED STACK</div>
                  <h2 className="text-2xl font-black mt-2">{name}</h2>
                </div>
                <span className="px-3 py-1.5 rounded-full bg-primary/10 text-primary border border-primary/20 text-xs font-bold">{selected.length} Meister</span>
              </div>
              <pre className="mt-5 max-h-[540px] overflow-y-auto whitespace-pre-wrap font-mono text-xs leading-6 bg-black/25 border border-white/10 rounded-2xl p-4">{compiled}</pre>
              <div className="grid grid-cols-2 gap-3 mt-4">
                <button onClick={() => navigator.clipboard.writeText(compiled)} className="btn-secondary-dynamic"><Copy className="w-4 h-4" /> Kopieren</button>
                <button onClick={save} className="btn-primary-dynamic"><Save className="w-4 h-4" /> Speichern</button>
              </div>
            </div>

            <div className="bento-card">
              <div className="card-title flex items-center gap-2"><Sparkles className="w-4 h-4" /> GESPEICHERTE STACKS</div>
              <div className="mt-4 space-y-2">
                {saved.slice(0, 5).map(stack => (
                  <button key={stack.id} onClick={() => { setName(stack.name); setSelected(stack.masterIds); }} className="w-full text-left p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5">
                    <div className="text-xs font-bold">{stack.name}</div>
                    <div className="text-[10px] text-text-secondary mt-1">{stack.masterIds.length} Meister · {new Date(stack.createdAt).toLocaleString('de-DE')}</div>
                  </button>
                ))}
              </div>
            </div>
          </aside>
        </section>
      </div>
    </main>
  );
}
