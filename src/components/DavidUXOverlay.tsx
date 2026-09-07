import React, { useEffect, useMemo, useState } from 'react';
import {
  BookOpen,
  Bookmark,
  Compass,
  Cpu,
  FlaskConical,
  HelpCircle,
  Home,
  RotateCcw,
  Search,
  Sliders,
  Sparkles,
  Terminal,
  Wand2,
  X,
} from 'lucide-react';

type HelpEntry = {
  title: string;
  what: string;
  affects: string;
  bestFor: string[];
  how: string[];
  goodToKnow?: string;
};

const HELP: Record<string, HelpEntry> = {
  qd_auto: {
    title: 'QD AUTO',
    what: 'Quality-Diversity auto-selection. David generates several mutation candidates behind the scenes and favors candidates that are both strange and meaningfully different from one another.',
    affects: 'Which mutation path survives when entropy is high. It does not simply turn the weirdness up; it changes how David chooses among possible weird outcomes.',
    bestFor: ['Fast weird setups without hand-picking operators', 'Exploring a concept when you do not yet know which failure surface to attack', 'Getting variation instead of several near-duplicate mutants'],
    how: ['Leave it ON for exploratory work.', 'Turn it OFF when you want the exact same curated operator chain to stay in control.'],
    goodToKnow: 'QD is a selection strategy, not another prompt ingredient. If you are debugging a specific operator, turn it off so it does not muddy the experiment.',
  },
  content_dna: {
    title: 'CONTENT DNA',
    what: 'The ingredient vocabulary David is allowed to inject into a mutation: mathematics, physical science, biological systems, internet artifacts, glitch structures, materials, and related seed concepts.',
    affects: 'What conceptual material the mutation has available. DNA changes the ingredients; Operators change what happens to those ingredients.',
    bestFor: ['Adding a new scientific or mathematical mechanism', 'Seeding specific kinds of material or topology', 'Giving Auto mode a richer pool to mutate from'],
    how: ['Tap individual DNA entries when you want a specific mechanism.', 'Use category filters when you know the domain but not the exact ingredient.', 'Leave selection sparse when you want each ingredient to remain legible.'],
    goodToKnow: 'More DNA is not automatically stranger. Too many unrelated seeds can dilute each other and make the model fall back to generic compromise imagery.',
  },
  operators: {
    title: 'OPERATORS',
    what: 'Reusable transformation mechanics that act on a concept: binding failures, topology pressure, temporal drift, serialization damage, attention starvation, semantic shearing, and other structured ways to make a model solve the wrong problem.',
    affects: 'How David transforms the concept rather than what the concept is made of.',
    bestFor: ['Repeatable experiments', 'Pushing a known failure surface', 'Building a recipe you want to reuse across prompts or models'],
    how: ['Choose one or two operators first.', 'Increase intensity only after you can see what each operator contributes.', 'Combine operators when their mechanisms attack different layers.'],
    goodToKnow: 'If everything is active at once, you lose the ability to tell which mechanism produced the good accident.',
  },
  latent_fauna: {
    title: 'LATENT FAUNA',
    what: 'Named attractor behaviors: recurring families of emergent forms David can encourage when the model is between stable categories.',
    affects: 'The shape of the compromise the model tends to fall into when ordinary identity becomes unstable.',
    bestFor: ['Finding a recognizable family of glitches', 'Encouraging specific kinds of hallucinated connective tissue or identity drift', 'Exploring a mutation family across many prompts'],
    how: ['Treat fauna as attractors, not literal subjects.', 'Pair one fauna with a compatible Operator or Pressure.', 'Use lower weights first so the original concept still has something to fight against.'],
  },
  protected_anchors: {
    title: 'PROTECTED ANCHORS',
    what: 'Words or identities David should preserve while everything around them is allowed to mutate.',
    affects: 'Identity retention. An anchor tells the mutation system what must survive the transformation.',
    bestFor: ['Keeping @merry recognizable', 'Preserving a named subject, product, or required object', 'Aggressive entropy where you still need one stable reference point'],
    how: ['Add the exact token or name you need protected.', 'Keep the list short.', 'If the model still drifts, lower entropy or reduce competing operators before adding more anchors.'],
    goodToKnow: 'An anchor is not a guarantee imposed on the external image model. It is a strong preservation instruction in David’s compiled prompt logic.',
  },
  mutation_mode: {
    title: 'AUTO / CURATED',
    what: 'AUTO lets David choose compatible mutation machinery dynamically. CURATED restricts the recipe to the operators, fauna, pressures, and seeds you deliberately selected.',
    affects: 'Who chooses the mutation recipe: David or you.',
    bestFor: ['AUTO: discovery and fast exploration', 'CURATED: controlled experiments and repeatable recipes'],
    how: ['Start in AUTO when exploring.', 'Switch to CURATED when you find a mechanism worth isolating or reproducing.'],
  },
  entropy: {
    title: 'ENTROPY DEPTH / S-SCALE',
    what: 'The overall mutation pressure. Low S values preserve the original semantic basin; high S values allow identity, topology, material, and causal structure to drift much farther.',
    affects: 'How aggressively David permits representational instability across the compiled prompt.',
    bestFor: ['S1–S3: recognizable subject with subtle drift', 'S4–S6: structural distortion and useful hybrids', 'S7–S8: deep reinterpretation', 'S9–S10: deliberate collapse experiments'],
    how: ['Move one or two steps at a time.', 'If the model simply ignores instructions, back off one step and strengthen fewer constraints instead.'],
    goodToKnow: 'Maximum entropy can produce less interesting results if the model gives up and defaults to one dominant prior.',
  },
  straitjacket: {
    title: 'STRAITJACKET CONSTRAINT',
    what: 'Controls how tightly David remains attached to your original subject instead of merely how weird the wording becomes.',
    affects: 'Subject fidelity versus reinterpretation.',
    bestFor: ['NORMAL: preserve intent', 'LOOSEN: allow side associations', 'MISINTERPRET: intentionally bend the subject', 'DESTABILIZE: preserve a trace while attacking structure', 'REMOVE SUBJECT: let the transformation become the subject'],
    how: ['Use LOOSEN or DESTABILIZE for most slop work.', 'Use REMOVE SUBJECT when you care about the process more than the original noun.'],
  },
  search_grounding: {
    title: 'SEARCH GROUNDING',
    what: 'Allows the synthesis step to pull in outside factual context when the request benefits from current or specialized information.',
    affects: 'How much the generation is grounded in retrieved facts versus working only from the supplied concept and David’s internal prompt machinery.',
    bestFor: ['Current model capabilities', 'Specific scientific terminology', 'Contemporary references or factual constraints'],
    how: ['Leave it off for purely imaginative work.', 'Turn it on when accuracy matters more than keeping the system self-contained.'],
  },
  paradox_engine: {
    title: 'PARADOX ENGINE',
    what: 'Injects contradictions that have structural consequences: impossible topology, incompatible conservation rules, causal reversals, mutually exclusive material states, and similar constraints.',
    affects: 'The problem the target model is forced to solve.',
    bestFor: ['Forcing novel compromises', 'Making physics or topology generate the weirdness instead of decorative adjectives', 'Creating model-specific failure pressure'],
    how: ['Use one coherent paradox first.', 'Combine paradoxes only when both can remain active at the same time.'],
    goodToKnow: 'A contradiction that the model can simply ignore is weak. The useful ones force visible compensation.',
  },
  contradiction_mode: {
    title: 'CONTRADICTION MODE',
    what: 'Chooses the family of conflict David uses when it needs opposing constraints.',
    affects: 'The character of the instability: logical impossibility, semantic opposition, hybrid classification, or randomized high-entropy collision.',
    bestFor: ['Impossible Paradoxes: structural contradictions', 'Weird Opposites: competing semantic poles', 'Uncanny Hybrids: category binding stress', 'Random Entropy Shower: discovery rather than control'],
    how: ['Choose the mode based on the failure surface you want, not which label sounds coolest.'],
  },
  modular_pipeline: {
    title: 'MODULAR INJECTION PIPELINE',
    what: 'A staged chain of system-level disruptors. Each module transforms the intermediate text before the next stage receives it.',
    affects: 'Order-dependent prompt mutation. Because the chain is sequential, A → B can behave differently from B → A.',
    bestFor: ['Token and serialization experiments', 'Repeatable multi-stage transformations', 'Testing path dependence'],
    how: ['Start with two or three modules.', 'Reorder them and compare outputs.', 'Use the sandbox before replacing your whole concept.'],
    goodToKnow: 'This is an expert tool. It is hidden in the simplified Create view until Advanced is enabled.',
  },
  high_thinking: {
    title: 'HIGH THINKING',
    what: 'Uses the deeper reasoning path for synthesis when David needs more time to plan mechanisms, reconcile constraints, or analyze a complicated request.',
    affects: 'The reasoning budget used to construct the prompt, not the target image/audio/video model itself.',
    bestFor: ['Complex operator stacks', 'Technical scientific constraints', 'When a normal synthesis keeps missing the relationship you care about'],
    how: ['Keep it off for routine runs.', 'Turn it on when the problem itself needs reasoning rather than just more descriptive detail.'],
  },
  seed_archive: {
    title: 'SEED ARCHIVE / PRESETS',
    what: 'Saved starting configurations that load a known prompt setup quickly.',
    affects: 'The initial configuration before you begin editing or mutating.',
    bestFor: ['Reusing a successful setup', 'Starting from a known experiment', 'Rapid comparison across target models'],
    how: ['Load a preset, then change only one variable if you are testing cause and effect.'],
  },
  target_engine: {
    title: 'TARGET AI ENGINE',
    what: 'The model or model-family David is writing for. Different generators have different prompt limits, conditioning behavior, and failure surfaces.',
    affects: 'Prompt structure, length, terminology, and model-specific mutation strategy.',
    bestFor: ['Matching the prompt to the system that will actually receive it'],
    how: ['Choose the real destination first. David will adapt the prompt budget and output style around it.'],
  },
  suno: {
    title: 'SUNO AUDIO',
    what: 'Audio target profile for music, noise, vocals, pseudo-phonetics, and experimental sound design.',
    affects: 'How David divides style instructions, lyric/gibberish material, temporal structure, and sonic contradictions.',
    bestFor: ['Genre-manifold collisions', 'Glitch/noise experiments', 'Instrument identity confusion', 'Vocal and phonetic hallucinations'],
    how: ['Use the concept box for the overall problem.', 'Use Instrumental when you want to suppress the vocal path.', 'Keep an eye on the separate style and lyric character budgets.'],
  },
  openart: {
    title: 'OPENART',
    what: 'Image-generation target with model-specific prompt profiles for Banana, Nano Bananas, Pro, Light, and SeaDream.',
    affects: 'Visual prompt length, descriptive density, and which kinds of structural language David favors.',
    bestFor: ['Still-image transformations', 'Material and topology experiments', 'Reference-driven image work'],
    how: ['Pick the sub-model that matches the model you will actually run.'],
  },
  grok: {
    title: 'GROK IMAGE / VIDEO',
    what: 'Target profile for Grok image generation or motion-focused video prompting.',
    affects: 'How David writes camera, motion, temporal correspondence, transformation, and physical constraints.',
    bestFor: ['Motion contradictions', 'Temporal topology', 'Physics failures', 'Image-to-video transformations'],
    how: ['Switch to Video mode when the instability depends on time.'],
  },
  midjourney: {
    title: 'MIDJOURNEY / FLUX',
    what: 'Compact visual target profile emphasizing subject hierarchy, structural transformation, space, and optics.',
    affects: 'How aggressively David compresses a concept into visual instructions and parameters.',
    bestFor: ['Strong still-image composition', 'Camera/optics experiments', 'Compact topology prompts'],
    how: ['Use when the destination expects concise visual hierarchy rather than long machine-analysis prose.'],
  },
  llm: {
    title: 'BASE LLM / CLAUDE',
    what: 'Text-model target for persona bifurcation, conceptual mutation, machine translation, and other language-native experiments.',
    affects: 'The structure of the generated machine-facing instruction rather than a visual or audio prompt.',
    bestFor: ['Meta-prompts', 'Prompt translators', 'Multi-agent conceptual mutation', 'Textual failure-surface experiments'],
    how: ['Use when the next system receiving David’s output is another language model.'],
  },
  latent_void: {
    title: 'LATENT VOID',
    what: 'A deliberately weakly categorized target profile used to emphasize relational structure while minimizing familiar object labels.',
    affects: 'How much David tries to anchor the output to a named semantic class.',
    bestFor: ['Asemantic experiments', 'Category cancellation', 'Generating structure before naming the thing'],
    how: ['Use when a normal named subject keeps dragging the result back toward a familiar visual basin.'],
  },
  multimodal: {
    title: 'MULTI-MODAL',
    what: 'General-purpose target when the output may move between text, image, audio, or video systems.',
    affects: 'David favors portable structural language instead of assumptions tied to one generator.',
    bestFor: ['Unknown destination models', 'Cross-model testing', 'Machine-to-machine prompt handoff'],
    how: ['Use a dedicated target whenever you know it; use Multi-Modal when portability matters more.'],
  },
  compiled_recipe: {
    title: 'COMPILED RECIPE PREVIEW',
    what: 'A live summary of the active DNA, operators, fauna, pressures, anchors, and mutation mode that will be applied.',
    affects: 'Nothing by itself. It is your readout of the current mutation state.',
    bestFor: ['Checking what is actually active before you apply the recipe', 'Spotting accidental over-stacking'],
    how: ['Read this before Apply to Generator when you are working in Curated mode.'],
  },
  slop_methods: {
    title: 'SLOP METHODS & SPECIMENS',
    what: 'A library of named experimental procedures and example concepts that demonstrate what the procedure does.',
    affects: 'Provides reusable starting concepts and method families rather than silently changing your recipe.',
    bestFor: ['Learning by example', 'Loading a strange concept directly into the generator', 'Finding a technique you want to mutate further'],
    how: ['Load Concept to move the specimen into the main editor.', 'Copy when you only want the wording.'],
  },
  discovery_lab: {
    title: 'DISCOVERY LAB',
    what: 'The experimental workbench for bounded families, dose sweeps, operator interactions, and procedure archiving.',
    affects: 'How you test and learn from David rather than how one ordinary synthesis is generated.',
    bestFor: ['Systematic experiments', 'Comparing operator strength', 'Finding repeatable weirdness instead of lucky seeds'],
    how: ['Use it after you find an effect worth investigating.'],
  },
  guidance_geometry: {
    title: 'GUIDANCE GEOMETRY',
    what: 'Tools for thinking about competing conditioning directions, guidance strength, and when two constraints reinforce, cancel, or shear each other.',
    affects: 'How David structures conflicts between conditions before they reach the target model.',
    bestFor: ['Competing references', 'Identity versus transformation conflicts', 'Guidance-saturation experiments'],
    how: ['Use it when the problem is not the idea itself but how strongly several instructions are pulling against one another.'],
  },
  structural_relational: {
    title: 'STRUCTURAL / RELATIONAL TRAPS',
    what: 'Constraints that define relationships, boundaries, containment, causality, topology, or part/whole logic without relying on decorative style words.',
    affects: 'The structural problem the model must solve.',
    bestFor: ['Making the weirdness a consequence of rules', 'Topology and anatomy experiments', 'Avoiding generic “surreal” output'],
    how: ['Choose a relationship that the model normally assumes is stable, then make that relationship impossible to preserve.'],
  },
  context_diagnostics: {
    title: 'CONTEXT DIAGNOSTICS',
    what: 'Inspects prompt budget, attention competition, binding distance, and other context-level risks before synthesis.',
    affects: 'Helps you predict where a prompt may lose or reassign information.',
    bestFor: ['Long prompts', 'Remote modifier binding', 'Attention starvation experiments'],
    how: ['Use it when important attributes keep disappearing or binding to the wrong subject.'],
  },
  serialization: {
    title: 'SERIALIZATION DIAGNOSTICS',
    what: 'Experiments with the text representation before semantic encoding: Unicode normalization, token boundaries, strange delimiters, and related machine-ingest differences.',
    affects: 'What the tokenizer and encoder actually receive, even when two strings look similar to a human.',
    bestFor: ['Tokenizer experiments', 'Unicode mutation', 'Cross-encoder disagreement', 'Glitch-text research'],
    how: ['Treat this as an expert tool. Change one serialization variable at a time so you can tell whether the effect is real.'],
  },
};

const HELP_PATTERNS: Array<{ key: string; pattern: RegExp }> = [
  { key: 'qd_auto', pattern: /^QD AUTO$/i },
  { key: 'content_dna', pattern: /^CONTENT DNA(?:\s*\(\d+\))?$/i },
  { key: 'operators', pattern: /^OPERATORS(?:\s*\(\d+\))?$/i },
  { key: 'latent_fauna', pattern: /^LATENT FAUNA(?:\s*\(\d+\))?$/i },
  { key: 'protected_anchors', pattern: /^PROTECTED ANCHORS:?$/i },
  { key: 'mutation_mode', pattern: /^(AUTO|CURATED)$/i },
  { key: 'entropy', pattern: /Entropy Depth|Entropy S\d+/i },
  { key: 'straitjacket', pattern: /Straitjacket Constraint/i },
  { key: 'search_grounding', pattern: /^Search Grounding$/i },
  { key: 'paradox_engine', pattern: /^Paradox Engine$/i },
  { key: 'contradiction_mode', pattern: /^Contradiction Mode:?$/i },
  { key: 'modular_pipeline', pattern: /^Modular Injection Pipeline$/i },
  { key: 'high_thinking', pattern: /^High Thinking$/i },
  { key: 'seed_archive', pattern: /^Seed Archive:?$/i },
  { key: 'target_engine', pattern: /Select Target AI Engine/i },
  { key: 'suno', pattern: /^Suno Audio$/i },
  { key: 'openart', pattern: /^OpenArt$/i },
  { key: 'grok', pattern: /^Grok Image\/Video$/i },
  { key: 'midjourney', pattern: /^Midjourney \/ Flux$/i },
  { key: 'llm', pattern: /^Base LLM \/ Claude$/i },
  { key: 'latent_void', pattern: /^Latent Void$/i },
  { key: 'multimodal', pattern: /^Multi-Modal$/i },
  { key: 'compiled_recipe', pattern: /Compiled Recipe Preview/i },
  { key: 'slop_methods', pattern: /Slop Methods & Specimens/i },
  { key: 'discovery_lab', pattern: /Discovery Lab/i },
  { key: 'guidance_geometry', pattern: /Guidance Geometry/i },
  { key: 'structural_relational', pattern: /Structural Relational|Structural \/ Relational/i },
  { key: 'context_diagnostics', pattern: /Context Diagnostics/i },
  { key: 'serialization', pattern: /Serialization Diagnostics/i },
];

const openExistingControl = (id: string) => {
  const button = document.getElementById(id) as HTMLButtonElement | null;
  if (button) button.click();
};

export const DavidUXOverlay: React.FC = () => {
  const [workspace, setWorkspace] = useState<'create' | 'lab'>('create');
  const [advanced, setAdvanced] = useState<boolean>(() => {
    try {
      return localStorage.getItem('david_ui_advanced_v1') === '1';
    } catch {
      return false;
    }
  });
  const [helpOpen, setHelpOpen] = useState(false);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [helpKey, setHelpKey] = useState<string>('target_engine');
  const [helpSearch, setHelpSearch] = useState('');

  const filteredHelp = useMemo(() => {
    const q = helpSearch.trim().toLowerCase();
    if (!q) return Object.entries(HELP);
    return Object.entries(HELP).filter(([, entry]) => {
      const haystack = [entry.title, entry.what, entry.affects, ...entry.bestFor, ...entry.how, entry.goodToKnow || '']
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [helpSearch]);

  useEffect(() => {
    document.body.classList.add('david-shell');
    return () => document.body.classList.remove('david-shell');
  }, []);

  useEffect(() => {
    document.body.classList.toggle('david-advanced', advanced);
    try {
      localStorage.setItem('david_ui_advanced_v1', advanced ? '1' : '0');
    } catch {
      // localStorage can be unavailable in locked-down previews.
    }
  }, [advanced]);

  useEffect(() => {
    document.body.classList.toggle('david-lab-open', workspace === 'lab');
  }, [workspace]);

  useEffect(() => {
    const root = document.getElementById('root');
    if (!root) return;

    const scan = () => {
      const nodes = root.querySelectorAll<HTMLElement>('button, label, h2, h3, span, p');
      nodes.forEach((node) => {
        if (node.closest('.david-ux-overlay')) return;
        if (node.dataset.davidHelpKey) return;
        const text = (node.textContent || '').replace(/\s+/g, ' ').trim();
        if (!text || text.length > 70) return;
        const match = HELP_PATTERNS.find((item) => item.pattern.test(text));
        if (!match) return;
        node.dataset.davidHelpKey = match.key;
        node.classList.add('david-helpable');
      });
    };

    scan();
    const observer = new MutationObserver(scan);
    observer.observe(root, { childList: true, subtree: true });

    const interceptHelpClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      const helpable = target?.closest<HTMLElement>('[data-david-help-key]');
      if (!helpable || helpable.closest('.david-ux-overlay')) return;
      const rect = helpable.getBoundingClientRect();
      const inHelpHitbox = event.clientX >= rect.right - 26 && event.clientX <= rect.right + 2;
      if (!inHelpHitbox) return;
      const key = helpable.dataset.davidHelpKey;
      if (!key || !HELP[key]) return;
      event.preventDefault();
      event.stopPropagation();
      setHelpKey(key);
      setHelpOpen(true);
      setLibraryOpen(false);
    };

    document.addEventListener('click', interceptHelpClick, true);
    return () => {
      observer.disconnect();
      document.removeEventListener('click', interceptHelpClick, true);
    };
  }, []);

  const selectCreate = () => {
    setWorkspace('create');
    setLibraryOpen(false);
    requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: 'smooth' }));
  };

  const selectLab = () => {
    setWorkspace('lab');
    setLibraryOpen(false);
    requestAnimationFrame(() => {
      document.getElementById('discovery-lab-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };

  const clearPrompt = () => {
    const textarea = document.getElementById('operative-concept-input') as HTMLTextAreaElement | null;
    if (!textarea) return;
    const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value')?.set;
    setter?.call(textarea, '');
    textarea.dispatchEvent(new Event('input', { bubbles: true }));
    textarea.focus();
  };

  const newSession = () => {
    const ok = window.confirm('Start a new DAVID session? This clears the active draft and current in-memory workspace, but keeps saved recipes, experiments, and discoveries.');
    if (!ok) return;
    try {
      localStorage.removeItem('david_slop_active_draft_v1');
    } catch {
      // Ignore storage restrictions.
    }
    window.location.reload();
  };

  const activeHelp = HELP[helpKey] || HELP.target_engine;

  return (
    <div className="david-ux-overlay" aria-live="polite">
      <nav className="david-ux-rail" aria-label="David workspaces">
        <button type="button" className={workspace === 'create' ? 'is-active' : ''} onClick={selectCreate}>
          <Home />
          <span>CREATE</span>
        </button>
        <button type="button" onClick={() => openExistingControl('open-slop-vault-btn')}>
          <Wand2 />
          <span>MUTATE</span>
        </button>
        <button
          type="button"
          className={libraryOpen ? 'is-active library' : 'library'}
          onClick={() => {
            setLibraryOpen((v) => !v);
            setHelpOpen(false);
          }}
        >
          <Bookmark />
          <span>LIBRARY</span>
        </button>
        <button type="button" className={workspace === 'lab' ? 'is-active lab' : 'lab'} onClick={selectLab}>
          <FlaskConical />
          <span>LAB</span>
        </button>
        <div className="david-ux-rail-spacer" />
        <button type="button" className={advanced ? 'is-active advanced' : 'advanced'} onClick={() => setAdvanced((v) => !v)}>
          <Sliders />
          <span>{advanced ? 'EXPERT' : 'SIMPLE'}</span>
        </button>
        <button
          type="button"
          className={helpOpen ? 'is-active help' : 'help'}
          onClick={() => {
            setHelpOpen((v) => !v);
            setLibraryOpen(false);
          }}
        >
          <HelpCircle />
          <span>HELP</span>
        </button>
        <button type="button" className="reset" onClick={clearPrompt} title="Clear only the current prompt">
          <RotateCcw />
          <span>CLEAR</span>
        </button>
      </nav>

      {workspace === 'lab' && (
        <div className="david-workspace-banner">
          <div>
            <span className="david-display-font">LAB</span>
            <small>Diagnostics, discovery, guidance geometry & machine-ingest experiments</small>
          </div>
          <button type="button" onClick={selectCreate}>Return to Create</button>
        </div>
      )}

      {libraryOpen && (
        <aside className="david-library-drawer">
          <div className="david-drawer-head">
            <div>
              <span className="david-display-font">LIBRARY</span>
              <small>Saved brain, archives & side tools</small>
            </div>
            <button type="button" onClick={() => setLibraryOpen(false)} aria-label="Close library"><X /></button>
          </div>
          <div className="david-library-actions">
            <button type="button" onClick={() => openExistingControl('open-recipes-btn')}>
              <Bookmark /><span><strong>Slop Recipes</strong><small>Saved setups and reusable mutation recipes</small></span>
            </button>
            <button type="button" onClick={() => openExistingControl('open-experiment-memory-btn')}>
              <FlaskConical /><span><strong>Experiment Memory</strong><small>Runs, evidence and preserved accidents</small></span>
            </button>
            <button type="button" onClick={() => openExistingControl('open-manifesto-btn')}>
              <BookOpen /><span><strong>David 8 Archives</strong><small>Manifesto, source notes and system lore</small></span>
            </button>
            <button type="button" onClick={() => openExistingControl('open-zalgo-btn')}>
              <Terminal /><span><strong>Zalgo / Glitch Lab</strong><small>Unicode corruption and text mutation tools</small></span>
            </button>
            <button type="button" onClick={selectLab}>
              <Compass /><span><strong>Research Lab</strong><small>Discovery, diagnostics and technical experiments</small></span>
            </button>
          </div>
          <div className="david-library-utility">
            <button type="button" onClick={clearPrompt}><RotateCcw /> Clear prompt only</button>
            <button type="button" className="danger" onClick={newSession}><Cpu /> New session</button>
          </div>
        </aside>
      )}

      {helpOpen && (
        <aside className="david-help-drawer">
          <div className="david-drawer-head">
            <div>
              <span className="david-display-font">FIELD MANUAL</span>
              <small>Tap the tiny ? beside unfamiliar controls anywhere in David.</small>
            </div>
            <button type="button" onClick={() => setHelpOpen(false)} aria-label="Close help"><X /></button>
          </div>

          <div className="david-help-search">
            <Search />
            <input value={helpSearch} onChange={(e) => setHelpSearch(e.target.value)} placeholder="What the fuck is…" />
          </div>

          {helpSearch ? (
            <div className="david-help-results">
              {filteredHelp.map(([key, entry]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => {
                    setHelpKey(key);
                    setHelpSearch('');
                  }}
                >
                  <strong>{entry.title}</strong>
                  <small>{entry.what}</small>
                </button>
              ))}
              {filteredHelp.length === 0 && <p>No matching field-manual entry yet.</p>}
            </div>
          ) : (
            <article className="david-help-article">
              <div className="david-help-title-row">
                <HelpCircle />
                <h2>{activeHelp.title}</h2>
              </div>

              <section>
                <h3>WHAT IT IS</h3>
                <p>{activeHelp.what}</p>
              </section>
              <section>
                <h3>WHAT IT AFFECTS</h3>
                <p>{activeHelp.affects}</p>
              </section>
              <section>
                <h3>BEST FOR</h3>
                <ul>{activeHelp.bestFor.map((item) => <li key={item}>{item}</li>)}</ul>
              </section>
              <section>
                <h3>HOW TO USE IT</h3>
                <ol>{activeHelp.how.map((item) => <li key={item}>{item}</li>)}</ol>
              </section>
              {activeHelp.goodToKnow && (
                <section className="david-help-tip">
                  <div><Sparkles /> GOOD TO KNOW</div>
                  <p>{activeHelp.goodToKnow}</p>
                </section>
              )}
            </article>
          )}
        </aside>
      )}
    </div>
  );
};
