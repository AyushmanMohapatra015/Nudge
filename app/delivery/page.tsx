import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Delivery from '@/components/delivery';
import { validSession } from '@/lib/auth';
import { mode } from '@/lib/store';
import './delivery.css';

export const dynamic = 'force-dynamic';
export default async function Page() {
  if (mode() !== 'demo' && !validSession((await cookies()).get('nudge_session')?.value ?? '')) redirect('/');
  return <Delivery />;
}
