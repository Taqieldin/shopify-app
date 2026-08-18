import { useState, useEffect } from 'react';
import { authFetch } from '../../utils/api';
import {
  Page,
  Layout,
  Card,
  DataTable,
  Button,
  Banner,
  Badge,
  Text,
  TextField,
  InlineStack,
  ButtonGroup,
  Box,
  Spinner,
} from '@shopify/polaris';
import { CalendarDays } from 'lucide-react';

type EventStatus = 'SCHEDULED' | 'LIVE' | 'ENDED' | 'CANCELLED';

interface ClubEvent {
  id: string;
  name: string;
  description?: string;
  location?: string;
  starts_at: string;
  ends_at: string;
  status: EventStatus;
  credits_award: number;
  created_by: string;
  _count?: { check_ins: number };
}

export function EventsView() {
  const [events, setEvents] = useState<ClubEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [createOpen, setCreateOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [startsAt, setStartsAt] = useState('');
  const [endsAt, setEndsAt] = useState('');
  const [creditsAward, setCreditsAward] = useState('100');

  const [checkInEvent, setCheckInEvent] = useState<ClubEvent | null>(null);
  const [customerId, setCustomerId] = useState('');

  useEffect(() => { loadEvents(); }, []);

  const loadEvents = async () => {
    setLoading(true);
    try {
      const response = await authFetch('/api/admin/events');
      const data = await response.json();
      if (data.success) setEvents(data.data);
      else setError(data.error?.message || 'Failed to load events');
    } catch (err) {
      setError('Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  const createEvent = async () => {
    if (!name || !startsAt || !endsAt) { setError('Name, start and end times are required'); return; }
    setLoading(true);
    setError(null);
    try {
      const response = await authFetch('/api/admin/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name, description, location,
          starts_at: new Date(startsAt).toISOString(),
          ends_at: new Date(endsAt).toISOString(),
          credits_award: Number(creditsAward),
        }),
      });
      const data = await response.json();
      if (data.success) {
        setSuccess(`Event "${name}" created`);
        setCreateOpen(false);
        setName(''); setDescription(''); setLocation(''); setStartsAt(''); setEndsAt(''); setCreditsAward('100');
        loadEvents();
      } else setError(data.error?.message || 'Failed to create event');
    } catch (err) { setError('Failed to create event'); } finally { setLoading(false); }
  };

  const changeStatus = async (eventId: string, status: EventStatus) => {
    setLoading(true); setError(null);
    try {
      const response = await authFetch(`/api/admin/events/${eventId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      const data = await response.json();
      if (data.success) { setSuccess(`Event status changed to ${status}`); loadEvents(); }
      else setError(data.error?.message || 'Failed to change status');
    } catch (err) { setError('Failed to change status'); } finally { setLoading(false); }
  };

  const manualCheckIn = async () => {
    if (!checkInEvent || !customerId) return;
    setLoading(true); setError(null);
    try {
      const response = await authFetch(`/api/admin/events/${checkInEvent.id}/check-in`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customer_shopify_customer_id: customerId }),
      });
      const data = await response.json();
      if (data.success) {
        setSuccess(`Checked in, ${data.data.credits_awarded} credits awarded`);
        setCheckInEvent(null); setCustomerId(''); loadEvents();
      } else setError(data.error?.message || 'Check-in failed');
    } catch (err) { setError('Check-in failed'); } finally { setLoading(false); }
  };

  const statusTone = (s: EventStatus) => s === 'LIVE' ? 'success' : s === 'CANCELLED' ? 'critical' : 'attention';

  const rows = events.map((event) => [
    <div key="name">
      <Text as="span" variant="bodyMd" fontWeight="semibold">{event.name}</Text>
      {event.location && <Text as="p" variant="bodySm" tone="subdued">{event.location}</Text>}
    </div>,
    <Text as="span" key="when" variant="bodyMd">
      {new Date(event.starts_at).toLocaleString()} → {new Date(event.ends_at).toLocaleString()}
    </Text>,
    <Badge key="status" tone={statusTone(event.status)}>{event.status}</Badge>,
    <Text as="span" key="credits" variant="bodyMd">+{event.credits_award}</Text>,
    <Text as="span" key="count" variant="bodyMd">{event._count?.check_ins ?? 0}</Text>,
    <ButtonGroup key="actions">
      {event.status === 'SCHEDULED' && (
        <Button size="slim" tone="success" onClick={() => changeStatus(event.id, 'LIVE')}>Go Live</Button>
      )}
      {event.status === 'LIVE' && (
        <>
          <Button size="slim" onClick={() => { setCheckInEvent(event); }}>Check-in</Button>
          <Button size="slim" onClick={() => changeStatus(event.id, 'ENDED')}>End</Button>
        </>
      )}
      {event.status !== 'CANCELLED' && event.status !== 'ENDED' && (
        <Button size="slim" tone="critical" onClick={() => changeStatus(event.id, 'CANCELLED')}>Cancel</Button>
      )}
    </ButtonGroup>,
  ]);

  return (
    <Page title="Private Club Events" subtitle="Create VIP events, run check-ins and reward members with club credits.">
      <Layout>
        {error && <Layout.Section><Banner tone="critical" onDismiss={() => setError(null)}>{error}</Banner></Layout.Section>}
        {success && <Layout.Section><Banner tone="success" onDismiss={() => setSuccess(null)}>{success}</Banner></Layout.Section>}

        <Layout.Section>
          <Card>
            <Box padding="400">
              <InlineStack align="space-between">
                <Text as="h3" variant="headingMd">Events</Text>
                <Button onClick={() => { setCreateOpen(!createOpen); setCheckInEvent(null); }}>{createOpen ? 'Cancel' : 'Create Event'}</Button>
              </InlineStack>
            </Box>

            {createOpen && (
              <Box padding="400" paddingBlockEnd="400">
                <Card padding="400">
                  <Text as="h4" variant="headingSm" paddingBlockEnd="200">New Club Event</Text>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <TextField label="Event name" value={name} onChange={setName} autoComplete="off" />
                    <TextField label="Location" value={location} onChange={setLocation} autoComplete="off" />
                    <TextField label="Description" value={description} onChange={setDescription} multiline={3} autoComplete="off" />
                    <div />
                    <TextField label="Starts at" type="datetime-local" value={startsAt} onChange={setStartsAt} autoComplete="off" />
                    <TextField label="Ends at" type="datetime-local" value={endsAt} onChange={setEndsAt} autoComplete="off" />
                    <TextField label="Credits awarded on check-in" type="number" value={creditsAward} onChange={setCreditsAward} autoComplete="off" />
                    <div className="flex items-end">
                      <Button onClick={createEvent} loading={loading} disabled={!name || !startsAt || !endsAt}>Create Event</Button>
                    </div>
                  </div>
                </Card>
              </Box>
            )}

            {checkInEvent && (
              <Box padding="400" paddingBlockEnd="400">
                <Card padding="400">
                  <InlineStack align="space-between">
                    <Text as="h4" variant="headingSm">Manual check-in — {checkInEvent.name}</Text>
                    <Button size="slim" onClick={() => { setCheckInEvent(null); setCustomerId(''); }}>Cancel</Button>
                  </InlineStack>
                  <div className="flex items-end gap-4 mt-4">
                    <div style={{ flex: 1 }}>
                      <TextField label="Customer Shopify ID" value={customerId} onChange={setCustomerId} placeholder="gid://shopify/Customer/..." autoComplete="off" />
                    </div>
                    <Button onClick={manualCheckIn} loading={loading} disabled={!customerId}>Check In</Button>
                  </div>
                </Card>
              </Box>
            )}

            {loading ? (
              <Box padding="400"><div className="flex items-center justify-center py-12"><Spinner size="large" /></div></Box>
            ) : events.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3">
                <CalendarDays className="w-10 h-10 text-zinc-600" />
                <Text as="p" variant="bodyMd" alignment="center" tone="subdued">No club events yet</Text>
                <Text as="p" variant="bodySm" alignment="center" tone="subdued">Create your first event to start engaging collectors.</Text>
              </div>
            ) : (
              <DataTable
                columnContentTypes={['text', 'text', 'text', 'numeric', 'numeric', 'text']}
                headings={['Event', 'When', 'Status', 'Credits', 'Checked In', 'Actions']}
                rows={rows}
              />
            )}
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
