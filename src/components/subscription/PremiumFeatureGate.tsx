
'use client'; // Adicionado

import { ReactNode } from "react";
import { useRouter } from "next/navigation"; // Alterado
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
  const router = useRouter(); // Alterado

  const hasAccess = accessLevel === 'pro' || (allowTrial && accessLevel === 'trial');

  if (hasAccess) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  const handleUpgrade = () => {
    router.push("/?tab=subscription"); // Alterado
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
