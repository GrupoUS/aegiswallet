import { createLazyFileRoute, Link } from '@tanstack/react-router';
import { ArrowRight, CheckCircle, Settings } from 'lucide-react';
import { Helmet } from 'react-helmet-async';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from '@/components/ui/card';
import { useSubscription } from '@/hooks/billing';

export const Route = createLazyFileRoute('/billing/success')({
	component: SuccessPage,
});

function SuccessPage() {
	const { data: subscription } = useSubscription();

	return (
		<>
			<Helmet>
				<title>Pagamento Confirmado | AegisWallet</title>
			</Helmet>

			<div className="container mx-auto py-16 px-4">
				<div className="max-w-2xl mx-auto">
					<Card>
						<CardHeader className="text-center">
							<div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
								<CheckCircle className="w-10 h-10 text-green-600" />
							</div>
							<CardTitle className="text-2xl text-green-700">
								Pagamento Confirmado!
							</CardTitle>
							<CardDescription>
								Seu plano foi atualizado com sucesso
							</CardDescription>
						</CardHeader>

						<CardContent className="space-y-6">
							{subscription?.plan && (
								<div className="bg-muted/50 p-6 rounded-lg">
									<div className="flex items-center justify-between mb-4">
										<h3 className="text-lg font-semibold">Seu Plano Atual</h3>
										<Badge variant="default">{subscription.plan.name}</Badge>
									</div>

									{subscription.plan.priceCents > 0 && (
										<div className="mb-4">
											<span className="text-2xl font-bold">
												{new Intl.NumberFormat('pt-BR', {
													style: 'currency',
													currency: subscription.plan.currency,
												}).format(subscription.plan.priceCents / 100)}
											</span>
											<span className="text-muted-foreground">/mês</span>
										</div>
									)}

									{subscription.plan.features &&
										subscription.plan.features.length > 0 && (
											<div>
												<h4 className="font-medium mb-2">
													Recursos Incluídos:
												</h4>
												<ul className="space-y-2">
													{subscription.plan.features.map((feature) => (
														<li
															key={feature.replace(/\s+/g, '-').toLowerCase()}
															className="flex items-center gap-2 text-sm"
														>
															<CheckCircle className="h-4 w-4 text-green-600" />
															{feature}
														</li>
													))}
												</ul>
											</div>
										)}
								</div>
							)}

							<div className="space-y-4">
								<h3 className="font-semibold">Próximos Passos</h3>
								<div className="space-y-3">
									<div className="flex items-start gap-3">
										<div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
											<span className="text-primary font-semibold text-sm">
												1
											</span>
										</div>
										<div>
											<p className="font-medium">Explore seus novos recursos</p>
											<p className="text-sm text-muted-foreground">
												Aproveite todas as funcionalidades do seu novo plano
											</p>
										</div>
									</div>

									<div className="flex items-start gap-3">
										<div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
											<span className="text-primary font-semibold text-sm">
												2
											</span>
										</div>
										<div>
											<p className="font-medium">Configure suas preferências</p>
											<p className="text-sm text-muted-foreground">
												Personalize o AegisWallet according to suas necessidades
											</p>
										</div>
									</div>

									<div className="flex items-start gap-3">
										<div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
											<span className="text-primary font-semibold text-sm">
												3
											</span>
										</div>
										<div>
											<p className="font-medium">Gerencie sua assinatura</p>
											<p className="text-sm text-muted-foreground">
												Acesse as configurações para gerenciar seu plano
											</p>
										</div>
									</div>
								</div>
							</div>
						</CardContent>

						<CardFooter className="flex flex-col sm:flex-row gap-3">
							<Button asChild className="flex-1">
								<Link to="/dashboard">
									<ArrowRight className="w-4 h-4 mr-2" />
									Ir para Dashboard
								</Link>
							</Button>
							<Button asChild variant="outline" className="flex-1">
								<Link to="/settings">
									<Settings className="w-4 h-4 mr-2" />
									Configurações
								</Link>
							</Button>
						</CardFooter>
					</Card>
				</div>
			</div>
		</>
	);
}
