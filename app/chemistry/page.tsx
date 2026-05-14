import { notFound } from 'next/navigation';
import SubjectLandingPage from '@/components/pages/SubjectLandingPage';
import { getSubjectConfig } from '@/lib/subjects';

export default function ChemistryPage() {
  const subject = getSubjectConfig('chemistry');

  if (!subject) {
    notFound();
  }

  return <SubjectLandingPage subject={subject} />;
}