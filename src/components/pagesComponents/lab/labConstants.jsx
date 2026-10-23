import { Zap, Waves, Atom, Flame, Magnet, Glasses, Rocket } from "lucide-react";
import { getExperimentWorkspaceUrl } from "@/components/simulation/experimentRegistry";

export const categoryIcons = {
  "ClassicalMechanics": Zap,
  "QuantumMechanics": Atom,
  "FluidMechanics": Waves,
  "ThermoDynamics": Flame,
  "Electromagnetism and Electricity": Magnet,
  "Optics": Glasses,
  "General Relativity": Rocket
};

export const categoryNames = {
  "ClassicalMechanics": { he: "מכניקה קלאסית", en: "Classical Mechanics" },
  "QuantumMechanics": { he: "מכניקת הקוונטים", en: "Quantum Mechanics" },
  "FluidMechanics": { he: "מכניקת הנוזלים", en: "Fluid Mechanics" },
  "ThermoDynamics": { he: "תרמו-דינמיקה", en: "Thermodynamics" },
  "Electromagnetism and Electricity": { he: "אלקטרומגנטיות וחשמל", en: "Electromagnetism and Electricity" },
  "Optics": { he: "אופטיקה", en: "Optics" },
  "General Relativity": { he: "יחסות כללית", en: "General Relativity" }
};

export const groupExperimentsByCategory = (experiments = []) => {
  if (!Array.isArray(experiments)) {
    return experiments && typeof experiments === "object" ? experiments : {};
  }
  return experiments.reduce((acc, exp) => {
    if (!exp?.category) return acc;
    if (!acc[exp.category]) {
      acc[exp.category] = [];
    }
    acc[exp.category].push(exp);
    return acc;
  }, {});
};

export const getExperimentPageUrl = (slug) => getExperimentWorkspaceUrl(slug);
