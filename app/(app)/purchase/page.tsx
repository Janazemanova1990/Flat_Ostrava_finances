import { db } from "@/db";
import { entries } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { EntrySection } from "@/components/entry-section";

export default async function PurchasePage() {
  const rows = await db.select().from(entries)
    .where(eq(entries.section, "purchase"))
    .orderBy(desc(entries.date));

  return (
    <EntrySection
      title="Purchase costs"
      subtitle="One-off costs to acquire the property — escrow, fees, mortgage drawdown, renovation."
      section="purchase"
      entries={rows}
      color="sage"
    />
  );
}
