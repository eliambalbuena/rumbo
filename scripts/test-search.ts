import {search,extract} from '../lib/search';
async function main(){const results=await search('site:daad.de official international study scholarships');console.log(results);if(results[0])console.log(await extract([results[0].url]));}main().catch(e=>{console.error(e.message);process.exitCode=1;});
