import { ReservesTable } from "@/components/ReservesTable";
import { copy } from "@/lib/copy";

export default function DashboardPage() {
  return (
    <section className="px-6 py-16 max-w-2xl mx-auto">
      <h1 className="font-display text-3xl text-ink mb-2">
        {copy.dashboard.heading}
      </h1>
      <p className="text-sm text-ink/60 mb-8">{copy.dashboard.disclaimer}</p>
      <ReservesTable />
    </section>
  );
}
