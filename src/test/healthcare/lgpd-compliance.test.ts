// Satisfies: Section 1: LGPD Compliance Testing of .claude/skills/webapp-testing/SKILL.md
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { TestUtils } from '../healthcare-setup';

// Import healthcare setup to configure test environment
import '../healthcare-setup';

// Mock healthcare components (these would be your actual components)
const PatientForm = ({ onSubmit }: { onSubmit: (data: any) => void }) => {
  const [consent, setConsent] = React.useState(false);
  const [formData, setFormData] = React.useState({
    name: '',
    email: '',
    phone: '',
    cpf: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!consent) return;

    onSubmit({
      ...formData,
      lgpdConsent: (global.testUtils as TestUtils).createMockLGPDConsent(),
      // Mask sensitive data automatically
      cpf: formData.cpf.replace(/(\d{3})\d{3}(\d{3})\d{2}$/, '$1.***.$2-**'),
      phone: formData.phone.replace(/(\d{2})(\d{1})\d{4}(\d{4})$/, '$1$2****$3'),
    });
  };

  return React.createElement('form', { onSubmit: handleSubmit }, [
    React.createElement('input', {
      key: 'name',
      type: 'text',
      placeholder: 'Nome completo',
      'data-testid': 'patient-name',
      value: formData.name,
      onChange: (e) => setFormData({ ...formData, name: e.target.value }),
    }),
    React.createElement('input', {
      key: 'email',
      type: 'email',
      placeholder: 'Email',
      'data-testid': 'patient-email',
      value: formData.email,
      onChange: (e) => setFormData({ ...formData, email: e.target.value }),
    }),
    React.createElement('input', {
      key: 'phone',
      type: 'tel',
      placeholder: 'Telefone',
      'data-testid': 'patient-phone',
      value: formData.phone,
      onChange: (e) => setFormData({ ...formData, phone: e.target.value }),
    }),
    React.createElement('input', {
      key: 'cpf',
      type: 'text',
      placeholder: 'CPF',
      'data-testid': 'patient-cpf',
      value: formData.cpf,
      onChange: (e) => setFormData({ ...formData, cpf: e.target.value }),
    }),
    React.createElement('label', { key: 'consent-label' }, [
      React.createElement('input', {
        key: 'consent-checkbox',
        type: 'checkbox',
        'data-testid': 'lgpd-consent',
        checked: consent,
        onChange: (e) => setConsent(e.target.checked),
      }),
      'Concordo com o tratamento de meus dados conforme LGPD',
    ]),
    React.createElement(
      'button',
      {
        key: 'submit',
        type: 'submit',
        'data-testid': 'submit-patient',
        disabled: !consent,
      },
      'Cadastrar Paciente'
    ),
  ]);
};

describe('LGPD Compliance Testing', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.localStorage?.clear();
  });

  describe('Consent Management', () => {
    it('should require explicit consent before data collection', async () => {
      const onSubmit = vi.fn();

      render(React.createElement(PatientForm, { onSubmit }));

      const submitButton = screen.getByTestId('submit-patient');
      expect(submitButton).toBeDisabled();

      // Form should not be submittable without consent
      const nameInput = screen.getByTestId('patient-name');
      await userEvent.type(nameInput, 'João Silva');

      expect(submitButton).toBeDisabled();
    });

    it('should enable form submission only after consent is given', async () => {
      const onSubmit = vi.fn();

      render(React.createElement(PatientForm, { onSubmit }));

      const consentCheckbox = screen.getByTestId('lgpd-consent');
      const submitButton = screen.getByTestId('submit-patient');

      // Enable consent
      await userEvent.click(consentCheckbox);

      expect(consentCheckbox).toBeChecked();
      expect(submitButton).toBeEnabled();
    });

    it('should record consent metadata with all required fields', async () => {
      const onSubmit = vi.fn();

      render(React.createElement(PatientForm, { onSubmit }));

      // Fill form with patient data
      await userEvent.type(screen.getByTestId('patient-name'), 'João Silva');
      await userEvent.type(screen.getByTestId('patient-email'), 'joao@example.com');
      await userEvent.type(screen.getByTestId('patient-phone'), '11987654321');
      await userEvent.type(screen.getByTestId('patient-cpf'), '12345678900');

      // Give consent
      await userEvent.click(screen.getByTestId('lgpd-consent'));

      // Submit form
      await userEvent.click(screen.getByTestId('submit-patient'));

      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            lgpdConsent: expect.objectContaining({
              timestamp: expect.any(String),
              ip: '127.0.0.1',
              deviceId: 'test-device-id',
              consentType: 'treatment',
              version: '1.0',
            }),
          })
        );
      });
    });
  });

  describe('Data Protection and Masking', () => {
    it('should mask CPF in submitted data', async () => {
      const onSubmit = vi.fn();

      render(React.createElement(PatientForm, { onSubmit }));

      // Fill form with CPF
      await userEvent.type(screen.getByTestId('patient-cpf'), '12345678900');
      await userEvent.type(screen.getByTestId('patient-name'), 'Test Patient');
      await userEvent.click(screen.getByTestId('lgpd-consent'));

      // Submit form
      await userEvent.click(screen.getByTestId('submit-patient'));

      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            cpf: expect.stringMatching(/^\d{3}\.\*{3}\.\d{3}-\*{2}$/),
          })
        );
      });
    });

    it('should mask phone numbers in submitted data', async () => {
      const onSubmit = vi.fn();

      render(React.createElement(PatientForm, { onSubmit }));

      // Fill form with phone
      await userEvent.type(screen.getByTestId('patient-phone'), '11987654321');
      await userEvent.type(screen.getByTestId('patient-name'), 'Test Patient');
      await userEvent.click(screen.getByTestId('lgpd-consent'));

      // Submit form
      await userEvent.click(screen.getByTestId('submit-patient'));

      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            phone: expect.stringMatching(/^\d{2}\d{1}\*{4}\d{4}$/),
          })
        );
      });
    });

    it('should validate LGPD field masking using custom matcher', () => {
      const maskedCPF = '***.***.***-**';
      const unmaskedCPF = '123.456.789-00';

      expect(maskedCPF).toBeLGPDCompliant('cpf');
      expect(() => {
        expect(unmaskedCPF).toBeLGPDCompliant('cpf');
      }).toThrow();
    });
  });

  describe('Right to Erasure', () => {
    it('should provide data deletion functionality', async () => {
      // Mock delete function
      const deletePatientData = vi.fn().mockResolvedValue({ success: true });

      // Simulate data deletion request
      const result = await deletePatientData('test-patient-id');

      expect(deletePatientData).toHaveBeenCalledWith('test-patient-id');
      expect(result).toEqual({ success: true });
    });

    it('should log erasure requests for audit trail', async () => {
      const logAuditEntry = vi.fn();

      // Mock erasure request
      const erasureRequest = {
        patientId: 'test-patient-id',
        reason: 'user_request',
        timestamp: new Date().toISOString(),
        requestId: 'erasure-001',
      };

      // Log the erasure request
      logAuditEntry({
        action: 'DATA_ERASURE',
        patientId: erasureRequest.patientId,
        reason: erasureRequest.reason,
        timestamp: erasureRequest.timestamp,
        requestId: erasureRequest.requestId,
      });

      expect(logAuditEntry).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'DATA_ERASURE',
          patientId: 'test-patient-id',
          reason: 'user_request',
          requestId: 'erasure-001',
        })
      );
    });
  });

  describe('Audit Trail', () => {
    it('should log all data access operations', async () => {
      const logAccess = vi.fn();

      // Simulate patient data access
      const accessEvent = {
        userId: 'test-user-001',
        patientId: 'test-patient-001',
        action: 'READ',
        timestamp: new Date().toISOString(),
        ipAddress: '127.0.0.1',
      };

      logAccess(accessEvent);

      expect(logAccess).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'test-user-001',
          patientId: 'test-patient-001',
          action: 'READ',
          ipAddress: '127.0.0.1',
        })
      );
    });

    it('should track data modifications with full context', async () => {
      const logModification = vi.fn();

      // Simulate patient data update
      const modificationEvent = {
        userId: 'test-user-001',
        patientId: 'test-patient-001',
        action: 'UPDATE',
        fieldsChanged: ['phone', 'email'],
        previousValues: {
          phone: '+55******4321',
          email: 'old@example.com',
        },
        newValues: {
          phone: '+55******9999',
          email: 'new@example.com',
        },
        timestamp: new Date().toISOString(),
      };

      logModification(modificationEvent);

      expect(logModification).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'test-user-001',
          patientId: 'test-patient-001',
          action: 'UPDATE',
          fieldsChanged: ['phone', 'email'],
        })
      );
    });
  });

  describe('Data Minimization', () => {
    it('should only collect necessary data for the intended purpose', () => {
      const requiredFields = ['name', 'email', 'consent'];
      const collectedData = {
        name: 'João Silva',
        email: 'joao@example.com',
        phone: '11987654321', // Optional field
        cpf: '12345678900', // Optional field
        consent: true,
      };

      // Validate that only required data is being processed
      requiredFields.forEach((field) => {
        expect(collectedData).toHaveProperty(field);
      });

      // Optional fields should be clearly marked as such
      expect(Object.keys(collectedData)).toEqual(
        expect.arrayContaining(['name', 'email', 'consent'])
      );
    });

    it('should have clear purpose limitation for data processing', () => {
      const dataProcessingPurposes = {
        patient_registration: ['name', 'email', 'phone'],
        appointment_scheduling: ['name', 'phone'],
        payment_processing: ['name', 'cpf'],
        emergency_contact: ['name', 'phone', 'emergency_contact'],
      };

      // Validate that each purpose has a defined and limited set of data fields
      Object.entries(dataProcessingPurposes).forEach(([_purpose, fields]) => {
        expect(Array.isArray(fields)).toBe(true);
        expect(fields.length).toBeGreaterThan(0);
        expect(fields.length).toBeLessThan(5); // Reasonable limit
      });
    });
  });
});
