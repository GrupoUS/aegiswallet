
import { useAccessLevel } from "@/hooks/useAccessLevel";
import PremiumFeatureBanner from "@/components/subscription/PremiumFeatureBanner";
import { useNavigate } from "react-router-dom";

interface BankConnectionGateProps {
  children: React.ReactNode;
}

const BankConnectionGate = ({ children }: BankConnectionGateProps) => {
  const { accessLevel } = useAccessLevel();
  const navigate = useNavigate();

  const handleUpgrade = () => {
    navigate("/?tab=subscription");
  };

  // Allow access for Pro and Trial users
  if (accessLevel === 'pro' || accessLevel === 'trial') {
    return <>{children}</>;
  }

  // Show single premium banner for free users
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
        feature="Conexão Bancária"
        description="Conecte suas contas bancárias e sincronize transações automaticamente com o plano Pro"
        onUpgrade={handleUpgrade}
      />
    </div>
  );
};

export default BankConnectionGate;
