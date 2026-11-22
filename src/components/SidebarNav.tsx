import {
  LayoutDashboard,
  Link2,
  MessageSquareWarning,
  QrCode,
  ShieldCheck,
  X,
} from 'lucide-react';
import { AppScreen } from '../types/security';

interface SidebarNavProps {
  activeScreen: AppScreen;
  onSelectScreen: (screen: AppScreen) => void;
  unresolvedCount: number;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

const NAV_ITEMS: Array<{
  id: AppScreen;
  label: string;
  Icon: typeof LayoutDashboard;
}> = [
  { id: 'overview', label: 'Safety Overview', Icon: LayoutDashboard },
  { id: 'url-inspector', label: 'URL Inspector', Icon: Link2 },
  { id: 'qr-scanner', label: 'QR Code Scanner', Icon: QrCode },
  { id: 'scam-check', label: 'Scam Message Check', Icon: MessageSquareWarning },
  { id: 'protection-log', label: 'Protection Log', Icon: ShieldCheck },
];

export function SidebarNav({
  activeScreen,
  onSelectScreen,
  unresolvedCount,
  mobileOpen,
  onCloseMobile,
}: SidebarNavProps) {
  const handleNavigate = (screen: AppScreen) => {
    onSelectScreen(screen);
    onCloseMobile();
  };

  const navContent = (
    <div className="flex flex-col h-full bg-white border-r border-[#E2E8F0]">
      {/* Brand Lockup */}
      <div className="h-18 px-6 flex items-center justify-between border-b border-[#E2E8F0] shrink-0">
        <button
          type="button"
          onClick={() => handleNavigate('overview')}
          className="flex items-center gap-3 text-left focus-visible:rounded-lg"
        >
          <span className="w-9 h-9 rounded-xl bg-[#0F172A] text-white flex items-center justify-center shrink-0">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              className="w-5 h-5"
              aria-hidden="true"
            >
              <path
                d="M12 2.5L4.5 5.8V11.4C4.5 16.3 7.7 20.8 12 22C16.3 20.8 19.5 16.3 19.5 11.4V5.8L12 2.5Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinejoin="round"
              />
              <path
                d="M9 12.2L11.1 14.3L15.4 10"
                stroke="#10B981"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
          <span className="font-display text-lg font-extrabold tracking-tight text-[#0B1C30] whitespace-nowrap">
            Vigilant Clarity
          </span>
        </button>

        <button
          type="button"
          onClick={onCloseMobile}
          className="lg:hidden p-2 rounded-lg text-[#45464D] hover:bg-[#F1F5F9] min-w-[40px] min-h-[40px] flex items-center justify-center"
          aria-label="Close navigation menu"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Primary Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto" aria-label="Primary security tools">
        {NAV_ITEMS.map(({ id, label, Icon }) => {
          const isActive = activeScreen === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => handleNavigate(id)}
              aria-current={isActive ? 'page' : undefined}
              className={`w-full flex items-center justify-between gap-3 px-4 min-h-[48px] rounded-xl text-[15px] font-semibold transition-colors duration-150 whitespace-nowrap ${
                isActive
                  ? 'bg-[#0F172A] text-white'
                  : 'text-[#45464D] hover:bg-[#EFF4FF] hover:text-[#0B1C30]'
              }`}
            >
              <span className="flex items-center gap-3 min-w-0">
                <Icon
                  className={`w-5 h-5 shrink-0 ${
                    isActive ? 'text-[#6CF8BB]' : 'text-[#565E74]'
                  }`}
                  aria-hidden="true"
                />
                <span className="truncate">{label}</span>
              </span>

              {id === 'protection-log' && unresolvedCount > 0 && (
                <span
                  className={`font-mono text-xs font-semibold tabular-nums px-2 py-0.5 rounded-md shrink-0 ${
                    isActive
                      ? 'bg-white/15 text-white'
                      : 'bg-[#FEF2F2] text-[#B91C1C]'
                  }`}
                >
                  {unresolvedCount}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Quiet Account Summary Footer */}
      <div className="p-5 border-t border-[#E2E8F0] bg-[#F8FAFC]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#DCE9FF] text-[#0B1C30] font-display font-bold text-sm flex items-center justify-center shrink-0">
            MV
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-[#0B1C30] truncate">
              Margaret Vance
            </p>
            <p className="text-xs text-[#45464D] truncate">
              Home Protection · Family Circle
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Fixed Sidebar */}
      <aside className="hidden lg:block w-64 shrink-0 h-screen sticky top-0">
        {navContent}
      </aside>

      {/* Mobile Drawer Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-50 lg:hidden flex"
          role="dialog"
          aria-modal="true"
          aria-label="Navigation menu"
        >
          <div
            className="fixed inset-0 bg-[#0F172A]/60"
            onClick={onCloseMobile}
          />
          <div className="relative w-72 max-w-[85vw] h-full z-10 shadow-elevated">
            {navContent}
          </div>
        </div>
      )}
    </>
  );
}
