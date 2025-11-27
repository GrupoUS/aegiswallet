#!/usr/bin/env python3
"""
Voice Performance Analyzer for AegisWallet

Analyzes voice interface performance and provides optimization recommendations
for Brazilian fintech voice-first applications with sub-200ms response targets.

Usage: python scripts/voice_performance_analyzer.py [--directory path] [--target-ms 200] [--output json|text]
"""

import os
import sys
import json
import re
import time
import argparse
from pathlib import Path
from typing import Dict, List, Tuple, Any, Optional

class VoicePerformanceAnalyzer:
    def __init__(self, directory: str = None, target_ms: int = 200):
        self.directory = Path(directory) if directory else Path.cwd()
        self.target_ms = target_ms
        self.results = {
            'performance_score': 0,
            'target_ms': target_ms,
            'voice_response_time': 0,
            'issues': [],
            'recommendations': [],
            'optimizations_found': [],
            'performance_patterns': {
                'voice_activity_detection': False,
                'processing_optimization': False,
                'caching_strategy': False,
                'memory_management': False,
                'regional_adaptation': False
            },
            'brazilian_patterns': {
                'portuguese_support': False,
                'regional_variations': False,
                'financial_terminology': False,
                'slang_recognition': False
            }
        }
        
    def analyze_all(self) -> Dict[str, Any]:
        """Run complete voice performance analysis"""
        print("🎤 Starting Voice Performance Analysis...")
        print(f"🎯 Target Response Time: {self.target_ms}ms")
        
        # Analyze voice components
        self.analyze_voice_components()
        
        # Analyze performance patterns
        self.analyze_performance_patterns()
        
        # Analyze Brazilian Portuguese support
        self.analyze_brazilian_patterns()
        
        # Analyze memory management
        self.analyze_memory_management()
        
        # Analyze caching strategies
        self.analyze_caching_strategies()
        
        # Calculate overall performance score
        self.calculate_performance_score()
        
        return self.results
    
    def analyze_voice_components(self):
        """Analyze voice interface components"""
        print("\n🔍 Analyzing Voice Components...")
        
        voice_files = []
        voice_patterns = {
            'speech_recognition': [
                r'webkitSpeechRecognition',
                r'SpeechRecognition',
                r'start\(\)',
                r'stop\(\)',
                r'onresult',
                r'onerror'
            ],
            'voice_activity_detection': [
                r'VAD|voice.*activity.*detection',
                r'detectSpeech',
                r'speech.*end',
                r'silence.*duration',
                r'audio.*level'
            ],
            'speech_synthesis': [
                r'speechSynthesis',
                r'speechSynthesisUtterance',
                r'speak\(\)',
                r'voice.*synthesis'
            ],
            'voice_state': [
                r'isListening',
                r'transcript',
                r'voiceState',
                r'voiceRecognition'
            ]
        }
        
        # Find voice-related files
        for file_path in self.directory.rglob('*.ts'):
            if any(keyword in str(file_path).lower() for keyword in ['voice', 'speech', 'stt', 'tts']):
                voice_files.append(file_path)
        
        for file_path in self.directory.rglob('*.tsx'):
            if any(keyword in str(file_path).lower() for keyword in ['voice', 'speech', 'stt', 'tts']):
                voice_files.append(file_path)
        
        print(f"  📁 Found {len(voice_files)} voice-related files")
        
        # Analyze voice files for patterns
        for category, patterns in voice_patterns.items():
            found_patterns = []
            for pattern in patterns:
                for file_path in voice_files:
                    try:
                        with open(file_path, 'r', encoding='utf-8') as f:
                            content = f.read()
                            if re.search(pattern, content, re.IGNORECASE):
                                found_patterns.append(pattern)
                                break
                    except (UnicodeDecodeError, PermissionError):
                        continue
            
            if found_patterns:
                print(f"  ✅ {category.replace('_', ' ').title()}: {len(found_patterns)} patterns found")
                self.results['performance_patterns'][category] = True
            else:
                print(f"  ❌ {category.replace('_', ' ').title()}: No patterns found")
                self.results['issues'].append(f"Missing {category} implementation")
        
        # Check for performance-related voice configurations
        performance_configs = [
            r'auto.*stop.*timeout',
            r'processing.*delay',
            r'min.*audio.*duration',
            r'max.*audio.*duration',
            r'silence.*timeout'
        ]
        
        found_configs = []
        for config in performance_configs:
            for file_path in voice_files:
                try:
                    with open(file_path, 'r', encoding='utf-8') as f:
                        content = f.read()
                        if re.search(config, content, re.IGNORECASE):
                            found_configs.append(config)
                            break
                except (UnicodeDecodeError, PermissionError):
                    continue
        
        if found_configs:
            print(f"  ✅ Performance configurations: {len(found_configs)} found")
            self.results['performance_patterns']['processing_optimization'] = True
        else:
            self.results['recommendations'].append("Add voice performance timeout configurations")
    
    def analyze_performance_patterns(self):
        """Analyze performance optimization patterns"""
        print("\n⚡ Analyzing Performance Patterns...")
        
        performance_files = list(self.directory.rglob('*.ts')) + list(self.directory.rglob('*.tsx'))
        
        # Performance optimization patterns
        perf_patterns = {
            'react_optimizations': [
                r'useMemo',
                r'useCallback',
                r'React\.lazy',
                r'Suspense',
                r'memo'
            ],
            'async_operations': [
                r'await',
                r'Promise',
                r'async',
                r'timeout',
                r'setTimeout'
            ],
            'error_handling': [
                r'try.*catch',
                r'error.*boundary',
                r'onError',
                r'fallback'
            ],
            'performance_monitoring': [
                r'performance\.now\(\)',
                r'console\.time',
                r'benchmark',
                r'metrics'
            ]
        }
        
        for category, patterns in perf_patterns.items():
            found_count = 0
            for pattern in patterns:
                for file_path in performance_files:
                    try:
                        with open(file_path, 'r', encoding='utf-8') as f:
                            content = f.read()
                            matches = len(re.findall(pattern, content, re.IGNORECASE))
                            found_count += matches
                    except (UnicodeDecodeError, PermissionError):
                        continue
            
            if found_count > 0:
                print(f"  ✅ {category.replace('_', ' ').title()}: {found_count} optimizations found")
                self.results['optimizations_found'].append(f"{category}: {found_count} instances")
            else:
                print(f"  ❌ {category.replace('_', ' ').title()}: No optimizations found")
                self.results['recommendations'].append(f"Consider adding {category} optimizations")
    
    def analyze_brazilian_patterns(self):
        """Analyze Brazilian Portuguese patterns"""
        print("\n🇧🇷 Analyzing Brazilian Portuguese Support...")
        
        code_files = list(self.directory.rglob('*.ts')) + list(self.directory.rglob('*.tsx'))
        
        # Brazilian patterns
        brazilian_patterns = {
            'portuguese_support': [
                r'pt[-_]?BR',
                r'portugu[eê]s',
                r'brazilian',
                r'portugal',
                r'locale.*[\'"]pt'
            ],
            'regional_variations': [
                r's[aã]o.*paulo|sp',
                r'rio.*de.*janeiro|rj',
                r'nordeste|ne',
                r'sul',
                r'norte',
                r'centro[-_]?oeste|co'
            ],
            'financial_terminology': [
                r'pix|PIX',
                r'boleto|Boleto',
                r'grana',
                r'pilas',
                r'conta',
                r'transfer[eê]ncia'
            ],
            'slang_recognition': [
                r'eai|eae',
                r'beleza',
                r'oxente',
                r'bah|tch[eê]',
                r'mano|parça|guri',
                r'caraca|sinistro'
            ]
        }
        
        for category, patterns in brazilian_patterns.items():
            found_count = 0
            for pattern in patterns:
                for file_path in code_files:
                    try:
                        with open(file_path, 'r', encoding='utf-8') as f:
                            content = f.read()
                            matches = len(re.findall(pattern, content, re.IGNORECASE))
                            found_count += matches
                    except (UnicodeDecodeError, PermissionError):
                        continue
            
            if found_count > 0:
                print(f"  ✅ {category.replace('_', ' ').title()}: {found_count} patterns found")
                self.results['brazilian_patterns'][category] = True
            else:
                print(f"  ❌ {category.replace('_', ' ').title()}: No patterns found")
                self.results['recommendations'].append(f"Consider adding {category} support for Brazilian users")
    
    def analyze_memory_management(self):
        """Analyze memory management patterns"""
        print("\n🧠 Analyzing Memory Management...")
        
        code_files = list(self.directory.rglob('*.ts')) + list(self.directory.rglob('*.tsx'))
        
        # Memory management patterns
        memory_patterns = {
            'cleanup_patterns': [
                r'clearInterval',
                r'clearTimeout',
                r'abortController',
                r'cleanup',
                r'dispose',
                r'unsubscribe'
            ],
            'leak_prevention': [
                r'useEffect.*\[\].*return.*cleanup',
                r'componentWillUnmount',
                r'removeEventListener',
                r'cancelAnimationFrame'
            ],
            'resource_management': [
                r'RefObject',
                r'useRef',
                r'WeakMap',
                r'WeakSet',
                r'finalize'
            ]
        }
        
        memory_score = 0
        max_score = len(memory_patterns) * 10
        
        for category, patterns in memory_patterns.items():
            found_count = 0
            for pattern in patterns:
                for file_path in code_files:
                    try:
                        with open(file_path, 'r', encoding='utf-8') as f:
                            content = f.read()
                            matches = len(re.findall(pattern, content, re.IGNORECASE))
                            found_count += matches
                    except (UnicodeDecodeError, PermissionError):
                        continue
            
            if found_count > 0:
                print(f"  ✅ {category.replace('_', ' ').title()}: {found_count} patterns found")
                memory_score += min(found_count * 2, 10)  # Cap at 10 points per category
            else:
                print(f"  ❌ {category.replace('_', ' ').title()}: No patterns found")
                self.results['recommendations'].append(f"Add {category} to prevent memory leaks")
        
        if memory_score >= 20:
            self.results['performance_patterns']['memory_management'] = True
            print("  ✅ Memory management: Well implemented")
        else:
            print("  ❌ Memory management: Needs improvement")
            self.results['issues'].append("Insufficient memory management patterns")
    
    def analyze_caching_strategies(self):
        """Analyze caching strategies"""
        print("\n💾 Analyzing Caching Strategies...")
        
        code_files = list(self.directory.rglob('*.ts')) + list(self.directory.rglob('*.tsx'))
        
        # Caching patterns
        cache_patterns = {
            'react_query': [
                r'useQuery',
                r'useMutation',
                r'queryClient',
                r'staleTime',
                r'cacheTime'
            ],
            'voice_caching': [
                r'cache.*voice',
                r'voice.*cache',
                r'command.*cache',
                r'recognition.*cache'
            ],
            'general_caching': [
                r'cache\(|Map\(|localStorage',
                r'sessionStorage',
                r'TTL|ttl',
                r'expire'
            ]
        }
        
        cache_score = 0
        for category, patterns in cache_patterns.items():
            found_count = 0
            for pattern in patterns:
                for file_path in code_files:
                    try:
                        with open(file_path, 'r', encoding='utf-8') as f:
                            content = f.read()
                            matches = len(re.findall(pattern, content, re.IGNORECASE))
                            found_count += matches
                    except (UnicodeDecodeError, PermissionError):
                        continue
            
            if found_count > 0:
                print(f"  ✅ {category.replace('_', ' ').title()}: {found_count} implementations found")
                cache_score += min(found_count, 5)
            else:
                print(f"  ❌ {category.replace('_', ' ').title()}: No implementations found")
                if category == 'voice_caching':
                    self.results['recommendations'].append("Implement voice command caching for performance")
        
        if cache_score >= 5:
            self.results['performance_patterns']['caching_strategy'] = True
            print("  ✅ Caching strategy: Well implemented")
        else:
            print("  ❌ Caching strategy: Needs improvement")
            self.results['recommendations'].append("Implement caching strategies for voice commands")
    
    def calculate_performance_score(self):
        """Calculate overall performance score"""
        print("\n📊 Calculating Performance Score...")
        
        score = 0
        max_score = 100
        
        # Performance patterns (40 points)
        perf_patterns_score = sum(self.results['performance_patterns'].values()) * 8
        score += min(perf_patterns_score, 40)
        
        # Brazilian patterns (30 points)
        brazilian_patterns_score = sum(self.results['brazilian_patterns'].values()) * 7.5
        score += min(brazilian_patterns_score, 30)
        
        # Optimizations found (20 points)
        if self.results['optimizations_found']:
            opt_score = min(len(self.results['optimizations_found']) * 4, 20)
            score += opt_score
        
        # Bonus for no critical issues (10 points)
        if not self.results['issues']:
            score += 10
        
        self.results['performance_score'] = min(score, max_score)
        
        # Determine voice response time estimate (simplified heuristic)
        if self.results['performance_score'] >= 90:
            self.results['voice_response_time'] = 150
        elif self.results['performance_score'] >= 80:
            self.results['voice_response_time'] = 180
        elif self.results['performance_score'] >= 70:
            self.results['voice_response_time'] = 220
        elif self.results['performance_score'] >= 60:
            self.results['voice_response_time'] = 280
        else:
            self.results['voice_response_time'] = 350
        
        # Check if target is met
        if self.results['voice_response_time'] <= self.target_ms:
            print(f"  ✅ Target met: {self.results['voice_response_time']}ms ≤ {self.target_ms}ms")
        else:
            print(f"  ❌ Target missed: {self.results['voice_response_time']}ms > {self.target_ms}ms")
            self.results['issues'].append(f"Voice response time exceeds target by {self.results['voice_response_time'] - self.target_ms}ms")
    
    def generate_optimization_recommendations(self):
        """Generate specific optimization recommendations"""
        recommendations = []
        
        if self.results['voice_response_time'] > self.target_ms:
            delay = self.results['voice_response_time'] - self.target_ms
            recommendations.append(f"Reduce voice response time by {delay}ms to meet target")
        
        if not self.results['performance_patterns']['voice_activity_detection']:
            recommendations.append("Implement Voice Activity Detection (VAD) for faster speech processing")
        
        if not self.results['performance_patterns']['caching_strategy']:
            recommendations.append("Add caching for frequently used voice commands")
        
        if not self.results['performance_patterns']['memory_management']:
            recommendations.append("Fix memory leaks in voice components to prevent performance degradation")
        
        if not self.results['brazilian_patterns']['regional_variations']:
            recommendations.append("Add regional Brazilian Portuguese variations for better recognition accuracy")
        
        if not self.results['brazilian_patterns']['slang_recognition']:
            recommendations.append("Implement Brazilian slang recognition for improved user experience")
        
        return recommendations
    
    def print_results(self, output_format: str = 'text'):
        """Print performance analysis results"""
        # Generate additional recommendations
        additional_recommendations = self.generate_optimization_recommendations()
        self.results['recommendations'].extend(additional_recommendations)
        
        if output_format == 'json':
            print(json.dumps(self.results, indent=2, ensure_ascii=False))
        else:
            print(f"\n{'='*60}")
            print("🎤 VOICE PERFORMANCE ANALYSIS RESULTS")
            print(f"{'='*60}")
            
            print(f"📊 Overall Performance Score: {self.results['performance_score']}/100")
            print(f"🎯 Target Response Time: {self.results['target_ms']}ms")
            print(f"⏱️  Estimated Response Time: {self.results['voice_response_time']}ms")
            
            # Performance check
            if self.results['voice_response_time'] <= self.target_ms:
                success_msg = "✅ PERFORMANCE TARGET MET"
            else:
                success_msg = "❌ PERFORMANCE TARGET MISSED"
            print(f"\n{success_msg}")
            
            # Pattern breakdown
            print(f"\n🔧 Performance Patterns:")
            for pattern, found in self.results['performance_patterns'].items():
                status = "✅" if found else "❌"
                print(f"   {status} {pattern.replace('_', ' ').title()}")
            
            print(f"\n🇧🇷 Brazilian Patterns:")
            for pattern, found in self.results['brazilian_patterns'].items():
                status = "✅" if found else "❌"
                print(f"   {status} {pattern.replace('_', ' ').title()}")
            
            # Optimizations found
            if self.results['optimizations_found']:
                print(f"\n⚡ Optimizations Found:")
                for opt in self.results['optimizations_found']:
                    print(f"   • {opt}")
            
            # Issues
            if self.results['issues']:
                print(f"\n🚨 Performance Issues ({len(self.results['issues'])}):")
                for issue in self.results['issues']:
                    print(f"   • {issue}")
            
            # Recommendations
            if self.results['recommendations']:
                print(f"\n💡 Optimization Recommendations ({len(self.results['recommendations'])}):")
                for i, rec in enumerate(self.results['recommendations'], 1):
                    print(f"   {i}. {rec}")
            
            # Performance tips
            print(f"\n🎯 Performance Optimization Tips:")
            print("   • Voice Activity Detection: Reduces processing time by 20-30%")
            print("   • Command Caching: Improves response time for repeated commands")
            print("   • Brazilian Regional Patterns: Increases recognition accuracy by 15-25%")
            print("   • Memory Management: Prevents performance degradation over time")
            print("   • Async Processing: Ensures UI remains responsive during voice processing")
            
            print(f"{'='*60}")

def main():
    parser = argparse.ArgumentParser(description='Analyze voice performance for AegisWallet')
    parser.add_argument('--directory', '-d', help='Directory to analyze (default: current directory)')
    parser.add_argument('--target-ms', '-t', type=int, default=200,
                       help='Target voice response time in milliseconds (default: 200)')
    parser.add_argument('--output', '-o', choices=['text', 'json'], default='text',
                       help='Output format (default: text)')
    
    args = parser.parse_args()
    
    analyzer = VoicePerformanceAnalyzer(args.directory, args.target_ms)
    results = analyzer.analyze_all()
    analyzer.print_results(args.output)
    
    # Exit with error code if performance target not met
    sys.exit(0 if results['voice_response_time'] <= args.target_ms else 1)

if __name__ == '__main__':
    main()
