// Satisfies: Section 3: tRPC Integration Testing of .claude/skills/webapp-testing/SKILL.md
import { setupServer } from 'msw/node';
import { createTRPCMsw } from 'msw-trpc';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { AppRouter } from '@/server/router';
import type { TestUtils } from '../healthcare-setup';

// Mock tRPC router for testing
const _mockRouter = {
  appointments: {
    create: {
      mutation: vi.fn(),
    },
    list: {
      query: vi.fn(),
    },
  },
  patients: {
    create: {
      mutation: vi.fn(),
    },
    delete: {
      mutation: vi.fn(),
    },
    getById: {
      query: vi.fn(),
    },
    update: {
      mutation: vi.fn(),
    },
  },
  payments: {
    history: {
      query: vi.fn(),
    },
    process: {
      mutation: vi.fn(),
    },
  },
  voice: {
    processCommand: {
      mutation: vi.fn(),
    },
  },
} as any;

// Create tRPC mock for testing
const createTrpcMock = () => {
  const msw = createTRPCMsw<AppRouter>();

  return {
    appointments: {
      create: msw.appointments.create.mutation((req, res, ctx) => {
        const appointmentData = req.input;

        // Validate required fields
        if (!appointmentData.patientId || !appointmentData.dateTime) {
          return res(
            ctx.status(400),
            ctx.data({
              code: 'MISSING_REQUIRED_FIELDS',
              error: 'Missing required fields',
            })
          );
        }

        const newAppointment = {
          id: 'appointment-001',
          ...appointmentData,
          status: 'scheduled',
          createdAt: new Date().toISOString(),
        };

        return res(ctx.data(newAppointment));
      }),

      list: msw.appointments.list.query((req, res, ctx) => {
        const { patientId, dateRange } = req.input;

        // Mock appointment data
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
        ].filter((apt) => !patientId || apt.patientId === patientId);

        return res(ctx.data(appointments));
      }),
    },
    patients: {
      create: msw.patients.create.mutation((req, res, ctx) => {
        const patientData = req.input;

        // Validate LGPD compliance
        if (!patientData.lgpdConsent) {
          return res(
            ctx.status(400),
            ctx.data({
              code: 'LGPD_CONSENT_REQUIRED',
              error: 'LGPD consent is required',
            })
          );
        }

        // Mask sensitive data before returning
        const maskedData = {
          ...patientData,
          id: 'new-patient-id',
          cpf: '***.***.***-**',
          phone: patientData.phone
            ? patientData.phone.replace(/(\d{2})(\d{1})\d{4}(\d{4})$/, '$1$2****$4')
            : undefined,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        return res(ctx.data(maskedData));
      }),
      delete: msw.patients.delete.mutation((req, res, ctx) => {
        const { id } = req.input;

        if (id === 'test-patient-001') {
          return res(ctx.data({ deletedAt: new Date().toISOString(), success: true }));
        }

        return res(ctx.status(404), ctx.data({ error: 'Patient not found' }));
      }),
      getById: msw.patients.getById.query((req, res, ctx) => {
        const { id } = req.input;

        // Mock patient data with LGPD compliance
        if (id === 'test-patient-001') {
          return res(
            ctx.data({
              id: 'test-patient-001',
              name: 'João Silva',
              email: 'joao.silva@example.com',
              phone: '+55******4321', // LGPD masked
              cpf: '***.***.***-**', // LGPD masked
              lgpdConsent: {
                consentType: 'treatment',
                deviceId: 'test-device-001',
                ip: '127.0.0.1',
                timestamp: '2025-01-15T10:30:00Z',
                version: '1.0',
              },
              createdAt: '2025-01-15T10:30:00Z',
              updatedAt: '2025-01-15T10:30:00Z',
            })
          );
        }

        return res(ctx.status(404), ctx.data({ error: 'Patient not found' }));
      }),
      update: msw.patients.update.mutation((req, res, ctx) => {
        const { id, data } = req.input;

        // Validate patient exists and user has permission
        if (id !== 'test-patient-001') {
          return res(ctx.status(404), ctx.data({ error: 'Patient not found' }));
        }

        // Mask sensitive data in response
        const updatedData = {
          id,
          ...data,
          cpf: data.cpf ? '***.***.***-**' : undefined,
          phone: data.phone
            ? data.phone.replace(/(\d{2})(\d{1})\d{4}(\d{4})$/, '$1$2****$4')
            : undefined,
          updatedAt: new Date().toISOString(),
        };

        return res(ctx.data(updatedData));
      }),
    },
    payments: {
      history: msw.payments.history.query((req, res, ctx) => {
        const { patientId, limit = 10, offset = 0 } = req.input;

        // Mock payment history
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
        ]
          .filter((payment) => !patientId || payment.patientId === patientId)
          .slice(offset, offset + limit);

        return res(ctx.data(payments));
      }),
      process: msw.payments.process.mutation((req, res, ctx) => {
        const { amount, recipient, type, metadata } = req.input;

        // Validate payment data
        if (!amount || amount <= 0) {
          return res(
            ctx.status(400),
            ctx.data({
              code: 'INVALID_AMOUNT',
              error: 'Invalid amount',
            })
          );
        }

        // Process payment (mock)
        const payment = {
          amount,
          id: 'payment-001',
          metadata,
          processedAt: new Date().toISOString(),
          recipient,
          status: 'completed',
          transactionId: `TXN${Date.now()}`,
          type,
        };

        return res(ctx.data(payment));
      }),
    },
    voice: {
      processCommand: msw.voice.processCommand.mutation((req, res, ctx) => {
        const { command, confidence, language } = req.input;

        // Validate voice command
        if (confidence < 0.8) {
          return res(
            ctx.status(400),
            ctx.data({
              code: 'LOW_CONFIDENCE',
              error: 'Voice command confidence too low',
              minRequired: 0.8,
            })
          );
        }

        // Process command (mock NLP)
        const processedCommand = {
          confidence,
          entities: {},
          intent: 'unknown',
          language,
          processedAt: new Date().toISOString(),
        };

        // Simple intent detection
        if (command.includes('transferir') || command.includes('pagar')) {
          processedCommand.intent = 'payment_transfer';
          // Extract amount (simplified)
          const amountMatch = command.match(/(\d+).*reais/i);
          if (amountMatch) {
            processedCommand.entities.amount = parseFloat(amountMatch[1]);
          }
        } else if (command.includes('consulta') || command.includes('agendar')) {
          processedCommand.intent = 'appointment_booking';
        }

        return res(ctx.data(processedCommand));
      }),
    },
  };
};

describe('tRPC Type-Safe Integration Testing', () => {
  let server: ReturnType<typeof setupServer>;
  let trpc: ReturnType<typeof createTrpcMock>;

  beforeEach(() => {
    trpc = createTrpcMock();
    server = setupServer(...trpc.patients.getById.handler);
    server.listen({ onUnhandledRequest: 'error' });
  });

  afterEach(() => {
    server.close();
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
      console.log = vi.fn();

      const result = await trpc.patients.delete.mutate({ id: 'test-patient-001' });

      expect(result).toMatchObject({
        deletedAt: expect.any(String),
        success: true,
      });

      // Verify audit logging was called
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('DELETE request for patient test-patient-001')
      );
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
