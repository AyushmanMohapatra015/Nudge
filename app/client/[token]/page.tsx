import ClientPage from '@/components/client-page';
export default async function Page({ params }: { params: Promise<{ token: string }> }) { return <ClientPage token={(await params).token} />; }
