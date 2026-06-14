"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { MessagePreview } from "@/components/MessagePreview";
import { useApp } from "@/components/Providers";

export function CampaignBuilder({
  onSaved,
}: {
  onSaved: () => void;
}) {
  const { settings } = useApp();
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [mediaUrl, setMediaUrl] = useState("");
  const [mediaType, setMediaType] = useState("");
  const [audience, setAudience] = useState("all");
  const [audienceTags, setAudienceTags] = useState("");
  const [segmentId, setSegmentId] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [segments, setSegments] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    api("/api/segments").then((r: any) => setSegments(r.items)).catch(() => {});
    api("/api/templates").then((r: any) => setTemplates(r.items)).catch(() => {});
    api("/api/contacts/tags/all").then((r: any) => setTags(r.tags)).catch(() => {});
  }, []);

  async function generate() {
    if (!aiPrompt) return;
    setAiLoading(true);
    try {
      const r = await api<{ message: string }>("/api/ai/generate", {
        method: "POST",
        body: JSON.stringify({
          prompt: aiPrompt,
          language: settings?.language ?? "en",
          businessName: settings?.businessName,
          tone: "promotional",
        }),
      });
      setMessage(r.message);
    } finally {
      setAiLoading(false);
    }
  }

  async function save(send: boolean) {
    setSaving(true);
    setError("");
    try {
      const payload: any = {
        name,
        message,
        mediaUrl: mediaUrl || null,
        mediaType: mediaType || null,
        audience,
        audienceTags: audienceTags
          ? audienceTags.split(",").map((t) => t.trim()).filter(Boolean)
          : [],
        segmentId: segmentId || null,
        scheduledAt: scheduledAt ? new Date(scheduledAt).toISOString() : null,
      };
      const campaign = await api<any>("/api/campaigns", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      if (send) {
        await api(`/api/campaigns/${campaign.id}/send`, { method: "POST" });
      }
      onSaved();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
      <div className="space-y-3">
        <div>
          <label className="label">Campaign name</label>
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
        </div>

        <div>
          <label className="label">Template (optional)</label>
          <select
            className="input"
            onChange={(e) => {
              const t = templates.find((x) => x.id === e.target.value);
              if (t) {
                setMessage(t.body);
                if (t.mediaUrl) {
                  setMediaUrl(t.mediaUrl);
                  setMediaType("image");
                }
              }
            }}
          >
            <option value="">— Start from scratch —</option>
            {templates.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} ({t.language})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="label">Message</label>
          <textarea
            className="input h-28"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type your broadcast message…"
          />
        </div>

        <div className="rounded-lg border border-dashed border-pink-300 p-3">
          <label className="label">✨ AI message generator</label>
          <div className="flex gap-2">
            <input
              className="input"
              placeholder="e.g. 20% off facials this weekend"
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
            />
            <button className="btn-primary" onClick={generate} disabled={aiLoading}>
              {aiLoading ? "…" : "Generate"}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="label">Media URL (optional)</label>
            <input
              className="input"
              value={mediaUrl}
              onChange={(e) => setMediaUrl(e.target.value)}
              placeholder="https://…"
            />
          </div>
          <div>
            <label className="label">Media type</label>
            <select
              className="input"
              value={mediaType}
              onChange={(e) => setMediaType(e.target.value)}
            >
              <option value="">None</option>
              <option value="image">Image</option>
              <option value="video">Video</option>
              <option value="document">Document</option>
            </select>
          </div>
        </div>

        <div>
          <label className="label">Audience</label>
          <select
            className="input"
            value={audience}
            onChange={(e) => setAudience(e.target.value)}
          >
            <option value="all">All contacts</option>
            <option value="tags">By tags</option>
            <option value="segment">By segment</option>
          </select>
        </div>

        {audience === "tags" && (
          <div>
            <label className="label">Tags (comma separated)</label>
            <input
              className="input"
              value={audienceTags}
              onChange={(e) => setAudienceTags(e.target.value)}
              placeholder={tags.slice(0, 3).join(", ")}
            />
          </div>
        )}
        {audience === "segment" && (
          <div>
            <label className="label">Segment</label>
            <select
              className="input"
              value={segmentId}
              onChange={(e) => setSegmentId(e.target.value)}
            >
              <option value="">— Select —</option>
              {segments.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.contactCount})
                </option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label className="label">Schedule (optional)</label>
          <input
            type="datetime-local"
            className="input"
            value={scheduledAt}
            onChange={(e) => setScheduledAt(e.target.value)}
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex gap-2 pt-2">
          <button className="btn-ghost" disabled={saving || !name} onClick={() => save(false)}>
            Save draft
          </button>
          <button
            className="btn-primary"
            disabled={saving || !name || !message}
            onClick={() => save(true)}
          >
            {scheduledAt ? "Schedule" : "Send now"}
          </button>
        </div>
      </div>

      <div>
        <label className="label">Preview</label>
        <MessagePreview
          message={message}
          mediaUrl={mediaUrl}
          mediaType={mediaType}
          businessName={settings?.businessName}
        />
      </div>
    </div>
  );
}
