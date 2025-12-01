import { createLazyFileRoute, Link } from '@tanstack/react-router';
import { XCircle } from 'lucide-react';
import { Helmet } from 'react-helmet-async';

import { Button } from '@/components/ui/button';
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from '@/components/ui/card';

export const Route = createLazyFileRoute('/billing/cancel')({
	component: CancelPage,
});

function CancelPage() {
	return (
		<>
			<Helmet>
				<title>Checkout Cancelado | AegisWallet</title>
			</Helmet>

			<div className="container mx-auto py-16 px-4">
				<div className="max-w-md mx-auto">
					<Card>
						<CardHeader className="text-center">
							<div className="mx-auto w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mb-4">
								<XCircle className="w-10 h-10 text-amber-600" />
							</div>
							<CardTitle className="text-2xl">Checkout Cancelado</CardTitle>
							<CardDescription>Você cancelou o processo de assinatura</CardDescription>
						</CardHeader>

						<CardContent className="space-y-4">
							<p className="text-sm text-muted-foreground text-center">
								Não se preocupe! Você pode voltar e escolher um plano quando estiver pronto.
							</p>

							<div className="bg-muted p-4 rounded-lg">
								<p className="text-sm font-medium mb-2">Ainda tem dúvidas?</p>
								<ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
									<li>Veja nossos planos disponíveis</li>
									<li>Entre em contato com suporte</li>
									<li>Continue usando o plano gratuito</li>
								</ul>
							</div>
						</CardContent>

						<CardFooter className="flex gap-3">
							<Button asChild variant="outline" className="flex-1">
								<Link to="/dashboard">Voltar ao Dashboard</Link>
							</Button>
							<Button asChild className="flex-1">
								<Link to="/billing">Ver Planos</Link>
							</Button>
						</CardFooter>
					</Card>
				</div>
			</div>
		</>
	);
}
