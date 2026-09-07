/**
 * DAVID — TECHNICAL EXPERIMENTAL CORE
 * Job 3: Context Architecture & Binding Failure Diagnostics Panel
 * 
 * Interactive inspection panel providing:
 * - Structured Semantic Units decomposition (Entity, Attribute, Material, etc.)
 * - Explicit binding graph visualization (bindsTo -> Entity)
 * - Positional layout controls (Primacy, Recency, Primacy/Recency Split, Handoff Split)
 * - Intervening distractor mass tuning (Weak Concepts, Polysemantic Terms, Unrelated Materials, etc.)
 * - Repetition geometry configurator (Contiguous, Evenly Spaced, Front/Back Loaded)
 * - Observable context stress telemetry (Word distance, Char distance, Context Stress level)
 * - Job 1 Experiment Preset launcher with run-logging capabilities.
 */

import React, { useState, useMemo } from 'react';
import {
  Layers,
  Sparkles,
  Copy,
  Check,
  Activity,
  AlertTriangle,
  Play,
  RotateCcw,
  Target,
  ArrowRight,
  GitBranch,
} from 'lucide-react';
import {
  PrimacyRecencyStrategy,
  DistractorFamily,
  RepetitionGeometryPattern,
  ContextPresetId,
} from '../types/contextBinding';
import {
  decomposePromptToSemanticUnits,
  renderContextLayout,
} from '../utils/contextEngine';
import { CONTEXT_PRESETS, buildContextExperimentFamily } from '../utils/contextPresets';
import { OPERATOR_RBC_AS, OPERATOR_AC_RP } from '../operators/contextOperators';
import { getBackendTechnicalCapabilities } from '../utils/technicalCapabilities';

interface ContextDiagnosticsPanelProps {
  currentPrompt: string;
  targetEngine?: string;
  modelId?: string;
  onApplyRenderedPrompt?: (rendered: string) => void;
}

export const ContextDiagnosticsPanel: React.FC<ContextDiagnosticsPanelProps> = ({
  currentPrompt,
  targetEngine = 'midjourney_flux',
  modelId = 'flux-dev',
  onApplyRenderedPrompt,
}) => {
  const [activeTab, setActiveTab] = useState<'LAYOUT' | 'PRESETS' | 'UNITS'>('LAYOUT');

  // Interactive controls
  const [separationStrength, setSeparationStrength] = useState<number>(0.6);
  const [distractorDensity, setDistractorDensity] = useState<number>(0.5);
  const [distractorFamily, setDistractorFamily] = useState<DistractorFamily>('WEAK_CONCEPTS');
  const [strategy, setStrategy] = useState<PrimacyRecencyStrategy>('PRIMACY_RECENCY_SPLIT');
  const [repetitionCount, setRepetitionCount] = useState<number>(1);
  const [repetitionPattern, setRepetitionPattern] = useState<RepetitionGeometryPattern>('EVENLY_SPACED');
  const [copied, setCopied] = useState<boolean>(false);

  // Preset execution feedback
  const [selectedPreset, setSelectedPreset] = useState<ContextPresetId>('RBC_DISTANCE_SWEEP');
  const [presetFeedback, setPresetFeedback] = useState<string | null>(null);

  // Derive backend capabilities
  const backendCaps = useMemo(() => {
    return getBackendTechnicalCapabilities(modelId, targetEngine as any);
  }, [modelId, targetEngine]);

  // Compute structured layout and rendered result
  const renderedResult = useMemo(() => {
    const input = currentPrompt.trim() || 'obsidian carapace beetle with crystalline mandibles';
    const units = decomposePromptToSemanticUnits(input);
    const lengthBudgetWords = Math.round(separationStrength * 40);

    return renderContextLayout(
      {
        planId: 'interactive_context_plan',
        operatorId: OPERATOR_RBC_AS.id,
        canonicalPrompt: input,
        units,
        primacyRecencyStrategy: strategy,
        distractorConfig:
          separationStrength > 0
            ? {
                family: distractorFamily,
                density: distractorDensity,
                semanticDiversity: 'moderate',
                repetition: false,
                lengthBudgetWords,
                distributionPattern: 'clustered_mid',
                seed: 1337,
              }
            : undefined,
        repetitionConfig:
          repetitionCount > 1
            ? {
                pattern: repetitionPattern,
                repetitionCount,
              }
            : undefined,
        seed: 1337,
      },
      backendCaps
    );
  }, [
    currentPrompt,
    separationStrength,
    distractorDensity,
    distractorFamily,
    strategy,
    repetitionCount,
    repetitionPattern,
    backendCaps,
  ]);

  const handleCopy = () => {
    navigator.clipboard.writeText(renderedResult.renderedMachinePrompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRunPreset = () => {
    const input = currentPrompt.trim() || 'obsidian carapace beetle with crystalline mandibles';
    const result = buildContextExperimentFamily(selectedPreset, input, modelId, 42);
    setPresetFeedback(
      `Family "${result.family.title}" generated with ${result.runs.length} runs. ${result.runsSummary}`
    );
  };

  const stressColorMap = {
    UNDERPRESSURED: 'text-zinc-400 border-zinc-700 bg-zinc-900/60',
    PRODUCTIVE_TENSION: 'text-emerald-400 border-emerald-500/40 bg-emerald-950/20',
    OVERPRESSURED: 'text-amber-400 border-amber-500/40 bg-amber-950/20',
    CONTEXT_COLLAPSE: 'text-rose-400 border-rose-500/40 bg-rose-950/30',
  };

  return (
    <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-4 my-4 font-mono text-xs text-zinc-300">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between pb-3 border-b border-zinc-800 gap-2">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-emerald-400" />
          <span className="font-semibold text-zinc-100 tracking-wider">
            CONTEXT BUDGET & BINDING FAILURE LAB
          </span>
          <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-950/70 border border-emerald-800/50 text-emerald-300">
            JOB 3 ACTIVE
          </span>
        </div>

        {/* Tab Selector */}
        <div className="flex items-center gap-1 bg-zinc-900 border border-zinc-800 p-0.5 rounded">
          <button
            onClick={() => setActiveTab('LAYOUT')}
            className={`px-2 py-1 rounded transition-colors ${
              activeTab === 'LAYOUT' ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Layout Config
          </button>
          <button
            onClick={() => setActiveTab('UNITS')}
            className={`px-2 py-1 rounded transition-colors ${
              activeTab === 'UNITS' ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Semantic Units ({renderedResult.plan.units.length})
          </button>
          <button
            onClick={() => setActiveTab('PRESETS')}
            className={`px-2 py-1 rounded transition-colors ${
              activeTab === 'PRESETS' ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Experiment Sweeps
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      {activeTab === 'LAYOUT' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          {/* Controls Column */}
          <div className="space-y-3">
            {/* Primacy / Recency Layout Strategy */}
            <div>
              <label className="block text-zinc-400 mb-1 flex items-center justify-between">
                <span>Layout Architecture</span>
                <span className="text-zinc-500 font-mono text-[10px]">{strategy}</span>
              </label>
              <select
                value={strategy}
                onChange={(e) => setStrategy(e.target.value as PrimacyRecencyStrategy)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded p-1.5 text-zinc-200 focus:border-emerald-500 outline-none"
              >
                <option value="PRIMACY_RECENCY_SPLIT">PRIMACY_RECENCY_SPLIT (Entity @ start, Modifier @ tail)</option>
                <option value="HANDOFF_SPLIT">HANDOFF_SPLIT (Primacy Anchor -&gt; Mass -&gt; Recency Modifier)</option>
                <option value="ENTITY_PRIMACY">ENTITY_PRIMACY (Subject first, modifiers follow)</option>
                <option value="MODIFIER_PRIMACY">MODIFIER_PRIMACY (Deferred entity definition)</option>
                <option value="ENTITY_RECENCY">ENTITY_RECENCY (Entity delayed until tail)</option>
              </select>
            </div>

            {/* Separation Strength (RBC-AS) */}
            <div>
              <div className="flex justify-between text-zinc-400 mb-1">
                <span>RBC-AS Separation Strength</span>
                <span className="text-emerald-400">{(separationStrength * 100).toFixed(0)}%</span>
              </div>
              <input
                type="range"
                min="0.0"
                max="1.0"
                step="0.05"
                value={separationStrength}
                onChange={(e) => setSeparationStrength(parseFloat(e.target.value))}
                className="w-full accent-emerald-500"
              />
              <div className="flex justify-between text-[10px] text-zinc-500">
                <span>0.0 (Adjacent Control)</span>
                <span>0.5 (Moderate Tension)</span>
                <span>1.0 (Cleavage Limit)</span>
              </div>
            </div>

            {/* Distractor Family & Density */}
            {separationStrength > 0 && (
              <div className="p-2.5 rounded bg-zinc-900/50 border border-zinc-800/80 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-zinc-400">Distractor Intervening Mass</span>
                  <span className="text-zinc-500 text-[10px]">{distractorFamily}</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={distractorFamily}
                    onChange={(e) => setDistractorFamily(e.target.value as DistractorFamily)}
                    className="bg-zinc-900 border border-zinc-800 rounded p-1 text-zinc-200 text-[11px]"
                  >
                    <option value="WEAK_CONCEPTS">Weak Concepts (Diffuse)</option>
                    <option value="POLYSEMANTIC_TERMS">Polysemantic Terms</option>
                    <option value="UNRELATED_MATERIALS">Unrelated Minerals</option>
                    <option value="SECONDARY_RELATIONS">Secondary Relations</option>
                    <option value="LOW_PRIORITY_STRUCTURAL">Structural Scaffolds</option>
                  </select>
                  <div className="flex items-center gap-1">
                    <span className="text-zinc-500 text-[10px]">Density:</span>
                    <input
                      type="range"
                      min="0.1"
                      max="1.0"
                      step="0.1"
                      value={distractorDensity}
                      onChange={(e) => setDistractorDensity(parseFloat(e.target.value))}
                      className="w-full accent-emerald-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Repetition Configuration (AC-RP) */}
            <div className="p-2.5 rounded bg-zinc-900/50 border border-zinc-800/80 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-zinc-400">AC-RP Redundancy Geometry</span>
                <span className="text-emerald-400">{repetitionCount}x Echoes</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-zinc-500 block mb-0.5">Echo Count (1-8)</label>
                  <input
                    type="number"
                    min="1"
                    max="8"
                    value={repetitionCount}
                    onChange={(e) => setRepetitionCount(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded p-1 text-zinc-200 text-xs"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-zinc-500 block mb-0.5">Geometry Pattern</label>
                  <select
                    value={repetitionPattern}
                    onChange={(e) => setRepetitionPattern(e.target.value as RepetitionGeometryPattern)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded p-1 text-zinc-200 text-[11px]"
                  >
                    <option value="EVENLY_SPACED">Evenly Spaced</option>
                    <option value="CONTIGUOUS">Contiguous (AAAA)</option>
                    <option value="FRONT_LOADED">Front Loaded</option>
                    <option value="BACK_LOADED">Back Loaded</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Telemetry & Output Column */}
          <div className="space-y-3">
            {/* Context Stress Metrics Banner */}
            <div className={`p-2.5 rounded border ${stressColorMap[renderedResult.metrics.contextStress]}`}>
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-semibold tracking-wider flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5" />
                  CONTEXT STRESS: {renderedResult.metrics.contextStress}
                </span>
                <span className="text-[10px] font-mono">
                  Risk: {renderedResult.metrics.estimatedRisk}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-[11px] pt-1 border-t border-zinc-800/50">
                <div>
                  <span className="text-zinc-500 block text-[9px]">INTERVENING WORDS</span>
                  <span className="font-bold text-zinc-200">
                    {renderedResult.metrics.interveningWordsCount} w
                  </span>
                </div>
                <div>
                  <span className="text-zinc-500 block text-[9px]">PHYSICAL SEPARATION</span>
                  <span className="font-bold text-zinc-200">
                    {renderedResult.metrics.separationCharDistance} chars
                  </span>
                </div>
                <div>
                  <span className="text-zinc-500 block text-[9px]">TOTAL WORDS</span>
                  <span className="font-bold text-zinc-200">
                    {renderedResult.metrics.totalWordCount} w ({renderedResult.metrics.totalByteCount} B)
                  </span>
                </div>
              </div>

              {/* Instrumented Tier readout if available */}
              {renderedResult.metrics.instrumentedMetrics && (
                <div className="mt-2 pt-1.5 border-t border-zinc-800/40 text-[10px] text-zinc-400 flex justify-between">
                  <span>
                    Tokens Est: {renderedResult.metrics.instrumentedMetrics.tokenCount} / 77
                  </span>
                  <span>
                    Context Budget: {(renderedResult.metrics.instrumentedMetrics.contextFractionConsumed * 100).toFixed(0)}%
                  </span>
                </div>
              )}
            </div>

            {/* Warnings if present */}
            {renderedResult.warnings.length > 0 && (
              <div className="p-2 rounded bg-amber-950/30 border border-amber-800/60 text-amber-300 text-[10px] space-y-1">
                {renderedResult.warnings.map((w, idx) => (
                  <div key={idx} className="flex items-start gap-1">
                    <AlertTriangle className="w-3 h-3 text-amber-400 shrink-0 mt-0.5" />
                    <span>{w}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Final Rendered Machine Prompt */}
            <div>
              <div className="flex justify-between items-center text-zinc-400 mb-1">
                <span>Rendered Machine-Facing Sequence</span>
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1 text-[10px] text-zinc-400 hover:text-zinc-200 px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800"
                >
                  {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  {copied ? 'Copied' : 'Copy'}
                </button>
              </div>
              <div className="p-2.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-200 font-mono text-[11px] leading-relaxed max-h-36 overflow-y-auto select-all">
                {renderedResult.renderedMachinePrompt}
              </div>

              {onApplyRenderedPrompt && (
                <button
                  onClick={() => onApplyRenderedPrompt(renderedResult.renderedMachinePrompt)}
                  className="mt-2 w-full flex items-center justify-center gap-1.5 py-1 px-2 rounded bg-emerald-950/80 border border-emerald-700/60 text-emerald-300 hover:bg-emerald-900/90 transition-colors text-xs"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Apply Rendered Sequence to Main Prompt
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Semantic Units Tab */}
      {activeTab === 'UNITS' && (
        <div className="mt-4 space-y-2">
          <p className="text-zinc-400 text-[11px] mb-2">
            Canonical semantic decomposition showing parsed roles, initial order, experimental order, and explicit binding relationships.
          </p>
          <div className="space-y-1.5 max-h-72 overflow-y-auto">
            {renderedResult.plan.units.map((unit, idx) => (
              <div
                key={unit.id}
                className="flex items-center justify-between p-2 rounded bg-zinc-900/70 border border-zinc-800"
              >
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded bg-zinc-800 text-zinc-400 flex items-center justify-center font-bold text-[10px]">
                    {unit.experimentalOrder}
                  </span>
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-zinc-800 text-zinc-300">
                    {unit.role}
                  </span>
                  <span className="text-zinc-200 font-medium">"{unit.semanticContent}"</span>
                </div>

                <div className="flex items-center gap-3 text-zinc-500 text-[10px]">
                  {unit.bindsTo && (
                    <span className="flex items-center gap-1 text-emerald-400/90">
                      <GitBranch className="w-3 h-3" />
                      bindsTo: {unit.bindsTo}
                    </span>
                  )}
                  <span>orig: #{unit.originalOrder}</span>
                  {unit.repetitionCount > 1 && (
                    <span className="text-amber-400">{unit.repetitionCount}x echoes</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Experiment Presets Tab */}
      {activeTab === 'PRESETS' && (
        <div className="mt-4 space-y-3">
          <p className="text-zinc-400 text-[11px]">
            Execute standardized Job 1 experiment families for context separation and redundancy sweeps.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {(Object.keys(CONTEXT_PRESETS) as ContextPresetId[]).map((pid) => {
              const preset = CONTEXT_PRESETS[pid];
              const isSelected = selectedPreset === pid;
              return (
                <button
                  key={pid}
                  onClick={() => setSelectedPreset(pid)}
                  className={`text-left p-2.5 rounded border transition-colors ${
                    isSelected
                      ? 'border-emerald-500 bg-emerald-950/20 text-zinc-100'
                      : 'border-zinc-800 bg-zinc-900/50 text-zinc-400 hover:border-zinc-700'
                  }`}
                >
                  <div className="font-semibold text-xs text-zinc-200 mb-0.5">
                    {preset.name}
                  </div>
                  <div className="text-[10px] text-zinc-400">{preset.shortDescription}</div>
                  <div className="text-[9px] text-zinc-500 mt-1 font-mono">
                    Target Op: {preset.operatorId}
                  </div>
                </button>
              );
            })}
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-zinc-800">
            <span className="text-zinc-400 text-[11px]">
              Selected: <strong className="text-zinc-200">{CONTEXT_PRESETS[selectedPreset].name}</strong>
            </span>
            <button
              onClick={handleRunPreset}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-emerald-700 hover:bg-emerald-600 text-white font-medium text-xs shadow-sm transition-colors"
            >
              <Play className="w-3.5 h-3.5" />
              Log Experiment Family
            </button>
          </div>

          {presetFeedback && (
            <div className="p-2 rounded bg-zinc-900 border border-emerald-800/50 text-emerald-300 text-[11px]">
              {presetFeedback}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
