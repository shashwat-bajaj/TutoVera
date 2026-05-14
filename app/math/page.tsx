import { notFound } from 'next/navigation';
import SubjectLandingPage from '@/components/pages/SubjectLandingPage';
import { getSubjectConfig } from '@/lib/subjects';

export default function MathPage() {
  const subject = getSubjectConfig('math');

  if (!subject) {
    notFound();
  }

  return <SubjectLandingPage subject={subject} />;
}