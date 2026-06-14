"use client";

import { useCallback, useEffect, useState } from "react";
import { api, apiUrl, getToken } from "@/lib/api";
import { Modal } from "@/components/Modal";
import { CSVImporter } from "@/components/CSVImporter";
import { fmtDate } from "@/lib/format";

interface Contact {
  id: string;
  name: string;
  phone: string;
  tags: string[];
  gender?: string | null;
  birthday?: string | null;
  notes?: string | null;
}

const empty = { name: "", phone: "", tags: "", gender: "", birthday: "", notes: "" };

export default function ContactsPage() {
  const [items, setItems] = useState<Contact[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [showImport, setShowImport] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState<any>(empty);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [bulkTag, setBulkTag] = useState("");

  const load = useCallback(async () => {
    const params = new URLSearchParams({ page: String(page), pageSize: "50" });
    if (search) params.set("search", search);
    const r = await api<{ items: Contact[]; total: number }>(
      `/api/contacts?${params}`
    );
    setItems(r.items);
    setTotal(r.total);
    setSelected(new Set());
  }, [page, search]);

  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
  }, [load]);

  function toggle(id: string) {
    const next = new Set(selected);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelected(next);
  }

  async function save() {
    const payload = {
      name: form.name,
      phone: form.phone,
      tags: form.tags
        ? String(form.tags).split(",").map((t: string) => t.trim()).filter(Boolean)
        : [],
      gender: form.gender || null,
      birthday: form.birthday || null,
      notes: form.notes || null,
    };
    if (editingId) {
      await api(`/api/contacts/${editingId}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });
    } else {
      await api("/api/contacts", { method: "POST", body: JSON.stringify(payload) });
    }
    setShowAdd(false);
    setForm(empty);
    setEditingId(null);
    load();
  }

  function edit(c: Contact) {
    setEditingId(c.id);
    setForm({
      name: c.name,
      phone: c.phone,
      tags: c.tags.join(", "),
      gender: c.gender ?? "",
      birthday: c.birthday ? c.birthday.slice(0, 10) : "",
      notes: c.notes ?? "",
    });
    setShowAdd(true);
  }

  async function bulk(action: "delete" | "addTag" | "removeTag") {
    if (selected.size === 0) return;
    if (action === "delete" && !confirm(`Delete ${selected.size} contacts?`)) return;
    await api("/api/contacts/bulk", {
      method: "POST",
      body: JSON.stringify({ action, ids: [...selected], tag: bulkTag }),
    });
    load();
  }

  async function exportCsv() {
    // Fetch all (first 200) and download as CSV
    const r = await api<{ items: Contact[] }>("/api/contacts?pageSize=200");
    const header = "name,phone,tags,gender,birthday,notes\n";
    const rows = r.items
      .map((c) =>
        [c.name, c.phone, c.tags.join(";"), c.gender ?? "", c.birthday ?? "", c.notes ?? ""]
          .map((v) => `"${String(v).replace(/"/g, '""')}"`)
          .join(",")
      )
      .join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "contacts.csv";
    a.click();
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Contacts</h1>
          <p className="text-sm text-gray-500">{total} total contacts</p>
        </div>
        <div className="flex gap-2">
          <button className="btn-ghost" onClick={exportCsv}>
            ⬇ Export
          </button>
          <button className="btn-ghost" onClick={() => setShowImport(true)}>
            ⬆ Import CSV
          </button>
          <button
            className="btn-primary"
            onClick={() => {
              setForm(empty);
              setEditingId(null);
              setShowAdd(true);
            }}
          >
            + Add contact
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <input
          className="input max-w-xs"
          placeholder="Search name or phone…"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
        />
        {selected.size > 0 && (
          <div className="flex items-center gap-2 rounded-lg bg-gray-100 px-3 py-1.5 dark:bg-gray-800">
            <span className="text-sm">{selected.size} selected</span>
            <input
              className="input h-8 w-28"
              placeholder="tag"
              value={bulkTag}
              onChange={(e) => setBulkTag(e.target.value)}
            />
            <button className="btn-ghost h-8 py-1" onClick={() => bulk("addTag")}>
              Tag
            </button>
            <button className="btn-ghost h-8 py-1" onClick={() => bulk("removeTag")}>
              Untag
            </button>
            <button className="btn-danger h-8 py-1" onClick={() => bulk("delete")}>
              Delete
            </button>
          </div>
        )}
      </div>

      <div className="card overflow-x-auto p-0">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 text-left text-gray-400 dark:border-gray-800">
              <th className="p-3"></th>
              <th className="p-3">Name</th>
              <th className="p-3">Phone</th>
              <th className="p-3">Tags</th>
              <th className="p-3">Gender</th>
              <th className="p-3">Birthday</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {items.map((c) => (
              <tr
                key={c.id}
                className="border-b border-gray-50 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-800/50"
              >
                <td className="p-3">
                  <input
                    type="checkbox"
                    checked={selected.has(c.id)}
                    onChange={() => toggle(c.id)}
                  />
                </td>
                <td className="p-3 font-medium">{c.name}</td>
                <td className="p-3 text-gray-500">{c.phone}</td>
                <td className="p-3">
                  <div className="flex flex-wrap gap-1">
                    {c.tags.map((t) => (
                      <span
                        key={t}
                        className="badge bg-pink-50 text-pink-600 dark:bg-pink-900/30"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="p-3 text-gray-500">{c.gender ?? "—"}</td>
                <td className="p-3 text-gray-500">{fmtDate(c.birthday)}</td>
                <td className="p-3 text-right">
                  <button
                    className="text-gray-400 hover:text-gray-700"
                    onClick={() => edit(c)}
                  >
                    ✏️
                  </button>
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td colSpan={7} className="p-8 text-center text-gray-400">
                  No contacts found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {total > 50 && (
        <div className="flex items-center justify-center gap-3">
          <button
            className="btn-ghost"
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
          >
            Prev
          </button>
          <span className="text-sm text-gray-500">
            Page {page} of {Math.ceil(total / 50)}
          </span>
          <button
            className="btn-ghost"
            disabled={page >= Math.ceil(total / 50)}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </button>
        </div>
      )}

      <Modal
        open={showImport}
        onClose={() => setShowImport(false)}
        title="Import contacts from CSV"
      >
        <CSVImporter
          onDone={() => {
            load();
          }}
        />
      </Modal>

      <Modal
        open={showAdd}
        onClose={() => setShowAdd(false)}
        title={editingId ? "Edit contact" : "Add contact"}
        footer={
          <>
            <button className="btn-ghost" onClick={() => setShowAdd(false)}>
              Cancel
            </button>
            <button className="btn-primary" onClick={save}>
              Save
            </button>
          </>
        }
      >
        <div className="space-y-3">
          {[
            ["name", "Name", "text"],
            ["phone", "Phone (+country code)", "text"],
            ["tags", "Tags (comma separated)", "text"],
            ["birthday", "Birthday", "date"],
            ["notes", "Notes", "text"],
          ].map(([key, label, type]) => (
            <div key={key}>
              <label className="label">{label}</label>
              <input
                className="input"
                type={type}
                value={form[key]}
                onChange={(e) => setForm({ ...form, [key]: e.target.value })}
              />
            </div>
          ))}
          <div>
            <label className="label">Gender</label>
            <select
              className="input"
              value={form.gender}
              onChange={(e) => setForm({ ...form, gender: e.target.value })}
            >
              <option value="">—</option>
              <option value="female">Female</option>
              <option value="male">Male</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>
      </Modal>
    </div>
  );
}
