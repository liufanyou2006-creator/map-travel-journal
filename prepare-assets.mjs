// Fetch only public, licensed demo assets. No credentials or private journal data.
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
const root=dirname(fileURLToPath(import.meta.url));
const origin='https://travel-journal-interview-demo.goldenbean22.chatgpt.site/';
const files=JSON.parse(await (await import('node:fs/promises')).readFile(resolve(root,'asset-manifest.json'),'utf8'));
for(const path of files){
  if(!path.startsWith('assets/')||path.includes('..'))throw Error('Invalid public asset path');
  const response=await fetch(new URL(path,origin));
  if(!response.ok)throw Error(`Asset unavailable: ${path} (${response.status})`);
  const target=resolve(root,'dist',path);
  await mkdir(dirname(target),{recursive:true});
  await writeFile(target,new Uint8Array(await response.arrayBuffer()));
  console.log(`Ready: ${path}`);
}
