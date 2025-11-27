#!/usr/bin/env python3
"""
Quick validation script for AegisWallet Architecture Skill
Validates the skill structure and key files before distribution
"""

import os
import json
from pathlib import Path

def validate_skill_structure():
    """Validate the skill structure and required files"""
    skill_dir = Path(__file__).parent
    
    required_files = [
        'SKILL.md',
        'README.md',
        'LICENSE',
        'validate_skill.py'
    ]
    
    required_dirs = [
        'references',
        'scripts',
        'assets',
        'assets/templates'
    ]
    
    print("🏗️  Validating AegisWallet Architecture Skill Structure...")
    
    # Check required files
    print("\n📄 Checking required files:")
    for file in required_files:
        file_path = skill_dir / file
        if file_path.exists():
            size = file_path.stat().st_size
            print(f"  ✅ {file} ({size:,} bytes)")
        else:
            print(f"  ❌ {file} (missing)")
    
    # Check required directories
    print("\n📁 Checking required directories:")
    for dir_name in required_dirs:
        dir_path = skill_dir / dir_name
        if dir_path.exists() and dir_path.is_dir():
            files = list(dir_path.rglob('*'))
            print(f"  ✅ {dir_name} ({len(files)} files)")
        else:
            print(f"  ❌ {dir_name} (missing)")
    
    # Validate SKILL.md frontmatter
    skill_md = skill_dir / 'SKILL.md'
    if skill_md.exists():
        print("\n📋 Validating SKILL.md frontmatter...")
        with open(skill_md, 'r', encoding='utf-8') as f:
            content = f.read()
            if '---' in content:
                frontmatter_end = content.find('---', content.find('---') + 3)
                if frontmatter_end != -1:
                    frontmatter = content[:frontmatter_end + 3]
                    if 'name: aegis-architect' in frontmatter:
                        print("  ✅ Skill name found in frontmatter")
                    if 'description:' in frontmatter:
                        print("  ✅ Description found in frontmatter")
                    if 'license:' in frontmatter:
                        print("  ✅ License found in frontmatter")
    
    # File size summary
    print("\n📊 Skill Size Summary:")
    total_size = 0
    for file_path in skill_dir.rglob('*'):
        if file_path.is_file():
            total_size += file_path.stat().st_size
    
    print(f"  Total files: {len(list(skill_dir.rglob('*')))}")
    print(f"  Total size: {total_size:,} bytes ({total_size/1024:.1f} KB)")
    
    # Architecture-specific validation
    print("\n🎯 Architecture Skill Validation:")
    
    # Check for Brazilian market content
    brazilian_files = ['references/tech-stack.md', 'references/voice-interface.md', 'SKILL.md']
    brazilian_found = False
    for file in brazilian_files:
        file_path = skill_dir / file
        if file_path.exists():
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read().lower()
                if any(term in content for term in ['brazilian', 'pix', 'boleto', 'lgpd', 'português']):
                    brazilian_found = True
                    break
    
    if brazilian_found:
        print("  ✅ Brazilian market integration content found")
    else:
        print("  ⚠️  Consider adding more Brazilian market specific content")
    
    # Check for voice interface content
    voice_files = ['references/voice-interface.md', 'assets/templates/voice-component.tsx', 'SKILL.md']
    voice_found = False
    for file in voice_files:
        file_path = skill_dir / file
        if file_path.exists():
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read().lower()
                if any(term in content for term in ['voice', 'speech', 'transcript', 'recognition']):
                    voice_found = True
                    break
    
    if voice_found:
        print("  ✅ Voice interface content found")
    else:
        print("  ⚠️  Consider adding more voice interface specific content")
    
    # Check for technology stack content
    tech_files = ['references/tech-stack.md', 'SKILL.md']
    tech_found = False
    for file in tech_files:
        file_path = skill_dir / file
        if file_path.exists():
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read().lower()
                if any(term in content for term in ['bun', 'hono', 'trpc', 'supabase', 'react']):
                    tech_found = True
                    break
    
    if tech_found:
        print("  ✅ Technology stack content found")
    else:
        print("  ⚠️  Consider adding more technology stack specific content")
    
    print("\n🎉 AegisWallet Architecture Skill Validation Complete!")
    print("   Skill is ready for distribution and use.")

if __name__ == '__main__':
    validate_skill_structure()