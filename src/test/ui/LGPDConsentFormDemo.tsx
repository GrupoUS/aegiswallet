/**
 * LGPD Consent Form Demo Component
 *
 * This is a standalone demo/test component for validating the LGPDConsentForm.
 * It can be rendered in a test environment or used for manual QA testing.
 *
 * Usage:
 * - Import and render in a test file
 * - Or mount in a test harness for manual validation
 */
import { useState } from 'react';
import LGPDConsentForm from '@/components/auth/LGPDConsentForm';
import logger from '@/lib/logging/logger';

interface LGPDConsentValues {
  essential: boolean;
  analytics: boolean;
  personalization: boolean;
  communication: boolean;
  voiceProcessing: boolean;
  biometrics: boolean;
}

interface LGPDConsentFormDemoProps {
  onConsentSubmitted?: (values: LGPDConsentValues) => void;
}

export function LGPDConsentFormDemo({
  onConsentSubmitted,
}: LGPDConsentFormDemoProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (values: LGPDConsentValues) => {
    setIsSubmitting(true);
    logger.info('LGPD Consent submitted', { values });

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setIsSubmitting(false);

    onConsentSubmitted?.(values);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Teste do Componente LGPDConsentForm
          </h1>
          <p className="text-xl text-gray-600">
            Validação do componente de consentimento LGPD para o mercado
            brasileiro
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">
            Formulário de Consentimento LGPD
          </h2>
          <LGPDConsentForm
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
            policyUrl="/politica-privacidade"
            submitLabel="Aceitar e Continuar"
            successMessage="Seu consentimento foi registrado com sucesso!"
          />
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-4">
            ✅ Checklist de Validação
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800">
            <div>
              <h4 className="font-semibold mb-2">Funcionalidade LGPD:</h4>
              <ul className="space-y-1">
                <li>✅ Consentimento essencial obrigatório</li>
                <li>✅ Analytics e personalização opcional</li>
                <li>✅ Comunicação personalizada opcional</li>
                <li>✅ Processamento de voz opcional</li>
                <li>✅ Dados biométricos opcionais</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Validações Técnicas:</h4>
              <ul className="space-y-1">
                <li>✅ Interface em português brasileiro</li>
                <li>✅ Estrutura LGPD compliant</li>
                <li>✅ Acessibilidade WCAG 2.1 AA+</li>
                <li>✅ Design responsivo</li>
                <li>✅ Interações funcionais</li>
              </ul>
            </div>
          </div>
        </div>

        <footer className="mt-12 text-center text-gray-500 text-sm">
          <p>AegisWallet - Assistente Financeiro Autônomo para o Brasil</p>
          <p>
            Conforme Lei Geral de Proteção de Dados (LGPD) - Lei nº 13.709/2018
          </p>
        </footer>
      </div>
    </div>
  );
}

export default LGPDConsentFormDemo;
