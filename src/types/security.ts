export type ThreatVerdict = 'safe' | 'caution' | 'threat';

export type AppScreen =
  | 'overview'
  | 'url-inspector'
  | 'qr-scanner'
  | 'scam-check'
  | 'protection-log';

export type LogEntryStatus = 'needs-review' | 'blocked' | 'trusted';

export interface QueryParamDetail {
  key: string;
  value: string;
  flagged: boolean;
  note: string;
}

export interface UrlFinding {
  id: string;
  severity: ThreatVerdict;
  title: string;
  explanation: string;
}

export interface UrlPartAnalysis {
  rawInput: string;
  normalizedUrl: string;
  isValidSyntax: boolean;
  protocol: string;
  subdomain: string;
  registeredDomain: string;
  tld: string;
  path: string;
  queryParams: QueryParamDetail[];
  deceptiveDomainMatch: boolean;
  impersonatedBrand?: string;
  verdict: ThreatVerdict;
  verdictTitle: string;
  summary: string;
  nextStep: string;
  findings: UrlFinding[];
}

export interface SmsPhraseMatch {
  phrase: string;
  start: number;
  end: number;
  category: string;
  severity: ThreatVerdict;
  explanation: string;
}

export interface SmsAnalysisResult {
  sender: string;
  message: string;
  verdict: ThreatVerdict;
  verdictTitle: string;
  summary: string;
  nextStep: string;
  phraseMatches: SmsPhraseMatch[];
  detectedUrls: UrlPartAnalysis[];
  senderAssessment: string;
}

export type QrResultLabel =
  | 'Potentially Suspicious'
  | 'No Obvious Threat Detected'
  | 'Unable to Verify';

export type QrPayloadKind =
  | 'Website URL'
  | 'Payment Link'
  | 'Phone Call Link'
  | 'Text Message Prompt'
  | 'Email Address'
  | 'Wi-Fi Network'
  | 'Plain Text'
  | 'Unreadable Image';

export interface QrFinding {
  id: string;
  severity: ThreatVerdict;
  title: string;
  explanation: string;
}

export interface QrAnalysisResult {
  decodedText: string;
  payloadKind: QrPayloadKind;
  resultLabel: QrResultLabel;
  verdict: ThreatVerdict;
  isPaymentRelated: boolean;
  requiresOpenWarning: boolean;
  primaryUrl?: string;
  urlAnalysis?: UrlPartAnalysis;
  summary: string;
  recommendations: string[];
  findings: QrFinding[];
}

export interface SecurityLogEntry {
  id: string;
  timestamp: string;
  kind: 'url' | 'sms' | 'qr' | 'device';
  title: string;
  target: string;
  verdict: ThreatVerdict;
  status: LogEntryStatus;
  explanation: string;
  recommendedAction: string;
}

export interface ProtectionControl {
  id: string;
  title: string;
  description: string;
  category: string;
  enabled: boolean;
  weight: number;
}

export interface TrustedContact {
  id: string;
  name: string;
  relationship: string;
  phone: string;
  email: string;
  role: string;
}
