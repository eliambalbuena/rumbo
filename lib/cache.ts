import {createHash,randomUUID} from 'node:crypto';
import {mkdir,readFile,writeFile,rename} from 'node:fs/promises';
import path from 'node:path';
export async function cached<T>(key:unknown,fn:()=>Promise<T>,ttl=86400000):Promise<T>{
 const dir=path.join(process.cwd(),'.cache');const file=path.join(dir,createHash('sha256').update(JSON.stringify(key)).digest('hex')+'.json');
 try{const v=JSON.parse(await readFile(file,'utf8'));if(Date.now()-v.time<ttl)return v.data;}catch{}
 const data=await fn();try{await mkdir(dir,{recursive:true});const temp=file+'.'+randomUUID();await writeFile(temp,JSON.stringify({time:Date.now(),data}));await rename(temp,file);}catch{console.warn('Disk cache unavailable; continuing without cache.');}return data;
}
