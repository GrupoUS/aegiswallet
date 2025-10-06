import { NeumorphButton } from '@/components/ui'

export function NeumorphButtonDemo() {
  return (
    <div className="flex flex-col gap-4 p-8">
      <h2 className="text-2xl font-bold mb-4">Neumorph Button Examples</h2>

      <div className="flex gap-4 items-center">
        <NeumorphButton intent="default">Default Button</NeumorphButton>

        <NeumorphButton intent="primary">Primary Button</NeumorphButton>

        <NeumorphButton intent="secondary">Secondary Button</NeumorphButton>

        <NeumorphButton intent="danger">Danger Button</NeumorphButton>
      </div>

      <div className="flex gap-4 items-center">
        <NeumorphButton size="small">Small Button</NeumorphButton>

        <NeumorphButton size="medium">Medium Button</NeumorphButton>

        <NeumorphButton size="large">Large Button</NeumorphButton>
      </div>

      <div className="flex gap-4 items-center">
        <NeumorphButton loading>Loading Button</NeumorphButton>

        <NeumorphButton disabled>Disabled Button</NeumorphButton>

        <NeumorphButton fullWidth>Full Width Button</NeumorphButton>
      </div>

      <div className="flex gap-4 items-center">
        <NeumorphButton onClick={() => alert('Button clicked!')}>Click Me</NeumorphButton>

        <NeumorphButton intent="primary" onClick={() => console.log('Primary button clicked')}>
          Console Log
        </NeumorphButton>
      </div>
    </div>
  )
}
