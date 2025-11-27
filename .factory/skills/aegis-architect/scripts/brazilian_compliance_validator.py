#!/usr/bin/env python3
"""
Brazilian Compliance Validator for AegisWallet

Validates Brazilian financial compliance including:
- LGPD (Lei Geral de Proteção de Dados) compliance
- PIX (Banco Central) implementation standards  
- Open Banking Brasil API Spec 3.1 compliance
- BCB (Banco Central do Brasil) regulations
- Brazilian financial data security patterns

Usage: python scripts/brazilian_compliance_validator.py [--check pix,lgpd,openbanking] [--directory path]
"""

import os
import sys
import json
import re
import argparse
from pathlib import Path
from typing import Dict, List, Tuple, Any, Set

class BrazilianComplianceValidator:
    def __init__(self, directory: str = None):
        self.directory = Path(directory) if directory else Path.cwd()
        self.results = {
            'valid': True,
            'compliance_score': 0,
            'errors': [],
            'warnings': [],
            'recommendations': [],
            'checks_performed': [],
            'brazilian_compliance': {
                'lgpd': {'score': 0, 'issues': []},
                'pix': {'score': 0, 'issues': []},
                'openbanking': {'score': 0, 'issues': []},
                'security': {'score': 0, 'issues': []}
            }
        }
        
    def validate_all(self, checks: List[str] = None) -> Dict[str, Any]:
        """Run all Brazilian compliance validation checks"""
        print("🇧🇷 Starting Brazilian Compliance Validation...")
        
        if not checks:
            checks = ['lgpd', 'pix', 'openbanking', 'security']
            
        for check in checks:
            if check == 'lgpd':
                self.validate_lgpd_compliance()
            elif check == 'pix':
                self.validate_pix_compliance()
            elif check == 'openbanking':
                self.validate_openbanking_compliance()
            elif check == 'security':
                self.validate_brazilian_security()
        
        self._calculate_overall_score()
        return self.results
    
    def validate_lgpd_compliance(self):
        """Validate LGPD (Lei Geral de Proteção de Dados) compliance"""
        print("\n🔐 Validating LGPD Compliance...")
        self.results['checks_performed'].append('lgpd')
        
        lgpd_score = 0
        max_score = 100
        
        # Check for LGPD-related policies and documentation
        lgpd_patterns = {
            'consent_management': [
                r'consentimento|consent',
                r'lgpd|lei[_\s]?geral',
                r'data[_\s]?protection',
                r'pol[ií]tica[_\s]?de[_\s]?privacidade'
            ],
            'data_minimization': [
                r'm[ií]nimo[_\s]?necess[áa]rio',
                r'data[_\s]?minimization',
                r'coletar[_\s]?apenas[_\s]?necess[áa]rio'
            ],
            'user_rights': [
                r'direito[_\s]?de[_\s]?acesso',
                r'direito[_\s]?de[_\s]?retifica[cç][ãa]o',
                r'direito[_\s]?ao[_\s]?esquecimento',
                r'data[_\s]?portability'
            ],
            'security_measures': [
                r'encry', 'criptografia',
                r'access[_\s]?control',
                r'audit[_\s]?trail'
            ]
        }
        
        # Check database schema for LGPD compliance
        supabase_dir = self.directory / 'supabase'
        if supabase_dir.exists():
            migrations_dir = supabase_dir / 'migrations'
            if migrations_dir.exists():
                lgpd_found = False
                for migration_file in migrations_dir.glob('*.sql'):
                    with open(migration_file, 'r', encoding='utf-8') as f:
                        content = f.read().lower()
                        
                        # Check for user consent fields
                        if 'consentimento' in content or 'data_processing_consent' in content:
                            lgpd_score += 10
                            print("  ✅ User consent fields found")
                        
                        # Check for data retention policies
                        if 'retention' in content or 'expira' in content:
                            lgpd_score += 10
                            print("  ✅ Data retention policies found")
                        
                        # Check for audit fields
                        if 'created_at' in content and 'updated_at' in content:
                            lgpd_score += 5
                            print("  ✅ Audit timestamp fields found")
        
        # Check code for LGPD implementation patterns
        code_files = list(self.directory.rglob('*.ts')) + list(self.directory.rglob('*.tsx'))
        
        consent_management = False
        data_minimization = False
        user_rights = False
        
        for file_path in code_files:
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    content = f.read().lower()
                    
                    # Check for consent management
                    if any(re.search(pattern, content) for pattern in lgpd_patterns['consent_management']):
                        consent_management = True
                    
                    # Check for data minimization patterns
                    if any(re.search(pattern, content) for pattern in lgpd_patterns['data_minimization']):
                        data_minimization = True
                    
                    # Check for user rights implementation
                    if any(re.search(pattern, content) for pattern in lgpd_patterns['user_rights']):
                        user_rights = True
                        
            except (UnicodeDecodeError, PermissionError):
                continue
        
        if consent_management:
            lgpd_score += 20
            print("  ✅ Consent management patterns found")
        else:
            self.results['brazilian_compliance']['lgpd']['issues'].append("Missing consent management implementation")
            
        if data_minimization:
            lgpd_score += 15
            print("  ✅ Data minimization patterns found")
        else:
            self.results['brazilian_compliance']['lgpd']['issues'].append("Missing data minimization implementation")
            
        if user_rights:
            lgpd_score += 15
            print("  ✅ User rights implementation found")
        else:
            self.results['brazilian_compliance']['lgpd']['issues'].append("Missing user rights implementation")
        
        # Check for privacy policy documentation
        privacy_policy_files = [
            'privacy_policy.md', 'politica_privacidade.md',
            'lgpd_compliance.md', 'compliance/lgpd.md'
        ]
        
        privacy_found = any((self.directory / f).exists() for f in privacy_policy_files)
        if privacy_found:
            lgpd_score += 15
            print("  ✅ Privacy policy documentation found")
        else:
            self.results['recommendations'].append("Create LGPD privacy policy documentation")
        
        # Check for RLS (Row Level Security) which is required for LGPD
        rls_found = self._check_rls_implementation()
        if rls_found:
            lgpd_score += 10
            print("  ✅ Row Level Security found (LGPD requirement)")
        else:
            self.results['brazilian_compliance']['lgpd']['issues'].append("Missing RLS for data protection")
        
        self.results['brazilian_compliance']['lgpd']['score'] = lgpd_score
        
        if lgpd_score < 70:
            self.results['warnings'].append(f"LGPD compliance score: {lgpd_score}% (target: 70%+)")
    
    def validate_pix_compliance(self):
        """Validate PIX (Banco Central) compliance"""
        print("\n💰 Validating PIX Compliance...")
        self.results['checks_performed'].append('pix')
        
        pix_score = 0
        max_score = 100
        
        # PIX implementation patterns
        pix_patterns = {
            'transaction_fields': [
                r'end[_\s]?to[_\s]?end[_\s]?id',
                r'transaction[_\s]?id',
                r'pix[_\s]?key',
                r'descricao'
            ],
            'security_measures': [
                r'double[_\s]?auth|autentica[cç][ãa]o[_\s]?dupla',
                r'biometric|biometria',
                r'rate[_\s]?limit',
                r'fraud[_\s]?detection'
            ],
            'key_types': [
                r'cpf|cnpj',
                r'email',
                r'phone|telefone',
                r'random[_\s]?key'
            ],
            'status_tracking': [
                r'em[_\s]?processamento|processing',
                r'conclu[ií]do|completed',
                r'falhou|failed',
                r'estornado|refunded'
            ]
        }
        
        # Check database schema for PIX tables
        supabase_dir = self.directory / 'supabase'
        if supabase_dir.exists():
            migrations_dir = supabase_dir / 'migrations'
            if migrations_dir.exists():
                pix_table_found = False
                for migration_file in migrations_dir.glob('*.sql'):
                    with open(migration_file, 'r', encoding='utf-8') as f:
                        content = f.read().lower()
                        
                        # Check for PIX transactions table
                        if 'pix_transactions' in content or 'transactions' in content:
                            pix_table_found = True
                            
                            # Check for required PIX fields
                            if 'end_to_end_id' in content:
                                pix_score += 15
                                print("  ✅ PIX end_to_end_id field found")
                            
                            if 'transaction_id' in content:
                                pix_score += 10
                                print("  ✅ PIX transaction_id field found")
                            
                            if 'pix_key' in content:
                                pix_score += 10
                                print("  ✅ PIX key field found")
                            
                            if 'amount' in content:
                                pix_score += 5
                                print("  ✅ PIX amount field found")
                            
                            # Check for status tracking
                            if any(status in content for status in ['status', 'transaction_status']):
                                pix_score += 10
                                print("  ✅ PIX status tracking found")
        
        # Check code for PIX implementation
        code_files = list(self.directory.rglob('*.ts')) + list(self.directory.rglob('*.tsx'))
        
        pix_implementation = False
        pix_security = False
        pix_key_types = False
        
        for file_path in code_files:
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    content = f.read().lower()
                    
                    # Check for PIX implementation
                    if any(re.search(pattern, content) for pattern in pix_patterns['transaction_fields']):
                        pix_implementation = True
                    
                    # Check for PIX security measures
                    if any(re.search(pattern, content) for pattern in pix_patterns['security_measures']):
                        pix_security = True
                    
                    # Check for PIX key type handling
                    if any(re.search(pattern, content) for pattern in pix_patterns['key_types']):
                        pix_key_types = True
                        
            except (UnicodeDecodeError, PermissionError):
                continue
        
        if pix_implementation:
            pix_score += 20
            print("  ✅ PIX transaction implementation found")
        else:
            self.results['brazilian_compliance']['pix']['issues'].append("Missing PIX transaction implementation")
            
        if pix_security:
            pix_score += 15
            print("  ✅ PIX security measures found")
        else:
            self.results['brazilian_compliance']['pix']['issues'].append("Missing PIX security measures")
            
        if pix_key_types:
            pix_score += 10
            print("  ✅ PIX key type handling found")
        else:
            self.results['recommendations'].append("Implement PIX key type validation (CPF, CNPJ, email, phone)")
        
        # Check for API endpoints following BCB standards
        api_patterns = [
            r'/api/v1/pix/',
            r'pix/transfer',
            r'pix/keys',
            r'pix/qrcode'
        ]
        
        pix_endpoints = False
        for pattern in api_patterns:
            if self._search_in_code(pattern):
                pix_endpoints = True
                break
        
        if pix_endpoints:
            pix_score += 5
            print("  ✅ PIX API endpoints found")
        else:
            self.results['recommendations'].append("Create PIX API endpoints following BCB patterns")
        
        self.results['brazilian_compliance']['pix']['score'] = pix_score
        
        if pix_score < 70:
            self.results['warnings'].append(f"PIX compliance score: {pix_score}% (target: 70%+)")
    
    def validate_openbanking_compliance(self):
        """Validate Open Banking Brasil API Spec 3.1 compliance"""
        print("\n🏦 Validating Open Banking Compliance...")
        self.results['checks_performed'].append('openbanking')
        
        ob_score = 0
        
        # Open Banking required patterns
        ob_patterns = {
            'consent': [
                r'consents?',
                r'scope',
                r'expiration'
            ],
            'customer': [
                r'customer[_\s]?data',
                r'personal[_\s]?data',
                r'identifica[cç][ãa]o'
            ],
            'accounts': [
                r'accounts?',
                r'balance',
                r'transactions'
            ],
            'security': [
                r'oauth|oauth2',
                r'token',
                r'scope',
                r'redirect[_\s]?uri'
            ]
        }
        
        # Check for Open Banking implementation
        code_files = list(self.directory.rglob('*.ts')) + list(self.directory.rglob('*.tsx'))
        
        consent_api = False
        customer_api = False
        accounts_api = False
        security_implementation = False
        
        for file_path in code_files:
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    content = f.read().lower()
                    
                    # Check for consent API
                    if any(re.search(pattern, content) for pattern in ob_patterns['consent']):
                        consent_api = True
                    
                    # Check for customer data API
                    if any(re.search(pattern, content) for pattern in ob_patterns['customer']):
                        customer_api = True
                    
                    # Check for accounts API
                    if any(re.search(pattern, content) for pattern in ob_patterns['accounts']):
                        accounts_api = True
                    
                    # Check for security implementation
                    if any(re.search(pattern, content) for pattern in ob_patterns['security']):
                        security_implementation = True
                        
            except (UnicodeDecodeError, PermissionError):
                continue
        
        if consent_api:
            ob_score += 25
            print("  ✅ Open Banking consent API found")
        else:
            self.results['brazilian_compliance']['openbanking']['issues'].append("Missing Open Banking consent API")
            
        if customer_api:
            ob_score += 20
            print("  ✅ Open Banking customer data API found")
        else:
            self.results['recommendations'].append("Implement Open Banking customer data endpoints")
            
        if accounts_api:
            ob_score += 20
            print("  ✅ Open Banking accounts API found")
        else:
            self.results['recommendations'].append("Implement Open Banking accounts endpoints")
            
        if security_implementation:
            ob_score += 25
            print("  ✅ Open Banking security implementation found")
        else:
            self.results['brazilian_compliance']['openbanking']['issues'].append("Missing Open Banking security implementation")
        
        # Check for Open Banking documentation
        ob_docs = [
            'openbanking.md', 'open_banking.md',
            'docs/openbanking/', 'openbanking_spec.md'
        ]
        
        ob_doc_found = any((self.directory / doc).exists() for doc in ob_docs)
        if ob_doc_found:
            ob_score += 10
            print("  ✅ Open Banking documentation found")
        else:
            self.results['recommendations'].append("Create Open Banking implementation documentation")
        
        self.results['brazilian_compliance']['openbanking']['score'] = ob_score
        
        if ob_score < 70:
            self.results['warnings'].append(f"Open Banking compliance score: {ob_score}% (target: 70%+)")
    
    def validate_brazilian_security(self):
        """Validate Brazilian financial security patterns"""
        print("\n🛡️ Validating Brazilian Security Standards...")
        self.results['checks_performed'].append('security')
        
        security_score = 0
        
        # Brazilian security requirements
        security_patterns = {
            'encryption': [
                r'aes[-_]?256',
                r'tls[_\s]?1\.3',
                r'encrypt'
            ],
            'audit': [
                r'audit[_\s]?trail',
                r'log[_\s]?access',
                r'audit[_\s]?log'
            ],
            'access_control': [
                r'role[_\s]?based',
                r'multi[_\s]?factor',
                r'2fa|two[_\s]?factor'
            ],
            'data_protection': [
                r'data[_\s]?masking',
                r'pseudonymiza[cç][ãa]o',
                r'anonymiza[cç][ãa]o'
            ]
        }
        
        # Check security implementation
        code_files = list(self.directory.rglob('*.ts')) + list(self.directory.rglob('*.tsx'))
        
        encryption = False
        audit_trail = False
        access_control = False
        data_protection = False
        
        for file_path in code_files:
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    content = f.read().lower()
                    
                    # Check encryption
                    if any(re.search(pattern, content) for pattern in security_patterns['encryption']):
                        encryption = True
                    
                    # Check audit trail
                    if any(re.search(pattern, content) for pattern in security_patterns['audit']):
                        audit_trail = True
                    
                    # Check access control
                    if any(re.search(pattern, content) for pattern in security_patterns['access_control']):
                        access_control = True
                    
                    # Check data protection
                    if any(re.search(pattern, content) for pattern in security_patterns['data_protection']):
                        data_protection = True
                        
            except (UnicodeDecodeError, PermissionError):
                continue
        
        if encryption:
            security_score += 25
            print("  ✅ Encryption implementation found")
        else:
            self.results['brazilian_compliance']['security']['issues'].append("Missing encryption implementation")
            
        if audit_trail:
            security_score += 25
            print("  ✅ Audit trail implementation found")
        else:
            self.results['brazilian_compliance']['security']['issues'].append("Missing audit trail implementation")
            
        if access_control:
            security_score += 25
            print("  ✅ Access control implementation found")
        else:
            self.results['brazilian_compliance']['security']['issues'].append("Missing access control implementation")
            
        if data_protection:
            security_score += 25
            print("  ✅ Data protection implementation found")
        else:
            self.results['recommendations'].append("Implement data protection measures (masking, anonymization)")
        
        self.results['brazilian_compliance']['security']['score'] = security_score
        
        if security_score < 70:
            self.results['warnings'].append(f"Security compliance score: {security_score}% (target: 70%+)")
    
    def _check_rls_implementation(self) -> bool:
        """Check if Row Level Security is implemented"""
        supabase_dir = self.directory / 'supabase'
        if not supabase_dir.exists():
            return False
            
        migrations_dir = supabase_dir / 'migrations'
        if not migrations_dir.exists():
            return False
            
        rls_patterns = [
            r'ENABLE ROW LEVEL SECURITY',
            r'CREATE POLICY',
            r'auth\.uid\(\)'
        ]
        
        for migration_file in migrations_dir.glob('*.sql'):
            try:
                with open(migration_file, 'r', encoding='utf-8') as f:
                    content = f.read()
                    if any(re.search(pattern, content, re.IGNORECASE) for pattern in rls_patterns):
                        return True
            except (UnicodeDecodeError, PermissionError):
                continue
        
        return False
    
    def _search_in_code(self, pattern: str) -> bool:
        """Search for pattern in code files"""
        code_files = list(self.directory.rglob('*.ts')) + list(self.directory.rglob('*.tsx'))
        
        for file_path in code_files:
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    if re.search(pattern, f.read(), re.IGNORECASE):
                        return True
            except (UnicodeDecodeError, PermissionError):
                continue
        
        return False
    
    def _calculate_overall_score(self):
        """Calculate overall compliance score"""
        scores = []
        for category, data in self.results['brazilian_compliance'].items():
            if data['score'] > 0:
                scores.append(data['score'])
        
        if scores:
            self.results['compliance_score'] = sum(scores) // len(scores)
        else:
            self.results['compliance_score'] = 0
        
        # Determine overall validity
        if self.results['compliance_score'] < 70:
            self.results['valid'] = False
    
    def print_results(self, output_format: str = 'text'):
        """Print compliance validation results"""
        if output_format == 'json':
            print(json.dumps(self.results, indent=2, ensure_ascii=False))
        else:
            print(f"\n{'='*60}")
            print("🇧🇷 BRAZILIAN COMPLIANCE VALIDATION RESULTS")
            print(f"{'='*60}")
            
            if self.results['valid']:
                print("✅ BRAZILIAN COMPLIANCE VALIDATION PASSED")
            else:
                print("❌ BRAZILIAN COMPLIANCE VALIDATION FAILED")
            
            print(f"\n📊 Overall Compliance Score: {self.results['compliance_score']}%")
            
            # Category breakdown
            print(f"\n📋 Compliance by Category:")
            for category, data in self.results['brazilian_compliance'].items():
                if data['score'] > 0:
                    status = "✅" if data['score'] >= 70 else "⚠️"
                    print(f"   {status} {category.upper()}: {data['score']}%")
                    
                    if data['issues']:
                        for issue in data['issues']:
                            print(f"      • {issue}")
            
            if self.results['errors']:
                print(f"\n🚨 ERRORS ({len(self.results['errors'])}):")
                for error in self.results['errors']:
                    print(f"   • {error}")
            
            if self.results['warnings']:
                print(f"\n⚠️  WARNINGS ({len(self.results['warnings'])}):")
                for warning in self.results['warnings']:
                    print(f"   • {warning}")
            
            if self.results['recommendations']:
                print(f"\n💡 RECOMMENDATIONS ({len(self.results['recommendations'])}):")
                for rec in self.results['recommendations']:
                    print(f"   • {rec}")
            
            print(f"\n📋 Checks performed: {', '.join(self.results['checks_performed'])}")
            print(f"{'='*60}")

def main():
    parser = argparse.ArgumentParser(description='Validate Brazilian compliance for AegisWallet')
    parser.add_argument('--directory', '-d', help='Directory to validate (default: current directory)')
    parser.add_argument('--check', '-c', 
                       choices=['lgpd', 'pix', 'openbanking', 'security'],
                       nargs='+', 
                       help='Specific compliance checks to run (default: all)')
    parser.add_argument('--output', '-o', choices=['text', 'json'], default='text',
                       help='Output format (default: text)')
    
    args = parser.parse_args()
    
    validator = BrazilianComplianceValidator(args.directory)
    results = validator.validate_all(args.check)
    validator.print_results(args.output)
    
    # Exit with error code if validation failed
    sys.exit(0 if results['valid'] else 1)

if __name__ == '__main__':
    main()
