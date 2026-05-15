export const dynamic = "force-dynamic";

import { db } from "@/db";
import { PropertyHeader } from "@/components/property-header";
import { TabNav } from "@/components/tab-nav";
import { meta } from "@/db/schema";

async function getMeta() {
  let row = await db.query.meta.findFirst();
  if (!row) {
    const [inserted] = await db.insert(meta).values({ id: 1 }).returning();
    row = inserted;
  }
  return row;
}

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const metaRow = await getMeta();
  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-10">
      <PropertyHeader meta={metaRow} />
      <TabNav />
      <main>{children}</main>
      <footer className="mt-16 pt-6 flex gap-2" style={{ borderTop: "1px solid #E2D9CC" }}>
        <a href="/api/export?format=json" className="flex items-center gap-1.5 bg-white text-xs font-medium px-3 py-1.5 rounded-lg" style={{ border: "1px solid #E2D9CC", color: "rgba(30,58,74,0.6)" }}>
          ↓ Backup JSON
        </a>
        <a href="/api/export?format=csv" className="flex items-center gap-1.5 bg-white text-xs font-medium px-3 py-1.5 rounded-lg" style={{ border: "1px solid #E2D9CC", color: "rgba(30,58,74,0.6)" }}>
          ↓ CSV
        </a>
      </footer>
    </div>
  );
}
