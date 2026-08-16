import SiteLedger from '../components/site-ledger';
import { getSessionUser } from '@/lib/session';
import { isAdminEmail } from '@/lib/admin-auth';

export default async function HomePage() {
  const user = await getSessionUser();
  return <SiteLedger isAdmin={isAdminEmail(user?.email)} />;
}
