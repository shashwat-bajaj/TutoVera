import { notFound } from 'next/navigation';
import SubjectAboutPageContent from '@/components/pages/SubjectAboutPageContent';
import { getSubjectConfig } from '@/lib/subjects';

export default function BiologyAboutPage() {
  const subject = getSubjectConfig('biology');

  if (!subject) {
    notFound();
  }

  return <SubjectAboutPageContent subject={subject} />;
}