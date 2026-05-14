import { db } from "@/db";
import { entries, attachments } from "@/db/schema";
import { eq, desc, inArray } from "drizzle-orm";
import { EntrySection } from "@/components/entry-section";

export const dynamic = "force-dynamic";

export default async function PurchasePage() {
  const rows = await db.select().from(entries)
    .where(eq(entries.section, "purchase"))
    .orderBy(desc(entries.date));

  const ids = rows.map((e) => e.id);
  const attachmentRows = ids.length > 0
    ? await db.select().from(attachments).where(inArray(attachments.entryId, ids))
    : [];

  const entriesWithAttachments = rows.map((e) => ({
    ...e,
    attachments: attachmentRows.filter((a) => a.entryId === e.id),
  }));

  return (
    <EntrySection
      title="Purchase costs"
      subtitle="One-off costs to acquire the property - escrow, fees, mortgage drawdown, renovation."
      section="purchase"
      entries={entriesWithAttachments}
      color="sage"
    />
  );
}
