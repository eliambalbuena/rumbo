import {extract} from '../search';
export async function extractPages(urls:string[],onDomain:(domain:string)=>void=()=>{}){
 for(const domain of new Set(urls.map(url=>new URL(url).hostname)))onDomain(domain);
 const pages=await extract(urls);if(!pages.length)throw new Error('Could not read candidate pages. Try again later.');return pages;
}
