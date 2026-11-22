import {
  QrAnalysisResult,
  QrFinding,
  QrPayloadKind,
  QrResultLabel,
  QueryParamDetail,
  SmsAnalysisResult,
  SmsPhraseMatch,
  ThreatVerdict,
  UrlFinding,
  UrlPartAnalysis,
} from '../types/security';

const KNOWN_SAFE_DOMAINS = new Set([
  'irs.gov',
  'medicare.gov',
  'ssa.gov',
  'usa.gov',
  'usps.com',
  'ups.com',
  'fedex.com',
  'chase.com',
  'bankofamerica.com',
  'wellsfargo.com',
  'paypal.com',
  'apple.com',
  'microsoft.com',
  'amazon.com',
  'cvs.com',
  'walgreens.com',
  'google.com',
]);

const HIGH_RISK_TLDS = new Set([
  'xyz',
  'top',
  'click',
  'tk',
  'gq',
  'ml',
  'cf',
  'zip',
  'mov',
  'club',
  'online',
  'icu',
  'work',
]);

const URL_SHORTENERS = new Set([
  'bit.ly',
  'tinyurl.com',
  't.co',
  'rb.gy',
  'ow.ly',
  'is.gd',
  'cutt.ly',
]);

const BRAND_SPOOF_RULES: Array<{
  brand: string;
  officialDomain: string;
  regex: RegExp;
}> = [
  {
    brand: 'PayPal',
    officialDomain: 'paypal.com',
    regex: /paypa[l1!]|pay-?pal|pp-?verify/i,
  },
  {
    brand: 'Amazon',
    officialDomain: 'amazon.com',
    regex: /arnazon|amaz[0o]n|arnaz0n|amazon-?security/i,
  },
  {
    brand: 'Chase Bank',
    officialDomain: 'chase.com',
    regex: /chas[3e]|chase-?(login|verify|alert|bank)/i,
  },
  {
    brand: 'Bank of America',
    officialDomain: 'bankofamerica.com',
    regex: /bankofamer[1i]ca|bofa-?(alert|verify|secure)/i,
  },
  {
    brand: 'USPS Postal Service',
    officialDomain: 'usps.com',
    regex: /usps-?(redelivery|track|fee|parcel|address|delivery)/i,
  },
  {
    brand: 'Medicare',
    officialDomain: 'medicare.gov',
    regex: /medicare-?(verify|card|benefits|portal)/i,
  },
  {
    brand: 'Apple',
    officialDomain: 'apple.com',
    regex: /app[1l]e-?(id|verify|support|icloud)|icl[0o]ud-?verify/i,
  },
  {
    brand: 'Microsoft',
    officialDomain: 'microsoft.com',
    regex: /m[1i]cr[0o]s[0o]ft|rnicrosoft|office365-?login/i,
  },
];

const SENSITIVE_QUERY_KEYS = new Set([
  'redirect',
  'next',
  'url',
  'token',
  'session',
  'ssn',
  'pin',
  'card',
  'verify',
  'password',
  'login',
  'wallet',
]);

function splitHostname(hostname: string): {
  subdomain: string;
  registeredDomain: string;
  tld: string;
} {
  const cleanHost = hostname.toLowerCase().replace(/\.$/, '');
  const parts = cleanHost.split('.').filter(Boolean);

  if (parts.length <= 1) {
    return { subdomain: '', registeredDomain: cleanHost, tld: '' };
  }

  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(cleanHost)) {
    return { subdomain: '', registeredDomain: cleanHost, tld: 'IPv4' };
  }

  const tld = parts[parts.length - 1];
  const domainCore = parts[parts.length - 2];
  const registeredDomain = `${domainCore}.${tld}`;
  const subdomain = parts.slice(0, -2).join('.');

  return { subdomain, registeredDomain, tld };
}

export function analyzeUrl(
  input: string,
  extraSafeDomains: string[] = [],
  blockedDomains: string[] = []
): UrlPartAnalysis {
  const trimmed = input.trim();

  if (!trimmed) {
    return {
      rawInput: input,
      normalizedUrl: '',
      isValidSyntax: false,
      protocol: '',
      subdomain: '',
      registeredDomain: '',
      tld: '',
      path: '',
      queryParams: [],
      deceptiveDomainMatch: false,
      verdict: 'caution',
      verdictTitle: 'Enter a web address to inspect',
      summary: 'Paste any link from a text message, email, or browser address bar to see who really owns it.',
      nextStep: 'Paste a full link above or select one of the example links to run an inspection.',
      findings: [],
    };
  }

  const hasProtocol = /^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//.test(trimmed);
  const candidate = hasProtocol ? trimmed : `https://${trimmed}`;

  let parsed: URL;
  try {
    parsed = new URL(candidate);
  } catch {
    return {
      rawInput: input,
      normalizedUrl: trimmed,
      isValidSyntax: false,
      protocol: '',
      subdomain: '',
      registeredDomain: trimmed,
      tld: '',
      path: '',
      queryParams: [],
      deceptiveDomainMatch: false,
      verdict: 'caution',
      verdictTitle: 'Unrecognized link format',
      summary: 'This text does not look like a complete website address. Avoid opening broken or disguised links.',
      nextStep: 'Double-check the spelling or paste the full address starting with https://.',
      findings: [
        {
          id: 'invalid-syntax',
          severity: 'caution',
          title: 'Malformed address structure',
          explanation: 'Standard web addresses follow a domain.com structure. Malformed links are often broken pastes or obfuscated redirects.',
        },
      ],
    };
  }

  const protocol = parsed.protocol.replace(':', '');
  const hostname = parsed.hostname.toLowerCase();
  const { subdomain, registeredDomain, tld } = splitHostname(hostname);
  const path = parsed.pathname || '/';

  const safeSet = new Set([
    ...KNOWN_SAFE_DOMAINS,
    ...extraSafeDomains.map((d) => d.toLowerCase().trim()),
  ]);
  const blockedSet = new Set(blockedDomains.map((d) => d.toLowerCase().trim()));

  const findings: UrlFinding[] = [];
  let score = 0; // 0 = safe, 1-2 = caution, 3+ = threat
  let deceptiveDomainMatch = false;
  let impersonatedBrand: string | undefined;

  if (blockedSet.has(registeredDomain) || blockedSet.has(hostname)) {
    score += 5;
    deceptiveDomainMatch = true;
    findings.push({
      id: 'user-blocked',
      severity: 'threat',
      title: 'Previously blocked on this device',
      explanation: `You or your family administrator added ${registeredDomain} to your blocked list.`,
    });
  }

  // Check brand impersonation / homoglyph spoofing
  for (const rule of BRAND_SPOOF_RULES) {
    const fullHost = hostname;
    if (registeredDomain !== rule.officialDomain && rule.regex.test(fullHost)) {
      score += 4;
      deceptiveDomainMatch = true;
      impersonatedBrand = rule.brand;
      findings.push({
        id: `spoof-${rule.brand}`,
        severity: 'threat',
        title: `Impersonates ${rule.brand}`,
        explanation: `The real ${rule.brand} website uses "${rule.officialDomain}". This link goes to "${registeredDomain}", a lookalike domain designed to steal logins or payment details.`,
      });
      break;
    }
  }

  // Raw IP address check
  if (tld === 'IPv4') {
    score += 3;
    deceptiveDomainMatch = true;
    findings.push({
      id: 'raw-ip',
      severity: 'threat',
      title: 'Uses a raw numerical IP address instead of a named domain',
      explanation: 'Legitimate banks, stores, and government agencies use registered website names, never raw server numbers.',
    });
  }

  // Credential @ trick
  if (parsed.username || parsed.password || trimmed.includes('@')) {
    score += 4;
    deceptiveDomainMatch = true;
    findings.push({
      id: 'at-trick',
      severity: 'threat',
      title: 'Contains hidden "@" address redirection',
      explanation: 'Scammers place a trusted company name before an "@" symbol so browsers silently send you to a completely different server after the "@".',
    });
  }

  // Suspicious TLD
  if (HIGH_RISK_TLDS.has(tld)) {
    score += 2;
    deceptiveDomainMatch = true;
    findings.push({
      id: 'risky-tld',
      severity: 'threat',
      title: `High-abuse top-level ending (.${tld})`,
      explanation: `Websites ending in .${tld} are heavily used in disposable phishing campaigns and are rarely used by established financial or government services.`,
    });
  }

  // Punycode homograph
  if (hostname.includes('xn--')) {
    score += 3;
    deceptiveDomainMatch = true;
    findings.push({
      id: 'punycode',
      severity: 'threat',
      title: 'Hidden international lookalike characters (Punycode)',
      explanation: 'This address uses special encoding ("xn--") to swap normal letters with lookalike characters from another alphabet.',
    });
  }

  // Excessive subdomains hiding the true owner
  const subdomainParts = subdomain ? subdomain.split('.') : [];
  if (subdomainParts.length >= 2) {
    score += 2;
    findings.push({
      id: 'deep-subdomain',
      severity: 'caution',
      title: 'Multiple prefixes before the real owner name',
      explanation: `Words before "${registeredDomain}" (such as "${subdomain}") can be written by anyone. Always look at "${registeredDomain}" right before the first slash.`,
    });
  }

  // Insecure HTTP
  if (protocol === 'http') {
    score += 1;
    findings.push({
      id: 'http-insecure',
      severity: 'caution',
      title: 'Unencrypted connection (http://)',
      explanation: 'This address does not use HTTPS encryption. Never type passwords, banking numbers, or personal details on an unencrypted page.',
    });
  }

  // URL Shortener
  if (URL_SHORTENERS.has(registeredDomain)) {
    score += 2;
    findings.push({
      id: 'shortener',
      severity: 'caution',
      title: 'Shortened link hides the final destination',
      explanation: `Services like ${registeredDomain} mask where the link actually goes. Only click shortened links from people you directly expect them from.`,
    });
  }

  // Sensitive query parameter inspection
  const queryParams: QueryParamDetail[] = [];
  parsed.searchParams.forEach((value, key) => {
    const lowerKey = key.toLowerCase();
    const isSensitive =
      SENSITIVE_QUERY_KEYS.has(lowerKey) ||
      /card|ssn|pin|pass|redirect|token|auth/i.test(lowerKey) ||
      /card|login|verify|http/i.test(value);

    if (isSensitive) {
      score += 1;
    }

    queryParams.push({
      key,
      value: value || '(empty)',
      flagged: isSensitive,
      note: isSensitive
        ? 'Requests tracking, redirection, or sensitive account verification.'
        : 'Standard page parameter.',
    });
  });

  if (queryParams.some((q) => q.flagged)) {
    findings.push({
      id: 'sensitive-params',
      severity: 'caution',
      title: 'Tracking or redirect parameters attached',
      explanation: 'The link carries hidden instructions after the "?" asking for account verification or redirecting your browser after loading.',
    });
  }

  // Verified safe domain boost if no critical spoofing flags
  const isKnownSafe = safeSet.has(registeredDomain) && score <= 1;

  if (isKnownSafe && findings.length === 0) {
    findings.push({
      id: 'verified-official',
      severity: 'safe',
      title: `Verified official domain (${registeredDomain})`,
      explanation: `"${registeredDomain}" matches an officially recognized organization and uses encrypted HTTPS.`,
    });
  }

  let verdict: ThreatVerdict = 'safe';
  let verdictTitle = 'Verified Safe Website';
  let summary = `This address leads directly to ${registeredDomain} over an encrypted connection with no deceptive indicators.`;
  let nextStep = 'You may visit this website normally, though you should still avoid sharing passwords unless you initiated the sign-in.';

  if (score >= 3 || deceptiveDomainMatch) {
    verdict = 'threat';
    verdictTitle = impersonatedBrand
      ? `Phishing Threat: Fake ${impersonatedBrand} Link`
      : 'Dangerous Deceptive Link Detected';
    summary = impersonatedBrand
      ? `Do not click or sign in here. This link pretends to be ${impersonatedBrand}, but the actual website owner is "${registeredDomain}".`
      : `This web address exhibits high-risk phishing patterns tied to "${registeredDomain}".`;
    nextStep = 'Close the message immediately, block this domain below, and visit the official website by typing its address yourself.';
  } else if (score >= 1 || !isKnownSafe) {
    verdict = 'caution';
    verdictTitle = URL_SHORTENERS.has(registeredDomain)
      ? 'Caution: Hidden Destination Link'
      : 'Proceed With Caution — Unverified Domain';
    summary =
      findings.length > 0
        ? `We noticed ${findings.length} warning sign${findings.length > 1 ? 's' : ''} connected to "${registeredDomain}".`
        : `"${registeredDomain}" is not in your verified safe list. Confirm you recognize the sender before entering personal information.`;
    nextStep = 'If you did not request this link, call the organization using the phone number on the back of your card or statement—never the link.';
  }

  return {
    rawInput: input,
    normalizedUrl: parsed.toString(),
    isValidSyntax: true,
    protocol,
    subdomain,
    registeredDomain,
    tld,
    path,
    queryParams,
    deceptiveDomainMatch,
    impersonatedBrand,
    verdict,
    verdictTitle,
    summary,
    nextStep,
    findings,
  };
}

const SMS_PATTERNS: Array<{
  regex: RegExp;
  category: string;
  severity: ThreatVerdict;
  explanation: string;
}> = [
  {
    regex: /\b(suspended|locked|deactivated|frozen|terminated|warrant|arrest|legal action|final notice|urgent action)\b/gi,
    category: 'Urgency & Fear Pressure',
    severity: 'threat',
    explanation: 'Scammers create artificial panic so you act quickly without pausing to verify.',
  },
  {
    regex: /\b(gift card|apple card|google play|steam card|wire transfer|bitcoin|crypto|zelle|venmo me)\b/gi,
    category: 'Untraceable Payment Request',
    severity: 'threat',
    explanation: 'No government agency, bank, or legitimate relative demands payment via gift cards, cryptocurrency, or instant wire.',
  },
  {
    regex: /\b(dropped my phone|new number|text me on this number|hey mom|hi mom|hi dad|hey grandma|emergency cash)\b/gi,
    category: 'Family Impersonation',
    severity: 'threat',
    explanation: 'A common scam where strangers pretend to be a grandchild or child with a broken phone asking for money.',
  },
  {
    regex: /\b(incomplete address|redelivery fee|customs fee|parcel cannot be delivered|package on hold|update delivery)\b/gi,
    category: 'Fake Delivery Trap',
    severity: 'threat',
    explanation: 'Postal carriers do not text random links demanding small redelivery fees or credit card numbers.',
  },
  {
    regex: /\b(social security|ssn|pin code|one-time code|verification code|routing number|confirm your card|cvv)\b/gi,
    category: 'Sensitive Credential Harvest',
    severity: 'threat',
    explanation: 'Legitimate support agents never ask you to text back your PIN, password, Social Security number, or one-time code.',
  },
  {
    regex: /\b(within 24 hours|immediately|today only|expires tonight|reply yes|click below|claim your refund|unclaimed)\b/gi,
    category: 'Countdown / Lure',
    severity: 'caution',
    explanation: 'Artificially tight deadlines or surprise refund offers are classic social-engineering hooks.',
  },
];

export function analyzeSmsMessage(
  sender: string,
  message: string,
  extraSafeDomains: string[] = [],
  blockedDomains: string[] = []
): SmsAnalysisResult {
  const cleanMessage = message.trim();
  const cleanSender = sender.trim();

  if (!cleanMessage) {
    return {
      sender: cleanSender,
      message,
      verdict: 'caution',
      verdictTitle: 'Paste a text message or email to inspect',
      summary: 'We highlight manipulative phrasing, fake urgency, and deceptive links in plain language.',
      nextStep: 'Paste a suspicious message above or choose a common scam example to test.',
      phraseMatches: [],
      detectedUrls: [],
      senderAssessment: 'Waiting for sender details.',
    };
  }

  const rawMatches: SmsPhraseMatch[] = [];
  for (const rule of SMS_PATTERNS) {
    const regex = new RegExp(rule.regex.source, rule.regex.flags);
    let match: RegExpExecArray | null;
    while ((match = regex.exec(cleanMessage)) !== null) {
      rawMatches.push({
        phrase: match[0],
        start: match.index,
        end: match.index + match[0].length,
        category: rule.category,
        severity: rule.severity,
        explanation: rule.explanation,
      });
    }
  }

  // Sort and deduplicate overlapping phrase ranges
  rawMatches.sort((a, b) => a.start - b.start || b.end - a.end);
  const phraseMatches: SmsPhraseMatch[] = [];
  let lastEnd = -1;
  for (const m of rawMatches) {
    if (m.start >= lastEnd) {
      phraseMatches.push(m);
      lastEnd = m.end;
    }
  }

  // Extract embedded URLs
  const urlMatches = cleanMessage.match(/(?:https?:\/\/|www\.)[^\s,;]+|[a-zA-Z0-9-]+\.(?:com|gov|org|net|xyz|top|click|ly|tk|info)(?:\/[^\s,;]*)?/gi) || [];
  const uniqueUrls = Array.from(new Set(urlMatches));
  const detectedUrls = uniqueUrls.map((u) => analyzeUrl(u, extraSafeDomains, blockedDomains));

  // Assess sender string
  let senderAssessment = 'Sender identity could not be independently verified.';
  let senderRisk = 0;

  if (!cleanSender) {
    senderAssessment = 'No sender number or address provided.';
  } else if (/@.*\.(xyz|top|click|gmail\.com|outlook\.com)/i.test(cleanSender) && /irs|medicare|bank|usps|amazon|paypal/i.test(cleanMessage)) {
    senderRisk = 2;
    senderAssessment = `Warning: Sender "${cleanSender}" uses a public or disposable email address while claiming to be an official institution.`;
  } else if (/^\+?(1)?[-.\s]?\d{3}[-.\s]?\d{3}[-.\s]?\d{4}$/.test(cleanSender) || /^\d{5,6}$/.test(cleanSender)) {
    senderAssessment = `Short code or standard phone number (${cleanSender}). Scammers frequently spoof caller IDs.`;
  } else if (/@(medicare\.gov|irs\.gov|chase\.com|usps\.com|cvs\.com)$/i.test(cleanSender)) {
    senderAssessment = `Sender domain matches an official domain (${cleanSender}), though display headers should still be treated carefully.`;
  }

  const hasThreatPhrase = phraseMatches.some((p) => p.severity === 'threat');
  const hasThreatUrl = detectedUrls.some((u) => u.verdict === 'threat');
  const hasCautionUrl = detectedUrls.some((u) => u.verdict === 'caution');

  let verdict: ThreatVerdict = 'safe';
  let verdictTitle = 'No Scam Indicators Found';
  let summary = 'This message does not contain common scam pressure tactics or deceptive links.';
  let nextStep = 'Still verify unexpected requests by calling the person or company on a number you already trust.';

  if (hasThreatPhrase || hasThreatUrl || senderRisk >= 2) {
    verdict = 'threat';
    verdictTitle = 'High-Risk Scam Pattern Detected';
    summary = `We detected ${phraseMatches.length} manipulative red flag${phraseMatches.length === 1 ? '' : 's'}${
      detectedUrls.length > 0 ? ` and ${detectedUrls.length} embedded link${detectedUrls.length === 1 ? '' : 's'}` : ''
    }. Do not reply, call back numbers in the message, or click any link.`;
    nextStep = 'Block this sender, delete the message, and check with a trusted family member if you feel unsure.';
  } else if (phraseMatches.length > 0 || hasCautionUrl) {
    verdict = 'caution';
    verdictTitle = 'Caution: Unverified Request or Link';
    summary = 'Elements of this message resemble common social-engineering or unverified link patterns.';
    nextStep = 'Pause before clicking or replying. Confirm directly through your official app or trusted contact.';
  }

  return {
    sender: cleanSender,
    message: cleanMessage,
    verdict,
    verdictTitle,
    summary,
    nextStep,
    phraseMatches,
    detectedUrls,
    senderAssessment,
  };
}

const PAYMENT_URI_REGEX =
  /^(?:upi:\/\/|bitcoin:|ethereum:|litecoin:|solana:|payto:|venmo:\/\/|cash:\/\/|zelle:|paypal\.me\/)/i;

const PAYMENT_HOST_OR_PATH_REGEX =
  /(?:paypal\.me|cash\.app|venmo\.com|checkout|pay-?now|invoice|redelivery-fee|parking-?pay|meter-?pay)/i;

export function analyzeQrPayload(
  rawDecodedText: string,
  extraSafeDomains: string[] = [],
  blockedDomains: string[] = []
): QrAnalysisResult {
  const trimmed = rawDecodedText.trim();

  if (!trimmed) {
    return {
      decodedText: '',
      payloadKind: 'Unreadable Image',
      resultLabel: 'Unable to Verify',
      verdict: 'caution',
      isPaymentRelated: false,
      requiresOpenWarning: false,
      summary:
        'No readable QR code was found in this image. The code may be blurry, cropped, or obscured.',
      recommendations: [
        'Try taking a clearer, straight-on photo with good lighting.',
        'If this QR code is a sticker placed over a parking meter or menu, avoid scanning it—scammers sometimes paste fake stickers over real signs.',
      ],
      findings: [
        {
          id: 'qr-unreadable',
          severity: 'caution',
          title: 'QR pattern could not be decoded',
          explanation:
            'We could not extract a valid data payload from the image provided.',
        },
      ],
    };
  }

  const lower = trimmed.toLowerCase();
  const findings: QrFinding[] = [];
  const recommendations: string[] = [];

  // Dangerous executable / script URIs
  if (/^(javascript:|data:|vbscript:|file:)/i.test(lower)) {
    return {
      decodedText: trimmed,
      payloadKind: 'Plain Text',
      resultLabel: 'Potentially Suspicious',
      verdict: 'threat',
      isPaymentRelated: false,
      requiresOpenWarning: true,
      summary:
        'This QR code contains an executable script or embedded data command rather than a normal website or text.',
      recommendations: [
        'Do not open or run this QR code content.',
        'Delete the image and warn others if it was found on a public flyer or sign.',
      ],
      findings: [
        {
          id: 'qr-script-uri',
          severity: 'threat',
          title: 'Embedded script or local file command',
          explanation:
            'QR codes beginning with "javascript:" or "data:" attempt to run hidden code instead of visiting a real website.',
        },
      ],
    };
  }

  // Classify payload kind
  let payloadKind: QrPayloadKind = 'Plain Text';
  let isPaymentRelated =
    PAYMENT_URI_REGEX.test(trimmed) || PAYMENT_HOST_OR_PATH_REGEX.test(trimmed);

  const isDirectHttpUrl = /^https?:\/\//i.test(trimmed);
  const looksLikeBareDomain =
    !trimmed.includes(' ') &&
    /^[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)+(?:\/[^\s]*)?$/.test(trimmed);

  let primaryUrl: string | undefined;
  let urlAnalysis: UrlPartAnalysis | undefined;

  if (PAYMENT_URI_REGEX.test(trimmed)) {
    payloadKind = 'Payment Link';
    isPaymentRelated = true;
  } else if (isDirectHttpUrl || looksLikeBareDomain) {
    payloadKind = isPaymentRelated ? 'Payment Link' : 'Website URL';
    primaryUrl = isDirectHttpUrl ? trimmed : `https://${trimmed}`;
  } else if (/^tel:/i.test(lower)) {
    payloadKind = 'Phone Call Link';
  } else if (/^(sms:|smsto:)/i.test(lower)) {
    payloadKind = 'Text Message Prompt';
  } else if (/^mailto:/i.test(lower)) {
    payloadKind = 'Email Address';
  } else if (/^wifi:/i.test(lower)) {
    payloadKind = 'Wi-Fi Network';
  } else {
    // Check if plain text embeds a URL
    const embeddedMatch = trimmed.match(/https?:\/\/[^\s,;]+/i);
    if (embeddedMatch) {
      primaryUrl = embeddedMatch[0];
      payloadKind = isPaymentRelated ? 'Payment Link' : 'Website URL';
    }
  }

  // Run existing URL inspection logic automatically whenever a URL is present
  if (primaryUrl) {
    urlAnalysis = analyzeUrl(primaryUrl, extraSafeDomains, blockedDomains);
    for (const uf of urlAnalysis.findings) {
      findings.push({
        id: `url-${uf.id}`,
        severity: uf.severity,
        title: uf.title,
        explanation: uf.explanation,
      });
    }
  }

  // Payment-specific warning
  if (isPaymentRelated) {
    findings.push({
      id: 'qr-payment-warning',
      severity: urlAnalysis?.verdict === 'threat' ? 'threat' : 'caution',
      title: 'Requests a financial payment or transfer',
      explanation:
        'QR payment scams ("quishing") frequently use stickers pasted on parking meters, restaurant tables, or mailers to route money to a scammer.',
    });
    recommendations.push(
      'Before paying, check whether the QR code is a loose sticker pasted over an original sign.'
    );
    recommendations.push(
      'Confirm the merchant name shown in your payment app matches the business standing in front of you.'
    );
  }

  // Analyze non-URL schemes or plain text via SMS scam heuristics
  if (payloadKind === 'Phone Call Link' || payloadKind === 'Text Message Prompt') {
    findings.push({
      id: 'qr-tel-sms',
      severity: 'caution',
      title:
        payloadKind === 'Phone Call Link'
          ? 'Triggers an immediate phone call'
          : 'Pre-fills a text message to an external number',
      explanation:
        'Confirm you trust the person or business behind this QR code before placing a call or sending a message.',
    });
    recommendations.push(
      'Never call a support number from an unexpected flyer or package insert—look up the official number independently.'
    );
  } else if (payloadKind === 'Wi-Fi Network') {
    findings.push({
      id: 'qr-wifi',
      severity: 'caution',
      title: 'Connects your device to a Wi-Fi network',
      explanation:
        'Public QR Wi-Fi codes can connect you to an unverified router where web traffic could be observed.',
    });
    recommendations.push(
      'Only join QR Wi-Fi networks provided directly by a trusted host, hotel, or home owner.'
    );
    recommendations.push(
      'Avoid signing in to banking or medical accounts while on an unfamiliar Wi-Fi network.'
    );
  } else if (!primaryUrl) {
    const textCheck = analyzeSmsMessage('', trimmed, extraSafeDomains, blockedDomains);
    for (const pm of textCheck.phraseMatches) {
      findings.push({
        id: `qr-txt-${pm.start}`,
        severity: pm.severity,
        title: `${pm.category} (“${pm.phrase}”)`,
        explanation: pm.explanation,
      });
    }
  }

  // Determine clear result label:
  // 'Potentially Suspicious' | 'No Obvious Threat Detected' | 'Unable to Verify'
  let resultLabel: QrResultLabel = 'Unable to Verify';
  let verdict: ThreatVerdict = 'caution';
  let summary = '';

  const hasThreat =
    findings.some((f) => f.severity === 'threat') ||
    urlAnalysis?.verdict === 'threat';
  const hasCaution =
    findings.some((f) => f.severity === 'caution') ||
    urlAnalysis?.verdict === 'caution';

  if (hasThreat) {
    resultLabel = 'Potentially Suspicious';
    verdict = 'threat';
    summary = urlAnalysis?.impersonatedBrand
      ? `Warning: This QR code leads to a deceptive link impersonating ${urlAnalysis.impersonatedBrand} (${urlAnalysis.registeredDomain}).`
      : isPaymentRelated
      ? 'Warning: This QR code points to an unverified or suspicious payment destination. Do not send money.'
      : 'Warning: Suspicious phishing or scam indicators were found inside this QR code.';
    recommendations.unshift(
      'Do not open this link or enter any passwords, card numbers, or personal details.'
    );
  } else if (isPaymentRelated) {
    resultLabel = 'Potentially Suspicious';
    verdict = 'caution';
    summary =
      'This QR code triggers a payment link or checkout page. Always verify the recipient independently before paying.';
  } else if (urlAnalysis) {
    if (urlAnalysis.verdict === 'safe') {
      resultLabel = 'No Obvious Threat Detected';
      verdict = 'safe';
      summary = `This QR code points directly to the verified website "${urlAnalysis.registeredDomain}" over an encrypted HTTPS connection.`;
      recommendations.push(
        'Even for trusted links, verify that the page title matches what you expect before signing in.'
      );
    } else if (urlAnalysis.findings.some((f) => f.id === 'shortener' || f.id === 'http-insecure' || f.id === 'deep-subdomain' || f.id === 'sensitive-params')) {
      resultLabel = 'Potentially Suspicious';
      verdict = 'caution';
      summary = `Caution: This QR code contains a link to "${urlAnalysis.registeredDomain}" with warning signs (${urlAnalysis.findings.map((f) => f.title).join('; ')}).`;
      recommendations.unshift(
        'Inspect the full link details before deciding whether to open this page.'
      );
    } else {
      resultLabel = 'Unable to Verify';
      verdict = 'caution';
      summary = `This QR code points to "${urlAnalysis.registeredDomain}", which is not in your verified website list. No obvious phishing trap was detected, but we cannot confirm who owns it.`;
      recommendations.push(
        'Only open this website if you personally trust the sign, flyer, or person who shared the QR code.'
      );
      recommendations.push(
        'Avoid typing passwords or banking information on unfamiliar websites.'
      );
    }
  } else if (hasCaution) {
    resultLabel = 'Potentially Suspicious';
    verdict = 'caution';
    summary =
      'This QR code triggers an external action or contains caution cues. Review the details below before proceeding.';
  } else if (trimmed.length <= 140 && /^[a-zA-Z0-9\s.,!?:'"()-]+$/.test(trimmed)) {
    resultLabel = 'No Obvious Threat Detected';
    verdict = 'safe';
    summary =
      'This QR code contains plain text only and does not open a website, payment prompt, or hidden link.';
    recommendations.push(
      'No link or action was triggered by reading this text.'
    );
  } else {
    resultLabel = 'Unable to Verify';
    verdict = 'caution';
    summary =
      'This QR code contains structured or encoded text that cannot be independently verified as an official website or trusted sender.';
    recommendations.push(
      'Check where the QR code came from before copying or acting on its contents.'
    );
  }

  return {
    decodedText: trimmed,
    payloadKind,
    resultLabel,
    verdict,
    isPaymentRelated,
    requiresOpenWarning:
      Boolean(primaryUrl || isPaymentRelated) && resultLabel !== 'No Obvious Threat Detected',
    primaryUrl,
    urlAnalysis,
    summary,
    recommendations: Array.from(new Set(recommendations)),
    findings,
  };
}
