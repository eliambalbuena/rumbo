import {search} from '../search';
export async function searchCandidates(queries:string[]){const results=await Promise.allSettled(queries.map(search));const urls=[...new Set(results.flatMap(r=>r.status==='fulfilled'?r.value.map(x=>x.url):[]))];if(!urls.length)throw new Error('No sources found. Check your search configuration or try again.');return urls.slice(0,8);}
