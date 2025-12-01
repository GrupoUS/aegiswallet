/**
 * Termos de Uso / Terms of Service Page
 *
 * Termos de uso do AegisWallet em conformidade com a legislação brasileira.
 */

import { createFileRoute } from '@tanstack/react-router';
import { Building2, FileText, Mail, Scale } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

export const Route = createFileRoute('/termos-de-uso')({
	component: TermosDeUsoPage,
});

function TermosDeUsoPage() {
	return (
		<div className="container mx-auto max-w-4xl py-6 space-y-6">
			<div className="flex items-center gap-3">
				<Scale className="h-8 w-8 text-primary" />
				<div>
					<h1 className="text-2xl font-bold">Termos de Uso</h1>
					<p className="text-muted-foreground">Condições para utilização do AegisWallet</p>
				</div>
			</div>

			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<FileText className="h-5 w-5" />
						Aceitação dos Termos
					</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4 text-sm">
					<p>
						Ao acessar ou utilizar o AegisWallet, você concorda em cumprir e estar vinculado a estes
						Termos de Uso. Se você não concordar com qualquer parte destes termos, não poderá
						acessar o serviço.
					</p>
					<p>
						Estes termos são regidos pelas leis da República Federativa do Brasil, incluindo o
						Código de Defesa do Consumidor e a Lei Geral de Proteção de Dados (LGPD).
					</p>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>1. Descrição do Serviço</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4 text-sm">
					<p>O AegisWallet é um assistente financeiro autônomo que oferece:</p>
					<ul className="list-disc pl-5 space-y-2">
						<li>Gestão de finanças pessoais por comandos de voz</li>
						<li>Acompanhamento de contas bancárias e transações</li>
						<li>Controle de boletos e pagamentos PIX</li>
						<li>Análise e categorização automática de gastos</li>
						<li>Integração com instituições financeiras via Open Banking</li>
					</ul>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>2. Cadastro e Conta</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4 text-sm">
					<p>Para utilizar o serviço, você deve:</p>
					<ul className="list-disc pl-5 space-y-2">
						<li>Ter pelo menos 18 anos de idade</li>
						<li>Fornecer informações verdadeiras e atualizadas</li>
						<li>Manter a segurança de suas credenciais de acesso</li>
						<li>Notificar imediatamente sobre qualquer uso não autorizado</li>
					</ul>
					<p className="mt-4">
						Você é responsável por todas as atividades realizadas em sua conta.
					</p>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>3. Uso Adequado</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4 text-sm">
					<p>Você concorda em não utilizar o serviço para:</p>
					<ul className="list-disc pl-5 space-y-2">
						<li>Atividades ilegais ou fraudulentas</li>
						<li>Violar direitos de propriedade intelectual</li>
						<li>Transmitir vírus ou código malicioso</li>
						<li>Coletar dados de outros usuários sem autorização</li>
						<li>Interferir no funcionamento normal do serviço</li>
					</ul>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>4. Integrações Financeiras</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4 text-sm">
					<p>Ao conectar suas contas bancárias:</p>
					<ul className="list-disc pl-5 space-y-2">
						<li>Você autoriza o acesso somente leitura às suas informações financeiras</li>
						<li>As conexões são realizadas via Open Banking regulado pelo Banco Central</li>
						<li>Não realizamos transações em seu nome sem autorização explícita</li>
						<li>Você pode revogar o acesso a qualquer momento</li>
					</ul>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>5. Propriedade Intelectual</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4 text-sm">
					<p>Todo o conteúdo e tecnologia do AegisWallet, incluindo mas não limitado a:</p>
					<ul className="list-disc pl-5 space-y-2">
						<li>Código-fonte, algoritmos e modelos de IA</li>
						<li>Design visual, logos e marcas</li>
						<li>Textos, gráficos e interfaces</li>
					</ul>
					<p className="mt-4">
						São propriedade exclusiva do AegisWallet e protegidos pela legislação de propriedade
						intelectual brasileira e internacional.
					</p>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>6. Limitação de Responsabilidade</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4 text-sm">
					<p>O AegisWallet não se responsabiliza por:</p>
					<ul className="list-disc pl-5 space-y-2">
						<li>Decisões financeiras tomadas com base nas informações do serviço</li>
						<li>Interrupções temporárias do serviço por manutenção</li>
						<li>Falhas em serviços de terceiros (bancos, operadoras)</li>
						<li>Perdas decorrentes de acesso não autorizado à sua conta</li>
					</ul>
					<p className="mt-4">O serviço é oferecido "como está", sem garantias de qualquer tipo.</p>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>7. Cancelamento</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4 text-sm">
					<p>Você pode cancelar sua conta a qualquer momento através das configurações.</p>
					<p>
						Podemos suspender ou encerrar sua conta caso você viole estes termos, mediante
						notificação prévia quando possível.
					</p>
					<p>
						Após o cancelamento, seus dados serão tratados conforme nossa{' '}
						<a href="/privacidade" className="text-primary hover:underline">
							Política de Privacidade
						</a>
						.
					</p>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>8. Alterações nos Termos</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4 text-sm">
					<p>
						Podemos atualizar estes termos periodicamente. Você será notificado sobre alterações
						significativas por e-mail ou através do aplicativo.
					</p>
					<p>
						O uso continuado do serviço após as alterações constitui aceitação dos novos termos.
					</p>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Mail className="h-5 w-5" />
						9. Contato
					</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4 text-sm">
					<p>Para dúvidas sobre estes termos:</p>
					<div className="flex items-center gap-2">
						<Mail className="h-4 w-4 text-muted-foreground" />
						<span>contato@aegiswallet.com.br</span>
					</div>
					<div className="flex items-center gap-2">
						<Building2 className="h-4 w-4 text-muted-foreground" />
						<span>Suporte ao Cliente</span>
					</div>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>10. Foro</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4 text-sm">
					<p>
						Fica eleito o foro da Comarca de São Paulo, Estado de São Paulo, para dirimir quaisquer
						controvérsias decorrentes destes termos, com exclusão de qualquer outro, por mais
						privilegiado que seja.
					</p>
				</CardContent>
			</Card>

			<Separator />

			<p className="text-xs text-muted-foreground text-center">
				Última atualização: Dezembro de 2025
			</p>
		</div>
	);
}

export default TermosDeUsoPage;
