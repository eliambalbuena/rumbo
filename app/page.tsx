import RumboApp from '@/components/rumbo-app';import {useMocks} from '@/lib/config';
export const dynamic='force-dynamic';
export default function Home(){return <RumboApp mock={useMocks()}/>;}
