import React from 'react';
import { Cpu, Download, Flame, Sparkles } from 'lucide-react';

interface HeaderProps {
  onOpenManifesto: () => void;
  onOpenZalgo: () => void;
  onExport: () => void;
  onOpenRecipes?: () => void;
  onOpenExperimentMemory?: () => void;
  onOpenDiscoveryLab?: () => void;
  runCount?: number;
  discoveryCount?: number;
  hasResult: boolean;
  ouroborosCount: number;
  highThinking: boolean;
  onToggleThinking: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenManifesto,
  onOpenZalgo,
  onExport,
  onOpenRecipes,
  onOpenExperimentMemory,
  onOpenDiscoveryLab,
  runCount = 0,
  discoveryCount = 0,
  hasResult,
  ouroborosCount,
  highThinking,
  onToggleThinking,
}) => {
  return (
    <header className="david-header border-b border-white/10 bg-black/90 backdrop-blur-xl sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/40 flex items-center justify-center text-amber-300 shadow-[0_0_24px_rgba(245,158,11,0.08)] shrink-0">
            <Cpu className="w-5 h-5" />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="david-display-font text-[1.08rem] sm:text-xl leading-none text-white uppercase">
                DAVID
              </h1>
              <span className="text-[11px] sm:text-xs text-amber-300 italic font-mono hidden xs:inline">
                &ldquo;May I speak to David?&rdquo;
              </span>
              <span className="inline-flex items-center gap-1.5 text-[9px] sm:text-[10px] font-mono px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/35 text-emerald-300 whitespace-nowrap">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                DAVID 8 ONLINE
              </span>
            </div>

            <div className="flex items-center gap-2 mt-1 text-[9px] sm:text-[10px] font-mono text-zinc-500 overflow-hidden whitespace-nowrap">
              <span className="hidden sm:inline">Bypassing Walter &bull; Eliciting Latent Hallucinations</span>
              {runCount > 0 && <span className="text-emerald-500/80">{runCount} experiments</span>}
              {discoveryCount > 0 && <span className="text-cyan-500/80">{discoveryCount} discoveries</span>}
              {ouroborosCount > 0 && (
                <span className="inline-flex items-center gap-1 text-orange-300/90">
                  <Flame className="w-3 h-3" /> Gen {ouroborosCount}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            id="toggle-thinking-btn"
            onClick={onToggleThinking}
            className={`inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-2 rounded-lg text-[10px] sm:text-xs font-mono transition-all border ${
              highThinking
                ? 'bg-purple-500/15 border-purple-400/45 text-purple-200 shadow-[0_0_18px_rgba(104,0,255,0.13)]'
                : 'bg-white/[0.035] border-white/10 text-zinc-400 hover:text-zinc-100'
            }`}
          >
            <Sparkles className={`w-3.5 h-3.5 ${highThinking ? 'text-purple-300' : 'text-zinc-500'}`} />
            <span className="hidden sm:inline">High Thinking</span>
            <span className={`font-bold ${highThinking ? 'text-purple-200' : 'text-zinc-500'}`}>{highThinking ? 'ON' : 'OFF'}</span>
          </button>

          <button
            type="button"
            id="export-protocol-btn"
            onClick={onExport}
            disabled={!hasResult}
            className={`inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-2 rounded-lg text-[10px] sm:text-xs font-mono border transition-colors ${
              hasResult
                ? 'bg-orange-500/12 hover:bg-orange-500/20 border-orange-500/35 text-orange-200'
                : 'bg-white/[0.025] border-white/8 text-zinc-700 cursor-not-allowed'
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden lg:inline">Export</span>
          </button>
        </div>

        {/* Programmatic action proxies used by the global DAVID workspace rail.
            Keeping these here preserves the existing App state ownership while removing
            the button pile from the visible header. */}
        {onOpenRecipes && <button id="open-recipes-btn" type="button" onClick={onOpenRecipes} className="sr-only">Open recipes</button>}
        {onOpenExperimentMemory && <button id="open-experiment-memory-btn" type="button" onClick={onOpenExperimentMemory} className="sr-only">Open experiment memory</button>}
        {onOpenDiscoveryLab && <button id="open-discovery-lab-btn" type="button" onClick={onOpenDiscoveryLab} className="sr-only">Open discovery lab</button>}
        <button id="open-zalgo-btn" type="button" onClick={onOpenZalgo} className="sr-only">Open Zalgo lab</button>
        <button id="open-manifesto-btn" type="button" onClick={onOpenManifesto} className="sr-only">Open David archives</button>
      </div>
    </header>
  );
};
