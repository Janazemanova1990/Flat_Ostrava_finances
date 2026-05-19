export const dynamic = "force-dynamic";

import { db } from "@/db";
import { entries, meta, propertyValueHistory } from "@/db/schema";
import { desc } from "drizzle-orm";
import { Dashboard } from "@/components/dashboard/dashboard";

export default async function DashboardPage() {
  const [allEntries, metaRow, valueHistory] = await Promise.all([
    db.select().from(entries),
    db.query.meta.findFirst(),
    db.select().from(propertyValueHistory).orderBy(desc(propertyValueHistory.recordedAt)),
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
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  return <Dashboard meta={metaData} entries={allEntries} valueHistory={valueHistory} />;
}
