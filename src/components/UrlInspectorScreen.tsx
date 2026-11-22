import { useMemo } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Lock,
  LockOpen,
  ShieldAlert,
  ShieldCheck,
} from 'lucide-react';
import { URL_PRESETS } from '../data/initialSecurityData';
import { SecurityLogEntry } from '../types/security';
import { analyzeUrl } from '../utils/securityAnalyzers';
import { VerdictIndicator } from './VerdictIndicator';

interface UrlInspectorScreenProps {
  urlInput: string;
  onChangeUrlInput: (val: string) => void;
  trustedDomains: string[];
  blockedDomains: string[];
  onBlockDomain: (domain: string, title: string, explanation: string) => void;
  onTrustDomain: (domain: string, title: string, explanation: string) => void;
  onSaveLog: (entry: Omit<SecurityLogEntry, 'id' | 'timestamp'>) => void;
  actionFeedback: string | null;
}

export function UrlInspectorScreen({
  urlInput,
  onChangeUrlInput,
  trustedDomains,
  blockedDomains,
  onBlockDomain,
  onTrustDomain,
  onSaveLog,
  actionFeedback,
}: UrlInspectorScreenProps) {
  const analysis = useMemo(
    () => analyzeUrl(urlInput, trustedDomains, blockedDomains),
    [urlInput, trustedDomains, blockedDomains]
  );

  const isThreat = analysis.isValidSyntax && analysis.verdict === 'threat';
  const isCaution = analysis.isValidSyntax && analysis.verdict === 'caution';
  const isSafe = analysis.isValidSyntax && analysis.verdict === 'safe';

  const inputBorderClass = isThreat
    ? 'border-2 border-[#EF4444] focus:border-[#EF4444]'
    : 'border-[1.5px] border-[#CBD5E1] focus:border-2 focus:border-[#0F172A]';

  return (
    <div className="space-y-6">
      {/* Scanner Input Container */}
      <section className="bg-white border border-[#E2E8F0] rounded-2xl p-6 sm:p-8 shadow-ambient">
        <div className="max-w-3xl">
          <h1 className="text-2xl sm:text-[32px] font-bold text-[#0B1C30] tracking-tight text-balance">
            Phishing URL Inspector
          </h1>
          <p className="comfort-body text-base text-[#45464D] mt-2">
            We break down every part of a web link to reveal who truly owns the website and whether lookalike spelling is hiding a trap.
          </p>
        </div>

        <div className="mt-6">
          <label
            htmlFor="url-inspector-input"
            className="block text-sm font-semibold text-[#0B1C30] mb-2"
          >
            Website address to inspect
          </label>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              id="url-inspector-input"
              type="text"
              value={urlInput}
              onChange={(e) => onChangeUrlInput(e.target.value)}
              placeholder="Paste any link, e.g. https://secure-login.paypa1-verify.xyz/auth"
              className={`flex-1 min-h-[52px] px-4 rounded-xl bg-white font-mono text-sm sm:text-base text-[#0B1C30] placeholder:text-[#76777D] focus:outline-none transition-colors ${inputBorderClass}`}
            />
            {urlInput && (
              <button
                type="button"
                onClick={() => onChangeUrlInput('')}
                className="px-5 min-h-[52px] rounded-xl border-[1.5px] border-[#E2E8F0] bg-white hover:bg-[#F1F5F9] text-sm font-semibold text-[#0F172A] transition-colors whitespace-nowrap shrink-0"
              >
                Clear Link
              </button>
            )}
          </div>

          {/* Persistent inline warning beneath field on malicious URL detection */}
          {isThreat && (
            <div
              role="alert"
              className="mt-3 flex items-start gap-2.5 text-[#B91C1C] text-sm font-semibold"
            >
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" aria-hidden="true" />
              <span>
                Malicious or deceptive domain detected ({analysis.registeredDomain}). Do not sign in or enter payment details here.
              </span>
            </div>
          )}

          {/* Preset Test Scenarios */}
          <div className="mt-5 flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-[#45464D] mr-1">
              Test examples:
            </span>
            {URL_PRESETS.map((preset) => {
              const isSelected = urlInput.trim() === preset.url;
              return (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => onChangeUrlInput(preset.url)}
                  className={`px-3.5 min-h-[40px] rounded-lg text-xs font-semibold border transition-colors whitespace-nowrap shrink-0 ${
                    isSelected
                      ? 'bg-[#0F172A] text-white border-[#0F172A]'
                      : 'bg-[#F8FAFC] text-[#0B1C30] border-[#E2E8F0] hover:bg-[#EFF4FF]'
                  }`}
                >
                  {preset.label}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Action Confirmation Banner */}
      {actionFeedback && (
        <div
          role="status"
          className="bg-[#ECFDF5] border border-[#A7F3D0] text-[#047857] rounded-xl px-5 py-3.5 flex items-center gap-2.5 text-sm font-semibold"
        >
          <CheckCircle2 className="w-5 h-5 shrink-0" aria-hidden="true" />
          <span>{actionFeedback}</span>
        </div>
      )}

      {/* Verdict & Monospace URL Anatomy */}
      {analysis.isValidSyntax && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left 7 Cols: Monospace Breakdown & Query Parameters */}
          <section className="lg:col-span-7 bg-white border border-[#E2E8F0] rounded-2xl p-6 sm:p-8 shadow-ambient space-y-6">
            <div>
              <h2 className="text-xl font-bold text-[#0B1C30] tracking-tight">
                Link Anatomy Breakdown
              </h2>
              <p className="text-sm text-[#45464D] mt-1">
                Scammers hide fake addresses inside long links. Look closely at the <strong>True Domain Owner</strong> below.
              </p>
            </div>

            {/* Visual Monospace Dissection */}
            <div className="p-4 sm:p-5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] font-mono text-sm sm:text-base leading-relaxed break-all">
              <span className="text-[#45464D]">{analysis.protocol}://</span>
              {analysis.subdomain && (
                <span className="text-[#45464D]">{analysis.subdomain}.</span>
              )}
              <span
                className={`inline-block px-2 py-0.5 rounded-md font-bold mx-0.5 ${
                  analysis.deceptiveDomainMatch || isThreat
                    ? 'bg-[#FEF2F2] text-[#B91C1C] border border-[#FECACA]'
                    : isCaution
                    ? 'bg-[#FFFBEB] text-[#B45309] border border-[#FDE68A]'
                    : 'bg-[#ECFDF5] text-[#047857] border border-[#A7F3D0]'
                }`}
              >
                {analysis.registeredDomain}
              </span>
              <span className="text-[#45464D]">{analysis.path}</span>
              {analysis.queryParams.length > 0 && (
                <span className="text-[#76777D]">
                  ?{analysis.queryParams.map((q) => `${q.key}=${q.value}`).join('&')}
                </span>
              )}
            </div>

            {/* Part-by-Part Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="py-3 border-t border-[#E2E8F0]">
                <span className="text-xs font-semibold text-[#45464D]">
                  Connection Security
                </span>
                <div className="mt-1 flex items-center gap-2 font-mono text-sm font-semibold text-[#0B1C30]">
                  {analysis.protocol === 'https' ? (
                    <Lock className="w-4 h-4 text-[#10B981] shrink-0" aria-hidden="true" />
                  ) : (
                    <LockOpen className="w-4 h-4 text-[#D97706] shrink-0" aria-hidden="true" />
                  )}
                  <span>
                    {analysis.protocol.toUpperCase()}{' '}
                    {analysis.protocol === 'https' ? '(Encrypted)' : '(Unencrypted)'}
                  </span>
                </div>
              </div>

              <div className="py-3 border-t border-[#E2E8F0]">
                <span className="text-xs font-semibold text-[#45464D]">
                  Prefix / Subdomain
                </span>
                <p className="mt-1 font-mono text-sm font-medium text-[#0B1C30] break-all">
                  {analysis.subdomain || 'None'}
                </p>
              </div>

              <div className="py-3 border-t border-[#E2E8F0]">
                <span className="text-xs font-semibold text-[#45464D]">
                  True Domain Owner
                </span>
                <p
                  className={`mt-1 font-mono text-sm font-bold break-all ${
                    isThreat
                      ? 'text-[#B91C1C]'
                      : isSafe
                      ? 'text-[#047857]'
                      : 'text-[#0B1C30]'
                  }`}
                >
                  {analysis.registeredDomain}
                </p>
              </div>

              <div className="py-3 border-t border-[#E2E8F0]">
                <span className="text-xs font-semibold text-[#45464D]">
                  Page Path
                </span>
                <p className="mt-1 font-mono text-sm font-medium text-[#0B1C30] break-all">
                  {analysis.path}
                </p>
              </div>
            </div>

            {/* Query Parameter Table */}
            <div className="pt-4 border-t border-[#E2E8F0]">
              <h3 className="text-base font-bold text-[#0B1C30]">
                Query String Instructions ({analysis.queryParams.length})
              </h3>
              {analysis.queryParams.length === 0 ? (
                <p className="text-sm text-[#45464D] mt-2">
                  No hidden tracking or redirect parameters attached to this address.
                </p>
              ) : (
                <div className="mt-3 overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-[#E2E8F0] text-xs font-semibold text-[#45464D]">
                        <th className="py-2 pr-4">Parameter</th>
                        <th className="py-2 pr-4">Value</th>
                        <th className="py-2">Assessment</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E2E8F0] text-sm">
                      {analysis.queryParams.map((qp, idx) => (
                        <tr key={`${qp.key}-${idx}`}>
                          <td className="py-2.5 pr-4 font-mono font-semibold text-[#0B1C30] whitespace-nowrap">
                            {qp.key}
                          </td>
                          <td className="py-2.5 pr-4 font-mono text-[#45464D] tabular-nums break-all">
                            {qp.value}
                          </td>
                          <td className="py-2.5">
                            {qp.flagged ? (
                              <span className="text-xs font-semibold text-[#B91C1C]">
                                Sensitive redirect / auth token
                              </span>
                            ) : (
                              <span className="text-xs text-[#45464D]">
                                Standard parameter
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </section>

          {/* Right 5 Cols: Verdict & Plain-Language Explanation */}
          <section className="lg:col-span-5 bg-white border border-[#E2E8F0] rounded-2xl p-6 sm:p-8 shadow-ambient space-y-5">
            <div className="flex items-center justify-between gap-3">
              <VerdictIndicator verdict={analysis.verdict} />
              {analysis.impersonatedBrand && (
                <span className="text-xs font-semibold text-[#B91C1C]">
                  Impersonates {analysis.impersonatedBrand}
                </span>
              )}
            </div>

            <div>
              <h2 className="text-xl font-bold text-[#0B1C30] tracking-tight">
                {analysis.verdictTitle}
              </h2>
              <p className="comfort-body text-base text-[#0B1C30] mt-2">
                {analysis.summary}
              </p>
            </div>

            {/* Findings List */}
            {analysis.findings.length > 0 && (
              <div className="pt-4 border-t border-[#E2E8F0] space-y-4">
                <h3 className="text-sm font-bold text-[#0B1C30]">
                  What we found
                </h3>
                {analysis.findings.map((finding) => (
                  <div key={finding.id} className="space-y-1">
                    <p
                      className={`text-sm font-semibold ${
                        finding.severity === 'threat'
                          ? 'text-[#B91C1C]'
                          : finding.severity === 'caution'
                          ? 'text-[#B45309]'
                          : 'text-[#047857]'
                      }`}
                    >
                      {finding.title}
                    </p>
                    <p className="text-sm text-[#45464D] leading-relaxed">
                      {finding.explanation}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {/* Recommended Next Step */}
            <div className="pt-4 border-t border-[#E2E8F0]">
              <h3 className="text-sm font-bold text-[#0B1C30]">
                Recommended next step
              </h3>
              <p className="comfort-body text-base text-[#45464D] mt-1">
                {analysis.nextStep}
              </p>
            </div>

            {/* Working Actions */}
            <div className="pt-4 border-t border-[#E2E8F0] flex flex-col gap-3">
              {analysis.verdict !== 'safe' && (
                <button
                  type="button"
                  onClick={() =>
                    onBlockDomain(
                      analysis.registeredDomain,
                      analysis.verdictTitle,
                      analysis.summary
                    )
                  }
                  className="w-full inline-flex items-center justify-center gap-2 px-5 min-h-[48px] rounded-xl bg-[#DC2626] hover:bg-[#B91C1C] text-white text-sm font-semibold transition-colors whitespace-nowrap"
                >
                  <ShieldAlert className="w-4 h-4 shrink-0" aria-hidden="true" />
                  <span>Block {analysis.registeredDomain}</span>
                </button>
              )}

              <button
                type="button"
                onClick={() =>
                  onTrustDomain(
                    analysis.registeredDomain,
                    `Verified: ${analysis.registeredDomain}`,
                    `Confirmed safe by user during URL inspection.`
                  )
                }
                className={`w-full inline-flex items-center justify-center gap-2 px-5 min-h-[48px] rounded-xl text-sm font-semibold transition-colors whitespace-nowrap ${
                  analysis.verdict === 'safe'
                    ? 'bg-[#10B981] hover:bg-[#059669] text-white'
                    : 'border-[1.5px] border-[#E2E8F0] bg-white hover:bg-[#F1F5F9] text-[#0F172A]'
                }`}
              >
                <ShieldCheck className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>Mark Domain as Trusted</span>
              </button>

              <button
                type="button"
                onClick={() =>
                  onSaveLog({
                    kind: 'url',
                    title: analysis.verdictTitle,
                    target: analysis.registeredDomain || analysis.rawInput,
                    verdict: analysis.verdict,
                    status: analysis.verdict === 'safe' ? 'trusted' : 'needs-review',
                    explanation: analysis.summary,
                    recommendedAction: analysis.nextStep,
                  })
                }
                className="w-full inline-flex items-center justify-center gap-2 px-5 min-h-[44px] rounded-xl text-sm font-semibold text-[#45464D] hover:text-[#0B1C30] hover:bg-[#EFF4FF] transition-colors whitespace-nowrap"
              >
                Save Inspection to Protection Log
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
