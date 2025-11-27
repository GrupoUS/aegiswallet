#!/usr/bin/env python3
"""
Brazilian Fintech Compliance Validator
Validates applications against LGPD, BCB regulations, and Brazilian financial standards
"""

import re
import json
from pathlib import Path
from typing import Dict, List, Tuple, Optional

class BrazilianComplianceValidator:
    def __init__(self):
        self.validation_results = {
            'lgpd_compliance': {'score': 0, 'issues': [], 'recommendations': []},
            'bcb_regulations': {'score': 0, 'issues': [], 'recommendations': []},
            'data_protection': {'score': 0, 'issues': [], 'recommendations': []},
            'financial_security': {'score': 0, 'issues': [], 'recommendations': []},
            'overall_score': 0
        }
        
        # LGPD compliance patterns
        self.lgpd_patterns = {
            'consent_management': [
                'consent', 'consentimento', 'privacy', 'privacidade',
                'data_subject', 'titular_dados', 'user_rights', 'direitos_titular'
            ],
            'data_minimization': [
                'data_minimization', 'minimizacao_dados', 'only_necessary',
                'purpose_limitation', 'limitacao_finalidade'
            ],
            'retention_policies': [
                'retention', 'retencao', 'data_retention', 'politica_retentao',
                'data_deletion', 'exclusao_dados', 'right_to_be_forgotten'
            ],
            'security_measures': [
                'encryption', 'criptografia', 'access_control', 'controle_acesso',
                'audit_logging', 'registro_auditoria', 'security', 'seguranca'
            ]
        }
        
        # BCB regulation patterns
        self.bcb_patterns = {
            'pix_compliance': [
                'pix', 'instant_payment', 'pagamento_instantaneo',
                'transaction_limits', 'limites_transacao',
                'fraud_detection', 'detecao_fraude', 'circular_4015'
            ],
            'open_banking': [
                'open_banking', 'banco_aberto', 'api_security',
                'oauth2', 'rate_limiting', 'api_documentation',
                'circular_4842'
            ],
            'transaction_logging': [
                'transaction_log', 'registro_transacao', 'audit_trail',
                'financial_audit', 'auditoria_financeira',
                '5_year_retention', 'retencao_5_anos'
            ],
            'availability_requirements': [
                'uptime', 'disponibilidade', 'sla', '99.9',
                'high_availability', 'alta_disponibilidade',
                'disaster_recovery', 'recuperacao_desastres'
            ]
        }
        
        # Financial security patterns
        self.security_patterns = {
            'authentication': [
                'mfa', 'multi_factor', 'biometric', 'biometria',
                'device_trust', 'confianca_dispositivo', 'session_management'
            ],
            'encryption': [
                'aes-256', 'tls_1.3', 'end_to_end_encryption',
                'data_encryption', 'criptografia_dados'
            ],
            'fraud_prevention': [
                'fraud_detection', 'behavioral_analysis', 'risk_scoring',
                'anomaly_detection', 'transaction_monitoring'
            ],
            'audit_logging': [
                'audit_log', 'security_event', 'evento_seguranca',
                'incident_response', 'resposta_incidente'
            ]
        }

    def validate_project(self, project_path: str) -> Dict:
        """Validate entire project for Brazilian compliance"""
        project_path = Path(project_path)
        
        if not project_path.exists():
            return {'error': f'Project path not found: {project_path}'}
        
        print(f"Validating Brazilian compliance for: {project_path.name}")
        
        # Collect source files
        source_files = self._collect_source_files(project_path)
        
        # Validate LGPD compliance
        self._validate_lgpd_compliance(source_files)
        
        # Validate BCB regulations
        self._validate_bcb_regulations(source_files)
        
        # Validate data protection
        self._validate_data_protection(source_files)
        
        # Validate financial security
        self._validate_financial_security(source_files)
        
        # Calculate overall score
        self._calculate_overall_score()
        
        return self.validation_results

    def _collect_source_files(self, project_path: Path) -> List[Path]:
        """Collect all source code files"""
        extensions = ['.py', '.js', '.ts', '.tsx', '.jsx', '.java', '.go', '.rs', '.php']
        source_files = []
        
        for ext in extensions:
            source_files.extend(project_path.rglob(f'*{ext}'))
        
        # Also include configuration and documentation files
        source_files.extend(project_path.rglob('*.json'))
        source_files.extend(project_path.rglob('*.yaml'))
        source_files.extend(project_path.rglob('*.yml'))
        source_files.extend(project_path.rglob('*.md'))
        source_files.extend(project_path.rglob('*.sql'))
        
        return [f for f in source_files if f.is_file()]

    def _validate_lgpd_compliance(self, source_files: List[Path]):
        """Validate LGPD compliance requirements"""
        content_analysis = self._analyze_files_content(source_files)
        
        # Check consent management
        consent_found = self._check_pattern_presence(
            content_analysis, self.lgpd_patterns['consent_management']
        )
        if consent_found:
            self.validation_results['lgpd_compliance']['score'] += 25
        else:
            self.validation_results['lgpd_compliance']['issues'].append(
                'Consent management system not found - LGPD Art. 7 requires explicit consent'
            )
            self.validation_results['lgpd_compliance']['recommendations'].append(
                'Implement consent collection, recording, and management system'
            )
        
        # Check data minimization
        minimization_found = self._check_pattern_presence(
            content_analysis, self.lgpd_patterns['data_minimization']
        )
        if minimization_found:
            self.validation_results['lgpd_compliance']['score'] += 20
        else:
            self.validation_results['lgpd_compliance']['issues'].append(
                'Data minimization principles not implemented - LGPD Art. 6'
            )
            self.validation_results['lgpd_compliance']['recommendations'].append(
                'Implement data minimization and purpose limitation'
            )
        
        # Check retention policies
        retention_found = self._check_pattern_presence(
            content_analysis, self.lgpd_patterns['retention_policies']
        )
        if retention_found:
            self.validation_results['lgpd_compliance']['score'] += 25
        else:
            self.validation_results['lgpd_compliance']['issues'].append(
                'Data retention policies not defined - LGPD Art. 15'
            )
            self.validation_results['lgpd_compliance']['recommendations'].append(
                'Define and implement data retention and deletion policies'
            )
        
        # Check security measures
        security_found = self._check_pattern_presence(
            content_analysis, self.lgpd_patterns['security_measures']
        )
        if security_found:
            self.validation_results['lgpd_compliance']['score'] += 30
        else:
            self.validation_results['lgpd_compliance']['issues'].append(
                'Security measures not properly implemented - LGPD Art. 46'
            )
            self.validation_results['lgpd_compliance']['recommendations'].append(
                'Implement appropriate technical and organizational security measures'
            )

    def _validate_bcb_regulations(self, source_files: List[Path]):
        """Validate BCB regulatory compliance"""
        content_analysis = self._analyze_files_content(source_files)
        
        # Check PIX compliance
        pix_found = self._check_pattern_presence(
            content_analysis, self.bcb_patterns['pix_compliance']
        )
        if pix_found:
            self.validation_results['bcb_regulations']['score'] += 35
        else:
            self.validation_results['bcb_regulations']['issues'].append(
                'PIX system not compliant with BCB Circular No 4.015'
            )
            self.validation_results['bcb_regulations']['recommendations'].append(
                'Implement PIX transaction limits, fraud detection, and logging'
            )
        
        # Check Open Banking compliance
        open_banking_found = self._check_pattern_presence(
            content_analysis, self.bcb_patterns['open_banking']
        )
        if open_banking_found:
            self.validation_results['bcb_regulations']['score'] += 30
        else:
            self.validation_results['bcb_regulations']['issues'].append(
                'Open Banking API not compliant with BCB Circular No 4.842'
            )
            self.validation_results['bcb_regulations']['recommendations'].append(
                'Implement API security, documentation, and data sharing standards'
            )
        
        # Check transaction logging
        logging_found = self._check_pattern_presence(
            content_analysis, self.bcb_patterns['transaction_logging']
        )
        if logging_found:
            self.validation_results['bcb_regulations']['score'] += 35
        else:
            self.validation_results['bcb_regulations']['issues'].append(
                'Financial transaction logging not implemented'
            )
            self.validation_results['bcb_regulations']['recommendations'].append(
                'Implement 5-year transaction logging and audit trails'
            )

    def _validate_data_protection(self, source_files: List[Path]):
        """Validate data protection measures"""
        content_analysis = self._analyze_files_content(source_files)
        
        # Check encryption implementation
        encryption_found = self._check_pattern_presence(
            content_analysis, self.security_patterns['encryption']
        )
        if encryption_found:
            self.validation_results['data_protection']['score'] += 40
        else:
            self.validation_results['data_protection']['issues'].append(
                'Data encryption not properly implemented'
            )
            self.validation_results['data_protection']['recommendations'].append(
                'Implement AES-256 encryption and TLS 1.3 for data in transit'
            )
        
        # Check access control
        access_control_found = self._check_pattern_presence(
            content_analysis, ['access_control', 'controle_acesso', 'authorization', 'role_based']
        )
        if access_control_found:
            self.validation_results['data_protection']['score'] += 30
        else:
            self.validation_results['data_protection']['issues'].append(
                'Access control system not implemented'
            )
            self.validation_results['data_protection']['recommendations'].append(
                'Implement role-based access control with audit logging'
            )
        
        # Check audit logging
        audit_found = self._check_pattern_presence(
            content_analysis, ['audit', 'audit_log', 'logging', 'registro_auditoria']
        )
        if audit_found:
            self.validation_results['data_protection']['score'] += 30
        else:
            self.validation_results['data_protection']['issues'].append(
                'Audit logging system not implemented'
            )
            self.validation_results['data_protection']['recommendations'].append(
                'Implement comprehensive audit logging for all data access'
            )

    def _validate_financial_security(self, source_files: List[Path]):
        """Validate financial security measures"""
        content_analysis = self._analyze_files_content(source_files)
        
        # Check authentication
        auth_found = self._check_pattern_presence(
            content_analysis, self.security_patterns['authentication']
        )
        if auth_found:
            self.validation_results['financial_security']['score'] += 30
        else:
            self.validation_results['financial_security']['issues'].append(
                'Multi-factor authentication not implemented'
            )
            self.validation_results['financial_security']['recommendations'].append(
                'Implement MFA, biometric authentication, and device trust'
            )
        
        # Check fraud prevention
        fraud_found = self._check_pattern_presence(
            content_analysis, self.security_patterns['fraud_prevention']
        )
        if fraud_found:
            self.validation_results['financial_security']['score'] += 35
        else:
            self.validation_results['financial_security']['issues'].append(
                'Fraud detection system not implemented'
            )
            self.validation_results['financial_security']['recommendations'].append(
                'Implement real-time fraud detection and behavioral analysis'
            )
        
        # Check security monitoring
        monitoring_found = self._check_pattern_presence(
            content_analysis, ['security_monitoring', 'intrusion_detection', 'security_events']
        )
        if monitoring_found:
            self.validation_results['financial_security']['score'] += 35
        else:
            self.validation_results['financial_security']['issues'].append(
                'Security monitoring not implemented'
            )
            self.validation_results['financial_security']['recommendations'].append(
                'Implement 24/7 security monitoring and incident response'
            )

    def _analyze_files_content(self, source_files: List[Path]) -> str:
        """Analyze content of source files"""
        content = ""
        
        for file_path in source_files[:50]:  # Limit to first 50 files for performance
            try:
                content += file_path.read_text(encoding='utf-8').lower() + "\n"
            except:
                continue
        
        return content

    def _check_pattern_presence(self, content: str, patterns: List[str]) -> bool:
        """Check if any pattern is present in content"""
        content_lower = content.lower()
        
        for pattern in patterns:
            if pattern.lower() in content_lower:
                return True
        
        return False

    def _calculate_overall_score(self):
        """Calculate overall compliance score"""
        scores = [
            self.validation_results['lgpd_compliance']['score'],
            self.validation_results['bcb_regulations']['score'],
            self.validation_results['data_protection']['score'],
            self.validation_results['financial_security']['score']
        ]
        
        self.validation_results['overall_score'] = sum(scores) // len(scores)

    def generate_report(self) -> str:
        """Generate comprehensive compliance report"""
        report = []
        report.append("BRAZILIAN FINTECH COMPLIANCE REPORT")
        report.append("=" * 50)
        report.append(f"Overall Score: {self.validation_results['overall_score']}/100")
        report.append("")
        
        # LGPD Compliance
        report.append("LGPD COMPLIANCE:")
        report.append(f"Score: {self.validation_results['lgpd_compliance']['score']}/100")
        if self.validation_results['lgpd_compliance']['issues']:
            report.append("Issues Found:")
            for issue in self.validation_results['lgpd_compliance']['issues']:
                report.append(f"  - {issue}")
        if self.validation_results['lgpd_compliance']['recommendations']:
            report.append("Recommendations:")
            for rec in self.validation_results['lgpd_compliance']['recommendations']:
                report.append(f"  - {rec}")
        report.append("")
        
        # BCB Regulations
        report.append("BCB REGULATIONS:")
        report.append(f"Score: {self.validation_results['bcb_regulations']['score']}/100")
        if self.validation_results['bcb_regulations']['issues']:
            report.append("Issues Found:")
            for issue in self.validation_results['bcb_regulations']['issues']:
                report.append(f"  - {issue}")
        if self.validation_results['bcb_regulations']['recommendations']:
            report.append("Recommendations:")
            for rec in self.validation_results['bcb_regulations']['recommendations']:
                report.append(f"  - {rec}")
        report.append("")
        
        # Data Protection
        report.append("DATA PROTECTION:")
        report.append(f"Score: {self.validation_results['data_protection']['score']}/100")
        if self.validation_results['data_protection']['issues']:
            report.append("Issues Found:")
            for issue in self.validation_results['data_protection']['issues']:
                report.append(f"  - {issue}")
        if self.validation_results['data_protection']['recommendations']:
            report.append("Recommendations:")
            for rec in self.validation_results['data_protection']['recommendations']:
                report.append(f"  - {rec}")
        report.append("")
        
        # Financial Security
        report.append("FINANCIAL SECURITY:")
        report.append(f"Score: {self.validation_results['financial_security']['score']}/100")
        if self.validation_results['financial_security']['issues']:
            report.append("Issues Found:")
            for issue in self.validation_results['financial_security']['issues']:
                report.append(f"  - {issue}")
        if self.validation_results['financial_security']['recommendations']:
            report.append("Recommendations:")
            for rec in self.validation_results['financial_security']['recommendations']:
                report.append(f"  - {rec}")
        
        return "\n".join(report)

def main():
    import sys
    
    if len(sys.argv) != 2:
        print("Usage: python compliance_validator.py <project_directory>")
        sys.exit(1)
    
    validator = BrazilianComplianceValidator()
    results = validator.validate_project(sys.argv[1])
    
    if 'error' in results:
        print(f"Error: {results['error']}")
        sys.exit(1)
    
    print(validator.generate_report())
    
    # Exit with appropriate code
    score = results['overall_score']
    if score >= 80:
        sys.exit(0)  # Compliant
    elif score >= 60:
        sys.exit(1)  # Needs improvement
    else:
        sys.exit(2)  # Non-compliant

if __name__ == '__main__':
    main()
