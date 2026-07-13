"use client";

import { useEffect, useRef, useState } from "react";
import AssistantAvatar from "@/components/AssistantAvatar";
import ChatInput from "@/components/ChatInput";
import ChatMessageBubble from "@/components/ChatMessageBubble";
import HelpButton from "@/components/HelpButton";
import MobileHeader from "@/components/MobileHeader";
import Sidebar from "@/components/Sidebar";
import ThemeSwitch from "@/components/ThemeSwitch";
import { checkHealth, queryRag, ApiError } from "@/lib/api";
import type { ChatMessage } from "@/lib/types";
import { profile } from "@/lib/assistant";

const SUGGESTIONS = [
  "Tell me about yourself",
  "What are Rahul's skills?",
  "Tell me about his experience",
  "What projects has he built?",
];

function makeId() {
  return Math.random().toString(36).slice(2, 10);
}

function timestamp() {
  return Date.now();
}

export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isThinking, setIsThinking] = useState(false);
  const [online, setOnline] = useState<boolean | null>(null);
  // Mobile overlay drawer - starts closed so it doesn't cover the chat on
  // small screens where it renders as a full backdrop.
  const [sidebarOpen, setSidebarOpen] = useState(false);
  // Desktop collapse - independent of the mobile drawer above. Starts open
  // so the sidebar is visible by default in a normal browser view.
  const [desktopSidebarOpen, setDesktopSidebarOpen] = useState(true);
  // Groups this conversation's messages server-side (see `session_id` on
  // `Chat` in `backend/app/db/schema_modal.py`). Regenerated on "New Chat"
  // so the backend starts a fresh chat record instead of appending to the
  // old one.
  const [sessionId, setSessionId] = useState(makeId);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    checkHealth().then(setOnline);
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages]);

  const send = async (content: string) => {
    // Belt-and-suspenders guard: `ChatInput` already blocks submission
    // while `disabled`, but `send` is also called directly from the
    // sidebar's suggestion buttons, so this is the single source of
    // truth that stops a second request from firing while one is still
    // in flight, no matter which caller triggers it.
    if (isThinking) return;

    const userMessage: ChatMessage = {
      id: makeId(),
      role: "user",
      content,
      createdAt: timestamp(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setIsThinking(true);

    try {
      const { answer, sources } = await queryRag(sessionId, content);
      setMessages((prev) => [
        ...prev,
        {
          id: makeId(),
          role: "assistant",
          content: answer,
          sources,
          createdAt: timestamp(),
        },
      ]);
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : "Failed to reach the backend. Is it running?";
      setMessages((prev) => [
        ...prev,
        {
          id: makeId(),
          role: "assistant",
          content: `⚠️ ${message}`,
          createdAt: timestamp(),
        },
      ]);
    } finally {
      setIsThinking(false);
    }
  };

  const newChat = () => {
    setMessages([]);
    setSessionId(makeId());
  };

  return (
    <div className="flex flex-1 overflow-hidden">
      <Sidebar
        suggestions={SUGGESTIONS}
        onSelect={send}
        onNewChat={newChat}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        desktopOpen={desktopSidebarOpen}
        onCloseDesktop={() => setDesktopSidebarOpen(false)}
        online={online}
        disabled={isThinking}
      />

      <div className="chat-background flex min-h-0 min-w-0 flex-1 flex-col">
        <MobileHeader
          onOpenSidebar={() => setSidebarOpen(true)}
          onNewChat={newChat}
          online={online}
        />

        <div className="hidden items-center justify-between px-6 py-4 md:flex">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setDesktopSidebarOpen((o) => !o)}
              aria-label={desktopSidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
              aria-pressed={desktopSidebarOpen}
              className="flex h-8 w-8 items-center justify-center rounded-full text-neutral-500 transition hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-white/10 dark:hover:text-white"
            >
              <SidebarIcon className="h-6 w-6" />
            </button>
            <h1 className="text-sm font-medium text-neutral-500 dark:text-neutral-400">
              Chat
            </h1>
          </div>

          <ThemeSwitch />
        </div>

        {/*
          Scroll container: this element (not a wrapper) is the one with
          `overflow-y-auto`, and it intentionally carries NO padding/margin
          of its own. A custom-scrollbar element's track/thumb are laid out
          against its own box edges - any padding here (even just
          padding-bottom) visibly insets the thumb from the top/bottom,
          which is exactly the "floating, inset scrollbar" bug this fixes.
          `min-h-0` overrides flexbox's default `min-height: auto` on this
          flex-1 child so it actually shrinks to the space available
          between the header and the input bar instead of growing with its
          content - all spacing lives on the inner wrapper below instead.
        */}
        <div
          ref={scrollRef}
          className="styled-scrollbar min-h-0 flex-1 overflow-y-auto"
        >
          {messages.length === 0 ? (
            <div className="mx-auto flex h-full max-w-xl flex-col items-center justify-center gap-3 px-4 text-center sm:px-6">
              <AssistantAvatar className="h-14 w-14" size={56} />
              <h2 className="text-xl font-semibold text-neutral-900 dark:text-white">
                Ask me anything about {profile.name.split(" ")[0]}
              </h2>
              <p className="text-sm text-neutral-500 dark:text-neutral-400">
                I&apos;m an AI assistant trained on {profile.name.split(" ")[0]}
                &apos;s background, skills, and projects. Try a suggestion from
                the menu to get started.
              </p>
            </div>
          ) : (
            <div className="mx-auto flex max-w-3xl flex-col gap-4 px-4 pb-6 sm:px-6">
              {messages.map((message) => (
                <ChatMessageBubble key={message.id} message={message} />
              ))}
              {isThinking && (
                <div className="flex items-center gap-2.5">
                  <AssistantAvatar className="h-9 w-9" size={36} />
                  <div className="rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-500 dark:border-white/10 dark:bg-white/[0.06] dark:text-neutral-400">
                    Thinking...
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="mx-auto w-full max-w-3xl px-4 pb-4 sm:px-6 sm:pb-6">
          <ChatInput onSend={send} disabled={isThinking} />
        </div>
      </div>

      <HelpButton />
    </div>
  );
}

function SidebarIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      className={className}
    >
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path strokeLinecap="round" d="M9 4v16" />
    </svg>
  );
}
