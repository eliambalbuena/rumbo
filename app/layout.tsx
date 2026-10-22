import type {Metadata} from 'next';import './globals.css';
export const metadata:Metadata={title:'Rumbo — Find your way forward',description:'Find international scholarships, understand trust signals and build your application plan.'};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}</body></html>;}
