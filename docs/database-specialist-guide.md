# Database Specialist - Neon + Drizzle Expert System

Complete database management system for Brazilian fintech applications with voice-first capabilities. Specialized in Neon PostgreSQL + Drizzle ORM with Brazilian LGPD compliance.

## 🗄️ Overview

The Database Specialist is an expert system designed to automatically diagnose, repair, and optimize all aspects of your Neon + Drizzle database infrastructure. It provides comprehensive health monitoring, performance optimization, and Brazilian regulatory compliance.

### 🎯 Key Features

- **Auto-Diagnosis**: Comprehensive health assessment across performance, security, and compliance
- **Automated Repair**: Fix common database issues automatically with rollback support
- **Performance Optimization**: Advanced query analysis and index optimization for Brazilian fintech workloads
- **LGPD Compliance**: Complete Brazilian data protection validation and reporting
- **Brazilian Market Specialization**: PIX transaction optimization, voice query performance, business hours tuning

## 🚀 Quick Start

### Installation

The database specialist is already integrated into the AegisWallet project. All scripts are available via npm/bun commands:

```bash
# Complete database toolkit (recommended)
bun run db:toolkit

# Individual operations
bun run db:health       # Health check
bun run db:repair       # Auto-repair issues
bun run db:optimize     # Performance optimization
bun run db:compliance   # LGPD compliance validation
```

### Basic Usage

```bash
# Quick health check
bun run db:toolkit quick

# Full analysis with auto-repair
bun run db:toolkit full --auto

# Performance optimization only
bun run db:toolkit optimize --output json

# LGPD compliance validation
bun run db:toolkit compliance
```

## 📊 Commands Reference

### Database Toolkit (`db:toolkit`)

```bash
# Health assessment
bun run db:toolkit health

# Automated repair
bun run db:toolkit repair [--dry-run]

# Performance optimization
bun run db:toolkit optimize [--output json]

# LGPD compliance
bun run db:toolkit compliance

# Complete analysis
bun run db:toolkit full [--auto] [--dry-run]

# Quick check (monitoring)
bun run db:toolkit quick
```

### Individual Scripts

```bash
# Comprehensive health check
bun run db:health

# Auto-repair with issue detection
bun run db:repair

# Advanced performance optimization
bun run db:optimize

# Brazilian LGPD compliance validation
bun run db:compliance
```

## 🏥 Health Assessment

The health check provides comprehensive analysis across multiple dimensions:

### Metrics Analyzed

- **Connection Health**: Latency, pool utilization, SSL security
- **Query Performance**: Slow query detection, execution time analysis
- **Index Efficiency**: Usage rates, missing indexes, unused index cleanup
- **Schema Consistency**: Table count validation, Drizzle sync verification
- **Security Posture**: RLS policies, encryption status, vulnerability scanning
- **Brazilian Compliance**: LGPD score, audit trail coverage, consent management

### Health Scoring

- **Excellent (90-100)**: Database is optimally configured
- **Good (75-89)**: Minor optimization opportunities
- **Fair (60-74)**: Some issues requiring attention
- **Critical (<60)**: Immediate action required

## 🔧 Auto-Repair Capabilities

### Issues Automatically Fixed

1. **Schema Synchronization**: Drizzle migrations and database alignment
2. **Index Optimization**: Remove unused indexes, add missing critical indexes
3. **Performance Tuning**: Query optimization, connection pool adjustment
4. **Security Hardening**: RLS policy generation, SSL configuration
5. **Compliance Fixes**: LGPD table creation, audit trail implementation

### Repair Process

1. **Health Analysis**: Comprehensive issue detection
2. **Prioritization**: Critical issues addressed first
3. **Automated Fixes**: Safe, reversible changes
4. **Validation**: Post-repair health verification
5. **Reporting**: Detailed repair logs and recommendations

## ⚡ Performance Optimization

### Brazilian Fintech Specialization

#### PIX Transaction Optimization
- **Target**: <150ms P95 response time
- **Focus**: High-frequency payment processing
- **Optimization**: Index strategies, query patterns, connection pooling

#### Voice Query Performance
- **Target**: <100ms response time
- **Focus**: Real-time speech-to-text processing
- **Optimization**: Specialized indexes for voice data, caching strategies

#### Business Hours Performance
- **Focus**: Peak time optimization (9 AM - 6 PM BRT)
- **Features**: Load balancing, read replica recommendations
- **Monitoring**: Performance tracking during Brazilian business hours

### Performance Analysis Features

- **Query Analysis**: pg_stat_statements integration, slow query detection
- **Index Management**: Usage analysis, bloat detection, optimization recommendations
- **Connection Optimization**: Pool sizing, latency reduction, timeout tuning
- **Caching Strategy**: Buffer hit ratio analysis, cache optimization

## 🇧🇷 LGPD Compliance

### Brazilian Data Protection Requirements

#### Core LGPD Principles
1. **Data Minimization**: Collect only necessary personal data
2. **Consent Management**: Explicit consent tracking and withdrawal
3. **Data Subject Rights**: Access, correction, deletion, portability
4. **Audit Trails**: Comprehensive data access logging
5. **Security Measures**: Encryption, access controls, breach management

#### Compliance Validation

```bash
# Complete LGPD assessment
bun run db:toolkit compliance

# Detailed compliance report
bun run db:compliance --output json
```

### LGPD Requirements Covered

- **Consent Tracking**: lgpd_consents table with granular consent types
- **Data Export**: lgpd_export_requests for subject access rights
- **Data Deletion**: data_deletion_requests for right to erasure
- **Audit Logging**: Comprehensive audit_logs with change tracking
- **Voice Data Protection**: Special handling for biometric voice data
- **Retention Policies**: Automated data lifecycle management

## 📈 Monitoring & Maintenance

### Recommended Schedule

#### Daily
```bash
bun run db:toolkit quick    # Quick health check
```

#### Weekly
```bash
bun run db:toolkit health    # Comprehensive health assessment
bun run db:toolkit optimize  # Performance optimization
```

#### Monthly
```bash
bun run db:toolkit compliance  # LGPD compliance validation
bun run db:toolkit full        # Complete analysis
```

#### Quarterly
```bash
bun run db:toolkit full --auto  # Full analysis with auto-repair
```

### Alert Thresholds

- **Critical**: Health score < 60, LGPD compliance < 70%
- **High**: Performance score < 70, connection latency > 500ms
- **Medium**: Index usage < 80%, slow queries > 10
- **Low**: Minor optimization opportunities

## 🔧 Advanced Usage

### Custom Configuration

Environment variables for database specialist:

```bash
# Database connection
DATABASE_URL=postgresql://...?sslmode=require

# Performance thresholds
DATABASE_SLOW_QUERY_THRESHOLD=100    # ms
DATABASE_CONNECTION_TIMEOUT=5000      # ms

# LGPD settings
LGPD_RETENTION_DAYS=2555             # 7 years default
LGPD_AUDIT_RETENTION_DAYS=3650       # 10 years
```

### Integration with CI/CD

```yaml
# Example GitHub Actions workflow
- name: Database Health Check
  run: bun run db:toolkit health --output json > health-report.json
  
- name: LGPD Compliance Check
  run: bun run db:toolkit compliance
  
- name: Performance Optimization
  run: bun run db:toolkit optimize --dry-run
```

### API Integration

```typescript
import { DatabaseSpecialistToolkit } from './scripts/database-specialist-toolkit';

const toolkit = new DatabaseSpecialistToolkit();

// Health check
const health = await toolkit.run({ command: 'health' });

// Performance analysis
const performance = await toolkit.run({ 
  command: 'optimize',
  output: 'json'
});
```

## 🚨 Troubleshooting

### Common Issues

#### Connection Failures
```bash
# Check database connectivity
bun run smoke:db

# Verify connection string
echo $DATABASE_URL

# Test with different connection
psql "$DATABASE_URL" -c "SELECT 1;"
```

#### Performance Issues
```bash
# Run performance analysis
bun run db:toolkit optimize

# Check slow queries
SELECT query, mean_exec_time, calls 
FROM pg_stat_statements 
ORDER BY mean_exec_time DESC LIMIT 10;
```

#### LGPD Compliance
```bash
# Validate compliance
bun run db:toolkit compliance

# Check audit logs
SELECT COUNT(*) FROM audit_logs 
WHERE created_at > NOW() - INTERVAL '24 hours';
```

### Getting Help

1. **Run Health Check**: Start with comprehensive health assessment
2. **Check Logs**: Review repair logs and error messages
3. **Dry Run Mode**: Use `--dry-run` to preview changes
4. **Manual Review**: Examine generated SQL before execution

## 📚 Best Practices

### Database Design

- **Schema First**: Always use Drizzle schema for type safety
- **Index Strategy**: Add indexes based on query patterns
- **Connection Pooling**: Use appropriate pool sizes for workload
- **Security First**: Implement RLS policies for all user data

### Performance Optimization

- **Query Analysis**: Regular review of slow queries
- **Index Maintenance**: Remove unused indexes, add missing ones
- **Connection Management**: Monitor pool utilization and latency
- **Caching Strategy**: Optimize buffer hit ratio

### LGPD Compliance

- **Data Minimization**: Collect only necessary personal data
- **Consent Tracking**: Implement granular consent management
- **Audit Logging**: Comprehensive data access tracking
- **Retention Management**: Automated data lifecycle policies

## 🔗 Related Documentation

- [Database Schema Documentation](./architecture/database-schema.md)
- [Neon CLI Documentation](https://neon.com/docs/reference/neon-cli)
- [Drizzle ORM Documentation](https://orm.drizzle.team/)
- [Brazilian LGPD Guidelines](https://www.gov.br/mdh/pt-br/assuntos/legislacao)

---

**Note**: This database specialist is specifically designed for Brazilian fintech applications with voice-first capabilities. Always validate changes in a staging environment before applying to production.
