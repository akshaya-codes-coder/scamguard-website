import { ShieldAlert, ShieldCheck, AlertTriangle } from 'lucide-react';

interface SafetyGaugeProps {
  score: number;
  activeProtectionsCount: number;
  totalProtectionsCount: number;
  unresolvedThreatCount: number;
}

export function SafetyGauge({
  score,
  activeProtectionsCount,
  totalProtectionsCount,
  unresolvedThreatCount,
}: SafetyGaugeProps) {
  const clampedScore = Math.max(1, Math.min(100, Math.round(score)));
  const radius = 78;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (clampedScore / 100) * circumference;

  const isSafe = clampedScore >= 80 && unresolvedThreatCount === 0;
  const isAtRisk = clampedScore < 55 || unresolvedThreatCount > 0;

  const strokeColor = isAtRisk
    ? '#EF4444'
    : isSafe
    ? '#10B981'
    : '#F59E0B';

  const trackBg = isAtRisk
    ? '#FEE2E2'
    : isSafe
    ? '#D1FAE5'
    : '#FEF3C7';

  const statusText = isAtRisk
    ? 'Action Recommended'
    : isSafe
    ? 'Strong Protection'
    : 'Moderate Posture';

  const statusColorClass = isAtRisk
    ? 'text-[#B91C1C]'
    : isSafe
    ? 'text-[#047857]'
    : 'text-[#B45309]';

  const StatusIcon = isAtRisk
    ? ShieldAlert
    : isSafe
    ? ShieldCheck
    : AlertTriangle;

  return (
    <div className="flex flex-col sm:flex-row items-center gap-8">
      {/* Radial SVG Safety Gauge */}
      <div className="relative w-48 h-48 shrink-0 flex items-center justify-center">
        <svg
          className="w-full h-full -rotate-90"
          viewBox="0 0 180 180"
          role="img"
          aria-label={`Device safety posture score ${clampedScore} out of 100`}
        >
          <circle
            cx="90"
            cy="90"
            r={radius}
            fill="none"
            stroke={trackBg}
            strokeWidth="14"
          />
          <circle
            cx="90"
            cy="90"
            r={radius}
            fill="none"
            stroke={strokeColor}
            strokeWidth="14"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            style={{
              transition:
                'stroke-dashoffset 450ms cubic-bezier(0.16, 1, 0.3, 1), stroke 250ms ease',
            }}
          />
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="font-mono text-4xl font-bold tracking-tight text-[#0B1C30] tabular-nums">
            {clampedScore}
          </span>
          <span className="text-xs font-semibold text-[#45464D] mt-0.5 tabular-nums">
            of 100 Safety
          </span>
        </div>
      </div>

      {/* Gauge Explanation & Plain-Language Summary */}
      <div className="flex-1 min-w-0 text-center sm:text-left">
        <div className={`inline-flex items-center gap-2 font-semibold text-base ${statusColorClass}`}>
          <StatusIcon className="w-5 h-5 shrink-0" aria-hidden="true" />
          <span>{statusText}</span>
        </div>

        <h2 className="text-2xl font-bold text-[#0B1C30] tracking-tight mt-2 text-balance">
          {unresolvedThreatCount > 0
            ? `${unresolvedThreatCount} suspicious item${unresolvedThreatCount > 1 ? 's' : ''} waiting for your review`
            : isSafe
            ? 'Your device and links are actively shielded'
            : 'Enable remaining safeguards to raise your score'}
        </h2>

        <p className="comfort-body text-base text-[#45464D] mt-2 max-w-xl">
          {unresolvedThreatCount > 0
            ? 'Review flagged links or messages below and block any sender you do not recognize.'
            : 'Your safety score reflects active link screening, message filters, and account verification habits.'}
        </p>

        <div className="mt-5 pt-4 border-t border-[#E2E8F0] flex flex-wrap items-center justify-center sm:justify-start gap-x-6 gap-y-2 text-sm text-[#45464D]">
          <span className="tabular-nums">
            <strong className="text-[#0B1C30] font-semibold">
              {activeProtectionsCount}/{totalProtectionsCount}
            </strong>{' '}
            Safeguards Active
          </span>
          <span aria-hidden="true" className="text-[#CBD5E1]">
            ·
          </span>
          <span className="tabular-nums">
            <strong className="text-[#0B1C30] font-semibold">
              {unresolvedThreatCount}
            </strong>{' '}
            Unresolved Alerts
          </span>
        </div>
      </div>
    </div>
  );
}
