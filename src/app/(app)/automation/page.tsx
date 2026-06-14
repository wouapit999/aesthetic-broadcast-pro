"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Modal } from "@/components/Modal";

interface Automation {
  id: string;
  name: string;
  trigger: string;
  delayHours: number;
  enabled: boolean;
  templateId?: string | null;
}

const TRIGGERS = [
  { v: "contact_created", l: "When a contact is added", icon: "🆕" },
  { v: "birthday", l: "On a contact's birthday", icon: "🎂" },
  { v: "tag_added", l: "When a tag is added", icon: "🏷️" },
  { v: "no_reply", l: "When a contact doesn't reply", icon: "🔔" },
];

export default function AutomationPage() {
  const [items, setItems] = useState<Automation[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<any>({
    name: "",
    trigger: "contact_created",
    templateId: "",
    delayHours: 0,
    enabled: true,
  });

  async function load() {
    const r = await api<{ items: Automation[] }>("/api/automations");
    setItems(r.items);
  }
  useEffect(() => {
    load();
    api("/api/templates").then((r: any) => setTemplates(r.items)).catch(() => {});
  }, []);

  async function save() {
    await api("/api/automations", {
      method: "POST",
      body: JSON.stringify({
        ...form,
        templateId: form.templateId || null,
        delayHours: Number(form.delayHours),
      }),
    });
    setOpen(false);
    load();
  }

  async function toggle(a: Automation) {
    await api(`/api/automations/${a.id}`, {
      method: "PUT",
      body: JSON.stringify({ enabled: !a.enabled }),
    });
    load();
  }

  async function del(id: string) {
    if (!confirm("Delete automation?")) return;
    await api(`/api/automations/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Automation</h1>
          <p className="text-sm text-gray-500">
            Trigger-based follow-ups that run on autopilot.
          </p>
        </div>
        <button className="btn-primary" onClick={() => setOpen(true)}>
          + New automation
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {items.map((a) => {
          const trig = TRIGGERS.find((t) => t.v === a.trigger);
          return (
            <div key={a.id} className="card flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{trig?.icon}</span>
                <div>
                  <h3 className="font-semibold">{a.name}</h3>
                  <p className="text-xs text-gray-400">
                    {trig?.l}
                    {a.delayHours ? ` · +${a.delayHours}h delay` : ""}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => toggle(a)}
                  className={`badge ${
                    a.enabled
                      ? "bg-green-100 text-green-700"
                      : "bg-gray-100 text-gray-500"
                  }`}
                >
                  {a.enabled ? "Enabled" : "Disabled"}
                </button>
                <button onClick={() => del(a.id)} className="text-gray-400 hover:text-red-600">
                  🗑
                </button>
              </div>
            </div>
          );
        })}
        {items.length === 0 && (
          <p className="text-sm text-gray-400">No automations yet.</p>
        )}
      </div>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="New automation"
        footer={
          <>
            <button className="btn-ghost" onClick={() => setOpen(false)}>
              Cancel
            </button>
            <button className="btn-primary" onClick={save} disabled={!form.name}>
              Create
            </button>
          </>
        }
      >
        <div className="space-y-3">
          <div>
            <label className="label">Name</label>
            <input
              className="input"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div>
            <label className="label">Trigger</label>
            <select
              className="input"
              value={form.trigger}
              onChange={(e) => setForm({ ...form, trigger: e.target.value })}
            >
              {TRIGGERS.map((t) => (
                <option key={t.v} value={t.v}>
                  {t.l}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Send template</label>
            <select
              className="input"
              value={form.templateId}
              onChange={(e) => setForm({ ...form, templateId: e.target.value })}
            >
              <option value="">— Select —</option>
              {templates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Delay (hours)</label>
            <input
              type="number"
              min={0}
              className="input"
              value={form.delayHours}
              onChange={(e) => setForm({ ...form, delayHours: e.target.value })}
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
