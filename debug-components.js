// Debug component exports
// Note: This script requires proper TypeScript compilation to work
// Consider running tests instead: bun test

console.log('Components debug script')
console.log('Note: This script needs proper setup to work with TypeScript modules')
console.log('Consider running the actual tests instead: bun test')

// Mock component exports for testing
const mockComponents = {
  BentoGrid: function BentoGrid(props) { return null },
  BentoCard: function BentoCard(props) { return null },
  PopoverAnchor: function PopoverAnchor(props) { return null },
  SheetOverlay: function SheetOverlay(props) { return null },
  SheetPortal: function SheetPortal(props) { return null }
}

console.log('BentoGrid type:', typeof mockComponents.BentoGrid)
console.log('BentoCard type:', typeof mockComponents.BentoCard)
console.log('PopoverAnchor type:', typeof mockComponents.PopoverAnchor)
console.log('SheetOverlay type:', typeof mockComponents.SheetOverlay)
console.log('SheetPortal type:', typeof mockComponents.SheetPortal)

console.log('BentoGrid:', mockComponents.BentoGrid)
console.log('PopoverAnchor:', mockComponents.PopoverAnchor)
console.log('\nDebug script completed successfully')
