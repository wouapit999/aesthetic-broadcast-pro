"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Modal } from "@/components/Modal";
import { SegmentBuilder, Condition } from "@/components/SegmentBuilder";

interface Segment {
  id: string;
  name: string;
  rules: { combinator?: "AND" | "OR"; conditions?: Condition[] };
  contactCount: number;
}

export default function SegmentsPage() {
  const [items, setItems] = useState<Segment[]>([]);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [combinator, setCombinator] = useState<"AND" | "OR">("AND");
  const [conditions, setConditions] = useState<Condition[]>([
    { field: "tags", op: "contains", value: "" },
  ]);

  async function load() {
    const r = await api<{ items: Segment[] }>("/api/segments");
    setItems(r.items);
  }
  useEffect(() => {
    load();
  }, []);

  function newSegment() {
    setEditingId(null);
    setName("");
    setCombinator("AND");
    setConditions([{ field: "tags", op: "contains", value: "" }]);
    setOpen(true);
  }

  function editSegment(s: Segment) {
    setEditingId(s.id);
    setName(s.name);
    setCombinator(s.rules.combinator ?? "AND");
    setConditions(
      s.rules.conditions?.length
        ? s.rules.conditions
        : [{ field: "tags", op: "contains", value: "" }]
    );
    setOpen(true);
  }

  async function save() {
    const payload = { name, rules: { combinator, conditions } };
    if (editingId)
      await api(`/api/segments/${editingId}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });
    else
      await api("/api/segments", { method: "POST", body: JSON.stringify(payload) });
    setOpen(false);
    load();
  }

  async function del(id: string) {
    if (!confirm("Delete this segment?")) return;
    await api(`/api/segments/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Segments</h1>
          <p className="text-sm text-gray-500">
            Dynamic audiences with unlimited rules.
          </p>
        </div>
        <button className="btn-primary" onClick={newSegment}>
          + New segment
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((s) => (
          <div key={s.id} className="card">
            <div className="flex items-start justify-between">
              <h3 className="font-semibold">{s.name}</h3>
              <div className="flex gap-2 text-gray-400">
                <button onClick={() => editSegment(s)}>✏️</button>
                <button onClick={() => del(s.id)} className="hover:text-red-600">
                  🗑
                </button>
              </div>
            </div>
            <p className="mt-2 text-3xl font-bold" style={{ color: "var(--color-primary)" }}>
              {s.contactCount}
            </p>
            <p className="text-xs text-gray-400">matching contacts</p>
            <div className="mt-3 flex flex-wrap gap-1">
              {s.rules.conditions?.map((c, i) => (
                <span key={i} className="badge bg-gray-100 text-gray-600 dark:bg-gray-800">
                  {c.field} {c.op} {c.value}
                </span>
              ))}
            </div>
          </div>
        ))}
        {items.length === 0 && (
          <p className="text-sm text-gray-400">No segments yet.</p>
        )}
      </div>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editingId ? "Edit segment" : "New segment"}
        wide
        footer={
          <>
            <button className="btn-ghost" onClick={() => setOpen(false)}>
              Cancel
            </button>
            <button className="btn-primary" onClick={save} disabled={!name}>
              Save segment
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="label">Segment name</label>
            <input
              className="input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. VIP Clients"
            />
          </div>
          <SegmentBuilder
            combinator={combinator}
            conditions={conditions}
            onChange={(c, cond) => {
              setCombinator(c);
              setConditions(cond);
            }}
          />
        </div>
      </Modal>
    </div>
  );
}
