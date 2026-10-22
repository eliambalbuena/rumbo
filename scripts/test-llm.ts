import {z} from 'zod';import {generateJSON} from '../lib/llm';import {useMocks} from '../lib/config';
async function main(){if(useMocks()){console.log('Mock mode: no API call. Set USE_MOCKS=false to test Nemotron.');return;}console.log(await generateJSON('Return a short greeting.',{},z.object({greeting:z.string()})));}main().catch(e=>{console.error(e.message);process.exitCode=1;});
