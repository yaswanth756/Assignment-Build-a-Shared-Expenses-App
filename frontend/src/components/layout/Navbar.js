'use client';
import Link from 'next/link';
import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { usePathname } from 'next/navigation';

export default function Navbar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navLinks = [
    { name: 'Home', href: '/' },
    { name: 'Dashboard', href: '/dashboard' },
    { name: 'Groups', href: '/dashboard' },
  ];

  const getIsActive = (link) => {
    if (link.name === 'Home') return pathname === '/';
    if (link.name === 'Groups') return pathname.startsWith('/groups');
    return pathname === link.href;
  };

  return (
    <nav className="fixed top-0 left-0 w-full z-40 p-4 md:p-6 flex items-center justify-between pointer-events-none">
      {/* Left: Logo */}
      <div className="pointer-events-auto">
        <Link href="/" className="font-anton text-2xl md:text-3xl uppercase tracking-wider text-shiraz-950 hover:text-shiraz-700 transition-colors">
          SplitBuddy
        </Link>
      </div>

      {/* Center: Pill-shaped Nav (Desktop) */}
      {user && (
        <div className="pointer-events-auto hidden md:flex items-center gap-1 px-2 py-1.5 rounded-full bg-white/60 backdrop-blur-[20px] border border-shiraz-900/10 shadow-lg">
          {navLinks.map((link) => {
            const isActive = getIsActive(link);
            return (
              <Link 
                key={link.name} 
                href={link.href}
                className={`px-5 py-2 rounded-full text-[10px] uppercase tracking-[0.15em] font-bold transition-all duration-300 ${
                  isActive 
                    ? 'bg-shiraz-950 text-white shadow-md' 
                    : 'text-shiraz-700 hover:text-shiraz-950 hover:bg-shiraz-50'
                }`}
              >
                {link.name}
              </Link>
            );
          })}
        </div>
      )}

      {/* Right: Actions */}
      <div className="pointer-events-auto flex items-center gap-3">
        {user ? (
          <>
            {/* Mobile hamburger */}
            <button 
              onClick={() => setMobileOpen(!mobileOpen)} 
              className="md:hidden bg-white w-10 h-10 rounded-full flex items-center justify-center border border-shiraz-200 shadow-sm"
            >
              <span className="text-shiraz-950 text-lg">{mobileOpen ? '✕' : '☰'}</span>
            </button>

            <button 
              onClick={logout}
              className="hidden md:block bg-white px-5 py-2 rounded-full text-[10px] uppercase tracking-[0.15em] font-bold text-shiraz-950 hover:bg-shiraz-50 border border-shiraz-200 transition-colors shadow-sm"
            >
              Logout
            </button>
            <div className="bg-shiraz-950 text-white w-9 h-9 md:w-10 md:h-10 rounded-full flex items-center justify-center text-xs font-bold uppercase shadow-md">
              {user.name ? user.name.charAt(0) : 'U'}
            </div>
          </>
        ) : (
          <>
            <Link href="/login" className="bg-white px-5 py-2 rounded-full text-[10px] uppercase tracking-[0.15em] font-bold text-shiraz-950 hover:bg-shiraz-50 border border-shiraz-200 transition-colors shadow-sm">
              Login
            </Link>
            <Link href="/register" className="bg-shiraz-950 px-5 py-2 rounded-full text-[10px] uppercase tracking-[0.15em] font-bold text-white hover:bg-shiraz-800 transition-colors shadow-md">
              Register
            </Link>
          </>
        )}
      </div>

      {/* Mobile Dropdown */}
      {user && mobileOpen && (
        <div className="pointer-events-auto absolute top-full left-0 w-full px-4 pt-2 md:hidden">
          <div className="bg-white/95 backdrop-blur-xl rounded-3xl border border-shiraz-100 shadow-xl p-4 flex flex-col gap-2">
            {navLinks.map((link) => {
              const isActive = getIsActive(link);
              return (
                <Link 
                  key={link.name} 
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className={`px-5 py-3 rounded-2xl text-xs uppercase tracking-[0.15em] font-bold transition-all ${
                    isActive 
                      ? 'bg-shiraz-950 text-white' 
                      : 'text-shiraz-700 hover:bg-shiraz-50'
                  }`}
                >
                  {link.name}
                </Link>
              );
            })}
            <hr className="border-shiraz-100 my-1" />
            <button 
              onClick={() => { logout(); setMobileOpen(false); }}
              className="px-5 py-3 rounded-2xl text-xs uppercase tracking-[0.15em] font-bold text-shiraz-500 hover:bg-shiraz-50 text-left"
            >
              Logout
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}
