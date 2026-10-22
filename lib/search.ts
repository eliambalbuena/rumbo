import {tavily} from '@tavily/core';
import {cached} from './cache';
import {publicUrl,required,useMocks} from './config';
import {mockScholarships} from './mocks';
export async function search(query:string){if(useMocks())return mockScholarships().map(s=>({url:s.url,title:s.name,content:s.coverage}));return cached(['search-v1',query],async()=>{const r=await tavily({apiKey:required('TAVILY_API_KEY')}).search(query,{searchDepth:'basic',maxResults:5,includeAnswer:false,timeout:30});return r.results.filter(r=>publicUrl(r.url)).map(r=>({url:r.url,title:r.title,content:r.content}));});}
export async function extract(urls:string[]){const safe=urls.filter(publicUrl).slice(0,8);if(useMocks())return mockScholarships().filter(s=>safe.includes(s.url)).map(s=>({url:s.url,content:JSON.stringify(s)}));if(!safe.length)return [];return cached(['extract-v1',safe],async()=>{const r=await tavily({apiKey:required('TAVILY_API_KEY')}).extract(safe,{extractDepth:'basic',timeout:30});return r.results.filter(r=>safe.includes(r.url)).map(r=>({url:r.url,content:r.rawContent.slice(0,14000)}));});}
