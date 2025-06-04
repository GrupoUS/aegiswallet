
import { useAccessLevel } from "@/hooks/useAccessLevel";
import PremiumFeatureBanner from "@/components/subscription/PremiumFeatureBanner";

interface BankConnectionGateProps {
  children: React.ReactNode;
}

const BankConnectionGate = ({ children }: BankConnectionGateProps) => {
  const { accessLevel } = useAccessLevel();

  // Allow access for Pro and Trial users
  if (accessLevel === 'pro' || accessLevel === 'trial') {
    return <>{children}</>;
  }

  // Show premium banner without button for free users
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Contas Bancárias
        </h2>
        <p className="text-gray-600 dark:text-gray-300">
          Conecte suas contas bancárias para sincronização automática
        </p>
      </div>

      <PremiumFeatureBanner 
        feature="Conexão Bancária Automática"
        description="Conecte suas contas bancárias e sincronize transações automaticamente com o plano Pro. Economize tempo e tenha controle total de suas finanças."
        onUpgrade={() => {}}
        showButton={false}
      />
    </div>
  );
};

export default BankConnectionGate;
