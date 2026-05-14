import ParentWorkspacePage from '@/components/workspaces/ParentWorkspacePage';

export const dynamic = 'force-dynamic';

export default function PhysicsParentsPage({
  searchParams
}: {
  searchParams: Promise<{ conversation?: string }>;
}) {
  return <ParentWorkspacePage searchParams={searchParams} subject="physics" />;
}