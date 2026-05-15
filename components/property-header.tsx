"use client";
import { useState } from "react";
import { Home, Pencil } from "lucide-react";
import { MetaEditor } from "@/components/meta-editor";
import type { Meta } from "@/db/schema";

export function PropertyHeader({ meta }: { meta: Meta }) {
  const [editing, setEditing] = useState(false);

  return (
    <header className="mb-8">
      <div className="flex items-center gap-2 mb-5" style={{ color: "rgba(30,58,74,0.5)", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.1em" }}>
        <Home size={12} />
        <span>Property Finance</span>
      </div>

      {editing ? (
        <MetaEditor meta={meta} onClose={() => setEditing(false)} />
      ) : (
        <div className="flex items-center gap-3">
          <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-medium tracking-tight leading-tight break-words" style={{ color: "#1E3A4A" }}>
            {meta.propertyName}
          </h1>
          <button
            onClick={() => setEditing(true)}
            className="inline-flex items-center gap-1 text-xs rounded-full px-3 py-1.5 shrink-0 transition-colors"
            style={{ color: "rgba(30,58,74,0.5)", border: "1px solid #E2D9CC" }}
          >
            <Pencil size={10} /> edit
          </button>
        </div>
      )}
    </header>
  );
}
