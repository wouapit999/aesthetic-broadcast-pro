"use client";

import { useState } from "react";
import { api } from "@/lib/api";

export function CSVImporter({ onDone }: { onDone: () => void }) {
  const [csv, setCsv] = useState("");
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setCsv(String(reader.result));
    reader.readAsText(file);
  }

  async function importNow() {
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const r = await api("/api/contacts/import", {
        method: "POST",
        body: JSON.stringify({ csv }),
      });
      setResult(r);
      onDone();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-gray-500">
        Upload a CSV with headers:{" "}
        <code className="rounded bg-gray-100 px-1 dark:bg-gray-800">
          name,phone,tags,gender,birthday,notes
        </code>
        . Tags separated by <code>;</code>.
      </p>
      <input type="file" accept=".csv,text/csv" onChange={onFile} className="input" />
      <textarea
        className="input h-32 font-mono text-xs"
        placeholder="…or paste CSV here"
        value={csv}
        onChange={(e) => setCsv(e.target.value)}
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
      {result && (
        <div className="rounded-lg bg-green-50 p-3 text-sm text-green-700">
          Imported <b>{result.created}</b> · Duplicates skipped{" "}
          <b>{result.duplicates}</b> · Invalid <b>{result.invalid}</b>
        </div>
      )}
      <button className="btn-primary w-full" disabled={!csv || loading} onClick={importNow}>
        {loading ? "Importing…" : "Import contacts"}
      </button>
    </div>
  );
}
