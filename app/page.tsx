import SiteLedger from '../components/site-ledger';
import { getSessionUser } from '@/lib/session';
import { isAdminEmail } from '@/lib/admin-auth';
import { isUserPremium } from '@/lib/premium';

export default async function HomePage() {
  const user = await getSessionUser();
  const premium = user ? await isUserPremium(user.id) : false;
  return <SiteLedger isAdmin={isAdminEmail(user?.email)} isPremiumUser={premium} />;
}
