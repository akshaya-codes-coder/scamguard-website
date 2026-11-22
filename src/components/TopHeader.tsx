import { Eye, Link2, Menu } from 'lucide-react';
import { AppScreen } from '../types/security';

interface TopHeaderProps {
  activeScreen: AppScreen;
  comfortReading: boolean;
  onToggleComfortReading: () => void;
  onQuickInspectUrl: () => void;
  onOpenMobileMenu: () => void;
}

const SCREEN_TITLES: Record<AppScreen, string> = {
  overview: 'Safety Overview',
  'url-inspector': 'Phishing URL Inspector',
  'qr-scanner': 'QR Code Scanner',
  'scam-check': 'SMS & Email Scam Check',
  'protection-log': 'Protection Log & Trusted Circle',
};

export function TopHeader({
  activeScreen,
  comfortReading,
  onToggleComfortReading,
  onQuickInspectUrl,
  onOpenMobileMenu,
}: TopHeaderProps) {
  return (
    <header className="sticky top-0 z-30 bg-[#F8F9FF]/95 backdrop-blur-sm border-b border-[#E2E8F0]">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-8 h-18 flex items-center justify-between gap-4">
        {/* Left: Mobile menu button + Breadcrumb */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={onOpenMobileMenu}
            className="lg:hidden min-w-[44px] min-h-[44px] rounded-xl border border-[#E2E8F0] bg-white text-[#0B1C30] flex items-center justify-center hover:bg-[#F1F5F9] shrink-0"
            aria-label="Open navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 text-sm min-w-0">
            <span className="hidden sm:inline text-[#45464D] font-medium whitespace-nowrap">
              Security Workspace
            </span>
            <span className="hidden sm:inline text-[#CBD5E1]" aria-hidden="true">
              /
            </span>
            <span className="font-display font-bold text-[#0B1C30] text-base sm:text-lg truncate">
              {SCREEN_TITLES[activeScreen]}
            </span>
          </div>
        </div>

        {/* Right: Comfort Reading Toggle + Primary Action */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={onToggleComfortReading}
            aria-pressed={comfortReading}
            className={`inline-flex items-center gap-2 px-3.5 min-h-[44px] rounded-xl text-sm font-semibold border transition-colors whitespace-nowrap shrink-0 ${
              comfortReading
                ? 'bg-[#EFF4FF] border-[#0F172A] text-[#0B1C30]'
                : 'bg-white border-[#E2E8F0] text-[#45464D] hover:bg-[#F1F5F9] hover:text-[#0B1C30]'
            }`}
            title="Increase reading text size for easier scanning"
          >
            <Eye className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span className="hidden sm:inline">
              {comfortReading ? 'Large Text: On' : 'Large Text'}
            </span>
          </button>

          {activeScreen !== 'url-inspector' && (
            <button
              type="button"
              onClick={onQuickInspectUrl}
              className="inline-flex items-center gap-2 px-4 sm:px-5 min-h-[44px] sm:min-h-[48px] rounded-xl bg-[#0F172A] hover:bg-[#1E293B] text-white text-sm font-semibold transition-colors whitespace-nowrap shrink-0"
            >
              <Link2 className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>Inspect a Link</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
