"use client";

export function LogoUploader({
  value,
  onChange,
}: {
  value?: string | null;
  onChange: (dataUrl: string) => void;
}) {
  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 1.5 * 1024 * 1024) {
      alert("Please use a logo under 1.5MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => onChange(String(reader.result));
    reader.readAsDataURL(file);
  }

  return (
    <div className="flex items-center gap-4">
      <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-xl border border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800">
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={value} alt="logo" className="h-full w-full object-cover" />
        ) : (
          <span className="text-2xl">✨</span>
        )}
      </div>
      <div>
        <input
          type="file"
          accept="image/png,image/jpeg,image/svg+xml"
          onChange={onFile}
          className="text-sm"
        />
        <p className="mt-1 text-xs text-gray-400">PNG, JPG or SVG · max 1.5MB</p>
      </div>
    </div>
  );
}
