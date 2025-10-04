import { describe, expect, it } from 'vitest'
import { screen } from '@/test/utils/test-utils'

describe('Example Test', () => {
  it('should render without crashing', () => {
    // Teste básico para verificar se o setup está funcionando
    expect(true).toBe(true)
  })

  it('should have access to testing-library utilities', () => {
    // Verifica se as utilities do testing-library estão disponíveis
    expect(screen.getByRole).toBeDefined()
    expect(screen.getByText).toBeDefined()
  })
})
