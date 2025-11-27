/**
 * Accessibility Settings Component
 *
 * Configure accessibility preferences including:
 * - Theme (light/dark/system)
 * - High contrast
 * - Large text
 * - Screen reader optimization
 * - Reduced motion
 */

import {
	Contrast,
	Eye,
	Keyboard,
	Monitor,
	Moon,
	MoveHorizontal,
	Sun,
	Type,
} from 'lucide-react';

import { SettingsCard } from './settings-card';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { useProfile } from '@/hooks/useProfile';

// =============================================================================
// Loading Skeleton
// =============================================================================

function AccessibilitySettingsSkeleton() {
	return (
		<div className="space-y-6" data-testid="accessibility-settings-skeleton">
			<div className="rounded-xl border bg-card p-6 space-y-4">
				<Skeleton className="h-6 w-32" />
				<div className="flex gap-4">
					<Skeleton className="h-24 w-24" />
					<Skeleton className="h-24 w-24" />
					<Skeleton className="h-24 w-24" />
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
// Theme Preview Card
// =============================================================================

interface ThemePreviewProps {
	theme: 'light' | 'dark' | 'system';
	isSelected: boolean;
	onSelect: () => void;
	disabled?: boolean;
}

function ThemePreview({
	theme,
	isSelected,
	onSelect,
	disabled,
}: ThemePreviewProps) {
	const themes = {
		light: {
			label: 'Claro',
			icon: Sun,
			bg: 'bg-white',
			text: 'text-gray-900',
			border: 'border-gray-200',
		},
		dark: {
			label: 'Escuro',
			icon: Moon,
			bg: 'bg-gray-900',
			text: 'text-white',
			border: 'border-gray-700',
		},
		system: {
			label: 'Sistema',
			icon: Monitor,
			bg: 'bg-gradient-to-r from-white to-gray-900',
			text: 'text-gray-600',
			border: 'border-gray-300',
		},
	};

	const config = themes[theme];
	const Icon = config.icon;

	return (
		<button
			type="button"
			onClick={onSelect}
			disabled={disabled}
			className={`
				relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all
				${isSelected ? 'border-primary ring-2 ring-primary/20' : 'border-muted hover:border-muted-foreground/50'}
				${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
			`}
			aria-label={`Tema ${config.label}`}
			aria-pressed={isSelected}
		>
			<div
				className={`w-16 h-12 rounded-lg ${config.bg} ${config.border} border shadow-sm flex items-center justify-center`}
			>
				<Icon
					className={`h-5 w-5 ${theme === 'dark' ? 'text-white' : theme === 'light' ? 'text-gray-700' : 'text-gray-500'}`}
				/>
			</div>
			<span className="text-sm font-medium">{config.label}</span>
			{isSelected && (
				<div className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-primary flex items-center justify-center">
					<svg
						className="h-2.5 w-2.5 text-primary-foreground"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
						role="img"
						aria-hidden="true"
					>
						<title>Selecionado</title>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={3}
							d="M5 13l4 4L19 7"
						/>
					</svg>
				</div>
			)}
		</button>
	);
}

// =============================================================================
// Main Component
// =============================================================================

export function AccessibilitySettings() {
	const { profile, isLoading, updatePreferences, isUpdatingPreferences } =
		useProfile();
	const preferences = profile?.user_preferences?.[0];

	const handleSwitchChange = (key: string, value: boolean) => {
		updatePreferences({ [key]: value });
	};

	const handleThemeChange = (theme: string) => {
		updatePreferences({ theme });
	};

	const handleFontSizeChange = (value: number[]) => {
		updatePreferences({ font_size: value[0] });
	};

	if (isLoading) {
		return <AccessibilitySettingsSkeleton />;
	}

	const currentTheme =
		(preferences?.theme as 'light' | 'dark' | 'system') || 'system';
	const fontSize = (preferences as { font_size?: number })?.font_size ?? 16;

	return (
		<div className="space-y-6" data-testid="accessibility-settings">
			{/* Theme Selection */}
			<SettingsCard
				title="Tema"
				description="Escolha a aparência do aplicativo"
				icon={Sun}
				testId="theme-section"
			>
				<div className="flex flex-wrap gap-4 justify-center sm:justify-start">
					<ThemePreview
						theme="light"
						isSelected={currentTheme === 'light'}
						onSelect={() => handleThemeChange('light')}
						disabled={isUpdatingPreferences}
					/>
					<ThemePreview
						theme="dark"
						isSelected={currentTheme === 'dark'}
						onSelect={() => handleThemeChange('dark')}
						disabled={isUpdatingPreferences}
					/>
					<ThemePreview
						theme="system"
						isSelected={currentTheme === 'system'}
						onSelect={() => handleThemeChange('system')}
						disabled={isUpdatingPreferences}
					/>
				</div>
			</SettingsCard>

			{/* Visual Settings */}
			<SettingsCard
				title="Configurações Visuais"
				description="Ajuste a aparência para melhor legibilidade"
				icon={Eye}
				testId="visual-section"
			>
				<div className="space-y-6">
					{/* High Contrast */}
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-3">
							<div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
								<Contrast className="h-5 w-5" />
							</div>
							<div className="space-y-0.5">
								<Label className="text-base">Alto contraste</Label>
								<p className="text-sm text-muted-foreground">
									Aumenta o contraste entre elementos
								</p>
							</div>
						</div>
						<Switch
							checked={preferences?.accessibility_high_contrast ?? false}
							onCheckedChange={(checked) =>
								handleSwitchChange('accessibility_high_contrast', checked)
							}
							disabled={isUpdatingPreferences}
							aria-label="Alto contraste"
						/>
					</div>

					<Separator />

					{/* Large Text */}
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-3">
							<div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
								<Type className="h-5 w-5" />
							</div>
							<div className="space-y-0.5">
								<Label className="text-base">Texto ampliado</Label>
								<p className="text-sm text-muted-foreground">
									Aumenta o tamanho do texto em todo o app
								</p>
							</div>
						</div>
						<Switch
							checked={preferences?.accessibility_large_text ?? false}
							onCheckedChange={(checked) =>
								handleSwitchChange('accessibility_large_text', checked)
							}
							disabled={isUpdatingPreferences}
							aria-label="Texto ampliado"
						/>
					</div>

					<Separator />

					{/* Font Size Slider */}
					<div className="space-y-4">
						<div className="flex items-center justify-between">
							<Label className="text-base">
								Tamanho da fonte: {fontSize}px
							</Label>
						</div>
						<Slider
							value={[fontSize]}
							min={12}
							max={24}
							step={1}
							onValueCommit={handleFontSizeChange}
							disabled={isUpdatingPreferences}
							className="py-4"
							aria-label="Tamanho da fonte"
						/>
						<div className="flex justify-between text-xs text-muted-foreground">
							<span style={{ fontSize: '12px' }}>Aa</span>
							<span style={{ fontSize: '18px' }}>Aa</span>
							<span style={{ fontSize: '24px' }}>Aa</span>
						</div>
					</div>
				</div>
			</SettingsCard>

			{/* Assistive Technologies */}
			<SettingsCard
				title="Tecnologias Assistivas"
				description="Otimizações para leitores de tela e navegação"
				icon={Monitor}
				testId="assistive-section"
			>
				<div className="space-y-6">
					{/* Screen Reader */}
					<div className="flex items-center justify-between">
						<div className="space-y-0.5">
							<Label className="text-base">Otimizar para leitor de tela</Label>
							<p className="text-sm text-muted-foreground">
								Melhora a compatibilidade com NVDA, JAWS e VoiceOver
							</p>
						</div>
						<Switch
							checked={preferences?.accessibility_screen_reader ?? false}
							onCheckedChange={(checked) =>
								handleSwitchChange('accessibility_screen_reader', checked)
							}
							disabled={isUpdatingPreferences}
							aria-label="Otimizar para leitor de tela"
						/>
					</div>

					<Separator />

					{/* Reduced Motion */}
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-3">
							<div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
								<MoveHorizontal className="h-5 w-5" />
							</div>
							<div className="space-y-0.5">
								<Label className="text-base">Reduzir animações</Label>
								<p className="text-sm text-muted-foreground">
									Minimiza movimentos e transições
								</p>
							</div>
						</div>
						<Switch
							checked={false}
							onCheckedChange={(checked) =>
								handleSwitchChange('reduce_motion', checked)
							}
							disabled={isUpdatingPreferences}
							aria-label="Reduzir animações"
						/>
					</div>

					<Separator />

					{/* Keyboard Shortcuts */}
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-3">
							<div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
								<Keyboard className="h-5 w-5" />
							</div>
							<div className="space-y-0.5">
								<Label className="text-base">Atalhos de teclado</Label>
								<p className="text-sm text-muted-foreground">
									Navegação rápida usando o teclado
								</p>
							</div>
						</div>
						<Switch
							checked={true}
							onCheckedChange={(checked) =>
								handleSwitchChange('keyboard_shortcuts', checked)
							}
							disabled={isUpdatingPreferences}
							aria-label="Atalhos de teclado"
						/>
					</div>
				</div>
			</SettingsCard>

			{/* Preview Card */}
			<SettingsCard
				title="Visualização"
				description="Veja como as configurações afetam a aparência"
				icon={Eye}
				testId="preview-section"
			>
				<div className="p-4 rounded-lg border bg-muted/30">
					<p className="text-lg font-semibold mb-2">Exemplo de texto</p>
					<p className="text-base text-muted-foreground">
						Este é um exemplo de como o texto aparecerá com suas configurações
						atuais. O AegisWallet foi projetado para ser acessível a todos os
						usuários.
					</p>
					<div className="mt-4 flex gap-2">
						<div className="h-8 w-8 rounded bg-primary" />
						<div className="h-8 w-8 rounded bg-secondary" />
						<div className="h-8 w-8 rounded bg-accent" />
						<div className="h-8 w-8 rounded bg-muted" />
					</div>
				</div>
			</SettingsCard>
		</div>
	);
}
