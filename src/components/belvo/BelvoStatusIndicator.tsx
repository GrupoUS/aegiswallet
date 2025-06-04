
import { RefreshCw, CheckCircle, XCircle, Pause, AlertTriangle } from "lucide-react";

interface BelvoStatusIndicatorProps {
  status: string;
  className?: string;
}

const BelvoStatusIndicator = ({ status, className = "" }: BelvoStatusIndicatorProps) => {
  const getStatusIcon = () => {
    switch (status) {
      case 'syncing':
        return <RefreshCw className="h-4 w-4 animate-spin text-yellow-500" />;
      case 'valid_token':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'login_error':
      case 'suspended':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'token_required':
        return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      case 'unconfirmed':
        return <Pause className="h-4 w-4 text-gray-500" />;
      default:
        return <Pause className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'syncing':
        return 'Sincronizando...';
      case 'valid_token':
        return 'Conectado';
      case 'login_error':
        return 'Erro de autenticação';
      case 'suspended':
        return 'Suspenso';
      case 'token_required':
        return 'Requer autenticação';
      case 'unconfirmed':
        return 'Não confirmado';
      default:
        return 'Status desconhecido';
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'valid_token':
        return 'text-green-600';
      case 'login_error':
      case 'suspended':
        return 'text-red-600';
      case 'token_required':
        return 'text-orange-600';
      case 'syncing':
        return 'text-yellow-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      {getStatusIcon()}
      <span className={`text-sm ${getStatusColor()}`}>{getStatusText()}</span>
    </div>
  );
};

export default BelvoStatusIndicator;
