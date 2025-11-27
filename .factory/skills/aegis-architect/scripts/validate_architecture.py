#!/usr/bin/env python3
"""
AegisWallet Architecture Validation Script

This script validates AegisWallet architecture compliance with the following checks:
- Technology stack alignment
- Security patterns (RLS, LGPD compliance)
- Voice-first implementation patterns
- Performance targets for financial applications
- Brazilian market integration requirements
- Code quality and type safety standards

Usage: python scripts/validate_architecture.py [--directory path] [--output json|text]
"""

import os
import sys
import json
import re
import argparse
from pathlib import Path
from typing import Dict, List, Tuple, Any

class ArchitectureValidator:
    def __init__(self, directory: str = None):
        self.directory = Path(directory) if directory else Path.cwd()
        self.results = {
            'valid': True,
            'errors': [],
            'warnings': [],
            'recommendations': [],
            'checks_performed': []
        }
        
    def validate_all(self) -> Dict[str, Any]:
        """Run all architecture validation checks"""
        print("🏗️  Starting AegisWallet Architecture Validation...")
        
        # Technology Stack Validation
        self.validate_technology_stack()
        
        # Security and Compliance Validation
        self.validate_security_patterns()
        
        # Voice Interface Validation
        self.validate_voice_interface()
        
        # Performance Validation
        self.validate_performance_patterns()
        
        # Brazilian Market Integration
        self.validate_brazilian_integration()
        
        # Code Quality Validation
        self.validate_code_quality()
        
        # Database Design Validation
        self.validate_database_design()
        
        return self.results
    
    def validate_technology_stack(self):
        """Validate technology stack compliance"""
        print("\n🔧 Validating Technology Stack...")
        self.results['checks_performed'].append('technology_stack')
        
        required_files = [
            'package.json',
            'bun.lockb',
            'vite.config.ts',
            'tailwind.config.ts',
            'tsconfig.json'
        ]
        
        for file in required_files:
            file_path = self.directory / file
            if file_path.exists():
                print(f"  ✅ Found {file}")
            else:
                self.results['errors'].append(f"Missing required file: {file}")
                self.results['valid'] = False
        
        # Check package.json for required dependencies
        package_json = self.directory / 'package.json'
        if package_json.exists():
            with open(package_json, 'r', encoding='utf-8') as f:
                package_data = json.load(f)
                deps = {**package_data.get('dependencies', {}), **package_data.get('devDependencies', {})}
                
                required_deps = [
                    'react', 'typescript', 'vite', '@tanstack/react-query',
                    '@tanstack/react-router', 'hono', '@trpc/server', 'zod',
                    'tailwindcss', '@supabase/supabase-js', 'react-hook-form'
                ]
                
                for dep in required_deps:
                    if dep in deps:
                        print(f"  ✅ Found dependency: {dep}")
                    else:
                        self.results['warnings'].append(f"Missing recommended dependency: {dep}")
    
    def validate_security_patterns(self):
        """Validate security patterns and LGPD compliance"""
        print("\n🔒 Validating Security Patterns...")
        self.results['checks_performed'].append('security_patterns')
        
        # Check for RLS policies
        supabase_dir = self.directory / 'supabase'
        if supabase_dir.exists():
            migrations_dir = supabase_dir / 'migrations'
            if migrations_dir.exists():
                rls_found = False
                for migration_file in migrations_dir.glob('*.sql'):
                    with open(migration_file, 'r', encoding='utf-8') as f:
                        content = f.read()
                        if 'ROW LEVEL SECURITY' in content or 'RLS' in content:
                            rls_found = True
                            break
                
                if rls_found:
                    print("  ✅ Found Row Level Security policies")
                else:
                    self.results['warnings'].append("No RLS policies found in migrations")
        
        # Check for environment variable usage
        if self._search_in_files(r'process\.env\.', ['ts', 'tsx', 'js', 'jsx']):
            print("  ✅ Environment variables properly used")
        else:
            self.results['warnings'].append("Consider using environment variables for sensitive data")
        
        # Check for hardcoded credentials (basic pattern)
        credential_patterns = [
            r'supabase\.co.*eyJ',
            r'api[_-]?key.*=.*["\'][^"\']+["\']',
            r'secret.*=.*["\'][^"\']+["\']',
            r'password.*=.*["\'][^"\']+["\']'
        ]
        
        for pattern in credential_patterns:
            matches = self._search_in_files(pattern, ['ts', 'tsx', 'js', 'jsx', 'env'])
            if matches:
                self.results['errors'].append(f"Potential hardcoded credentials found: {pattern}")
                self.results['valid'] = False
        
        if not any(credential_patterns for pattern in credential_patterns if 
                  self._search_in_files(pattern, ['ts', 'tsx', 'js', 'jsx'])):
            print("  ✅ No obvious hardcoded credentials found")
    
    def validate_voice_interface(self):
        """Validate voice interface implementation"""
        print("\n🎤 Validating Voice Interface...")
        self.results['checks_performed'].append('voice_interface')
        
        # Check for voice-related hooks and components
        voice_patterns = [
            r'useVoiceRecognition',
            r'useVoiceState',
            r'speechRecognition',
            r'webkitSpeechRecognition',
            r'speechSynthesis'
        ]
        
        voice_found = any(self._search_in_files(pattern, ['ts', 'tsx']) for pattern in voice_patterns)
        
        if voice_found:
            print("  ✅ Voice interface components found")
        else:
            self.results['recommendations'].append("Consider adding voice interface components for voice-first experience")
        
        # Check for accessibility features
        accessibility_patterns = [
            r'aria-',
            r'role=',
            r'screen[-_]?reader',
            r'wcag',
            r'accessibility'
        ]
        
        accessibility_found = any(self._search_in_files(pattern, ['ts', 'tsx']) for pattern in accessibility_patterns)
        
        if accessibility_found:
            print("  ✅ Accessibility features found")
        else:
            self.results['recommendations'].append("Add accessibility features for WCAG 2.1 AA compliance")
    
    def validate_performance_patterns(self):
        """Validate performance optimization patterns"""
        print("\n⚡ Validating Performance Patterns...")
        self.results['checks_performed'].append('performance_patterns')
        
        # Check for optimization patterns
        performance_patterns = [
            r'useMemo',
            r'useCallback',
            r'lazy\s*\(',
            r'Suspense',
            r'cache[\s\S]*?ttl',
            r'optimistic'
        ]
        
        perf_found = any(self._search_in_files(pattern, ['ts', 'tsx']) for pattern in performance_patterns)
        
        if perf_found:
            print("  ✅ Performance optimization patterns found")
        else:
            self.results['recommendations'].append("Consider adding performance optimizations for sub-500ms voice responses")
        
        # Check bundle optimization
        vite_config = self.directory / 'vite.config.ts'
        if vite_config.exists():
            with open(vite_config, 'r', encoding='utf-8') as f:
                config_content = f.read()
                if 'codeSplitting' in config_content or 'splitVendorChunkPlugin' in config_content:
                    print("  ✅ Bundle optimization found in Vite config")
                else:
                    self.results['recommendations'].append("Consider adding bundle splitting for optimal loading")
    
    def validate_brazilian_integration(self):
        """Validate Brazilian market integration features"""
        print("\n🇧🇷 Validating Brazilian Market Integration...")
        self.results['checks_performed'].append('brazilian_integration')
        
        # Check for PIX/Boleto related code
        brazilian_patterns = [
            r'pix|PIX',
            r'boleto|Boleto',
            r'cpf|CPF',
            r'cnpj|CNPJ',
            r'brasil|Brazil',
            r'pt[_-]?BR|portugu[eê]s'
        ]
        
        brazilian_found = any(self._search_in_files(pattern, ['ts', 'tsx', 'sql']) for pattern in brazilian_patterns)
        
        if brazilian_found:
            print("  ✅ Brazilian market integration found")
        else:
            self.results['recommendations'].append("Consider adding Brazilian market features (PIX, boletos, etc.)")
        
        # Check for localization/internationalization
        i18n_patterns = [
            r'intl|internationalization|i18n',
            r'locale|localization',
            r'ReactIntl|useTranslation',
            r'formatNumber.*pt[-_]BR'
        ]
        
        i18n_found = any(self._search_in_files(pattern, ['ts', 'tsx']) for pattern in i18n_patterns)
        
        if i18n_found:
            print("  ✅ Localization features found")
        else:
            self.results['recommendations'].append("Consider adding Brazilian Portuguese localization")
    
    def validate_code_quality(self):
        """Validate code quality and type safety"""
        print("\n✨ Validating Code Quality...")
        self.results['checks_performed'].append('code_quality')
        
        # TypeScript configuration
        tsconfig = self.directory / 'tsconfig.json'
        if tsconfig.exists():
            with open(tsconfig, 'r', encoding='utf-8') as f:
                tsconfig_content = json.load(f)
                compiler_options = tsconfig_content.get('compilerOptions', {})
                
                if compiler_options.get('strict', False):
                    print("  ✅ TypeScript strict mode enabled")
                else:
                    self.results['warnings'].append("Enable TypeScript strict mode for better type safety")
                
                if compiler_options.get('noImplicitAny', False):
                    print("  ✅ No implicit any TypeScript rule enabled")
                else:
                    self.results['warnings'].append("Enable noImplicitAny for better type safety")
        
        # Check for test files
        test_patterns = ['*.test.ts', '*.test.tsx', '*.spec.ts', '*.spec.tsx']
        test_files = []
        for pattern in test_patterns:
            test_files.extend(self.directory.rglob(pattern))
        
        if test_files:
            print(f"  ✅ Found {len(test_files)} test files")
        else:
            self.results['recommendations'].append("Consider adding tests for critical financial operations")
        
        # Check for linting configuration
        lint_configs = ['.eslintrc.js', 'oxlint.json', 'biome.json']
        lint_found = any((self.directory / config).exists() for config in lint_configs)
        
        if lint_found:
            print("  ✅ Linting configuration found")
        else:
            self.results['recommendations'].append("Consider adding code quality tools (OXLint, Biome)")
    
    def validate_database_design(self):
        """Validate database design patterns"""
        print("\n🗄️  Validating Database Design...")
        self.results['checks_performed'].append('database_design')
        
        supabase_dir = self.directory / 'supabase'
        if not supabase_dir.exists():
            self.results['recommendations'].append("Consider setting up Supabase for database management")
            return
        
        # Check for migration files
        migrations_dir = supabase_dir / 'migrations'
        if migrations_dir.exists():
            migration_files = list(migrations_dir.glob('*.sql'))
            if migration_files:
                print(f"  ✅ Found {len(migration_files)} database migration files")
            else:
                self.results['warnings'].append("No migration files found")
        
        # Check for RLS patterns
        rls_patterns = [
            r'ALTER TABLE.*ENABLE ROW LEVEL SECURITY',
            r'CREATE POLICY',
            r'auth\.uid\(\)',
            r'auth\.role\(\)'
        ]
        
        rls_found = False
        if migrations_dir.exists():
            for migration_file in migrations_dir.glob('*.sql'):
                with open(migration_file, 'r', encoding='utf-8') as f:
                    content = f.read()
                    if any(re.search(pattern, content, re.IGNORECASE) for pattern in rls_patterns):
                        rls_found = True
                        break
        
        if rls_found:
            print("  ✅ Row Level Security patterns found")
        else:
            self.results['recommendations'].append("Consider adding Row Level Security for data protection")
    
    def _search_in_files(self, pattern: str, extensions: List[str]) -> List[str]:
        """Search for a pattern in files with specified extensions"""
        matches = []
        regex = re.compile(pattern, re.IGNORECASE)
        
        for ext in extensions:
            for file_path in self.directory.rglob(f'*.{ext}'):
                try:
                    with open(file_path, 'r', encoding='utf-8') as f:
                        content = f.read()
                        if regex.search(content):
                            matches.append(str(file_path))
                except (UnicodeDecodeError, PermissionError):
                    continue
        
        return matches
    
    def print_results(self, output_format: str = 'text'):
        """Print validation results"""
        if output_format == 'json':
            print(json.dumps(self.results, indent=2, ensure_ascii=False))
        else:
            print(f"\n{'='*60}")
            print("📊 ARCHITECTURE VALIDATION RESULTS")
            print(f"{'='*60}")
            
            if self.results['valid']:
                print("✅ ARCHITECTURE VALIDATION PASSED")
            else:
                print("❌ ARCHITECTURE VALIDATION FAILED")
            
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
    parser = argparse.ArgumentParser(description='Validate AegisWallet architecture compliance')
    parser.add_argument('--directory', '-d', help='Directory to validate (default: current directory)')
    parser.add_argument('--output', '-o', choices=['text', 'json'], default='text', 
                       help='Output format (default: text)')
    
    args = parser.parse_args()
    
    validator = ArchitectureValidator(args.directory)
    results = validator.validate_all()
    validator.print_results(args.output)
    
    # Exit with error code if validation failed
    sys.exit(0 if results['valid'] else 1)

if __name__ == '__main__':
    main()