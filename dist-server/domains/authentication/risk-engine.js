export class RiskEngine {
    /**
     * Analyze scan history and telemetry to detect physical cloning or behavioral anomalies
     */
    static evaluate(recentScans, currentScan, isReportedStolen = false) {
        const anomalies = [];
        // 1. Check blacklist / stolen status
        if (isReportedStolen) {
            anomalies.push({
                type: 'BLACKLIST_HIT',
                severity: 'CRITICAL',
                reason: 'Physical piece has an active lost or stolen report.',
            });
        }
        if (recentScans.length > 0) {
            const lastScan = recentScans[0];
            const timeDiffMinutes = (currentScan.timestamp.getTime() - lastScan.created_at.getTime()) / (1000 * 60);
            // 2. Impossible travel detection (e.g. Scanned in London then scanned in Tokyo 10 mins later)
            if (currentScan.country &&
                lastScan.country &&
                currentScan.country !== lastScan.country &&
                timeDiffMinutes < 60) {
                anomalies.push({
                    type: 'IMPOSSIBLE_TRAVEL',
                    severity: 'HIGH',
                    reason: `Physical scan detected in ${currentScan.country} only ${Math.round(timeDiffMinutes)}m after scan in ${lastScan.country}.`,
                });
            }
            // 3. Rapid velocity anomaly (more than 10 scans in 2 minutes)
            const scansInLastTwoMinutes = recentScans.filter((s) => (currentScan.timestamp.getTime() - s.created_at.getTime()) / 1000 < 120);
            if (scansInLastTwoMinutes.length >= 8) {
                anomalies.push({
                    type: 'RAPID_VELOCITY',
                    severity: 'MEDIUM',
                    reason: 'Abnormally high scan velocity detected across different network clients.',
                });
            }
            // 4. NFC cryptographic read counter mismatch (Counter must monotonically increase)
            if (currentScan.nfc_read_counter != null &&
                lastScan.nfc_read_counter != null &&
                currentScan.nfc_read_counter <= lastScan.nfc_read_counter) {
                anomalies.push({
                    type: 'COUNTER_MISMATCH',
                    severity: 'CRITICAL',
                    reason: `NFC read counter (${currentScan.nfc_read_counter}) is less than or equal to previous verified counter (${lastScan.nfc_read_counter}). Potential NFC clone attempt.`,
                });
            }
        }
        // Determine overall risk level
        let risk_level = 'NORMAL';
        const hasCritical = anomalies.some((a) => a.severity === 'CRITICAL');
        const hasHigh = anomalies.some((a) => a.severity === 'HIGH');
        const hasMedium = anomalies.some((a) => a.severity === 'MEDIUM');
        if (hasCritical) {
            risk_level = 'HIGH_RISK';
        }
        else if (hasHigh) {
            risk_level = 'REVIEW';
        }
        else if (hasMedium) {
            risk_level = 'LOW_RISK';
        }
        return { risk_level, anomalies };
    }
}
