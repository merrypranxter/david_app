import React, { useEffect, useRef, useState } from 'react';
import { CheckCircle2, Info, LoaderCircle } from 'lucide-react';

type FeedbackKind = 'success' | 'info' | 'working';

type FeedbackState = {
  message: string;
  kind: FeedbackKind;
  nonce: number;
} | null;

const normalize = (value: string) => value.replace(/\s+/g, ' ').trim();

const labelForControl = (el: HTMLElement) => {
  const aria = el.getAttribute('aria-label');
  if (aria) return normalize(aria);

  const id = el.id;
  if (id) {
    const explicit = document.querySelector(`label[for="${CSS.escape(id)}"]`);
    if (explicit?.textContent) return normalize(explicit.textContent);
  }

  const parentLabel = el.closest('label');
  if (parentLabel?.textContent) return normalize(parentLabel.textContent);

  return normalize(el.textContent || 'Setting');
};

const feedbackForButton = (button: HTMLButtonElement): { message: string; kind: FeedbackKind } | null => {
  const text = normalize(button.textContent || '').toLowerCase();
  const id = button.id;

  if (id === 'synthesize-button') return { message: 'Synthesis started.', kind: 'working' };
  if (id === 'roll-seeds-btn') return { message: 'Random seeds added to this setup.', kind: 'success' };
  if (id === 'save-recipe-trigger-btn') return { message: 'Recipe save opened.', kind: 'info' };
  if (id === 'open-recipes-trigger-btn' || id === 'open-recipes-btn') return { message: 'Recipes opened.', kind: 'info' };
  if (id === 'paradox-engine-toggle') return { message: 'Paradox Engine setting changed.', kind: 'success' };
  if (id === 'toggle-instrumental-btn') return { message: 'Instrumental setting changed.', kind: 'success' };
  if (id === 'export-protocol-btn') return { message: 'Export started.', kind: 'working' };

  if (text.includes('load concept') || text.includes('replace prompt')) {
    return { message: 'Prompt replaced with the selected concept.', kind: 'success' };
  }
  if (text.includes('apply to generator')) {
    return { message: 'Mutation recipe applied to the generator.', kind: 'success' };
  }
  if (text === 'copy' || text.includes('copy prompt') || text.includes('copy concept')) {
    return { message: 'Copied to clipboard.', kind: 'success' };
  }
  if (text.includes('roll mutation')) {
    return { message: 'New mutation combination rolled.', kind: 'success' };
  }
  if (text.includes('auto-scrub')) {
    return { message: 'Banned wording scrubbed from the test text.', kind: 'success' };
  }
  if (text.includes('load entire active concept')) {
    return { message: 'Current prompt loaded into the pipeline sandbox.', kind: 'success' };
  }
  if (text.includes('clear pipeline')) {
    return { message: 'Pipeline cleared.', kind: 'success' };
  }
  if (text.includes('clear') && text.includes('history')) {
    return { message: 'History cleared.', kind: 'success' };
  }

  return null;
};

export const ActionFeedback: React.FC = () => {
  const [feedback, setFeedback] = useState<FeedbackState>(null);
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    const show = (message: string, kind: FeedbackKind = 'success') => {
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
      setFeedback({ message, kind, nonce: Date.now() });
      timeoutRef.current = window.setTimeout(() => setFeedback(null), kind === 'working' ? 2600 : 1900);
    };

    const pulse = (el: HTMLElement) => {
      el.setAttribute('data-david-pressed', 'true');
      window.setTimeout(() => el.removeAttribute('data-david-pressed'), 260);
      try {
        if ('vibrate' in navigator) navigator.vibrate(10);
      } catch {
        // Haptics are optional and unsupported on many iPhones.
      }
    };

    const onClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      const button = target?.closest('button') as HTMLButtonElement | null;
      if (!button || button.disabled) return;

      pulse(button);
      const mapped = feedbackForButton(button);
      if (mapped) window.setTimeout(() => show(mapped.message, mapped.kind), 0);
    };

    const onChange = (event: Event) => {
      const target = event.target as HTMLInputElement | HTMLSelectElement | null;
      if (!target) return;
      if (target instanceof HTMLInputElement && target.type === 'range') return;
      if (!(target instanceof HTMLInputElement || target instanceof HTMLSelectElement)) return;

      pulse(target);
      const label = labelForControl(target).replace(/[:]+$/, '');
      show(`${label || 'Setting'} updated.`, 'success');
    };

    const clarifyDestructiveLabels = () => {
      document.querySelectorAll<HTMLButtonElement>('button').forEach((button) => {
        const label = normalize(button.textContent || '');
        if (label === 'Load Concept') {
          const span = Array.from(button.querySelectorAll('span')).find((node) => normalize(node.textContent || '') === 'Load Concept');
          if (span) span.textContent = 'Replace Prompt';
          else button.childNodes.forEach((node) => {
            if (node.nodeType === Node.TEXT_NODE && normalize(node.textContent || '') === 'Load Concept') node.textContent = ' Replace Prompt';
          });
          button.title = 'Replace the main David prompt with this exact specimen';
        }
      });
    };

    clarifyDestructiveLabels();
    const observer = new MutationObserver(clarifyDestructiveLabels);
    observer.observe(document.body, { childList: true, subtree: true });

    document.addEventListener('click', onClick, true);
    document.addEventListener('change', onChange, true);

    return () => {
      observer.disconnect();
      document.removeEventListener('click', onClick, true);
      document.removeEventListener('change', onChange, true);
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    };
  }, []);

  if (!feedback) return null;

  const Icon = feedback.kind === 'working' ? LoaderCircle : feedback.kind === 'info' ? Info : CheckCircle2;

  return (
    <div
      key={feedback.nonce}
      className={`david-action-feedback david-action-feedback--${feedback.kind}`}
      role="status"
      aria-live="polite"
    >
      <Icon className={feedback.kind === 'working' ? 'animate-spin' : ''} />
      <span>{feedback.message}</span>
    </div>
  );
};
