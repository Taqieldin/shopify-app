/**
 * Mobile NFC Scanner Example Component
 * 
 * This component demonstrates how to implement NFC scanning for product verification.
 * Works on Android (Chrome) and iOS 14+ (Safari with NFC support)
 */

import { useState, useEffect } from 'react';

interface NFCScannerProps {
  onScan?: (serial: string) => void;
  onError?: (error: string) => void;
  baseUrl?: string;
}

interface ScanResult {
  verified: boolean;
  serial: string;
  product_title: string;
  status: string;
  message: string;
}

export function MobileNFCScanner({ onScan, onError, baseUrl = '' }: NFCScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check NFC support
    if (typeof window !== 'undefined' && 'NDEFReader' in window) {
      setIsSupported(true);
    }
  }, []);

  const startScanning = async () => {
    if (!isSupported) {
      const errorMsg = 'NFC is not supported on this device';
      setError(errorMsg);
      onError?.(errorMsg);
      return;
    }

    try {
      setIsScanning(true);
      setError(null);
      setScanResult(null);

      // @ts-ignore - NDEFReader is not in TypeScript types yet
      const reader = new NDEFReader();
      await reader.scan();

      console.log('NFC scan started. Tap a tag to read...');

      // @ts-ignore
      reader.onreading = async (event) => {
        console.log('NFC tag detected:', event.serialNumber);

        try {
          // Verify via API
          const response = await fetch(`${baseUrl}/api/public/verify/nfc/${event.serialNumber}`);
          const result: ScanResult = await response.json();

          setScanResult(result);

          if (result.verified) {
            onScan?.(result.serial);
            
            // Auto-redirect to passport after 2 seconds
            setTimeout(() => {
              window.location.href = `${baseUrl}/passport/${result.serial}`;
            }, 2000);
          } else {
            const errorMsg = result.message || 'Verification failed';
            setError(errorMsg);
            onError?.(errorMsg);
          }
        } catch (err) {
          const errorMsg = 'Failed to verify NFC tag';
          setError(errorMsg);
          onError?.(errorMsg);
        }
      };

      // @ts-ignore
      reader.onerror = (event: any) => {
        console.error('NFC read error:', event);
        const errorMsg = 'NFC read error occurred';
        setError(errorMsg);
        setIsScanning(false);
        onError?.(errorMsg);
      };

    } catch (err: any) {
      const errorMsg = err.message || 'Failed to start NFC scan';
      setError(errorMsg);
      setIsScanning(false);
      onError?.(errorMsg);
    }
  };

  const stopScanning = () => {
    setIsScanning(false);
    setScanResult(null);
    setError(null);
  };

  if (!isSupported) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <div style={styles.icon}>📱</div>
          <h3 style={styles.title}>NFC Not Available</h3>
          <p style={styles.description}>
            NFC scanning is not supported on this device or browser.
          </p>
          <p style={styles.hint}>
            Try using Chrome on Android or Safari on iOS 14+
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        {!isScanning && !scanResult && (
          <>
            <div style={styles.icon}>🏷️</div>
            <h3 style={styles.title}>Scan NFC Tag</h3>
            <p style={styles.description}>
              Tap your phone against the product's NFC tag to verify authenticity.
            </p>
            <button style={styles.button} onClick={startScanning}>
              Start Scanning
            </button>
          </>
        )}

        {isScanning && !scanResult && (
          <>
            <div style={styles.scanAnimation}>
              <div style={styles.pulse}></div>
              <div style={styles.scanIcon}>📡</div>
            </div>
            <h3 style={styles.title}>Ready to Scan</h3>
            <p style={styles.description}>
              Hold your phone near the NFC tag...
            </p>
            <button style={styles.buttonSecondary} onClick={stopScanning}>
              Cancel
            </button>
          </>
        )}

        {scanResult && (
          <>
            {scanResult.verified ? (
              <>
                <div style={styles.iconSuccess}>✓</div>
                <h3 style={styles.titleSuccess}>Authenticated!</h3>
                <p style={styles.description}>{scanResult.product_title}</p>
                <div style={styles.badge}>Serial: {scanResult.serial}</div>
                <p style={styles.hint}>Redirecting to passport...</p>
              </>
            ) : (
              <>
                <div style={styles.iconError}>⚠️</div>
                <h3 style={styles.titleError}>Verification Failed</h3>
                <p style={styles.description}>{scanResult.message}</p>
                <div style={styles.badgeError}>Status: {scanResult.status}</div>
                <button style={styles.button} onClick={startScanning}>
                  Try Again
                </button>
              </>
            )}
          </>
        )}

        {error && (
          <div style={styles.errorMessage}>
            <span style={styles.errorIcon}>⚠️</span>
            {error}
          </div>
        )}
      </div>

      <div style={styles.instructions}>
        <h4 style={styles.instructionsTitle}>How to Scan:</h4>
        <ol style={styles.instructionsList}>
          <li>Tap "Start Scanning" button</li>
          <li>Hold your phone near the NFC tag</li>
          <li>Keep steady until verification completes</li>
        </ol>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    maxWidth: '400px',
    margin: '0 auto',
    padding: '20px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  card: {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    borderRadius: '16px',
    padding: '40px 24px',
    textAlign: 'center',
    color: '#ffffff',
    boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
  },
  icon: {
    fontSize: '64px',
    marginBottom: '16px',
  },
  iconSuccess: {
    fontSize: '64px',
    marginBottom: '16px',
    animation: 'bounce 0.5s ease',
  },
  iconError: {
    fontSize: '64px',
    marginBottom: '16px',
  },
  title: {
    fontSize: '24px',
    fontWeight: '600',
    margin: '0 0 12px 0',
  },
  titleSuccess: {
    fontSize: '24px',
    fontWeight: '600',
    margin: '0 0 12px 0',
    color: '#10b981',
  },
  titleError: {
    fontSize: '24px',
    fontWeight: '600',
    margin: '0 0 12px 0',
    color: '#fbbf24',
  },
  description: {
    fontSize: '15px',
    opacity: 0.9,
    lineHeight: '1.5',
    margin: '0 0 24px 0',
  },
  hint: {
    fontSize: '13px',
    opacity: 0.7,
    margin: '12px 0 0 0',
  },
  button: {
    background: '#ffffff',
    color: '#667eea',
    border: 'none',
    padding: '14px 32px',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
  },
  buttonSecondary: {
    background: 'transparent',
    color: '#ffffff',
    border: '2px solid #ffffff',
    padding: '12px 32px',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  scanAnimation: {
    position: 'relative',
    width: '120px',
    height: '120px',
    margin: '0 auto 24px',
  },
  pulse: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: '50%',
    background: 'rgba(255, 255, 255, 0.3)',
    animation: 'pulse 2s infinite',
  },
  scanIcon: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    fontSize: '48px',
  },
  badge: {
    display: 'inline-block',
    background: 'rgba(255, 255, 255, 0.2)',
    padding: '8px 16px',
    borderRadius: '20px',
    fontSize: '13px',
    fontWeight: '600',
    marginTop: '12px',
  },
  badgeError: {
    display: 'inline-block',
    background: 'rgba(251, 191, 36, 0.2)',
    padding: '8px 16px',
    borderRadius: '20px',
    fontSize: '13px',
    fontWeight: '600',
    marginTop: '12px',
    marginBottom: '24px',
  },
  errorMessage: {
    background: 'rgba(239, 68, 68, 0.2)',
    padding: '12px 16px',
    borderRadius: '8px',
    fontSize: '14px',
    marginTop: '16px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  errorIcon: {
    fontSize: '20px',
  },
  instructions: {
    marginTop: '32px',
    padding: '24px',
    background: '#f9fafb',
    borderRadius: '12px',
  },
  instructionsTitle: {
    fontSize: '16px',
    fontWeight: '600',
    margin: '0 0 12px 0',
    color: '#18181b',
  },
  instructionsList: {
    margin: 0,
    paddingLeft: '20px',
    fontSize: '14px',
    color: '#52525b',
    lineHeight: '1.8',
  },
};

/**
 * Add CSS animations to your global stylesheet:
 * 
 * @keyframes pulse {
 *   0%, 100% {
 *     opacity: 1;
 *     transform: scale(1);
 *   }
 *   50% {
 *     opacity: 0.5;
 *     transform: scale(1.1);
 *   }
 * }
 * 
 * @keyframes bounce {
 *   0%, 100% {
 *     transform: translateY(0);
 *   }
 *   50% {
 *     transform: translateY(-10px);
 *   }
 * }
 */

// Usage example:
// <MobileNFCScanner
//   onScan={(serial) => console.log('Scanned:', serial)}
//   onError={(error) => console.error('Error:', error)}
//   baseUrl="https://passport.example.com"
// />
