import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Analytics from '@/components/analytics';
import { validSession } from '@/lib/auth';
import { mode } from '@/lib/store';
export const dynamic = 'force-dynamic';
export default async function Page() {
  if (mode() !== 'demo' && !validSession((await cookies()).get('nudge_session')?.value ?? '')) redirect('/');
  // Browser runtime licence, intentionally delivered to the vendor component.
  // Never pass PayPal/AI credentials or the owner token here.
  return <Analytics licenseKey={process.env.NUDGE_AG_STUDIO_LICENSE?.trim() || undefined} />;
}
