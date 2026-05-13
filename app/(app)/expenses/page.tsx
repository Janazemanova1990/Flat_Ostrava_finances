import { db } from "@/db";
import { entries } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { EntrySection } from "@/components/entry-section";

export default async function ExpensesPage() {
  const rows = await db.select().from(entries)
    .where(eq(entries.section, "ongoing"))
    .orderBy(desc(entries.date));

  return (
    <EntrySection
      title="Ongoing expenses"
      subtitle="Monthly and ad-hoc costs — mortgage, SVJ, utilities, repairs. Flag the recurring ones and mark tax-deductible entries for your accountant."
      section="ongoing"
      entries={rows}
      color="sage"
    />
  );
}
