"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, X, Check, Clock } from "lucide-react";
import { CinemaModal } from "@/components/ui/CinemaModal";
import { cn } from "@/lib/utils";

export type EditRow = {
  id: string;
  userId: string;
  category: string;
  status: "approved" | "pending" | "revision" | "re-uploaded";
  submitted: string;
  fileSize?: string;
  fileUrl?: string;
  editorName?: string;
  editorApproved?: number;
};

interface ReviewModalProps {
  edit: EditRow | null;
  onClose: () => void;
  onApprove?: (id: string) => void;
  onRevisionSent?: (id: string, notes: string, timestamp: string) => void;
}

export function ReviewModal({ edit, onClose, onApprove, onRevisionSent }: ReviewModalProps) {
  const [showRevisionPanel, setShowRevisionPanel] = useState(false);
  const [approved, setApproved] = useState(false);
  const [noteSent, setNoteSent] = useState(false);
  const [timestamp, setTimestamp] = useState("");
  const [notes, setNotes] = useState("");

  if (!edit) return null;

  const isReUploaded = edit.status === "re-uploaded";

  function handleApprove() {
    setApproved(true);
    setShowRevisionPanel(false);
    if (edit) onApprove?.(edit.id);
  }

  function handleSendNotes() {
    if (!notes.trim() || !edit) return;
    setNoteSent(true);
    onRevisionSent?.(edit.id, notes.trim(), timestamp);
    setTimeout(() => {
      onClose();
      setNoteSent(false);
      setNotes("");
      setTimestamp("");
      setShowRevisionPanel(false);
      setApproved(false);
    }, 1200);
  }

  return (
    <CinemaModal open={!!edit} onClose={onClose} className="max-w-4xl flex flex-row overflow-hidden max-h-[90vh]">
      <button
        onClick={onClose}
        className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-surface-raised hover:bg-border flex items-center justify-center transition-colors"
      >
        <X className="w-4 h-4 text-text-secondary" />
      </button>

      {/* Left — video */}
      <div className="flex-[3] p-5 flex flex-col gap-4 border-r border-border">
        <div className="bg-black rounded-xl overflow-hidden">
          {edit.fileUrl ? (
            <video
              controls
              className="w-full aspect-video"
              src={edit.fileUrl}
            >
              Your browser does not support the video tag.
            </video>
          ) : (
            <div className="aspect-video flex items-center justify-center bg-gradient-to-br from-gray-900 to-black">
              <button className="w-14 h-14 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 flex items-center justify-center transition-all backdrop-blur-sm">
                <Play className="w-6 h-6 text-white ml-0.5" />
              </button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-xs">
          <div className="flex gap-2"><span className="text-text-muted">Edit ID</span><span className="text-text-secondary font-mono">{edit.id.slice(0, 8)}</span></div>
          <div className="flex gap-2"><span className="text-text-muted">Category</span><span className="text-text-secondary">{edit.category}</span></div>
          <div className="flex gap-2"><span className="text-text-muted">Submitted</span><span className="text-text-secondary">{edit.submitted}</span></div>
          <div className="flex gap-2"><span className="text-text-muted">File Size</span><span className="text-text-secondary">{edit.fileSize ?? "—"}</span></div>
        </div>
      </div>

      {/* Right — actions */}
      <div className="flex-[2] p-5 flex flex-col gap-4 overflow-y-auto">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-accent-purple/20 flex items-center justify-center font-bold text-accent-purple text-sm shrink-0">
            {(edit.editorName ?? "?").split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2)}
          </div>
          <div>
            <div className="text-sm font-semibold text-text-primary">{edit.editorName ?? "Unknown"}</div>
            <div className="text-xs text-text-muted">{edit.editorApproved ?? 0} approved edits</div>
          </div>
        </div>

        <div className="border-t border-border" />

        {isReUploaded && (
          <div className="bg-accent-orange/10 border border-accent-orange/30 rounded-lg px-3 py-2.5 text-xs text-accent-orange font-medium">
            Editor re-submitted after revision request.
          </div>
        )}

        {approved ? (
          <div className="w-full py-2.5 rounded-lg bg-accent-green/20 border border-accent-green/40 text-accent-green text-sm font-semibold flex items-center justify-center gap-2">
            <Check className="w-4 h-4" /> Approved ✓
          </div>
        ) : (
          <button
            onClick={handleApprove}
            className="w-full py-2.5 rounded-lg bg-accent-green text-white text-sm font-semibold hover:bg-accent-green/90 active:scale-[0.98] transition-all"
          >
            Approve Edit
          </button>
        )}

        {!approved && (
          <button
            onClick={() => setShowRevisionPanel((v) => !v)}
            className={cn(
              "w-full py-2.5 rounded-lg border text-sm font-semibold transition-colors",
              showRevisionPanel
                ? "border-accent-orange bg-accent-orange/10 text-accent-orange"
                : "border-accent-orange/50 text-accent-orange hover:bg-accent-orange/10"
            )}
          >
            {showRevisionPanel ? "Hide Revision Panel" : "Request Revision"}
          </button>
        )}

        <AnimatePresence>
          {showRevisionPanel && !approved && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="flex flex-col gap-3 pt-1">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-text-secondary flex items-center gap-1.5">
                    <Clock className="w-3 h-3" /> Timestamp (optional)
                  </label>
                  <input
                    value={timestamp}
                    onChange={(e) => setTimestamp(e.target.value)}
                    placeholder="e.g. 00:32"
                    className="bg-background border border-border rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-orange transition-colors font-mono"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-text-secondary">Notes</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Describe what needs to change..."
                    rows={4}
                    className="bg-background border border-border rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-orange transition-colors resize-none"
                  />
                </div>
                <button
                  onClick={handleSendNotes}
                  disabled={!notes.trim()}
                  className={cn(
                    "w-full py-2.5 rounded-lg text-sm font-semibold transition-all",
                    noteSent
                      ? "bg-accent-green text-white"
                      : notes.trim()
                        ? "bg-accent-orange text-background hover:bg-accent-orange/90 active:scale-[0.98]"
                        : "bg-surface-raised text-text-muted cursor-not-allowed"
                  )}
                >
                  {noteSent ? "✓ Notes Sent!" : "Send Notes to Editor"}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </CinemaModal>
  );
}
