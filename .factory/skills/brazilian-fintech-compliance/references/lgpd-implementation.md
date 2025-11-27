# LGPD Implementation Guide for Financial Applications

## LGPD Core Implementation

### Data Subject Rights Implementation

#### 1. Right to Access (Artigo 18)
```typescript
interface DataAccessRequest {
  userId: string;
  requestType: 'full_access' | 'specific_data';
  requestedFields?: string[];
  format: 'JSON' | 'CSV' | 'PDF';
  requestId: string;
  requestDate: Date;
}

const dataAccessService = {
  async provideUserDataAccess(request: DataAccessRequest): Promise<UserDataExport> {
    // Verify user identity
    await verifyUserIdentity(request.userId);
    
    // Collect all personal data
    const userData = await Promise.all([
      getUserProfile(request.userId),
      getFinancialTransactions(request.userId),
      getPaymentMethods(request.userId),
      getConsentHistory(request.userId),
      getAccessLogs(request.userId)
    ]);
    
    // Apply masking for sensitive data if needed
    const maskedData = applyDataMasking(userData, request.requestType);
    
    // Generate export in requested format
    return await generateDataExport(maskedData, request.format);
  }
};
```

#### 2. Right to Rectification (Artigo 18, II)
```typescript
const dataRectificationService = {
  async rectifyUserData(userId: string, corrections: DataCorrections): Promise<void> {
    // Log correction request
    await logDataCorrection({
      userId,
      corrections,
      timestamp: new Date(),
      ipAddress: getClientIP(),
      justification: corrections.justification
    });
    
    // Apply corrections with audit trail
    for (const correction of corrections.items) {
      const oldValue = await getCurrentValue(userId, correction.field);
      
      await updateUserData(userId, correction.field, correction.newValue);
      
      await auditLog({
        userId,
        action: 'DATA_CORRECTION',
        field: correction.field,
        oldValue,
        newValue: correction.newValue,
        timestamp: new Date()
      });
    }
    
    // Notify user about successful correction
    await notifyUserCorrection(userId, corrections.items);
  }
};
```

#### 3. Right to Erasure (Artigo 18, III)
```typescript
const dataErasureService = {
  async processDataDeletionRequest(userId: string, justification: string): Promise<void> {
    // Check for legal holds and regulatory requirements
    const legalHolds = await checkLegalHolds(userId);
    if (legalHolds.length > 0) {
      throw new Error(`Cannot delete data due to legal holds: ${legalHolds.join(', ')}`);
    }
    
    // Check for active contracts or ongoing transactions
    const activeObligations = await checkActiveObligations(userId);
    if (activeObligations.length > 0) {
      throw new Error('Cannot delete data while active obligations exist');
    }
    
    // Anonymize instead of delete for audit purposes
    const anonymizationPlan = createAnonymizationPlan(userId);
    
    for (const item of anonymizationPlan) {
      switch (item.type) {
        case 'user_profile':
          await anonymizeUserProfile(userId);
          break;
        case 'financial_data':
          await anonymizeFinancialData(userId);
          break;
        case 'payment_methods':
          await anonymizePaymentMethods(userId);
          break;
      }
    }
    
    // Record deletion completion
    await recordDeletionCompletion({
      userId,
      justification,
      timestamp: new Date(),
      method: 'anonymization'
    });
  }
};
```

#### 4. Right to Data Portability (Artigo 18, V)
```typescript
const dataPortabilityService = {
  async exportPortableData(userId: string, formats: string[]): Promise<PortableData> {
    const portableData = {
      identification: await getUserIdentificationData(userId),
      financial: await getFinancialData(userId),
      transactions: await getTransactionHistory(userId),
      consents: await getConsentHistory(userId),
      preferences: await getUserPreferences(userId)
    };
    
    const exports = {};
    
    for (const format of formats) {
      switch (format) {
        case 'JSON':
          exports.json = JSON.stringify(portableData, null, 2);
          break;
        case 'CSV':
          exports.csv = convertToCSV(portableData);
          break;
        case 'XML':
          exports.xml = convertToXML(portableData);
          break;
        case 'PDF':
          exports.pdf = await generatePDFReport(portableData);
          break;
      }
    }
    
    return exports;
  },
  
  async validatePortableDataIntegrity(data: PortableData): Promise<boolean> {
    // Check data completeness
    const requiredFields = ['identification', 'financial', 'transactions'];
    const missingFields = requiredFields.filter(field => !data[field]);
    
    if (missingFields.length > 0) {
      throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
    }
    
    // Validate data formats
    return validateDataFormats(data);
  }
};
```

### Consent Management System

#### Consent Implementation
```typescript
interface ConsentRecord {
  id: string;
  userId: string;
  consentType: ConsentType;
  purpose: string;
  legalBasis: 'consent' | 'contract' | 'legal_obligation' | 'legitimate_interest';
  granted: boolean;
  timestamp: Date;
  ipAddress: string;
  userAgent: string;
  version: string;
  withdrawalDate?: Date;
}

const consentManagement = {
  async recordConsent(consentData: ConsentData): Promise<ConsentRecord> {
    const consentRecord: ConsentRecord = {
      id: generateUUID(),
      userId: consentData.userId,
      consentType: consentData.type,
      purpose: consentData.purpose,
      legalBasis: 'consent',
      granted: true,
      timestamp: new Date(),
      ipAddress: getClientIP(),
      userAgent: getUserAgent(),
      version: '1.0'
    };
    
    // Store consent record
    await database.consents.insert(consentRecord);
    
    // Create audit log entry
    await auditLog.create({
      userId: consentData.userId,
      action: 'CONSENT_GRANTED',
      details: {
        purpose: consentData.purpose,
        consentType: consentData.type,
        timestamp: consentRecord.timestamp
      }
    });
    
    return consentRecord;
  },
  
  async withdrawConsent(consentId: string, reason?: string): Promise<void> {
    const consent = await database.consents.findById(consentId);
    
    if (!consent) {
      throw new Error('Consent record not found');
    }
    
    // Update consent record
    await database.consents.update(consentId, {
      granted: false,
      withdrawalDate: new Date(),
      withdrawalReason: reason
    });
    
    // Trigger data processing impact assessment
    await assessDataProcessingImpact(consent.userId, consent.purpose);
    
    // Create audit log entry
    await auditLog.create({
      userId: consent.userId,
      action: 'CONSENT_WITHDRAWN',
      details: {
        purpose: consent.purpose,
        consentType: consent.consentType,
        reason,
        timestamp: new Date()
      }
    });
  }
};
```

### Data Protection Impact Assessment (DPIA)

#### DPIA Implementation
```typescript
interface DPIAAssessment {
  id: string;
  processingActivity: string;
  riskLevel: 'low' | 'medium' | 'high';
  measures: ProtectionMeasure[];
  assessmentDate: Date;
  reviewerId: string;
  approvalStatus: 'pending' | 'approved' | 'rejected';
}

const dpiaService = {
  async conductDPIA(activity: ProcessingActivity): Promise<DPIAAssessment> {
    // Assess necessity and proportionality
    const necessityScore = await assessNecessity(activity);
    const proportionalityScore = await assessProportionality(activity);
    
    // Identify risks
    const risks = await identifyRisks(activity);
    
    // Determine overall risk level
    const riskLevel = calculateRiskLevel({
      necessity: necessityScore,
      proportionality: proportionalityScore,
      risks
    });
    
    // Recommend protection measures
    const measures = await recommendProtectionMeasures(activity, risks);
    
    const assessment: DPIAAssessment = {
      id: generateUUID(),
      processingActivity: activity.description,
      riskLevel,
      measures,
      assessmentDate: new Date(),
      reviewerId: activity.requesterId,
      approvalStatus: 'pending'
    };
    
    // Store assessment
    await database DPIAs.insert(assessment);
    
    return assessment;
  },
  
  async reviewDPIA(dpiaId: string, reviewerId: string, decision: 'approve' | 'reject', comments?: string): Promise<void> {
    await database DPIAs.update(dpiaId, {
      approvalStatus: decision === 'approve' ? 'approved' : 'rejected',
      reviewerId,
      reviewDate: new Date(),
      comments
    });
    
    if (decision === 'reject') {
      // Notify about required changes
      await notifyDPIARejection(dpiaId, comments);
    }
  }
};
```

### Data Breach Notification

#### Breach Response Implementation
```typescript
interface DataBreach {
  id: string;
  detectedDate: Date;
  affectedUsers: string[];
  dataTypes: string[];
  impactAssessment: 'low' | 'medium' | 'high';
  containmentActions: string[];
  notificationSent: boolean;
  anpdNotified: boolean;
}

const breachResponse = {
  async handleBreachDetection(breachData: BreachData): Promise<void> {
    const breach: DataBreach = {
      id: generateUUID(),
      detectedDate: new Date(),
      affectedUsers: await identifyAffectedUsers(breachData),
      dataTypes: await identifyAffectedDataTypes(breachData),
      impactAssessment: 'pending',
      containmentActions: [],
      notificationSent: false,
      anpdNotified: false
    };
    
    // Store breach record
    await database.breaches.insert(breach);
    
    // Implement immediate containment
    await implementContainmentMeasures(breachData);
    
    // Conduct impact assessment
    breach.impactAssessment = await assessBreachImpact(breach);
    
    // Update breach record
    await database.breaches.update(breach.id, breach);
    
    // Determine notification requirements
    const notificationRequired = breach.impactAssessment !== 'low';
    
    if (notificationRequired) {
      await planUserNotifications(breach);
      await planANPDNotification(breach);
    }
  },
  
  async notifyANPD(breachId: string): Promise<void> {
    const breach = await database.breaches.findById(breachId);
    
    if (!breach || breach.anpdNotified) {
      return;
    }
    
    const notification = {
      breachId: breach.id,
      detectedDate: breach.detectedDate,
      affectedUsersCount: breach.affectedUsers.length,
      dataTypes: breach.dataTypes,
      impactAssessment: breach.impactAssessment,
      containmentActions: breach.containmentActions,
      communicationPlan: await getCommunicationPlan(breach),
      mitigationMeasures: await getMitigationMeasures(breach)
    };
    
    // Send notification to ANPD (within 72 hours)
    await sendANPDNotification(notification);
    
    // Update breach record
    await database.breaches.update(breachId, {
      anpdNotified: true,
      anpdNotificationDate: new Date()
    });
  }
};
```

### Data Protection Officer (DPO) Functions

#### DPO Portal Implementation
```typescript
const dpoPortal = {
  // Manage data subject requests
  async handleSubjectRequest(request: SubjectRequest): Promise<void> {
    const workflow = createRequestWorkflow(request);
    
    // Assign to appropriate team
    await assignRequest(workflow.id, determineAssignee(request));
    
    // Set SLA deadlines
    await setDeadlines(workflow.id, calculateDeadlines(request.type));
    
    // Track progress
    await trackWorkflowProgress(workflow.id);
  },
  
  // Generate compliance reports
  async generateComplianceReport(period: DateRange): Promise<ComplianceReport> {
    const metrics = await Promise.all([
      getSubjectRequestMetrics(period),
      getBreachReportMetrics(period),
      getConsentManagementMetrics(period),
      getDataProcessingInventoryMetrics(period)
    ]);
    
    return {
      period,
      subjectRequests: metrics[0],
      breaches: metrics[1],
      consents: metrics[2],
      dataInventory: metrics[3],
      generatedAt: new Date()
    };
  },
  
  // Conduct privacy audits
  async conductPrivacyAudit(scope: AuditScope): Promise<AuditReport> {
    const auditPlan = createAuditPlan(scope);
    
    const findings = await Promise.all([
      auditConsentRecords(auditPlan),
      auditDataProcessing(auditPlan),
      auditSecurityMeasures(auditPlan),
      auditSubjectRights(auditPlan)
    ]);
    
    return {
      auditId: generateUUID(),
      scope,
      findings: findings.flat(),
      recommendations: generateRecommendations(findings),
      auditDate: new Date()
    };
  }
};
```

## Testing LGPD Implementation

### Unit Tests for LGPD Compliance
```typescript
describe('LGPD Compliance Tests', () => {
  describe('Consent Management', () => {
    test('consent is properly recorded with all required fields', async () => {
      const consentData = {
        userId: 'user-123',
        type: 'data_processing',
        purpose: 'payment_processing',
        granted: true
      };
      
      const result = await consentManagement.recordConsent(consentData);
      
      expect(result).toMatchObject({
        id: expect.any(String),
        userId: consentData.userId,
        consentType: consentData.type,
        purpose: consentData.purpose,
        granted: true,
        timestamp: expect.any(Date),
        legalBasis: 'consent'
      });
    });
    
    test('consent withdrawal is properly logged and handled', async () => {
      const consentId = 'consent-123';
      const reason = 'User no longer wants data processed';
      
      await consentManagement.withdrawConsent(consentId, reason);
      
      const consent = await database.consents.findById(consentId);
      expect(consent.granted).toBe(false);
      expect(consent.withdrawalDate).toBeInstanceOf(Date);
      expect(consent.withdrawalReason).toBe(reason);
    });
  });
  
  describe('Data Access Rights', () => {
    test('user can access their personal data in requested format', async () => {
      const request = {
        userId: 'user-123',
        requestType: 'full_access',
        format: 'JSON'
      };
      
      const result = await dataAccessService.provideUserDataAccess(request);
      
      expect(result).toHaveProperty('format', 'JSON');
      expect(result).toHaveProperty('data');
      expect(result.data).toHaveProperty('identification');
      expect(result.data).toHaveProperty('financial');
    });
    
    test('sensitive data is masked in appropriate contexts', async () => {
      const sensitiveData = {
        cpf: '123.456.789-09',
        phone: '(11) 98765-4321',
        email: 'user@domain.com'
      };
      
      const maskedData = applyDataMasking(sensitiveData, 'partial_access');
      
      expect(maskedData.cpf).toBe('123.***.***-09');
      expect(maskedData.phone).toBe('(11) ****-4321');
      expect(maskedData.email).toBe('us***@domain.com');
    });
  });
  
  describe('Data Erasure', () => {
    test('data is properly anonymized when deletion is requested', async () => {
      const userId = 'user-123';
      
      await dataErasureService.processDataDeletionRequest(userId, 'User requested deletion');
      
      const userProfile = await getUserProfile(userId);
      expect(userProfile.name).toBe('Usuário Removido');
      expect(userProfile.cpf).toBe('***.***.***-**');
      expect(userProfile.email).toBe('deleted@anonymized.com');
    });
    
    test('deletion is blocked when legal holds exist', async () => {
      const userId = 'user-456';
      
      // Add legal hold
      await database.legalHolds.insert({
        userId,
        reason: 'ongoing_investigation',
        expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      });
      
      await expect(
        dataErasureService.processDataDeletionRequest(userId, 'User requested deletion')
      ).rejects.toThrow('Cannot delete data due to legal holds');
    });
  });
});
```
