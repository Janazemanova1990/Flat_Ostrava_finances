export const dynamic = "force-dynamic";

import { db } from "@/db";
import { entries, meta } from "@/db/schema";
import { Dashboard } from "@/components/dashboard/dashboard";

export default async function DashboardPage() {
  const [allEntries, metaRow] = await Promise.all([
    db.select().from(entries),
    db.query.meta.findFirst(),
  ]);

  const metaData = metaRow ?? {
    id: 1,
    propertyName: "Ostrava - Nádražní 2965/9",
    purchasePrice: "0",
    mortgageAmount: "0",
    targetMonthlyRent: "0",
    sizeM2: "0",
    mortgageRate: "0",
    mortgageTermYears: 30,
    mortgageStartDate: null,
    mortgageRateFixedUntil: null,
    currentPropertyValue: null,
    currentPropertyValueUpdatedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  return <Dashboard meta={metaData} entries={allEntries} />;
}
