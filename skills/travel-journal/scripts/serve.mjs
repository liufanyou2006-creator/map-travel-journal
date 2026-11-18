#!/usr/bin/env node
import { createServer } from 'node:http';
import { readFile, stat, realpath } from 'node:fs/promises';
import { resolve, relative, isAbsolute, sep, extname } from 'node:path';

const args=process.argv.slice(2);
let directory,port=8000;
try {
  for(let i=0;i<args.length;i++) {
    if(args[i]==='--directory'&&args[i+1]) directory=args[++i];
    else if(args[i]==='--port'&&args[i+1]) port=Number(args[++i]);
    else throw Error('Usage: node serve.mjs --directory my-journal [--port 8000]');
  }
  if(!directory||!Number.isInteger(port)||port<1||port>65535) throw Error('Provide --directory and a port between 1 and 65535');
  const root=await realpath(resolve(directory));
  if(!(await stat(root)).isDirectory()) throw Error('--directory must be a folder');
  const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.jpg':'image/jpeg','.png':'image/png','.webp':'image/webp','.svg':'image/svg+xml','.ttf':'font/ttf','.txt':'text/plain; charset=utf-8','.md':'text/plain; charset=utf-8','.mp4':'video/mp4','.webm':'video/webm','.mp3':'audio/mpeg','.wav':'audio/wav','.m4a':'audio/mp4'};
  const server=createServer(async(req,res)=>{
    try {
      if(!['GET','HEAD'].includes(req.method)) {res.writeHead(405);res.end();return;}
      let path=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
      if(path.endsWith('/'))path+='index.html';
      const target=await realpath(resolve(root,'.'+path)),rel=relative(root,target);
      if(isAbsolute(rel)||rel==='..'||rel.startsWith('..'+sep)) {res.writeHead(403);res.end();return;}
      if(!(await stat(target)).isFile()) {res.writeHead(404);res.end();return;}
      const data=await readFile(target),type=types[extname(target).toLowerCase()]||'application/octet-stream';
      const headers={'Content-Type':type,'Cache-Control':'no-cache','X-Content-Type-Options':'nosniff','Accept-Ranges':'bytes'};
      if(req.headers.range) {
        const match=/^bytes=(\d*)-(\d*)$/.exec(req.headers.range);
        let start=match&&match[1]?Number(match[1]):0,end=match&&match[2]?Number(match[2]):data.length-1;
        if(match&&!match[1]&&match[2]) {start=Math.max(0,data.length-Number(match[2]));end=data.length-1;}
        if(!match||start>end||start>=data.length||end>=data.length) {res.writeHead(416,{'Content-Range':`bytes */${data.length}`});res.end();return;}
        res.writeHead(206,{...headers,'Content-Range':`bytes ${start}-${end}/${data.length}`,'Content-Length':end-start+1});
        res.end(req.method==='HEAD'?undefined:data.subarray(start,end+1));
      } else {res.writeHead(200,{...headers,'Content-Length':data.length});res.end(req.method==='HEAD'?undefined:data);}
    } catch(error) {res.writeHead(error instanceof URIError?400:404);res.end();}
  });
  server.on('error',error=>{console.error(error.message);process.exitCode=1;});
  server.listen(port,'127.0.0.1',()=>console.log(`Travel journal: http://127.0.0.1:${port} (Ctrl+C to stop)`));
} catch(error) {console.error(error.message);process.exitCode=1;}
