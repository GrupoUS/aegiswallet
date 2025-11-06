/**
 * Accessibility Settings - Story 04.05
 */

import { Switch } from '@/components/ui/switch';

export function AccessibilitySettings() {
  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-lg">Configurações de Acessibilidade</h3>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label htmlFor="high-contrast">Modo Alto Contraste</label>
          <Switch id="high-contrast" />
        </div>
        <div className="flex items-center justify-between">
          <label htmlFor="large-text">Aumentar Fonte</label>
          <Switch id="large-text" />
        </div>
        <div className="flex items-center justify-between">
          <label htmlFor="screen-reader">Leitor de Tela</label>
          <Switch id="screen-reader" />
        </div>
        <div className="flex items-center justify-between">
          <label htmlFor="text-only">Apenas Texto (sem voz)</label>
          <Switch id="text-only" />
        </div>
      </div>
    </div>
  );
}
