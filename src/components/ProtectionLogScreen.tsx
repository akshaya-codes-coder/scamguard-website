import { useMemo, useState } from 'react';
import {
  Phone,
  Plus,
  Search,
  ShieldAlert,
  ShieldCheck,
  Trash2,
} from 'lucide-react';
import {
  LogEntryStatus,
  SecurityLogEntry,
  TrustedContact,
} from '../types/security';
import { VerdictIndicator } from './VerdictIndicator';

interface ProtectionLogScreenProps {
  logs: SecurityLogEntry[];
  trustedContacts: TrustedContact[];
  trustedDomains: string[];
  onUpdateLogStatus: (id: string, status: LogEntryStatus) => void;
  onDeleteLog: (id: string) => void;
  onAddTrustedContact: (contact: Omit<TrustedContact, 'id'>) => void;
  onRemoveTrustedContact: (id: string) => void;
  onAddTrustedDomain: (domain: string) => void;
  onRemoveTrustedDomain: (domain: string) => void;
}

type LogFilter = 'all' | LogEntryStatus;

const FILTER_TABS: Array<{ id: LogFilter; label: string }> = [
  { id: 'all', label: 'All Events' },
  { id: 'needs-review', label: 'Needs Review' },
  { id: 'blocked', label: 'Blocked' },
  { id: 'trusted', label: 'Verified Safe' },
];

export function ProtectionLogScreen({
  logs,
  trustedContacts,
  trustedDomains,
  onUpdateLogStatus,
  onDeleteLog,
  onAddTrustedContact,
  onRemoveTrustedContact,
  onAddTrustedDomain,
  onRemoveTrustedDomain,
}: ProtectionLogScreenProps) {
  const [filter, setFilter] = useState<LogFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Add contact form state
  const [showAddContact, setShowAddContact] = useState(false);
  const [contactName, setContactName] = useState('');
  const [contactRelation, setContactRelation] = useState('');
  const [contactPhone, setContactPhone] = useState('');

  // Add trusted domain state
  const [domainInput, setDomainInput] = useState('');

  const filteredLogs = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return logs.filter((entry) => {
      const matchesFilter = filter === 'all' || entry.status === filter;
      const matchesQuery =
        !q ||
        entry.title.toLowerCase().includes(q) ||
        entry.target.toLowerCase().includes(q) ||
        entry.explanation.toLowerCase().includes(q);
      return matchesFilter && matchesQuery;
    });
  }, [logs, filter, searchQuery]);

  const handleCreateContact = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactName.trim() || !contactPhone.trim()) return;
    onAddTrustedContact({
      name: contactName.trim(),
      relationship: contactRelation.trim() || 'Family Safety Advisor',
      phone: contactPhone.trim(),
      email: '',
      role: 'Verified second-opinion contact',
    });
    setContactName('');
    setContactRelation('');
    setContactPhone('');
    setShowAddContact(false);
  };

  const handleCreateDomain = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = domainInput
      .trim()
      .toLowerCase()
      .replace(/^https?:\/\//, '')
      .replace(/^www\./, '')
      .split('/')[0];
    if (!cleaned || !cleaned.includes('.')) return;
    onAddTrustedDomain(cleaned);
    setDomainInput('');
  };

  return (
    <div className="space-y-8">
      {/* Protection Ledger */}
      <section className="bg-white border border-[#E2E8F0] rounded-2xl p-6 sm:p-8 shadow-ambient">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-[#E2E8F0]">
          <div>
            <h1 className="text-2xl font-bold text-[#0B1C30] tracking-tight">
              Protection Log
            </h1>
            <p className="text-sm text-[#45464D] mt-1">
              Full history of inspected links, blocked scam senders, and confirmed safe domains.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {/* Search Input */}
            <div className="relative">
              <Search
                className="w-4 h-4 text-[#76777D] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                aria-hidden="true"
              />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search domain or sender..."
                aria-label="Search protection log"
                className="w-full sm:w-64 min-h-[44px] pl-10 pr-4 rounded-xl border-[1.5px] border-[#CBD5E1] bg-white text-sm text-[#0B1C30] placeholder:text-[#76777D] focus:outline-none focus:border-2 focus:border-[#0F172A]"
              />
            </div>

            {/* Interactive Segmented Filter Tabs */}
            <div
              className="flex items-center gap-1 p-1 bg-[#F1F5F9] rounded-xl overflow-x-auto"
              role="tablist"
              aria-label="Filter protection events"
            >
              {FILTER_TABS.map((tab) => {
                const isActive = filter === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    onClick={() => setFilter(tab.id)}
                    className={`px-3.5 min-h-[36px] rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                      isActive
                        ? 'bg-white text-[#0B1C30] shadow-sm'
                        : 'text-[#45464D] hover:text-[#0B1C30]'
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Empty State */}
        {filteredLogs.length === 0 ? (
          <div className="py-12 text-center max-w-md mx-auto">
            <p className="text-lg font-bold text-[#0B1C30]">
              No matching events found
            </p>
            <p className="text-sm text-[#45464D] mt-1">
              {searchQuery
                ? 'Try clearing your search term or switching to All Events.'
                : 'No entries match this filter yet. Inspect a web link or message to record an assessment.'}
            </p>
            {(searchQuery || filter !== 'all') && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setFilter('all');
                }}
                className="mt-4 px-5 min-h-[44px] rounded-xl border-[1.5px] border-[#E2E8F0] bg-white hover:bg-[#F1F5F9] text-sm font-semibold text-[#0F172A]"
              >
                Show All Events
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-[#E2E8F0]">
            {filteredLogs.map((entry) => (
              <div
                key={entry.id}
                className="py-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4"
              >
                <div className="min-w-0 flex-1 space-y-1.5">
                  <div className="flex flex-wrap items-center gap-3">
                    <VerdictIndicator
                      verdict={entry.verdict}
                      label={
                        entry.status === 'blocked'
                          ? 'Blocked'
                          : entry.status === 'trusted'
                          ? 'Verified Safe'
                          : 'Needs Review'
                      }
                      size="sm"
                    />
                    <span className="font-mono text-xs text-[#45464D] tabular-nums">
                      {entry.timestamp}
                    </span>
                    <span aria-hidden="true" className="text-[#CBD5E1]">
                      ·
                    </span>
                    <span className="text-xs font-medium text-[#45464D]">
                      {entry.kind === 'sms'
                        ? 'Message Check'
                        : entry.kind === 'qr'
                        ? 'QR Code Check'
                        : 'Web Link Check'}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-[#0B1C30]">
                    {entry.title}
                  </h3>
                  <p className="font-mono text-xs sm:text-sm text-[#45464D] break-all">
                    {entry.target}
                  </p>
                  <p className="text-sm text-[#45464D] leading-relaxed">
                    {entry.explanation}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  {entry.status !== 'blocked' && (
                    <button
                      type="button"
                      onClick={() => onUpdateLogStatus(entry.id, 'blocked')}
                      className="inline-flex items-center gap-1.5 px-3.5 min-h-[40px] rounded-xl bg-[#DC2626] hover:bg-[#B91C1C] text-white text-xs font-semibold transition-colors whitespace-nowrap shrink-0"
                    >
                      <ShieldAlert className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                      <span>Block</span>
                    </button>
                  )}

                  {entry.status !== 'trusted' && (
                    <button
                      type="button"
                      onClick={() => onUpdateLogStatus(entry.id, 'trusted')}
                      className="inline-flex items-center gap-1.5 px-3.5 min-h-[40px] rounded-xl border-[1.5px] border-[#E2E8F0] bg-white hover:bg-[#F1F5F9] text-[#0F172A] text-xs font-semibold transition-colors whitespace-nowrap shrink-0"
                    >
                      <ShieldCheck className="w-3.5 h-3.5 text-[#10B981] shrink-0" aria-hidden="true" />
                      <span>Mark Safe</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => onDeleteLog(entry.id)}
                    aria-label={`Remove ${entry.title} from log`}
                    className="p-2.5 min-w-[40px] min-h-[40px] rounded-xl text-[#45464D] hover:text-[#B91C1C] hover:bg-[#FEF2F2] transition-colors flex items-center justify-center shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Trusted Circle & Safe Domains Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Trusted Family & Official Contacts */}
        <section className="lg:col-span-7 bg-white border border-[#E2E8F0] rounded-2xl p-6 sm:p-8 shadow-ambient">
          <div className="flex items-center justify-between gap-4 pb-5 border-b border-[#E2E8F0]">
            <div>
              <h2 className="text-xl font-bold text-[#0B1C30] tracking-tight">
                Trusted Circle Contacts
              </h2>
              <p className="text-sm text-[#45464D] mt-1">
                Verified phone numbers to call before acting on urgent requests.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowAddContact((v) => !v)}
              className="inline-flex items-center gap-1.5 px-4 min-h-[44px] rounded-xl bg-[#0F172A] hover:bg-[#1E293B] text-white text-sm font-semibold transition-colors whitespace-nowrap shrink-0"
            >
              <Plus className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>Add Contact</span>
            </button>
          </div>

          {showAddContact && (
            <form
              onSubmit={handleCreateContact}
              className="py-5 border-b border-[#E2E8F0] grid grid-cols-1 sm:grid-cols-3 gap-3"
            >
              <input
                type="text"
                required
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                placeholder="Full name"
                aria-label="Contact full name"
                className="min-h-[44px] px-3.5 rounded-xl border-[1.5px] border-[#CBD5E1] text-sm text-[#0B1C30] focus:outline-none focus:border-2 focus:border-[#0F172A]"
              />
              <input
                type="text"
                value={contactRelation}
                onChange={(e) => setContactRelation(e.target.value)}
                placeholder="Relationship (e.g. Daughter)"
                aria-label="Contact relationship"
                className="min-h-[44px] px-3.5 rounded-xl border-[1.5px] border-[#CBD5E1] text-sm text-[#0B1C30] focus:outline-none focus:border-2 focus:border-[#0F172A]"
              />
              <div className="flex gap-2">
                <input
                  type="tel"
                  required
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  placeholder="Phone number"
                  aria-label="Contact phone number"
                  className="flex-1 min-w-0 min-h-[44px] px-3.5 rounded-xl border-[1.5px] border-[#CBD5E1] font-mono text-sm text-[#0B1C30] focus:outline-none focus:border-2 focus:border-[#0F172A]"
                />
                <button
                  type="submit"
                  className="px-4 min-h-[44px] rounded-xl bg-[#10B981] hover:bg-[#059669] text-white text-sm font-semibold whitespace-nowrap shrink-0"
                >
                  Save
                </button>
              </div>
            </form>
          )}

          <div className="divide-y divide-[#E2E8F0]">
            {trustedContacts.map((contact) => (
              <div
                key={contact.id}
                className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <p className="text-base font-bold text-[#0B1C30]">
                    {contact.name}
                  </p>
                  <p className="text-sm text-[#45464D]">
                    {contact.relationship}
                  </p>
                  <p className="text-xs text-[#45464D] mt-0.5">{contact.role}</p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <a
                    href={`tel:${contact.phone.replace(/[^+\d]/g, '')}`}
                    className="inline-flex items-center gap-1.5 px-3.5 min-h-[40px] rounded-xl border-[1.5px] border-[#E2E8F0] bg-white hover:bg-[#EFF4FF] font-mono text-xs font-semibold text-[#0B1C30] tabular-nums whitespace-nowrap"
                  >
                    <Phone className="w-3.5 h-3.5 text-[#10B981]" aria-hidden="true" />
                    <span>{contact.phone}</span>
                  </a>
                  <button
                    type="button"
                    onClick={() => onRemoveTrustedContact(contact.id)}
                    aria-label={`Remove ${contact.name}`}
                    className="p-2 min-w-[40px] min-h-[40px] rounded-xl text-[#45464D] hover:text-[#B91C1C] hover:bg-[#FEF2F2] flex items-center justify-center"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Personal Safe Websites List */}
        <section className="lg:col-span-5 bg-white border border-[#E2E8F0] rounded-2xl p-6 sm:p-8 shadow-ambient">
          <h2 className="text-xl font-bold text-[#0B1C30] tracking-tight">
            Your Verified Websites
          </h2>
          <p className="text-sm text-[#45464D] mt-1">
            Add websites you visit regularly (such as your clinic or bank) so the inspector recognizes them as trusted.
          </p>

          <form onSubmit={handleCreateDomain} className="mt-4 flex gap-2">
            <input
              type="text"
              value={domainInput}
              onChange={(e) => setDomainInput(e.target.value)}
              placeholder="e.g. mychart.org"
              aria-label="Add verified website domain"
              className="flex-1 min-w-0 min-h-[44px] px-3.5 rounded-xl border-[1.5px] border-[#CBD5E1] font-mono text-sm text-[#0B1C30] focus:outline-none focus:border-2 focus:border-[#0F172A]"
            />
            <button
              type="submit"
              className="px-4 min-h-[44px] rounded-xl bg-[#0F172A] hover:bg-[#1E293B] text-white text-sm font-semibold whitespace-nowrap shrink-0"
            >
              Add Site
            </button>
          </form>

          <div className="mt-5 divide-y divide-[#E2E8F0]">
            {trustedDomains.length === 0 ? (
              <p className="py-4 text-sm text-[#45464D]">
                No custom trusted sites added yet. Major government and banking domains are already protected automatically.
              </p>
            ) : (
              trustedDomains.map((domain) => (
                <div
                  key={domain}
                  className="py-3 flex items-center justify-between gap-3"
                >
                  <span className="font-mono text-sm font-semibold text-[#047857] truncate">
                    {domain}
                  </span>
                  <button
                    type="button"
                    onClick={() => onRemoveTrustedDomain(domain)}
                    aria-label={`Remove ${domain} from trusted websites`}
                    className="p-2 min-w-[36px] min-h-[36px] rounded-lg text-[#45464D] hover:text-[#B91C1C] hover:bg-[#FEF2F2] flex items-center justify-center shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
