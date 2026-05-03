import type { TranslationKeys } from './i18n/en';

export type StageColor = 'stone' | 'amber' | 'blue' | 'emerald' | 'violet' | 'rose';

export interface Stage {
  id: number;
  code: string;
  label_key: string | null;
  name: string;
  description: string | null;
  parent_id: number | null;
  sort_order: number;
  icon: string;
  color: StageColor;
  is_initial: boolean;
  is_terminal: boolean;
  is_system: boolean;
  order_count?: number;
}

export interface StageNode extends Stage {
  children: StageNode[];
}

export const STAGE_COLORS: StageColor[] = ['stone', 'amber', 'blue', 'emerald', 'violet', 'rose'];

export const STAGE_COLOR_LABEL_KEYS: Record<StageColor, TranslationKeys> = {
  stone: 'color_stone',
  amber: 'color_amber',
  blue: 'color_blue',
  emerald: 'color_emerald',
  violet: 'color_violet',
  rose: 'color_rose',
};

export const colorClasses = (
  color: StageColor
): { bg: string; text: string; border: string; ring: string; chip: string } => {
  switch (color) {
    case 'amber':
      return {
        bg: 'bg-amber-50 dark:bg-amber-500/10',
        text: 'text-amber-700 dark:text-amber-300',
        border: 'border-amber-200 dark:border-amber-500/30',
        ring: 'ring-amber-200 dark:ring-amber-500/40',
        chip: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300',
      };
    case 'blue':
      return {
        bg: 'bg-blue-50 dark:bg-blue-500/10',
        text: 'text-blue-700 dark:text-blue-300',
        border: 'border-blue-200 dark:border-blue-500/30',
        ring: 'ring-blue-200 dark:ring-blue-500/40',
        chip: 'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300',
      };
    case 'emerald':
      return {
        bg: 'bg-emerald-50 dark:bg-emerald-500/10',
        text: 'text-emerald-700 dark:text-emerald-300',
        border: 'border-emerald-200 dark:border-emerald-500/30',
        ring: 'ring-emerald-200 dark:ring-emerald-500/40',
        chip: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
      };
    case 'violet':
      return {
        bg: 'bg-violet-50 dark:bg-violet-500/10',
        text: 'text-violet-700 dark:text-violet-300',
        border: 'border-violet-200 dark:border-violet-500/30',
        ring: 'ring-violet-200 dark:ring-violet-500/40',
        chip: 'bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300',
      };
    case 'rose':
      return {
        bg: 'bg-rose-50 dark:bg-rose-500/10',
        text: 'text-rose-700 dark:text-rose-300',
        border: 'border-rose-200 dark:border-rose-500/30',
        ring: 'ring-rose-200 dark:ring-rose-500/40',
        chip: 'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300',
      };
    case 'stone':
    default:
      return {
        bg: 'bg-stone-50 dark:bg-stone-500/10',
        text: 'text-stone-700 dark:text-stone-300',
        border: 'border-stone-200 dark:border-stone-500/30',
        ring: 'ring-stone-200 dark:ring-stone-500/40',
        chip: 'bg-stone-100 text-stone-700 dark:bg-stone-500/15 dark:text-stone-300',
      };
  }
};

export function flattenLeaves(tree: StageNode[]): StageNode[] {
  const out: StageNode[] = [];
  const visit = (node: StageNode) => {
    if (node.children.length === 0) out.push(node);
    else node.children.forEach(visit);
  };
  tree.forEach(visit);
  return out;
}

export function flattenAll(tree: StageNode[]): StageNode[] {
  const out: StageNode[] = [];
  const visit = (node: StageNode) => {
    out.push(node);
    node.children.forEach(visit);
  };
  tree.forEach(visit);
  return out;
}

export function stageDisplayName(s: Stage, t: (k: TranslationKeys) => string): string {
  if (s.label_key) {
    // label_key matches a TranslationKeys value when it points at a system stage.
    const translated = t(s.label_key as TranslationKeys);
    if (translated && translated !== s.label_key) return translated;
  }
  return s.name;
}

/**
 * Build a depth-first ordered list of leaf descendants.
 * Used by Kanban-style displays so a parent stage like "Manufacturing"
 * is replaced by its children (cutting/CNC/finishing/packing) in order.
 */
export function leafColumns(tree: StageNode[]): StageNode[] {
  return flattenLeaves(tree);
}
