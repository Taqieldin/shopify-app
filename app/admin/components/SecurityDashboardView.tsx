import React, { useState, useEffect } from 'react';
import { authFetch } from '../../utils/api';
import {
  Card,
  Page,
  Layout,
  DataTable,
  Badge,
  Button,
  Modal,
  TextField,
  Banner,
  Spinner,
  EmptyState,
  Tabs,
  ResourceList,
  ResourceItem,
  Text,
  BlockStack,
  InlineStack,
} from '@shopify/polaris';
import { AlertTriangleIcon, ShieldPendingIcon, CheckCircleIcon } from '@shopify/polaris-icons';

interface SecurityAlert {
  level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  type: string;
  message: string;
  serial: string;
  details: Record<string, unknown>;
  timestamp: string;
}

interface ScanPattern {
  serial: string;
  nfc_uid: string;
  scan_count: number;
  unique_locations: number;
  unique_ips: number;
  first_scan: string;
  last_scan: string;
  suspicious_indicators: string[];
}

interface BlockedNFC {
  id: string;
  nfc_uid: string;
  reason: string;
  blocked_by: string;
  blocked_at: string;
  is_active: boolean;
}

export function SecurityDashboardView() {
  const [selectedTab, setSelectedTab] = useState(0);
  const [alerts, setAlerts] = useState<SecurityAlert[]>([]);
  const [blockedNFCs, setBlockedNFCs] = useState<BlockedNFC[]>([]);
  const [loading, setLoading] = useState(true);
  const [blockModalActive, setBlockModalActive] = useState(false);
  const [blockNfcUid, setBlockNfcUid] = useState('');
  const [blockReason, setBlockReason] = useState('');
  const [selectedAlert, setSelectedAlert] = useState<SecurityAlert | null>(null);
  const [acknowledgeModalActive, setAcknowledgeModalActive] = useState(false);
  const [acknowledgeNotes, setAcknowledgeNotes] = useState('');

  useEffect(() => {
    loadSecurityData();
  }, [selectedTab]);

  async function loadSecurityData() {
    setLoading(true);
    try {
      if (selectedTab === 0) {
        // Load alerts
        const response = await authFetch('/api/admin/security/alerts?limit=100');
        const data = await response.json();
        setAlerts(data.data || []);
      } else if (selectedTab === 1) {
        // Load blocked NFCs
        const response = await authFetch('/api/admin/security/blocked-nfc');
        const data = await response.json();
        setBlockedNFCs(data.data || []);
      }
    } catch (error) {
      console.error('Failed to load security data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleBlockNFC() {
    try {
      const response = await authFetch('/api/admin/security/block-nfc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nfc_uid: blockNfcUid,
          reason: blockReason,
        }),
      });

      if (response.ok) {
        setBlockModalActive(false);
        setBlockNfcUid('');
        setBlockReason('');
        loadSecurityData();
      }
    } catch (error) {
      console.error('Failed to block NFC:', error);
    }
  }

  async function handleUnblockNFC(nfcUid: string) {
    try {
      const response = await authFetch(`/api/admin/security/blocked-nfc/${encodeURIComponent(nfcUid)}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        loadSecurityData();
      }
    } catch (error) {
      console.error('Failed to unblock NFC:', error);
    }
  }

  async function handleAcknowledgeAlert() {
    if (!selectedAlert) return;

    try {
      // In production, you'd need the event ID from the alert
      // For now, we'll just close the modal
      setAcknowledgeModalActive(false);
      setSelectedAlert(null);
      setAcknowledgeNotes('');
      loadSecurityData();
    } catch (error) {
      console.error('Failed to acknowledge alert:', error);
    }
  }

  function getBadgeStatus(level: string): 'success' | 'info' | 'warning' | 'critical' {
    switch (level) {
      case 'LOW':
        return 'info';
      case 'MEDIUM':
        return 'warning';
      case 'HIGH':
        return 'warning';
      case 'CRITICAL':
        return 'critical';
      default:
        return 'info';
    }
  }

  function getAlertIcon(level: string) {
    switch (level) {
      case 'CRITICAL':
      case 'HIGH':
        return <AlertTriangleIcon />;
      case 'MEDIUM':
        return <ShieldPendingIcon />;
      default:
        return <CheckCircleIcon />;
    }
  }

  const tabs = [
    {
      id: 'alerts',
      content: 'Security Alerts',
      accessibilityLabel: 'Security Alerts',
      panelID: 'alerts-panel',
    },
    {
      id: 'blocked-nfc',
      content: 'Blocked NFC UIDs',
      accessibilityLabel: 'Blocked NFC UIDs',
      panelID: 'blocked-nfc-panel',
    },
  ];

  const criticalAlerts = alerts.filter((a) => a.level === 'CRITICAL');
  const highAlerts = alerts.filter((a) => a.level === 'HIGH');

  return (
    <Page
      title="Security Dashboard"
      primaryAction={{
        content: 'Block NFC UID',
        onAction: () => setBlockModalActive(true),
      }}
    >
      <Layout>
        {/* Summary Banners */}
        {criticalAlerts.length > 0 && (
          <Layout.Section>
            <Banner
              title={`${criticalAlerts.length} Critical Security Alert${criticalAlerts.length === 1 ? '' : 's'}`}
              tone="critical"
            >
              <p>Immediate attention required. Review these alerts now.</p>
            </Banner>
          </Layout.Section>
        )}

        {highAlerts.length > 0 && criticalAlerts.length === 0 && (
          <Layout.Section>
            <Banner
              title={`${highAlerts.length} High Priority Alert${highAlerts.length === 1 ? '' : 's'}`}
              tone="warning"
            >
              <p>Review these alerts as soon as possible.</p>
            </Banner>
          </Layout.Section>
        )}

        {/* Overview Cards */}
        <Layout.Section>
          <InlineStack gap="400">
            <Card>
              <BlockStack gap="200">
                <Text as="h2" variant="headingMd">
                  Total Alerts
                </Text>
                <Text as="p" variant="heading2xl">
                  {alerts.length}
                </Text>
              </BlockStack>
            </Card>

            <Card>
              <BlockStack gap="200">
                <Text as="h2" variant="headingMd">
                  Critical Alerts
                </Text>
                <Text as="p" variant="heading2xl" tone="critical">
                  {criticalAlerts.length}
                </Text>
              </BlockStack>
            </Card>

            <Card>
              <BlockStack gap="200">
                <Text as="h2" variant="headingMd">
                  Blocked NFC UIDs
                </Text>
                <Text as="p" variant="heading2xl">
                  {blockedNFCs.length}
                </Text>
              </BlockStack>
            </Card>
          </InlineStack>
        </Layout.Section>

        {/* Tabs */}
        <Layout.Section>
          <Card>
            <Tabs tabs={tabs} selected={selectedTab} onSelect={setSelectedTab}>
              {/* Alerts Tab */}
              {selectedTab === 0 && (
                <div style={{ padding: '16px' }}>
                  {loading ? (
                    <div style={{ textAlign: 'center', padding: '40px' }}>
                      <Spinner size="large" />
                    </div>
                  ) : alerts.length === 0 ? (
                    <EmptyState
                      heading="No security alerts"
                      image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
                    >
                      <p>All clear! No suspicious activities detected.</p>
                    </EmptyState>
                  ) : (
                    <ResourceList
                      resourceName={{ singular: 'alert', plural: 'alerts' }}
                      items={alerts}
                      renderItem={(alert) => {
                        const { level, type, message, serial, timestamp } = alert;
                        return (
                          <ResourceItem
                            id={`${serial}-${timestamp}`}
                            onClick={() => {
                              setSelectedAlert(alert);
                              setAcknowledgeModalActive(true);
                            }}
                          >
                            <BlockStack gap="200">
                              <InlineStack align="space-between" blockAlign="center">
                                <InlineStack gap="200" blockAlign="center">
                                  {getAlertIcon(level)}
                                  <Text as="h3" variant="bodyMd" fontWeight="bold">
                                    {type.replace(/_/g, ' ')}
                                  </Text>
                                  <Badge tone={getBadgeStatus(level)}>{level}</Badge>
                                </InlineStack>
                                <Text as="span" variant="bodySm" tone="subdued">
                                  {new Date(timestamp).toLocaleString()}
                                </Text>
                              </InlineStack>
                              <Text as="p" variant="bodySm">
                                {message}
                              </Text>
                              <Text as="p" variant="bodySm" tone="subdued">
                                Serial: {serial}
                              </Text>
                            </BlockStack>
                          </ResourceItem>
                        );
                      }}
                    />
                  )}
                </div>
              )}

              {/* Blocked NFC Tab */}
              {selectedTab === 1 && (
                <div style={{ padding: '16px' }}>
                  {loading ? (
                    <div style={{ textAlign: 'center', padding: '40px' }}>
                      <Spinner size="large" />
                    </div>
                  ) : blockedNFCs.length === 0 ? (
                    <EmptyState
                      heading="No blocked NFC UIDs"
                      image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
                    >
                      <p>No NFC UIDs have been blocked yet.</p>
                    </EmptyState>
                  ) : (
                    <ResourceList
                      resourceName={{ singular: 'blocked NFC', plural: 'blocked NFCs' }}
                      items={blockedNFCs}
                      renderItem={(blocked) => {
                        const { nfc_uid, reason, blocked_by, blocked_at } = blocked;
                        return (
                          <ResourceItem id={nfc_uid} onClick={() => {}}>
                            <BlockStack gap="200">
                              <InlineStack align="space-between" blockAlign="center">
                                <Text as="h3" variant="bodyMd" fontWeight="bold">
                                  {nfc_uid}
                                </Text>
                                <Button
                                  size="slim"
                                  onClick={() => handleUnblockNFC(nfc_uid)}
                                >
                                  Unblock
                                </Button>
                              </InlineStack>
                              <Text as="p" variant="bodySm">
                                Reason: {reason}
                              </Text>
                              <Text as="p" variant="bodySm" tone="subdued">
                                Blocked by {blocked_by} on {new Date(blocked_at).toLocaleString()}
                              </Text>
                            </BlockStack>
                          </ResourceItem>
                        );
                      }}
                    />
                  )}
                </div>
              )}
            </Tabs>
          </Card>
        </Layout.Section>
      </Layout>

      {/* Block NFC Modal */}
      <Modal
        open={blockModalActive}
        onClose={() => setBlockModalActive(false)}
        title="Block NFC UID"
        primaryAction={{
          content: 'Block',
          onAction: handleBlockNFC,
          disabled: !blockNfcUid || !blockReason,
        }}
        secondaryActions={[
          {
            content: 'Cancel',
            onAction: () => setBlockModalActive(false),
          },
        ]}
      >
        <Modal.Section>
          <BlockStack gap="400">
            <TextField
              label="NFC UID"
              value={blockNfcUid}
              onChange={setBlockNfcUid}
              placeholder="04:A1:B2:C3:D4:E5:F6"
              autoComplete="off"
              helpText="Enter the NFC UID to block from authentication"
            />
            <TextField
              label="Reason"
              value={blockReason}
              onChange={setBlockReason}
              multiline={3}
              placeholder="Why is this NFC UID being blocked?"
              autoComplete="off"
            />
            <Banner tone="warning">
              <p>
                Blocking this NFC UID will:
              </p>
              <ul>
                <li>Prevent authentication with this tag</li>
                <li>Mark all pieces with this UID as UNDER_REVIEW</li>
                <li>Return REVOKED status on future scans</li>
              </ul>
            </Banner>
          </BlockStack>
        </Modal.Section>
      </Modal>

      {/* Acknowledge Alert Modal */}
      <Modal
        open={acknowledgeModalActive}
        onClose={() => setAcknowledgeModalActive(false)}
        title="Acknowledge Security Alert"
        primaryAction={{
          content: 'Acknowledge',
          onAction: handleAcknowledgeAlert,
        }}
        secondaryActions={[
          {
            content: 'Cancel',
            onAction: () => setAcknowledgeModalActive(false),
          },
        ]}
      >
        <Modal.Section>
          {selectedAlert && (
            <BlockStack gap="400">
              <BlockStack gap="200">
                <Text as="h3" variant="headingMd">
                  {selectedAlert.type.replace(/_/g, ' ')}
                </Text>
                <Badge tone={getBadgeStatus(selectedAlert.level)}>
                  {selectedAlert.level}
                </Badge>
                <Text as="p" variant="bodySm">
                  {selectedAlert.message}
                </Text>
                <Text as="p" variant="bodySm" tone="subdued">
                  Serial: {selectedAlert.serial}
                </Text>
              </BlockStack>

              <BlockStack gap="200">
                <Text as="h4" variant="headingSm">
                  Details
                </Text>
                <pre style={{ fontSize: '12px', background: '#f6f6f7', padding: '12px', borderRadius: '4px' }}>
                  {JSON.stringify(selectedAlert.details, null, 2)}
                </pre>
              </BlockStack>

              <TextField
                label="Resolution Notes"
                value={acknowledgeNotes}
                onChange={setAcknowledgeNotes}
                multiline={3}
                placeholder="What action was taken to resolve this alert?"
                autoComplete="off"
              />
            </BlockStack>
          )}
        </Modal.Section>
      </Modal>
    </Page>
  );
}
