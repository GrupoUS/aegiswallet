
import { ReactNode } from "react";
import { useAccessLevel } from "@/hooks/useAccessLevel";
import PremiumFeatureBanner from "./PremiumFeatureBanner";

interface PremiumFeatureGateProps {
  children: ReactNode;
  feature: string;
  description: string;
  allowTrial?: boolean;
  fallback?: ReactNode;
}

const PremiumFeatureGate = ({ 
  children, 
  feature, 
  description, 
  allowTrial = true,
  fallback 
}: PremiumFeatureGateProps) => {
  const { accessLevel } = useAccessLevel();

  const hasAccess = accessLevel === 'pro' || (allowTrial && accessLevel === 'trial');

  if (hasAccess) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  const handleUpgrade = () => {
    // Navigate to subscription page
    window.location.hash = '#subscription';
  };

  return (
    <PremiumFeatureBanner 
      feature={feature}
      description={description}
      onUpgrade={handleUpgrade}
    />
  );
};

export default PremiumFeatureGate;
