/**
 * Accessibility Settings - Story 04.05
 */

import { Switch } from '@/components/ui/switch'

export function AccessibilitySettings() {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Configurações de Acessibilidade</h3>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label>Modo Alto Contraste</label>
          <Switch />
        </div>
        <div className="flex items-center justify-between">
          <label>Aumentar Fonte</label>
          <Switch />
        </div>
        <div className="flex items-center justify-between">
          <label>Leitor de Tela</label>
          <Switch />
        </div>
        <div className="flex items-center justify-between">
          <label>Apenas Texto (sem voz)</label>
          <Switch />
        </div>
      </div>
    </div>
  )
}
