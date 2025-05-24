
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Crown, Sparkles } from "lucide-react";

interface PremiumFeatureBannerProps {
  feature: string;
  description: string;
  onUpgrade: () => void;
  showButton?: boolean;
}

const PremiumFeatureBanner = ({ 
  feature, 
  description, 
  onUpgrade, 
  showButton = true 
}: PremiumFeatureBannerProps) => {
  return (
    <Card className="border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-950/20">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 dark:bg-yellow-900 rounded-full">
              <Crown className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div>
              <h3 className="font-semibold text-yellow-800 dark:text-yellow-200">
                {feature} - Recurso Premium
              </h3>
              <p className="text-sm text-yellow-700 dark:text-yellow-300">
                {description}
              </p>
            </div>
          </div>
          {showButton && (
            <Button 
              onClick={onUpgrade}
              className="bg-yellow-600 hover:bg-yellow-700 text-white"
            >
              <Sparkles className="h-4 w-4 mr-2" />
              Seja Pro
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default PremiumFeatureBanner;
