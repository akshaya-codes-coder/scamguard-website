import { useEffect, useMemo, useState } from 'react';
import { OverviewScreen } from './components/OverviewScreen';
import { ProtectionLogScreen } from './components/ProtectionLogScreen';
import { QrScannerScreen } from './components/QrScannerScreen';
import { ScamCheckScreen } from './components/ScamCheckScreen';
import { SidebarNav } from './components/SidebarNav';
import { TopHeader } from './components/TopHeader';
import { UrlInspectorScreen } from './components/UrlInspectorScreen';
import {
  INITIAL_PROTECTIONS,
  INITIAL_SECURITY_LOGS,
  INITIAL_TRUSTED_CONTACTS,
  SMS_PRESETS,
  URL_PRESETS,
} from './data/initialSecurityData';
import {
  AppScreen,
  LogEntryStatus,
  ProtectionControl,
  SecurityLogEntry,
  TrustedContact,
} from './types/security';

const STORAGE_KEY = 'vigilant_clarity_state_v1';

interface PersistedState {
  protections: ProtectionControl[];
  logs: SecurityLogEntry[];
  trustedContacts: TrustedContact[];
  trustedDomains: string[];
  blockedDomains: string[];
  comfortReading: boolean;
}

function loadInitialState(): PersistedState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<PersistedState>;
      return {
        protections: parsed.protections ?? INITIAL_PROTECTIONS,
        logs: parsed.logs ?? INITIAL_SECURITY_LOGS,
        trustedContacts: parsed.trustedContacts ?? INITIAL_TRUSTED_CONTACTS,
        trustedDomains: parsed.trustedDomains ?? ['mychart.org'],
        blockedDomains: parsed.blockedDomains ?? ['usps-redelivery-fee.top'],
        comfortReading: Boolean(parsed.comfortReading),
      };
    }
  } catch {
    // Fall back to clean defaults
  }

  return {
    protections: INITIAL_PROTECTIONS,
    logs: INITIAL_SECURITY_LOGS,
    trustedContacts: INITIAL_TRUSTED_CONTACTS,
    trustedDomains: ['mychart.org'],
    blockedDomains: ['usps-redelivery-fee.top'],
    comfortReading: false,
  };
}

export default function App() {
  const initial = useMemo(() => loadInitialState(), []);

  const [activeScreen, setActiveScreen] = useState<AppScreen>('overview');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [protections, setProtections] = useState<ProtectionControl[]>(initial.protections);
  const [logs, setLogs] = useState<SecurityLogEntry[]>(initial.logs);
  const [trustedContacts, setTrustedContacts] = useState<TrustedContact[]>(
    initial.trustedContacts
  );
  const [trustedDomains, setTrustedDomains] = useState<string[]>(initial.trustedDomains);
  const [blockedDomains, setBlockedDomains] = useState<string[]>(initial.blockedDomains);
  const [comfortReading, setComfortReading] = useState<boolean>(initial.comfortReading);

  const [urlInput, setUrlInput] = useState<string>(URL_PRESETS[0].url);
  const [smsSender, setSmsSender] = useState<string>(SMS_PRESETS[0].sender);
  const [smsMessage, setSmsMessage] = useState<string>(SMS_PRESETS[0].message);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  // Persist user security posture and log changes
  useEffect(() => {
    try {
      const payload: PersistedState = {
        protections,
        logs,
        trustedContacts,
        trustedDomains,
        blockedDomains,
        comfortReading,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch {
      // Ignore storage quota errors
    }
  }, [protections, logs, trustedContacts, trustedDomains, blockedDomains, comfortReading]);

  const showFeedback = (message: string) => {
    setActionFeedback(message);
    window.setTimeout(() => {
      setActionFeedback((curr) => (curr === message ? null : curr));
    }, 4500);
  };

  // Dynamic Safety Gauge Score (1-100) computed from active safeguards & unresolved alerts
  const safetyScore = useMemo(() => {
    const baseScore = 10;
    const safeguardPoints = protections
      .filter((p) => p.enabled)
      .reduce((acc, p) => acc + p.weight, 0);
    const unresolvedThreats = logs.filter(
      (l) => l.status === 'needs-review' && l.verdict === 'threat'
    ).length;
    const unresolvedCautions = logs.filter(
      (l) => l.status === 'needs-review' && l.verdict === 'caution'
    ).length;

    const penalty = unresolvedThreats * 18 + unresolvedCautions * 7;
    return Math.max(12, Math.min(100, baseScore + safeguardPoints - penalty));
  }, [protections, logs]);

  const unresolvedCount = useMemo(
    () => logs.filter((l) => l.status === 'needs-review').length,
    [logs]
  );

  const handleToggleProtection = (id: string) => {
    setProtections((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, enabled: !item.enabled } : item
      )
    );
  };

  const handleUpdateLogStatus = (id: string, status: LogEntryStatus) => {
    setLogs((prev) =>
      prev.map((entry) => (entry.id === id ? { ...entry, status } : entry))
    );
  };

  const handleDeleteLog = (id: string) => {
    setLogs((prev) => prev.filter((entry) => entry.id !== id));
  };

  const handleAddLog = (entry: Omit<SecurityLogEntry, 'id' | 'timestamp'>) => {
    const nowLabel = new Date().toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
    const newEntry: SecurityLogEntry = {
      ...entry,
      id: `log-${Date.now()}`,
      timestamp: `Today, ${nowLabel}`,
    };
    setLogs((prev) => [newEntry, ...prev]);
    showFeedback('Saved assessment to your Protection Log.');
  };

  const handleBlockDomain = (domain: string, title: string, explanation: string) => {
    const clean = domain.toLowerCase().trim();
    if (clean && !blockedDomains.includes(clean)) {
      setBlockedDomains((prev) => [clean, ...prev]);
    }
    setTrustedDomains((prev) => prev.filter((d) => d !== clean));
    handleAddLog({
      kind: 'url',
      title: `Blocked: ${title}`,
      target: clean,
      verdict: 'threat',
      status: 'blocked',
      explanation,
      recommendedAction: 'Domain blocked on this workspace.',
    });
    showFeedback(`${clean} has been blocked and logged.`);
  };

  const handleTrustDomain = (domain: string, title: string, explanation: string) => {
    const clean = domain.toLowerCase().trim();
    if (clean && !trustedDomains.includes(clean)) {
      setTrustedDomains((prev) => [clean, ...prev]);
    }
    setBlockedDomains((prev) => prev.filter((d) => d !== clean));
    handleAddLog({
      kind: 'url',
      title,
      target: clean,
      verdict: 'safe',
      status: 'trusted',
      explanation,
      recommendedAction: 'Marked as a verified safe website.',
    });
    showFeedback(`${clean} added to your Verified Websites.`);
  };

  const handleQuickAnalyze = (input: string) => {
    const trimmed = input.trim();
    const looksLikeUrlOnly =
      !trimmed.includes(' ') &&
      (/^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(trimmed) ||
        trimmed.startsWith('http://') ||
        trimmed.startsWith('https://'));

    if (looksLikeUrlOnly) {
      setUrlInput(trimmed);
      setActiveScreen('url-inspector');
    } else {
      setSmsSender('');
      setSmsMessage(trimmed);
      setActiveScreen('scam-check');
    }
  };

  const handleInspectUrlFromSms = (url: string) => {
    setUrlInput(url);
    setActiveScreen('url-inspector');
  };

  const handleAddTrustedContact = (contact: Omit<TrustedContact, 'id'>) => {
    setTrustedContacts((prev) => [
      ...prev,
      { ...contact, id: `tc-${Date.now()}` },
    ]);
  };

  const handleRemoveTrustedContact = (id: string) => {
    setTrustedContacts((prev) => prev.filter((c) => c.id !== id));
  };

  const handleAddTrustedDomain = (domain: string) => {
    if (!trustedDomains.includes(domain)) {
      setTrustedDomains((prev) => [domain, ...prev]);
    }
  };

  const handleRemoveTrustedDomain = (domain: string) => {
    setTrustedDomains((prev) => prev.filter((d) => d !== domain));
  };

  return (
    <div
      className={`min-h-screen flex bg-[#F8F9FF] text-[#0B1C30] ${
        comfortReading ? 'reading-comfort' : ''
      }`}
    >
      <SidebarNav
        activeScreen={activeScreen}
        onSelectScreen={(screen) => {
          setActionFeedback(null);
          setActiveScreen(screen);
        }}
        unresolvedCount={unresolvedCount}
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
      />

      <div className="flex-1 min-w-0 flex flex-col">
        <TopHeader
          activeScreen={activeScreen}
          comfortReading={comfortReading}
          onToggleComfortReading={() => setComfortReading((v) => !v)}
          onQuickInspectUrl={() => {
            setActionFeedback(null);
            setActiveScreen('url-inspector');
          }}
          onOpenMobileMenu={() => setMobileMenuOpen(true)}
        />

        <main className="flex-1 max-w-[1280px] w-full mx-auto px-4 sm:px-8 py-8">
          {activeScreen === 'overview' && (
            <OverviewScreen
              safetyScore={safetyScore}
              protections={protections}
              logs={logs}
              trustedContacts={trustedContacts}
              onToggleProtection={handleToggleProtection}
              onUpdateLogStatus={handleUpdateLogStatus}
              onQuickAnalyze={handleQuickAnalyze}
              onNavigate={(screen) => {
                setActionFeedback(null);
                setActiveScreen(screen);
              }}
            />
          )}

          {activeScreen === 'url-inspector' && (
            <UrlInspectorScreen
              urlInput={urlInput}
              onChangeUrlInput={setUrlInput}
              trustedDomains={trustedDomains}
              blockedDomains={blockedDomains}
              onBlockDomain={handleBlockDomain}
              onTrustDomain={handleTrustDomain}
              onSaveLog={handleAddLog}
              actionFeedback={actionFeedback}
            />
          )}

          {activeScreen === 'qr-scanner' && (
            <QrScannerScreen
              trustedDomains={trustedDomains}
              blockedDomains={blockedDomains}
              onInspectUrlInFull={handleInspectUrlFromSms}
              onBlockDomain={handleBlockDomain}
              onTrustDomain={handleTrustDomain}
              onSaveLog={handleAddLog}
              actionFeedback={actionFeedback}
            />
          )}

          {activeScreen === 'scam-check' && (
            <ScamCheckScreen
              senderInput={smsSender}
              messageInput={smsMessage}
              onChangeSender={setSmsSender}
              onChangeMessage={setSmsMessage}
              trustedDomains={trustedDomains}
              blockedDomains={blockedDomains}
              trustedContacts={trustedContacts}
              onInspectUrl={handleInspectUrlFromSms}
              onSaveLog={handleAddLog}
              actionFeedback={actionFeedback}
            />
          )}

          {activeScreen === 'protection-log' && (
            <ProtectionLogScreen
              logs={logs}
              trustedContacts={trustedContacts}
              trustedDomains={trustedDomains}
              onUpdateLogStatus={handleUpdateLogStatus}
              onDeleteLog={handleDeleteLog}
              onAddTrustedContact={handleAddTrustedContact}
              onRemoveTrustedContact={handleRemoveTrustedContact}
              onAddTrustedDomain={handleAddTrustedDomain}
              onRemoveTrustedDomain={handleRemoveTrustedDomain}
            />
          )}
        </main>
      </div>
    </div>
  );
}
