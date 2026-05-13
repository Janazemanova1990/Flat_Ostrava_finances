import { db } from "@/db";
import { entries } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { EntrySection } from "@/components/entry-section";

export default async function IncomePage() {
  const rows = await db.select().from(entries)
    .where(eq(entries.section, "income"))
    .orderBy(desc(entries.date));

  return (
    <EntrySection
      title="Income"
      subtitle="Rent, deposits, reimbursements. Flag recurring rent for yield calculations."
      section="income"
      entries={rows}
      color="income"
    />
  );
}
