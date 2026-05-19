import { db } from "@/db";
import { entries, attachments } from "@/db/schema";
import { desc, inArray, or, eq } from "drizzle-orm";
import { CombinedExpensesSection } from "@/components/combined-expenses-section";

export const dynamic = "force-dynamic";

export default async function ExpensesPage() {
  const rows = await db.select().from(entries)
    .where(or(eq(entries.section, "ongoing"), eq(entries.section, "purchase")))
    .orderBy(desc(entries.date));

  const ids = rows.map((e) => e.id);
  const attachmentRows = ids.length > 0
    ? await db.select().from(attachments).where(inArray(attachments.entryId, ids))
    : [];

  const entriesWithAttachments = rows.map((e) => ({
    ...e,
    attachments: attachmentRows.filter((a) => a.entryId === e.id),
  }));

  return <CombinedExpensesSection entries={entriesWithAttachments} />;
}
