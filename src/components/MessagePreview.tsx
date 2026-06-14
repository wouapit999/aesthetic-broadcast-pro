"use client";

export function MessagePreview({
  message,
  mediaUrl,
  mediaType,
  businessName,
}: {
  message: string;
  mediaUrl?: string | null;
  mediaType?: string | null;
  businessName?: string;
}) {
  return (
    <div className="rounded-2xl bg-[#e5ddd5] p-4 dark:bg-gray-800">
      <div className="mx-auto max-w-xs">
        <div className="rounded-lg rounded-tl-none bg-white p-3 shadow dark:bg-gray-700">
          <p className="mb-1 text-xs font-semibold text-green-600">
            {businessName ?? "Your Business"}
          </p>
          {mediaUrl && mediaType === "image" && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={mediaUrl}
              alt="media"
              className="mb-2 max-h-40 w-full rounded object-cover"
            />
          )}
          {mediaUrl && mediaType === "document" && (
            <div className="mb-2 rounded bg-gray-100 p-2 text-xs text-gray-600 dark:bg-gray-600 dark:text-gray-200">
              📄 Attached document
            </div>
          )}
          {mediaUrl && mediaType === "video" && (
            <div className="mb-2 rounded bg-gray-100 p-2 text-xs text-gray-600 dark:bg-gray-600 dark:text-gray-200">
              🎬 Attached video
            </div>
          )}
          <p className="whitespace-pre-wrap break-words text-sm text-gray-800 dark:text-gray-100">
            {message || "Your message preview will appear here…"}
          </p>
          <p className="mt-1 text-right text-[10px] text-gray-400">
            {new Date().toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}{" "}
            ✓✓
          </p>
        </div>
      </div>
    </div>
  );
}
