/**
 * AI Intelligence Panel - Story 04.04
 */

export function IntelligencePanel() {
  return (
    <div className="bg-purple-50 rounded-lg p-6">
      <h3 className="text-lg font-semibold mb-4">Insights Inteligentes</h3>
      <div className="space-y-3">
        <div className="p-3 bg-white rounded shadow-sm">
          <p className="text-sm">💡 Você economizou R$ 200 este mês!</p>
        </div>
        <div className="p-3 bg-white rounded shadow-sm">
          <p className="text-sm">⚠️ Conta de luz vence em 3 dias</p>
        </div>
        <div className="p-3 bg-white rounded shadow-sm">
          <p className="text-sm">📊 Gastos com alimentação 15% acima da média</p>
        </div>
      </div>
    </div>
  )
}
