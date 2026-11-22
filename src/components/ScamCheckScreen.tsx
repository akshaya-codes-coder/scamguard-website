import { Fragment, useMemo } from 'react';
import {
  ArrowRight,
  CheckCircle2,
  Phone,
  ShieldAlert,
  ShieldCheck,
} from 'lucide-react';
import { SMS_PRESETS } from '../data/initialSecurityData';
import { SecurityLogEntry, TrustedContact } from '../types/security';
import { analyzeSmsMessage } from '../utils/securityAnalyzers';
import { VerdictIndicator } from './VerdictIndicator';

interface ScamCheckScreenProps {
  senderInput: string;
  messageInput: string;
  onChangeSender: (val: string) => void;
  onChangeMessage: (val: string) => void;
  trustedDomains: string[];
  blockedDomains: string[];
  trustedContacts: TrustedContact[];
  onInspectUrl: (url: string) => void;
  onSaveLog: (entry: Omit<SecurityLogEntry, 'id' | 'timestamp'>) => void;
  actionFeedback: string | null;
}

export function ScamCheckScreen({
  senderInput,
  messageInput,
  onChangeSender,
  onChangeMessage,
  trustedDomains,
  blockedDomains,
  trustedContacts,
  onInspectUrl,
  onSaveLog,
  actionFeedback,
}: ScamCheckScreenProps) {
  const analysis = useMemo(
    () => analyzeSmsMessage(senderInput, messageInput, trustedDomains, blockedDomains),
    [senderInput, messageInput, trustedDomains, blockedDomains]
  );

  // Build highlighted message segments cleanly from sorted, non-overlapping ranges
  const renderHighlightedMessage = () => {
    const text = analysis.message;
    if (!text) return null;
    if (analysis.phraseMatches.length === 0) {
      return <span>{text}</span>;
    }

    const nodes: Array<{ key: string; text: string; severity?: 'threat' | 'caution' | 'safe' }> = [];
    let cursor = 0;

    analysis.phraseMatches.forEach((match, index) => {
      if (match.start > cursor) {
        nodes.push({
          key: `plain-${index}`,
          text: text.slice(cursor, match.start),
        });
      }
      nodes.push({
        key: `match-${index}`,
        text: text.slice(match.start, match.end),
        severity: match.severity,
      });
      cursor = match.end;
    });

    if (cursor < text.length) {
      nodes.push({
        key: 'tail',
        text: text.slice(cursor),
      });
    }

    return nodes.map((part) => (
      <Fragment key={part.key}>
        {part.severity ? (
          <mark
            className={`px-1.5 py-0.5 rounded font-semibold ${
              part.severity === 'threat'
                ? 'bg-[#FEF2F2] text-[#B91C1C] border border-[#FECACA]'
                : 'bg-[#FFFBEB] text-[#B45309] border border-[#FDE68A]'
            }`}
          >
            {part.text}
          </mark>
        ) : (
          part.text
        )}
      </Fragment>
    ));
  };

  const primaryAdvisor = trustedContacts[0];

  return (
    <div className="space-y-6">
      {/* Message Input Card */}
      <section className="bg-white border border-[#E2E8F0] rounded-2xl p-6 sm:p-8 shadow-ambient">
        <div className="max-w-3xl">
          <h1 className="text-2xl sm:text-[32px] font-bold text-[#0B1C30] tracking-tight text-balance">
            SMS &amp; Email Scam Check
          </h1>
          <p className="comfort-body text-base text-[#45464D] mt-2">
            Paste any unexpected text message or email below. We highlight scare tactics, gift card requests, and disguised links in clear language.
          </p>
        </div>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-12 gap-4">
          <div className="md:col-span-4">
            <label
              htmlFor="scam-sender-input"
              className="block text-sm font-semibold text-[#0B1C30] mb-2"
            >
              Sender phone or email (optional)
            </label>
            <input
              id="scam-sender-input"
              type="text"
              value={senderInput}
              onChange={(e) => onChangeSender(e.target.value)}
              placeholder="e.g. +1 (415) 890-4412"
              className="w-full min-h-[48px] px-4 rounded-xl border-[1.5px] border-[#CBD5E1] bg-white font-mono text-sm text-[#0B1C30] placeholder:text-[#76777D] focus:outline-none focus:border-2 focus:border-[#0F172A] transition-colors"
            />
          </div>

          <div className="md:col-span-8">
            <label
              htmlFor="scam-message-input"
              className="block text-sm font-semibold text-[#0B1C30] mb-2"
            >
              Message content
            </label>
            <textarea
              id="scam-message-input"
              rows={4}
              value={messageInput}
              onChange={(e) => onChangeMessage(e.target.value)}
              placeholder="Paste the text message or email here..."
              className="w-full p-4 rounded-xl border-[1.5px] border-[#CBD5E1] bg-white text-base text-[#0B1C30] placeholder:text-[#76777D] focus:outline-none focus:border-2 focus:border-[#0F172A] transition-colors leading-relaxed"
            />
          </div>
        </div>

        {/* Preset Scenario Buttons */}
        <div className="mt-5 flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-[#45464D] mr-1">
            Common scam examples:
          </span>
          {SMS_PRESETS.map((preset) => {
            const isSelected = messageInput.trim() === preset.message.trim();
            return (
              <button
                key={preset.label}
                type="button"
                onClick={() => {
                  onChangeSender(preset.sender);
                  onChangeMessage(preset.message);
                }}
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
          {messageInput && (
            <button
              type="button"
              onClick={() => {
                onChangeSender('');
                onChangeMessage('');
              }}
              className="px-3.5 min-h-[40px] rounded-lg text-xs font-semibold text-[#45464D] hover:text-[#0B1C30] hover:bg-[#F1F5F9] whitespace-nowrap shrink-0"
            >
              Clear
            </button>
          )}
        </div>
      </section>

      {actionFeedback && (
        <div
          role="status"
          className="bg-[#ECFDF5] border border-[#A7F3D0] text-[#047857] rounded-xl px-5 py-3.5 flex items-center gap-2.5 text-sm font-semibold"
        >
          <CheckCircle2 className="w-5 h-5 shrink-0" aria-hidden="true" />
          <span>{actionFeedback}</span>
        </div>
      )}

      {/* Analysis Output Split */}
      {messageInput.trim() && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left 7 Columns: Highlighted Message & Manipulative Tactic Breakdown */}
          <section className="lg:col-span-7 bg-white border border-[#E2E8F0] rounded-2xl p-6 sm:p-8 shadow-ambient space-y-6">
            <div>
              <h2 className="text-xl font-bold text-[#0B1C30] tracking-tight">
                Highlighted Warning Signs
              </h2>
              <p className="text-sm text-[#45464D] mt-1">
                Suspicious pressure phrases are highlighted directly inside the message.
              </p>
            </div>

            <div className="p-5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] comfort-body text-base sm:text-lg text-[#0B1C30] leading-relaxed">
              {renderHighlightedMessage()}
            </div>

            {/* Sender Check */}
            <div className="pt-4 border-t border-[#E2E8F0]">
              <h3 className="text-sm font-bold text-[#0B1C30]">
                Sender Assessment
              </h3>
              <p className="text-sm text-[#45464D] mt-1">
                {analysis.senderAssessment}
              </p>
            </div>

            {/* Detailed Phrase Explanations */}
            <div className="pt-4 border-t border-[#E2E8F0] space-y-4">
              <h3 className="text-base font-bold text-[#0B1C30]">
                Detected Persuasion Tactics ({analysis.phraseMatches.length})
              </h3>

              {analysis.phraseMatches.length === 0 ? (
                <p className="text-sm text-[#45464D]">
                  No manipulative urgency, gift card, or credential-harvesting phrases were detected in this text.
                </p>
              ) : (
                <div className="divide-y divide-[#E2E8F0]">
                  {analysis.phraseMatches.map((item, index) => (
                    <div key={`${item.phrase}-${index}`} className="py-3.5 first:pt-1 last:pb-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`text-xs font-bold ${
                            item.severity === 'threat'
                              ? 'text-[#B91C1C]'
                              : 'text-[#B45309]'
                          }`}
                        >
                          {item.category}
                        </span>
                        <span aria-hidden="true" className="text-[#CBD5E1]">
                          ·
                        </span>
                        <span className="font-mono text-xs font-semibold text-[#0B1C30]">
                          “{item.phrase}”
                        </span>
                      </div>
                      <p className="text-sm text-[#45464D] mt-1">
                        {item.explanation}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Embedded Links Found */}
            {analysis.detectedUrls.length > 0 && (
              <div className="pt-4 border-t border-[#E2E8F0] space-y-3">
                <h3 className="text-base font-bold text-[#0B1C30]">
                  Links Inside This Message ({analysis.detectedUrls.length})
                </h3>
                {analysis.detectedUrls.map((link) => (
                  <div
                    key={link.normalizedUrl}
                    className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <VerdictIndicator verdict={link.verdict} size="sm" />
                      <p className="font-mono text-sm font-semibold text-[#0B1C30] mt-2 break-all">
                        {link.registeredDomain}
                      </p>
                      <p className="text-xs text-[#45464D] mt-0.5 truncate">
                        {link.normalizedUrl}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => onInspectUrl(link.normalizedUrl)}
                      className="inline-flex items-center gap-1.5 px-4 min-h-[44px] rounded-xl bg-[#0F172A] hover:bg-[#1E293B] text-white text-sm font-semibold transition-colors whitespace-nowrap shrink-0"
                    >
                      <span>Inspect Link</span>
                      <ArrowRight className="w-4 h-4 shrink-0" aria-hidden="true" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Right 5 Columns: Verdict & Safety Actions */}
          <section className="lg:col-span-5 bg-white border border-[#E2E8F0] rounded-2xl p-6 sm:p-8 shadow-ambient space-y-5">
            <VerdictIndicator verdict={analysis.verdict} />

            <div>
              <h2 className="text-xl font-bold text-[#0B1C30] tracking-tight">
                {analysis.verdictTitle}
              </h2>
              <p className="comfort-body text-base text-[#0B1C30] mt-2">
                {analysis.summary}
              </p>
            </div>

            <div className="pt-4 border-t border-[#E2E8F0]">
              <h3 className="text-sm font-bold text-[#0B1C30]">
                What you should do next
              </h3>
              <p className="comfort-body text-base text-[#45464D] mt-1">
                {analysis.nextStep}
              </p>
            </div>

            <div className="pt-4 border-t border-[#E2E8F0] flex flex-col gap-3">
              {analysis.verdict !== 'safe' && (
                <button
                  type="button"
                  onClick={() =>
                    onSaveLog({
                      kind: 'sms',
                      title: analysis.verdictTitle,
                      target: senderInput.trim() || 'Unknown Sender',
                      verdict: analysis.verdict,
                      status: 'blocked',
                      explanation: analysis.summary,
                      recommendedAction: 'Sender blocked and message quarantined.',
                    })
                  }
                  className="w-full inline-flex items-center justify-center gap-2 px-5 min-h-[48px] rounded-xl bg-[#DC2626] hover:bg-[#B91C1C] text-white text-sm font-semibold transition-colors whitespace-nowrap"
                >
                  <ShieldAlert className="w-4 h-4 shrink-0" aria-hidden="true" />
                  <span>Block Sender &amp; Quarantine</span>
                </button>
              )}

              <button
                type="button"
                onClick={() =>
                  onSaveLog({
                    kind: 'sms',
                    title: senderInput.trim()
                      ? `Verified message from ${senderInput.trim()}`
                      : 'Verified safe message',
                    target: senderInput.trim() || 'Message Check',
                    verdict: 'safe',
                    status: 'trusted',
                    explanation: 'Confirmed safe by user after review.',
                    recommendedAction: 'No further action needed.',
                  })
                }
                className="w-full inline-flex items-center justify-center gap-2 px-5 min-h-[48px] rounded-xl border-[1.5px] border-[#E2E8F0] bg-white hover:bg-[#F1F5F9] text-[#0F172A] text-sm font-semibold transition-colors whitespace-nowrap"
              >
                <ShieldCheck className="w-4 h-4 shrink-0 text-[#10B981]" aria-hidden="true" />
                <span>Mark Message Safe</span>
              </button>

              {primaryAdvisor && (
                <a
                  href={`tel:${primaryAdvisor.phone.replace(/[^+\d]/g, '')}`}
                  className="w-full inline-flex items-center justify-center gap-2 px-5 min-h-[48px] rounded-xl bg-[#EFF4FF] hover:bg-[#DCE9FF] text-[#0B1C30] text-sm font-semibold transition-colors whitespace-nowrap"
                >
                  <Phone className="w-4 h-4 shrink-0" aria-hidden="true" />
                  <span>Ask {primaryAdvisor.name} First</span>
                </a>
              )}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
