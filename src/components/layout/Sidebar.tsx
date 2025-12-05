import { Link, useLocation } from 'react-router-dom';
import { Home, FolderKanban, Map, User, Flame } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useStreakStore } from '@/store/streakStore';
import { useEffect } from 'react';

const navItems = [
  { path: '/', icon: Home, label: 'Dashboard' },
  { path: '/projects', icon: FolderKanban, label: 'Projects' },
  { path: '/roadmap', icon: Map, label: 'Roadmap' },
  { path: '/profile', icon: User, label: 'Profile' },
];

export default function Sidebar() {
  const location = useLocation();
  const { currentStreak, loadStreak } = useStreakStore();

  useEffect(() => {
    loadStreak();
  }, [loadStreak]);

  return (
    <aside className="hidden md:flex flex-col w-64 h-screen bg-card border-r border-border fixed left-0 top-0">
      {/* Logo / Brand */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
            <Flame className="w-6 h-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-bold text-lg">TaskFlow</h1>
            <p className="text-xs text-muted-foreground">Stay productive</p>
          </div>
        </div>
      </div>

      {/* Streak Badge */}
      {currentStreak > 0 && (
        <div className="mx-4 mt-4 p-3 rounded-lg bg-orange-500/10 border border-orange-500/20">
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-orange-500" />
            <div>
              <p className="text-sm font-semibold text-orange-600 dark:text-orange-400">
                {currentStreak} Day Streak!
              </p>
              <p className="text-xs text-muted-foreground">Keep it going!</p>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;

          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-lg transition-all',
                isActive
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              <Icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-border">
        <p className="text-xs text-center text-muted-foreground">
          TaskFlow v1.0.0
        </p>
      </div>
    </aside>
  );
}
