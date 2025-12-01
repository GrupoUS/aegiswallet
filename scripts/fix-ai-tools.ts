#!/usr/bin/env bun
/**
 * Fix AI Tools Script
 * Updates all enhanced AI tools to use the new compatibility layer
 */

import { readFileSync, writeFileSync } from 'fs';
import { execSync } from 'child_process';

interface ToolFile {
  path: string;
  name: string;
  imports: string[];
}

const toolFiles: ToolFile[] = [
  {
    path: 'src/lib/ai/tools/enhanced/boletos.ts',
    name: 'Boletos',
    imports: ['createBrazilianFintechTool'],
  },
  {
    path: 'src/lib/ai/tools/enhanced/pix.ts',
    name: 'PIX',
    imports: ['createBrazilianFintechTool'],
  },
  {
    path: 'src/lib/ai/tools/enhanced/contacts.ts',
    name: 'Contacts',
    imports: ['createBrazilianFintechTool'],
  },
  {
    path: 'src/lib/ai/tools/enhanced/insights.ts',
    name: 'Insights',
    imports: ['createBrazilianFintechTool'],
  },
  {
    path: 'src/lib/ai/tools/enhanced/multimodal.ts',
    name: 'Multimodal',
    imports: ['createBrazilianFintechTool'],
  },
];

function fixToolFile(filePath: string): void {
  console.log(`🔧 Fixing ${filePath}...`);
  
  try {
    let content = readFileSync(filePath, 'utf8');
    
    // Replace import statement
    content = content.replace(
      "import { tool } from 'ai';",
      "import { createBrazilianFintechTool } from '@/lib/ai/compatibility';"
    );
    
    // Replace all tool({ with createBrazilianFintechTool({
    content = content.replace(/tool\(\{\s*description:/g, 'createBrazilianFintechTool({\n\t\t\t\tdescription:');
    
    // Replace inputSchema: with parameters:
    content = content.replace(/inputSchema:\s*z\.object\(/g, 'parameters: z.object(');
    
    // Remove the execute: from the parameters object and add it after
    const executeRegex = /\}),\s*execute:\s*async\s*\(\{([^}]+)\}\)\s*=>\s*{/g;
    content = content.replace(executeRegex, '}),\n\t\t\texecute: async ({$1}) => {');
    
    writeFileSync(filePath, content);
    console.log(`   ✅ Fixed ${filePath}`);
  } catch (error) {
    console.error(`   ❌ Error fixing ${filePath}:`, error);
  }
}

function fixComponentFile(filePath: string): void {
  console.log(`🔧 Fixing ${filePath}...`);
  
  try {
    let content = readFileSync(filePath, 'utf8');
    
    // Replace imports
    content = content.replace(
      /import type \{ ([^}]+) \} from 'ai';/g,
      "import type { $1 } from '@/lib/ai/compatibility';"
    );
    
    writeFileSync(filePath, content);
    console.log(`   ✅ Fixed ${filePath}`);
  } catch (error) {
    console.error(`   ❌ Error fixing ${filePath}:`, error);
  }
}

async function main() {
  console.log('🚀 Starting AI Tools Fix Process');
  console.log('================================');
  
  // Fix tool files
  console.log('\n📋 Fixing AI Tool Files:');
  toolFiles.forEach((file) => {
    fixToolFile(file.path);
  });
  
  // Fix component files
  console.log('\n🧩 Fixing AI Component Files:');
  const componentFiles = [
    'src/components/ai-elements/confirmation.tsx',
    'src/components/ai-elements/message.tsx', 
    'src/components/ai-elements/tool.tsx',
    'src/components/ai-elements/image.tsx',
    'src/hooks/useAIChat.ts',
    'src/components/ai-elements/context.tsx',
  ];
  
  componentFiles.forEach((file) => {
    fixComponentFile(file);
  });
  
  // Remove unused imports from test setup
  try {
    const setupDomPath = 'src/test/setup-dom.ts';
    let content = readFileSync(setupDomPath, 'utf8');
    
    // Remove unused imports
    content = content.replace(/import \{ act \} from ['"]react-dom\/testing-library['"];?\n/g, '');
    content = content.replace(/import React from ['"]react['"];?\n/g, '');
    
    writeFileSync(setupDomPath, content);
    console.log(`   ✅ Fixed ${setupDomPath}`);
  } catch (error) {
    console.log(`   ⚠️  Could not fix test setup: ${error}`);
  }
  
  console.log('\n🧪 Running TypeScript check...');
  try {
    execSync('bun run type-check', { stdio: 'pipe' });
    console.log('   ✅ TypeScript check passed!');
  } catch (error) {
    console.log('   ⚠️  TypeScript check failed - some manual fixes may be needed');
  }
  
  console.log('\n🎉 AI Tools Fix Process Completed!');
  console.log('================================');
  console.log('Next steps:');
  console.log('1. Review any remaining TypeScript errors');
  console.log('2. Test AI functionality manually');
  console.log('3. Run the test suite');
  console.log('4. Deploy to staging for validation');
}

main().catch(console.error);
