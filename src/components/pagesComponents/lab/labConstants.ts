import { Zap, Waves, Atom, Flame, Magnet, Glasses, Rocket, type LucideIcon } from "lucide-react";
import { getExperimentWorkspaceUrl } from "@/simulation/experimentRegistry";
import type { Bilingual } from "@/types/experiment";

export const categoryIcons: Record<string, LucideIcon> = {
  "ClassicalMechanics": Zap,
  "QuantumMechanics": Atom,
  "FluidMechanics": Waves,
  "ThermoDynamics": Flame,
  "Electromagnetism and Electricity": Magnet,
  "Optics": Glasses,
  "General Relativity": Rocket
};

export const categoryNames: Record<string, Bilingual> = {
  "ClassicalMechanics": { he: "מכניקה קלאסית", en: "Classical Mechanics" },
  "QuantumMechanics": { he: "מכניקת הקוונטים", en: "Quantum Mechanics" },
  "FluidMechanics": { he: "מכניקת הנוזלים", en: "Fluid Mechanics" },
  "ThermoDynamics": { he: "תרמו-דינמיקה", en: "Thermodynamics" },
  "Electromagnetism and Electricity": { he: "אלקטרומגנטיות וחשמל", en: "Electromagnetism and Electricity" },
  "Optics": { he: "אופטיקה", en: "Optics" },
  "General Relativity": { he: "יחסות כללית", en: "General Relativity" }
};

export const groupExperimentsByCategory = <T extends { category?: string | null }>(
  experiments: T[] | Record<string, T[]> | null | undefined = []
): Record<string, T[]> => {
  if (!Array.isArray(experiments)) {
    return experiments && typeof experiments === "object" ? experiments : {};
  }
  return experiments.reduce<Record<string, T[]>>((acc, exp) => {
    if (!exp?.category) return acc;
    if (!acc[exp.category]) {
      acc[exp.category] = [];
    }
    acc[exp.category].push(exp);
    return acc;
  }, {});
};

export const getExperimentPageUrl = (slug: string | null | undefined): string => getExperimentWorkspaceUrl(slug);

export function matchesExperimentSearch(
  exp: { slug?: string | null; tags?: string[] | null; i18n_texts?: { he?: { title?: string | null }; en?: { title?: string | null } } | null },
  searchTerm: string
): boolean {
  if (!searchTerm) return true;
  const term = searchTerm.toLowerCase().trim();
  if (!term) return true;

  const heTitle = exp.i18n_texts?.he?.title?.toLowerCase();
  const enTitle = exp.i18n_texts?.en?.title?.toLowerCase();
  const slug = exp.slug?.toLowerCase();
  const tags = exp.tags || [];

  return Boolean(
    (heTitle && heTitle.includes(term)) ||
    (enTitle && enTitle.includes(term)) ||
    (slug && slug.includes(term)) ||
    tags.some(tag => tag.toLowerCase().includes(term))
  );
}
