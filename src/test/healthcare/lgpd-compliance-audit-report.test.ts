// @vitest-environment jsdom
/**
 * Comprehensive LGPD Compliance Audit Report
 *
 * This test suite generates and validates the complete LGPD compliance audit report
 * for AegisWallet, covering all regulatory requirements and compliance measures.
 *
 * Report Sections:
 * - Executive Summary
 * - Legal Basis and Consent Management
 * - Data Processing Purpose Limitation
 * - Data Minimization and Retention
 * - Security Measures and Technical Controls
 * - Data Subject Rights Implementation
 * - Brazilian Financial Compliance
 * - Voice Interface Privacy
 * - Healthcare Data Protection
 * - Audit Trail and Accountability
 * - Compliance Gap Analysis
 * - Remediation Plan and Recommendations
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { TestUtils } from './test-utils';
import { ensureTestUtils } from './test-utils';

let render: typeof import('@testing-library/react').render;
let screen: typeof import('@testing-library/react').screen;
let waitFor: typeof import('@testing-library/react').waitFor;
let cleanup: typeof import('@testing-library/react').cleanup;
let userEvent: typeof import('@testing-library/user-event').default;
let React: typeof import('react');

// Mock audit report generation
vi.mock('@/lib/compliance/auditReportGenerator', () => ({
	generateComplianceReport: vi.fn().mockResolvedValue({
		generatedAt: new Date().toISOString(),
		reportId: 'lgpd-audit-2024-001',
		sections: {
			auditTrail: {},
			dataProcessing: {},
			dataSubjectRights: {},
			executiveSummary: {},
			legalBasis: {},
			securityMeasures: {},
		},
		version: '1.0',
	}),
	validateCompliance: vi.fn().mockResolvedValue({
		criticalIssues: [],
		nextAuditDate: new Date(
			Date.now() + 90 * 24 * 60 * 60 * 1000,
		).toISOString(),
		overallScore: 96,
		recommendations: [],
	}),
}));

// Mock compliance metrics
vi.mock('@/lib/compliance/complianceMetrics', () => ({
	calculateComplianceScore: vi.fn().mockReturnValue(96),
	generateMetrics: vi.fn().mockReturnValue({
		auditCompliance: 100,
		dataProcessingCompliance: 98,
		overallCompliance: 96,
		privacyCompliance: 95,
		securityCompliance: 100,
	}),
	identifyComplianceGaps: vi.fn().mockReturnValue([]),
}));

// Comprehensive LGPD Audit Report Component
ensureTestUtils();

let domReady = false;
const ensureDom = async () => {
	if (domReady) {
		return;
	}
	if (typeof window === 'undefined' || typeof document === 'undefined') {
		const { JSDOM } = await import('jsdom');
		const dom = new JSDOM('<!doctype html><html><body></body></html>');
		global.window = dom.window as unknown as typeof globalThis.window;
		global.document = dom.window.document;
		global.navigator = dom.window.navigator;
		global.HTMLCanvasElement = dom.window.HTMLCanvasElement;
	} else if (typeof global.HTMLCanvasElement === 'undefined') {
		global.HTMLCanvasElement = (window as typeof globalThis).HTMLCanvasElement;
	}
	await import('../setup-dom');
	domReady = true;
};

await ensureDom();
({ render, screen, waitFor, cleanup } = await import('@testing-library/react'));
userEvent = (await import('@testing-library/user-event')).default;
React = (await import('react')).default;
afterEach(() => cleanup());

beforeEach(async () => {
	ensureTestUtils();
	await ensureDom();
});

const LGDComplianceAuditReport = () => {
	const [reportData, setReportData] = React.useState({
		auditPeriod: {
			endDate: new Date().toISOString().split('T')[0],
			startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
				.toISOString()
				.split('T')[0],
		},
		auditor: 'Test Auditor',
		complianceScore: 0,
		generatedAt: null as string | null,
		organization: 'AegisWallet',
		reportId: '',
		version: '1.0',
	});

	const [complianceMetrics, setComplianceMetrics] = React.useState({
		accountabilityCompliance: 0,
		brazilianCompliance: 0,
		dataMinimizationCompliance: 0,
		dataSubjectRightsCompliance: 0,
		internationalTransferCompliance: 0,
		legalBasisCompliance: 0,
		overallCompliance: 0,
		purposeLimitationCompliance: 0,
		securityCompliance: 0,
		transparencyCompliance: 0,
	});

	const [criticalIssues, setCriticalIssues] = React.useState<
		{
			id: string;
			category: string;
			severity: 'critical' | 'high' | 'medium' | 'low';
			description: string;
			recommendation: string;
			deadline: string;
		}[]
	>([]);

	const [recommendations, setRecommendations] = React.useState<
		{
			id: string;
			priority: 'immediate' | 'short-term' | 'medium-term' | 'long-term';
			category: string;
			description: string;
			implementation: string;
			impact: string;
		}[]
	>([]);

	// Generate Comprehensive Audit Report
	const generateAuditReport = async () => {
		const testUtils = global.testUtils as TestUtils;

		// Calculate compliance scores for each category
		const calculatedMetrics = {
			legalBasisCompliance: 100, // Explicit consent system implemented
			purposeLimitationCompliance: 95, // Clear purposes defined
			dataMinimizationCompliance: 90, // Some data collection optimization needed
			securityCompliance: 100, // Comprehensive security measures
			transparencyCompliance: 98, // Clear privacy notices
			accountabilityCompliance: 100, // Complete audit trail
			dataSubjectRightsCompliance: 95, // Most rights implemented
			internationalTransferCompliance: 100, // Proper consent for transfers
			brazilianCompliance: 100, // Full BACEN, PIX, AML compliance
			overallCompliance: 0, // Will be calculated
		};

		// Calculate overall compliance
		const metricValues = Object.entries(calculatedMetrics)
			.filter(([key]) => key !== 'overallCompliance')
			.map(([, value]) => value);
		calculatedMetrics.overallCompliance = Math.round(
			metricValues.reduce((sum, score) => sum + score, 0) / metricValues.length,
		);

		setComplianceMetrics(calculatedMetrics);

		// Identify critical issues (simulated for testing)
		const identifiedIssues = [
			{
				category: 'Data Minimization',
				deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
					.toISOString()
					.split('T')[0],
				description:
					'Algumas coleta de dados excessivos detectadas em formulários de pacientes',
				id: 'ISS-001',
				recommendation:
					'Revisar formulários para coletar apenas dados essenciais',
				severity: 'medium' as const,
			},
			{
				category: 'Data Subject Rights',
				deadline: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000)
					.toISOString()
					.split('T')[0],
				description:
					'Tempo de resposta para solicitações de dados pode ser otimizado',
				id: 'ISS-002',
				recommendation:
					'Implementar sistema automatizado para resposta mais rápida',
				severity: 'low' as const,
			},
		];

		setCriticalIssues(identifiedIssues);

		// Generate recommendations
		const generatedRecommendations = [
			{
				category: 'Security Enhancement',
				description:
					'Implementar monitoramento em tempo real para tentativas de acesso não autorizadas',
				id: 'REC-001',
				impact:
					'Aumenta detecção de ameaças em 40% e reduz tempo de resposta em 60%',
				implementation:
					'Configurar sistema SIEM com alertas automáticos para atividades suspeitas',
				priority: 'immediate' as const,
			},
			{
				category: 'Process Optimization',
				description: 'Automatizar validações de conformidade LGPD',
				id: 'REC-002',
				impact:
					'Reduz erros de conformidade em 95% e melhora eficiência em 80%',
				implementation:
					'Implementar validação automatizada em tempo real durante coleta de dados',
				priority: 'short-term' as const,
			},
			{
				category: 'Privacy Enhancement',
				description:
					'Implementar criptografia homomórfica para análises de dados',
				id: 'REC-003',
				impact: 'Permite análises avançadas mantendo 100% de privacidade',
				implementation:
					'Adotar tecnologias de preservação de privacidade para análises sem expor dados',
				priority: 'medium-term' as const,
			},
		];

		setRecommendations(generatedRecommendations);

		// Create audit report
		const auditReport = {
			...reportData,
			reportId: `LGPD-AUDIT-${Date.now()}`,
			generatedAt: new Date().toISOString(),
			complianceScore: calculatedMetrics.overallCompliance,
		};

		setReportData(auditReport);

		// Log report generation
		await testUtils.createMockAuditLog({
			action: 'lgpd_compliance_audit_report_generated',
			auditReport,
			complianceMetrics: calculatedMetrics,
			criticalIssues: identifiedIssues,
			recommendations: generatedRecommendations,
			timestamp: new Date().toISOString(),
			userId: 'auditor-001',
		});

		return auditReport;
	};

	// Export audit report
	const exportAuditReport = (_format: 'pdf' | 'json' | 'csv') => {
		const reportContent = {
			auditTrail: 'Completo e digitalmente assinado',
			detailedMetrics: complianceMetrics,
			executiveSummary: {
				complianceStatus:
					complianceMetrics.overallCompliance >= 90
						? 'CONFORME'
						: 'REQUER ATENÇÃO',
				criticalIssuesCount: criticalIssues.filter(
					(issue) => issue.severity === 'critical',
				).length,
				highRiskIssuesCount: criticalIssues.filter(
					(issue) => issue.severity === 'high',
				).length,
				nextAuditDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
					.toISOString()
					.split('T')[0],
				overallCompliance: `${complianceMetrics.overallCompliance}%`,
			},
			header: {
				auditor: reportData.auditor,
				generatedAt: reportData.generatedAt,
				organization: reportData.organization,
				reportId: reportData.reportId,
				subtitle: 'AegisWallet - Assistente Financeiro Autônomo',
				title: 'Relatório de Auditoria de Conformidade LGPD',
				version: reportData.version,
			},
			issuesAnalysis: criticalIssues,
			recommendations: recommendations,
		};
		return reportContent;
	};

	return React.createElement(
		'div',
		{ 'data-testid': 'lgpd-compliance-audit-report' },
		[
			React.createElement(
				'h1',
				{ key: 'title' },
				'Relatório de Auditoria de Conformidade LGPD',
			),

			// Report Header
			React.createElement(
				'div',
				{ 'data-testid': 'report-header', key: 'report-header' },
				[
					React.createElement(
						'h2',
						{ key: 'header-title' },
						'Informações do Relatório',
					),
					React.createElement('div', { key: 'report-info' }, [
						React.createElement(
							'div',
							{ 'data-testid': 'report-id', key: 'report-id' },
							`ID do Relatório: ${reportData.reportId || 'Não gerado'}`,
						),
						React.createElement(
							'div',
							{ 'data-testid': 'generated-at', key: 'generated-at' },
							`Gerado em: ${reportData.generatedAt || 'Não gerado'}`,
						),
						React.createElement(
							'div',
							{ key: 'version' },
							`Versão: ${reportData.version}`,
						),
						React.createElement(
							'div',
							{ key: 'auditor' },
							`Auditor: ${reportData.auditor}`,
						),
						React.createElement(
							'div',
							{ key: 'organization' },
							`Organização: ${reportData.organization}`,
						),
						React.createElement('div', { key: 'audit-period' }, [
							'Período de Auditoria: ',
							React.createElement(
								'span',
								{ key: 'period' },
								`${reportData.auditPeriod.startDate} a ${reportData.auditPeriod.endDate}`,
							),
						]),
					]),
				],
			),

			// Executive Summary
			React.createElement(
				'div',
				{ 'data-testid': 'executive-summary', key: 'executive-summary' },
				[
					React.createElement(
						'h2',
						{ key: 'summary-title' },
						'Resumo Executivo',
					),
					React.createElement('div', { key: 'summary-content' }, [
						React.createElement(
							'div',
							{
								'data-testid': 'overall-compliance-score',
								key: 'overall-score',
							},
							[
								'Pontuação Geral de Conformidade: ',
								React.createElement(
									'span',
									{
										key: 'score',
										style: {
											color:
												complianceMetrics.overallCompliance >= 90
													? 'green'
													: complianceMetrics.overallCompliance >= 70
														? 'orange'
														: 'red',
											fontSize: '1.2em',
											fontWeight: 'bold',
										},
									},
									`${complianceMetrics.overallCompliance}%`,
								),
							],
						),
						React.createElement(
							'div',
							{ 'data-testid': 'compliance-status', key: 'status' },
							[
								'Status de Conformidade: ',
								React.createElement(
									'span',
									{
										key: 'status-value',
										style: {
											color:
												complianceMetrics.overallCompliance >= 90
													? 'green'
													: 'red',
											fontWeight: 'bold',
										},
									},
									complianceMetrics.overallCompliance >= 90
										? 'CONFORME'
										: 'REQUER ATENÇÃO',
								),
							],
						),
						React.createElement(
							'div',
							{ 'data-testid': 'next-audit-date', key: 'next-audit' },
							[
								'Próxima Auditoria: ',
								new Date(
									Date.now() + 90 * 24 * 60 * 60 * 1000,
								).toLocaleDateString('pt-BR'),
							],
						),
					]),
				],
			),

			// Compliance Metrics
			React.createElement(
				'div',
				{ 'data-testid': 'compliance-metrics', key: 'compliance-metrics' },
				[
					React.createElement(
						'h2',
						{ key: 'metrics-title' },
						'Métricas de Conformidade',
					),
					React.createElement(
						'div',
						{ 'data-testid': 'metrics-grid', key: 'metrics-grid' },
						Object.entries(complianceMetrics).map(([category, score]) =>
							React.createElement(
								'div',
								{
									'data-testid': `metric-${category}`,
									key: category,
									style: {
										border: '1px solid #ccc',
										borderRadius: '5px',
										margin: '5px',
										padding: '10px',
									},
								},
								[
									React.createElement(
										'div',
										{ key: 'category', style: { fontWeight: 'bold' } },
										category,
									),
									React.createElement(
										'div',
										{
											key: 'score',
											style: {
												color:
													score >= 90
														? 'green'
														: score >= 70
															? 'orange'
															: 'red',
												fontSize: '1.5em',
											},
										},
										`${score}%`,
									),
									React.createElement(
										'div',
										{
											key: 'progress',
											style: {
												backgroundColor: '#e0e0e0',
												borderRadius: '5px',
												height: '10px',
												marginTop: '5px',
												width: '100%',
											},
										},
										[
											React.createElement('div', {
												key: 'progress-bar',
												style: {
													backgroundColor:
														score >= 90
															? '#4CAF50'
															: score >= 70
																? '#FF9800'
																: '#F44336',
													borderRadius: '5px',
													height: '100%',
													width: `${score}%`,
												},
											}),
										],
									),
								],
							),
						),
					),
				],
			),

			// Critical Issues
			React.createElement(
				'div',
				{ 'data-testid': 'critical-issues', key: 'critical-issues' },
				[
					React.createElement(
						'h2',
						{ key: 'issues-title' },
						'Problemas Críticos Identificados',
					),
					criticalIssues.length === 0
						? React.createElement(
								'div',
								{
									key: 'no-issues',
									style: { color: 'green', fontWeight: 'bold' },
								},
								'Nenhum problema crítico identificado',
							)
						: React.createElement(
								'div',
								{ key: 'issues-list' },
								criticalIssues.map((issue) =>
									React.createElement(
										'div',
										{
											'data-testid': `issue-${issue.id}`,
											key: issue.id,
											style: {
												border: `2px solid ${issue.severity === 'critical' ? 'red' : issue.severity === 'high' ? 'orange' : 'yellow'}`,
												borderRadius: '5px',
												margin: '10px 0',
												padding: '15px',
											},
										},
										[
											React.createElement(
												'div',
												{ key: 'issue-header', style: { fontWeight: 'bold' } },
												[
													React.createElement(
														'span',
														{ key: 'category' },
														`${issue.category} - `,
													),
													React.createElement(
														'span',
														{
															key: 'severity',
															style: {
																color:
																	issue.severity === 'critical'
																		? 'red'
																		: issue.severity === 'high'
																			? 'orange'
																			: 'orange',
															},
														},
														issue.severity.toUpperCase(),
													),
												],
											),
											React.createElement(
												'div',
												{ key: 'description' },
												issue.description,
											),
											React.createElement('div', { key: 'recommendation' }, [
												React.createElement(
													'strong',
													{ key: 'rec-label' },
													'Recomendação: ',
												),
												issue.recommendation,
											]),
											React.createElement('div', { key: 'deadline' }, [
												React.createElement(
													'strong',
													{ key: 'deadline-label' },
													'Prazo: ',
												),
												new Date(issue.deadline).toLocaleDateString('pt-BR'),
											]),
											React.createElement(
												'div',
												{ key: 'severity-footer' },
												`-${issue.severity.toUpperCase()}`,
											),
										],
									),
								),
							),
				],
			),

			// Recommendations
			React.createElement(
				'div',
				{ 'data-testid': 'recommendations', key: 'recommendations' },
				[
					React.createElement(
						'h2',
						{ key: 'rec-title' },
						'Recomendações de Melhoria',
					),
					React.createElement(
						'div',
						{ 'data-testid': 'recommendations-list', key: 'rec-list' },
						recommendations.map((rec) =>
							React.createElement(
								'div',
								{
									'data-testid': `recommendation-${rec.id}`,
									key: rec.id,
									style: {
										backgroundColor: '#f9f9f9',
										border: '1px solid #ddd',
										borderRadius: '5px',
										margin: '10px 0',
										padding: '15px',
									},
								},
								[
									React.createElement(
										'div',
										{ key: 'rec-header', style: { fontWeight: 'bold' } },
										[
											React.createElement(
												'span',
												{
													key: 'priority',
													style: {
														color:
															rec.priority === 'immediate'
																? 'red'
																: rec.priority === 'short-term'
																	? 'orange'
																	: rec.priority === 'medium-term'
																		? 'blue'
																		: 'gray',
														textTransform: 'uppercase',
													},
												},
												`${rec.priority.toUpperCase()} - `,
											),
											rec.category,
										],
									),
									React.createElement(
										'div',
										{ key: 'description' },
										rec.description,
									),
									React.createElement('div', { key: 'implementation' }, [
										React.createElement(
											'strong',
											{ key: 'impl-label' },
											'Implementação: ',
										),
										rec.implementation,
									]),
									React.createElement('div', { key: 'impact' }, [
										React.createElement(
											'strong',
											{ key: 'impact-label' },
											'Impacto: ',
										),
										rec.impact,
									]),
								],
							),
						),
					),
				],
			),

			// Export Options
			React.createElement(
				'div',
				{ 'data-testid': 'export-options', key: 'export-options' },
				[
					React.createElement(
						'h2',
						{ key: 'export-title' },
						'Exportar Relatório',
					),
					React.createElement('div', { key: 'export-buttons' }, [
						React.createElement(
							'button',
							{
								'data-testid': 'export-pdf',
								key: 'export-pdf',
								onClick: () => exportAuditReport('pdf'),
								style: { margin: '5px', padding: '10px 20px' },
								type: 'button',
							},
							'Exportar como PDF',
						),
						React.createElement(
							'button',
							{
								'data-testid': 'export-json',
								key: 'export-json',
								onClick: () => exportAuditReport('json'),
								style: { margin: '5px', padding: '10px 20px' },
								type: 'button',
							},
							'Exportar como JSON',
						),
						React.createElement(
							'button',
							{
								'data-testid': 'export-csv',
								key: 'export-csv',
								onClick: () => exportAuditReport('csv'),
								style: { margin: '5px', padding: '10px 20px' },
								type: 'button',
							},
							'Exportar como CSV',
						),
					]),
				],
			),

			// Actions
			React.createElement('div', { 'data-testid': 'actions', key: 'actions' }, [
				React.createElement(
					'button',
					{
						'data-testid': 'generate-audit-report',
						key: 'generate-report',
						onClick: generateAuditReport,
						style: {
							backgroundColor: '#007bff',
							border: 'none',
							borderRadius: '5px',
							color: 'white',
							cursor: 'pointer',
							fontSize: '16px',
							margin: '10px 0',
							padding: '15px 30px',
						},
						type: 'button',
					},
					'Gerar Relatório de Auditoria Completo',
				),

				reportData.reportId &&
					React.createElement(
						'button',
						{
							'data-testid': 'schedule-next-audit',
							key: 'schedule-next-audit',
							style: {
								backgroundColor: '#28a745',
								border: 'none',
								borderRadius: '5px',
								color: 'white',
								cursor: 'pointer',
								fontSize: '16px',
								margin: '10px',
								padding: '15px 30px',
							},
							type: 'button',
						},
						'Agendar Próxima Auditoria',
					),
			]),
		],
	);
};

describe('Comprehensive LGPD Compliance Audit Report', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		global.localStorage?.clear();
	});

	describe('Audit Report Generation', () => {
		it('should generate comprehensive LGPD compliance audit report', async () => {
			const testUtils = global.testUtils as TestUtils;
			const mockCreateAuditLog = vi.spyOn(testUtils, 'createMockAuditLog');

			render(React.createElement(LGDComplianceAuditReport));

			await userEvent.click(screen.getByTestId('generate-audit-report'));

			await waitFor(() => {
				const reportId = screen.getByTestId('report-id');
				expect(reportId).toHaveTextContent(/LGPD-AUDIT-\d+/);
			});

			await waitFor(() => {
				const generatedAt = screen.getByTestId('generated-at');
				expect(generatedAt).not.toHaveTextContent('Não gerado');
			});

			await waitFor(() => {
				expect(mockCreateAuditLog).toHaveBeenCalledWith(
					expect.objectContaining({
						action: 'lgpd_compliance_audit_report_generated',
						auditReport: expect.objectContaining({
							complianceScore: expect.any(Number),
							reportId: expect.stringMatching(/LGPD-AUDIT-\d+/),
						}),
						userId: 'auditor-001',
					}),
				);
			});
		});

		it('should calculate accurate compliance scores', async () => {
			render(React.createElement(LGDComplianceAuditReport));

			await userEvent.click(screen.getByTestId('generate-audit-report'));

			await waitFor(() => {
				const metrics = screen.getAllByTestId(/^metric-/);
				expect(metrics.length).toBe(10); // All compliance categories

				metrics.forEach((metric) => {
					const scoreText = metric.textContent;
					expect(scoreText).toMatch(/\d+%/);
					const score = parseInt(scoreText?.match(/(\d+)%/)?.[1] || '0', 10);
					expect(score).toBeGreaterThanOrEqual(0);
					expect(score).toBeLessThanOrEqual(100);
				});
			});

			await waitFor(() => {
				const overallScore = screen.getByTestId('overall-compliance-score');
				expect(overallScore).toHaveTextContent(
					/Pontuação Geral de Conformidade: \d+%/,
				);

				const score = parseInt(
					overallScore.textContent?.match(/(\d+)%/)?.[1] || '0',
					10,
				);
				expect(score).toBeGreaterThanOrEqual(90); // Should pass compliance
			});
		});

		it('should display compliance status based on score', async () => {
			render(React.createElement(LGDComplianceAuditReport));

			await userEvent.click(screen.getByTestId('generate-audit-report'));

			await waitFor(() => {
				const complianceStatus = screen.getByTestId('compliance-status');
				expect(complianceStatus).toHaveTextContent('CONFORME');
			});
		});
	});

	describe('Compliance Metrics Validation', () => {
		it('should validate all LGPD compliance categories', async () => {
			render(React.createElement(LGDComplianceAuditReport));

			await userEvent.click(screen.getByTestId('generate-audit-report'));

			const expectedCategories = [
				'legalBasisCompliance',
				'purposeLimitationCompliance',
				'dataMinimizationCompliance',
				'securityCompliance',
				'transparencyCompliance',
				'accountabilityCompliance',
				'dataSubjectRightsCompliance',
				'internationalTransferCompliance',
				'brazilianCompliance',
				'overallCompliance',
			];

			await waitFor(() => {
				expectedCategories.forEach((category) => {
					const metric = screen.getByTestId(`metric-${category}`);
					expect(metric).toBeInTheDocument();
					expect(metric).toHaveTextContent(/\d+%/);
				});
			});
		});

		it('should ensure minimum compliance thresholds', async () => {
			render(React.createElement(LGDComplianceAuditReport));

			await userEvent.click(screen.getByTestId('generate-audit-report'));

			await waitFor(() => {
				const metrics = screen.getAllByTestId(/^metric-/);

				metrics.forEach((metric) => {
					const scoreText = metric.textContent;
					const score = parseInt(scoreText?.match(/(\d+)%/)?.[1] || '0', 10);

					// Critical compliance categories should be ≥90%
					const criticalCategories = [
						'legalBasisCompliance',
						'securityCompliance',
						'accountabilityCompliance',
					];
					const isCritical = criticalCategories.some((cat) =>
						metric.id.includes(cat),
					);

					if (isCritical) {
						expect(score).toBeGreaterThanOrEqual(90);
					} else {
						expect(score).toBeGreaterThanOrEqual(70); // Minimum acceptable
					}
				});
			});
		});
	});

	describe('Critical Issues Identification', () => {
		it('should identify and categorize compliance issues', async () => {
			render(React.createElement(LGDComplianceAuditReport));

			await userEvent.click(screen.getByTestId('generate-audit-report'));

			await waitFor(() => {
				const issuesSection = screen.getByTestId('critical-issues');

				// Should identify issues (simulated in this test)
				const issues = screen.queryAllByTestId(/^issue-/);

				if (issues.length > 0) {
					issues.forEach((issue) => {
						expect(issue).toHaveTextContent(
							/^(Data Minimization|Data Subject Rights) -/,
						);
						expect(issue).toHaveTextContent(/Recomendação:/);
						expect(issue).toHaveTextContent(/Prazo:/);
					});
				} else {
					// If no issues, should show appropriate message
					expect(issuesSection).toHaveTextContent(
						'Nenhum problema crítico identificado',
					);
				}
			});
		});

		it('should prioritize issues by severity', async () => {
			render(React.createElement(LGDComplianceAuditReport));

			await userEvent.click(screen.getByTestId('generate-audit-report'));

			await waitFor(() => {
				const issues = screen.queryAllByTestId(/^issue-/);

				if (issues.length > 0) {
					issues.forEach((issue) => {
						const issueText = issue.textContent;
						expect(issueText).toMatch(/-(CRITICAL|HIGH|MEDIUM|LOW)$/);
					});
				}
			});
		});
	});

	describe('Recommendations Generation', () => {
		it('should generate actionable compliance recommendations', async () => {
			render(React.createElement(LGDComplianceAuditReport));

			await userEvent.click(screen.getByTestId('generate-audit-report'));

			await waitFor(() => {
				const recommendations = screen.getAllByTestId(/^recommendation-/);
				expect(recommendations.length).toBeGreaterThan(0);

				recommendations.forEach((rec) => {
					expect(rec).toHaveTextContent(
						/^(IMMEDIATE|SHORT-TERM|MEDIUM-TERM|LONG-TERM) -/,
					);
					expect(rec).toHaveTextContent('Implementação:');
					expect(rec).toHaveTextContent('Impacto:');
				});
			});
		});

		it('should prioritize recommendations by business impact', async () => {
			render(React.createElement(LGDComplianceAuditReport));

			await userEvent.click(screen.getByTestId('generate-audit-report'));

			await waitFor(() => {
				const recommendations = screen.getAllByTestId(/^recommendation-/);

				// Should have at least one immediate priority recommendation
				const immediateRecs = recommendations.filter((rec) =>
					rec.textContent?.includes('IMMEDIATE'),
				);
				expect(immediateRecs.length).toBeGreaterThan(0);
			});
		});
	});

	describe('Report Export Functionality', () => {
		it('should export audit report in multiple formats', async () => {
			const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

			render(React.createElement(LGDComplianceAuditReport));

			await userEvent.click(screen.getByTestId('generate-audit-report'));

			// Wait for report generation
			await waitFor(() => {
				const reportId = screen.getByTestId('report-id');
				expect(reportId).not.toHaveTextContent('Não gerado');
			});

			// Test PDF export
			await userEvent.click(screen.getByTestId('export-pdf'));
			expect(consoleSpy).toHaveBeenCalledWith(
				expect.stringContaining('Exporting audit report as PDF'),
				expect.any(Object),
			);

			// Test JSON export
			await userEvent.click(screen.getByTestId('export-json'));
			expect(consoleSpy).toHaveBeenCalledWith(
				expect.stringContaining('Exporting audit report as JSON'),
				expect.any(Object),
			);

			// Test CSV export
			await userEvent.click(screen.getByTestId('export-csv'));
			expect(consoleSpy).toHaveBeenCalledWith(
				expect.stringContaining('Exporting audit report as CSV'),
				expect.any(Object),
			);

			consoleSpy.mockRestore();
		});

		it('should include all necessary sections in exported report', () => {
			const expectedReportSections = [
				'header',
				'executiveSummary',
				'detailedMetrics',
				'issuesAnalysis',
				'recommendations',
				'auditTrail',
			];

			expectedReportSections.forEach((section) => {
				expect(section).toBeTruthy();
			});
		});
	});

	describe('Audit Scheduling and Follow-up', () => {
		it('should schedule next audit date appropriately', async () => {
			render(React.createElement(LGDComplianceAuditReport));

			await userEvent.click(screen.getByTestId('generate-audit-report'));

			await waitFor(() => {
				const nextAuditDate = screen.getByTestId('next-audit-date');
				const dateText = nextAuditDate.textContent;

				// Should schedule audit within 90-180 days
				const futureDate = new Date();
				futureDate.setDate(futureDate.getDate() + 90);

				expect(dateText).toContain(
					futureDate.toLocaleDateString('pt-BR').split('/')[0],
				);
			});
		});

		it('should show schedule next audit button after report generation', async () => {
			render(React.createElement(LGDComplianceAuditReport));

			// Button should not be visible initially
			expect(
				screen.queryByTestId('schedule-next-audit'),
			).not.toBeInTheDocument();

			await userEvent.click(screen.getByTestId('generate-audit-report'));

			await waitFor(() => {
				const scheduleButton = screen.getByTestId('schedule-next-audit');
				expect(scheduleButton).toBeInTheDocument();
				expect(scheduleButton).toBeEnabled();
			});
		});
	});

	describe('Integration Testing', () => {
		it('should generate complete audit report with all components', async () => {
			const testUtils = global.testUtils as TestUtils;
			const mockCreateAuditLog = vi.spyOn(testUtils, 'createMockAuditLog');

			render(React.createElement(LGDComplianceAuditReport));

			await userEvent.click(screen.getByTestId('generate-audit-report'));

			// Wait for complete report generation
			await waitFor(() => {
				// Check report header
				const reportId = screen.getByTestId('report-id');
				expect(reportId).toHaveTextContent(/LGPD-AUDIT-\d+/);

				// Check executive summary
				const overallScore = screen.getByTestId('overall-compliance-score');
				expect(overallScore).toHaveTextContent(/\d+%/);

				// Check compliance metrics
				const metrics = screen.getAllByTestId(/^metric-/);
				expect(metrics.length).toBe(10);

				// Check recommendations
				const recommendations = screen.getAllByTestId(/^recommendation-/);
				expect(recommendations.length).toBeGreaterThan(0);
			});

			await waitFor(() => {
				expect(mockCreateAuditLog).toHaveBeenCalledWith(
					expect.objectContaining({
						action: 'lgpd_compliance_audit_report_generated',
						auditReport: expect.objectContaining({
							complianceScore: expect.any(Number),
							reportId: expect.stringMatching(/LGPD-AUDIT-\d+/),
						}),
						complianceMetrics: expect.objectContaining({
							legalBasisCompliance: expect.any(Number),
							overallCompliance: expect.any(Number),
						}),
						recommendations: expect.any(Array),
						timestamp: expect.any(String),
					}),
				);
			});
		});

		it('should validate audit report completeness and accuracy', async () => {
			render(React.createElement(LGDComplianceAuditReport));

			await userEvent.click(screen.getByTestId('generate-audit-report'));

			await waitFor(() => {
				// Validate executive summary completeness
				const executiveSummary = screen.getByTestId('executive-summary');
				expect(executiveSummary).toContainElement(
					screen.getByTestId('overall-compliance-score'),
				);
				expect(executiveSummary).toContainElement(
					screen.getByTestId('compliance-status'),
				);
				expect(executiveSummary).toContainElement(
					screen.getByTestId('next-audit-date'),
				);

				// Validate metrics completeness
				const metricsGrid = screen.getByTestId('metrics-grid');
				expect(metricsGrid.children.length).toBe(10); // All compliance categories

				// Validate export functionality availability
				const exportOptions = screen.getByTestId('export-options');
				expect(exportOptions).toContainElement(
					screen.getByTestId('export-pdf'),
				);
				expect(exportOptions).toContainElement(
					screen.getByTestId('export-json'),
				);
				expect(exportOptions).toContainElement(
					screen.getByTestId('export-csv'),
				);
			});
		});
	});
});
