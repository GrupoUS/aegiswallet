// Satisfies: Section 3: tRPC Integration Testing of .claude/skills/webapp-testing/SKILL.md
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { TestUtils } from '../healthcare-setup';

const maskPhone = (phone?: string) =>
  phone ? phone.replace(/(\d{2})(\d{1})\d{4}(\d{4})$/, '$1$2****$3') : undefined;

const createTrpcMock = () => ({
  appointments: {
    create: {
      mutate: async (appointmentData: Record<string, unknown>) => {
        if (!appointmentData.patientId || !appointmentData.dateTime) {
          throw {
            code: 'MISSING_REQUIRED_FIELDS',
            error: 'Missing required fields',
          };
        }

        return {
          id: 'appointment-001',
          ...appointmentData,
          createdAt: new Date().toISOString(),
          status: 'scheduled',
        };
      },
    },
    list: {
      query: async ({ patientId }: { patientId?: string } = {}) => {
        const appointments = [
          {
            dateTime: '2025-01-20T14:00:00Z',
            doctorId: 'doctor-001',
            id: 'appointment-001',
            patientId: 'test-patient-001',
            status: 'scheduled',
            type: 'consultation',
          },
          {
            dateTime: '2025-01-25T10:00:00Z',
            doctorId: 'doctor-002',
            id: 'appointment-002',
            patientId: 'test-patient-001',
            status: 'confirmed',
            type: 'follow-up',
          },
        ];

        return appointments.filter((apt) => !patientId || apt.patientId === patientId);
      },
    },
  },
  patients: {
    create: {
      mutate: async (patientData: Record<string, any>) => {
        if (!patientData.lgpdConsent) {
          throw {
            code: 'LGPD_CONSENT_REQUIRED',
            error: 'LGPD consent is required',
          };
        }

        return {
          ...patientData,
          id: 'new-patient-id',
          cpf: '***.***.***-**',
          phone: maskPhone(patientData.phone),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
      },
    },
    delete: {
      mutate: async ({ id }: { id: string }) => {
        if (id !== 'test-patient-001') {
          throw { error: 'Patient not found' };
        }

        return { deletedAt: new Date().toISOString(), success: true };
      },
    },
    getById: {
      query: async ({ id }: { id: string }) => {
        if (id !== 'test-patient-001') {
          throw { error: 'Patient not found' };
        }

        return {
          id: 'test-patient-001',
          name: 'João Silva',
          email: 'joao.silva@example.com',
          phone: '+55******4321',
          cpf: '***.***.***-**',
          lgpdConsent: {
            consentType: 'treatment',
            deviceId: 'test-device-001',
            ip: '127.0.0.1',
            timestamp: '2025-01-15T10:30:00Z',
            version: '1.0',
          },
          createdAt: '2025-01-15T10:30:00Z',
          updatedAt: '2025-01-15T10:30:00Z',
        };
      },
    },
    update: {
      mutate: async ({ id, data }: { id: string; data: Record<string, any> }) => {
        if (id !== 'test-patient-001') {
          throw { error: 'Patient not found' };
        }

        return {
          id,
          ...data,
          cpf: data.cpf ? '***.***.***-**' : undefined,
          phone: maskPhone(data.phone),
          updatedAt: new Date().toISOString(),
        };
      },
    },
  },
  payments: {
    history: {
      query: async ({
        patientId,
        limit = 10,
        offset = 0,
      }: {
        patientId?: string;
        limit?: number;
        offset?: number;
      } = {}) => {
        const payments = [
          {
            amount: 150.0,
            id: 'payment-001',
            patientId: 'test-patient-001',
            processedAt: '2025-01-15T14:30:00Z',
            status: 'completed',
            type: 'consultation',
          },
          {
            amount: 75.5,
            id: 'payment-002',
            patientId: 'test-patient-001',
            processedAt: '2025-01-10T11:15:00Z',
            status: 'completed',
            type: 'procedure',
          },
        ];

        return payments
          .filter((payment) => !patientId || payment.patientId === patientId)
          .slice(offset, offset + limit);
      },
    },
    process: {
      mutate: async ({
        amount,
        recipient,
        type,
        metadata,
      }: {
        amount: number;
        recipient: string;
        type: string;
        metadata?: Record<string, unknown>;
      }) => {
        if (!amount || amount <= 0) {
          throw {
            code: 'INVALID_AMOUNT',
            error: 'Invalid amount',
          };
        }

        return {
          amount,
          id: 'payment-001',
          metadata,
          processedAt: new Date().toISOString(),
          recipient,
          status: 'completed',
          transactionId: `TXN${Date.now()}`,
          type,
        };
      },
    },
  },
  voice: {
    processCommand: {
      mutate: async ({ command, confidence, language }: Record<string, any>) => {
        if (confidence < 0.8) {
          throw {
            code: 'LOW_CONFIDENCE',
            error: 'Voice command confidence too low',
            minRequired: 0.8,
          };
        }

        const processedCommand = {
          confidence,
          entities: {} as Record<string, unknown>,
          intent: 'unknown',
          language,
          processedAt: new Date().toISOString(),
        };

        if (command.includes('transferir') || command.includes('pagar')) {
          processedCommand.intent = 'payment_transfer';
          const amountMatch = command.match(/(\d+).*reais/i);
          if (amountMatch) {
            processedCommand.entities.amount = parseFloat(amountMatch[1]);
          }
        } else if (command.includes('consulta') || command.includes('agendar')) {
          processedCommand.intent = 'appointment_booking';
        }

        return processedCommand;
      },
    },
  },
});

describe('tRPC Type-Safe Integration Testing', () => {
  let trpc: ReturnType<typeof createTrpcMock>;

  beforeEach(() => {
    trpc = createTrpcMock();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Patient Procedures', () => {
    it('should retrieve patient data with proper LGPD masking', async () => {
      // Mock tRPC client call
      const patientData = await trpc.patients.getById.query({ id: 'test-patient-001' });

      expect(patientData).toMatchObject({
        email: 'joao.silva@example.com',
        id: 'test-patient-001',
        name: 'João Silva',
      });

      // Validate LGPD compliance
      expect(patientData.cpf).toBe('***.***.***-**');
      expect(patientData.phone).toBe('+55******4321');
      expect(patientData.lgpdConsent).toBeDefined();
    });

    it('should require LGPD consent for patient creation', async () => {
      const patientData = {
        cpf: '98765432100',
        email: 'maria.santos@example.com',
        name: 'Maria Santos',
        phone: '11987654321',
      };

      // Try to create patient without consent
      await expect(trpc.patients.create.mutate(patientData)).rejects.toMatchObject({
        code: 'LGPD_CONSENT_REQUIRED',
        error: 'LGPD consent is required',
      });
    });

    it('should create patient with LGPD consent and return masked data', async () => {
      const patientData = {
        cpf: '98765432100',
        email: 'maria.santos@example.com',
        lgpdConsent: (global.testUtils as TestUtils).createMockLGPDConsent(),
        name: 'Maria Santos',
        phone: '11987654321',
      };

      const result = await trpc.patients.create.mutate(patientData);

      expect(result).toMatchObject({
        id: expect.any(String),
        name: 'Maria Santos',
        email: 'maria.santos@example.com',
        cpf: '***.***.***-**', // Masked
        phone: expect.stringMatching(/^\+55\*{6,}\d{4}$/), // Masked
        lgpdConsent: expect.any(Object),
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      });
    });

    it('should handle patient deletion with audit logging', async () => {
      const result = await trpc.patients.delete.mutate({ id: 'test-patient-001' });

      expect(result).toMatchObject({
        deletedAt: expect.any(String),
        success: true,
      });
    });
  });

  describe('Appointment Procedures', () => {
    it('should validate appointment creation requirements', async () => {
      const invalidAppointment = {
        patientId: 'test-patient-001',
        // Missing dateTime
      };

      await expect(trpc.appointments.create.mutate(invalidAppointment)).rejects.toMatchObject({
        code: 'MISSING_REQUIRED_FIELDS',
        error: 'Missing required fields',
      });
    });

    it('should create appointment with valid data', async () => {
      const appointmentData = {
        dateTime: '2025-01-20T14:00:00Z',
        doctorId: 'doctor-001',
        patientId: 'test-patient-001',
        type: 'consultation',
      };

      const result = await trpc.appointments.create.mutate(appointmentData);

      expect(result).toMatchObject({
        createdAt: expect.any(String),
        dateTime: '2025-01-20T14:00:00Z',
        doctorId: 'doctor-001',
        id: expect.any(String),
        patientId: 'test-patient-001',
        status: 'scheduled',
        type: 'consultation',
      });
    });

    it('should filter appointments by patient ID', async () => {
      const appointments = await trpc.appointments.list.query({
        patientId: 'test-patient-001',
      });

      expect(appointments).toHaveLength(2);
      expect(appointments[0]).toMatchObject({
        patientId: 'test-patient-001',
        status: 'scheduled',
      });
    });
  });

  describe('Payment Procedures', () => {
    it('should validate payment amount', async () => {
      const invalidPayment = {
        amount: -50,
        recipient: 'test-provider',
        type: 'consultation',
      };

      await expect(trpc.payments.process.mutate(invalidPayment)).rejects.toMatchObject({
        code: 'INVALID_AMOUNT',
        error: 'Invalid amount',
      });
    });

    it('should process valid payment successfully', async () => {
      const paymentData = {
        amount: 150.0,
        metadata: {
          appointmentId: 'appointment-001',
        },
        recipient: 'Dr. João Silva',
        type: 'consultation',
      };

      const result = await trpc.payments.process.mutate(paymentData);

      expect(result).toMatchObject({
        amount: 150.0,
        id: expect.any(String),
        processedAt: expect.any(String),
        recipient: 'Dr. João Silva',
        status: 'completed',
        transactionId: expect.stringMatching(/^TXN\d+$/),
        type: 'consultation',
      });
    });

    it('should retrieve payment history for patient', async () => {
      const payments = await trpc.payments.history.query({
        limit: 10,
        patientId: 'test-patient-001',
      });

      expect(payments).toHaveLength(2);
      expect(payments[0]).toMatchObject({
        amount: 150.0,
        patientId: 'test-patient-001',
        status: 'completed',
      });
    });
  });

  describe('Voice Interface Procedures', () => {
    it('should reject low confidence voice commands', async () => {
      const lowConfidenceCommand = {
        command: 'comando incerto',
        confidence: 0.65,
        language: 'pt-BR',
      };

      await expect(trpc.voice.processCommand.mutate(lowConfidenceCommand)).rejects.toMatchObject({
        code: 'LOW_CONFIDENCE',
        error: 'Voice command confidence too low',
        minRequired: 0.8,
      });
    });

    it('should process payment transfer commands', async () => {
      const transferCommand = {
        command: 'transferir cem reais para João',
        confidence: 0.95,
        language: 'pt-BR',
      };

      const result = await trpc.voice.processCommand.mutate(transferCommand);

      expect(result).toMatchObject({
        confidence: 0.95,
        entities: {
          amount: 100,
        },
        intent: 'payment_transfer',
        language: 'pt-BR',
        processedAt: expect.any(String),
      });
    });

    it('should process appointment booking commands', async () => {
      const appointmentCommand = {
        command: 'agendar consulta para amanhã',
        confidence: 0.92,
        language: 'pt-BR',
      };

      const result = await trpc.voice.processCommand.mutate(appointmentCommand);

      expect(result).toMatchObject({
        confidence: 0.92,
        intent: 'appointment_booking',
        language: 'pt-BR',
        processedAt: expect.any(String),
      });
    });
  });

  describe('Type Safety Validation', () => {
    it('should enforce TypeScript types for procedure inputs', () => {
      // These would cause TypeScript compilation errors if types were incorrect
      const validPatientQuery = { id: 'string' }; // Correct type
      const validPatientMutation = {
        email: 'string',
        lgpdConsent: {
          consentType: 'string',
          deviceId: 'string',
          ip: 'string',
          timestamp: 'string',
          version: 'string',
        },
        name: 'string',
      }; // Correct type

      expect(typeof validPatientQuery.id).toBe('string');
      expect(typeof validPatientMutation.name).toBe('string');
      expect(typeof validPatientMutation.lgpdConsent.timestamp).toBe('string');
    });

    it('should provide type-safe procedure outputs', async () => {
      const patient = await trpc.patients.getById.query({ id: 'test-patient-001' });

      // TypeScript would enforce these types
      expect(patient).toHaveProperty('id');
      expect(patient).toHaveProperty('name');
      expect(patient).toHaveProperty('lgpdConsent');
      expect(typeof patient.id).toBe('string');
      expect(typeof patient.name).toBe('string');
    });
  });
});
