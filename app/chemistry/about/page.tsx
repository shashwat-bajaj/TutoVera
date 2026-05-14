import { notFound } from 'next/navigation';
import SubjectAboutPageContent from '@/components/pages/SubjectAboutPageContent';
import { getSubjectConfig } from '@/lib/subjects';

export default function ChemistryAboutPage() {
  const subject = getSubjectConfig('chemistry');

  if (!subject) {
    notFound();
  }

  return <SubjectAboutPageContent subject={subject} />;
}