#!/usr/bin/env python3
"""
AegisWallet Performance Audit Script

This script audits performance aspects critical for voice-first financial applications:
- Voice response time targets (<500ms)
- Bundle size optimization
- Database query performance
- Real-time synchronization efficiency
- Mobile performance optimization
- Core Web Vitals compliance

Usage: python scripts/performance_audit.py [--directory path] [--output json|text]
"""

import os
import sys
import json
import re
import argparse
from pathlib import Path
from typing import Dict, List, Any, Optional

class PerformanceAuditor:
    def __init__(self, directory: str = None):
        self.directory = Path(directory) if directory else Path.cwd()
        self.results = {
            'overall_score': 0,
            'checks_performed': [],
            'voice_performance': {'score': 0, 'issues': [], 'recommendations': []},
            'bundle_optimization': {'score': 0, 'issues': [], 'recommendations': []},
            'database_performance': {'score': 0, 'issues': [], 'recommendations': []},
            'realtime_performance': {'score': 0, 'issues': [], 'recommendations': []},
            'mobile_optimization': {'score': 0, 'issues': [], 'recommendations': []},
            'core_web_vitals': {'score': 0, 'issues': [], 'recommendations': []}
        }
        
    def audit_all(self) -> Dict[str, Any]:
        """Run all performance audit checks"""
        print("🚀 Starting AegisWallet Performance Audit...")
        
        # Voice Performance Audit
        self.audit_voice_performance()
        
        # Bundle Optimization Audit
        self.audit_bundle_optimization()
        
        # Database Performance Audit
        self.audit_database_performance()
        
        # Real-time Performance Audit
        self.audit_realtime_performance()
        
        # Mobile Optimization Audit
        self.audit_mobile_optimization()
        
        # Core Web Vitals Audit
        self.audit_core_web_vitals()
        
        # Calculate overall score
        self.calculate_overall_score()
        
        return self.results
    
    def audit_voice_performance(self):
        """Audit voice response time performance"""
        print("\n🎤 Auditing Voice Performance...")
        self.results['checks_performed'].append('voice_performance')
        
        voice_score = 100
        issues = []
        recommendations = []
        
        # Check for voice optimization patterns
        optimization_patterns = {
            'preload_models': r'preload|precache',
            'web_workers': r'web[\s_-]?worker|worker[\s_-]?thread',
            'caching': r'cache.*voice|voice.*cache',
            'batching': r'batch.*voice|voice.*batch'
        }
        
        for pattern_name, pattern in optimization_patterns.items():
            if not self._search_in_files(pattern, ['ts', 'tsx', 'js']):
                voice_score -= 15
                issues.append(f"Missing {pattern_name.replace('_', ' ')} for voice processing")
                recommendations.append(f"Implement {pattern_name.replace('_', ' ')} to improve voice response times")
        
        # Check for async voice processing
        async_patterns = [
            r'async.*voice|voice.*async',
            r'await.*voice|voice.*await',
            r'promise.*voice|voice.*promise'
        ]
        
        if not any(self._search_in_files(pattern, ['ts', 'tsx']) for pattern in async_patterns):
            voice_score -= 20
            issues.append("Voice processing not properly asynchronous")
            recommendations.append("Ensure voice processing is non-blocking with async/await")
        
        # Check voice response time targets in comments/docs
        performance_comments = self._search_in_files(r'500ms|<.*500.*ms|voice.*response.*time', ['ts', 'tsx', 'md'])
        if not performance_comments:
            voice_score -= 10
            recommendations.append("Document voice response time targets (<500ms)")
        
        self.results['voice_performance']['score'] = max(0, voice_score)
        self.results['voice_performance']['issues'] = issues
        self.results['voice_performance']['recommendations'] = recommendations
        
        print(f"  📊 Voice Performance Score: {self.results['voice_performance']['score']}/100")
        if issues:
            print(f"  ⚠️  Found {len(issues)} performance issues")
    
    def audit_bundle_optimization(self):
        """Audit bundle size optimization"""
        print("\n📦 Auditing Bundle Optimization...")
        self.results['checks_performed'].append('bundle_optimization')
        
        bundle_score = 100
        issues = []
        recommendations = []
        
        # Check Vite configuration for optimization
        vite_config = self.directory / 'vite.config.ts'
        if vite_config.exists():
            with open(vite_config, 'r', encoding='utf-8') as f:
                config_content = f.read()
                
                optimization_features = {
                    'code_splitting': r'codeSplitting|splitVendorChunkPlugin',
                    'tree_shaking': r'treeShaking|treeshake',
                    'minification': r'minify|terser',
                    'asset_optimization': r'asset|assetInlineLimit'
                }
                
                for feature, pattern in optimization_features.items():
                    if not re.search(pattern, config_content, re.IGNORECASE):
                        bundle_score -= 20
                        issues.append(f"Missing {feature.replace('_', ' ')} in build configuration")
                        recommendations.append(f"Enable {feature.replace('_', ' ')} for smaller bundles")
        
        else:
            bundle_score -= 50
            issues.append("No Vite configuration found")
            recommendations.append("Set up Vite configuration with optimization features")
        
        # Check for dynamic imports
        lazy_patterns = [
            r'lazy\s*\(',
            r'dynamic\s*\(\s*import',
            r'Suspense',
            r'react\.lazy'
        ]
        
        if not any(self._search_in_files(pattern, ['ts', 'tsx']) for pattern in lazy_patterns):
            bundle_score -= 25
            issues.append("No code splitting with lazy loading found")
            recommendations.append("Implement lazy loading for better initial load times")
        
        # Check for bundle size monitoring
        bundle_analysis = self._search_in_files(r'bundle[\s_-]?size|webpack[\s_-]?bundle|analyze', ['json', 'js'])
        if not bundle_analysis:
            bundle_score -= 15
            recommendations.append("Set up bundle size analysis and monitoring")
        
        self.results['bundle_optimization']['score'] = max(0, bundle_score)
        self.results['bundle_optimization']['issues'] = issues
        self.results['bundle_optimization']['recommendations'] = recommendations
        
        print(f"  📊 Bundle Optimization Score: {self.results['bundle_optimization']['score']}/100")
        if issues:
            print(f"  ⚠️  Found {len(issues)} optimization opportunities")
    
    def audit_database_performance(self):
        """Audit database query performance"""
        print("\n🗄️  Auditing Database Performance...")
        self.results['checks_performed'].append('database_performance')
        
        db_score = 100
        issues = []
        recommendations = []
        
        # Check for database query optimization patterns
        supabase_dir = self.directory / 'supabase'
        if supabase_dir.exists():
            migrations_dir = supabase_dir / 'migrations'
            
            if migrations_dir.exists():
                # Check for indexes in migrations
                index_found = False
                for migration_file in migrations_dir.glob('*.sql'):
                    with open(migration_file, 'r', encoding='utf-8') as f:
                        content = f.read()
                        if 'CREATE INDEX' in content or 'CREATE UNIQUE INDEX' in content:
                            index_found = True
                            break
                
                if index_found:
                    print("  ✅ Database indexes found")
                else:
                    db_score -= 30
                    issues.append("No database indexes found in migrations")
                    recommendations.append("Add indexes for frequently queried columns")
        
        # Check for query optimization in application code
        query_patterns = [
            r'\.select\(\s*["\']\*["\']',  # SELECT * without specific columns
            r'fetch.*all',                  # Fetching all records without limits
            r'N\+1.*query'                  # N+1 query patterns in comments
        ]
        
        for pattern in query_patterns:
            if self._search_in_files(pattern, ['ts', 'tsx', 'js']):
                db_score -= 20
                issues.append(f"Potential inefficient query pattern: {pattern}")
                recommendations.append("Optimize database queries for better performance")
        
        # Check for query result caching
        cache_patterns = [
            r'useQuery.*staleTime',
            r'queryClient.*setQueryData',
            r'supabase.*cache',
            r'react.*query.*cache'
        ]
        
        if not any(self._search_in_files(pattern, ['ts', 'tsx']) for pattern in cache_patterns):
            db_score -= 25
            recommendations.append("Implement query result caching for better performance")
        
        self.results['database_performance']['score'] = max(0, db_score)
        self.results['database_performance']['issues'] = issues
        self.results['database_performance']['recommendations'] = recommendations
        
        print(f"  📊 Database Performance Score: {self.results['database_performance']['score']}/100")
        if issues:
            print(f"  ⚠️  Found {len(issues)} database optimization opportunities")
    
    def audit_realtime_performance(self):
        """Audit real-time synchronization performance"""
        print("\n⚡ Auditing Real-time Performance...")
        self.results['checks_performed'].append('realtime_performance')
        
        realtime_score = 100
        issues = []
        recommendations = []
        
        # Check for Supabase real-time patterns
        realtime_patterns = [
            r'supabase.*channel',
            r'on\([\'"]postgres_changes[\'"]',
            r'realtime.*subscribe',
            r'subscribeToTable'
        ]
        
        realtime_found = any(self._search_in_files(pattern, ['ts', 'tsx']) for pattern in realtime_patterns)
        
        if realtime_found:
            print("  ✅ Real-time synchronization found")
        else:
            realtime_score -= 40
            recommendations.append("Implement real-time synchronization for instant updates")
        
        # Check for subscription optimization
        sub_optimization = self._search_in_files(r'channel.*unsubscribe|cleanup.*subscription', ['ts', 'tsx'])
        if realtime_found and not sub_optimization:
            realtime_score -= 20
            issues.append("Missing subscription cleanup")
            recommendations.append("Ensure real-time subscriptions are properly cleaned up")
        
        # Check for optimistic updates
        optimistic_patterns = [
            r'useMutation.*onSuccess',
            r'optimistic.*update',
            'queryClient.*invalidateQueries'
        ]
        
        if not any(self._search_in_files(pattern, ['ts', 'tsx']) for pattern in optimistic_patterns):
            realtime_score -= 25
            recommendations.append("Implement optimistic updates for better UX")
        
        self.results['realtime_performance']['score'] = max(0, realtime_score)
        self.results['realtime_performance']['issues'] = issues
        self.results['realtime_performance']['recommendations'] = recommendations
        
        print(f"  📊 Real-time Performance Score: {self.results['realtime_performance']['score']}/100")
        if issues:
            print(f"  ⚠️  Found {len(issues)} real-time optimization opportunities")
    
    def audit_mobile_optimization(self):
        """Audit mobile performance optimization"""
        print("\n📱 Auditing Mobile Optimization...")
        self.results['checks_performed'].append('mobile_optimization')
        
        mobile_score = 100
        issues = []
        recommendations = []
        
        # Check for responsive design patterns
        responsive_patterns = [
            r'responsive|mobile|tablet',
            r'breakpoint|screen.*size',
            r'tailwind.*sm:|md:|lg:|xl:',
            r'media.*query'
        ]
        
        responsive_found = any(self._search_in_files(pattern, ['ts', 'tsx', 'css']) for pattern in responsive_patterns)
        
        if responsive_found:
            print("  ✅ Responsive design patterns found")
        else:
            mobile_score -= 30
            recommendations.append("Implement responsive design for mobile devices")
        
        # Check for touch-friendly interfaces
        touch_patterns = [
            r'onClick|onTouch',
            r'button.*size',
            r'touch.*target',
            r'mobile.*optimized'
        ]
        
        if not any(self._search_in_files(pattern, ['ts', 'tsx']) for pattern in touch_patterns):
            mobile_score -= 25
            recommendations.append("Ensure buttons and interactive elements are touch-friendly")
        
        # Check for mobile-specific optimizations
        mobile_optimizations = [
            r'mobile.*viewport|viewport.*scale',
            r'touch.*action|user.*select',
            r'mobile.*performance|device.*memory'
        ]
        
        if not any(self._search_in_files(pattern, ['tsx', 'html', 'css']) for pattern in mobile_optimizations):
            mobile_score -= 20
            recommendations.append("Add mobile-specific viewport and performance optimizations")
        
        self.results['mobile_optimization']['score'] = max(0, mobile_score)
        self.results['mobile_optimization']['issues'] = issues
        self.results['mobile_optimization']['recommendations'] = recommendations
        
        print(f"  📊 Mobile Optimization Score: {self.results['mobile_optimization']['score']}/100")
        if issues:
            print(f"  ⚠️  Found {len(issues)} mobile optimization opportunities")
    
    def audit_core_web_vitals(self):
        """Audit Core Web Vitals compliance"""
        print("\n📊 Auditing Core Web Vitals...")
        self.results['checks_performed'].append('core_web_vitals')
        
        vitals_score = 100
        issues = []
        recommendations = []
        
        # Check for performance monitoring setup
        monitoring_patterns = [
            r'web[-_]?vitals',
            r'performance.*observer',
            r'LCP|INP|CLS',
            r'performance.*mark|performance.*measure'
        ]
        
        monitoring_found = any(self._search_in_files(pattern, ['ts', 'tsx', 'js']) for pattern in monitoring_patterns)
        
        if monitoring_found:
            print("  ✅ Performance monitoring found")
        else:
            vitals_score -= 30
            recommendations.append("Set up Core Web Vitals monitoring")
        
        # Check for image optimization
        image_patterns = [
            r'next[/\\]image|next/image',
            r'lazy.*load.*image|image.*lazy',
            r'srcset|sizes',
            r'webp|avif|optimization'
        ]
        
        if not any(self._search_in_files(pattern, ['ts', 'tsx', 'jsx']) for pattern in image_patterns):
            vitals_score -= 25
            recommendations.append("Optimize images for better LCP")
        
        # Check for font optimization
        font_patterns = [
            r'font.*display.*swap',
            r'preload.*font',
            r'font.*optimization',
            r'webfont.*loader'
        ]
        
        if not any(self._search_in_files(pattern, ['tsx', 'html', 'css']) for pattern in font_patterns):
            vitals_score -= 20
            recommendations.append("Optimize font loading for better performance")
        
        # Check for layout stability
        layout_patterns = [
            r'CLS|cumulative.*layout.*shift',
            r'layout.*shift|layout.*stability',
            r'animation.*hardware|gpu'
        ]
        
        if not any(self._search_in_files(pattern, ['ts', 'tsx', 'css']) for pattern in layout_patterns):
            vitals_score -= 25
            recommendations.append("Ensure layout stability to prevent CLS")
        
        self.results['core_web_vitals']['score'] = max(0, vitals_score)
        self.results['core_web_vitals']['issues'] = issues
        self.results['core_web_vitals']['recommendations'] = recommendations
        
        print(f"  📊 Core Web Vitals Score: {self.results['core_web_vitals']['score']}/100")
        if issues:
            print(f"  ⚠️  Found {len(issues)} Core Web Vitals optimization opportunities")
    
    def calculate_overall_score(self):
        """Calculate overall performance score"""
        scores = [
            self.results['voice_performance']['score'],
            self.results['bundle_optimization']['score'],
            self.results['database_performance']['score'],
            self.results['realtime_performance']['score'],
            self.results['mobile_optimization']['score'],
            self.results['core_web_vitals']['score']
        ]
        
        self.results['overall_score'] = round(sum(scores) / len(scores), 1)
    
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
        """Print audit results"""
        if output_format == 'json':
            print(json.dumps(self.results, indent=2, ensure_ascii=False))
        else:
            print(f"\n{'='*60}")
            print("🚀 PERFORMANCE AUDIT RESULTS")
            print(f"{'='*60}")
            
            # Overall score with emoji
            score = self.results['overall_score']
            if score >= 90:
                emoji = "🟢"
                status = "EXCELLENT"
            elif score >= 80:
                emoji = "🟡"
                status = "GOOD"
            elif score >= 70:
                emoji = "🟠"
                status = "FAIR"
            else:
                emoji = "🔴"
                status = "NEEDS IMPROVEMENT"
            
            print(f"{emoji} OVERALL PERFORMANCE SCORE: {score}/100 ({status})")
            print(f"{'='*60}")
            
            # Individual scores
            categories = [
                ('Voice Performance', 'voice_performance'),
                ('Bundle Optimization', 'bundle_optimization'),
                ('Database Performance', 'database_performance'),
                ('Real-time Performance', 'realtime_performance'),
                ('Mobile Optimization', 'mobile_optimization'),
                ('Core Web Vitals', 'core_web_vitals')
            ]
            
            for category_name, category_key in categories:
                score = self.results[category_key]['score']
                issues = self.results[category_key]['issues']
                recommendations = self.results[category_key]['recommendations']
                
                if score >= 90:
                    emoji = "✅"
                elif score >= 70:
                    emoji = "⚠️"
                else:
                    emoji = "❌"
                
                print(f"\n{emoji} {category_name}: {score}/100")
                
                if issues:
                    for issue in issues:
                        print(f"   • Issue: {issue}")
                
                if recommendations:
                    for rec in recommendations:
                        print(f"   💡 Recommendation: {rec}")
            
            print(f"\n📋 Checks performed: {', '.join(self.results['checks_performed'])}")
            print(f"{'='*60}")

def main():
    parser = argparse.ArgumentParser(description='Audit AegisWallet performance')
    parser.add_argument('--directory', '-d', help='Directory to audit (default: current directory)')
    parser.add_argument('--output', '-o', choices=['text', 'json'], default='text',
                       help='Output format (default: text)')
    
    args = parser.parse_args()
    
    auditor = PerformanceAuditor(args.directory)
    results = auditor.audit_all()
    auditor.print_results(args.output)
    
    # Exit with warning if score is below 70
    sys.exit(0 if results['overall_score'] >= 70 else 1)

if __name__ == '__main__':
    main()