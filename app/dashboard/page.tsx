import { getDashboardStats } from '@/lib/dashboard-data';
import DashboardContent from '@/components/dashboard/dashboard-content';

export default async function DashboardPage() {
  const stats = await getDashboardStats();

  if (!stats) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        No property data found.
      </div>
    );
  }

  return <DashboardContent stats={stats} />;
}
