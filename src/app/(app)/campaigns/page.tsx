"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Modal } from "@/components/Modal";
import { CampaignBuilder } from "@/components/CampaignBuilder";
import { fmtDateTime, STATUS_COLORS } from "@/lib/format";

interface Campaign {
  id: string;
  name: string;
  status: string;
  totalRecipients: number;
  sentCount: number;
  deliveredCount: number;
  readCount: number;
  failedCount: number;
  replyCount: number;
  scheduledAt?: string | null;
  createdAt: string;
  segment?: { name: string } | null;
}

export default function CampaignsPage() {
  const [items, setItems] = useState<Campaign[]>([]);
  const [showNew, setShowNew] = useState(false);
  const [detail, setDetail] = useState<any>(null);

  const load = useCallback(async () => {
    const r = await api<{ items: Campaign[] }>("/api/campaigns");
    setItems(r.items);
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, 5000); // live refresh while sending
    return () => clearInterval(t);
  }, [load]);

  async function openDetail(id: string) {
    const r = await api(`/api/campaigns/${id}`);
    setDetail(r);
  }

  async function send(id: string) {
    try {
      await api(`/api/campaigns/${id}/send`, { method: "POST" });
      load();
    } catch (e: any) {
      alert(e.message);
    }
  }

  async function del(id: string) {
    if (!confirm("Delete campaign?")) return;
    await api(`/api/campaigns/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Campaigns</h1>
          <p className="text-sm text-gray-500">
            Broadcast, schedule, and track in real time.
          </p>
        </div>
        <button className="btn-primary" onClick={() => setShowNew(true)}>
          + New campaign
        </button>
      </div>

      <div className="space-y-3">
        {items.map((c) => {
          const progress = c.totalRecipients
            ? Math.round(
                ((c.sentCount + c.failedCount) / c.totalRecipients) * 100
              )
            : 0;
          return (
            <div key={c.id} className="card">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{c.name}</h3>
                    <span className={`badge ${STATUS_COLORS[c.status] ?? ""}`}>
                      {c.status}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400">
                    {c.scheduledAt
                      ? `Scheduled ${fmtDateTime(c.scheduledAt)}`
                      : `Created ${fmtDateTime(c.createdAt)}`}
                    {c.segment ? ` · ${c.segment.name}` : ""}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button className="btn-ghost" onClick={() => openDetail(c.id)}>
                    Details
                  </button>
                  {["draft", "scheduled", "failed"].includes(c.status) && (
                    <button className="btn-primary" onClick={() => send(c.id)}>
                      Send
                    </button>
                  )}
                  <button
                    className="btn-ghost text-red-600"
                    onClick={() => del(c.id)}
                  >
                    🗑
                  </button>
                </div>
              </div>

              {c.totalRecipients > 0 && (
                <div className="mt-3">
                  <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${progress}%`,
                        background: "var(--color-primary)",
                      }}
                    />
                  </div>
                  <div className="mt-2 flex flex-wrap gap-4 text-xs text-gray-500">
                    <span>👥 {c.totalRecipients} recipients</span>
                    <span>📤 {c.sentCount} sent</span>
                    <span>✅ {c.deliveredCount} delivered</span>
                    <span>👁️ {c.readCount} read</span>
                    <span>💬 {c.replyCount} replies</span>
                    <span className="text-red-500">✗ {c.failedCount} failed</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
        {items.length === 0 && (
          <p className="text-sm text-gray-400">No campaigns yet.</p>
        )}
      </div>

      <Modal
        open={showNew}
        onClose={() => setShowNew(false)}
        title="New campaign"
        wide
      >
        <CampaignBuilder
          onSaved={() => {
            setShowNew(false);
            load();
          }}
        />
      </Modal>

      <Modal
        open={!!detail}
        onClose={() => setDetail(null)}
        title={detail?.campaign?.name ?? "Campaign"}
        wide
      >
        {detail && (
          <div className="space-y-4">
            <p className="whitespace-pre-wrap rounded-lg bg-gray-50 p-3 text-sm dark:bg-gray-800">
              {detail.campaign.message}
            </p>
            <div className="max-h-80 overflow-y-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-400">
                    <th className="pb-2">Contact</th>
                    <th className="pb-2">Phone</th>
                    <th className="pb-2">Status</th>
                    <th className="pb-2">Error</th>
                  </tr>
                </thead>
                <tbody>
                  {detail.logs.map((l: any) => (
                    <tr key={l.id} className="border-t border-gray-100 dark:border-gray-800">
                      <td className="py-1.5">{l.contact?.name}</td>
                      <td className="py-1.5 text-gray-500">{l.contact?.phone}</td>
                      <td className="py-1.5">
                        <span className={`badge ${STATUS_COLORS[l.status] ?? ""}`}>
                          {l.status}
                        </span>
                      </td>
                      <td className="py-1.5 text-xs text-red-500">{l.error ?? ""}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
