"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Modal } from "@/components/Modal";
import { MessagePreview } from "@/components/MessagePreview";

interface Template {
  id: string;
  name: string;
  language: string;
  category: string;
  body: string;
  mediaUrl?: string | null;
}

const LANGS = [
  { v: "en", l: "English" },
  { v: "fr", l: "French" },
  { v: "pt", l: "Portuguese" },
  { v: "sw", l: "Swahili" },
  { v: "ar", l: "Arabic" },
];

export default function TemplatesPage() {
  const [items, setItems] = useState<Template[]>([]);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<any>({
    name: "",
    language: "en",
    category: "MARKETING",
    body: "",
    mediaUrl: "",
  });

  async function load() {
    const r = await api<{ items: Template[] }>("/api/templates");
    setItems(r.items);
  }
  useEffect(() => {
    load();
  }, []);

  async function save() {
    const payload = { ...form, mediaUrl: form.mediaUrl || null };
    if (editingId)
      await api(`/api/templates/${editingId}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });
    else
      await api("/api/templates", { method: "POST", body: JSON.stringify(payload) });
    setOpen(false);
    load();
  }

  async function del(id: string) {
    if (!confirm("Delete template?")) return;
    await api(`/api/templates/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Templates</h1>
          <p className="text-sm text-gray-500">
            Reusable, multi-language message templates.
          </p>
        </div>
        <button
          className="btn-primary"
          onClick={() => {
            setEditingId(null);
            setForm({
              name: "",
              language: "en",
              category: "MARKETING",
              body: "",
              mediaUrl: "",
            });
            setOpen(true);
          }}
        >
          + New template
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {items.map((t) => (
          <div key={t.id} className="card flex flex-col">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold">{t.name}</h3>
                <span className="badge bg-gray-100 text-gray-500 dark:bg-gray-800">
                  {t.language} · {t.category}
                </span>
              </div>
              <div className="flex gap-2 text-gray-400">
                <button
                  onClick={() => {
                    setEditingId(t.id);
                    setForm({ ...t, mediaUrl: t.mediaUrl ?? "" });
                    setOpen(true);
                  }}
                >
                  ✏️
                </button>
                <button onClick={() => del(t.id)} className="hover:text-red-600">
                  🗑
                </button>
              </div>
            </div>
            <p className="mt-3 line-clamp-4 whitespace-pre-wrap text-sm text-gray-600 dark:text-gray-300">
              {t.body}
            </p>
          </div>
        ))}
        {items.length === 0 && <p className="text-sm text-gray-400">No templates yet.</p>}
      </div>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editingId ? "Edit template" : "New template"}
        wide
        footer={
          <>
            <button className="btn-ghost" onClick={() => setOpen(false)}>
              Cancel
            </button>
            <button className="btn-primary" onClick={save} disabled={!form.name || !form.body}>
              Save
            </button>
          </>
        }
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-3">
            <div>
              <label className="label">Name</label>
              <input
                className="input"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="label">Language</label>
                <select
                  className="input"
                  value={form.language}
                  onChange={(e) => setForm({ ...form, language: e.target.value })}
                >
                  {LANGS.map((l) => (
                    <option key={l.v} value={l.v}>
                      {l.l}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Category</label>
                <select
                  className="input"
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                >
                  <option>MARKETING</option>
                  <option>UTILITY</option>
                  <option>AUTHENTICATION</option>
                </select>
              </div>
            </div>
            <div>
              <label className="label">Body</label>
              <textarea
                className="input h-32"
                value={form.body}
                onChange={(e) => setForm({ ...form, body: e.target.value })}
                placeholder="Use {{name}} and {{business}} as placeholders"
              />
            </div>
            <div>
              <label className="label">Media URL (optional)</label>
              <input
                className="input"
                value={form.mediaUrl}
                onChange={(e) => setForm({ ...form, mediaUrl: e.target.value })}
              />
            </div>
          </div>
          <div>
            <label className="label">Preview</label>
            <MessagePreview
              message={form.body}
              mediaUrl={form.mediaUrl}
              mediaType={form.mediaUrl ? "image" : null}
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
