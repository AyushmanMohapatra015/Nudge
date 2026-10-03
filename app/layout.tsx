import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = { title: 'Nudge — agreed work, paid work', description: 'A scope and payments workspace for independent designers. Review changes, approve invoices, and follow up with confidence.' };
export default function Layout({ children }: { children: React.ReactNode }) { return <html lang="en"><body>{children}</body></html>; }
