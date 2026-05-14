'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

type ActiveSubjectNav = {
  key: 'math' | 'physics' | 'chemistry' | 'biology';
  basePath: string;
  label: string;
};

const tutoveraLinks = [
  { href: '/subjects', label: 'Subjects' },
  { href: '/tutor', label: 'Students' },
  { href: '/parents', label: 'Parents' },
  { href: '/history', label: 'History' },
  { href: '/pricing', label: 'Pricing' },
  { href: '/about', label: 'About' },
  { href: '/contact', label: 'Contact' }
];

function getActiveSubjectNav(pathname: string): ActiveSubjectNav | null {
  if (pathname === '/math' || pathname.startsWith('/math/')) {
    return {
      key: 'math',
      basePath: '/math',
      label: 'Math'
    };
  }

  if (pathname === '/physics' || pathname.startsWith('/physics/')) {
    return {
      key: 'physics',
      basePath: '/physics',
      label: 'Physics'
    };
  }

  if (pathname === '/chemistry' || pathname.startsWith('/chemistry/')) {
    return {
      key: 'chemistry',
      basePath: '/chemistry',
      label: 'Chemistry'
    };
  }

  if (pathname === '/biology' || pathname.startsWith('/biology/')) {
    return {
      key: 'biology',
      basePath: '/biology',
      label: 'Biology'
    };
  }

  return null;
}

function getSubjectProductLinks(subject: ActiveSubjectNav) {
  return [
    { href: '/subjects', label: 'Subjects' },
    { href: subject.basePath, label: subject.label },
    { href: `${subject.basePath}/tutor`, label: 'Students' },
    { href: `${subject.basePath}/parents`, label: 'Parents' },
    { href: `${subject.basePath}/history`, label: 'History' },
    { href: `${subject.basePath}/about`, label: 'About' },
    { href: '/pricing', label: 'Pricing' }
  ];
}

export default function AdaptivePrimaryLinks() {
  const pathname = usePathname();
  const activeSubject = getActiveSubjectNav(pathname);
  const links = activeSubject ? getSubjectProductLinks(activeSubject) : tutoveraLinks;

  return (
    <>
      {links.map((link) => (
        <Link key={link.href} href={link.href}>
          {link.label}
        </Link>
      ))}
    </>
  );
}