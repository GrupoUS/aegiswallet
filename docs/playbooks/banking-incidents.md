# Banking Incidents Playbook

**Version:** 1.0.0  
**Last Updated:** 2025-01-04  
**Owner:** Operations Team

---

## 🚨 Incident Response Overview

**SLA Targets:**
- **Detection Time:** <5 minutes
- **Acknowledgment Time:** <2 minutes
- **Resolution Time (Critical):** <15 minutes
- **Resolution Time (High):** <30 minutes
- **Availability Target:** ≥99.9% per institution

---

## 📋 Common Incidents & Quick Resolution

### 1. Authentication Error (401) - Token Expired

**Quick Fix:**
```sql
-- Check and refresh tokens
SELECT institution_code, expires_at 
FROM bank_tokens bt
JOIN bank_connections bc ON bc.id = bt.connection_id
WHERE expires_at < NOW() + INTERVAL '1 hour';

-- Trigger refresh via API or notify user for re-auth
```

### 2. Timeout Errors - High Latency

**Quick Fix:**
```sql
-- Check circuit breaker status
SELECT * FROM circuit_breaker_status WHERE state = 'open';

-- Wait for automatic recovery (60s) or investigate bank status
```

### 3. Rate Limiting (429)

**Quick Fix:**
```sql
-- Reduce sync frequency temporarily
UPDATE bank_connections
SET sync_frequency_hours = 48
WHERE institution_code = 'affected_bank';
```

### 4. Scheduled Maintenance

**Quick Fix:**
```sql
-- Pause sync during maintenance
UPDATE bank_connections
SET status = 'maintenance',
    next_sync_at = 'maintenance_end_time'
WHERE institution_code = 'affected_bank';
```

### 5. Circuit Breaker Activated

**Quick Fix:**
```sql
-- Check recent failures
SELECT error_code, COUNT(*) 
FROM sync_jobs sj
JOIN bank_connections bc ON bc.id = sj.connection_id
WHERE bc.institution_code = 'affected_bank'
  AND status = 'failed'
  AND created_at >= NOW() - INTERVAL '15 minutes'
GROUP BY error_code;

-- Wait for automatic recovery or fix root cause first
```

---

## 📊 Key Monitoring Queries

```sql
-- Overall health
SELECT * FROM sync_success_rate_24h;

-- Current incidents
SELECT * FROM current_incidents;

-- SLA compliance
SELECT * FROM sla_compliance_summary;

-- Circuit breaker status
SELECT * FROM circuit_breaker_status;
```

---

## 📞 Escalation: Slack #ops-oncall → Engineering Lead → CTO

**Remember:** Escalate early for critical incidents!
