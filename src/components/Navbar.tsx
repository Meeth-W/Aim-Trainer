'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Target, LayoutDashboard, BarChart3, Settings, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

export default function Navbar() {
  const pathname = usePathname();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Train', path: '/play', icon: Target },
    { name: 'Analytics', path: '/analytics', icon: BarChart3 },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  return (
    <header className="border-b border-white/10 bg-game-bg/80 backdrop-blur-md sticky top-0 z-50 transition-colors duration-300">
      {/* Mobile warning banner */}
      {isMobile && (
        <div className="bg-amber-500/10 border-b border-amber-500/20 text-amber-400 px-4 py-2 flex items-center justify-center gap-2 text-xs md:text-sm font-medium">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>Warning: Aim training requires raw mouse movements. Desktop browsers and a physical mouse are strongly recommended.</span>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="p-1.5 rounded-lg bg-game-accent/10 border border-game-accent/20 group-hover:border-game-accent/50 transition duration-300">
              <Target className="h-6 w-6 text-game-accent animate-pulse" />
            </div>
            <span className="text-xl font-bold tracking-wider text-game-ui bg-gradient-to-r from-game-ui via-game-ui to-game-accent/70 bg-clip-text">
              AIMER
            </span>
          </Link>

          {/* Nav Links */}
          <nav className="flex space-x-1 md:space-x-2">
            {navItems.map((item) => {
              const isActive = pathname === item.path;
              const Icon = item.icon;

              return (
                <Link
                  key={item.path}
                  href={item.path}
                  className={`relative flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition duration-300 ${
                    isActive
                      ? 'text-game-accent bg-game-accent/5'
                      : 'text-game-ui/60 hover:text-game-ui hover:bg-white/5'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{item.name}</span>

                  {isActive && (
                    <motion.div
                      layoutId="active-nav"
                      className="absolute bottom-0 left-0 right-0 h-[2px] bg-game-accent"
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                  )}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
    </header>
  );
}
