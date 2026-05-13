import { NextResponse } from "next/server";
import { db } from "@/db";
import { entries } from "@/db/schema";
import JSZip from "jszip";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const format = searchParams.get("format") ?? "json";

  const [allEntries, metaRow] = await Promise.all([
    db.select().from(entries),
    db.query.meta.findFirst(),
  ]);

  if (format === "json") {
    const date = new Date().toISOString().slice(0, 10);
    return new Response(
      JSON.stringify({ version: 1, exportedAt: new Date().toISOString(), meta: metaRow, entries: allEntries }, null, 2),
      {
        headers: {
          "Content-Type": "application/json",
          "Content-Disposition": `attachment; filename="flat-finance-backup-${date}.json"`,
        },
      }
    );
  }

  if (format === "csv") {
    const bom = "﻿";
    const header = ["Section", "Date", "Category", "Description", "Amount (CZK)", "Recurring", "Tax Deductible", "Notes", "Invoice"];
    const rows = allEntries.map((e) => [
      e.section, e.date, e.category, e.description ?? "",
      e.amount, e.recurring ? "Yes" : "", e.taxDeductible ? "Yes" : "",
      e.notes ?? "", e.invoiceFilename ?? "",
    ]);
    const csv = [header, ...rows]
      .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const date = new Date().toISOString().slice(0, 10);
    return new Response(bom + csv, {
      headers: {
        "Content-Type": "text/csv;charset=utf-8",
        "Content-Disposition": `attachment; filename="flat-finance-${date}.csv"`,
      },
    });
  }

  if (format === "tax") {
    const year = searchParams.get("year") ?? new Date().getFullYear().toString();
    const section = searchParams.get("section") ?? "both";
    const taxOnly = searchParams.get("taxOnly") !== "false";

    const start = `${year}-01-01`;
    const end = `${year}-12-31`;

    const filtered = allEntries.filter((e) => {
      const inYear = (e.date ?? "") >= start && (e.date ?? "") <= end;
      const inSection = section === "both" ? e.section !== "purchase" : e.section === section;
      const isTax = !taxOnly || e.taxDeductible;
      return inYear && inSection && isTax;
    });

    const zip = new JSZip();
    const bom = "﻿";
    const header = ["Section", "Date", "Category", "Description", "Amount (CZK)", "Tax Deductible", "Notes", "Invoice"];
    const rows = filtered.map((e) => [
      e.section, e.date, e.category, e.description ?? "",
      e.amount, e.taxDeductible ? "Yes" : "", e.notes ?? "", e.invoiceFilename ?? "",
    ]);
    const csv = [header, ...rows]
      .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    zip.file("entries.csv", bom + csv);

    const invoiceFolder = zip.folder("invoices")!;
    await Promise.all(
      filtered
        .filter((e) => e.invoiceUrl && e.invoiceFilename)
        .map(async (e) => {
          try {
            const res = await fetch(e.invoiceUrl!);
            const buf = await res.arrayBuffer();
            const safeName = `${e.date}-${e.category}-${e.invoiceFilename}`.replace(/[^a-zA-Z0-9.\-_]/g, "_");
            invoiceFolder.file(safeName, buf);
          } catch { /* skip failed fetches */ }
        })
    );

    const zipBuf = await zip.generateAsync({ type: "nodebuffer" });
    return new Response(zipBuf as unknown as BodyInit, {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="flat-tax-export-${year}.zip"`,
      },
    });
  }

  return NextResponse.json({ error: "Unknown format" }, { status: 400 });
}
