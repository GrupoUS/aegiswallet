import fs from 'node:fs';
import path from 'node:path';

const compatDir = 'node_modules/es-toolkit/compat';
const outputDir = 'src/lib/es-toolkit-compat';
const aliases = {};

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

const files = fs.readdirSync(compatDir).filter((f) => f.endsWith('.js'));

for (const file of files) {
  const name = path.basename(file, '.js');

  // Skip potential problematic ones or handle them
  if (name === 'function') continue; // Keyword

  const content = `
import { ${name} } from 'es-toolkit/compat';
export default ${name};
`;

  fs.writeFileSync(path.join(outputDir, `${name}.ts`), content);

  aliases[`es-toolkit/compat/${name}`] = path.resolve(process.cwd(), outputDir, `${name}.ts`);
  aliases[`es-toolkit/compat/${name}.js`] = path.resolve(process.cwd(), outputDir, `${name}.ts`);
}

console.log(JSON.stringify(aliases, null, 2));
