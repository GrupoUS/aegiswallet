/**
 * Política de Privacidade / Privacy Policy Page
 *
 * LGPD compliant privacy policy page for AegisWallet.
 */

import { createFileRoute } from '@tanstack/react-router';
import { Building2, FileText, Mail, Shield } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

export const Route = createFileRoute('/privacidade')({
	component: PrivacidadePage,
});

function PrivacidadePage() {
	return (
		<div className="container mx-auto max-w-4xl py-6 space-y-6">
			<div className="flex items-center gap-3">
				<Shield className="h-8 w-8 text-primary" />
				<div>
					<h1 className="text-2xl font-bold">Política de Privacidade</h1>
					<p className="text-muted-foreground">
						Em conformidade com a Lei Geral de Proteção de Dados (LGPD)
					</p>
				</div>
			</div>

			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<FileText className="h-5 w-5" />
						Sobre esta Política
					</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4 text-sm">
					<p>
						A AegisWallet está comprometida com a proteção da privacidade e dos dados pessoais de
						seus usuários, em conformidade com a Lei nº 13.709/2018 (Lei Geral de Proteção de Dados
						- LGPD).
					</p>
					<p>
						Esta política descreve como coletamos, usamos, armazenamos e protegemos suas informações
						pessoais ao utilizar nosso aplicativo de gestão financeira.
					</p>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>1. Dados que Coletamos</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4 text-sm">
					<p>
						<strong>Dados de identificação:</strong> Nome, e-mail, CPF (quando necessário).
					</p>
					<p>
						<strong>Dados financeiros:</strong> Informações de contas bancárias, transações, saldos.
					</p>
					<p>
						<strong>Dados de uso:</strong> Interações com o aplicativo, comandos de voz (quando
						habilitado).
					</p>
					<p>
						<strong>Dados técnicos:</strong> IP, tipo de dispositivo, sistema operacional.
					</p>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>2. Como Utilizamos seus Dados</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4 text-sm">
					<ul className="list-disc pl-5 space-y-2">
						<li>Fornecer e melhorar nossos serviços de gestão financeira</li>
						<li>Processar transações e pagamentos</li>
						<li>Personalizar sua experiência no aplicativo</li>
						<li>Enviar notificações sobre suas contas e transações</li>
						<li>Cumprir obrigações legais e regulatórias</li>
						<li>Prevenir fraudes e garantir a segurança</li>
					</ul>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>3. Seus Direitos (LGPD)</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4 text-sm">
					<p>Você tem direito a:</p>
					<ul className="list-disc pl-5 space-y-2">
						<li>
							<strong>Acesso:</strong> Solicitar uma cópia de seus dados pessoais
						</li>
						<li>
							<strong>Correção:</strong> Solicitar a correção de dados incorretos
						</li>
						<li>
							<strong>Exclusão:</strong> Solicitar a exclusão de seus dados
						</li>
						<li>
							<strong>Portabilidade:</strong> Exportar seus dados em formato portátil
						</li>
						<li>
							<strong>Revogação:</strong> Revogar consentimentos previamente concedidos
						</li>
						<li>
							<strong>Oposição:</strong> Opor-se a determinados tratamentos de dados
						</li>
					</ul>
					<p className="mt-4">
						Para exercer esses direitos, acesse{' '}
						<a href="/configuracoes" className="text-primary hover:underline">
							Configurações → Privacidade
						</a>{' '}
						ou entre em contato conosco.
					</p>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>4. Segurança dos Dados</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4 text-sm">
					<p>Implementamos medidas técnicas e organizacionais para proteger seus dados:</p>
					<ul className="list-disc pl-5 space-y-2">
						<li>Criptografia de dados em trânsito e em repouso</li>
						<li>Controle de acesso baseado em funções</li>
						<li>Monitoramento contínuo de segurança</li>
						<li>Auditorias regulares de segurança</li>
						<li>Treinamento de funcionários em proteção de dados</li>
					</ul>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>5. Retenção de Dados</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4 text-sm">
					<p>
						Mantemos seus dados apenas pelo tempo necessário para cumprir as finalidades para as
						quais foram coletados, incluindo obrigações legais e regulatórias.
					</p>
					<p>
						Dados financeiros podem ser retidos por períodos mais longos conforme exigido pela
						legislação fiscal e bancária brasileira.
					</p>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Mail className="h-5 w-5" />
						6. Contato
					</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4 text-sm">
					<p>Para questões sobre privacidade e proteção de dados:</p>
					<div className="flex items-center gap-2">
						<Mail className="h-4 w-4 text-muted-foreground" />
						<span>privacidade@aegiswallet.com.br</span>
					</div>
					<div className="flex items-center gap-2">
						<Building2 className="h-4 w-4 text-muted-foreground" />
						<span>Encarregado de Proteção de Dados (DPO)</span>
					</div>
				</CardContent>
			</Card>

			<Separator />

			<p className="text-xs text-muted-foreground text-center">
				Última atualização: Janeiro de 2025
			</p>
		</div>
	);
}

export default PrivacidadePage;
