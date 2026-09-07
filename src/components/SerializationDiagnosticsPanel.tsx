/**
 * DAVID — TECHNICAL EXPERIMENTAL CORE
 * Job 2: Serialization Diagnostics & Machine-String Preview Panel
 * 
 * CORE CONTRACT:
 * - Displays Human Canonical Input alongside Mutated Serialized Input.
 * - Shows escaped representation (e.g. m\u034Fand\u034Fible) to reveal invisible Unicode boundary marks.
 * - Details code point sequences, UTF-8 byte lengths, expansion ratio, and context-risk warnings.
 * - Inspects tokenization parity and multi-encoder states (or marks TOKENIZATION_UNVERIFIED on commercial APIs).
 * - Flags MUTATION_CLAMPED if safety caps were reached without truncating user semantic prompt.
 */

import React, { useState, useMemo } from 'react';
import {
  SerializedMutationResult,
  SerializationPresetId,
  TargetSpanType,
  NormalizationMode,
} from '../types/serialization';
import { SERIALIZATION_PRESETS } from '../utils/serializationPresets';
import {
  executeAsndMutation,
  executeHmcSpsMutation,
  executeDsBfahMutation,
  checkOperatorCompositionCompatibility,
} from '../operators/serializationOperators';
import {
  getBackendTechnicalCapabilities,
} from '../utils/technicalCapabilities';
import {
  inspectMultiEncoderTokenization,
  evaluateTokenizationParity,
} from '../utils/tokenizerInspection';
import {
  Terminal,
  Binary,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Info,
  Sliders,
  Eye,
  ShieldAlert,
} from 'lucide-react';

interface SerializationDiagnosticsPanelProps {
  currentPrompt: string;
  activeModelId?: string;
  onApplyMutatedPrompt?: (mutated: string) => void;
}

export const SerializationDiagnosticsPanel: React.FC<SerializationDiagnosticsPanelProps> = ({
  currentPrompt,
  activeModelId = 'gemini-3.1-flash-lite',
  onApplyMutatedPrompt,
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [selectedOperator, setSelectedOperator] = useState<'ASND' | 'HMC-SPS' | 'DS-BFAH'>('ASND');
  const [targetSpanType, setTargetSpanType] = useState<TargetSpanType>('entire_prompt');
  const [targetPhrase, setTargetPhrase] = useState<string>('');
  const [normalizationMode, setNormalizationMode] = useState<NormalizationMode>('RAW');

  // Operator specific params
  const [asndDensity, setAsndDensity] = useState<number>(0.35);
  const [asndStrategy, setAsndStrategy] = useState<string>('combining_grapheme_joiner');

  const [hmcRatio, setHmcRatio] = useState<number>(0.30);
  const [hmcScripts, setHmcScripts] = useState<'cyrillic' | 'greek' | 'cyrillic_greek'>('cyrillic_greek');

  const [dsDepth, setDsDepth] = useState<number>(15);
  const [dsPool, setDsPool] = useState<'balanced' | 'high_marks' | 'low_marks' | 'strike_overlay'>('balanced');

  const [copiedEscaped, setCopiedEscaped] = useState<boolean>(false);
  const [copiedRaw, setCopiedRaw] = useState<boolean>(false);

  // Compute active mutation result dynamically based on controls
  const mutationResult: SerializedMutationResult = useMemo(() => {
    const textToMutate = currentPrompt.trim() || 'A hyper-detailed cybernetic arachnid perched on Obsidian glass';
    const spanSelector = {
      type: targetSpanType,
      matchText: targetPhrase.trim() || undefined,
    };

    if (selectedOperator === 'ASND') {
      return executeAsndMutation(textToMutate, spanSelector, {
        mutationDensity: asndDensity,
        boundaryStrategy: asndStrategy,
        normalizationMode,
        seed: 42,
      });
    } else if (selectedOperator === 'HMC-SPS') {
      return executeHmcSpsMutation(textToMutate, spanSelector, {
        substitutionRatio: hmcRatio,
        targetScripts: hmcScripts,
        normalizationMode,
        seed: 42,
      });
    } else {
      return executeDsBfahMutation(textToMutate, spanSelector, {
        stackDepth: dsDepth,
        combiningMarkPool: dsPool,
        normalizationMode,
        seed: 42,
      });
    }
  }, [
    currentPrompt,
    selectedOperator,
    targetSpanType,
    targetPhrase,
    normalizationMode,
    asndDensity,
    asndStrategy,
    hmcRatio,
    hmcScripts,
    dsDepth,
    dsPool,
  ]);

  // Derive backend capabilities & tokenization evaluation
  const backendCaps = useMemo(() => {
    return getBackendTechnicalCapabilities(activeModelId);
  }, [activeModelId]);

  const tokenizationInspection = useMemo(() => {
    return inspectMultiEncoderTokenization(
      mutationResult.serializedExperimentalInput,
      backendCaps
    );
  }, [mutationResult.serializedExperimentalInput, backendCaps]);

  const parityCheck = useMemo(() => {
    return evaluateTokenizationParity(
      mutationResult.canonicalInput,
      mutationResult.serializedExperimentalInput,
      backendCaps
    );
  }, [mutationResult.canonicalInput, mutationResult.serializedExperimentalInput, backendCaps]);

  const copyToClipboard = (text: string, isEscaped: boolean) => {
    navigator.clipboard.writeText(text);
    if (isEscaped) {
      setCopiedEscaped(true);
      setTimeout(() => setCopiedEscaped(false), 2000);
    } else {
      setCopiedRaw(true);
      setTimeout(() => setCopiedRaw(false), 2000);
    }
  };

  const handleApplyPreset = (presetId: SerializationPresetId) => {
    const preset = SERIALIZATION_PRESETS[presetId];
    if (!preset) return;

    if (preset.operatorId.includes('asnd')) {
      setSelectedOperator('ASND');
      if (preset.defaultParameters.boundaryStrategy) {
        setAsndStrategy(preset.defaultParameters.boundaryStrategy);
      }
      if (typeof preset.defaultParameters.mutationDensity === 'number') {
        setAsndDensity(preset.defaultParameters.mutationDensity);
      }
    } else if (preset.operatorId.includes('hmc')) {
      setSelectedOperator('HMC-SPS');
      if (typeof preset.defaultParameters.substitutionRatio === 'number') {
        setHmcRatio(preset.defaultParameters.substitutionRatio);
      }
      if (preset.defaultParameters.targetScripts) {
        setHmcScripts(preset.defaultParameters.targetScripts);
      }
    } else if (preset.operatorId.includes('ds_bfah')) {
      setSelectedOperator('DS-BFAH');
      if (typeof preset.defaultParameters.stackDepth === 'number') {
        setDsDepth(preset.defaultParameters.stackDepth);
      }
      if (preset.defaultParameters.combiningMarkPool) {
        setDsPool(preset.defaultParameters.combiningMarkPool);
      }
    }
  };

  const compositionCheck = useMemo(() => {
    return checkOperatorCompositionCompatibility([selectedOperator]);
  }, [selectedOperator]);

  return (
    <div className="border border-zinc-800/80 rounded-xl bg-[#0c0e17] overflow-hidden text-zinc-200 text-xs font-mono shadow-xl transition-all">
      {/* Header Bar */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="px-4 py-2.5 bg-gradient-to-r from-zinc-900/90 via-zinc-900/70 to-[#0c0e17] flex items-center justify-between cursor-pointer select-none hover:bg-zinc-800/50 transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 rounded bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Binary className="w-3.5 h-3.5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold tracking-wider text-zinc-100 uppercase">
                Tokenizer & Serialization Lab
              </span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-400/10 border border-amber-400/30 text-amber-300">
                JOB 2 ENGINE
              </span>
              {mutationResult.diagnostics.clamped && (
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-rose-500/20 border border-rose-500/40 text-rose-300 animate-pulse">
                  MUTATION_CLAMPED
                </span>
              )}
            </div>
            <p className="text-[11px] text-zinc-400">
              Active Operator: <strong className="text-amber-300">{selectedOperator}</strong> &bull; Bytes: {mutationResult.diagnostics.mutatedByteLength}B ({mutationResult.diagnostics.expansionRatio.toFixed(1)}x) &bull; Code Points: {mutationResult.diagnostics.mutatedCodePoints}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {mutationResult.diagnostics.contextRisk === 'HIGH' && (
            <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30">
              <AlertTriangle className="w-3 h-3" /> Context Risk High
            </span>
          )}
          {mutationResult.diagnostics.contextRisk === 'CONTEXT_LIMIT_EXCEEDED' && (
            <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40">
              <AlertTriangle className="w-3 h-3" /> Context Exceeded
            </span>
          )}
          <button
            type="button"
            className="p-1 rounded text-zinc-400 hover:text-zinc-200 transition-colors"
          >
            {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Collapsible Laboratory Body */}
      {isOpen && (
        <div className="p-4 space-y-4 border-t border-zinc-800/80 bg-[#090b12]">
          {/* Quick Preset Selector */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px] text-zinc-400">
              <span className="uppercase tracking-wider font-semibold text-zinc-300 flex items-center gap-1.5">
                <Sliders className="w-3 h-3 text-amber-400" /> Serialization Presets
              </span>
              <span className="text-[10px] text-zinc-500">Auto-configures dose parameters</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {(Object.keys(SERIALIZATION_PRESETS) as SerializationPresetId[]).map((presetId) => {
                const p = SERIALIZATION_PRESETS[presetId];
                return (
                  <button
                    key={presetId}
                    type="button"
                    onClick={() => handleApplyPreset(presetId)}
                    className="px-2.5 py-1 rounded bg-zinc-800/60 hover:bg-zinc-700/70 border border-zinc-700/60 text-zinc-300 hover:text-amber-200 text-[11px] transition-all"
                    title={p.notes}
                  >
                    {p.name.replace(' Sweep', '').replace(' Verification', '')}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Operator Controls Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-3 rounded-lg bg-zinc-900/60 border border-zinc-800">
            {/* Operator Selection */}
            <div>
              <label className="block text-[11px] text-zinc-400 uppercase font-semibold mb-1">
                Technical Operator
              </label>
              <div className="flex gap-1">
                {(['ASND', 'HMC-SPS', 'DS-BFAH'] as const).map((op) => (
                  <button
                    key={op}
                    type="button"
                    onClick={() => setSelectedOperator(op)}
                    className={`flex-1 py-1 px-2 rounded text-[11px] font-bold border transition-all ${
                      selectedOperator === op
                        ? 'bg-amber-500/20 border-amber-500/50 text-amber-300 shadow-sm'
                        : 'bg-zinc-800/40 border-zinc-700/40 text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    {op}
                  </button>
                ))}
              </div>
              <div className="mt-1 text-[10px] text-zinc-500">
                {selectedOperator === 'ASND' && 'Invisible sub-word boundary sharding'}
                {selectedOperator === 'HMC-SPS' && 'Cross-script homoglyphic phase shift'}
                {selectedOperator === 'DS-BFAH' && 'Diacritic saturation (Mechanism Uncertain)'}
              </div>
            </div>

            {/* Target Span & Target Phrase */}
            <div>
              <label className="block text-[11px] text-zinc-400 uppercase font-semibold mb-1">
                Span Selector
              </label>
              <div className="flex gap-1 mb-1">
                <select
                  value={targetSpanType}
                  onChange={(e) => setTargetSpanType(e.target.value as TargetSpanType)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-zinc-200 text-[11px] focus:outline-none focus:border-amber-500"
                >
                  <option value="entire_prompt">Entire Prompt</option>
                  <option value="selected_phrase">Selected Phrase</option>
                  <option value="modifier">Modifier / Adjective</option>
                  <option value="delimiter">Delimiters & Punctuation</option>
                </select>
              </div>
              {targetSpanType !== 'entire_prompt' && (
                <input
                  type="text"
                  placeholder="Target substring (e.g. obsidian)..."
                  value={targetPhrase}
                  onChange={(e) => setTargetPhrase(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded px-2 py-0.5 text-zinc-200 text-[11px] focus:outline-none focus:border-amber-500 placeholder-zinc-600"
                />
              )}
            </div>

            {/* Dynamic Operator Parameter Sliders */}
            <div>
              {selectedOperator === 'ASND' && (
                <div className="space-y-1.5">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-zinc-400">Insertion Density:</span>
                    <span className="text-amber-300 font-bold">{asndDensity.toFixed(2)}</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={asndDensity}
                    onChange={(e) => setAsndDensity(parseFloat(e.target.value))}
                    className="w-full accent-amber-400 h-1 bg-zinc-800 rounded cursor-pointer"
                  />
                  <select
                    value={asndStrategy}
                    onChange={(e) => setAsndStrategy(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded px-2 py-0.5 text-zinc-300 text-[10px]"
                  >
                    <option value="combining_grapheme_joiner">CGJ (U+034F)</option>
                    <option value="zero_width_space">ZWSP (U+200B)</option>
                    <option value="soft_hyphen">Soft Hyphen (U+00AD)</option>
                    <option value="alternating_separators">Alternating Mix</option>
                  </select>
                </div>
              )}

              {selectedOperator === 'HMC-SPS' && (
                <div className="space-y-1.5">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-zinc-400">Homoglyph Ratio:</span>
                    <span className="text-amber-300 font-bold">{(hmcRatio * 100).toFixed(0)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={hmcRatio}
                    onChange={(e) => setHmcRatio(parseFloat(e.target.value))}
                    className="w-full accent-amber-400 h-1 bg-zinc-800 rounded cursor-pointer"
                  />
                  <select
                    value={hmcScripts}
                    onChange={(e) => setHmcScripts(e.target.value as any)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded px-2 py-0.5 text-zinc-300 text-[10px]"
                  >
                    <option value="cyrillic_greek">Cyrillic + Greek</option>
                    <option value="cyrillic">Cyrillic Only</option>
                    <option value="greek">Greek Only</option>
                  </select>
                </div>
              )}

              {selectedOperator === 'DS-BFAH' && (
                <div className="space-y-1.5">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-zinc-400">Stack Depth:</span>
                    <span className="text-amber-300 font-bold">{dsDepth} marks/char</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="60"
                    step="5"
                    value={dsDepth}
                    onChange={(e) => setDsDepth(parseInt(e.target.value, 10))}
                    className="w-full accent-amber-400 h-1 bg-zinc-800 rounded cursor-pointer"
                  />
                  <select
                    value={dsPool}
                    onChange={(e) => setDsPool(e.target.value as any)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded px-2 py-0.5 text-zinc-300 text-[10px]"
                  >
                    <option value="balanced">Balanced Diacritics</option>
                    <option value="high_marks">High Diacritics</option>
                    <option value="low_marks">Low Diacritics</option>
                    <option value="strike_overlay">Strike / Overlay</option>
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* Machine-Facing Output Preview Section */}
          <div className="space-y-3">
            {/* Escaped Representation (m\u034Fand\u034Fible view) */}
            <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] uppercase font-bold text-amber-300 flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5 text-amber-400" />
                  Human-Readable Escaped Representation
                </span>
                <button
                  type="button"
                  onClick={() => copyToClipboard(mutationResult.escapedView, true)}
                  className="flex items-center gap-1 text-[10px] text-zinc-400 hover:text-amber-300 px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 transition-colors"
                >
                  {copiedEscaped ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  {copiedEscaped ? 'Copied' : 'Copy Escaped'}
                </button>
              </div>
              <div className="p-2 rounded bg-[#07090e] border border-zinc-800/80 font-mono text-[11px] text-amber-200/90 break-all select-all leading-relaxed max-h-24 overflow-y-auto">
                {mutationResult.escapedView}
              </div>
              <p className="text-[10px] text-zinc-500 mt-1">
                Reveals non-rendering Unicode separators and combining marks (e.g. \u034F, \u200B) without modifying the raw serialized payload.
              </p>
            </div>

            {/* Mutated String & Action Bar */}
            <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] uppercase font-bold text-zinc-300 flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5 text-zinc-400" />
                  Machine-Serialized Payload (Rendered View)
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => copyToClipboard(mutationResult.serializedExperimentalInput, false)}
                    className="flex items-center gap-1 text-[10px] text-zinc-400 hover:text-zinc-200 px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 transition-colors"
                  >
                    {copiedRaw ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    {copiedRaw ? 'Copied Raw' : 'Copy Machine String'}
                  </button>
                  {onApplyMutatedPrompt && (
                    <button
                      type="button"
                      onClick={() => onApplyMutatedPrompt(mutationResult.serializedExperimentalInput)}
                      className="px-2.5 py-0.5 rounded bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-200 text-[10px] font-bold transition-all shadow-sm"
                    >
                      Use in Prompt
                    </button>
                  )}
                </div>
              </div>
              <div className="p-2 rounded bg-[#07090e] border border-zinc-800/80 font-mono text-[11px] text-zinc-200 break-all leading-relaxed max-h-20 overflow-y-auto">
                {mutationResult.serializedExperimentalInput}
              </div>
            </div>

            {/* Diagnostic Metrics Matrix */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
              <div className="p-2 rounded bg-zinc-900/60 border border-zinc-800">
                <div className="text-zinc-400 text-[10px]">Characters (JS Units)</div>
                <div className="font-bold text-zinc-200 mt-0.5">
                  {mutationResult.diagnostics.originalLength} &rarr; <span className="text-amber-300">{mutationResult.diagnostics.mutatedLength}</span>
                </div>
              </div>

              <div className="p-2 rounded bg-zinc-900/60 border border-zinc-800">
                <div className="text-zinc-400 text-[10px]">Unicode Code Points</div>
                <div className="font-bold text-zinc-200 mt-0.5">
                  {mutationResult.diagnostics.originalCodePoints} &rarr; <span className="text-amber-300">{mutationResult.diagnostics.mutatedCodePoints}</span>
                </div>
              </div>

              <div className="p-2 rounded bg-zinc-900/60 border border-zinc-800">
                <div className="text-zinc-400 text-[10px]">UTF-8 Byte Length</div>
                <div className="font-bold text-zinc-200 mt-0.5">
                  {mutationResult.diagnostics.originalByteLength}B &rarr; <span className="text-amber-300">{mutationResult.diagnostics.mutatedByteLength}B</span>
                </div>
              </div>

              <div className="p-2 rounded bg-zinc-900/60 border border-zinc-800">
                <div className="text-zinc-400 text-[10px]">Context / Expansion</div>
                <div className="font-bold text-zinc-200 mt-0.5">
                  {mutationResult.diagnostics.expansionRatio.toFixed(1)}x &bull;{' '}
                  <span className={mutationResult.diagnostics.contextRisk === 'LOW' ? 'text-emerald-400' : 'text-amber-400'}>
                    {mutationResult.diagnostics.contextRisk}
                  </span>
                </div>
              </div>
            </div>

            {/* Tokenizer Parity & White-Box Inspection Box */}
            <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] uppercase font-bold text-zinc-300 flex items-center gap-1.5">
                  <ShieldAlert className="w-3.5 h-3.5 text-zinc-400" />
                  Tokenizer State & Parity Verification
                </span>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded border ${
                    parityCheck.mechanismEvidence === 'TOKENIZATION_DIVERGED'
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                      : parityCheck.mechanismEvidence === 'NO_TOKENIZATION_CHANGE'
                      ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                      : 'bg-zinc-800/40 border-zinc-700/50 text-zinc-400'
                  }`}
                >
                  {parityCheck.mechanismEvidence}
                </span>
              </div>

              {!tokenizationInspection.isInstrumented ? (
                <div className="text-[11px] text-zinc-400 space-y-1">
                  <p>
                    <strong className="text-zinc-300">Downstream Tokenization:</strong>{' '}
                    <span className="text-amber-300">TOKENIZATION_UNVERIFIED</span>. Active backend is commercial black-box [<strong>{backendCaps.displayName}</strong>].
                  </p>
                  <p className="text-[10px] text-zinc-500 italic">
                    DAVID records empirical inputs and outputs, but does not claim white-box tokenizer confirmation on closed APIs.
                  </p>
                </div>
              ) : (
                <div className="text-[11px] text-zinc-300 space-y-1.5">
                  <p className="text-zinc-400">{parityCheck.diffSummary}</p>
                  {Object.entries(tokenizationInspection.encoders).map(([encId, encRes]) => (
                    <div key={encId} className="flex items-center justify-between text-[10px] bg-zinc-900/80 px-2 py-1 rounded border border-zinc-800">
                      <span className="font-bold text-amber-300">{encId}:</span>
                      <span>{encRes.tokenCount} tokens ({encRes.pieces.length} subwords)</span>
                      <span>Truncated: {encRes.truncated ? 'YES' : 'NO'}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Warnings and Clamping Notices */}
            {mutationResult.diagnostics.warnings.length > 0 && (
              <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 space-y-1 text-[11px]">
                {mutationResult.diagnostics.warnings.map((w, idx) => (
                  <div key={idx} className="flex items-start gap-1.5">
                    <Info className="w-3.5 h-3.5 mt-0.5 shrink-0 text-amber-400" />
                    <span>{w}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
