
import { createPageUrl } from '@/utils';
import { Zap, Waves, Atom, Flame, Magnet, Glasses, Rocket } from "lucide-react";

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
  "FluidMechanics": {he: "מכניקת הנוזלים", en: "Fluid Mechanics"},
  "ThermoDynamics": {he: "תרמו-דינמיקה", en: "Thermodynamics"},
  "Electromagnetism and Electricity": { he: "אלקטרומגנטיות וחשמל", en: "Electromagnetism and electricity" },
  "Optics": { he: "אופטיקה", en: "Optics" },
  "General Relativity": { he: "יחסות כללית", en: "General Relativity" }
};

/*export const engineNames = {
    "classicalMechanics": { he: "מכניקה קלאסית" },
    "quantumMechanics": { he: "מכניקה קוונטית" },
    "fluidMechanics": { he: "מכניקת זורמים" },
    "thermodynamics": { he: "תרמודינמיקה" },
    "electromagnetism": { he: "אלקטרומגנטיות" },
    "optics": { he: "אופטיקה" },
    "relativity": { he: "יחסות" }
};*/

export const getExperimentPageUrl = (slug) => {
    const slugToPageMap = {
        'free-fall': 'FreeFallExperiment',
        'sho': 'ShoExperiment',
        'quantum-tunneling': 'QuantumTunnelingExperiment',
        'double-slit': 'DoubleSlitExperiment',
        // Add other experiments here as they are created
    };
    const pageName = slugToPageMap[slug];
    if (pageName) {
        return createPageUrl(pageName);
    }
    // Fallback for experiments not yet migrated
    return createPageUrl('Lab');
};
