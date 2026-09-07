import React, { useState, useEffect } from 'react';
import {
  FlaskConical,
  Sparkles,
  Sliders,
  Play,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Bookmark,
  Layers,
  Tag,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Zap,
  Split,
  Eye,
  Trash2,
  ArrowRight,
  TrendingUp,
  Award,
  HelpCircle,
  Dna,
  Shuffle,
  ShieldCheck,
  Compass,
} from 'lucide-react';
import { TargetEngine } from '../types';
import {
  ExperimentRecord,
  DiscoveryVariant,
  DiscoveryRecipe,
  PromotedOperator,
  DiscoveryUserRating,
  ObservableArtifactTag,
  CreativeValueTier,
  MechanismConfidenceTier,
  ExperimentType,
  OBSERVABLE_ARTIFACT_TAGS,
} from '../types/discoveryEngine';
import {
  buildDiscoveryExperimentFamily,
  saveDiscoveryRecipe,
  loadDiscoveryRecipes,
  deleteDiscoveryRecipe,
  buildReproductionTestFamily,
  confirmReproductionResult,
  mutateDiscoveryRecipe,
  promoteDiscoveryToOperator,
  loadPromotedOperators,
  deletePromotedOperator,
  evaluateVariantResult,
  loadExperimentRecords,
  getAllAvailableOperators,
} from '../utils/discoveryEngine';

interface DiscoveryLabPanelProps {
  currentConcept: string;
  targetEngine: TargetEngine | string;
  targetMedium?: 'image' | 'video' | 'audio';
  modelProfile?: string;
  lockedAnchors?: string[];
  activeOperators?: string[];
  entropyLevel?: number;
  onApplyPromptToInput?: (prompt: string) => void;
  onApplyRecipeToState?: (recipe: DiscoveryRecipe) => void;
}

export const DiscoveryLabPanel: React.FC<DiscoveryLabPanelProps> = ({
  currentConcept,
  targetEngine,
  targetMedium = 'image',
  modelProfile = 'openart_flux',
  lockedAnchors = [],
  activeOperators = [],
  onApplyPromptToInput,
  onApplyRecipeToState,
}) => {
  // Panel expansion state
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'experiment' | 'hypothesis' | 'archive' | 'promoted'>('experiment');

  // Experiment Builder Configuration State
  const [experimentType, setExperimentType] = useState<ExperimentType>('operator_interaction');
  const [selectedOpA, setSelectedOpA] = useState<string>('scale_schism');
  const [selectedOpB, setSelectedOpB] = useState<string>('recursive_reversal');
  const [variantCount, setVariantCount] = useState<number>(4);

  // Active Experiment State
  const [currentExperiment, setCurrentExperiment] = useState<ExperimentRecord | null>(null);
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);

  // Archive & Promoted Operators
  const [savedRecipes, setSavedRecipes] = useState<Record<string, DiscoveryRecipe>>({});
  const [promotedOperators, setPromotedOperators] = useState<Record<string, PromotedOperator>>({});
  const [availableOperators, setAvailableOperators] = useState<any[]>([]);

  // UI status helpers
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [saveModalVariant, setSaveModalVariant] = useState<DiscoveryVariant | null>(null);
  const [discoveryNameInput, setDiscoveryNameInput] = useState('');

  // Refresh data on mount & tab switches
  const refreshData = () => {
    const recipes = loadDiscoveryRecipes();
    setSavedRecipes(recipes);
    const promoted = loadPromotedOperators();
    setPromotedOperators(promoted);
    setAvailableOperators(getAllAvailableOperators());

    const expRecords = loadExperimentRecords();
    const expList = Object.values(expRecords);
    if (expList.length > 0 && !currentExperiment) {
      // Load latest experiment by default
      const latest = expList.sort((a, b) => (a.timestamp < b.timestamp ? 1 : -1))[0];
      setCurrentExperiment(latest);
      setSelectedVariantId(latest.controlVariant.id);
    }
  };

  useEffect(() => {
    refreshData();
  }, []);

  // Update operator selections if parent passes active operators
  useEffect(() => {
    if (activeOperators.length > 0) {
      if (activeOperators[0]) setSelectedOpA(activeOperators[0]);
      if (activeOperators[1]) setSelectedOpB(activeOperators[1]);
    }
  }, [activeOperators]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Build a new experiment family
  const handleBuildExperiment = () => {
    const record = buildDiscoveryExperimentFamily({
      concept: currentConcept,
      targetEngine,
      targetMedium,
      modelProfile,
      activeOperators: [selectedOpA, selectedOpB],
      lockedAnchors,
      config: {
        experimentType,
        variantCount,
        operatorA: selectedOpA,
        operatorB: selectedOpB,
        includeAblation: true,
        preserveIdentityAnchor: true,
        iterationDepth: 1,
      },
    });

    setCurrentExperiment(record);
    setSelectedVariantId(record.controlVariant.id);
    setActiveTab('experiment');
    showToast(`Built experiment family: 1 Control + ${record.experimentalVariants.length} Variants`);
  };

  // Evaluate a variant
  const handleRateVariant = (
    variantId: string,
    rating: DiscoveryUserRating,
    creativeValue: CreativeValueTier = 'interesting'
  ) => {
    if (!currentExperiment) return;
    const currentVariant =
      variantId === currentExperiment.controlVariant.id
        ? currentExperiment.controlVariant
        : currentExperiment.experimentalVariants.find((v) => v.id === variantId);

    const existingTags = currentVariant?.taggedArtifacts || [];
    const updated = evaluateVariantResult({
      experimentId: currentExperiment.id,
      variantId,
      userRating: rating,
      taggedArtifacts: existingTags,
      creativeValue,
    });

    if (updated) {
      setCurrentExperiment({ ...updated });
      showToast(`Logged rating "${rating}" for ${currentVariant?.label || 'variant'}`);
    }
  };

  // Toggle artifact tag on variant
  const handleToggleArtifactTag = (variantId: string, tag: ObservableArtifactTag) => {
    if (!currentExperiment) return;
    const variant =
      variantId === currentExperiment.controlVariant.id
        ? currentExperiment.controlVariant
        : currentExperiment.experimentalVariants.find((v) => v.id === variantId);

    if (!variant) return;

    const exists = variant.taggedArtifacts.includes(tag);
    const updatedTags = exists
      ? variant.taggedArtifacts.filter((t) => t !== tag)
      : [...variant.taggedArtifacts, tag];

    const updated = evaluateVariantResult({
      experimentId: currentExperiment.id,
      variantId,
      userRating: variant.userRating || 'INTERESTING',
      taggedArtifacts: updatedTags,
    });

    if (updated) {
      setCurrentExperiment({ ...updated });
    }
  };

  // Save Discovery Recipe
  const handleSaveDiscovery = () => {
    if (!currentExperiment || !saveModalVariant) return;
    const recipe = saveDiscoveryRecipe({
      experimentId: currentExperiment.id,
      variantId: saveModalVariant.id,
      name: discoveryNameInput.trim() || undefined,
    });

    if (recipe) {
      refreshData();
      setSaveModalVariant(null);
      setDiscoveryNameInput('');
      showToast(`Saved Discovery Recipe: "${recipe.name}"`);
    }
  };

  // Run reproduction test
  const handleTestReproducibility = (recipeId: string) => {
    const reproExperiment = buildReproductionTestFamily(recipeId);
    if (reproExperiment) {
      setCurrentExperiment(reproExperiment);
      setSelectedVariantId(reproExperiment.controlVariant.id);
      setActiveTab('experiment');
      showToast(`Generated reproduction test family (3 seed perturbations + control)`);
    }
  };

  // Confirm reproduction result
  const handleConfirmReproduction = (recipeId: string, reproduced: boolean) => {
    const updated = confirmReproductionResult({ recipeId, reproduced });
    if (updated) {
      refreshData();
      showToast(
        reproduced
          ? `Reproducibility confirmed: incremented timesObserved (${updated.timesObserved}) and confidence (${updated.confidence})`
          : `Marked recipe as seed-sensitive (low confidence)`
      );
    }
  };

  // Mutate Discovery Recipe
  const handleMutateRecipe = (recipeId: string, dimension: any) => {
    const mutatedExp = mutateDiscoveryRecipe({
      recipeId,
      dimension,
      sourceConcept: currentConcept,
    });

    if (mutatedExp) {
      setCurrentExperiment(mutatedExp);
      setSelectedVariantId(mutatedExp.controlVariant.id);
      setActiveTab('experiment');
      showToast(`Generated evolutionary mutation branch (${dimension})`);
    }
  };

  // Promote Discovery to Operator
  const handlePromoteToOperator = (recipeId: string) => {
    const promoted = promoteDiscoveryToOperator(recipeId);
    if (promoted) {
      refreshData();
      showToast(`Promoted "${promoted.name}" to Reusable Operator Library!`);
    }
  };

  // Copy prompt text
  const handleCopyPrompt = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <section className="rounded-xl border border-cyan-500/30 bg-gradient-to-b from-zinc-900/90 to-zinc-950/95 shadow-xl backdrop-blur-md overflow-hidden transition-all duration-200">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 p-3.5 rounded-xl bg-cyan-950/90 border border-cyan-400 text-cyan-200 text-xs font-mono shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Bar */}
      <div
        className="p-4 bg-zinc-900/80 border-b border-zinc-800/80 flex flex-wrap items-center justify-between gap-3 cursor-pointer select-none"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm font-bold tracking-wider text-cyan-300 uppercase">
                Discovery Lab
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                Job 8 Experimental Core
              </span>
            </div>
            <p className="text-xs text-zinc-400 font-mono mt-0.5">
              Empirical hypothesis testing, controlled dose sweeps, operator interaction discovery, and procedure archiving
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-[11px] font-mono text-zinc-400 flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-zinc-800/80 border border-zinc-700/60 text-zinc-300">
              {Object.keys(savedRecipes).length} Discoveries
            </span>
            <span className="px-2 py-0.5 rounded bg-zinc-800/80 border border-zinc-700/60 text-zinc-300">
              {Object.keys(promotedOperators).length} Promoted Ops
            </span>
          </div>
          <button
            type="button"
            className="p-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors"
          >
            {isOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Expandable Body */}
      {isOpen && (
        <div className="p-4 sm:p-6 space-y-6">
          {/* Mode Navigation Tabs */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800 pb-3">
            <div className="flex flex-wrap items-center gap-1.5 font-mono text-xs">
              <button
                type="button"
                onClick={() => setActiveTab('experiment')}
                className={`px-3 py-1.5 rounded-lg border transition-colors flex items-center gap-1.5 ${
                  activeTab === 'experiment'
                    ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300 font-bold'
                    : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <FlaskConical className="w-3.5 h-3.5" />
                <span>Experiment & Variants</span>
                {currentExperiment && (
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-cyan-500/30 text-cyan-200 font-bold">
                    {1 + currentExperiment.experimentalVariants.length}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('hypothesis')}
                className={`px-3 py-1.5 rounded-lg border transition-colors flex items-center gap-1.5 ${
                  activeTab === 'hypothesis'
                    ? 'bg-purple-500/20 border-purple-500/50 text-purple-300 font-bold'
                    : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Dna className="w-3.5 h-3.5" />
                <span>Hypothesis & Tension</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  refreshData();
                  setActiveTab('archive');
                }}
                className={`px-3 py-1.5 rounded-lg border transition-colors flex items-center gap-1.5 ${
                  activeTab === 'archive'
                    ? 'bg-amber-500/20 border-amber-500/50 text-amber-300 font-bold'
                    : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Bookmark className="w-3.5 h-3.5" />
                <span>Discovery Archive</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/30 text-amber-200 font-bold">
                  {Object.keys(savedRecipes).length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  refreshData();
                  setActiveTab('promoted');
                }}
                className={`px-3 py-1.5 rounded-lg border transition-colors flex items-center gap-1.5 ${
                  activeTab === 'promoted'
                    ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300 font-bold'
                    : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Award className="w-3.5 h-3.5" />
                <span>Promoted Operators</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/30 text-emerald-200 font-bold">
                  {Object.keys(promotedOperators).length}
                </span>
              </button>
            </div>

            {/* Quick action: Re-generate or clear */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleBuildExperiment}
                className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-black font-mono text-xs font-bold transition-all shadow-md flex items-center gap-1.5"
              >
                <Play className="w-3.5 h-3.5 fill-black" />
                <span>Build New Family</span>
              </button>
            </div>
          </div>

          {/* TAB 1: EXPERIMENT & VARIANTS */}
          {activeTab === 'experiment' && (
            <div className="space-y-6">
              {/* Parameter titration & control bar */}
              <div className="p-3.5 rounded-lg bg-zinc-950 border border-zinc-800 text-xs font-mono grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-end">
                <div>
                  <label className="text-[10px] uppercase font-bold text-zinc-400 block mb-1">
                    Experiment Type
                  </label>
                  <select
                    value={experimentType}
                    onChange={(e) => setExperimentType(e.target.value as ExperimentType)}
                    className="w-full px-2.5 py-1.5 rounded bg-zinc-900 border border-zinc-700 text-zinc-200 text-xs focus:outline-none focus:border-cyan-500"
                  >
                    <option value="operator_interaction">Operator Interaction & Path Dependency (A, B, A→B, B→A, A+B)</option>
                    <option value="dose_sweep">Dose-Response Sweep (Low, Med, High, Maximal + Control)</option>
                    <option value="anchor_ablation">Anchor Constraint & Permeability Ablation</option>
                    <option value="custom_bounded">Custom Bounded Intensity Steps</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] uppercase font-bold text-zinc-400 block mb-1">
                    Primary Operator (A)
                  </label>
                  <select
                    value={selectedOpA}
                    onChange={(e) => setSelectedOpA(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded bg-zinc-900 border border-zinc-700 text-zinc-200 text-xs focus:outline-none focus:border-cyan-500"
                  >
                    {availableOperators.map((op) => (
                      <option key={op.id} value={op.id}>
                        {op.name} ({op.family})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] uppercase font-bold text-zinc-400 block mb-1">
                    Secondary Operator (B)
                  </label>
                  <select
                    value={selectedOpB}
                    onChange={(e) => setSelectedOpB(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded bg-zinc-900 border border-zinc-700 text-zinc-200 text-xs focus:outline-none focus:border-cyan-500"
                  >
                    {availableOperators.map((op) => (
                      <option key={op.id} value={op.id}>
                        {op.name} ({op.family})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <label className="text-[10px] uppercase font-bold text-zinc-400 block mb-1">
                      Variant Count (Bounded)
                    </label>
                    <select
                      value={variantCount}
                      onChange={(e) => setVariantCount(Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 rounded bg-zinc-900 border border-zinc-700 text-zinc-200 text-xs focus:outline-none focus:border-cyan-500"
                    >
                      <option value={2}>2 Variants + 1 Control</option>
                      <option value={3}>3 Variants + 1 Control</option>
                      <option value={4}>4 Variants + 1 Control (Default)</option>
                      <option value={5}>5 Variants + 1 Control (Max)</option>
                    </select>
                  </div>
                  <button
                    type="button"
                    onClick={handleBuildExperiment}
                    className="px-3 py-1.5 rounded bg-cyan-900/40 hover:bg-cyan-900/60 border border-cyan-500/50 text-cyan-300 text-xs font-bold transition-colors mt-4"
                    title="Re-run builder with chosen parameters"
                  >
                    Update
                  </button>
                </div>
              </div>

              {/* Active Experiment Overview Banner */}
              {currentExperiment && (
                <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-zinc-300">
                        {currentExperiment.title}
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700">
                        ID: {currentExperiment.id}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-[11px] font-mono">
                      {currentExperiment.pathDependencyDetected && (
                        <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold animate-pulse">
                          ⚡ Path Dependency Detected (A→B ≠ B→A)
                        </span>
                      )}
                      {currentExperiment.interactionEffectDetected && (
                        <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold">
                          ✨ Synergistic Interaction Observed
                        </span>
                      )}
                      <span className="text-zinc-500">
                        Target: {currentExperiment.targetMedium} / {currentExperiment.targetEngine}
                      </span>
                    </div>
                  </div>

                  {/* Compact Hypothesis Display */}
                  <div className="p-3 rounded-lg bg-zinc-950/80 border border-zinc-800/80 text-xs font-mono space-y-1">
                    <div className="text-cyan-400 font-bold">
                      HYPOTHESIS: <span className="text-zinc-300 font-normal">{currentExperiment.hypothesis.hypothesis}</span>
                    </div>
                    <div className="text-purple-400">
                      TENSION: <span className="text-zinc-400 font-normal">{currentExperiment.hypothesis.tension}</span>
                    </div>
                    <div className="text-emerald-400">
                      CONTROL: <span className="text-zinc-400 font-normal">{currentExperiment.hypothesis.control}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Variants Grid: Control (always first) + Experimental Variants */}
              {currentExperiment ? (
                <div className="space-y-4">
                  <div className="text-xs font-mono uppercase tracking-wider text-zinc-400 flex items-center justify-between">
                    <span>Experiment Family (1 Control + {currentExperiment.experimentalVariants.length} Variants)</span>
                    <span className="text-[10px] text-zinc-500">
                      Bounded to prevent combinatorial explosion • Distinguishes causality from seed luck
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* 1. CONTROL VARIANT (Section 2) */}
                    <div
                      key={currentExperiment.controlVariant.id}
                      className={`p-4 rounded-xl border transition-all flex flex-col justify-between ${
                        selectedVariantId === currentExperiment.controlVariant.id
                          ? 'bg-emerald-950/30 border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.15)]'
                          : 'bg-zinc-950/80 border-emerald-600/40 hover:border-emerald-500/60'
                      }`}
                      onClick={() => setSelectedVariantId(currentExperiment.controlVariant.id)}
                    >
                      <div className="space-y-2.5">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold">
                            CONTROL BASELINE
                          </span>
                          <span className="text-[10px] font-mono text-zinc-500">
                            Neutralized Mutation
                          </span>
                        </div>

                        <div className="font-mono text-xs font-bold text-zinc-200">
                          {currentExperiment.controlVariant.label}
                        </div>

                        <p className="text-xs font-mono text-zinc-400 leading-relaxed">
                          {currentExperiment.controlVariant.description}
                        </p>

                        <div className="p-2.5 rounded bg-zinc-900 border border-zinc-800 text-[11px] font-mono text-zinc-300 select-all max-h-24 overflow-y-auto">
                          {currentExperiment.controlVariant.promptText}
                        </div>
                      </div>

                      {/* Control Actions & Rating */}
                      <div className="pt-3 mt-3 border-t border-zinc-800/80 space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCopyPrompt(
                                currentExperiment.controlVariant.promptText,
                                currentExperiment.controlVariant.id
                              );
                            }}
                            className="text-[10px] font-mono px-2 py-1 rounded bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-700 flex items-center gap-1"
                          >
                            {copiedId === currentExperiment.controlVariant.id ? (
                              <Check className="w-3 h-3 text-emerald-400" />
                            ) : (
                              <Copy className="w-3 h-3 text-zinc-400" />
                            )}
                            <span>Copy Prompt</span>
                          </button>

                          {onApplyPromptToInput && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onApplyPromptToInput(currentExperiment.controlVariant.promptText);
                                showToast('Applied Control Prompt to Synthesis Input');
                              }}
                              className="text-[10px] font-mono px-2 py-1 rounded bg-emerald-900/40 hover:bg-emerald-900/60 text-emerald-300 border border-emerald-500/40"
                            >
                              Apply to Input
                            </button>
                          )}
                        </div>

                        {/* Fast Rating */}
                        <div className="flex items-center gap-1 pt-1 font-mono text-[10px]">
                          <span className="text-zinc-500 mr-1">Rate:</span>
                          {(['BORING', 'BROKEN BAD', 'INTERESTING', 'JACKPOT'] as DiscoveryUserRating[]).map(
                            (rating) => (
                              <button
                                key={rating}
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRateVariant(currentExperiment.controlVariant.id, rating);
                                }}
                                className={`px-1.5 py-0.5 rounded border transition-colors ${
                                  currentExperiment.controlVariant.userRating === rating
                                    ? 'bg-emerald-500/30 border-emerald-500 text-emerald-200 font-bold'
                                    : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                                }`}
                              >
                                {rating === 'BROKEN BAD' ? 'BAD' : rating}
                              </button>
                            )
                          )}
                        </div>
                      </div>
                    </div>

                    {/* 2. EXPERIMENTAL VARIANTS */}
                    {currentExperiment.experimentalVariants.map((variant) => (
                      <div
                        key={variant.id}
                        className={`p-4 rounded-xl border transition-all flex flex-col justify-between ${
                          selectedVariantId === variant.id
                            ? 'bg-cyan-950/30 border-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.15)]'
                            : 'bg-zinc-950/80 border-zinc-800 hover:border-zinc-700'
                        }`}
                        onClick={() => setSelectedVariantId(variant.id)}
                      >
                        <div className="space-y-2.5">
                          <div className="flex items-center justify-between gap-2">
                            <span
                              className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold border ${
                                variant.role === 'order_test'
                                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                                  : variant.role === 'interaction'
                                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                                  : variant.role === 'ablation'
                                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                                  : 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                              }`}
                            >
                              {variant.role.toUpperCase()}
                            </span>
                            <span className="text-[10px] font-mono text-zinc-500">
                              Intensity: {variant.mutationIntensity}/10
                            </span>
                          </div>

                          <div className="font-mono text-xs font-bold text-zinc-200">
                            {variant.label}
                          </div>

                          <p className="text-xs font-mono text-zinc-400 leading-relaxed">
                            {variant.description}
                          </p>

                          <div className="p-2.5 rounded bg-zinc-900 border border-zinc-800 text-[11px] font-mono text-zinc-300 select-all max-h-24 overflow-y-auto">
                            {variant.promptText}
                          </div>

                          {/* Artifact Tags on this Variant */}
                          <div className="space-y-1 pt-1">
                            <span className="text-[10px] font-mono text-zinc-500 block">
                              Observed Artifacts:
                            </span>
                            <div className="flex flex-wrap gap-1">
                              {variant.taggedArtifacts.length > 0 ? (
                                variant.taggedArtifacts.map((tag) => (
                                  <span
                                    key={tag}
                                    className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-cyan-950/60 text-cyan-300 border border-cyan-500/30 flex items-center gap-1"
                                  >
                                    <Tag className="w-2.5 h-2.5" />
                                    {tag}
                                  </span>
                                ))
                              ) : (
                                <span className="text-[10px] font-mono text-zinc-600 italic">
                                  None tagged yet
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Variant Actions, Rating & Save Discovery */}
                        <div className="pt-3 mt-3 border-t border-zinc-800/80 space-y-2">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCopyPrompt(variant.promptText, variant.id);
                                }}
                                className="text-[10px] font-mono px-2 py-1 rounded bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-700 flex items-center gap-1"
                              >
                                {copiedId === variant.id ? (
                                  <Check className="w-3 h-3 text-emerald-400" />
                                ) : (
                                  <Copy className="w-3 h-3 text-zinc-400" />
                                )}
                                <span>Copy</span>
                              </button>

                              {onApplyPromptToInput && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onApplyPromptToInput(variant.promptText);
                                    showToast('Applied Variant Prompt to Synthesis Input');
                                  }}
                                  className="text-[10px] font-mono px-2 py-1 rounded bg-cyan-900/40 hover:bg-cyan-900/60 text-cyan-300 border border-cyan-500/40"
                                >
                                  Apply
                                </button>
                              )}
                            </div>

                            {/* Save Discovery Trigger */}
                            {(variant.userRating === 'INTERESTING' || variant.userRating === 'JACKPOT') && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSaveModalVariant(variant);
                                  setDiscoveryNameInput(
                                    `${variant.operators.join(' + ')} (${currentExperiment.targetMedium.toUpperCase()})`
                                  );
                                }}
                                className="text-[10px] font-mono px-2 py-1 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/50 font-bold flex items-center gap-1 animate-pulse"
                              >
                                <Bookmark className="w-3 h-3" />
                                <span>Save Discovery</span>
                              </button>
                            )}
                          </div>

                          {/* Fast Rating Buttons (Section 8) */}
                          <div className="flex items-center gap-1 font-mono text-[10px]">
                            <span className="text-zinc-500 mr-1">Rate:</span>
                            {(['BORING', 'BROKEN BAD', 'INTERESTING', 'JACKPOT'] as DiscoveryUserRating[]).map(
                              (rating) => (
                                <button
                                  key={rating}
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleRateVariant(variant.id, rating);
                                  }}
                                  className={`px-1.5 py-0.5 rounded border transition-colors ${
                                    variant.userRating === rating
                                      ? rating === 'JACKPOT'
                                        ? 'bg-amber-500/40 border-amber-500 text-amber-200 font-bold'
                                        : rating === 'INTERESTING'
                                        ? 'bg-cyan-500/40 border-cyan-500 text-cyan-200 font-bold'
                                        : 'bg-zinc-800 border-zinc-600 text-zinc-200 font-bold'
                                      : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                                  }`}
                                >
                                  {rating === 'BROKEN BAD' ? 'BAD' : rating}
                                </button>
                              )
                            )}
                          </div>

                          {/* Quick Tagging Popover Trigger */}
                          <div className="pt-1">
                            <details className="text-[10px] font-mono text-zinc-400">
                              <summary className="cursor-pointer hover:text-cyan-300 select-none">
                                + Tag Observable Artifacts ({variant.taggedArtifacts.length})
                              </summary>
                              <div className="p-2 mt-1 rounded bg-zinc-900 border border-zinc-800 flex flex-wrap gap-1 max-h-32 overflow-y-auto">
                                {OBSERVABLE_ARTIFACT_TAGS.map((tag) => {
                                  const active = variant.taggedArtifacts.includes(tag);
                                  return (
                                    <button
                                      key={tag}
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleToggleArtifactTag(variant.id, tag);
                                      }}
                                      className={`px-1.5 py-0.5 rounded text-[9px] border transition-colors ${
                                        active
                                          ? 'bg-cyan-500/30 border-cyan-400 text-cyan-200 font-bold'
                                          : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                                      }`}
                                    >
                                      {tag}
                                    </button>
                                  );
                                })}
                              </div>
                            </details>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center font-mono text-zinc-500 text-xs border border-dashed border-zinc-800 rounded-xl">
                  Click "Build New Family" to synthesize an empirical experiment family from your current input.
                </div>
              )}
            </div>
          )}

          {/* TAB 2: HYPOTHESIS & TENSION BLUEPRINT */}
          {activeTab === 'hypothesis' && currentExperiment && (
            <div className="space-y-4 font-mono text-xs">
              <div className="p-4 rounded-xl bg-zinc-950 border border-purple-500/30 space-y-4">
                <div className="flex items-center gap-2 text-purple-300 font-bold uppercase tracking-wider text-sm border-b border-zinc-800 pb-2">
                  <Dna className="w-4 h-4 text-purple-400" />
                  <span>Structured Hypothesis Blueprint (Job 8 Section 4)</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-3 rounded-lg bg-zinc-900/80 border border-zinc-800 space-y-1">
                    <span className="text-[10px] text-cyan-400 uppercase font-bold block">
                      1. Scientific Hypothesis
                    </span>
                    <p className="text-zinc-300 leading-relaxed">
                      {currentExperiment.hypothesis.hypothesis}
                    </p>
                  </div>

                  <div className="p-3 rounded-lg bg-zinc-900/80 border border-zinc-800 space-y-1">
                    <span className="text-[10px] text-purple-400 uppercase font-bold block">
                      2. Boundary Tension
                    </span>
                    <p className="text-zinc-300 leading-relaxed">
                      {currentExperiment.hypothesis.tension}
                    </p>
                  </div>

                  <div className="p-3 rounded-lg bg-zinc-900/80 border border-zinc-800 space-y-1">
                    <span className="text-[10px] text-emerald-400 uppercase font-bold block">
                      3. Control Neutralization
                    </span>
                    <p className="text-zinc-300 leading-relaxed">
                      {currentExperiment.hypothesis.control}
                    </p>
                  </div>

                  <div className="p-3 rounded-lg bg-zinc-900/80 border border-zinc-800 space-y-1">
                    <span className="text-[10px] text-rose-400 uppercase font-bold block">
                      4. Ablation Contrast
                    </span>
                    <p className="text-zinc-300 leading-relaxed">
                      {currentExperiment.hypothesis.ablation}
                    </p>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-zinc-900/80 border border-zinc-800 space-y-1">
                  <span className="text-[10px] text-amber-400 uppercase font-bold block">
                    5. Expected Failure Artifacts
                  </span>
                  <p className="text-zinc-300 leading-relaxed">
                    {currentExperiment.hypothesis.expectedFailure}
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-zinc-900/40 border border-zinc-800/80 text-[11px] text-zinc-400 space-y-1">
                  <div className="text-zinc-300 font-bold">Scientific Hygiene Guarantee:</div>
                  <p>
                    DAVID evaluates empirical output behavior without pretending to measure hidden proprietary weights or unmeasurable activations.
                    All observations describe observable output structures.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: DISCOVERY ARCHIVE (SAVED RECIPES) */}
          {activeTab === 'archive' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-zinc-400 uppercase tracking-wider">
                  Saved Generative Procedures ({Object.keys(savedRecipes).length})
                </span>
                <span className="text-[10px] text-zinc-500">
                  Stores procedures (operator chains & relative strengths), not merely static prompt text
                </span>
              </div>

              {Object.keys(savedRecipes).length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.values(savedRecipes).map((recipe) => (
                    <div
                      key={recipe.id}
                      className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-3 font-mono text-xs flex flex-col justify-between hover:border-amber-500/40 transition-colors"
                    >
                      <div className="space-y-2.5">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="font-bold text-amber-300 text-sm">{recipe.name}</div>
                            <div className="text-[10px] text-zinc-500">ID: {recipe.id}</div>
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            <span className="text-[9px] px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700 uppercase">
                              {recipe.targetMedium}
                            </span>
                            <span
                              className={`text-[9px] px-2 py-0.5 rounded border uppercase font-bold ${
                                recipe.confidence === 'strong'
                                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                                  : recipe.confidence === 'repeated'
                                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                                  : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                              }`}
                            >
                              Conf: {recipe.confidence} ({recipe.timesObserved}x)
                            </span>
                          </div>
                        </div>

                        <div className="p-2 rounded bg-zinc-900 border border-zinc-800 text-[11px] text-zinc-300 space-y-1">
                          <div className="text-cyan-400 font-bold">
                            Operator Chain: {recipe.ordering.join(' → ')}
                          </div>
                          <div className="text-zinc-400 text-[10px]">
                            Failure Surface: {recipe.usefulFailureSurface.join(', ')}
                          </div>
                        </div>

                        <p className="text-zinc-400 text-[11px] leading-relaxed">
                          {recipe.mechanismHypothesis}
                        </p>
                      </div>

                      {/* Recipe Actions (Section 14) */}
                      <div className="pt-3 border-t border-zinc-800 space-y-2">
                        <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
                          {/* 1. Reuse Recipe */}
                          {onApplyRecipeToState && (
                            <button
                              type="button"
                              onClick={() => {
                                onApplyRecipeToState(recipe);
                                showToast(`Loaded "${recipe.name}" into active synthesis configuration`);
                              }}
                              className="px-2 py-1 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 font-bold"
                            >
                              Reuse
                            </button>
                          )}

                          {/* 2. Test Reproducibility */}
                          <button
                            type="button"
                            onClick={() => handleTestReproducibility(recipe.id)}
                            className="px-2 py-1 rounded bg-cyan-900/40 hover:bg-cyan-900/60 text-cyan-300 border border-cyan-500/40 flex items-center gap-1"
                          >
                            <Shuffle className="w-3 h-3" />
                            <span>Test Repro</span>
                          </button>

                          {/* Confirm Repro Buttons */}
                          <button
                            type="button"
                            onClick={() => handleConfirmReproduction(recipe.id, true)}
                            className="px-1.5 py-1 rounded bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border border-emerald-500/30"
                            title="Confirm that the artifact family recurs across seeds (+confidence)"
                          >
                            ✓ Recurred
                          </button>

                          {/* 3. Mutate Discovery (Section 13) */}
                          <details className="relative inline-block">
                            <summary className="px-2 py-1 rounded bg-purple-900/40 hover:bg-purple-900/60 text-purple-300 border border-purple-500/40 cursor-pointer select-none">
                              Mutate ▾
                            </summary>
                            <div className="absolute left-0 bottom-full mb-1 z-30 w-48 p-1.5 rounded-lg bg-zinc-900 border border-zinc-700 shadow-xl space-y-1">
                              <button
                                type="button"
                                onClick={() => handleMutateRecipe(recipe.id, 'reverse_order')}
                                className="w-full text-left px-2 py-1 rounded hover:bg-zinc-800 text-[10px] text-zinc-300"
                              >
                                Reverse Operator Order
                              </button>
                              <button
                                type="button"
                                onClick={() => handleMutateRecipe(recipe.id, 'titrate_strength')}
                                className="w-full text-left px-2 py-1 rounded hover:bg-zinc-800 text-[10px] text-zinc-300"
                              >
                                Titrate Pressure (+35%)
                              </button>
                              <button
                                type="button"
                                onClick={() => handleMutateRecipe(recipe.id, 'substitute_operator')}
                                className="w-full text-left px-2 py-1 rounded hover:bg-zinc-800 text-[10px] text-zinc-300"
                              >
                                Substitute Secondary Op
                              </button>
                              <button
                                type="button"
                                onClick={() => handleMutateRecipe(recipe.id, 'transfer_modality')}
                                className="w-full text-left px-2 py-1 rounded hover:bg-zinc-800 text-[10px] text-zinc-300"
                              >
                                Cross-Modality Transfer
                              </button>
                            </div>
                          </details>

                          {/* 4. Promote to Operator (Section 10) */}
                          {!recipe.promotedToOperator ? (
                            <button
                              type="button"
                              onClick={() => handlePromoteToOperator(recipe.id)}
                              className="px-2 py-1 rounded bg-emerald-900/40 hover:bg-emerald-900/60 text-emerald-300 border border-emerald-500/40 flex items-center gap-1 font-bold"
                            >
                              <Award className="w-3 h-3" />
                              <span>Promote</span>
                            </button>
                          ) : (
                            <span className="text-[9px] text-emerald-400 font-bold px-1.5 py-0.5 rounded bg-emerald-950 border border-emerald-500/40">
                              Promoted
                            </span>
                          )}

                          {/* Delete */}
                          <button
                            type="button"
                            onClick={() => {
                              deleteDiscoveryRecipe(recipe.id);
                              refreshData();
                              showToast('Deleted recipe from archive');
                            }}
                            className="p-1 rounded text-zinc-600 hover:text-rose-400 ml-auto"
                            title="Delete recipe"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center font-mono text-zinc-500 text-xs border border-dashed border-zinc-800 rounded-xl">
                  No discoveries saved yet. Rate an experimental variant as "INTERESTING" or "JACKPOT" to save its generative procedure here.
                </div>
              )}
            </div>
          )}

          {/* TAB 4: PROMOTED OPERATORS */}
          {activeTab === 'promoted' && (
            <div className="space-y-4 font-mono text-xs">
              <div className="flex items-center justify-between">
                <span className="text-zinc-400 uppercase tracking-wider">
                  Promoted Operators Library ({Object.keys(promotedOperators).length})
                </span>
                <span className="text-[10px] text-zinc-500">
                  Marked as EXPERIMENTAL / USER-DISCOVERED • Directly selectable across DAVID
                </span>
              </div>

              {Object.keys(promotedOperators).length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.values(promotedOperators).map((promoted) => (
                    <div
                      key={promoted.id}
                      className="p-4 rounded-xl bg-zinc-950 border border-emerald-500/30 space-y-3 flex flex-col justify-between"
                    >
                      <div className="space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="font-bold text-emerald-300 text-sm">{promoted.name}</div>
                            <div className="text-[10px] text-zinc-500">ID: {promoted.id}</div>
                          </div>
                          <span className="text-[9px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold uppercase">
                            {promoted.origin}
                          </span>
                        </div>

                        <p className="text-zinc-300 text-[11px] leading-relaxed">
                          {promoted.shortDescription}
                        </p>

                        <div className="p-2.5 rounded bg-zinc-900 border border-zinc-800 text-[10px] space-y-1">
                          <div className="text-cyan-400">
                            Mechanism Hypothesis: <span className="text-zinc-300">{promoted.mechanismHypothesis}</span>
                          </div>
                          <div className="text-amber-400">
                            Expected Failure Surface: <span className="text-zinc-300">{promoted.expectedFailureSurface.join(', ')}</span>
                          </div>
                          <div className="text-emerald-400">
                            Confidence Level: <span className="text-zinc-300">{promoted.confidence}</span>
                          </div>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-zinc-800 flex items-center justify-between">
                        <span className="text-[10px] text-zinc-500">
                          Target Medium: {promoted.targetMedium}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            deletePromotedOperator(promoted.id);
                            refreshData();
                            showToast(`Removed promoted operator ${promoted.name}`);
                          }}
                          className="text-[10px] text-zinc-600 hover:text-rose-400 flex items-center gap-1"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Demote / Remove</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center font-mono text-zinc-500 text-xs border border-dashed border-zinc-800 rounded-xl">
                  No operators promoted yet. In the Discovery Archive tab, click "Promote" on any confirmed discovery recipe.
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* SAVE DISCOVERY MODAL */}
      {saveModalVariant && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl bg-zinc-950 border border-amber-500/50 p-6 space-y-4 font-mono text-xs shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2 text-amber-300 font-bold text-sm">
                <Bookmark className="w-4 h-4" />
                <span>Save Generative Discovery Recipe</span>
              </div>
              <button
                type="button"
                onClick={() => setSaveModalVariant(null)}
                className="text-zinc-500 hover:text-zinc-300 text-lg leading-none"
              >
                &times;
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[10px] uppercase font-bold text-zinc-400 block mb-1">
                  Discovery Name
                </label>
                <input
                  type="text"
                  value={discoveryNameInput}
                  onChange={(e) => setDiscoveryNameInput(e.target.value)}
                  placeholder="e.g. Chitinous Lattice Seam"
                  className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-700 text-zinc-200 text-xs focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="p-3 rounded-lg bg-zinc-900 border border-zinc-800 text-[11px] text-zinc-300 space-y-1">
                <div>
                  <span className="text-zinc-500">Operators:</span>{' '}
                  <span className="text-cyan-300">{saveModalVariant.operators.join(' → ')}</span>
                </div>
                <div>
                  <span className="text-zinc-500">Artifacts Tagged:</span>{' '}
                  <span className="text-amber-300">
                    {saveModalVariant.taggedArtifacts.length > 0
                      ? saveModalVariant.taggedArtifacts.join(', ')
                      : 'None'}
                  </span>
                </div>
                <div className="text-[10px] text-zinc-400 pt-1">
                  Saves the generative procedure, ordering, and failure conditions so prompts can be reconstructed later.
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-800">
              <button
                type="button"
                onClick={() => setSaveModalVariant(null)}
                className="px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-400 text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveDiscovery}
                className="px-4 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs flex items-center gap-1.5"
              >
                <Bookmark className="w-3.5 h-3.5 fill-black" />
                <span>Save Discovery</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
