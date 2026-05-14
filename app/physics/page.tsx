import { notFound } from 'next/navigation';
import SubjectLandingPage from '@/components/pages/SubjectLandingPage';
import { getSubjectConfig } from '@/lib/subjects';

export default function PhysicsPage() {
  const subject = getSubjectConfig('physics');

  if (!subject) {
    notFound();
  }

  return <SubjectLandingPage subject={subject} />;
}