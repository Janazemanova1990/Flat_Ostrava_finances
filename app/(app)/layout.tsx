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
      <footer className="mt-16 pt-6 border-t border-[#d4e0d4] flex gap-2">
        <a href="/api/export?format=json" className="flex items-center gap-1.5 bg-white border border-[#d4e0d4] text-[#5f7a5f] text-xs font-medium px-3 py-1.5 rounded-lg hover:border-[#3d5c3d]">
          ↓ Backup JSON
        </a>
        <a href="/api/export?format=csv" className="flex items-center gap-1.5 bg-white border border-[#d4e0d4] text-[#5f7a5f] text-xs font-medium px-3 py-1.5 rounded-lg hover:border-[#3d5c3d]">
          ↓ CSV
        </a>
      </footer>
    </div>
  );
}
