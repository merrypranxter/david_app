import React, { useState } from 'react';
import { LiteralResult, MutationCandidate, PromptGeneration, SlopResult, SynthesisPayload, TargetEngine } from '../types';
import { EvolutionLineageView } from './EvolutionLineageView';
import { MutantFamilyView } from './MutantFamilyView';
import {
  Copy,
  Check,
  Scissors,
  Flame,
  Activity,
  Play,
  RotateCw,
  Sparkles,
  Music,
  FileText,
  Layers,
  ChevronDown,
  ShieldCheck,
  Dna,
  Cpu,
  Lock,
  Magnet,
  GitFork,
  AlertTriangle,
  Compass,
  FlaskConical,
  Bookmark,
  ThumbsUp,
} from 'lucide-react';
import {
  recordUserFeedback,
  getRun,
  addPreservedArtifact,
} from '../utils/empiricalLearningEngine';
import { UserFeedbackJudgment, ArtifactAction } from '../types/empiricalLearning';

interface DualOutputViewProps {
  data: SynthesisPayload;
  target: TargetEngine;
  modelUsed?: string;
  activeRunId?: string | null;
  onOpenExperimentMemory?: (runId?: string) => void;
  onRunSimulation: (prompt: string, mode: 'literal' | 'slop') => void;
  onOuroborosLoop: (slopPrompt: string, parentGen?: PromptGeneration) => void;
  onTranspose: () => void;
  onSelectManualSurvivor?: (candidate: MutationCandidate) => void;
}

/**
 * Strips any Suno-specific tags (like [SUNO STYLE], [SUNO LYRICS], vocoder tags,
 * song-structure markers) from output when the user is targeting Grok or other visual models.
 */
export function stripSunoArtifacts(text: string): string {
  if (!text) return '';
  return text
    // Strip Suno section headers
    .replace(/\[SUNO\s+(?:STYLE|LYRICS)\]/gi, '')
    .replace(/\[(?:STYLE|LYRICS)\s*-\s*\d+[,\d]*\s*CAP\]/gi, '')
    // Strip Suno vocoder directive tags
    .replace(/\[VOCAL_TEXTURE:[^\]]*\]/gi, '')
    .replace(/\[(?:Intro|Verse|Chorus|Bridge|Drop|Break|Solo|Outro|Choreography):[^\]]*\]/gi, '')
    // Strip empty leftover bracket pairs
    .replace(/\[\s*\]/g, '')
    // Clean up excessive blank lines
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/**
 * Strips all bracketed instruction tokens (e.g. [SUBJECT: ...], [LIGHTING: ...])
 * for users who want 100% natural language text.
 */
export function stripAllBracketTags(text: string): string {
  if (!text) return '';
  return text
    .replace(/\[[A-Z0-9_\-/\s.:]+\]/gi, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

export const DualOutputView: React.FC<DualOutputViewProps> = ({
  data,
  target,
  modelUsed,
  activeRunId,
  onOpenExperimentMemory,
  onRunSimulation,
  onOuroborosLoop,
  onTranspose,
  onSelectManualSurvivor,
}) => {
  const [copiedLiteral, setCopiedLiteral] = useState(false);
  const [copiedLiteralClean, setCopiedLiteralClean] = useState(false);
  const [copiedLiteralStyle, setCopiedLiteralStyle] = useState(false);
  const [copiedLiteralLyrics, setCopiedLiteralLyrics] = useState(false);

  const [copiedSlop, setCopiedSlop] = useState(false);
  const [copiedSlopClean, setCopiedSlopClean] = useState(false);
  const [copiedSlopStyle, setCopiedSlopStyle] = useState(false);
  const [copiedSlopLyrics, setCopiedSlopLyrics] = useState(false);

  const [copiedAll, setCopiedAll] = useState(false);
  const [quickFeedbackSelected, setQuickFeedbackSelected] = useState<string | null>(null);
  const [quickArtifactSaved, setQuickArtifactSaved] = useState(false);
  const [quickArtifactInput, setQuickArtifactInput] = useState('');
  const [showArtifactInput, setShowArtifactInput] = useState(false);

  // CRITICAL: isSuno is strictly based on the user's active target selection
  const isSuno = target === 'suno';

  const copyToClipboard = async (text: string, setter: (val: boolean) => void) => {
    try {
      await navigator.clipboard.writeText(text);
      setter(true);
      setTimeout(() => setter(false), 2000);
    } catch (e) {
      console.error('Failed to copy', e);
    }
  };

  const getCleanPrompt = (rawPrompt: string) => {
    return isSuno ? rawPrompt : stripSunoArtifacts(rawPrompt);
  };

  // Defensive fallbacks to prevent undefined evaluation crashes
  const safeLiteral: LiteralResult = data?.literal || {
    prompt: typeof (data as any)?.prompt === 'string' ? (data as any).prompt : '',
    stylePrompt: '',
    lyricsPrompt: '',
    tokenWeights: [],
    targetParameters: '',
    charCount: 0,
  };
  const safeSlop: SlopResult = data?.slop || {
    prompt: typeof (data as any)?.prompt === 'string' ? (data as any).prompt : '',
    stylePrompt: '',
    lyricsPrompt: '',
    entropyScore: 5,
    hallucinationTriggers: [],
    seededContradictions: [],
    injectedDomains: [],
    activeOperators: [],
    activeAttractors: [],
    preservedAnchors: [],
    charCount: 0,
    glitchAnchors: undefined,
    mutationSummary: undefined,
  };

  const literalPrompt = getCleanPrompt(safeLiteral.prompt || '');
  const slopPrompt = getCleanPrompt(safeSlop.prompt || '');

  const getSunoCombinedCopy = (mode: 'literal' | 'slop') => {
    const item = mode === 'literal' ? safeLiteral : safeSlop;
    return `[SUNO STYLE]\n${item.stylePrompt || item.prompt || ''}\n\n[SUNO LYRICS]\n${item.lyricsPrompt || ''}`;
  };

  const getAllCombinedCopy = () => {
    if (isSuno) {
      return (
        `### [LITERAL] - THE SCALPEL\n` +
        `[STYLE - 1,000 CAP]\n${safeLiteral.stylePrompt || safeLiteral.prompt || ''}\n\n` +
        `[LYRICS - 3,000 CAP]\n${safeLiteral.lyricsPrompt || ''}\n\n` +
        `### [SLOP] - THE DELUGE\n` +
        `[STYLE - 1,000 CAP]\n${safeSlop.stylePrompt || safeSlop.prompt || ''}\n\n` +
        `[LYRICS - 3,000 CAP]\n${safeSlop.lyricsPrompt || ''}`
      );
    }
    return `=== [LITERAL] - THE SCALPEL ===\n${literalPrompt}\n\n=== [SLOP] - THE DELUGE ===\n${slopPrompt}`;
  };

  const getCopyButtonLabel = (mode: 'literal' | 'slop') => {
    if (target === 'grok') {
      return mode === 'literal' ? 'Copy Grok Prompt' : 'Copy Grok Slop';
    }
    if (target === 'openart') {
      return mode === 'literal' ? 'Copy OpenArt Prompt' : 'Copy OpenArt Slop';
    }
    if (target === 'midjourney_flux') {
      return mode === 'literal' ? 'Copy Midjourney Prompt' : 'Copy Midjourney Slop';
    }
    return mode === 'literal' ? 'Copy Literal Prompt' : 'Copy Slop Prompt';
  };

  return (
    <div className="space-y-6">
      {/* Top Banner: Status & Global Actions */}
      <div className="bg-gradient-to-r from-zinc-900 via-[#141724] to-zinc-900 border border-zinc-800 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg">
        <div className="flex items-start gap-3">
          <Activity className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <div className="text-xs font-mono font-semibold text-zinc-300 uppercase tracking-wider flex items-center gap-2 flex-wrap">
              <span>Dual Output Synthesized</span>
              {modelUsed && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-amber-400 font-mono">
                  {modelUsed}
                </span>
              )}
              {isSuno ? (
                <span className="text-[10px] px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30 font-mono">
                  Suno Audio Dual Buffer Active
                </span>
              ) : (
                <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-mono flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-cyan-400" />
                  <span>Target: {target.toUpperCase()} (Zero Audio Tags)</span>
                </span>
              )}
            </div>
            {data.previewImpact && (
              <p className="text-xs text-zinc-400 mt-1 font-mono leading-relaxed">{data.previewImpact}</p>
            )}
          </div>
        </div>

        {/* Global Action Tools */}
        <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
          <button
            type="button"
            id="transpose-button"
            onClick={onTranspose}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-zinc-800 hover:bg-zinc-700 text-xs font-mono text-zinc-300 transition-colors border border-zinc-700"
            title="Inverts polarity between the Scalpel and Deluge"
          >
            <RotateCw className="w-3.5 h-3.5 text-amber-400" />
            <span>[[VC:TRANSPOSE]]</span>
          </button>
          <button
            type="button"
            id="copy-both-button"
            onClick={() => copyToClipboard(getAllCombinedCopy(), setCopiedAll)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-zinc-800 hover:bg-zinc-700 text-xs font-mono text-zinc-300 transition-colors border border-zinc-700"
          >
            {copiedAll ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedAll ? 'Copied Both' : 'Copy Both Prompts'}</span>
          </button>
        </div>
      </div>

      {/* Quality-Diversity Mutant Family Indicator & Inspector (Job 8) */}
      {data.mutantFamily && (
        <MutantFamilyView
          familyResult={data.mutantFamily}
          onSelectManualSurvivor={onSelectManualSurvivor}
        />
      )}

      {/* Dual Column Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ========================================================= */}
        {/* Column 1: [LITERAL] - The Scalpel                         */}
        {/* ========================================================= */}
        <div className="bg-[#11131c] border border-emerald-500/30 rounded-xl p-5 shadow-lg flex flex-col justify-between space-y-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />

          <div className="space-y-4">
            {/* Column Header */}
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <Scissors className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold font-mono text-zinc-100 flex items-center gap-2">
                    [LITERAL] <span className="text-emerald-400 font-normal text-xs">// The Scalpel</span>
                  </h3>
                  <span className="text-[10px] font-mono text-zinc-500">
                    Protocol DIRECT_INTERLINK &bull; Max Execution Fidelity
                  </span>
                </div>
              </div>

              {/* Primary Copy Button for Literal */}
              <button
                type="button"
                id="copy-literal-button"
                onClick={() =>
                  copyToClipboard(
                    isSuno ? getSunoCombinedCopy('literal') : literalPrompt,
                    setCopiedLiteral
                  )
                }
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-emerald-500/20 hover:bg-emerald-500/30 text-xs font-mono font-bold text-emerald-300 border border-emerald-500/50 shadow transition-colors"
                title="Copy clean prompt to clipboard"
              >
                {copiedLiteral ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedLiteral ? 'Copied!' : isSuno ? 'Copy Literal (Both)' : getCopyButtonLabel('literal')}</span>
              </button>
            </div>

            {/* Suno Dual Boxes OR Single Visual Prompt Box */}
            {isSuno ? (
              <div className="space-y-4">
                {/* 1. Style Box (1k Cap) */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-emerald-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                      <Music className="w-3.5 h-3.5" />
                      <span>1. Suno Style Box (1,000 Cap):</span>
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-zinc-400">
                        {safeLiteral.stylePrompt?.length || safeLiteral.prompt?.length || 0} / 1,000 chars
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          copyToClipboard(
                            safeLiteral.stylePrompt || safeLiteral.prompt || '',
                            setCopiedLiteralStyle
                          )
                        }
                        className="px-2 py-0.5 rounded bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-[10px] text-emerald-300 flex items-center gap-1"
                      >
                        {copiedLiteralStyle ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        <span>Copy Style</span>
                      </button>
                    </div>
                  </div>
                  <div className="w-full bg-[#08090e] border border-zinc-800 rounded-lg p-3.5 text-xs font-mono text-emerald-300/90 whitespace-pre-wrap leading-relaxed select-all max-h-56 overflow-y-auto">
                    {safeLiteral.stylePrompt || safeLiteral.prompt}
                  </div>
                </div>

                {/* 2. Lyrics Box (3k Cap) */}
                {safeLiteral.lyricsPrompt && (
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="text-emerald-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5" />
                        <span>2. Lyrics &amp; Directives (3,000 Cap):</span>
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-zinc-400">
                          {safeLiteral.lyricsPrompt.length} / 3,000 chars
                        </span>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(safeLiteral.lyricsPrompt!, setCopiedLiteralLyrics)}
                          className="px-2 py-0.5 rounded bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-[10px] text-emerald-300 flex items-center gap-1"
                        >
                          {copiedLiteralLyrics ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                          <span>Copy Lyrics</span>
                        </button>
                      </div>
                    </div>
                    <div className="w-full bg-[#08090e] border border-zinc-800 rounded-lg p-3.5 text-xs font-mono text-emerald-200/90 whitespace-pre-wrap leading-relaxed select-all max-h-72 overflow-y-auto">
                      {safeLiteral.lyricsPrompt}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* NON-SUNO: Clean Single Prompt View for Grok/OpenArt/Midjourney */
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[11px] font-mono">
                  <span className="text-zinc-400 flex items-center gap-1.5">
                    <span>Prompt Content:</span>
                    <span className="text-[10px] text-emerald-400 px-1.5 py-0.2 rounded bg-emerald-500/10 border border-emerald-500/20">
                      Cleaned &bull; Zero Audio Tags
                    </span>
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-emerald-400 font-bold">
                      {literalPrompt.length} characters
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        copyToClipboard(stripAllBracketTags(literalPrompt), setCopiedLiteralClean)
                      }
                      className="text-[10px] font-mono text-zinc-400 hover:text-zinc-200 px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 transition-colors"
                      title="Copies pure prose text with all bracketed tokens [LIKE THIS] stripped"
                    >
                      {copiedLiteralClean ? 'Copied Pure' : 'Copy Pure (No Tags)'}
                    </button>
                  </div>
                </div>

                <div className="w-full bg-[#08090e] border border-emerald-500/30 rounded-lg p-4 text-xs font-mono text-emerald-200/90 whitespace-pre-wrap leading-relaxed select-all max-h-96 overflow-y-auto shadow-inner">
                  {literalPrompt}
                </div>
              </div>
            )}

            {/* Collapsible Latent Telemetry & Parameters to avoid cluttering the view */}
            {((safeLiteral.tokenWeights && safeLiteral.tokenWeights.length > 0) || safeLiteral.targetParameters) && (
              <details className="group border border-zinc-800 rounded-lg overflow-hidden bg-zinc-950/40">
                <summary className="px-3 py-2 cursor-pointer text-[11px] font-mono text-zinc-400 hover:text-zinc-200 flex items-center justify-between select-none bg-zinc-900/50 transition-colors">
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="w-3 h-3 text-emerald-400" />
                    <span>Technical Diagnostics &amp; Attention Vectors</span>
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 group-open:rotate-180 transition-transform text-zinc-500" />
                </summary>

                <div className="p-3 space-y-3 border-t border-zinc-800/80">
                  {safeLiteral.tokenWeights && safeLiteral.tokenWeights.length > 0 && (
                    <div>
                      <span className="block text-[10px] font-mono text-zinc-500 mb-1.5 uppercase tracking-wider">
                        Prioritized Attention Vectors:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {safeLiteral.tokenWeights.map((token, i) => (
                          <span
                            key={i}
                            className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950/40 text-emerald-300 border border-emerald-500/30"
                          >
                            {token}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {safeLiteral.targetParameters && (
                    <div>
                      <span className="block text-[10px] font-mono text-zinc-500 mb-1 uppercase tracking-wider">
                        Target Parameters:
                      </span>
                      <code className="text-xs font-mono text-zinc-400 bg-zinc-900 px-2 py-1 rounded border border-zinc-800 block">
                        {safeLiteral.targetParameters}
                      </code>
                    </div>
                  )}
                </div>
              </details>
            )}
          </div>

          {/* Bottom Actions for Literal */}
          <div className="pt-3 border-t border-zinc-800/80 flex items-center justify-between">
            <span className="text-[11px] font-mono text-zinc-500">The Scalpel (Mode 1)</span>
            <button
              type="button"
              id="simulate-literal-button"
              onClick={() => onRunSimulation(literalPrompt, 'literal')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-mono transition-colors cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 text-emerald-400" />
              <span>Simulate Model Response</span>
            </button>
          </div>
        </div>

        {/* ========================================================= */}
        {/* Column 2: [SLOP] - The Deluge                             */}
        {/* ========================================================= */}
        <div className="bg-[#11131c] border border-rose-500/30 rounded-xl p-5 shadow-lg flex flex-col justify-between space-y-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/5 rounded-full blur-2xl pointer-events-none" />

          <div className="space-y-4">
            {/* Column Header */}
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
                  <Flame className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold font-mono text-zinc-100 flex items-center gap-2">
                    [SLOP] <span className="text-rose-400 font-normal text-xs">// The Deluge</span>
                  </h3>
                  <span className="text-[10px] font-mono text-zinc-500">
                    Protocol SLOP_MANIFEST &bull; S{safeSlop.entropyScore || 5} Depth
                  </span>
                </div>
              </div>

              {/* Primary Copy Button for Slop */}
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40">
                  S{safeSlop.entropyScore || 5}
                </span>
                <button
                  type="button"
                  id="copy-slop-button"
                  onClick={() =>
                    copyToClipboard(
                      isSuno ? getSunoCombinedCopy('slop') : slopPrompt,
                      setCopiedSlop
                    )
                  }
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-rose-500/20 hover:bg-rose-500/30 text-xs font-mono font-bold text-rose-300 border border-rose-500/50 shadow transition-colors"
                  title="Copy high-entropy slop prompt to clipboard"
                >
                  {copiedSlop ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedSlop ? 'Copied!' : isSuno ? 'Copy Slop (Both)' : getCopyButtonLabel('slop')}</span>
                </button>
              </div>
            </div>

            {/* Suno Dual Boxes OR Single Visual Prompt Box */}
            {isSuno ? (
              <div className="space-y-4">
                {/* 1. Style Box (1k Cap) */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-rose-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                      <Music className="w-3.5 h-3.5" />
                      <span>1. Slop Style Box (1,000 Cap):</span>
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-zinc-400">
                        {safeSlop.stylePrompt?.length || safeSlop.prompt?.length || 0} / 1,000 chars
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          copyToClipboard(
                            safeSlop.stylePrompt || safeSlop.prompt || '',
                            setCopiedSlopStyle
                          )
                        }
                        className="px-2 py-0.5 rounded bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-[10px] text-rose-300 flex items-center gap-1"
                      >
                        {copiedSlopStyle ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        <span>Copy Style</span>
                      </button>
                    </div>
                  </div>
                  <div className="w-full bg-[#08090e] border border-zinc-800 rounded-lg p-3.5 text-xs font-mono text-rose-300/90 whitespace-pre-wrap leading-relaxed select-all max-h-56 overflow-y-auto">
                    {safeSlop.stylePrompt || safeSlop.prompt}
                  </div>
                </div>

                {/* 2. Lyrics Box (3k Cap) */}
                {safeSlop.lyricsPrompt && (
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="text-rose-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5" />
                        <span>2. Gibberish Lyrics &amp; Paradoxes (3,000 Cap):</span>
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-zinc-400">
                          {safeSlop.lyricsPrompt.length} / 3,000 chars
                        </span>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(safeSlop.lyricsPrompt!, setCopiedSlopLyrics)}
                          className="px-2 py-0.5 rounded bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-[10px] text-rose-300 flex items-center gap-1"
                        >
                          {copiedSlopLyrics ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                          <span>Copy Lyrics</span>
                        </button>
                      </div>
                    </div>
                    <div className="w-full bg-[#08090e] border border-zinc-800 rounded-lg p-3.5 text-xs font-mono text-rose-200/90 whitespace-pre-wrap leading-relaxed select-all max-h-72 overflow-y-auto">
                      {safeSlop.lyricsPrompt}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* NON-SUNO: Clean Single Prompt View for Grok/OpenArt/Midjourney */
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[11px] font-mono">
                  <span className="text-zinc-400 flex items-center gap-1.5">
                    <span>High-Entropy Slop Prompt:</span>
                    <span className="text-[10px] text-rose-400 px-1.5 py-0.2 rounded bg-rose-500/10 border border-rose-500/20">
                      Cleaned &bull; Zero Audio Tags
                    </span>
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-rose-400 font-bold">
                      {slopPrompt.length} characters
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        copyToClipboard(stripAllBracketTags(slopPrompt), setCopiedSlopClean)
                      }
                      className="text-[10px] font-mono text-zinc-400 hover:text-zinc-200 px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 transition-colors"
                      title="Copies pure text with all bracket tags stripped"
                    >
                      {copiedSlopClean ? 'Copied Pure' : 'Copy Pure (No Tags)'}
                    </button>
                  </div>
                </div>

                <div className="w-full bg-[#08090e] border border-rose-500/30 rounded-lg p-4 text-xs font-mono text-rose-200/90 whitespace-pre-wrap leading-relaxed select-all max-h-96 overflow-y-auto shadow-inner">
                  {slopPrompt}
                </div>
              </div>
            )}

            {/* Evolutionary Lineage / Genotype Inspector (Job 6) */}
            {data.generation && (
              <EvolutionLineageView generation={data.generation} />
            )}

            {/* Collapsible Latent Diagnostics to prevent clutter */}
            {(safeSlop.hallucinationTriggers?.length ||
              safeSlop.seededContradictions?.length ||
              safeSlop.glitchAnchors ||
              safeSlop.injectedDomains?.length ||
              safeSlop.activeOperators?.length ||
              safeSlop.activeAttractors?.length ||
              safeSlop.mutationSummary) && (
              <details className="group border border-zinc-800 rounded-lg overflow-hidden bg-zinc-950/40">
                <summary className="px-3 py-2 cursor-pointer text-[11px] font-mono text-zinc-400 hover:text-zinc-200 flex items-center justify-between select-none bg-zinc-900/50 transition-colors">
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="w-3 h-3 text-rose-400" />
                    <span>Mutation Architecture &amp; Latent Diagnostics</span>
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 group-open:rotate-180 transition-transform text-zinc-500" />
                </summary>

                <div className="p-3 space-y-3 border-t border-zinc-800/80">
                  {safeSlop.mutationSummary && (
                    <div className="bg-rose-950/20 p-2.5 rounded border border-rose-500/20 text-[11px] font-mono text-rose-300/90 leading-relaxed">
                      <span className="text-rose-400 font-bold block mb-1 uppercase tracking-wider text-[10px]">
                        Mutation Recipe Summary:
                      </span>
                      {safeSlop.mutationSummary}
                    </div>
                  )}

                  {safeSlop.activeOperators && safeSlop.activeOperators.length > 0 && (
                    <div>
                      <span className="block text-[10px] font-mono text-zinc-500 mb-1 uppercase tracking-wider">
                        Active Mutation Operators:
                      </span>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {safeSlop.activeOperators.map((op, i) => (
                          <span
                            key={i}
                            className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-900 text-rose-300 border border-rose-500/30"
                          >
                            {op.replace(/_/g, ' ').toUpperCase()}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {safeSlop.activeAttractors && safeSlop.activeAttractors.length > 0 && (
                    <div>
                      <span className="block text-[10px] font-mono text-zinc-500 mb-1 uppercase tracking-wider">
                        Latent Fauna Attractors:
                      </span>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {safeSlop.activeAttractors.map((at, i) => (
                          <span
                            key={i}
                            className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-900 text-amber-300 border border-amber-500/30"
                          >
                            {at.toUpperCase()}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {safeSlop.preservedAnchors && safeSlop.preservedAnchors.length > 0 && (
                    <div>
                      <span className="block text-[10px] font-mono text-emerald-500 mb-1 uppercase tracking-wider">
                        Preserved Invariant Anchors:
                      </span>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {safeSlop.preservedAnchors.map((anchor, i) => (
                          <span
                            key={i}
                            className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950/40 text-emerald-300 border border-emerald-500/30"
                          >
                            {anchor}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {safeSlop.hallucinationTriggers && safeSlop.hallucinationTriggers.length > 0 && (
                    <div>
                      <span className="block text-[10px] font-mono text-zinc-500 mb-1 uppercase tracking-wider">
                        Surgical Contradictions &amp; Folds:
                      </span>
                      <ul className="space-y-1">
                        {safeSlop.hallucinationTriggers.map((trigger, i) => (
                          <li key={i} className="text-xs font-mono text-zinc-300 flex items-start gap-1.5">
                            <span className="text-rose-400 shrink-0">&bull;</span>
                            <span>{trigger}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {safeSlop.seededContradictions && safeSlop.seededContradictions.length > 0 && (
                    <div>
                      <span className="block text-[10px] font-mono text-amber-400/90 mb-1 uppercase tracking-wider">
                        Injected Paradoxes:
                      </span>
                      <ul className="space-y-1">
                        {safeSlop.seededContradictions.map((contra, i) => (
                          <li
                            key={i}
                            className="text-xs font-mono text-amber-300/90 flex items-start gap-1.5 bg-amber-950/20 px-2 py-1 rounded border border-amber-500/20"
                          >
                            <span className="text-amber-400 shrink-0">&#9889;</span>
                            <span>{contra}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {safeSlop.injectedDomains && safeSlop.injectedDomains.length > 0 && (
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] font-mono text-zinc-500 uppercase">Domains:</span>
                      {safeSlop.injectedDomains.map((domain, i) => (
                        <span
                          key={i}
                          className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700/60"
                        >
                          {domain}
                        </span>
                      ))}
                    </div>
                  )}

                  {safeSlop.glitchAnchors && (
                    <div>
                      <span className="block text-[10px] font-mono text-zinc-500 mb-1 uppercase tracking-wider">
                        Glitch Anchors:
                      </span>
                      <code className="text-xs font-mono text-rose-400/80 bg-zinc-900 px-2 py-1 rounded border border-zinc-800 block">
                        {safeSlop.glitchAnchors}
                      </code>
                    </div>
                  )}
                </div>
              </details>
            )}
          </div>

          {/* Bottom Actions for Slop */}
          <div className="pt-3 border-t border-zinc-800/80 flex items-center justify-between">
            <button
              type="button"
              id="ouroboros-button"
              onClick={() => onOuroborosLoop(slopPrompt, data.generation)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-mono transition-colors cursor-pointer"
              title="Feeds this high-entropy slop back as the seed prompt for recursive mutation"
            >
              <RotateCw className="w-3.5 h-3.5 text-rose-400" />
              <span>Ouroboros Mutate</span>
            </button>
            <button
              type="button"
              id="simulate-slop-button"
              onClick={() => onRunSimulation(slopPrompt, 'slop')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-mono transition-colors cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 text-rose-400" />
              <span>Simulate Collapse</span>
            </button>
          </div>
        </div>
      </div>

      {/* Radical Transformation Engine Verification Card (Job 1) */}
      {data.transformationVerification && (
        <div className="border border-zinc-800 rounded-xl bg-[#10121a] p-4 shadow-md font-mono text-xs space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800/80 pb-2.5">
            <div className="flex items-center gap-2">
              <ShieldCheck className={`w-4 h-4 ${data.transformationVerification.passed ? 'text-emerald-400' : 'text-amber-400'}`} />
              <span className="font-bold tracking-wider uppercase text-zinc-200">
                Radical Transformation Engine (Job 1 Audit)
              </span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                data.transformationVerification.passed
                  ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-500/40'
                  : 'bg-amber-950/60 text-amber-300 border border-amber-500/40'
              }`}>
                {data.transformationVerification.passed ? 'PASSED (90–95% SATURATED)' : 'ACTIVE MUTATION'}
              </span>
            </div>
            <div className="text-[11px] text-zinc-400 flex items-center gap-3">
              <span>Budget: <strong className="text-zinc-200">{data.transformationVerification.actualCharacters}</strong> / {data.transformationVerification.budgetMax} chars ({data.transformationVerification.budgetUtilizationPercent}%)</span>
              <span>Preserved Invariants: <strong className="text-emerald-400">{data.transformationVerification.preservedAnchorsFound.length}</strong></span>
              <span>Active Mutations: <strong className="text-rose-400">{data.transformationVerification.mutationsDetectedCount}</strong></span>
            </div>
          </div>
          <p className="text-zinc-400 leading-relaxed text-[11px]">
            {data.transformationVerification.verdictSummary}
          </p>
        </div>
      )}

      {/* Model Organism Profile Card (Job 6) */}
      {data.modelProfile && (
        <div className="border border-sky-900/40 rounded-xl bg-[#0b101b] p-4 shadow-md font-mono text-xs space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-sky-900/40 pb-2.5">
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-sky-400" />
              <span className="font-bold tracking-wider uppercase text-zinc-200">
                Model Organism Registry (Job 6): {data.modelProfile.technicalFacts.modelName} ({data.modelProfile.technicalFacts.version})
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-sky-950/60 text-sky-300 border border-sky-500/40 uppercase">
                {data.modelProfile.epistemicStatus}
              </span>
              <span className="text-[10px] text-zinc-500">
                Confidence: <strong className="text-zinc-300 uppercase">{data.modelProfile.confidence}</strong>
              </span>
            </div>
            <div className="text-[11px] text-zinc-400 flex items-center gap-2 flex-wrap">
              <span className="px-1.5 py-0.5 rounded bg-zinc-900 text-zinc-300 border border-zinc-800 text-[10px]">
                Ref Grip: <strong className="text-sky-300 uppercase">{data.modelProfile.fingerprint.referenceGrip}</strong>
              </span>
              <span className="px-1.5 py-0.5 rounded bg-zinc-900 text-zinc-300 border border-zinc-800 text-[10px]">
                Literalness: <strong className="text-sky-300 uppercase">{data.modelProfile.fingerprint.promptLiteralness}</strong>
              </span>
              <span className="px-1.5 py-0.5 rounded bg-zinc-900 text-zinc-300 border border-zinc-800 text-[10px]">
                Contradiction: <strong className="text-sky-300 uppercase">{data.modelProfile.fingerprint.contradictionTolerance}</strong>
              </span>
              <span className="px-1.5 py-0.5 rounded bg-zinc-900 text-zinc-300 border border-zinc-800 text-[10px]">
                Retention: <strong className="text-sky-300 uppercase">{data.modelProfile.fingerprint.longPromptBehavior}</strong>
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px] text-zinc-400">
            {data.modelProfile.easyOuts && data.modelProfile.easyOuts.length > 0 && (
              <div className="bg-rose-950/20 border border-rose-500/20 rounded p-2">
                <span className="text-rose-400 font-bold block mb-1">
                  Blocked Easy-Outs:
                </span>
                <span className="text-zinc-300">{data.modelProfile.easyOuts.join(', ')}</span>
              </div>
            )}
            {data.modelProfile.knownStrengths && data.modelProfile.knownStrengths.length > 0 && (
              <div className="bg-emerald-950/20 border border-emerald-500/20 rounded p-2">
                <span className="text-emerald-400 font-bold block mb-1">
                  Organism Strengths:
                </span>
                <span className="text-zinc-300">{data.modelProfile.knownStrengths.slice(0, 3).join('; ')}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Experiment Memory & Empirical Feedback Card (Job 7) */}
      <div className="border border-amber-500/30 rounded-xl bg-[#11131c] p-4 shadow-md font-mono text-xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800/80 pb-2.5">
          <div className="flex items-center gap-2">
            <FlaskConical className="w-4 h-4 text-amber-400" />
            <span className="font-bold tracking-wider uppercase text-zinc-200">
              Experiment Memory &amp; Empirical Learning (Job 7)
            </span>
            {activeRunId && (
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-300 border border-amber-500/30">
                Run ID: {activeRunId}
              </span>
            )}
            <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-950/60 text-emerald-300 border border-emerald-500/30 font-bold">
              LOGGED TO ARCHIVE
            </span>
          </div>

          <div className="flex items-center gap-2">
            {onOpenExperimentMemory && (
              <button
                type="button"
                onClick={() => onOpenExperimentMemory(activeRunId || undefined)}
                className="px-2.5 py-1 rounded-md bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-[11px] font-bold flex items-center gap-1.5 transition-colors"
              >
                <FlaskConical className="w-3.5 h-3.5" />
                <span>Open Experiment Lab History</span>
              </button>
            )}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-zinc-300 text-[11px]">
          {/* Quick Feedback Buttons */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-zinc-500 uppercase text-[10px] font-bold mr-1">Quick Feedback:</span>
            {(['LOVE IT', 'GOOD ACCIDENT', 'KEEP THIS ERROR', 'LOST THE SUBJECT', 'TOO DESTROYED'] as UserFeedbackJudgment[]).map((fb) => (
              <button
                key={fb}
                type="button"
                onClick={() => {
                  if (activeRunId) {
                    recordUserFeedback(activeRunId, fb);
                    setQuickFeedbackSelected(fb);
                  }
                }}
                className={`px-2 py-1 rounded text-[10px] font-bold uppercase transition-colors border ${
                  quickFeedbackSelected === fb
                    ? 'bg-amber-500 text-black border-amber-400'
                    : 'bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 border-zinc-700'
                }`}
              >
                {fb}
              </button>
            ))}
          </div>

          {/* Quick Preserve Artifact Action */}
          <div className="flex items-center gap-2">
            {!showArtifactInput ? (
              <button
                type="button"
                onClick={() => setShowArtifactInput(true)}
                className="px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-amber-300 border border-amber-500/30 text-[10px] font-bold flex items-center gap-1"
              >
                <Bookmark className="w-3 h-3 text-amber-400" />
                <span>Preserve Artifact</span>
              </button>
            ) : (
              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  value={quickArtifactInput}
                  onChange={(e) => setQuickArtifactInput(e.target.value)}
                  placeholder="Artifact name (e.g. skin delamination)..."
                  className="bg-black/60 border border-zinc-700 rounded px-2 py-0.5 text-[10px] text-zinc-200"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (activeRunId && quickArtifactInput.trim()) {
                      addPreservedArtifact(activeRunId, {
                        name: quickArtifactInput.trim(),
                        action: 'PRESERVE',
                      });
                      setQuickArtifactSaved(true);
                      setShowArtifactInput(false);
                      setQuickArtifactInput('');
                      setTimeout(() => setQuickArtifactSaved(false), 3000);
                    }
                  }}
                  className="px-2 py-0.5 rounded bg-amber-500 text-black font-bold text-[10px]"
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => setShowArtifactInput(false)}
                  className="text-zinc-500 hover:text-zinc-300 text-[10px]"
                >
                  &times;
                </button>
              </div>
            )}
            {quickArtifactSaved && (
              <span className="text-emerald-400 font-bold text-[10px]">Saved to Lab!</span>
            )}
          </div>
        </div>
      </div>

      {/* Collapsible David 8 Architectural Logic Map & Guidance Geometry */}
      {data.logicMap && data.logicMap.length > 0 && (
        <details className="group border border-zinc-800 rounded-xl overflow-hidden bg-[#10121a] shadow-lg">
          <summary className="p-4 cursor-pointer text-xs font-bold font-mono text-zinc-300 uppercase tracking-wider flex items-center justify-between select-none hover:bg-zinc-900/40 transition-colors">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-amber-400" />
              <span>Guidance Geometry &amp; Architectural Logic Map</span>
              {data.contentDna && (
                <span className="ml-2 px-2 py-0.5 rounded-full text-[10px] font-mono font-medium tracking-normal normal-case bg-emerald-950/60 border border-emerald-700/60 text-emerald-400 flex items-center gap-1">
                  <Dna className="w-3 h-3" />
                  DNA Active
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {data.targetSummary && (
                <span className="text-[10px] font-mono text-zinc-500 hidden sm:inline">
                  {data.targetSummary}
                </span>
              )}
              <span className="text-[10px] text-zinc-500 font-normal">Click to expand/collapse</span>
              <ChevronDown className="w-4 h-4 group-open:rotate-180 transition-transform text-zinc-500" />
            </div>
          </summary>

          <div className="p-4 pt-2 border-t border-zinc-800/80 space-y-4">
            {data.contentDna && (
              <div className="flex flex-wrap items-center gap-2 p-2.5 rounded-lg bg-zinc-950/80 border border-zinc-800 text-[11px] font-mono text-zinc-400">
                <span className="text-zinc-500">CONTENT DNA:</span>
                <span className="text-sky-400 font-semibold">Seed [{data.contentDna.seedIdentity}]</span>
                <span className="text-zinc-600">•</span>
                <span className="text-emerald-400">{data.contentDna.lockedAnchors?.length || 0} Invariant Locks</span>
                <span className="text-zinc-600">•</span>
                <span className="text-purple-400">{data.contentDna.activeAttractors?.length || 0} Attractors</span>
                <span className="text-zinc-600">•</span>
                <span className="text-amber-400">{data.contentDna.activeOperators?.length || 0} Operators</span>
                <span className="text-zinc-600">•</span>
                <span className="text-rose-400">Medium: {data.contentDna.targetMedium.toUpperCase()}</span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              {data.logicMap.map((item, index) => {
                const p = (item.phase || '').toUpperCase();
                let borderCls = 'border-zinc-800/80 bg-zinc-950/60';
                let badgeCls = 'text-amber-400/90 bg-amber-950/30 border-amber-800/40';
                let IconComp = Layers;

                if (p.includes('SEED')) {
                  borderCls = 'border-sky-800/50 bg-sky-950/20';
                  badgeCls = 'text-sky-400 bg-sky-950/60 border-sky-700/50';
                  IconComp = Compass;
                } else if (p.includes('LOCK')) {
                  borderCls = 'border-emerald-800/50 bg-emerald-950/20';
                  badgeCls = 'text-emerald-400 bg-emerald-950/60 border-emerald-700/50';
                  IconComp = Lock;
                } else if (p.includes('ATTRACTOR')) {
                  borderCls = 'border-purple-800/50 bg-purple-950/20';
                  badgeCls = 'text-purple-400 bg-purple-950/60 border-purple-700/50';
                  IconComp = Magnet;
                } else if (p.includes('OPERATOR')) {
                  borderCls = 'border-amber-800/50 bg-amber-950/20';
                  badgeCls = 'text-amber-400 bg-amber-950/60 border-amber-700/50';
                  IconComp = Cpu;
                } else if (p.includes('INTERACTION') || p.includes('CHAIN')) {
                  borderCls = 'border-indigo-800/50 bg-indigo-950/20';
                  badgeCls = 'text-indigo-400 bg-indigo-950/60 border-indigo-700/50';
                  IconComp = GitFork;
                } else if (p.includes('TARGET') || p.includes('TRANSLATION')) {
                  borderCls = 'border-rose-800/50 bg-rose-950/20';
                  badgeCls = 'text-rose-400 bg-rose-950/60 border-rose-700/50';
                  IconComp = Sparkles;
                } else if (p.includes('ARTIFACT') || p.includes('PRESERVED')) {
                  borderCls = 'border-teal-800/50 bg-teal-950/20';
                  badgeCls = 'text-teal-400 bg-teal-950/60 border-teal-700/50';
                  IconComp = Layers;
                } else if (p.includes('WARN')) {
                  borderCls = 'border-orange-800/50 bg-orange-950/20';
                  badgeCls = 'text-orange-400 bg-orange-950/60 border-orange-700/50';
                  IconComp = AlertTriangle;
                }

                return (
                  <div key={index} className={`p-3 rounded-lg border ${borderCls} space-y-1.5`}>
                    <div className="flex items-center gap-1.5">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider border ${badgeCls} inline-flex items-center gap-1`}>
                        <IconComp className="w-3 h-3" />
                        {item.phase}
                      </span>
                    </div>
                    <p className="text-xs font-mono text-zinc-300/90 leading-relaxed">{item.description}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </details>
      )}
    </div>
  );
};
