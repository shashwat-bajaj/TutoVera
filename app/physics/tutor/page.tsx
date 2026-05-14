import StudentWorkspacePage from '@/components/workspaces/StudentWorkspacePage';

export const dynamic = 'force-dynamic';

export default function PhysicsTutorPage({
  searchParams
}: {
  searchParams: Promise<{ conversation?: string }>;
}) {
  return <StudentWorkspacePage searchParams={searchParams} subject="physics" />;
}