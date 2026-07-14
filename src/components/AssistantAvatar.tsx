import Image from "next/image";
import { useEffect, useSyncExternalStore } from "react";

const AVATAR_FILES = [
  "image1.png",
  "image2.png",
  "image3.png",
  "Image4.png",
  "image5.png",
];


let pickedAvatarSrc: string | null = null;
const listeners = new Set<() => void>();

function pickAvatarSrc(): string {
  const file = AVATAR_FILES[Math.floor(Math.random() * AVATAR_FILES.length)];
  return `/avatar/${file}`;
}

// Only call this from an effect (client-only) - never at module import
// time, which would run during SSR and get baked into the server bundle
// instead of varying per page load.
function ensureAvatarPicked(): void {
  if (pickedAvatarSrc !== null) return;
  pickedAvatarSrc = pickAvatarSrc();
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot(): string | null {
  return pickedAvatarSrc;
}

// Always `null` server-side (matches the pre-pick state), so hydration
// never mismatches - the client swaps to the real value right after mount,
// same "resolve after mount" pattern already used for theme elsewhere in
// this app (see ThemeSwitch.tsx/MobileHeader.tsx's `mounted` gating).
function getServerSnapshot(): null {
  return null;
}

function useAssistantAvatarSrc(fallback: string): string {
  const src = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  useEffect(() => {
    ensureAvatarPicked();
  }, []);

  return src ?? fallback;
}

interface AssistantAvatarProps {
  className?: string;
  size?: number;
}

export default function AssistantAvatar({ className = "h-8 w-8", size = 32 }: AssistantAvatarProps) {
  const src = useAssistantAvatarSrc("/assistant-avatar.avif");

  return (
    <Image
      src={src}
      alt="AI assistant avatar"
      width={size}
      height={size}
      className={`shrink-0 rounded-full object-cover ${className}`}
      priority
    />
  );
}
