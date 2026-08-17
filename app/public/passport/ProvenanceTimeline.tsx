import { useState, useEffect } from 'react';

interface ProvenanceEvent {
  type: 'MANUFACTURED' | 'AUTHENTICATED' | 'SOLD' | 'REGISTERED' | 'OWNED' | 'SERVICE' | 'TRANSFERRED' | 'CARE' | 'WARRANTY' | 'STATUS_CHANGE';
  date: string;
  title: string;
  description?: string;
  metadata?: Record<string, unknown>;
}

interface ProvenanceData {
  serial: string;
  product_title: string;
  current_status: string;
  events: ProvenanceEvent[];
}

interface ProvenanceTimelineProps {
  serial: string;
  shopId?: string;
}

const EVENT_ICONS: Record<string, string> = {
  MANUFACTURED: '🛠️',
  AUTHENTICATED: '✓',
  SOLD: '🛍️',
  REGISTERED: '📝',
  OWNED: '👤',
  SERVICE: '🔧',
  TRANSFERRED: '↔️',
  CARE: '💎',
  WARRANTY: '🛡️',
  STATUS_CHANGE: '⚠️',
};

const EVENT_COLORS: Record<string, string> = {
  MANUFACTURED: '#3b82f6',
  AUTHENTICATED: '#10b981',
  SOLD: '#8b5cf6',
  REGISTERED: '#06b6d4',
  OWNED: '#f59e0b',
  SERVICE: '#ef4444',
  TRANSFERRED: '#ec4899',
  CARE: '#14b8a6',
  WARRANTY: '#6366f1',
  STATUS_CHANGE: '#f97316',
};

export function ProvenanceTimeline({ serial }: ProvenanceTimelineProps) {
  const [data, setData] = useState<ProvenanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadProvenance();
  }, [serial]);

  const loadProvenance = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/public/provenance/${serial}`);
      const result = await response.json();
      if (result.success) {
        setData(result.data);
      } else {
        setError('Failed to load provenance');
      }
    } catch (err) {
      setError('Failed to load provenance timeline');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date);
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loading}>Loading provenance timeline...</div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div style={styles.container}>
        <div style={styles.error}>{error || 'No provenance data available'}</div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>Product Journey</h2>
        <p style={styles.subtitle}>
          Complete provenance history for {data.serial}
        </p>
      </div>

      <div style={styles.timeline}>
        {data.events.map((event, index) => (
          <div key={index} style={styles.timelineItem}>
            <div
              style={{
                ...styles.timelineMarker,
                borderColor: EVENT_COLORS[event.type] || '#6b7280',
              }}
            >
              <span style={styles.icon}>{EVENT_ICONS[event.type] || '•'}</span>
            </div>
            <div style={styles.timelineContent}>
              <div style={styles.eventHeader}>
                <span style={styles.eventTitle}>{event.title}</span>
                <span style={styles.eventDate}>{formatDate(event.date)}</span>
              </div>
              {event.description && (
                <p style={styles.eventDescription}>{event.description}</p>
              )}
            </div>
          </div>
        ))}
      </div>

      <div style={styles.footer}>
        <div
          style={{
            ...styles.statusBadge,
            background: data.current_status === 'ACTIVE' ? '#dcfce7' : '#fed7aa',
            color: data.current_status === 'ACTIVE' ? '#166534' : '#9a3412',
          }}
        >
          Current Status: {data.current_status}
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    maxWidth: '800px',
    margin: '0 auto',
    padding: '32px 16px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  header: {
    marginBottom: '32px',
    textAlign: 'center',
  },
  title: {
    fontSize: '28px',
    fontWeight: '600',
    margin: '0 0 8px 0',
    color: '#18181b',
  },
  subtitle: {
    fontSize: '14px',
    color: '#71717a',
    margin: 0,
  },
  timeline: {
    position: 'relative',
    paddingLeft: '40px',
  },
  timelineItem: {
    position: 'relative',
    marginBottom: '32px',
    display: 'flex',
    alignItems: 'flex-start',
  },
  timelineMarker: {
    position: 'absolute',
    left: '-40px',
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    background: '#ffffff',
    border: '3px solid',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  icon: {
    fontSize: '14px',
  },
  timelineContent: {
    flex: 1,
    paddingLeft: '24px',
    paddingTop: '4px',
  },
  eventHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '4px',
  },
  eventTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#18181b',
  },
  eventDate: {
    fontSize: '13px',
    color: '#71717a',
  },
  eventDescription: {
    fontSize: '14px',
    color: '#52525b',
    margin: '4px 0 0 0',
    lineHeight: '1.5',
  },
  footer: {
    marginTop: '40px',
    textAlign: 'center',
  },
  statusBadge: {
    display: 'inline-block',
    padding: '8px 16px',
    borderRadius: '20px',
    fontSize: '14px',
    fontWeight: '600',
  },
  loading: {
    textAlign: 'center',
    padding: '48px 0',
    color: '#71717a',
    fontSize: '14px',
  },
  error: {
    textAlign: 'center',
    padding: '48px 0',
    color: '#dc2626',
    fontSize: '14px',
  },
};
