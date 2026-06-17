"use client";

import { useEffect, useState, useCallback } from "react";
import { Mail, Phone, MessageSquare, X, Send, PhoneOff } from "lucide-react";

type ActionType = "email" | "call" | "text";

interface ActionPopupProps {
  action: ActionType | null;
  leadName: string;
  leadEmail?: string | null;
  leadPhone?: string | null;
  onClose: () => void;
}

/** Email composer mockup */
function EmailComposer({
  leadName,
  leadEmail,
  onClose,
}: {
  leadName: string;
  leadEmail?: string | null;
  onClose: () => void;
}) {
  const [typed, setTyped] = useState("");
  const fullText = `Hi ${leadName.split(" ")[0]},\n\nI wanted to follow up on the property we discussed. Are you available for a quick call this week?\n\nBest,\nYour Agent`;

  useEffect(() => {
    let i = 0;
    const interval = setInterval(() => {
      if (i < fullText.length) {
        setTyped(fullText.slice(0, i + 1));
        i++;
      } else {
        clearInterval(interval);
      }
    }, 18);
    return () => clearInterval(interval);
  }, [fullText]);

  return (
    <div className="absolute bottom-full left-0 mb-2 w-80 bg-white rounded-xl shadow-2xl border border-surface-200 overflow-hidden z-30 animate-in slide-in-from-bottom-2 fade-in duration-200">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-surface-50 border-b border-surface-200">
        <div className="flex items-center gap-2">
          <Mail className="h-4 w-4 text-blue-500" />
          <span className="text-xs font-semibold text-surface-700">New Message</span>
        </div>
        <button onClick={onClose} className="p-1 rounded hover:bg-surface-200 transition-colors">
          <X className="h-3.5 w-3.5 text-surface-400" />
        </button>
      </div>

      {/* Fields */}
      <div className="px-4 py-2 border-b border-surface-100">
        <div className="flex items-center gap-2 text-xs">
          <span className="text-surface-400 w-12">To</span>
          <span className="text-surface-700 font-medium">{leadEmail || `${leadName.toLowerCase().replace(" ", ".")}@email.com`}</span>
        </div>
      </div>
      <div className="px-4 py-2 border-b border-surface-100">
        <div className="flex items-center gap-2 text-xs">
          <span className="text-surface-400 w-12">Subject</span>
          <span className="text-surface-700">Following up on the property</span>
        </div>
      </div>

      {/* Body with typing animation */}
      <div className="px-4 py-3 min-h-[100px]">
        <p className="text-xs text-surface-600 whitespace-pre-line leading-relaxed">
          {typed}
          <span className="inline-block w-px h-3 bg-surface-900 ml-0.5 animate-pulse" />
        </p>
      </div>

      {/* Footer */}
      <div className="px-4 py-2.5 bg-surface-50 border-t border-surface-200 flex items-center justify-between">
        <div className="flex items-center gap-1 text-xs text-surface-400">
          <Send className="h-3 w-3" />
          <span>agentflow.app</span>
        </div>
        <button className="px-3 py-1 bg-blue-500 text-white text-xs font-medium rounded-lg hover:bg-blue-600 transition-colors">
          Send
        </button>
      </div>
    </div>
  );
}

/** Phone call screen mockup */
function CallScreen({
  leadName,
  leadPhone,
  onClose,
}: {
  leadName: string;
  leadPhone?: string | null;
  onClose: () => void;
}) {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;

  return (
    <div className="absolute bottom-full left-0 mb-2 w-72 bg-gradient-to-b from-surface-900 to-surface-800 rounded-2xl shadow-2xl overflow-hidden z-30 animate-in slide-in-from-bottom-2 fade-in duration-200">
      {/* Status bar */}
      <div className="px-4 pt-4 pb-2 text-center">
        <p className="text-[10px] text-green-400 font-medium tracking-wider uppercase">Calling</p>
      </div>

      {/* Avatar + Name */}
      <div className="px-4 py-4 flex flex-col items-center">
        <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mb-3">
          <span className="text-xl font-heading font-bold text-primary">
            {leadName.split(" ").map((n) => n[0]).join("")}
          </span>
        </div>
        <p className="text-white font-heading font-semibold text-sm">{leadName}</p>
        <p className="text-surface-400 text-xs mt-0.5">{leadPhone || "+1-555-0100"}</p>
        <p className="text-green-400 text-xs mt-2 font-mono">
          {String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")}
        </p>
      </div>

      {/* Call controls */}
      <div className="px-4 pb-5 flex items-center justify-center gap-6">
        <button
          onClick={onClose}
          className="w-12 h-12 rounded-full bg-red-500 flex items-center justify-center hover:bg-red-600 transition-colors"
        >
          <PhoneOff className="h-5 w-5 text-white" />
        </button>
      </div>
    </div>
  );
}

/** Text message mockup */
function TextMessage({
  leadName,
  leadPhone,
  onClose,
}: {
  leadName: string;
  leadPhone?: string | null;
  onClose: () => void;
}) {
  const [showReply, setShowReply] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShowReply(true), 1500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="absolute bottom-full left-0 mb-2 w-72 bg-white rounded-xl shadow-2xl border border-surface-200 overflow-hidden z-30 animate-in slide-in-from-bottom-2 fade-in duration-200">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-surface-50 border-b border-surface-200">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-purple-500" />
          <span className="text-xs font-semibold text-surface-700">{leadName}</span>
        </div>
        <button onClick={onClose} className="p-1 rounded hover:bg-surface-200 transition-colors">
          <X className="h-3.5 w-3.5 text-surface-400" />
        </button>
      </div>

      {/* Messages */}
      <div className="px-4 py-3 space-y-2 min-h-[80px]">
        {/* Outgoing message */}
        <div className="flex justify-end">
          <div className="bg-purple-500 text-white text-xs px-3 py-2 rounded-2xl rounded-br-sm max-w-[85%]">
            Hi! I have some new listings that match what you are looking for. Want to schedule a viewing?
          </div>
        </div>
        {/* Typing indicator */}
        {showReply && (
          <div className="flex justify-start animate-in fade-in duration-300">
            <div className="bg-surface-100 text-surface-600 text-xs px-3 py-2 rounded-2xl rounded-bl-sm">
              <span className="flex gap-1">
                <span className="w-1.5 h-1.5 bg-surface-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-1.5 h-1.5 bg-surface-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-1.5 h-1.5 bg-surface-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="px-3 py-2 border-t border-surface-100 flex items-center gap-2">
        <div className="flex-1 bg-surface-50 rounded-full px-3 py-1.5 text-xs text-surface-400">
          Type a message...
        </div>
        <div className="w-7 h-7 rounded-full bg-purple-500 flex items-center justify-center">
          <Send className="h-3 w-3 text-white" />
        </div>
      </div>
    </div>
  );
}

/** Main ActionPopup wrapper */
export function ActionPopup({
  action,
  leadName,
  leadEmail,
  leadPhone,
  onClose,
}: ActionPopupProps) {
  if (!action) return null;

  return (
    <>
      {/* Backdrop to catch outside clicks */}
      <div className="fixed inset-0 z-20" onClick={onClose} />

      {action === "email" && (
        <EmailComposer leadName={leadName} leadEmail={leadEmail} onClose={onClose} />
      )}
      {action === "call" && (
        <CallScreen leadName={leadName} leadPhone={leadPhone} onClose={onClose} />
      )}
      {action === "text" && (
        <TextMessage leadName={leadName} leadPhone={leadPhone} onClose={onClose} />
      )}
    </>
  );
}
