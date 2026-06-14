"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useApp } from "@/components/Providers";
import { ColorPicker } from "@/components/ColorPicker";
import { LogoUploader } from "@/components/LogoUploader";

const LANGS = [
  { v: "en", l: "English" },
  { v: "fr", l: "French" },
  { v: "pt", l: "Portuguese" },
  { v: "sw", l: "Swahili" },
  { v: "ar", l: "Arabic" },
];
const COUNTRIES = [
  "Cameroon",
  "Mozambique",
  "South Africa",
  "Nigeria",
  "Kenya",
  "Custom",
];

function Section({
  title,
  desc,
  children,
}: {
  title: string;
  desc?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="card">
      <h2 className="text-lg font-semibold">{title}</h2>
      {desc && <p className="mb-4 text-sm text-gray-500">{desc}</p>}
      <div className={desc ? "" : "mt-4"}>{children}</div>
    </div>
  );
}

export default function SettingsPage() {
  const { settings: ctxSettings, refreshSettings, applyTheme, user, refreshUser } =
    useApp();
  const [s, setS] = useState<any>(null);
  const [saved, setSaved] = useState("");
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);

  // profile
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");

  useEffect(() => {
    api("/api/settings").then((data) => {
      setS(data);
      setEmail(user?.email ?? "");
    });
  }, [user]);

  function set(key: string, value: any) {
    const next = { ...s, [key]: value };
    setS(next);
    if (["primaryColor", "secondaryColor", "accentColor", "theme"].includes(key)) {
      applyTheme(next);
    }
  }

  async function save() {
    const payload = { ...s };
    delete payload.webhookCallbackUrl;
    // don't send masked token
    if (typeof payload.whatsappAccessToken === "string" && payload.whatsappAccessToken.startsWith("••"))
      delete payload.whatsappAccessToken;
    const updated = await api("/api/settings", {
      method: "PUT",
      body: JSON.stringify(payload),
    });
    setS(updated);
    await refreshSettings();
    setSaved("Settings saved ✓");
    setTimeout(() => setSaved(""), 2500);
  }

  async function testConnection() {
    setTesting(true);
    setTestResult(null);
    try {
      // make sure latest creds are saved first
      await save();
      const r = await api("/api/whatsapp/test", { method: "POST" });
      setTestResult(r);
      await refreshSettings();
    } catch (e: any) {
      setTestResult({ ok: false, detail: e.message });
    } finally {
      setTesting(false);
    }
  }

  async function saveProfile() {
    await api("/api/auth/me", {
      method: "PUT",
      body: JSON.stringify({
        email: email || undefined,
        password: password || undefined,
        currentPassword: currentPassword || undefined,
      }),
    });
    setPassword("");
    setCurrentPassword("");
    await refreshUser();
    setSaved("Profile updated ✓");
    setTimeout(() => setSaved(""), 2500);
  }

  async function exportData(kind: string) {
    const map: Record<string, string> = {
      contacts: "/api/contacts?pageSize=200",
      campaigns: "/api/campaigns",
    };
    const data = await api(map[kind]);
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${kind}.json`;
    a.click();
  }

  if (!s) return <p className="text-gray-500">Loading settings…</p>;

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Settings</h1>
          <p className="text-sm text-gray-500">
            Configure your shop, branding, and integrations.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {saved && <span className="text-sm text-green-600">{saved}</span>}
          <button className="btn-primary" onClick={save}>
            Save changes
          </button>
        </div>
      </div>

      {/* 1. Aesthetic Shop Configuration */}
      <Section title="🏪 Aesthetic Shop Configuration">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {[
            ["businessName", "Business name", "text"],
            ["businessPhone", "Business phone", "text"],
            ["businessAddress", "Address", "text"],
            ["openingHours", "Opening hours", "text"],
          ].map(([k, l, t]) => (
            <div key={k}>
              <label className="label">{l}</label>
              <input
                className="input"
                type={t}
                value={s[k] ?? ""}
                onChange={(e) => set(k, e.target.value)}
              />
            </div>
          ))}
          <div>
            <label className="label">Category</label>
            <select
              className="input"
              value={s.businessCategory ?? "Aesthetic"}
              onChange={(e) => set("businessCategory", e.target.value)}
            >
              <option>Aesthetic</option>
              <option>Beauty</option>
              <option>Spa</option>
              <option>Salon</option>
              <option>Clinic</option>
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="label">Description</label>
            <textarea
              className="input h-20"
              value={s.businessDescription ?? ""}
              onChange={(e) => set("businessDescription", e.target.value)}
            />
          </div>
        </div>
      </Section>

      {/* 2. Branding */}
      <Section title="🎨 Branding & Aesthetic Settings">
        <div className="space-y-4">
          <LogoUploader value={s.logoUrl} onChange={(v) => set("logoUrl", v)} />
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <ColorPicker
              label="Primary"
              value={s.primaryColor}
              onChange={(v) => set("primaryColor", v)}
            />
            <ColorPicker
              label="Secondary"
              value={s.secondaryColor}
              onChange={(v) => set("secondaryColor", v)}
            />
            <ColorPicker
              label="Accent"
              value={s.accentColor}
              onChange={(v) => set("accentColor", v)}
            />
          </div>
          <div className="flex items-center gap-3">
            <label className="label mb-0">Theme</label>
            <button
              className={`badge ${s.theme === "light" ? "text-white" : "bg-gray-100 text-gray-600"}`}
              style={s.theme === "light" ? { background: "var(--color-primary)" } : {}}
              onClick={() => set("theme", "light")}
            >
              ☀️ Light
            </button>
            <button
              className={`badge ${s.theme === "dark" ? "text-white" : "bg-gray-100 text-gray-600"}`}
              style={s.theme === "dark" ? { background: "var(--color-primary)" } : {}}
              onClick={() => set("theme", "dark")}
            >
              🌙 Dark
            </button>
          </div>
          <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-700">
            <p className="mb-2 text-xs text-gray-400">Theme preview</p>
            <div className="flex gap-2">
              <button className="btn-primary">Primary</button>
              <span
                className="badge text-white"
                style={{ background: "var(--color-secondary)" }}
              >
                Secondary
              </span>
              <span
                className="badge text-white"
                style={{ background: "var(--color-accent)" }}
              >
                Accent
              </span>
            </div>
          </div>
        </div>
      </Section>

      {/* 3. Localization */}
      <Section title="🌍 Localization Settings">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <div>
            <label className="label">Language</label>
            <select
              className="input"
              value={s.language}
              onChange={(e) => set("language", e.target.value)}
            >
              {LANGS.map((l) => (
                <option key={l.v} value={l.v}>
                  {l.l}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Country</label>
            <select
              className="input"
              value={s.country}
              onChange={(e) => set("country", e.target.value)}
            >
              {COUNTRIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Section>

      {/* 4. WhatsApp Cloud API */}
      <Section title="💬 WhatsApp Business API">
        <div className="space-y-3">
          {[
            ["whatsappBusinessAccountId", "Business Account ID"],
            ["whatsappPhoneNumberId", "Phone Number ID"],
            ["whatsappAccessToken", "Access Token"],
            ["whatsappWebhookToken", "Webhook Verify Token"],
          ].map(([k, l]) => (
            <div key={k}>
              <label className="label">{l}</label>
              <input
                className="input font-mono text-xs"
                value={s[k] ?? ""}
                onChange={(e) => set(k, e.target.value)}
              />
            </div>
          ))}
          <div>
            <label className="label">Webhook Callback URL (auto-generated)</label>
            <input
              className="input bg-gray-50 font-mono text-xs dark:bg-gray-800"
              readOnly
              value={s.webhookCallbackUrl ?? ""}
            />
          </div>
          <div className="flex items-center gap-3">
            <button className="btn-primary" onClick={testConnection} disabled={testing}>
              {testing ? "Testing…" : "Test connection"}
            </button>
            <span
              className={`badge ${
                s.whatsappConnected
                  ? "bg-green-100 text-green-700"
                  : "bg-gray-100 text-gray-500"
              }`}
            >
              {s.whatsappConnected ? "● Connected" : "○ Not connected"}
            </span>
            {testResult && (
              <span
                className={`text-sm ${testResult.ok ? "text-green-600" : "text-red-600"}`}
              >
                {testResult.ok
                  ? `OK — ${testResult.verifiedName ?? testResult.detail ?? ""}`
                  : testResult.detail}
              </span>
            )}
          </div>
        </div>
      </Section>

      {/* 5. Notifications */}
      <Section title="🔔 Notification Settings">
        <div className="space-y-2">
          {[
            ["notifyCampaignCompleted", "Campaign completed"],
            ["notifyCampaignFailed", "Campaign failed"],
            ["notifyNewContact", "New contact added"],
            ["notifyAutomation", "Automation triggered"],
            ["pushNotifications", "Browser push notifications"],
          ].map(([k, l]) => (
            <label key={k} className="flex items-center gap-3 text-sm">
              <input
                type="checkbox"
                checked={!!s[k]}
                onChange={(e) => set(k, e.target.checked)}
              />
              {l}
            </label>
          ))}
        </div>
      </Section>

      {/* 6. User Profile */}
      <Section title="👤 User Profile">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <div>
            <label className="label">Email</label>
            <input
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label className="label">Current password</label>
            <input
              type="password"
              className="input"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
            />
          </div>
          <div>
            <label className="label">New password</label>
            <input
              type="password"
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
        </div>
        <button className="btn-ghost mt-3" onClick={saveProfile}>
          Update profile
        </button>
      </Section>

      {/* 7. System */}
      <Section title="🛠️ System Settings">
        <div className="flex flex-wrap gap-2">
          <button className="btn-ghost" onClick={() => exportData("contacts")}>
            Export contacts (JSON)
          </button>
          <button className="btn-ghost" onClick={() => exportData("campaigns")}>
            Export campaigns (JSON)
          </button>
        </div>
        <p className="mt-3 text-xs text-gray-400">
          CSV import is available on the Contacts page. Backup &amp; restore and
          full system reset are reserved for the admin role.
        </p>
      </Section>
    </div>
  );
}
