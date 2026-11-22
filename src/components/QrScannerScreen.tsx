import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import jsQR from 'jsqr';
import QRCode from 'qrcode';
import {
  AlertTriangle,
  ArrowRight,
  Camera,
  CameraOff,
  CheckCircle2,
  ExternalLink,
  ImageUp,
  Lock,
  LockOpen,
  QrCode,
  RotateCcw,
  ShieldAlert,
  ShieldCheck,
} from 'lucide-react';
import { SecurityLogEntry } from '../types/security';
import { analyzeQrPayload } from '../utils/securityAnalyzers';
import { VerdictIndicator } from './VerdictIndicator';

interface QrScannerScreenProps {
  trustedDomains: string[];
  blockedDomains: string[];
  onInspectUrlInFull: (url: string) => void;
  onBlockDomain: (domain: string, title: string, explanation: string) => void;
  onTrustDomain: (domain: string, title: string, explanation: string) => void;
  onSaveLog: (entry: Omit<SecurityLogEntry, 'id' | 'timestamp'>) => void;
  actionFeedback: string | null;
}

const SAMPLE_QR_SCENARIOS: Array<{
  label: string;
  payload: string;
}> = [
  {
    label: 'Fake PayPal Sticker',
    payload: 'https://secure-login.paypa1-verify.xyz/auth?session=9842&redirect=card_update',
  },
  {
    label: 'Parking Payment Trap',
    payload: 'https://city-parking-pay.top/meter-pay?zone=412&amount=4.50',
  },
  {
    label: 'Verified Medicare QR',
    payload: 'https://www.medicare.gov/account/benefits',
  },
  {
    label: 'Unverified Flyer Site',
    payload: 'https://springfield-community-fair.org/schedule',
  },
];

function decodeImageElementWithJsQr(img: HTMLImageElement): string | null {
  const maxDimension = 1200;
  const scale = Math.min(
    1,
    maxDimension / Math.max(img.naturalWidth || 1, img.naturalHeight || 1)
  );
  const width = Math.max(1, Math.round((img.naturalWidth || 300) * scale));
  const height = Math.max(1, Math.round((img.naturalHeight || 300) * scale));

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return null;

  // Fill white behind transparent PNGs so dark QR modules always have crisp contrast
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);
  ctx.drawImage(img, 0, 0, width, height);

  const imageData = ctx.getImageData(0, 0, width, height);
  const code = jsQR(imageData.data, width, height, {
    inversionAttempts: 'attemptBoth',
  });
  return code?.data ?? null;
}

export function QrScannerScreen({
  trustedDomains,
  blockedDomains,
  onInspectUrlInFull,
  onBlockDomain,
  onTrustDomain,
  onSaveLog,
  actionFeedback,
}: QrScannerScreenProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);

  const [isDragging, setIsDragging] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isDecoding, setIsDecoding] = useState(false);

  const [previewDataUrl, setPreviewDataUrl] = useState<string | null>(null);
  const [sourceName, setSourceName] = useState<string | null>(null);
  const [hasScanResult, setHasScanResult] = useState(false);
  const [decodedText, setDecodedText] = useState<string>('');
  const [riskAcknowledged, setRiskAcknowledged] = useState(false);

  const cameraSupported =
    typeof navigator !== 'undefined' &&
    Boolean(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);

  const stopCamera = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  }, []);

  // Ensure camera always turns off if the user switches screens
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  const analysis = useMemo(() => {
    if (!hasScanResult) return null;
    return analyzeQrPayload(decodedText, trustedDomains, blockedDomains);
  }, [hasScanResult, decodedText, trustedDomains, blockedDomains]);

  const handleReset = useCallback(() => {
    stopCamera();
    setCameraError(null);
    setPreviewDataUrl(null);
    setSourceName(null);
    setHasScanResult(false);
    setDecodedText('');
    setRiskAcknowledged(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [stopCamera]);

  const processDataUrl = useCallback(
    (dataUrl: string, label: string) => {
      stopCamera();
      setCameraError(null);
      setIsDecoding(true);
      setRiskAcknowledged(false);
      setPreviewDataUrl(dataUrl);
      setSourceName(label);

      const img = new Image();
      img.onload = () => {
        const result = decodeImageElementWithJsQr(img);
        setDecodedText(result ?? '');
        setHasScanResult(true);
        setIsDecoding(false);
      };
      img.onerror = () => {
        setDecodedText('');
        setHasScanResult(true);
        setIsDecoding(false);
      };
      img.src = dataUrl;
    },
    [stopCamera]
  );

  const handleFileSelected = (file: File | null) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setCameraError('Please choose a valid image file (PNG, JPG, WebP, or GIF).');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        processDataUrl(reader.result, file.name);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSampleScenario = async (label: string, payload: string) => {
    try {
      const qrDataUrl = await QRCode.toDataURL(payload, {
        width: 360,
        margin: 2,
        color: {
          dark: '#0B1C30',
          light: '#FFFFFF',
        },
      });
      processDataUrl(qrDataUrl, `Sample: ${label}`);
    } catch {
      setDecodedText(payload);
      setSourceName(`Sample: ${label}`);
      setHasScanResult(true);
    }
  };

  const startCameraScan = async () => {
    if (!cameraSupported) {
      setCameraError(
        'Camera scanning is not supported in this browser. Upload a QR code photo instead.'
      );
      return;
    }

    handleReset();
    setCameraError(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } },
        audio: false,
      });
      streamRef.current = stream;
      setCameraActive(true);

      // Wait a tick for video element to mount
      requestAnimationFrame(() => {
        const video = videoRef.current;
        if (!video) return;
        video.srcObject = stream;
        video.play().catch(() => {
          setCameraError('Could not start camera preview. Please upload a QR image instead.');
          stopCamera();
        });

        const scanCanvas = document.createElement('canvas');
        const scanCtx = scanCanvas.getContext('2d', { willReadFrequently: true });

        const tick = () => {
          if (!streamRef.current || !videoRef.current || !scanCtx) return;

          if (video.readyState >= HTMLMediaElement.HAVE_ENOUGH_DATA && video.videoWidth > 0) {
            scanCanvas.width = video.videoWidth;
            scanCanvas.height = video.videoHeight;
            scanCtx.drawImage(video, 0, 0, scanCanvas.width, scanCanvas.height);
            const frame = scanCtx.getImageData(
              0,
              0,
              scanCanvas.width,
              scanCanvas.height
            );
            const code = jsQR(frame.data, frame.width, frame.height, {
              inversionAttempts: 'attemptBoth',
            });

            if (code && code.data) {
              const snapshot = scanCanvas.toDataURL('image/png');
              stopCamera();
              setPreviewDataUrl(snapshot);
              setSourceName('Camera Capture');
              setDecodedText(code.data);
              setHasScanResult(true);
              setRiskAcknowledged(false);
              return;
            }
          }

          rafRef.current = requestAnimationFrame(tick);
        };

        rafRef.current = requestAnimationFrame(tick);
      });
    } catch (err) {
      stopCamera();
      const message =
        err instanceof Error && err.name === 'NotAllowedError'
          ? 'Camera access was blocked. Allow camera permission in your browser bar or upload a QR code photo below.'
          : 'No usable camera was found on this device. You can upload a QR code image from your device instead.';
      setCameraError(message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Scanner Controls & Upload / Camera Card */}
      <section className="bg-white border border-[#E2E8F0] rounded-2xl p-6 sm:p-8 shadow-ambient">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="max-w-3xl">
            <h1 className="text-2xl sm:text-[32px] font-bold text-[#0B1C30] tracking-tight text-balance">
              QR Code Scanner
            </h1>
            <p className="comfort-body text-base text-[#45464D] mt-2">
              Upload a QR code photo or scan with your camera before opening it. We reveal the hidden website or payment link first so you never get caught by a fake sticker.
            </p>
          </div>

          {(hasScanResult || cameraActive || previewDataUrl) && (
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center justify-center gap-2 px-5 min-h-[48px] rounded-xl border-[1.5px] border-[#E2E8F0] bg-white hover:bg-[#F1F5F9] text-sm font-semibold text-[#0F172A] transition-colors whitespace-nowrap shrink-0"
            >
              <RotateCcw className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>Scan Another QR Code</span>
            </button>
          )}
        </div>

        {/* Upload Dropzone & Camera Action */}
        {!cameraActive ? (
          <div className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
            {/* Image File Upload Dropzone */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                const droppedFile = e.dataTransfer.files?.[0] ?? null;
                handleFileSelected(droppedFile);
              }}
              className={`lg:col-span-8 rounded-2xl border-2 border-dashed p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 transition-colors ${
                isDragging
                  ? 'border-[#0F172A] bg-[#EFF4FF]'
                  : 'border-[#CBD5E1] bg-[#F8FAFC]'
              }`}
            >
              <div className="flex items-center gap-4 text-center sm:text-left flex-col sm:flex-row">
                <div className="w-14 h-14 rounded-2xl bg-white border border-[#E2E8F0] flex items-center justify-center shrink-0 text-[#0F172A]">
                  <ImageUp className="w-7 h-7" aria-hidden="true" />
                </div>
                <div>
                  <p className="text-base font-bold text-[#0B1C30]">
                    Upload a QR code image from your device
                  </p>
                  <p className="text-sm text-[#45464D] mt-1">
                    Drag and drop a screenshot or photo (PNG, JPG, WebP), or choose a file.
                  </p>
                </div>
              </div>

              <div className="shrink-0">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileSelected(e.target.files?.[0] ?? null)}
                  className="sr-only"
                  id="qr-image-upload"
                />
                <label
                  htmlFor="qr-image-upload"
                  className="inline-flex items-center justify-center gap-2 px-5 min-h-[48px] rounded-xl bg-[#0F172A] hover:bg-[#1E293B] text-white text-sm font-semibold cursor-pointer transition-colors whitespace-nowrap"
                >
                  <QrCode className="w-4 h-4 shrink-0" aria-hidden="true" />
                  <span>Choose QR Image</span>
                </label>
              </div>
            </div>

            {/* Device Camera Option */}
            <div className="lg:col-span-4 rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC] p-6 flex flex-col justify-between gap-4">
              <div>
                <p className="text-base font-bold text-[#0B1C30]">
                  Use device camera
                </p>
                <p className="text-sm text-[#45464D] mt-1">
                  {cameraSupported
                    ? 'Point your camera at a paper flyer, parking meter, or screen QR code.'
                    : 'Live camera access is unavailable in this browser. Image upload works anytime.'}
                </p>
              </div>

              <button
                type="button"
                onClick={startCameraScan}
                disabled={!cameraSupported}
                className="w-full inline-flex items-center justify-center gap-2 px-5 min-h-[48px] rounded-xl border-[1.5px] border-[#0F172A] bg-white hover:bg-[#EFF4FF] disabled:border-[#CBD5E1] disabled:text-[#76777D] disabled:bg-[#F1F5F9] text-[#0F172A] text-sm font-semibold transition-colors whitespace-nowrap"
              >
                <Camera className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>Scan with Camera</span>
              </button>
            </div>
          </div>
        ) : (
          /* Live Camera Viewport */
          <div className="mt-6 rounded-2xl border border-[#E2E8F0] bg-[#0B1C30] p-4 sm:p-6 text-white">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div>
                <p className="text-base font-bold">Camera Scanner Ready</p>
                <p className="text-sm text-[#BEC6E0]">
                  Hold the QR code steady inside the frame. It will decode automatically.
                </p>
              </div>
              <button
                type="button"
                onClick={stopCamera}
                className="inline-flex items-center gap-2 px-4 min-h-[44px] rounded-xl bg-white text-[#0B1C30] hover:bg-[#EFF4FF] text-sm font-semibold transition-colors whitespace-nowrap shrink-0"
              >
                <CameraOff className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>Stop Camera</span>
              </button>
            </div>

            <div className="relative max-w-lg mx-auto aspect-[4/3] rounded-xl overflow-hidden bg-black border border-white/15">
              <video
                ref={videoRef}
                playsInline
                muted
                className="w-full h-full object-cover"
              />
              {/* Clean viewfinder corner guide */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-10 border-2 border-[#6CF8BB]/80 rounded-xl"
              />
            </div>
          </div>
        )}

        {cameraError && (
          <div
            role="alert"
            className="mt-4 rounded-xl bg-[#FFFBEB] border border-[#FDE68A] px-4 py-3 text-sm font-semibold text-[#B45309] flex items-start gap-2.5"
          >
            <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" aria-hidden="true" />
            <span>{cameraError}</span>
          </div>
        )}

        {/* Quick Scannable Sample QR Codes */}
        <div className="mt-5 flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-[#45464D] mr-1">
            Test with sample QR codes:
          </span>
          {SAMPLE_QR_SCENARIOS.map((sample) => {
            const isSelected = hasScanResult && decodedText === sample.payload;
            return (
              <button
                key={sample.label}
                type="button"
                onClick={() => handleSampleScenario(sample.label, sample.payload)}
                className={`px-3.5 min-h-[40px] rounded-lg text-xs font-semibold border transition-colors whitespace-nowrap shrink-0 ${
                  isSelected
                    ? 'bg-[#0F172A] text-white border-[#0F172A]'
                    : 'bg-[#F8FAFC] text-[#0B1C30] border-[#E2E8F0] hover:bg-[#EFF4FF]'
                }`}
              >
                {sample.label}
              </button>
            );
          })}
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

      {isDecoding && (
        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-8 text-center shadow-ambient">
          <p className="text-base font-semibold text-[#0B1C30]">
            Reading QR pattern and inspecting contents...
          </p>
        </div>
      )}

      {/* Decoded Results & Security Analysis */}
      {!isDecoding && analysis && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left 7 Cols: Decoded Payload + URL Inspection Breakdown */}
          <section className="lg:col-span-7 bg-white border border-[#E2E8F0] rounded-2xl p-6 sm:p-8 shadow-ambient space-y-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-[#0B1C30] tracking-tight">
                  Decoded QR Content
                </h2>
                <p className="text-sm text-[#45464D] mt-1">
                  {sourceName ? `${sourceName} · ` : ''}
                  Detected type: <strong className="text-[#0B1C30]">{analysis.payloadKind}</strong>
                </p>
              </div>

              {previewDataUrl && (
                <div className="w-20 h-20 rounded-xl border border-[#E2E8F0] bg-white p-1.5 shrink-0">
                  <img
                    src={previewDataUrl}
                    alt="Scanned QR code preview"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-contain rounded-lg"
                  />
                </div>
              )}
            </div>

            {/* Raw Decoded Content Box */}
            <div className="p-4 sm:p-5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
              <p className="text-xs font-semibold text-[#45464D] mb-2">
                Exact stored content
              </p>
              {analysis.decodedText ? (
                <p className="font-mono text-sm sm:text-base text-[#0B1C30] break-all leading-relaxed">
                  {analysis.decodedText}
                </p>
              ) : (
                <p className="text-sm text-[#45464D] italic">
                  No readable QR code data could be extracted from this image.
                </p>
              )}
            </div>

            {/* Automatic URL Inspection Summary (when QR contains a URL) */}
            {analysis.urlAnalysis && (
              <div className="pt-4 border-t border-[#E2E8F0] space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h3 className="text-base font-bold text-[#0B1C30]">
                    Automatic URL Inspection
                  </h3>
                  <button
                    type="button"
                    onClick={() => onInspectUrlInFull(analysis.urlAnalysis!.normalizedUrl)}
                    className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#0F172A] hover:underline whitespace-nowrap"
                  >
                    <span>Open full link anatomy</span>
                    <ArrowRight className="w-4 h-4 shrink-0" aria-hidden="true" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
                    <span className="text-xs font-semibold text-[#45464D]">
                      True Domain Owner
                    </span>
                    <p
                      className={`mt-1 font-mono text-sm font-bold break-all ${
                        analysis.urlAnalysis.verdict === 'threat'
                          ? 'text-[#B91C1C]'
                          : analysis.urlAnalysis.verdict === 'safe'
                          ? 'text-[#047857]'
                          : 'text-[#0B1C30]'
                      }`}
                    >
                      {analysis.urlAnalysis.registeredDomain}
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
                    <span className="text-xs font-semibold text-[#45464D]">
                      Connection Security
                    </span>
                    <div className="mt-1 flex items-center gap-2 font-mono text-sm font-semibold text-[#0B1C30]">
                      {analysis.urlAnalysis.protocol === 'https' ? (
                        <Lock className="w-4 h-4 text-[#10B981] shrink-0" aria-hidden="true" />
                      ) : (
                        <LockOpen className="w-4 h-4 text-[#D97706] shrink-0" aria-hidden="true" />
                      )}
                      <span>
                        {analysis.urlAnalysis.protocol.toUpperCase()}{' '}
                        {analysis.urlAnalysis.protocol === 'https'
                          ? '(Encrypted)'
                          : '(Unencrypted)'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Suspicious Indicators & Findings */}
            <div className="pt-4 border-t border-[#E2E8F0] space-y-3">
              <h3 className="text-base font-bold text-[#0B1C30]">
                Suspicious Indicators &amp; Checks ({analysis.findings.length})
              </h3>

              {analysis.findings.length === 0 ? (
                <p className="text-sm text-[#45464D]">
                  No suspicious markers or deceptive redirects were found in this QR code.
                </p>
              ) : (
                <div className="divide-y divide-[#E2E8F0]">
                  {analysis.findings.map((finding) => (
                    <div key={finding.id} className="py-3 first:pt-1 last:pb-0">
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
                      <p className="text-sm text-[#45464D] mt-1 leading-relaxed">
                        {finding.explanation}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* Right 5 Cols: Clear Result Label, Safety Recommendations & Pre-Open Warning */}
          <section className="lg:col-span-5 bg-white border border-[#E2E8F0] rounded-2xl p-6 sm:p-8 shadow-ambient space-y-5">
            <VerdictIndicator
              verdict={analysis.verdict}
              label={analysis.resultLabel}
            />

            <div>
              <h2 className="text-xl font-bold text-[#0B1C30] tracking-tight">
                {analysis.resultLabel}
              </h2>
              <p className="comfort-body text-base text-[#0B1C30] mt-2">
                {analysis.summary}
              </p>
            </div>

            {/* Safety Recommendations */}
            <div className="pt-4 border-t border-[#E2E8F0] space-y-2.5">
              <h3 className="text-sm font-bold text-[#0B1C30]">
                Safety recommendations
              </h3>
              <ul className="space-y-2 text-sm text-[#45464D] list-disc pl-5 leading-relaxed">
                {analysis.recommendations.map((rec, idx) => (
                  <li key={idx}>{rec}</li>
                ))}
              </ul>
            </div>

            {/* Explicit Pre-Action Warning before opening suspicious links or paying */}
            {analysis.requiresOpenWarning && (
              <div
                role="alert"
                className={`p-4 rounded-xl border ${
                  analysis.verdict === 'threat'
                    ? 'bg-[#FEF2F2] border-[#FECACA] text-[#93000A]'
                    : 'bg-[#FFFBEB] border-[#FDE68A] text-[#B45309]'
                }`}
              >
                <p className="text-sm font-bold">
                  {analysis.isPaymentRelated
                    ? 'Stop and verify before making any payment'
                    : 'Warning before opening this link'}
                </p>
                <p className="text-sm mt-1 leading-relaxed">
                  {analysis.isPaymentRelated
                    ? 'Never send money or enter card details from a QR code unless you confirmed the official merchant name directly.'
                    : 'Opening an unverified or suspicious QR destination could expose your passwords or device.'}
                </p>

                {analysis.primaryUrl && !riskAcknowledged && (
                  <button
                    type="button"
                    onClick={() => setRiskAcknowledged(true)}
                    className="mt-3 text-xs font-bold underline hover:opacity-80"
                  >
                    I understand the risk — show link anyway
                  </button>
                )}

                {analysis.primaryUrl && riskAcknowledged && (
                  <a
                    href={analysis.primaryUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold underline"
                  >
                    <span>Open {analysis.urlAnalysis?.registeredDomain ?? 'link'} in new tab</span>
                    <ExternalLink className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                  </a>
                )}
              </div>
            )}

            {/* Safe Verified Link Action */}
            {analysis.primaryUrl &&
              analysis.resultLabel === 'No Obvious Threat Detected' && (
                <a
                  href={analysis.primaryUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full inline-flex items-center justify-center gap-2 px-5 min-h-[48px] rounded-xl bg-[#10B981] hover:bg-[#059669] text-white text-sm font-semibold transition-colors whitespace-nowrap"
                >
                  <span>
                    Open Verified Site ({analysis.urlAnalysis?.registeredDomain})
                  </span>
                  <ExternalLink className="w-4 h-4 shrink-0" aria-hidden="true" />
                </a>
              )}

            {/* Working Security Actions */}
            <div className="pt-4 border-t border-[#E2E8F0] flex flex-col gap-3">
              {analysis.urlAnalysis && analysis.verdict !== 'safe' && (
                <button
                  type="button"
                  onClick={() =>
                    onBlockDomain(
                      analysis.urlAnalysis!.registeredDomain,
                      `QR Threat: ${analysis.urlAnalysis!.registeredDomain}`,
                      analysis.summary
                    )
                  }
                  className="w-full inline-flex items-center justify-center gap-2 px-5 min-h-[48px] rounded-xl bg-[#DC2626] hover:bg-[#B91C1C] text-white text-sm font-semibold transition-colors whitespace-nowrap"
                >
                  <ShieldAlert className="w-4 h-4 shrink-0" aria-hidden="true" />
                  <span>Block {analysis.urlAnalysis.registeredDomain}</span>
                </button>
              )}

              {analysis.urlAnalysis && (
                <button
                  type="button"
                  onClick={() =>
                    onTrustDomain(
                      analysis.urlAnalysis!.registeredDomain,
                      `Verified QR Site: ${analysis.urlAnalysis!.registeredDomain}`,
                      'Confirmed safe after QR code inspection.'
                    )
                  }
                  className="w-full inline-flex items-center justify-center gap-2 px-5 min-h-[48px] rounded-xl border-[1.5px] border-[#E2E8F0] bg-white hover:bg-[#F1F5F9] text-[#0F172A] text-sm font-semibold transition-colors whitespace-nowrap"
                >
                  <ShieldCheck className="w-4 h-4 shrink-0 text-[#10B981]" aria-hidden="true" />
                  <span>Mark Website as Trusted</span>
                </button>
              )}

              {analysis.decodedText && (
                <button
                  type="button"
                  onClick={() =>
                    onSaveLog({
                      kind: 'qr',
                      title: `QR Scan: ${analysis.resultLabel}`,
                      target:
                        analysis.urlAnalysis?.registeredDomain ||
                        analysis.decodedText.slice(0, 64),
                      verdict: analysis.verdict,
                      status:
                        analysis.resultLabel === 'No Obvious Threat Detected'
                          ? 'trusted'
                          : 'needs-review',
                      explanation: analysis.summary,
                      recommendedAction:
                        analysis.recommendations[0] ||
                        'Review QR code source before acting.',
                    })
                  }
                  className="w-full inline-flex items-center justify-center gap-2 px-5 min-h-[44px] rounded-xl text-sm font-semibold text-[#45464D] hover:text-[#0B1C30] hover:bg-[#EFF4FF] transition-colors whitespace-nowrap"
                >
                  Save QR Inspection to Protection Log
                </button>
              )}

              <button
                type="button"
                onClick={handleReset}
                className="w-full inline-flex items-center justify-center gap-2 px-5 min-h-[48px] rounded-xl bg-[#0F172A] hover:bg-[#1E293B] text-white text-sm font-semibold transition-colors whitespace-nowrap"
              >
                <RotateCcw className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>Reset &amp; Scan Another QR Code</span>
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
