"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";

export interface Condition {
  field: string;
  op: string;
  value: string;
}

const FIELDS = [
  { value: "tags", label: "Tag" },
  { value: "gender", label: "Gender" },
  { value: "name", label: "Name" },
  { value: "notes", label: "Notes" },
  { value: "phone", label: "Phone" },
];

const OPS = [
  { value: "contains", label: "contains" },
  { value: "equals", label: "equals" },
  { value: "not_contains", label: "does not contain" },
  { value: "starts_with", label: "starts with" },
];

export function SegmentBuilder({
  combinator,
  conditions,
  onChange,
}: {
  combinator: "AND" | "OR";
  conditions: Condition[];
  onChange: (combinator: "AND" | "OR", conditions: Condition[]) => void;
}) {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    const t = setTimeout(async () => {
      try {
        const r = await api<{ count: number }>("/api/segments/preview", {
          method: "POST",
          body: JSON.stringify({ rules: { combinator, conditions } }),
        });
        setCount(r.count);
      } catch {
        setCount(null);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [combinator, conditions]);

  function update(i: number, patch: Partial<Condition>) {
    const next = conditions.map((c, idx) => (idx === i ? { ...c, ...patch } : c));
    onChange(combinator, next);
  }
  function add() {
    onChange(combinator, [...conditions, { field: "tags", op: "contains", value: "" }]);
  }
  function remove(i: number) {
    onChange(
      combinator,
      conditions.filter((_, idx) => idx !== i)
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm">
        <span>Match</span>
        <select
          className="input h-9 w-auto"
          value={combinator}
          onChange={(e) => onChange(e.target.value as "AND" | "OR", conditions)}
        >
          <option value="AND">ALL</option>
          <option value="OR">ANY</option>
        </select>
        <span>of these rules:</span>
      </div>

      {conditions.map((c, i) => (
        <div key={i} className="flex flex-wrap items-center gap-2">
          <select
            className="input h-9 w-32"
            value={c.field}
            onChange={(e) => update(i, { field: e.target.value })}
          >
            {FIELDS.map((f) => (
              <option key={f.value} value={f.value}>
                {f.label}
              </option>
            ))}
          </select>
          <select
            className="input h-9 w-44"
            value={c.op}
            onChange={(e) => update(i, { op: e.target.value })}
          >
            {OPS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <input
            className="input h-9 flex-1"
            placeholder="value"
            value={c.value}
            onChange={(e) => update(i, { value: e.target.value })}
          />
          <button
            className="text-gray-400 hover:text-red-600"
            onClick={() => remove(i)}
          >
            ✕
          </button>
        </div>
      ))}

      <button className="btn-ghost" onClick={add}>
        + Add rule
      </button>

      <div className="rounded-lg bg-pink-50 px-3 py-2 text-sm text-pink-700 dark:bg-pink-900/20">
        {count === null
          ? "Calculating…"
          : `${count} contact${count === 1 ? "" : "s"} match this segment`}
      </div>
    </div>
  );
}
