import HistoryPageContent from '@/components/workspaces/HistoryPageContent';

export const dynamic = 'force-dynamic';

export default function PhysicsHistoryPage({
  searchParams
}: {
  searchParams: Promise<{ email?: string; conversation?: string }>;
}) {
  return (
    <HistoryPageContent
      searchParams={searchParams}
      historyHref="/physics/history"
      subject="physics"
    />
  );
}