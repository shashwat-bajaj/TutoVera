import { notFound } from 'next/navigation';
import SubjectLandingPage from '@/components/pages/SubjectLandingPage';
import { getSubjectConfig } from '@/lib/subjects';

export default function BiologyPage() {
  const subject = getSubjectConfig('biology');

  if (!subject) {
    notFound();
  }

  return <SubjectLandingPage subject={subject} />;
}