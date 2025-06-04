
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, Crown } from "lucide-react";
import { useAccessLevel } from "@/hooks/useAccessLevel";

const TrialBanner = () => {
  const { accessLevel, daysLeft } = useAccessLevel();

  if (accessLevel !== 'trial' || daysLeft === null) {
    return null;
  }

  const handleUpgrade = () => {
    window.location.hash = '#subscription';
  };

  return (
    <Card className="border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/20 mb-6">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-full">
              <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-blue-800 dark:text-blue-200">
                  Período de Teste
                </h3>
                <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                  {daysLeft} {daysLeft === 1 ? 'dia restante' : 'dias restantes'}
                </Badge>
              </div>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                Aproveite todos os recursos premium do AegisWallet gratuitamente
              </p>
            </div>
          </div>
          <Button 
            onClick={handleUpgrade}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Crown className="h-4 w-4 mr-2" />
            Assinar Pro
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default TrialBanner;
