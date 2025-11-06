import { NeumorphButton } from '@/components/ui';

export function NeumorphButtonDemo() {
  return (
    <div className="flex flex-col gap-4 p-8">
      <h2 className="mb-4 font-bold text-2xl">Neumorph Button Examples</h2>

      <div className="flex items-center gap-4">
        <NeumorphButton intent="default">Default Button</NeumorphButton>

        <NeumorphButton intent="primary">Primary Button</NeumorphButton>

        <NeumorphButton intent="secondary">Secondary Button</NeumorphButton>

        <NeumorphButton intent="danger">Danger Button</NeumorphButton>
      </div>

      <div className="flex items-center gap-4">
        <NeumorphButton size="small">Small Button</NeumorphButton>

        <NeumorphButton size="medium">Medium Button</NeumorphButton>

        <NeumorphButton size="large">Large Button</NeumorphButton>
      </div>

      <div className="flex items-center gap-4">
        <NeumorphButton loading>Loading Button</NeumorphButton>

        <NeumorphButton disabled>Disabled Button</NeumorphButton>

        <NeumorphButton fullWidth>Full Width Button</NeumorphButton>
      </div>

      <div className="flex items-center gap-4">
        <NeumorphButton onClick={() => alert('Button clicked!')}>Click Me</NeumorphButton>

        <NeumorphButton intent="primary" onClick={() => {}}>
          Console Log
        </NeumorphButton>
      </div>
    </div>
  );
}
