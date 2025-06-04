
import { RefreshCw, CheckCircle, XCircle, Pause } from "lucide-react";

interface SyncStatusIndicatorProps {
  status: string;
  className?: string;
}

const SyncStatusIndicator = ({ status, className = "" }: SyncStatusIndicatorProps) => {
  const getStatusIcon = () => {
    switch (status) {
      case 'syncing':
        return <RefreshCw className="h-4 w-4 animate-spin text-yellow-500" />;
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Pause className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'syncing':
        return 'Sincronizando...';
      case 'success':
        return 'Sincronizado';
      case 'error':
        return 'Erro na sincronização';
      default:
        return 'Ocioso';
    }
  };

  return (
    <div className={`flex items-center space-x-1 ${className}`}>
      {getStatusIcon()}
      <span className="text-sm">{getStatusText()}</span>
    </div>
  );
};

export default SyncStatusIndicator;
