/**
 * AI Intelligence Panel - Story 04.04
 */

export function IntelligencePanel() {
  return (
    <div className="rounded-lg bg-accent/10 p-6">
      <h3 className="mb-4 font-semibold text-lg">Insights Inteligentes</h3>
      <div className="space-y-3">
        <div className="rounded bg-white p-3 shadow-sm">
          <p className="text-sm">💡 Você economizou R$ 200 este mês!</p>
        </div>
        <div className="rounded bg-white p-3 shadow-sm">
          <p className="text-sm">⚠️ Conta de luz vence em 3 dias</p>
        </div>
        <div className="rounded bg-white p-3 shadow-sm">
          <p className="text-sm">📊 Gastos com alimentação 15% acima da média</p>
        </div>
      </div>
    </div>
  );
}
