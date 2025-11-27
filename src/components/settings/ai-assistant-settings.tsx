/**
 * AI Assistant Settings Component
 *
 * Configures AI chat preferences including:
 * - Model selection
 * - Voice commands
 * - Autonomy level
 * - Advanced settings
 */

import {
	Bot,
	Lightbulb,
	Mic,
	Settings2,
	Sliders,
	Sparkles,
	Trash2,
	Zap,
} from 'lucide-react';
import { useId } from 'react';

import { SettingsCard } from './settings-card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { MODEL_OPTIONS } from '@/features/ai-chat/config/models';
import { useProfile } from '@/hooks/useProfile';

// =============================================================================
// Loading Skeleton
// =============================================================================

function AISettingsSkeleton() {
	return (
		<div className="space-y-6" data-testid="ai-settings-skeleton">
			<div className="rounded-xl border bg-card p-6 space-y-4">
				<Skeleton className="h-6 w-32" />
				<div className="space-y-3">
					<Skeleton className="h-20 w-full" />
					<Skeleton className="h-20 w-full" />
					<Skeleton className="h-20 w-full" />
				</div>
			</div>
			<div className="rounded-xl border bg-card p-6 space-y-4">
				<Skeleton className="h-6 w-48" />
				<Skeleton className="h-10 w-full" />
				<Skeleton className="h-10 w-full" />
			</div>
		</div>
	);
}

// =============================================================================
// Helper Functions
// =============================================================================

function getSpeedBadge(speed: string) {
	switch (speed) {
		case 'fastest':
			return { icon: '⚡', label: 'Mais Rápido', variant: 'default' as const };
		case 'fast':
			return { icon: '🚀', label: 'Rápido', variant: 'secondary' as const };
		case 'balanced':
			return { icon: '⚖️', label: 'Equilibrado', variant: 'outline' as const };
		default:
			return { icon: '🔄', label: 'Normal', variant: 'outline' as const };
	}
}

function getCostBadge(cost: string) {
	switch (cost) {
		case 'lowest':
			return { icon: '💰', label: 'Mais Econômico' };
		case 'low':
			return { icon: '💵', label: 'Econômico' };
		case 'medium':
			return { icon: '💎', label: 'Premium' };
		default:
			return { icon: '💳', label: 'Padrão' };
	}
}

function getAutonomyLabel(level: number): string {
	if (level <= 60) return 'Sempre pedir confirmação';
	if (level <= 75) return 'Confirmar transações importantes';
	if (level <= 85) return 'Confirmar apenas grandes valores';
	return 'Totalmente autônomo';
}

// =============================================================================
// Main Component
// =============================================================================

export function AIAssistantSettings() {
	const { profile, isLoading, updatePreferences, isUpdatingPreferences } =
		useProfile();
	const preferences = profile?.user_preferences?.[0];
	const systemPromptId = useId();

	const handleSwitchChange = (key: string, value: boolean) => {
		updatePreferences({ [key]: value });
	};

	const handleAutonomyChange = (value: number[]) => {
		updatePreferences({ autonomy_level: value[0] });
	};

	const handleModelChange = (modelId: string) => {
		updatePreferences({ ai_model: modelId });
	};

	const handleClearHistory = () => {
		if (
			window.confirm(
				'Tem certeza que deseja limpar todo o histórico de conversas? Esta ação não pode ser desfeita.',
			)
		) {
			// TODO: Implement clear history
			updatePreferences({ chat_history_cleared_at: new Date().toISOString() });
		}
	};

	if (isLoading) {
		return <AISettingsSkeleton />;
	}

	const currentModel =
		(preferences as { ai_model?: string })?.ai_model || 'gemini-2.0-flash-lite';
	const autonomyLevel = preferences?.autonomy_level ?? 50;

	return (
		<div className="space-y-6" data-testid="ai-assistant-settings">
			{/* Model Selection */}
			<SettingsCard
				title="Modelo de IA"
				description="Escolha o modelo que melhor atende suas necessidades"
				icon={Sparkles}
				testId="model-section"
			>
				<RadioGroup
					value={currentModel}
					onValueChange={handleModelChange}
					className="space-y-3"
					disabled={isUpdatingPreferences}
				>
					{MODEL_OPTIONS.map((model) => {
						const speedBadge = getSpeedBadge(model.speed);
						const costBadge = getCostBadge(model.cost);
						const isSelected = currentModel === model.id;

						return (
							<div
								key={model.id}
								className={`
									flex items-center space-x-4 rounded-lg border p-4
									transition-all duration-200 cursor-pointer
									${isSelected ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'hover:bg-accent/50'}
								`}
							>
								<RadioGroupItem value={model.id} id={model.id} />
								<Label htmlFor={model.id} className="flex-1 cursor-pointer">
									<div className="flex items-center gap-2 mb-1">
										<span className="font-medium">{model.name}</span>
										<Badge variant={speedBadge.variant} className="text-xs">
											{speedBadge.icon} {speedBadge.label}
										</Badge>
									</div>
									<p className="text-sm text-muted-foreground">
										{model.description}
									</p>
								</Label>
								<div className="text-xs text-muted-foreground">
									{costBadge.icon} {costBadge.label}
								</div>
							</div>
						);
					})}
				</RadioGroup>
			</SettingsCard>

			{/* Voice Settings */}
			<SettingsCard
				title="Comandos de Voz"
				description="Configure como interagir com o assistente usando voz"
				icon={Mic}
				testId="voice-section"
			>
				<div className="space-y-6">
					<div className="flex items-center justify-between">
						<div className="space-y-0.5">
							<Label className="text-base">Ativar comandos de voz</Label>
							<p className="text-sm text-muted-foreground">
								Controle o assistente usando sua voz
							</p>
						</div>
						<Switch
							checked={preferences?.voice_commands_enabled ?? true}
							onCheckedChange={(checked) =>
								handleSwitchChange('voice_commands_enabled', checked)
							}
							disabled={isUpdatingPreferences}
							aria-label="Ativar comandos de voz"
						/>
					</div>

					<Separator />

					<div className="flex items-center justify-between">
						<div className="space-y-0.5">
							<Label className="text-base">Feedback por voz (TTS)</Label>
							<p className="text-sm text-muted-foreground">
								O assistente responde usando síntese de voz
							</p>
						</div>
						<Switch
							checked={preferences?.voice_feedback ?? false}
							onCheckedChange={(checked) =>
								handleSwitchChange('voice_feedback', checked)
							}
							disabled={isUpdatingPreferences}
							aria-label="Ativar feedback por voz"
						/>
					</div>
				</div>
			</SettingsCard>

			{/* Autonomy Level */}
			<SettingsCard
				title="Nível de Autonomia"
				description="Controle quanto o assistente pode agir sem sua confirmação"
				icon={Sliders}
				testId="autonomy-section"
			>
				<div className="space-y-6">
					<div className="space-y-4">
						<div className="flex items-center justify-between">
							<Label className="text-base">Autonomia: {autonomyLevel}%</Label>
							<Badge variant="outline" className="ml-2">
								{getAutonomyLabel(autonomyLevel)}
							</Badge>
						</div>
						<Slider
							value={[autonomyLevel]}
							min={50}
							max={95}
							step={5}
							onValueCommit={handleAutonomyChange}
							disabled={isUpdatingPreferences}
							className="py-4"
							aria-label="Nível de autonomia"
						/>
						<div className="flex justify-between text-xs text-muted-foreground">
							<span>50% - Mais controle</span>
							<span>95% - Mais automação</span>
						</div>
					</div>

					<Separator />

					<div className="grid gap-4 sm:grid-cols-2">
						<div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
							<div className="flex items-center gap-2">
								<Zap className="h-4 w-4 text-primary" />
								<Label className="text-sm">Categorização automática</Label>
							</div>
							<Switch
								checked={
									(preferences as { auto_categorize?: boolean })
										?.auto_categorize ?? true
								}
								onCheckedChange={(checked) =>
									handleSwitchChange('auto_categorize', checked)
								}
								disabled={isUpdatingPreferences}
								aria-label="Categorização automática"
							/>
						</div>

						<div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
							<div className="flex items-center gap-2">
								<Bot className="h-4 w-4 text-primary" />
								<Label className="text-sm">Alertas de orçamento</Label>
							</div>
							<Switch
								checked={
									(preferences as { budget_alerts?: boolean })?.budget_alerts ??
									true
								}
								onCheckedChange={(checked) =>
									handleSwitchChange('budget_alerts', checked)
								}
								disabled={isUpdatingPreferences}
								aria-label="Alertas de orçamento"
							/>
						</div>
					</div>
				</div>
			</SettingsCard>

			{/* Advanced Settings */}
			<SettingsCard
				title="Configurações Avançadas"
				description="Opções adicionais para usuários avançados"
				icon={Settings2}
				testId="advanced-section"
			>
				<div className="space-y-6">
					<div className="flex items-center justify-between">
						<div className="space-y-0.5">
							<div className="flex items-center gap-2">
								<Lightbulb className="h-4 w-4 text-amber-500" />
								<Label className="text-base">Mostrar raciocínio do AI</Label>
							</div>
							<p className="text-sm text-muted-foreground">
								Exibe o processo de pensamento do assistente
							</p>
						</div>
						<Switch
							checked={
								(preferences as { show_reasoning?: boolean })?.show_reasoning ??
								false
							}
							onCheckedChange={(checked) =>
								handleSwitchChange('show_reasoning', checked)
							}
							disabled={isUpdatingPreferences}
							aria-label="Mostrar raciocínio"
						/>
					</div>

					<Separator />

					<div className="space-y-2">
						<Label htmlFor={systemPromptId}>
							Prompt personalizado (opcional)
						</Label>
						<Textarea
							id={systemPromptId}
							placeholder="Ex: Seja mais formal nas respostas, use terminologia financeira..."
							className="min-h-[100px] resize-none"
							disabled={isUpdatingPreferences}
						/>
						<p className="text-xs text-muted-foreground">
							Personalize o comportamento do assistente com instruções
							específicas.
						</p>
					</div>

					<Separator />

					<div className="flex items-center justify-between p-4 rounded-lg border border-destructive/30 bg-destructive/5">
						<div className="space-y-0.5">
							<Label className="text-base text-destructive">
								Limpar histórico
							</Label>
							<p className="text-sm text-muted-foreground">
								Remove todas as conversas anteriores
							</p>
						</div>
						<Button
							variant="destructive"
							size="sm"
							onClick={handleClearHistory}
							disabled={isUpdatingPreferences}
						>
							<Trash2 className="mr-2 h-4 w-4" />
							Limpar
						</Button>
					</div>
				</div>
			</SettingsCard>
		</div>
	);
}
