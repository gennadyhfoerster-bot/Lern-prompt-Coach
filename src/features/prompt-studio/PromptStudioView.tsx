import { useMemo, useState, type ReactNode } from 'react';
import { motion } from 'motion/react';
import {
  Search,
  Sparkles,
  Copy,
  Check,
  Star,
  WandSparkles,
  SlidersHorizontal,
  Layers3,
  History,
  Play,
  ChevronRight,
  BrainCircuit,
  Save,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { getMiaResponse } from '../../lib/gemini';
import {
  CATEGORIES,
  MASTER_PROMPTS,
  PROMPT_TYPES,
  TARGET_MODELS,
  MasterPrompt,
} from './masterPrompts';

type Version = {
  id: string;
  title: string;
  prompt: string;
  createdAt: string;
};

function buildPrompt(master: MasterPrompt, idea: string, model: string, type: string, detail: string) {
  const safeIdea = idea.trim() || 'Beschreibe hier dein konkretes Ziel.';
  const detailInstruction =
    detail === 'Kompakt'
      ? 'Halte den Prompt fokussiert und knapp.'
      : detail === 'Maximal'
        ? 'Arbeite mit hoher Detailtiefe, klaren Prüfschritten, Edge Cases und Qualitätskriterien.'
        : 'Nutze eine professionelle Detailtiefe mit klaren Abschnitten und überprüfbaren Ergebnissen.';

  return `# ${master.title} — ${type} Prompt

## MISSION
${master.starter}

## ZIEL
${safeIdea}

## TARGET MODEL
${model}

## ARBEITSWEISE
${master.structure.map((item, index) => `${index + 1}. ${item}: konkretisieren und sichtbar berücksichtigen.`).join('\n')}

## QUALITÄTSSTANDARD
- Stelle fehlende Annahmen transparent dar.
- Erfinde keine Fakten, APIs oder Ergebnisse.
- Priorisiere Korrektheit, Klarheit und direkte Umsetzbarkeit.
- Liefere konkrete nächste Schritte statt allgemeiner Floskeln.
- ${detailInstruction}

## OUTPUT
Strukturiere die Antwort so, dass sie direkt weiterverwendet, geprüft und iteriert werden kann.`;
}

export function PromptStudioView({ onBack }: { onBack: () => void }) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('Alle');
  const [selectedId, setSelectedId] = useState(MASTER_PROMPTS[0].id);
  const [promptType, setPromptType] = useState('Auto');
  const [targetModel, setTargetModel] = useState('Universal');
  const [detail, setDetail] = useState('Pro');
  const [idea, setIdea] = useState('');
  const [compiledPrompt, setCompiledPrompt] = useState('');
  const [copied, setCopied] = useState(false);
  const [runOutput, setRunOutput] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('master-prompt-favorites') || '[]');
    } catch {
      return [];
    }
  });
  const [versions, setVersions] = useState<Version[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('master-prompt-versions') || '[]');
    } catch {
      return [];
    }
  });

  const selected = MASTER_PROMPTS.find((item) => item.id === selectedId) || MASTER_PROMPTS[0];

  const filtered = useMemo(() => {
    const term = query.toLowerCase().trim();
    return MASTER_PROMPTS.filter((item) => {
      const categoryMatch = category === 'Alle' || item.category === category;
      const queryMatch =
        !term ||
        item.title.toLowerCase().includes(term) ||
        item.description.toLowerCase().includes(term) ||
        item.bestFor.some((tag) => tag.toLowerCase().includes(term));
      return categoryMatch && queryMatch;
    });
  }, [query, category]);

  const handleBuild = () => {
    const next = buildPrompt(selected, idea, targetModel, promptType, detail);
    setCompiledPrompt(next);
    const version: Version = {
      id: crypto.randomUUID(),
      title: `${selected.title} · ${targetModel}`,
      prompt: next,
      createdAt: new Date().toISOString(),
    };
    const nextVersions = [version, ...versions].slice(0, 8);
    setVersions(nextVersions);
    localStorage.setItem('master-prompt-versions', JSON.stringify(nextVersions));
    toast.success('Master Prompt kompiliert');
  };

  const toggleFavorite = (id: string) => {
    const next = favorites.includes(id)
      ? favorites.filter((favorite) => favorite !== id)
      : [...favorites, id];
    setFavorites(next);
    localStorage.setItem('master-prompt-favorites', JSON.stringify(next));
  };

  const handleCopy = async () => {
    if (!compiledPrompt) return;
    await navigator.clipboard.writeText(compiledPrompt);
    setCopied(true);
    toast.success('Prompt kopiert');
    window.setTimeout(() => setCopied(false), 1500);
  };

  const handleRun = async () => {
    if (!compiledPrompt) return;
    setIsRunning(true);
    try {
      const result = await getMiaResponse(
        `Führe den folgenden Prompt als Arbeitsauftrag aus. Antworte auf Deutsch und liefere nur das Ergebnis des Auftrags:\n\n${compiledPrompt}`,
        {},
        {}
      );
      setRunOutput(result.message);
      toast.success('Prompt erfolgreich ausgeführt');
    } catch {
      toast.error('Prompt konnte nicht ausgeführt werden');
    } finally {
      setIsRunning(false);
    }
  };

  const handleSave = () => {
    if (!compiledPrompt) return;
    const saved = JSON.parse(localStorage.getItem('master-prompt-library') || '[]');
    const entry = {
      id: crypto.randomUUID(),
      masterId: selected.id,
      title: selected.title,
      model: targetModel,
      type: promptType,
      prompt: compiledPrompt,
      createdAt: new Date().toISOString(),
    };
    localStorage.setItem('master-prompt-library', JSON.stringify([entry, ...saved]));
    toast.success('In deiner Prompt Library gespeichert');
  };

  return (
    <main className="flex-1 h-screen overflow-y-auto relative z-10 p-6 xl:p-8">
      <div className="max-w-[1700px] mx-auto space-y-6">
        <header className="rounded-[30px] border border-white/10 bg-black/20 backdrop-blur-2xl overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-transparent to-secondary/10 pointer-events-none" />
          <div className="relative p-6 xl:p-8 flex flex-col xl:flex-row xl:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.28em] text-primary mb-3">
                <BrainCircuit className="w-4 h-4" /> Prompt Intelligence Workspace
              </div>
              <h1 className="text-4xl xl:text-6xl font-black tracking-[-0.05em]">
                Master Prompt <span className="gradient-text">Studio</span>
              </h1>
              <p className="mt-3 text-text-secondary max-w-3xl leading-relaxed">
                Wähle einen KI-Spezialisten, definiere Modell und Prompt-Typ und kompiliere daraus einen strukturierten,
                wiederverwendbaren Master Prompt.
              </p>
            </div>
            <button onClick={onBack} className="btn-secondary-dynamic self-start xl:self-auto">
              ← Dashboard
            </button>
          </div>
          <div className="relative border-t border-white/5 px-6 xl:px-8 py-4 flex flex-wrap gap-3 text-xs">
            <span className="px-3 py-1.5 rounded-full bg-success/10 text-success border border-success/20">● Studio online</span>
            <span className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10">{MASTER_PROMPTS.length} Meister</span>
            <span className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10">{TARGET_MODELS.length} Modellprofile</span>
            <span className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10">Lokale Versionierung</span>
          </div>
        </header>

        <section className="grid grid-cols-1 2xl:grid-cols-[1.25fr_0.75fr] gap-6">
          <div className="space-y-5">
            <div className="bento-card">
              <div className="flex flex-col lg:flex-row gap-4 lg:items-center justify-between">
                <div className="relative flex-1 max-w-xl">
                  <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary" />
                  <input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    className="w-full bg-bg-elevated border border-border rounded-2xl pl-11 pr-4 py-3 outline-none focus:border-primary"
                    placeholder="Meister, Fähigkeit oder Einsatzgebiet suchen..."
                  />
                </div>
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {CATEGORIES.map((item) => (
                    <button
                      key={item}
                      onClick={() => setCategory(item)}
                      className={`whitespace-nowrap px-3 py-2 rounded-xl text-xs font-bold border transition-all ${
                        category === item
                          ? 'bg-primary text-white border-primary'
                          : 'bg-white/5 border-white/10 text-text-secondary hover:text-text-primary'
                      }`}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {filtered.map((master, index) => {
                const active = master.id === selectedId;
                const favorite = favorites.includes(master.id);
                return (
                  <motion.button
                    key={master.id}
                    type="button"
                    onClick={() => setSelectedId(master.id)}
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.035 }}
                    className={`text-left rounded-[26px] border p-5 min-h-[230px] relative overflow-hidden group transition-all ${
                      active
                        ? 'border-primary/70 bg-primary/10 shadow-[0_0_40px_rgba(99,102,241,0.12)]'
                        : 'border-white/10 bg-white/[0.025] hover:border-white/20 hover:bg-white/[0.045]'
                    }`}
                  >
                    <div className={`absolute inset-0 bg-gradient-to-br ${master.accent} opacity-80 pointer-events-none`} />
                    <div className="relative h-full flex flex-col">
                      <div className="flex items-start justify-between">
                        <div className="w-12 h-12 rounded-2xl bg-black/20 border border-white/10 flex items-center justify-center text-2xl font-black">
                          {master.icon}
                        </div>
                        <span
                          onClick={(event) => {
                            event.stopPropagation();
                            toggleFavorite(master.id);
                          }}
                          className="p-2 rounded-xl hover:bg-white/10"
                        >
                          <Star className={`w-4 h-4 ${favorite ? 'fill-warning text-warning' : 'text-text-secondary'}`} />
                        </span>
                      </div>
                      <div className="mt-5 text-[10px] font-black tracking-[0.25em] text-text-secondary">{master.shortTitle}</div>
                      <h3 className="mt-1 text-2xl font-black tracking-tight">{master.title}</h3>
                      <p className="mt-2 text-sm text-text-secondary leading-relaxed">{master.description}</p>
                      <div className="mt-auto pt-4 flex items-center justify-between">
                        <span className="text-[10px] uppercase tracking-widest font-black text-primary">{master.category}</span>
                        <ChevronRight className={`w-4 h-4 transition-transform ${active ? 'translate-x-1 text-primary' : ''}`} />
                      </div>
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </div>

          <aside className="space-y-5 2xl:sticky 2xl:top-6 self-start">
            <div className="bento-card border-primary/25 bg-gradient-to-br from-primary/10 to-transparent">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <div className="card-title">AKTIVER MEISTER</div>
                  <h2 className="text-3xl font-black mt-2">{selected.title}</h2>
                </div>
                <div className="w-14 h-14 rounded-2xl bg-primary/15 border border-primary/25 grid place-items-center text-3xl">
                  {selected.icon}
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mb-6">
                {selected.bestFor.map((tag) => (
                  <span key={tag} className="text-[10px] font-bold px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/10">
                    {tag}
                  </span>
                ))}
              </div>

              <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary">Dein Ziel</label>
              <textarea
                value={idea}
                onChange={(event) => setIdea(event.target.value)}
                className="mt-2 w-full min-h-32 bg-bg-elevated border border-border rounded-2xl p-4 outline-none focus:border-primary resize-none"
                placeholder="Beispiel: Prüfe meine React-App, finde Architekturprobleme und erstelle einen priorisierten Refactoring-Plan..."
              />

              <div className="grid grid-cols-1 md:grid-cols-3 2xl:grid-cols-1 gap-3 mt-4">
                <SelectBox icon={<Layers3 className="w-4 h-4" />} label="Prompt-Typ" value={promptType} values={PROMPT_TYPES} onChange={setPromptType} />
                <SelectBox icon={<Sparkles className="w-4 h-4" />} label="Target Model" value={targetModel} values={TARGET_MODELS} onChange={setTargetModel} />
                <SelectBox icon={<SlidersHorizontal className="w-4 h-4" />} label="Detailgrad" value={detail} values={['Kompakt', 'Pro', 'Maximal']} onChange={setDetail} />
              </div>

              <button onClick={handleBuild} className="btn-primary-dynamic w-full mt-5 py-4">
                <WandSparkles className="w-4 h-4" /> Master Prompt kompilieren
              </button>
            </div>

            <div className="bento-card">
              <div className="card-title flex items-center gap-2"><History className="w-4 h-4" /> VERSIONEN</div>
              <div className="mt-4 space-y-2">
                {versions.length === 0 && (
                  <p className="text-sm text-text-secondary">Deine letzten kompilierten Varianten erscheinen hier.</p>
                )}
                {versions.slice(0, 4).map((version) => (
                  <button
                    key={version.id}
                    onClick={() => setCompiledPrompt(version.prompt)}
                    className="w-full text-left p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 transition-colors"
                  >
                    <div className="text-xs font-bold">{version.title}</div>
                    <div className="text-[10px] text-text-secondary mt-1">{new Date(version.createdAt).toLocaleString('de-DE')}</div>
                  </button>
                ))}
              </div>
            </div>
          </aside>
        </section>

        <section className="bento-card min-h-[360px]">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5">
            <div>
              <div className="card-title">COMPILED PROMPT</div>
              <h2 className="text-2xl font-black mt-2">Live-Ausgabe</h2>
            </div>
            <div className="flex gap-2">
              <button onClick={handleSave} disabled={!compiledPrompt} className="btn-secondary-dynamic disabled:opacity-40">
                <Save className="w-4 h-4" /> Speichern
              </button>
              <button onClick={handleCopy} disabled={!compiledPrompt} className="btn-secondary-dynamic disabled:opacity-40">
                {copied ? <Check className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4" />} Kopieren
              </button>
              <button onClick={handleRun} disabled={!compiledPrompt || isRunning} className="btn-primary-dynamic disabled:opacity-40">
                <Play className="w-4 h-4" /> {isRunning ? 'Running...' : 'Run'}
              </button>
            </div>
          </div>

          {compiledPrompt ? (
            <div className="space-y-5">
              <pre className="whitespace-pre-wrap font-mono text-sm leading-7 bg-black/25 border border-white/10 rounded-2xl p-5 overflow-x-auto">
                {compiledPrompt}
              </pre>
              {runOutput && (
                <div className="rounded-2xl border border-success/20 bg-success/5 p-5">
                  <div className="text-[10px] font-black uppercase tracking-[0.22em] text-success mb-3">RUN OUTPUT · GEMINI</div>
                  <p className="whitespace-pre-wrap text-sm leading-7">{runOutput}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="min-h-[250px] rounded-2xl border border-dashed border-white/10 grid place-items-center text-center p-8">
              <div>
                <WandSparkles className="w-10 h-10 text-primary mx-auto mb-4 opacity-70" />
                <p className="font-bold">Wähle einen Meister und beschreibe dein Ziel.</p>
                <p className="text-sm text-text-secondary mt-2">Das Studio baut daraus einen reproduzierbaren, modellbezogenen Prompt.</p>
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function SelectBox({
  icon,
  label,
  value,
  values,
  onChange,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  values: readonly string[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-text-secondary mb-2">
        {icon} {label}
      </span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full bg-bg-elevated border border-border rounded-xl px-3 py-3 outline-none focus:border-primary"
      >
        {values.map((item) => (
          <option key={item} value={item}>{item}</option>
        ))}
      </select>
    </label>
  );
}
