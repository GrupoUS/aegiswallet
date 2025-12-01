/**
 * Profile Settings Component
 *
 * Allows users to manage their personal information including:
 * - Profile photo
 * - Name, phone, CPF
 * - Regional preferences (language, timezone, currency)
 */

import { zodResolver } from '@hookform/resolvers/zod';
import { Calendar, Camera, Globe, Loader2, Mail, Phone, Save, Shield, User } from 'lucide-react';
import { useEffect, useId, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import { SettingsCard } from './settings-card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useAvatarUpload } from '@/hooks/useAvatarUpload';
import { useProfile } from '@/hooks/useProfile';
import { formatCPF, formatPhone, isValidCPF } from '@/lib/formatters/brazilianFormatters';

// =============================================================================
// Validation Schemas
// =============================================================================

const profileSchema = z.object({
	fullName: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').max(100, 'Nome muito longo'),
	phone: z
		.string()
		.optional()
		.refine(
			(val) => {
				if (!val) return true;
				const cleaned = val.replace(/\D/g, '');
				return cleaned.length === 10 || cleaned.length === 11;
			},
			{ message: 'Telefone inválido' },
		),
	cpf: z
		.string()
		.optional()
		.refine(
			(val) => {
				if (!val) return true;
				return isValidCPF(val);
			},
			{ message: 'CPF inválido' },
		),
	birthDate: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

// =============================================================================
// Constants
// =============================================================================

const LANGUAGES = [
	{ value: 'pt-BR', label: 'Português (Brasil)' },
	{ value: 'en-US', label: 'English (US)' },
	{ value: 'es-ES', label: 'Español' },
];

const TIMEZONES = [
	{ value: 'America/Sao_Paulo', label: 'Brasília (GMT-3)' },
	{ value: 'America/Manaus', label: 'Manaus (GMT-4)' },
	{ value: 'America/Belem', label: 'Belém (GMT-3)' },
	{ value: 'America/Fortaleza', label: 'Fortaleza (GMT-3)' },
	{ value: 'America/Recife', label: 'Recife (GMT-3)' },
	{ value: 'America/Cuiaba', label: 'Cuiabá (GMT-4)' },
	{ value: 'America/Porto_Velho', label: 'Porto Velho (GMT-4)' },
	{ value: 'America/Rio_Branco', label: 'Rio Branco (GMT-5)' },
];

const CURRENCIES = [
	{ value: 'BRL', label: 'Real (R$)' },
	{ value: 'USD', label: 'Dólar (US$)' },
	{ value: 'EUR', label: 'Euro (€)' },
];

// =============================================================================
// Loading Skeleton
// =============================================================================

function ProfileSettingsSkeleton() {
	return (
		<div className="space-y-6" data-testid="profile-settings-skeleton">
			<div className="rounded-xl border bg-card p-6">
				<div className="flex items-center gap-6">
					<Skeleton className="h-24 w-24 rounded-full" />
					<div className="space-y-2">
						<Skeleton className="h-9 w-32" />
						<Skeleton className="h-4 w-48" />
					</div>
				</div>
			</div>
			<div className="rounded-xl border bg-card p-6 space-y-4">
				<Skeleton className="h-6 w-48" />
				<div className="grid gap-4 md:grid-cols-2">
					<Skeleton className="h-10 w-full" />
					<Skeleton className="h-10 w-full" />
					<Skeleton className="h-10 w-full" />
					<Skeleton className="h-10 w-full" />
				</div>
			</div>
		</div>
	);
}

// =============================================================================
// Main Component
// =============================================================================

export function ProfileSettings() {
	const {
		profile,
		isLoading,
		updateProfile,
		updatePreferences,
		isUpdatingProfile,
		isUpdatingPreferences,
	} = useProfile();
	const { uploadAvatar, isUploading } = useAvatarUpload();
	const preferences = profile?.user_preferences?.[0];
	const fileInputRef = useRef<HTMLInputElement>(null);
	const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
	const languageId = useId();
	const timezoneId = useId();
	const currencyId = useId();

	const form = useForm<ProfileFormValues>({
		resolver: zodResolver(profileSchema),
		defaultValues: {
			fullName: '',
			phone: '',
			cpf: '',
			birthDate: '',
		},
	});

	useEffect(() => {
		if (profile) {
			form.reset({
				fullName: profile.full_name || '',
				phone: profile.phone ? formatPhone(profile.phone) : '',
				cpf: profile.cpf ? formatCPF(profile.cpf) : '',
				birthDate: profile.birth_date || '',
			});
		}
	}, [profile, form]);

	const onSubmit = (values: ProfileFormValues) => {
		const cleanedPhone = values.phone?.replace(/\D/g, '') || undefined;
		const cleanedCpf = values.cpf?.replace(/\D/g, '') || undefined;
		// API expects snake_case field names
		updateProfile({
			full_name: values.fullName,
			phone: cleanedPhone,
			cpf: cleanedCpf,
			birth_date: values.birthDate || undefined,
		});
	};

	const handlePreferenceChange = (key: string, value: string) => {
		updatePreferences({ [key]: value });
	};

	const handleAvatarClick = () => {
		fileInputRef.current?.click();
	};

	const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0];
		if (!file) return;

		if (file.size > 2 * 1024 * 1024) {
			toast.error('Imagem muito grande. Máximo 2MB.');
			return;
		}

		if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
			toast.error('Formato inválido. Use JPG, PNG ou WebP.');
			return;
		}

		// Show preview immediately
		const reader = new FileReader();
		reader.onload = (e) => {
			setAvatarPreview(e.target?.result as string);
		};
		reader.readAsDataURL(file);

		// Upload to API storage
		uploadAvatar(file);
	};

	const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const value = e.target.value;
		const cleaned = value.replace(/\D/g, '');
		if (cleaned.length <= 11) {
			form.setValue('phone', formatPhone(cleaned));
		}
	};

	const handleCPFChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const value = e.target.value;
		const cleaned = value.replace(/\D/g, '');
		if (cleaned.length <= 11) {
			form.setValue('cpf', formatCPF(cleaned));
		}
	};

	if (isLoading) {
		return <ProfileSettingsSkeleton />;
	}

	const avatarUrl = avatarPreview || profile?.profile_image_url;
	const initials =
		profile?.full_name
			?.split(' ')
			.map((n) => n[0])
			.join('')
			.substring(0, 2)
			.toUpperCase() || 'U';

	return (
		<div className="space-y-6" data-testid="profile-settings">
			{/* Avatar Section */}
			<SettingsCard title="Foto do Perfil" icon={Camera} testId="avatar-section">
				<div className="flex items-center gap-6">
					<Avatar
						className="h-24 w-24 cursor-pointer ring-2 ring-primary/20 hover:ring-primary/50 transition-all"
						onClick={handleAvatarClick}
					>
						<AvatarImage src={avatarUrl} alt={profile?.full_name || 'Avatar'} />
						<AvatarFallback className="text-2xl bg-primary/10 text-primary">
							{initials}
						</AvatarFallback>
					</Avatar>
					<div className="space-y-2">
						<input
							type="file"
							ref={fileInputRef}
							className="hidden"
							accept="image/jpeg,image/png,image/webp"
							onChange={handleFileChange}
							aria-label="Upload de foto de perfil"
						/>
						<Button variant="outline" size="sm" onClick={handleAvatarClick} disabled={isUploading}>
							{isUploading ? (
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
							) : (
								<Camera className="mr-2 h-4 w-4" />
							)}
							{isUploading ? 'Enviando...' : 'Alterar foto'}
						</Button>
						<p className="text-xs text-muted-foreground">JPG, PNG ou WebP. Máximo 2MB.</p>
					</div>
				</div>
			</SettingsCard>

			{/* Personal Information Form */}
			<SettingsCard
				title="Informações Pessoais"
				description="Atualize suas informações de perfil"
				icon={User}
				testId="personal-info-section"
			>
				<Form {...form}>
					<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
						<div className="grid gap-4 md:grid-cols-2">
							<FormField
								control={form.control}
								name="fullName"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Nome completo</FormLabel>
										<FormControl>
											<Input placeholder="Seu nome" {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>{' '}
							<FormItem>
								<FormLabel>Email</FormLabel>
								<div className="flex items-center gap-2">
									<Input
										value={profile?.email || ''}
										disabled
										className="bg-muted"
										aria-label="Email"
									/>
									<Badge variant="secondary" className="shrink-0">
										<Mail className="mr-1 h-3 w-3" />
										Verificado
									</Badge>
								</div>
								<FormDescription>Email não pode ser alterado por segurança.</FormDescription>
							</FormItem>
							<FormField
								control={form.control}
								name="phone"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Telefone</FormLabel>
										<FormControl>
											<div className="relative">
												<Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
												<Input
													placeholder="(11) 99999-9999"
													className="pl-10"
													{...field}
													onChange={handlePhoneChange}
												/>
											</div>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="cpf"
								render={({ field }) => (
									<FormItem>
										<FormLabel>
											CPF
											<Badge variant="outline" className="ml-2 text-xs">
												<Shield className="mr-1 h-3 w-3" />
												Protegido
											</Badge>
										</FormLabel>
										<FormControl>
											<Input placeholder="000.000.000-00" {...field} onChange={handleCPFChange} />
										</FormControl>
										<FormDescription>
											Seu CPF é criptografado e protegido pela LGPD.
										</FormDescription>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="birthDate"
								render={({ field }) => (
									<FormItem>
										<FormLabel>
											<Calendar className="mr-1 h-3 w-3 inline" />
											Data de Nascimento
										</FormLabel>
										<FormControl>
											<Input
												type="date"
												max={
													new Date(Date.now() - 18 * 365.25 * 24 * 60 * 60 * 1000)
														.toISOString()
														.split('T')[0]
												}
												{...field}
											/>
										</FormControl>
										<FormDescription>Você deve ter pelo menos 18 anos.</FormDescription>
										<FormMessage />
									</FormItem>
								)}
							/>
						</div>

						<Button
							type="submit"
							disabled={isUpdatingProfile || !form.formState.isDirty}
							className="mt-4"
						>
							{isUpdatingProfile ? (
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
							) : (
								<Save className="mr-2 h-4 w-4" />
							)}
							Salvar alterações
						</Button>
					</form>
				</Form>
			</SettingsCard>

			{/* Regional Preferences */}
			<SettingsCard
				title="Preferências Regionais"
				description="Configure idioma, fuso horário e moeda"
				icon={Globe}
				testId="regional-preferences-section"
			>
				<div className="grid gap-4 md:grid-cols-3">
					<div className="space-y-2">
						<label className="text-sm font-medium" htmlFor={languageId}>
							Idioma
						</label>
						<Select
							value={preferences?.language || 'pt-BR'}
							onValueChange={(value) => handlePreferenceChange('language', value)}
							disabled={isUpdatingPreferences}
						>
							<SelectTrigger id={languageId}>
								<SelectValue placeholder="Selecione o idioma" />
							</SelectTrigger>
							<SelectContent>
								{LANGUAGES.map((lang) => (
									<SelectItem key={lang.value} value={lang.value}>
										{lang.label}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>

					<div className="space-y-2">
						<label className="text-sm font-medium" htmlFor={timezoneId}>
							Fuso Horário
						</label>
						<Select
							value={preferences?.timezone || 'America/Sao_Paulo'}
							onValueChange={(value) => handlePreferenceChange('timezone', value)}
							disabled={isUpdatingPreferences}
						>
							<SelectTrigger id={timezoneId}>
								<SelectValue placeholder="Selecione o fuso" />
							</SelectTrigger>
							<SelectContent>
								{TIMEZONES.map((tz) => (
									<SelectItem key={tz.value} value={tz.value}>
										{tz.label}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>

					<div className="space-y-2">
						<label className="text-sm font-medium" htmlFor={currencyId}>
							Moeda
						</label>
						<Select
							value={preferences?.currency || 'BRL'}
							onValueChange={(value) => handlePreferenceChange('currency', value)}
							disabled={isUpdatingPreferences}
						>
							<SelectTrigger id={currencyId}>
								<SelectValue placeholder="Selecione a moeda" />
							</SelectTrigger>
							<SelectContent>
								{CURRENCIES.map((curr) => (
									<SelectItem key={curr.value} value={curr.value}>
										{curr.label}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
				</div>
			</SettingsCard>

			{/* Account Information */}
			<SettingsCard
				title="Informações da Conta"
				description="Detalhes sobre sua conta"
				icon={Calendar}
				testId="account-info-section"
			>
				<div className="grid gap-4 md:grid-cols-2">
					<div className="space-y-1">
						<p className="text-sm text-muted-foreground">Membro desde</p>
						<p className="font-medium">
							{profile?.created_at
								? new Date(profile.created_at).toLocaleDateString('pt-BR', {
										day: '2-digit',
										month: 'long',
										year: 'numeric',
									})
								: '-'}
						</p>
					</div>
					<div className="space-y-1">
						<p className="text-sm text-muted-foreground">Último acesso</p>
						<p className="font-medium">
							{profile?.last_login
								? new Date(profile.last_login).toLocaleDateString('pt-BR', {
										day: '2-digit',
										month: 'long',
										year: 'numeric',
										hour: '2-digit',
										minute: '2-digit',
									})
								: '-'}
						</p>
					</div>
					<div className="space-y-1">
						<p className="text-sm text-muted-foreground">Status</p>
						<Badge variant={profile?.is_active ? 'default' : 'secondary'}>
							{profile?.is_active ? 'Ativo' : 'Inativo'}
						</Badge>
					</div>
				</div>
			</SettingsCard>
		</div>
	);
}
