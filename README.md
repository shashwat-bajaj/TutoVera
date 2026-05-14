# TutoVera

**Solve. Understand. Improve.**

TutoVera is a calm AI learning platform with subject branches for Math, Physics, Chemistry, and Biology.

The product is designed around a simple learning flow: help users solve the immediate question, understand the reasoning behind it, and improve through follow-ups, saved history, practice, and future study tools.

## Current status

TutoVera is currently in free beta while the final multi-subject launch version is being prepared.

Active subject branches:

- Math
- Physics
- Chemistry
- Biology

Each active subject branch includes:

- Student workspace
- Parent workspace
- Subject-filtered history
- Subject-specific prompts and tutor behavior
- Shared account, settings, and saved history foundation

## Product structure

TutoVera is built as one connected platform rather than separate cloned apps for each subject.

The current route structure includes:

- `/` — TutoVera homepage
- `/tutor` — global student workspace selector
- `/parents` — global parent workspace selector
- `/math` — Math branch homepage
- `/physics` — Physics branch homepage
- `/chemistry` — Chemistry branch homepage
- `/biology` — Biology branch homepage
- `/[subject]/tutor` — student workspace
- `/[subject]/parents` — parent workspace
- `/[subject]/history` — subject-filtered history
- `/[subject]/about` — subject-specific about page
- `/history` — global saved history
- `/account` — account page
- `/settings` — learning and display preferences
- `/pricing` — global pricing page
- `/privacy` — privacy policy
- `/terms` — terms of use
- `/contact` — feedback/contact page

The global `/tutor` and `/parents` pages guide users toward the subject workspace they want instead of defaulting to one subject.

## Core features

### Student workspaces

Student workspaces are built for direct subject help, follow-up questions, explanations, diagnosis, practice prompts, and saved learning sessions.

Examples:

- Math: solving, graphing, algebra, calculus, statistics, mistake diagnosis
- Physics: concepts, formulas, variables, units, word problems
- Chemistry: reactions, balancing, stoichiometry, molarity, conversions
- Biology: vocabulary, systems, processes, comparisons, review

### Parent workspaces

Parent workspaces are designed for adults helping a child learn.

They focus on:

- simpler explanations
- parent-friendly talking points
- likely-mistake guidance
- child-level examples
- practice prompts
- guided support without jumping straight to the final answer

### Saved history

Signed-in users can save and revisit sessions.

History is available through:

- global history at `/history`
- subject-specific history at `/math/history`, `/physics/history`, `/chemistry/history`, and `/biology/history`

### Settings

Users can manage:

- theme preference
- translation language
- student default learner level
- student default tutor mode
- parent default learner level

### Answer tools

Tutor responses support:

- markdown formatting
- tables
- math rendering through KaTeX
- read aloud
- translation
- graph rendering for supported Math graph requests

### Paid feature placeholders

The app currently includes upgrade prompts and paid-only image support placeholders.

Image and worksheet support is planned as a paid feature for Plus and Pro tiers. The actual payment and entitlement system will be integrated in a later launch phase.

## Pricing direction

TutoVera is structured around three planned tiers:

- Free
- Plus
- Pro

The intended positioning is:

- Free = try TutoVera
- Plus = regular study with worksheet/photo support
- Pro = deeper revision, mistake patterns, and advanced tools

One Plus or Pro subscription should give access to both Student and Parent workspaces. Separate student and parent subscriptions are not planned for the main launch because that would make the product harder to understand and less useful for families.

Future pricing possibilities may include:

- Family plan
- Teacher plan
- School plan

## Payment direction

The payment system is not fully integrated yet.

The current likely direction is PayPal instead of Stripe. The final payment setup is expected to include:

- custom pricing page
- PayPal checkout or subscription flow
- payment/subscription webhook confirmation
- Supabase billing records
- plan-aware feature gates
- upgrade prompts
- Free / Plus / Pro entitlements

The existing plan structure in `lib/plans.ts` is intended to make the later payment integration cleaner.

## Tech stack

- Next.js App Router
- React
- TypeScript
- Supabase Auth
- Supabase database
- Gemini API
- React Markdown
- Remark GFM
- Remark Math
- Rehype KaTeX
- KaTeX
- Vercel Analytics
- Vercel Speed Insights
- Three.js / React Three Fiber dependencies reserved for future visual tools

## Important folders

- `app/`
- `components/`
- `components/pages/`
- `components/workspaces/`
- `lib/`
- `db/`

Important files include:

- `lib/subjects.ts`
- `lib/plans.ts`
- `app/api/chat/route.ts`
- `components/SubjectTutor.tsx`
- `components/workspaces/StudentWorkspacePage.tsx`
- `components/workspaces/ParentWorkspacePage.tsx`
- `components/workspaces/HistoryPageContent.tsx`
- `components/pages/PricingPageContent.tsx`
- `components/BrandMark.tsx`

## Local development

Install dependencies:

```bash
npm install