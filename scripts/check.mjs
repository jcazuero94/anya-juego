import { readdir } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url));
for(const file of await readdir(new URL('../docs/',import.meta.url))){
  if(!file.endsWith('.js'))continue;
  const result=spawnSync(process.execPath,['--check',`docs/${file}`],{cwd:root,stdio:'inherit'});
  if(result.status)process.exit(result.status);
}
console.log('Todos los módulos del juego tienen sintaxis válida.');
