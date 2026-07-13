interface StatusBadgeProps {
  online: boolean | null;
}

// `online` starts `null` on mount and is set to a definitive true/false as
// soon as `checkHealth()` resolves (see `page.tsx`) - `null` only ever
// represents that brief in-flight window, which is what "Connecting..."
// communicates here.
export default function StatusBadge({ online }: StatusBadgeProps) {
  const label =
    online === null ? "Connecting..." : online ? "Online" : "Offline";

  const dotColor =
    online === null
      ? "bg-orange-500"
      : online
        ? "bg-green-500"
        : "bg-red-500";

  const textColor =
    online === null
      ? "text-orange-600 dark:text-orange-400"
      : online
        ? "text-green-600 dark:text-green-400"
        : "text-red-600 dark:text-red-400";

  return (
    <div className="flex items-center gap-2 text-xs font-medium">
      <span className="relative flex h-2 w-2">
        {online === null && (
          <span
            className={`absolute inline-flex h-full w-full animate-ping rounded-full ${dotColor} opacity-75`}
          />
        )}
        <span
          className={`relative inline-flex h-2 w-2 rounded-full ${dotColor} ${
            online === null ? "animate-pulse" : ""
          }`}
        />
      </span>
      <span className={textColor}>{label}</span>
    </div>
  );
}
