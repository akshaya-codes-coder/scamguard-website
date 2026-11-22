import { AlertTriangle, ShieldAlert, ShieldCheck } from 'lucide-react';
import { ThreatVerdict } from '../types/security';

interface VerdictIndicatorProps {
  verdict: ThreatVerdict;
  label?: string;
  size?: 'sm' | 'md';
}

const VERDICT_CONFIG: Record<
  ThreatVerdict,
  {
    defaultLabel: string;
    containerClass: string;
    Icon: typeof ShieldCheck;
  }
> = {
  safe: {
    defaultLabel: 'Verified Safe',
    containerClass:
      'bg-[#ECFDF5] text-[#047857] border border-[#A7F3D0]',
    Icon: ShieldCheck,
  },
  caution: {
    defaultLabel: 'Needs Caution',
    containerClass:
      'bg-[#FFFBEB] text-[#B45309] border border-[#FDE68A]',
    Icon: AlertTriangle,
  },
  threat: {
    defaultLabel: 'Threat Detected',
    containerClass:
      'bg-[#FEF2F2] text-[#B91C1C] border border-[#FECACA]',
    Icon: ShieldAlert,
  },
};

export function VerdictIndicator({
  verdict,
  label,
  size = 'md',
}: VerdictIndicatorProps) {
  const config = VERDICT_CONFIG[verdict];
  const Icon = config.Icon;

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-lg font-semibold whitespace-nowrap shrink-0 ${
        size === 'sm' ? 'px-2.5 py-1 text-xs' : 'px-3 py-1.5 text-sm'
      } ${config.containerClass}`}
    >
      <Icon className={size === 'sm' ? 'w-3.5 h-3.5 shrink-0' : 'w-4 h-4 shrink-0'} aria-hidden="true" />
      <span>{label ?? config.defaultLabel}</span>
    </span>
  );
}
