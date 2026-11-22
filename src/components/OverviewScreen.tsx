import { useState } from 'react';
import {
  ArrowRight,
  Check,
  Phone,
  Search,
  ShieldAlert,
  ShieldCheck,
} from 'lucide-react';
import {
  AppScreen,
  ProtectionControl,
  SecurityLogEntry,
  TrustedContact,
} from '../types/security';
import { SafetyGauge } from './SafetyGauge';
import { VerdictIndicator } from './VerdictIndicator';

interface OverviewScreenProps {
  safetyScore: number;
  protections: ProtectionControl[];
  logs: SecurityLogEntry[];
  trustedContacts: TrustedContact[];
  onToggleProtection: (id: string) => void;
  onUpdateLogStatus: (id: string, status: SecurityLogEntry['status']) => void;
  onQuickAnalyze: (input: string) => void;
  onNavigate: (screen: AppScreen) => void;
}

export function OverviewScreen({
  safetyScore,
  protections,
  logs,
  trustedContacts,
  onToggleProtection,
  onUpdateLogStatus,
  onQuickAnalyze,
  onNavigate,
}: OverviewScreenProps) {
  const [quickInput, setQuickInput] = useState('');

  const activeProtectionsCount = protections.filter((p) => p.enabled).length;
  const unresolvedItems = logs.filter((l) => l.status === 'needs-review');
  const blockedCount = logs.filter((l) => l.status === 'blocked').length;

  const handleSubmitQuickScan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickInput.trim()) return;
    onQuickAnalyze(quickInput.trim());
    setQuickInput('');
  };

  const primaryAdvisor = trustedContacts[0];

  return (
    <div className="space-y-8">
      {/* Quick Triage Bar */}
      <section className="bg-white border border-[#E2E8F0] rounded-2xl p-6 sm:p-8 shadow-ambient">
        <div className="max-w-3xl">
          <h1 className="text-2xl sm:text-[32px] font-bold text-[#0B1C30] tracking-tight leading-tight text-balance">
            Check any suspicious link or text message before you click
          </h1>
          <p className="comfort-body text-base text-[#45464D] mt-2">
            Paste a website address or copy a text message below. We explain in plain language whether it is safe or trying to trick you.
          </p>
        </div>

        <form
          onSubmit={handleSubmitQuickScan}
          className="mt-6 flex flex-col sm:flex-row gap-3"
        >
          <div className="relative flex-1">
            <Search
              className="w-5 h-5 text-[#76777D] absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none"
              aria-hidden="true"
            />
            <input
              type="text"
              value={quickInput}
              onChange={(e) => setQuickInput(e.target.value)}
              placeholder="Paste a web link (e.g. paypa1-verify.xyz) or text message..."
              aria-label="Paste a web link or suspicious text message"
              className="w-full min-h-[52px] pl-12 pr-4 rounded-xl border-[1.5px] border-[#CBD5E1] bg-white text-[#0B1C30] placeholder:text-[#76777D] text-base focus:outline-none focus:border-2 focus:border-[#0F172A] transition-colors"
            />
          </div>
          <button
            type="submit"
            disabled={!quickInput.trim()}
            className="inline-flex items-center justify-center gap-2 px-6 min-h-[52px] rounded-xl bg-[#0F172A] hover:bg-[#1E293B] disabled:bg-[#CBD5E1] disabled:text-[#45464D] text-white font-semibold text-base transition-colors whitespace-nowrap shrink-0"
          >
            <span>Inspect Now</span>
            <ArrowRight className="w-4 h-4 shrink-0" aria-hidden="true" />
          </button>
        </form>
      </section>

      {/* Primary Safety Posture Gauge */}
      <section className="bg-white border border-[#E2E8F0] rounded-2xl p-6 sm:p-8 shadow-ambient">
        <SafetyGauge
          score={safetyScore}
          activeProtectionsCount={activeProtectionsCount}
          totalProtectionsCount={protections.length}
          unresolvedThreatCount={unresolvedItems.length}
        />

        {/* Single-row summary strip */}
        <div className="mt-8 pt-6 border-t border-[#E2E8F0] grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div>
            <p className="text-sm font-medium text-[#45464D]">Needs Your Review</p>
            <p className="font-mono text-2xl font-bold text-[#0B1C30] tabular-nums mt-1">
              {unresolvedItems.length}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-[#45464D]">Threats Blocked</p>
            <p className="font-mono text-2xl font-bold text-[#047857] tabular-nums mt-1">
              {blockedCount}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-[#45464D]">Trusted Advisors</p>
            <p className="font-mono text-2xl font-bold text-[#0B1C30] tabular-nums mt-1">
              {trustedContacts.length}
            </p>
          </div>
        </div>
      </section>

      {/* Main 12-Column Workspace Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left 7 Columns: Recent Threat Verdicts & Advisories */}
        <section className="lg:col-span-7 bg-white border border-[#E2E8F0] rounded-2xl p-6 sm:p-8 shadow-ambient">
          <div className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-[#E2E8F0]">
            <div>
              <h2 className="text-xl font-bold text-[#0B1C30] tracking-tight">
                Recent Verdicts &amp; Advisories
              </h2>
              <p className="text-sm text-[#45464D] mt-1">
                Plain-language guidance on recent links and messages.
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('protection-log')}
              className="text-sm font-semibold text-[#0F172A] hover:underline whitespace-nowrap shrink-0"
            >
              View full log
            </button>
          </div>

          <div className="divide-y divide-[#E2E8F0]">
            {logs.slice(0, 4).map((entry) => (
              <article key={entry.id} className="py-6 first:pt-5 last:pb-1">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <VerdictIndicator
                    verdict={entry.verdict}
                    label={
                      entry.status === 'blocked'
                        ? 'Blocked'
                        : entry.status === 'trusted'
                        ? 'Confirmed Safe'
                        : undefined
                    }
                    size="sm"
                  />
                  <span className="text-xs font-medium text-[#45464D] font-mono tabular-nums">
                    {entry.timestamp}
                  </span>
                </div>

                <h3 className="text-lg font-bold text-[#0B1C30] mt-3">
                  {entry.title}
                </h3>

                <p className="font-mono text-sm text-[#45464D] mt-1 break-all">
                  {entry.target}
                </p>

                <p className="comfort-body text-base text-[#0B1C30] mt-3">
                  {entry.explanation}
                </p>

                <div className="mt-4 flex flex-wrap items-center gap-3">
                  {entry.status === 'needs-review' && entry.verdict !== 'safe' && (
                    <button
                      type="button"
                      onClick={() => onUpdateLogStatus(entry.id, 'blocked')}
                      className="inline-flex items-center gap-2 px-4 min-h-[44px] rounded-xl bg-[#DC2626] hover:bg-[#B91C1C] text-white text-sm font-semibold transition-colors whitespace-nowrap shrink-0"
                    >
                      <ShieldAlert className="w-4 h-4 shrink-0" aria-hidden="true" />
                      <span>Block Sender</span>
                    </button>
                  )}

                  {entry.status === 'needs-review' && (
                    <button
                      type="button"
                      onClick={() => onUpdateLogStatus(entry.id, 'trusted')}
                      className="inline-flex items-center gap-2 px-4 min-h-[44px] rounded-xl border-[1.5px] border-[#E2E8F0] bg-white hover:bg-[#F1F5F9] text-[#0F172A] text-sm font-semibold transition-colors whitespace-nowrap shrink-0"
                    >
                      <ShieldCheck className="w-4 h-4 shrink-0 text-[#10B981]" aria-hidden="true" />
                      <span>Confirm Safe</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() =>
                      onNavigate(
                        entry.kind === 'sms'
                          ? 'scam-check'
                          : entry.kind === 'qr'
                          ? 'qr-scanner'
                          : 'url-inspector'
                      )
                    }
                    className="inline-flex items-center gap-1.5 px-3 min-h-[44px] rounded-xl text-sm font-semibold text-[#45464D] hover:text-[#0B1C30] hover:bg-[#EFF4FF] transition-colors whitespace-nowrap shrink-0"
                  >
                    <span>Open Inspector</span>
                    <ArrowRight className="w-4 h-4 shrink-0" aria-hidden="true" />
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* Right 5 Columns: Safeguard Checklist & Trusted Advisor */}
        <div className="lg:col-span-5 space-y-6">
          <section className="bg-white border border-[#E2E8F0] rounded-2xl p-6 sm:p-8 shadow-ambient">
            <h2 className="text-xl font-bold text-[#0B1C30] tracking-tight">
              Daily Safeguards
            </h2>
            <p className="text-sm text-[#45464D] mt-1 pb-5 border-b border-[#E2E8F0]">
              Toggle active protections to keep your safety score high.
            </p>

            <div className="divide-y divide-[#E2E8F0]">
              {protections.map((item) => (
                <label
                  key={item.id}
                  className="py-4 flex items-start gap-4 cursor-pointer group first:pt-5 last:pb-1"
                >
                  <button
                    type="button"
                    role="checkbox"
                    aria-checked={item.enabled}
                    onClick={() => onToggleProtection(item.id)}
                    className={`mt-0.5 w-[24px] h-[24px] min-w-[24px] min-h-[24px] rounded-md border-2 flex items-center justify-center transition-colors ${
                      item.enabled
                        ? 'bg-[#0F172A] border-[#0F172A] text-white'
                        : 'bg-white border-[#CBD5E1] group-hover:border-[#0F172A]'
                    }`}
                  >
                    {item.enabled && <Check className="w-4 h-4 stroke-[2.5]" aria-hidden="true" />}
                  </button>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-base font-semibold text-[#0B1C30]">
                        {item.title}
                      </span>
                    </div>
                    <p className="text-sm text-[#45464D] mt-1 leading-relaxed">
                      {item.description}
                    </p>
                    <p className="text-xs text-[#45464D] mt-1.5 font-medium">
                      {item.category} · +{item.weight} pts
                    </p>
                  </div>
                </label>
              ))}
            </div>
          </section>

          {primaryAdvisor && (
            <section className="bg-white border border-[#E2E8F0] rounded-2xl p-6 sm:p-8 shadow-ambient">
              <h2 className="text-lg font-bold text-[#0B1C30]">
                Second-Opinion Family Contact
              </h2>
              <p className="text-sm text-[#45464D] mt-1">
                Unsure about a sudden money or password request? Ask someone you trust before replying.
              </p>

              <div className="mt-4 pt-4 border-t border-[#E2E8F0] flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-base font-bold text-[#0B1C30] truncate">
                    {primaryAdvisor.name}
                  </p>
                  <p className="text-sm text-[#45464D] truncate">
                    {primaryAdvisor.relationship}
                  </p>
                  <p className="font-mono text-sm font-semibold text-[#0B1C30] mt-1 tabular-nums">
                    {primaryAdvisor.phone}
                  </p>
                </div>

                <a
                  href={`tel:${primaryAdvisor.phone.replace(/[^+\d]/g, '')}`}
                  className="inline-flex items-center gap-2 px-4 min-h-[48px] rounded-xl bg-[#10B981] hover:bg-[#059669] text-white text-sm font-semibold transition-colors whitespace-nowrap shrink-0"
                >
                  <Phone className="w-4 h-4 shrink-0" aria-hidden="true" />
                  <span>Call Advisor</span>
                </a>
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
