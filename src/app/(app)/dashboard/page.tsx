"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { StatCard, StatsGrid } from "@/components/StatsCards";
import { fmtDate, STATUS_COLORS } from "@/lib/format";

export default function DashboardPage() {
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api("/api/dashboard/stats").then(setData).catch((e) => setError(e.message));
  }, []);

  if (error) return <p className="text-red-600">{error}</p>;
  if (!data) return <p className="text-gray-500">Loading dashboard…</p>;

  const m = data.messaging;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-sm text-gray-500">
          Real-time overview of your broadcasting performance.
        </p>
      </div>

      <StatsGrid>
        <StatCard label="Contacts" value={data.counts.contacts} icon="👥" />
        <StatCard label="Campaigns" value={data.counts.campaigns} icon="📣" />
        <StatCard label="Segments" value={data.counts.segments} icon="🎯" />
        <StatCard label="Templates" value={data.counts.templates} icon="📝" />
      </StatsGrid>

      <StatsGrid>
        <StatCard label="Messages Sent" value={m.sent} icon="📤" />
        <StatCard
          label="Delivered"
          value={m.delivered}
          sub={`${m.deliveryRate}% delivery rate`}
          icon="✅"
        />
        <StatCard
          label="Read"
          value={m.read}
          sub={`${m.readRate}% read rate`}
          icon="👁️"
        />
        <StatCard label="Replies" value={m.replies} icon="💬" />
      </StatsGrid>

      <div className="card">
        <h2 className="mb-4 text-lg font-semibold">Recent Campaigns</h2>
        {data.recentCampaigns.length === 0 ? (
          <p className="text-sm text-gray-500">No campaigns yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-400">
                  <th className="pb-2">Name</th>
                  <th className="pb-2">Status</th>
                  <th className="pb-2">Recipients</th>
                  <th className="pb-2">Delivered</th>
                  <th className="pb-2">Read</th>
                  <th className="pb-2">Created</th>
                </tr>
              </thead>
              <tbody>
                {data.recentCampaigns.map((c: any) => (
                  <tr key={c.id} className="border-t border-gray-100 dark:border-gray-800">
                    <td className="py-2 font-medium">{c.name}</td>
                    <td className="py-2">
                      <span className={`badge ${STATUS_COLORS[c.status] ?? ""}`}>
                        {c.status}
                      </span>
                    </td>
                    <td className="py-2">{c.totalRecipients}</td>
                    <td className="py-2">{c.deliveredCount}</td>
                    <td className="py-2">{c.readCount}</td>
                    <td className="py-2 text-gray-500">{fmtDate(c.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
