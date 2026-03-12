import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import ProfileContent from './_components/ProfileContent';

export default async function ProfilePage() {
  const session = await auth.api.getSession({
    headers: await import('next/headers').then(h => h.headers())
  });

  if (!session) {
    redirect('/login');
  }

  return <ProfileContent user={session.user} />;
}
