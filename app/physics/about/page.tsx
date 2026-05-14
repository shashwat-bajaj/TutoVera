import { notFound } from 'next/navigation';
import SubjectAboutPageContent from '@/components/pages/SubjectAboutPageContent';
import { getSubjectConfig } from '@/lib/subjects';

export default function PhysicsAboutPage() {
  const subject = getSubjectConfig('physics');

  if (!subject) {
    notFound();
  }

  return <SubjectAboutPageContent subject={subject} />;
}