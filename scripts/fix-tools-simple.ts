#!/usr/bin/env bun
/**
 * Simple AI Tools Fix Script
 * Updates tool definitions to use the correct AI SDK API
 */

import { readFileSync, writeFileSync } from 'fs';

function fixToolFile(filePath: string): void {
  console.log(`🔧 Fixing ${filePath}...`);
  
  try {
    let content = readFileSync(filePath, 'utf8');
    
    // Replace inputSchema with parameters
    content = content.replace(/inputSchema:\s*z\.object\(/g, 'parameters: z.object(');
    
    writeFileSync(filePath, content);
    console.log(`   ✅ Fixed ${filePath}`);
  } catch (error) {
    console.error(`   ❌ Error fixing ${filePath}:`, error);
  }
}

async function main() {
  console.log('🚀 Starting Simple AI Tools Fix');
  console.log('================================');
  
  const toolFiles = [
    'src/lib/ai/tools/enhanced/boletos.ts',
    'src/lib/ai/tools/enhanced/pix.ts',
    'src/lib/ai/tools/enhanced/contacts.ts',
    'src/lib/ai/tools/enhanced/insights.ts',
    'src/lib/ai/tools/enhanced/multimodal.ts',
  ];
  
  console.log('\n📋 Fixing Tool Files:');
  toolFiles.forEach((file) => {
    fixToolFile(file);
  });
  
  console.log('\n🧪 Running TypeScript check...');
  try {
    const { execSync } = await import('child_process');
    execSync('bun run type-check', { stdio: 'pipe' });
    console.log('   ✅ TypeScript check passed!');
  } catch (error) {
    console.log('   ⚠️  TypeScript check still has errors - manual review needed');
  }
  
  console.log('\n🎉 Simple AI Tools Fix Completed!');
}

main().catch(console.error);
