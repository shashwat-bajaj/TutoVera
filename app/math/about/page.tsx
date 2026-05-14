import { notFound } from 'next/navigation';
import SubjectAboutPageContent from '@/components/pages/SubjectAboutPageContent';
import { getSubjectConfig } from '@/lib/subjects';

export default function MathAboutPage() {
  const subject = getSubjectConfig('math');

  if (!subject) {
    notFound();
  }

  return <SubjectAboutPageContent subject={subject} />;
}