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
      'Basic personalized tutor memory for signed-in users',
      'Basic read aloud access',
      'Basic translation access',
      'Math graphing',
      'Tables and math formatting',
      'No worksheet or image upload support'
    ],
    paidValue: [
      'Good for trying the platform',
      'Helpful for occasional text questions',
      'Basic signed-in continuity through saved sessions and tutor memory'
    ],
    futureTools: [
      'Upgrade for worksheet and image support',
      'Upgrade for Revision Review and Mistake Review',
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
      'For regular students and parents who want worksheet and image support, higher usage, guided practice, and longer saved history.',
    audience: 'Best for students, parents, and families using TutoVera regularly.',
    positioning: 'The main study plan for regular homework, worksheets, images, and guided practice.',
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
      'Worksheet and screenshot help',
      'Extended saved history',
      'Personalized tutor memory for signed-in study continuity',
      'Mistake diagnosis in tutor responses',
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
      'Worksheet and image support',
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
      'For heavier study, larger worksheet and image usage, deeper revision workflows, Mistake Review, Revision Review, and stronger access to advanced subject tools.',
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
      'Larger worksheet and image cap',
      'Advanced worksheet and image help',
      'Longer session continuity',
      'Revision Review from saved sessions',
      'Mistake Review from saved sessions',
      'Advanced subject tools as available',
      'Advanced access to diagrams and simulators as added',
      'Generous high-usage limits'
    ],
    paidValue: [
      'Build revision reviews from saved sessions',
      'Create mistake reviews with corrected reasoning and targeted drills',
      'Generate deeper practice and review flows',
      'Use the highest access tier for advanced tools'
    ],
    futureTools: [
      'Revision Review',
      'Mistake Review',
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