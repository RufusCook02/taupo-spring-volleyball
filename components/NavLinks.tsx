'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV = [
  { href: '/', label: 'Now' },
  { href: '/draw/sat', label: 'Sat' },
  { href: '/draw/sun', label: 'Sun' },
  { href: '/division/women', label: 'Women' },
  { href: '/division/social', label: 'Social' },
  { href: '/division/comp', label: 'Comp' },
  { href: '/teams', label: 'Teams' },
  { href: '/rules', label: 'Rules' },
];

export default function NavLinks() {
  const path = usePathname();
  const active = (href: string) =>
    href === '/' ? path === '/' : path === href || (href === '/teams' && path.startsWith('/team/'));
  return (
    <ul className="flex whitespace-nowrap font-cond text-base font-semibold uppercase sm:text-[17px]">
      {NAV.map((n) => (
        <li key={n.href}>
          <Link
            href={n.href}
            aria-current={active(n.href) ? 'page' : undefined}
            className={`inline-block px-[6px] py-2.5 sm:px-3 ${active(n.href) ? 'bg-white text-navy' : 'text-[#B8C6DC] hover:text-white'}`}
          >
            {n.label}
          </Link>
        </li>
      ))}
    </ul>
  );
}
