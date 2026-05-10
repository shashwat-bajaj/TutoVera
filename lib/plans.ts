export type PlanKey = 'free' | 'plus' | 'pro';

export type Plan = {
  key: PlanKey;
  name: string;
  badge: string;
  monthlyPrice: string;
  annualPrice: string;
  annualNote: string;
  description: string;
  audience: string;
  positioning: string;
  highlighted: boolean;
  ctaLabel: string;
  ctaHref: string;
  limits: {
    tutorRequestsPerDay: string;
    imageUploadsPerMonth: string;
    savedConversations: string;
  };
  features: string[];
  paidValue: string[];
  futureTools: string[];
};

export const plans: Plan[] = [
  {
    key: 'free',
    name: 'Free',
    badge: 'Start here',
    monthlyPrice: '$0',
    annualPrice: '$0',
    annualNote: 'Free access',
    description:
      'A simple way to try TutoVera across all subject branches with text-based tutoring and basic saved history.',
    audience: 'Best for light use, testing the platform, and occasional study support.',
    positioning: 'Try the tutor and see how the learning flow works.',
    highlighted: false,
    ctaLabel: 'Start Free',
    ctaHref: '/tutor',
    limits: {
      tutorRequestsPerDay: '10/day',
      imageUploadsPerMonth: 'Not included',
      savedConversations: 'Basic history'
    },
    features: [
      'All subject branches',
      'Student workspaces',
      'Parent workspaces',
      'Text-based tutoring',
      'Basic saved history',
      'Basic read aloud access',
      'Basic translation access',
      'Math graphing',
      'Tables and math formatting',
      'No image upload or worksheet-photo support'
    ],
    paidValue: [
      'Good for trying the platform',
      'Helpful for occasional text questions',
      'Limited enough that regular users have a reason to upgrade'
    ],
    futureTools: [
      'Upgrade for worksheet/photo support',
      'Upgrade for deeper revision workflows',
      'Upgrade for higher usage and longer saved history'
    ]
  },
  {
    key: 'plus',
    name: 'Plus',
    badge: 'Most popular',
    monthlyPrice: '$9.99',
    annualPrice: '$99.99/year',
    annualNote: 'Annual plan saves about 2 months',
    description:
      'For regular students and parents who want worksheet/photo support, higher usage, guided practice, and longer saved history.',
    audience: 'Best for students, parents, and families using TutoVera regularly.',
    positioning: 'The main study plan for regular homework, worksheets, and guided practice.',
    highlighted: true,
    ctaLabel: 'Subscribe with PayPal',
    ctaHref: '/pricing',
    limits: {
      tutorRequestsPerDay: '100/day',
      imageUploadsPerMonth: '100/month',
      savedConversations: 'Extended history'
    },
    features: [
      'Everything in Free',
      'Higher tutor request limits',
      'Image uploads with monthly cap',
      'Worksheet/photo help with monthly cap',
      'Extended saved history',
      'Mistake diagnosis',
      'Practice generation',
      'Parent support across all subjects',
      'Higher read aloud and translation access',
      'Better fit for regular study routines'
    ],
    paidValue: [
      'Upload worksheet photos and screenshots',
      'Turn mistakes into guided explanations',
      'Generate practice from the topic or question',
      'Keep more study history across subjects'
    ],
    futureTools: [
      'Worksheet/photo support',
      'Practice set generation',
      'Mistake-focused follow-up prompts',
      'Stronger parent support workflows'
    ]
  },
  {
    key: 'pro',
    name: 'Pro',
    badge: 'Deep study',
    monthlyPrice: '$19.99',
    annualPrice: '$199.99/year',
    annualNote: 'Annual plan saves about 2 months',
    description:
      'For heavier study, larger worksheet/photo usage, deeper revision workflows, and stronger access to advanced subject tools.',
    audience: 'Best for serious users, heavier study periods, and advanced learning workflows.',
    positioning: 'The deeper study system for revision, mistake patterns, and advanced tools.',
    highlighted: false,
    ctaLabel: 'Subscribe with PayPal',
    ctaHref: '/pricing',
    limits: {
      tutorRequestsPerDay: '300/day',
      imageUploadsPerMonth: '500/month',
      savedConversations: 'Highest history allowance'
    },
    features: [
      'Everything in Plus',
      'Highest tutor request limits',
      'Larger image and worksheet cap',
      'Advanced worksheet/photo help',
      'Longer session context',
      'Advanced subject tools',
      'Deeper revision workflows',
      'Advanced access to simulators and diagrams',
      'Best access for future premium tools',
      'Generous high-usage limits without calling it unlimited'
    ],
    paidValue: [
      'Build revision from saved sessions',
      'Track repeated mistake patterns over time',
      'Generate deeper practice and review flows',
      'Use the highest access tier for advanced tools'
    ],
    futureTools: [
      'Mistake Map',
      'Revision Mode',
      'Exam Prep Mode',
      'Advanced diagrams and simulators',
      'Deeper subject-specific toolkits'
    ]
  }
];

export function getPlan(planKey: PlanKey) {
  return plans.find((plan) => plan.key === planKey) || plans[0];
}

export function getPaidPlans() {
  return plans.filter((plan) => plan.key !== 'free');
}

export function planAllowsImageProcessing(planKey: PlanKey) {
  return planKey === 'plus' || planKey === 'pro';
}