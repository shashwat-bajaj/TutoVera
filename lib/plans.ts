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
      'Start with simple text-based tutoring across subjects, student and parent workspaces, and basic saved history.',
    audience: 'Best for trying TutoVera, light questions, and occasional study support.',
    positioning: 'Text tutoring for getting started.',
    highlighted: false,
    ctaLabel: 'Start Free',
    ctaHref: '/tutor',
    limits: {
      tutorRequestsPerDay: '10/day',
      imageUploadsPerMonth: 'Not included',
      savedConversations: 'Basic history'
    },
    features: [
      'Text-based tutoring',
      'Student workspace',
      'Parent workspace',
      'All subject branches',
      'Math graphing',
      'Basic saved history'
    ],
    paidValue: [
      'Ask text questions across subjects',
      'Use student and parent workspaces',
      'Try TutoVera before upgrading'
    ],
    futureTools: [
      'Upgrade for worksheet/image uploads',
      'Upgrade for higher request limits',
      'Upgrade for deeper review tools'
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
      'Add worksheet and image support for regular homework, screenshots, and guided practice with higher limits.',
    audience: 'Best for regular students, parents, homework support, and worksheet help.',
    positioning: 'Worksheet and image support for regular study.',
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
      'Worksheet and image uploads',
      'Screenshot help',
      'Higher tutor request limits',
      'Extended saved history',
      'Practice generation'
    ],
    paidValue: [
      'Upload worksheet photos and screenshots',
      'Get help from visible work',
      'Use TutoVera regularly without hitting Free limits'
    ],
    futureTools: [
      'Worksheet and screenshot support',
      'Guided practice from uploaded work',
      'Stronger study continuity'
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
      'Unlock deeper review tools for saved sessions, heavier usage, larger worksheet support, and advanced study workflows.',
    audience: 'Best for heavier study periods, deeper review, and high-usage learners.',
    positioning: 'Revision and mistake review for deeper study.',
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
      'Revision Review from saved sessions',
      'Mistake Review from saved sessions',
      'Highest tutor request limits',
      'Larger image upload allowance',
      'Highest saved-history allowance'
    ],
    paidValue: [
      'Turn saved sessions into revision reviews',
      'Review mistakes with corrected reasoning',
      'Use the highest limits for heavier study'
    ],
    futureTools: [
      'Revision Review',
      'Mistake Review',
      'Exam prep workflows',
      'Advanced subject tools'
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