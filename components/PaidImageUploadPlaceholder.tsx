import UpgradePrompt from '@/components/UpgradePrompt';

type PaidImageUploadPlaceholderProps = {
  compact?: boolean;
  context?: 'student' | 'parent';
};

export default function PaidImageUploadPlaceholder({
  compact = false,
  context = 'student'
}: PaidImageUploadPlaceholderProps) {
  const isParent = context === 'parent';

  return (
    <UpgradePrompt
      compact={compact}
      featureLabel="Image support"
      recommendedPlan="plus"
      title="Image and worksheet support is included in Plus and Pro."
      description={
        isParent
          ? 'Upgrade to Plus or Pro to attach worksheet photos and image-based questions so TutoVera can help explain a child’s actual work.'
          : 'Upgrade to Plus or Pro to attach worksheet photos, screenshots, and image-based questions. Free users can continue using text-based tutoring across all subjects.'
      }
    />
  );
}