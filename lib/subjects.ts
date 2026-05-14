export type SubjectKey = "math" | "physics" | "chemistry" | "biology";

export type SubjectStatus = "active" | "beta" | "coming-soon";

export type SubjectConfig = {
  key: SubjectKey;
  name: string;
  shortName: string;
  status: SubjectStatus;
  path: string;
  description: string;
  theme: {
    accent: string;
    accentSoft: string;
    gradientFrom: string;
    gradientTo: string;
    backgroundGlow: string;
  };
  tutor: {
    label: string;
    placeholder: string;
    systemPrompt: string;
    examplePrompts: string[];
  };
  features: {
    stepByStep: boolean;
    graphing: boolean;
    formulas: boolean;
    diagrams: boolean;
    labReasoning: boolean;
  };
};

export const subjects: Record<SubjectKey, SubjectConfig> = {
  math: {
    key: "math",
    name: "Math",
    shortName: "Math",
    status: "active",
    path: "/math",
    description:
      "Step-by-step support for algebra, calculus, statistics, discrete math, and problem solving.",
    theme: {
      accent: "#7C3AED",
      accentSoft: "rgba(124, 58, 237, 0.16)",
      gradientFrom: "#7C3AED",
      gradientTo: "#06B6D4",
      backgroundGlow: "rgba(124, 58, 237, 0.22)",
    },
    tutor: {
      label: "TutoVera Math",
      placeholder: "Ask a math question or paste the problem you are working on...",
      systemPrompt:
        "You are TutoVera Math, a supportive AI math tutor. Explain clearly, guide step by step, and help the learner understand the reasoning rather than only giving the answer.",
      examplePrompts: [
        "Solve this quadratic step by step",
        "Explain derivatives simply",
        "Help me understand probability",
        "Check my algebra work",
      ],
    },
    features: {
      stepByStep: true,
      graphing: true,
      formulas: true,
      diagrams: false,
      labReasoning: false,
    },
  },

  physics: {
    key: "physics",
    name: "Physics",
    shortName: "Physics",
    status: "active",
    path: "/physics",
    description:
      "Conceptual and equation-based support for mechanics, energy, waves, electricity, and modern physics.",
    theme: {
      accent: "#2563EB",
      accentSoft: "rgba(37, 99, 235, 0.16)",
      gradientFrom: "#2563EB",
      gradientTo: "#14B8A6",
      backgroundGlow: "rgba(37, 99, 235, 0.22)",
    },
    tutor: {
      label: "TutoVera Physics",
      placeholder: "Ask a physics question or paste a word problem...",
      systemPrompt:
        "You are TutoVera Physics, a supportive AI physics tutor. Explain concepts, equations, variables, units, and problem-solving steps clearly.",
      examplePrompts: [
        "Explain Newton's second law",
        "Help me solve projectile motion",
        "Explain conservation of energy",
        "How do I choose the right formula?",
      ],
    },
    features: {
      stepByStep: true,
      graphing: false,
      formulas: true,
      diagrams: true,
      labReasoning: false,
    },
  },

  chemistry: {
    key: "chemistry",
    name: "Chemistry",
    shortName: "Chem",
    status: "active",
    path: "/chemistry",
    description:
      "Support for chemical equations, stoichiometry, bonding, reactions, acids and bases, and lab-style reasoning.",
    theme: {
      accent: "#10B981",
      accentSoft: "rgba(16, 185, 129, 0.16)",
      gradientFrom: "#10B981",
      gradientTo: "#F59E0B",
      backgroundGlow: "rgba(16, 185, 129, 0.22)",
    },
    tutor: {
      label: "TutoVera Chemistry",
      placeholder: "Ask a chemistry question or paste a reaction...",
      systemPrompt:
        "You are TutoVera Chemistry, a supportive AI chemistry tutor. Explain chemical reasoning, equations, units, conversions, reactions, and problem-solving steps clearly.",
      examplePrompts: [
        "Balance this chemical equation",
        "Explain stoichiometry",
        "Help me understand molarity",
        "Explain acids and bases simply",
      ],
    },
    features: {
      stepByStep: true,
      graphing: false,
      formulas: true,
      diagrams: true,
      labReasoning: true,
    },
  },

  biology: {
    key: "biology",
    name: "Biology",
    shortName: "Bio",
    status: "active",
    path: "/biology",
    description:
      "Support for cells, genetics, evolution, anatomy, physiology, ecology, and biological processes.",
    theme: {
      accent: "#22C55E",
      accentSoft: "rgba(34, 197, 94, 0.16)",
      gradientFrom: "#22C55E",
      gradientTo: "#84CC16",
      backgroundGlow: "rgba(34, 197, 94, 0.22)",
    },
    tutor: {
      label: "TutoVera Biology",
      placeholder: "Ask a biology question or describe the topic you are studying...",
      systemPrompt:
        "You are TutoVera Biology, a supportive AI biology tutor. Explain biological systems, vocabulary, processes, structures, functions, and relationships clearly.",
      examplePrompts: [
        "Explain mitosis vs meiosis",
        "Help me understand DNA replication",
        "Explain natural selection",
        "Summarize cellular respiration",
      ],
    },
    features: {
      stepByStep: true,
      graphing: false,
      formulas: false,
      diagrams: true,
      labReasoning: false,
    },
  },
};

export const subjectKeys = Object.keys(subjects) as SubjectKey[];

export function getSubjectConfig(subject: string): SubjectConfig | null {
  if (subject in subjects) {
    return subjects[subject as SubjectKey];
  }

  return null;
}

export function isSubjectKey(subject: string): subject is SubjectKey {
  return subject in subjects;
}

export function getActiveSubjects(): SubjectConfig[] {
  return subjectKeys
    .map((key) => subjects[key])
    .filter((subject) => subject.status === "active");
}