import HistoryPageContent from '@/components/workspaces/HistoryPageContent';

export const dynamic = 'force-dynamic';

export default function HistoryPage({
  searchParams
}: {
  searchParams: Promise<{ email?: string; conversation?: string }>;
}) {
  return <HistoryPageContent searchParams={searchParams} historyHref="/history" />;
}