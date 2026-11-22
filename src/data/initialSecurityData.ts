import {
  ProtectionControl,
  SecurityLogEntry,
  TrustedContact,
} from '../types/security';

export const URL_PRESETS: Array<{ label: string; url: string }> = [
  {
    label: 'Bank Lookalike',
    url: 'https://secure-login.paypa1-verify.xyz/auth?session=9842&redirect=card_update',
  },
  {
    label: 'Delivery Fee Trap',
    url: 'https://usps-redelivery-fee.top/track?id=US94021&verify=address',
  },
  {
    label: 'Verified Medicare',
    url: 'https://www.medicare.gov/account/benefits',
  },
  {
    label: 'Shortened Redirect',
    url: 'https://bit.ly/3xClaimBonus99',
  },
];

export const SMS_PRESETS: Array<{
  label: string;
  sender: string;
  message: string;
}> = [
  {
    label: 'USPS Package Scam',
    sender: '+1 (415) 890-4412',
    message:
      'USPS Final Notice: Your parcel cannot be delivered due to an incomplete address. Confirm your delivery within 24 hours with a $0.30 redelivery fee at https://usps-redelivery-fee.top/track?id=US94021',
  },
  {
    label: 'Family Emergency Text',
    sender: '+1 (305) 712-9904',
    message:
      'Hi Mom, I dropped my phone in water and had to get a temporary one. Text me on this number—my bank account is locked and I need $450 via Zelle or an Apple gift card today only.',
  },
  {
    label: 'IRS Warrant Threat',
    sender: 'tax-compliance@notice-portal.xyz',
    message:
      'URGENT ACTION: Your Social Security benefits are suspended pending a federal warrant. Reply with your SSN or wire transfer immediately to avoid legal action.',
  },
  {
    label: 'Routine Pharmacy Alert',
    sender: '898211',
    message:
      'CVS Pharmacy: Your prescription #4419 is ready for pickup at 420 Oak St. Questions? Visit https://www.cvs.com or call your local pharmacy.',
  },
];

export const INITIAL_PROTECTIONS: ProtectionControl[] = [
  {
    id: 'prot-link-shield',
    title: 'Automatic Link Screening',
    description: 'Inspect web addresses for lookalike bank and government domains before opening.',
    category: 'Browser & Mail',
    enabled: true,
    weight: 25,
  },
  {
    id: 'prot-unknown-sms',
    title: 'Unknown Sender Filtering',
    description: 'Flag urgent text messages containing gift card, wire transfer, or PIN requests.',
    category: 'Messaging',
    enabled: true,
    weight: 22,
  },
  {
    id: 'prot-2fa-passkey',
    title: 'Two-Step Verification & Passkey',
    description: 'Require a second confirmation step when signing in to banking and medical portals.',
    category: 'Account Access',
    enabled: true,
    weight: 25,
  },
  {
    id: 'prot-trusted-advisor',
    title: 'Family Advisor Confirmation',
    description: 'Keep at least one verified family contact ready before approving unusual money requests.',
    category: 'Trusted Circle',
    enabled: false,
    weight: 18,
  },
];

export const INITIAL_SECURITY_LOGS: SecurityLogEntry[] = [
  {
    id: 'log-101',
    timestamp: 'Today, 09:42 AM',
    kind: 'url',
    title: 'Phishing Threat: Fake PayPal Link',
    target: 'paypa1-verify.xyz',
    verdict: 'threat',
    status: 'needs-review',
    explanation:
      'Pretends to be PayPal, but the registered domain is "paypa1-verify.xyz" (using the number 1 instead of the letter L).',
    recommendedAction: 'Block this domain so it cannot open from messages.',
  },
  {
    id: 'log-102',
    timestamp: 'Today, 08:15 AM',
    kind: 'sms',
    title: 'USPS Redelivery Fee Text',
    target: '+1 (415) 890-4412',
    verdict: 'threat',
    status: 'blocked',
    explanation:
      'Demands a redelivery fee within 24 hours via an unverified ".top" website link.',
    recommendedAction: 'Sender blocked and message quarantined.',
  },
  {
    id: 'log-103',
    timestamp: 'Yesterday, 04:20 PM',
    kind: 'sms',
    title: 'Unrecognized Delivery Link',
    target: 'bit.ly/3xClaimBonus99',
    verdict: 'caution',
    status: 'needs-review',
    explanation:
      'Uses a shortened link that hides the final website destination until opened.',
    recommendedAction: 'Confirm with the sender before opening.',
  },
  {
    id: 'log-104',
    timestamp: 'Yesterday, 11:05 AM',
    kind: 'url',
    title: 'Official Medicare Account Portal',
    target: 'medicare.gov',
    verdict: 'safe',
    status: 'trusted',
    explanation:
      'Verified official U.S. government domain over encrypted HTTPS.',
    recommendedAction: 'Safe to sign in normally.',
  },
];

export const INITIAL_TRUSTED_CONTACTS: TrustedContact[] = [
  {
    id: 'tc-1',
    name: 'Sarah Vance',
    relationship: 'Daughter · Primary Safety Advisor',
    phone: '(503) 555-0148',
    email: 'sarah.vance@example.org',
    role: 'Call before sending money or sharing account codes',
  },
  {
    id: 'tc-2',
    name: 'David Vance',
    relationship: 'Son · Backup Contact',
    phone: '(503) 555-0192',
    email: 'david.vance@example.org',
    role: 'Technical & banking verification',
  },
  {
    id: 'tc-3',
    name: 'Chase Fraud Desk (Card Back)',
    relationship: 'Verified Bank Support',
    phone: '(800) 935-9935',
    email: 'support@chase.com',
    role: 'Use only this official number, never numbers in texts',
  },
];
