import {
	AlertTriangle,
	CheckCircle,
	Clock,
	LogOut,
	RefreshCw,
} from 'lucide-react';
import type React from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useSessionManager } from '@/hooks/useSessionManager';

export const SessionStatus: React.FC = () => {
	const {
		isActive,
		timeRemainingFormatted,
		timeRemaining,
		warningShown,
		extendSession,
		logout,
	} = useSessionManager();

	if (!isActive) {
		return (
			<Badge variant="destructive" className="flex items-center gap-2">
				<AlertTriangle className="h-3 w-3" />
				Sessão Inativa
			</Badge>
		);
	}

	const getWarningLevel = () => {
		if (timeRemaining < 60 * 1000) {
			return 'critical';
		} // Less than 1 minute
		if (timeRemaining < 5 * 60 * 1000) {
			return 'warning';
		} // Less than 5 minutes
		return 'normal';
	};

	const warningLevel = getWarningLevel();

	const getStatusColor = () => {
		switch (warningLevel) {
			case 'critical':
				return 'destructive';
			case 'warning':
				return 'secondary';
			default:
				return 'default';
		}
	};

	const getStatusIcon = () => {
		switch (warningLevel) {
			case 'critical':
				return <AlertTriangle className="h-3 w-3" />;
			case 'warning':
				return <Clock className="h-3 w-3" />;
			default:
				return <CheckCircle className="h-3 w-3" />;
		}
	};

	const getStatusText = () => {
		switch (warningLevel) {
			case 'critical':
				return 'Expirando';
			case 'warning':
				return 'Atenção';
			default:
				return 'Ativa';
		}
	};

	return (
		<div className="flex items-center gap-3">
			{/* Session Status Badge */}
			<Badge variant={getStatusColor()} className="flex items-center gap-2">
				{getStatusIcon()}
				{getStatusText()}
			</Badge>

			{/* Time Remaining */}
			<div className="flex items-center gap-1 text-gray-600 text-sm">
				<Clock className="h-4 w-4" />
				<span
					className={
						warningLevel === 'critical' ? 'font-semibold text-red-600' : ''
					}
				>
					{timeRemainingFormatted}
				</span>
			</div>

			{/* Warning Indicator */}
			{warningShown && (
				<div className="flex items-center gap-1 text-sm text-yellow-600">
					<AlertTriangle className="h-4 w-4" />
					<span>Aviso de expiração enviado</span>
				</div>
			)}

			{/* Action Buttons */}
			<div className="flex items-center gap-2">
				{warningLevel !== 'normal' && (
					<Button
						size="sm"
						variant="outline"
						onClick={extendSession}
						className="flex items-center gap-1"
					>
						<RefreshCw className="h-3 w-3" />
						Estender
					</Button>
				)}

				<Button
					size="sm"
					variant="ghost"
					onClick={logout}
					className="flex items-center gap-1 text-gray-600"
				>
					<LogOut className="h-3 w-3" />
					Sair
				</Button>
			</div>
		</div>
	);
};

// Compact version for header/sidebar
export const SessionStatusCompact: React.FC = () => {
	const { isActive, timeRemainingFormatted, timeRemaining, extendSession } =
		useSessionManager();

	if (!isActive) {
		return null;
	}

	const isWarning = timeRemaining < 5 * 60 * 1000; // Less than 5 minutes
	const isCritical = timeRemaining < 60 * 1000; // Less than 1 minute

	return (
		<div className="flex items-center gap-2">
			<Clock
				className={`h-4 w-4 ${
					isCritical
						? 'text-red-500'
						: isWarning
							? 'text-yellow-500'
							: 'text-gray-500'
				}`}
			/>

			<span
				className={`font-medium text-sm ${
					isCritical
						? 'text-red-600'
						: isWarning
							? 'text-yellow-600'
							: 'text-gray-600'
				}`}
			>
				{timeRemainingFormatted}
			</span>

			{(isWarning || isCritical) && (
				<Button
					size="sm"
					variant="ghost"
					onClick={extendSession}
					className="h-6 px-2 text-xs"
				>
					Estender
				</Button>
			)}
		</div>
	);
};

// Session status for mobile/responsive layouts
export const SessionStatusMobile: React.FC = () => {
	const {
		isActive,
		timeRemainingFormatted,
		timeRemaining,
		extendSession,
		logout,
	} = useSessionManager();

	if (!isActive) {
		return null;
	}

	const isWarning = timeRemaining < 5 * 60 * 1000;

	return (
		<div className="flex flex-col gap-2 rounded-lg bg-gray-50 p-3">
			<div className="flex items-center justify-between">
				<span className="font-medium text-gray-700 text-sm">
					Status da Sessão
				</span>
				<Badge variant={isActive ? 'default' : 'destructive'}>
					{isActive ? 'Ativa' : 'Inativa'}
				</Badge>
			</div>

			<div className="flex items-center justify-between">
				<span className="text-gray-600 text-sm">Tempo restante</span>
				<span
					className={`font-medium text-sm ${
						timeRemaining < 60 * 1000
							? 'text-red-600'
							: timeRemaining < 5 * 60 * 1000
								? 'text-yellow-600'
								: 'text-gray-700'
					}`}
				>
					{timeRemainingFormatted}
				</span>
			</div>

			{isWarning && (
				<div className="flex items-center gap-2 text-sm text-yellow-600">
					<AlertTriangle className="h-4 w-4" />
					<span>Sua sessão expirará em breve</span>
				</div>
			)}

			<div className="flex gap-2">
				{isWarning && (
					<Button
						size="sm"
						variant="outline"
						onClick={extendSession}
						className="flex-1"
					>
						Estender Sessão
					</Button>
				)}

				<Button size="sm" variant="ghost" onClick={logout} className="flex-1">
					Sair
				</Button>
			</div>
		</div>
	);
};
