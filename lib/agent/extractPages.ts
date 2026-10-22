import {extract} from '../search';
export async function extractPages(urls:string[]){const pages=await extract(urls);if(!pages.length)throw new Error('Could not read candidate pages. Try again later.');return pages;}
