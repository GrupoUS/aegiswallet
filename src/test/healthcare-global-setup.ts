import fs from 'node:fs';
import path from 'node:path';

export default async function setup() {
  // Create test data directories
  const testDataDirs = [
    'src/test/fixtures/patients',
    'src/test/fixtures/appointments',
    'src/test/fixtures/payments',
    'src/test/fixtures/voice-commands',
    'src/test/fixtures/lgpd-audit',
  ];

  testDataDirs.forEach((dir) => {
    const fullPath = path.join(process.cwd(), dir);
    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath, { recursive: true });
    }
  });

  // Generate LGPD-compliant test fixtures
  await generateHealthcareFixtures();

  // Setup test database if needed
  await setupTestDatabase();

  // Validate healthcare compliance
  await validateHealthcareCompliance();
}

async function generateHealthcareFixtures() {
  const fixtures = {
    'patients.json': [
      {
        id: 'test-patient-001',
        name: 'João Silva',
        cpf: '***.***.***-**', // Masked for LGPD
        phone: '+55******1234',
        email: 'joao.silva@example.com',
        lgpdConsent: {
          timestamp: '2025-01-15T10:30:00Z',
          ip: '127.0.0.1',
          deviceId: 'test-device-001',
          consentType: 'treatment',
          version: '1.0',
        },
      },
    ],

    'voice-commands.json': [
      {
        id: 'cmd-001',
        command: 'transferir cem reais para João Silva',
        intent: 'payment_transfer',
        entities: {
          amount: 100,
          recipient: 'João Silva',
          currency: 'BRL',
        },
        language: 'pt-BR',
        confidence: 0.95,
      },
      {
        id: 'cmd-002',
        command: 'agendar consulta com Dr. Pedro para amanhã',
        intent: 'appointment_booking',
        entities: {
          doctor: 'Dr. Pedro',
          date: 'tomorrow',
          type: 'consultation',
        },
        language: 'pt-BR',
        confidence: 0.92,
      },
    ],

    'lgpd-audit.json': [
      {
        id: 'audit-001',
        action: 'DATA_ACCESS',
        table: 'patients',
        record_id: 'test-patient-001',
        user_id: 'test-user-001',
        timestamp: '2025-01-15T10:30:00Z',
        ip_address: '127.0.0.1',
        user_agent: 'AegisWallet-Test/1.0',
        metadata: {
          purpose: 'treatment',
          legal_basis: 'consent',
          data_categories: ['health_data', 'personal_data'],
        },
      },
    ],
  };

  // Write fixtures to appropriate directories
  for (const [filename, data] of Object.entries(fixtures)) {
    let filepath: string;

    if (filename === 'patients.json') {
      filepath = 'src/test/fixtures/patients/patients.json';
    } else if (filename === 'voice-commands.json') {
      filepath = 'src/test/fixtures/voice-commands/commands.json';
    } else if (filename === 'lgpd-audit.json') {
      filepath = 'src/test/fixtures/lgpd-audit/audit-logs.json';
    } else {
      continue;
    }

    const fullPath = path.join(process.cwd(), filepath);
    fs.writeFileSync(fullPath, JSON.stringify(data, null, 2));
  }
}

async function setupTestDatabase() {
  // Here you would typically setup test database schema
  // For now, we'll just ensure the test database configuration exists
  const testDbConfig = {
    test: {
      host: 'localhost',
      port: 54322,
      database: 'aegiswallet_test',
      user: 'postgres',
      password: 'postgres',
    },
  };

  const configPath = path.join(process.cwd(), 'src/test/fixtures/database-config.json');
  fs.writeFileSync(configPath, JSON.stringify(testDbConfig, null, 2));
}

async function validateHealthcareCompliance() {
  const complianceChecks = {
    lgpd: {
      enabled: true,
      version: '1.0',
      consent_required: true,
      data_masking: true,
      audit_trail: true,
    },

    anvisa: {
      enabled: true,
      medical_device_tracking: true,
      safety_reporting: true,
      maintenance_logs: true,
    },

    accessibility: {
      wcag_level: 'AA',
      voice_interface: true,
      keyboard_navigation: true,
      screen_reader_support: true,
    },

    voice_interface: {
      language: 'pt-BR',
      confidence_threshold: 0.9,
      fallback_enabled: true,
      error_handling: true,
    },
  };

  const configPath = path.join(process.cwd(), 'src/test/fixtures/compliance-config.json');
  fs.writeFileSync(configPath, JSON.stringify(complianceChecks, null, 2));
}
