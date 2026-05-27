'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import {
  Home,
  Users,
  FileText,
  Wand2,
  BookOpen,
  Settings,
} from 'lucide-react';

const navItems = [
  { label: 'Home', href: '/', icon: Home },
  { label: 'My Groups', href: '/groups', icon: Users },
  { label: 'Assignments', href: '/assignments', icon: FileText, badge: 10 },
  { label: "AI Teacher's Toolkit", href: '/toolkit', icon: Wand2 },
  { label: 'My Library', href: '/library', icon: BookOpen },
];

export const Sidebar = () => {
  const path = usePathname();

  return (
    <aside className="w-60 min-h-screen bg-white border-r border-gray-100 flex flex-col shadow-sm">
      {/* Logo */}
      <div className="p-5 border-b border-gray-100">
        <div className="flex items-center gap-2.5">
          <Image
            src="/logo.png"
            alt="VedaAI Logo"
            width={120}
            height={36}
            priority
          />
        </div>
      </div>

      {/* Create Button */}
      <div className="p-4">
        <Link href="/assignments/new">
          <button className="w-full bg-gray-900 text-white rounded-xl py-2.5 px-4 flex items-center justify-center gap-2 text-sm font-medium hover:bg-gray-800 transition-colors shadow-sm">
            <span className="text-base">✦</span> Create Assignment
          </button>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 space-y-0.5">
        {navItems.map(({ label, href, icon: Icon, badge }) => {
          const active =
            path === href || (href !== '/' && path.startsWith(href));
          return (
            <Link key={label} href={href}>
              <div
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${
                  active
                    ? 'bg-orange-50 text-orange-600 font-semibold'
                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <Icon size={16} className={active ? 'text-orange-500' : ''} />
                <span className="flex-1">{label}</span>
                {badge && (
                  <span className="bg-orange-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium">
                    {badge}
                  </span>
                )}
              </div>
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="p-4 border-t border-gray-100 space-y-1">
        <div className="flex items-center gap-2 text-sm text-gray-500 px-3 py-2 hover:bg-gray-50 rounded-xl cursor-pointer transition-colors">
          <Settings size={15} />
          <span>Settings</span>
        </div>
        <div className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-gray-50 cursor-pointer transition-colors">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-300 to-orange-500 flex items-center justify-center text-xs font-bold text-white shadow-sm">
            D
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-900">Delhi Public School</p>
            <p className="text-xs text-gray-400">Bokaro Steel City</p>
          </div>
        </div>
      </div>
    </aside>
  );
};