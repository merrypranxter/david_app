import React, { useState, useMemo } from 'react';
import {
  SLOP_METHODS_LIBRARY,
  applyDestructiveVocabBan,
} from '../data/slopMethods';
import {
  Check,
  Copy,
  Terminal,
  BookOpen,
  Sparkles,
  AlertTriangle,
  Flame,
  CheckCircle2,
  Cpu,
  Layers,
  ArrowRight,
  ShieldAlert,
  Zap,
} from 'lucide-react';

interface SlopMethodsTabProps {
  currentConcept: string;
  onApplyConcept?: (concept: string) => void;
  entropyLevel: number;
}

export const SlopMethodsTab: React.FC<SlopMethodsTabProps> = ({
  currentConcept,
  onApplyConcept,
  entropyLevel,
}) => {
  const [subTab, setSubTab] = useState<
    'specimens' | 'predicate' | 'protocols' | 'syntax' | 'archives'
  >('specimens');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Structural Test interactive checker state
  const [testText, setTestText] = useState<string>(currentConcept || '');

  // Copy helper
  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Heuristic analysis of test text for banned words
  const bannedVerbsFound = useMemo(() => {
    const banned = [
      'dissolve',
      'melt',
      'morph',
      'transform',
      'break apart',
      'shatter',
      'glitchy',
      'iridescent',
      'surreal',
      'bismuth textures',
      '8k',
      'photorealistic',
    ];
    const lower = testText.toLowerCase();
    return banned.filter((word) => lower.includes(word));
  }, [testText]);

  // Scrubbed version
  const handleAutoScrub = () => {
    const scrubbed = applyDestructiveVocabBan(testText);
    setTestText(scrubbed);
  };

  // Protocols extraction
  const wCoeffProtocol = useMemo(
    () => SLOP_METHODS_LIBRARY.protocols.find((p) => p.id === 'w_coeff'),
    []
  );
  const antiClicheProtocol = useMemo(
    () => SLOP_METHODS_LIBRARY.protocols.find((p) => p.id === 'anticliche_scrub'),
    []
  );
  const residueProtocol = useMemo(
    () => SLOP_METHODS_LIBRARY.protocols.find((p) => p.id === 'recursion'),
    []
  );
  const baseRotationProtocol = useMemo(
    () => SLOP_METHODS_LIBRARY.protocols.find((p) => p.id === 'base_rotation'),
    []
  );
  const familyResemblanceProtocol = useMemo(
    () => SLOP_METHODS_LIBRARY.protocols.find((p) => p.id === 'family_resemblance'),
    []
  );

  // Syntax Injection formats
  const syntaxOp = useMemo(
    () => SLOP_METHODS_LIBRARY.operators.find((o) => o.id === 'syntax_injection'),
    []
  );
  const syntaxFormats = syntaxOp?.formats || {};

  // Calibration specimens
  const specimens = SLOP_METHODS_LIBRARY.mechanism_bank.calibration_specimens;

  const filteredSpecimens = useMemo(() => {
    if (!searchTerm.trim()) return specimens;
    const q = searchTerm.toLowerCase();
    return specimens.filter((s) => s.toLowerCase().includes(q));
  }, [specimens, searchTerm]);

  return (
    <div className="space-y-4">
      {/* Sub-navigation bar */}
      <div className="flex items-center justify-between border-b border-zinc-800 pb-2.5 flex-wrap gap-2">
        <div className="flex items-center gap-1 bg-zinc-900 border border-zinc-700/80 rounded-lg p-0.5 text-xs font-mono">
          <button
            type="button"
            onClick={() => setSubTab('specimens')}
            className={`px-3 py-1 rounded transition-colors flex items-center gap-1.5 ${
              subTab === 'specimens'
                ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>15 SPECIMENS</span>
          </button>

          <button
            type="button"
            onClick={() => setSubTab('predicate')}
            className={`px-3 py-1 rounded transition-colors flex items-center gap-1.5 ${
              subTab === 'predicate'
                ? 'bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
            <span>GATING PREDICATE</span>
          </button>

          <button
            type="button"
            onClick={() => setSubTab('protocols')}
            className={`px-3 py-1 rounded transition-colors flex items-center gap-1.5 ${
              subTab === 'protocols'
                ? 'bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/40'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-emerald-400" />
            <span>PROTOCOLS (W_COEFF)</span>
          </button>

          <button
            type="button"
            onClick={() => setSubTab('syntax')}
            className={`px-3 py-1 rounded transition-colors flex items-center gap-1.5 ${
              subTab === 'syntax'
                ? 'bg-purple-500/20 text-purple-300 font-bold border border-purple-500/40'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Terminal className="w-3.5 h-3.5 text-purple-400" />
            <span>SYNTAX VECTORS</span>
          </button>

          <button
            type="button"
            onClick={() => setSubTab('archives')}
            className={`px-3 py-1 rounded transition-colors flex items-center gap-1.5 ${
              subTab === 'archives'
                ? 'bg-rose-500/20 text-rose-300 font-bold border border-rose-500/40'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5 text-rose-400" />
            <span>RESEARCH ARCHIVES</span>
          </button>
        </div>

        <span className="text-[11px] font-mono text-zinc-500 hidden sm:inline">
          David 8 Slop Methods &bull; Mathematical Rigor
        </span>
      </div>

      {/* ========================================================= */}
      {/* SUBTAB 1: 15 CALIBRATION SPECIMENS                        */}
      {/* ========================================================= */}
      {subTab === 'specimens' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-2 flex-wrap text-xs font-mono">
            <span className="text-zinc-400">
              Gold-standard benchmark specimens demonstrating pure structural mutation over decorative adjectives:
            </span>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search specimens..."
              className="px-2.5 py-1 bg-zinc-900 border border-zinc-700 rounded text-xs font-mono text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-cyan-500/50"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filteredSpecimens.map((specimenText, idx) => {
              const specId = `specimen-${idx}`;
              const isCopied = copiedId === specId;
              const [title, ...descParts] = specimenText.split(': ');
              const description = descParts.join(': ');

              return (
                <div
                  key={specId}
                  className="p-3.5 rounded-xl border border-cyan-500/25 bg-[#0e141c] hover:border-cyan-500/50 transition-colors flex flex-col justify-between space-y-2.5"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span className="text-xs font-bold font-mono text-cyan-200 capitalize">
                        {title}
                      </span>
                      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800 uppercase">
                        Specimen #{idx + 1}
                      </span>
                    </div>

                    <p className="text-[11px] font-mono text-zinc-300 leading-relaxed bg-zinc-950/60 p-2.5 rounded-lg border border-zinc-800/80 select-all">
                      "{description || specimenText}"
                    </p>
                  </div>

                  <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-between gap-2">
                    <span className="text-[10px] font-mono text-zinc-500">
                      Deterministic Topology
                    </span>
                    <div className="flex items-center gap-1.5">
                      {onApplyConcept && (
                        <button
                          type="button"
                          onClick={() => onApplyConcept(specimenText)}
                          className="px-2 py-1 bg-cyan-950/80 hover:bg-cyan-900 text-cyan-300 border border-cyan-700/60 rounded text-[11px] font-mono flex items-center gap-1 transition-colors"
                          title="Apply this exact specimen into David's concept buffer"
                        >
                          <ArrowRight className="w-3 h-3" />
                          <span>Load Concept</span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleCopy(specimenText, specId)}
                        className="px-2 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded text-[11px] font-mono flex items-center gap-1 transition-colors"
                      >
                        {isCopied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        <span>{isCopied ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* SUBTAB 2: STRUCTURAL TEST GATING PREDICATE               */}
      {/* ========================================================= */}
      {subTab === 'predicate' && (
        <div className="space-y-4">
          <div className="p-3.5 rounded-xl border border-amber-500/30 bg-amber-950/15">
            <h4 className="text-xs font-bold font-mono text-amber-200 uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-amber-400" />
              The Structural Test Gating Predicate
            </h4>
            <p className="text-[11px] font-mono text-zinc-300 leading-relaxed">
              {SLOP_METHODS_LIBRARY.predicate.description}
            </p>
          </div>

          {/* 3 Core Rules Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {SLOP_METHODS_LIBRARY.predicate.tests.map((testStr, testIdx) => (
              <div
                key={testStr}
                className="p-3 rounded-lg border border-zinc-800 bg-zinc-900/60 space-y-1.5"
              >
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-bold font-mono flex items-center justify-center">
                    {testIdx + 1}
                  </span>
                  <h5 className="text-xs font-bold font-mono text-zinc-200">
                    Criterion {testIdx + 1}
                  </h5>
                </div>
                <p className="text-[11px] font-mono text-zinc-300 leading-snug">
                  "{testStr}"
                </p>
              </div>
            ))}
          </div>

          {/* Side by side Fail vs Pass */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="p-3 rounded-lg border border-rose-500/30 bg-rose-950/15 space-y-1.5">
              <div className="flex items-center gap-1.5 text-xs font-bold font-mono text-rose-300">
                <AlertTriangle className="w-4 h-4 text-rose-400" />
                <span>FAILS STRUCTURAL TEST (Adjective Soup / AI Slop)</span>
              </div>
              <p className="text-[11px] font-mono text-zinc-300 italic bg-zinc-950/70 p-2.5 rounded border border-rose-900/40">
                "{SLOP_METHODS_LIBRARY.predicate.fail_example}"
              </p>
              <p className="text-[10px] font-mono text-zinc-400">
                Why it fails: Normal human body with decorative adjective decals. Deleting "fractal" leaves an ordinary woman.
              </p>
            </div>

            <div className="p-3 rounded-lg border border-emerald-500/30 bg-emerald-950/15 space-y-1.5">
              <div className="flex items-center gap-1.5 text-xs font-bold font-mono text-emerald-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>PASSES STRUCTURAL TEST (Topological Law)</span>
              </div>
              <p className="text-[11px] font-mono text-zinc-300 italic bg-zinc-950/70 p-2.5 rounded border border-emerald-900/40">
                "{SLOP_METHODS_LIBRARY.predicate.pass_example}"
              </p>
              <p className="text-[10px] font-mono text-zinc-400">
                Why it passes: Rewrites the geometric boundary of interior and exterior. The strangeness is an inviolable rule.
              </p>
            </div>
          </div>

          {/* Interactive Tester Box */}
          <div className="p-3.5 rounded-xl border border-zinc-700 bg-zinc-900/80 space-y-3">
            <div className="flex items-center justify-between">
              <h5 className="text-xs font-bold font-mono text-zinc-200">
                Interactive Concept Structural Check
              </h5>
              <div className="flex items-center gap-2">
                {bannedVerbsFound.length > 0 && (
                  <button
                    type="button"
                    onClick={handleAutoScrub}
                    className="px-2 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded text-[10px] font-mono transition-colors"
                  >
                    Auto-Scrub Banned Verbs ({bannedVerbsFound.length})
                  </button>
                )}
                {onApplyConcept && (
                  <button
                    type="button"
                    onClick={() => onApplyConcept(testText)}
                    className="px-2.5 py-1 bg-cyan-600/30 hover:bg-cyan-600/50 text-cyan-200 border border-cyan-500/50 rounded text-[10px] font-mono transition-colors"
                  >
                    Load into Concept
                  </button>
                )}
              </div>
            </div>

            <textarea
              value={testText}
              onChange={(e) => setTestText(e.target.value)}
              rows={3}
              className="w-full bg-zinc-950 border border-zinc-700 rounded-lg p-2.5 text-xs font-mono text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-amber-500/60 leading-relaxed"
              placeholder="Enter a prompt sentence or concept to audit against structural test predicates..."
            />

            {bannedVerbsFound.length > 0 ? (
              <div className="p-2 rounded bg-rose-950/40 border border-rose-500/30 text-[11px] font-mono text-rose-300 flex items-center justify-between gap-2">
                <span>
                  Banned destructive verbs detected: <strong>{bannedVerbsFound.join(', ')}</strong>.
                  Substitute deterministic topological verbs (evert, retopologize, planar unwrap, facet).
                </span>
              </div>
            ) : (
              <div className="p-2 rounded bg-emerald-950/30 border border-emerald-500/30 text-[11px] font-mono text-emerald-300 flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>Zero banned destructive verbs found. Concept uses structural, topological, or physical constraints.</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* SUBTAB 3: PROTOCOLS & WEIRDNESS COEFFICIENT               */}
      {/* ========================================================= */}
      {subTab === 'protocols' && (
        <div className="space-y-4">
          <div className="text-xs font-mono text-zinc-400 border-b border-zinc-800 pb-2">
            <span className="text-emerald-300 font-bold uppercase tracking-wider">
              Weirdness Coefficient (w_coeff) & Protocols
            </span>
            <p className="text-[11px] text-zinc-400 mt-0.5">
              Strictly calibrates how far latent mutation wanders from standard consensus reality:
            </p>
          </div>

          {wCoeffProtocol && wCoeffProtocol.bands && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {wCoeffProtocol.bands.map((band) => (
                <div
                  key={band.label}
                  className="p-3.5 rounded-xl border border-zinc-700 bg-zinc-900/60 space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold font-mono text-emerald-300">
                      Level {band.range[0]} - {band.range[1]}
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 uppercase">
                      {band.label}
                    </span>
                  </div>
                  <div className="text-[11px] font-mono text-zinc-400">
                    Permitted Operators:
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {band.permits.map((p) => (
                      <span
                        key={p}
                        className="px-1.5 py-0.5 rounded bg-zinc-800 text-[10px] font-mono text-zinc-300"
                      >
                        {p}
                      </span>
                    ))}
                  </div>
                  {band.note && (
                    <p className="text-[10px] font-mono text-zinc-500 italic pt-1">
                      {band.note}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Operational Protocols */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
            {antiClicheProtocol && (
              <div className="p-3.5 rounded-xl border border-zinc-800 bg-zinc-900/50 space-y-1">
                <h5 className="text-xs font-bold font-mono text-emerald-300 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  {antiClicheProtocol.name}
                </h5>
                <p className="text-[11px] font-mono text-zinc-400 leading-relaxed">
                  {antiClicheProtocol.description}
                </p>
                {antiClicheProtocol.operation && (
                  <p className="text-[10px] font-mono text-emerald-400/90 italic pt-1">
                    Rule: "{antiClicheProtocol.operation}"
                  </p>
                )}
              </div>
            )}

            {residueProtocol && (
              <div className="p-3.5 rounded-xl border border-zinc-800 bg-zinc-900/50 space-y-1">
                <h5 className="text-xs font-bold font-mono text-amber-300 flex items-center gap-1.5">
                  <Flame className="w-3.5 h-3.5 text-amber-400" />
                  {residueProtocol.name}
                </h5>
                <p className="text-[11px] font-mono text-zinc-400 leading-relaxed">
                  {residueProtocol.description}
                </p>
                {residueProtocol.steps && (
                  <ul className="list-disc pl-4 text-[10px] font-mono text-zinc-400 space-y-0.5 pt-1">
                    {residueProtocol.steps.map((step, idx) => (
                      <li key={idx}>{step}</li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {baseRotationProtocol && (
              <div className="p-3.5 rounded-xl border border-zinc-800 bg-zinc-900/50 space-y-1">
                <h5 className="text-xs font-bold font-mono text-indigo-300 flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5 text-indigo-400" />
                  {baseRotationProtocol.name}
                </h5>
                <p className="text-[11px] font-mono text-zinc-400 leading-relaxed">
                  {baseRotationProtocol.description}
                </p>
                {baseRotationProtocol.bank && (
                  <div className="flex flex-wrap gap-1 pt-1">
                    {baseRotationProtocol.bank.map((b) => (
                      <span
                        key={b}
                        className="px-1.5 py-0.5 bg-zinc-800 rounded text-[9px] font-mono text-indigo-300"
                      >
                        {b}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}

            {familyResemblanceProtocol && (
              <div className="p-3.5 rounded-xl border border-zinc-800 bg-zinc-900/50 space-y-1">
                <h5 className="text-xs font-bold font-mono text-purple-300 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-purple-400" />
                  {familyResemblanceProtocol.name}
                </h5>
                <p className="text-[11px] font-mono text-zinc-400 leading-relaxed">
                  {familyResemblanceProtocol.description}
                </p>
                {familyResemblanceProtocol.operation && (
                  <p className="text-[10px] font-mono text-purple-400/90 italic pt-1">
                    Directive: "{familyResemblanceProtocol.operation}"
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* SUBTAB 4: FOREIGN SYNTAX INJECTION VECTORS                */}
      {/* ========================================================= */}
      {subTab === 'syntax' && (
        <div className="space-y-3">
          <div className="text-xs font-mono text-zinc-400 border-b border-zinc-800 pb-2">
            <span className="text-purple-300 font-bold uppercase tracking-wider">
              Structured Non-Prose Syntax Formats (Vectors A - R)
            </span>
            <p className="text-[11px] text-zinc-400 mt-0.5">
              Interleaving rigid non-linguistic syntax carries pacing and structure, forcing models away from standard prose cliché clusters:
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {Object.entries(syntaxFormats).map(([formatKey, formatData]: [string, any]) => {
              const isCopied = copiedId === `syntax-${formatKey}`;
              return (
                <div
                  key={formatKey}
                  className="p-3 rounded-xl border border-purple-500/30 bg-[#0f111a] flex flex-col justify-between space-y-2"
                >
                  <div>
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className="text-xs font-bold font-mono text-purple-200 capitalize">
                        {formatKey.replace(/_/g, ' ')}
                      </span>
                      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-purple-950 text-purple-400 border border-purple-800">
                        Vector
                      </span>
                    </div>

                    <pre className="text-[10px] font-mono text-purple-300/90 bg-zinc-950 p-2 rounded border border-zinc-800/80 overflow-x-auto whitespace-pre-wrap leading-relaxed select-all">
                      {formatData.example}
                    </pre>

                    <p className="text-[10px] font-mono text-zinc-400 mt-1.5 line-clamp-2">
                      {formatData.pacing_effect}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-end gap-1.5">
                    {onApplyConcept && (
                      <button
                        type="button"
                        onClick={() =>
                          onApplyConcept(
                            `${currentConcept}\n\n[SYNTAX_INJECTION: ${formatKey.toUpperCase()}]\n${formatData.example}`
                          )
                        }
                        className="px-2 py-0.5 bg-purple-950 hover:bg-purple-900 text-purple-300 border border-purple-800 rounded text-[10px] font-mono flex items-center gap-1 transition-colors"
                      >
                        <Zap className="w-3 h-3" />
                        <span>Inject</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleCopy(formatData.example, `syntax-${formatKey}`)}
                      className="px-2 py-0.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded text-[10px] font-mono flex items-center gap-1 transition-colors"
                    >
                      {isCopied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{isCopied ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* SUBTAB 5: RESEARCH CORPUS & UNMINED ARCHIVES              */}
      {/* ========================================================= */}
      {subTab === 'archives' && (
        <div className="space-y-4">
          <div className="text-xs font-mono text-zinc-400 border-b border-zinc-800 pb-2">
            <span className="text-rose-300 font-bold uppercase tracking-wider">
              Research Corpus & Unmined Archives
            </span>
            <p className="text-[11px] text-zinc-400 mt-0.5">
              Specific historical and scientific sub-corpora whose syntactic structure and conceptual density have not been exhausted:
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {SLOP_METHODS_LIBRARY.not_yet_mined.map((archive, idx) => (
              <div
                key={archive.id}
                className="p-3.5 rounded-xl border border-rose-500/25 bg-rose-950/15 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <h5 className="text-xs font-bold font-mono text-rose-200">
                    {idx + 1}. {archive.title}
                  </h5>
                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-rose-950 text-rose-400 border border-rose-800">
                    {archive.id}
                  </span>
                </div>
                {archive.note && (
                  <p className="text-[11px] font-mono text-zinc-300 leading-relaxed">
                    {archive.note}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
