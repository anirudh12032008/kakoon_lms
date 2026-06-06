import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Node, Edge } from "@xyflow/react";
import { generateStepsFromFlow, type Tutorial } from "@/features/editor/tutorial/lib/tutorials";

const ADMIN_SECRET  = import.meta.env.VITE_ADMIN_SECRET as string | undefined;
const SESSION_KEY   = "kokoon-admin-session";
const CUSTOM_KEY    = "Kokoon-custom-tutorials";

function isAdminAuthed() {
  return localStorage.getItem(SESSION_KEY) === "true";
}

interface Props {
  onClose: () => void;
  getWorkspace: () => { nodes: Node[]; edges: Edge[] };
}

export function SaveAsTutorialModal({ onClose, getWorkspace }: Props) {
  const [step, setStep]       = useState<"auth" | "form">(isAdminAuthed() ? "form" : "auth");
  const [secret, setSecret]   = useState("");
  const [authError, setAuthError] = useState("");

  // form fields
  const [title, setTitle]         = useState("");
  const [desc, setDesc]           = useState("");
  const [difficulty, setDifficulty] = useState<"Easy" | "Medium" | "Hard">("Medium");
  const [saved, setSaved]         = useState(false);
  const [saveError, setSaveError] = useState("");

  // live node count for info
  const [nodeCount, setNodeCount] = useState(0);
  const [edgeCount, setEdgeCount] = useState(0);

  useEffect(() => {
    const { nodes, edges } = getWorkspace();
    setNodeCount(nodes.length);
    setEdgeCount(edges.length);
  }, [getWorkspace]);

  function unlock() {
    if (!ADMIN_SECRET) {
      setAuthError("VITE_ADMIN_SECRET is not set in .env.local");
      return;
    }
    if (secret === ADMIN_SECRET) {
      localStorage.setItem(SESSION_KEY, "true");
      setStep("form");
    } else {
      setAuthError("Wrong secret.");
      setSecret("");
    }
  }

  function save() {
    if (!title.trim()) { setSaveError("Title is required."); return; }

    const { nodes, edges } = getWorkspace();
    if (nodes.length === 0) { setSaveError("Canvas is empty — add some blocks first."); return; }

    const steps = generateStepsFromFlow(nodes, edges);
    const tutorial: Tutorial = {
      id: `custom_${Date.now()}`,
      title: title.trim(),
      description: desc.trim() || `Custom tutorial: ${title.trim()}.`,
      difficulty,
      board: "Quark C3",
      components: [...new Set(nodes.map((n) => n.type).filter(Boolean))] as string[],
      nodes,
      edges,
      steps,
    };

    try {
      const stored = localStorage.getItem(CUSTOM_KEY);
      const existing: Tutorial[] = stored ? JSON.parse(stored) : [];
      localStorage.setItem(CUSTOM_KEY, JSON.stringify([...existing, tutorial]));
      setSaved(true);
      setSaveError("");
      setTimeout(onClose, 1400);
    } catch {
      setSaveError("Failed to save.");
    }
  }

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[999] flex items-center justify-center"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      >
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

        <motion.div
          className="relative z-10 w-full max-w-md mx-4 rounded-2xl border border-zinc-800 bg-[#0f0f12] shadow-2xl overflow-hidden"
          initial={{ scale: 0.94, y: 12, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          exit={{ scale: 0.94, y: 12, opacity: 0 }}
          transition={{ type: "spring", stiffness: 380, damping: 28 }}
        >
          {step === "auth" ? (
            /* ── Auth step ── */
            <div className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-9 h-9 rounded-xl bg-violet-600/20 border border-violet-500/30 flex items-center justify-center">
                  🔐
                </div>
                <div>
                  <p className="text-sm font-bold text-white">Admin Access Required</p>
                  <p className="text-xs text-zinc-500">One-time unlock to save tutorials</p>
                </div>
              </div>

              <label className="block text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">
                Admin Secret
              </label>
              <input
                type="password"
                value={secret}
                autoFocus
                onChange={(e) => { setSecret(e.target.value); setAuthError(""); }}
                onKeyDown={(e) => e.key === "Enter" && unlock()}
                placeholder="Enter secret…"
                className="w-full bg-[#0a0a0d] border border-zinc-700 rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-zinc-600 outline-none focus:border-violet-500 transition-colors"
              />
              {authError && <p className="text-xs text-red-400 mt-2">{authError}</p>}

              <div className="flex gap-2 mt-4">
                <button
                  onClick={unlock}
                  className="flex-1 bg-violet-600 hover:bg-violet-500 transition-colors text-white text-sm font-semibold py-2.5 rounded-xl"
                >
                  Unlock
                </button>
                <button
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl border border-zinc-700 text-zinc-400 hover:text-white text-sm transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : saved ? (
            /* ── Success ── */
            <div className="p-8 text-center">
              <div className="text-4xl mb-3">🎉</div>
              <p className="text-white font-bold text-lg">Tutorial Saved!</p>
              <p className="text-zinc-400 text-sm mt-1">"{title}" is now in your tutorial catalog.</p>
            </div>
          ) : (
            /* ── Form step ── */
            <div className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-9 h-9 rounded-xl bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center">
                  📚
                </div>
                <div>
                  <p className="text-sm font-bold text-white">Save as Tutorial</p>
                  <p className="text-xs text-zinc-500">
                    {nodeCount} block{nodeCount !== 1 ? "s" : ""} · {edgeCount} connection{edgeCount !== 1 ? "s" : ""} captured
                  </p>
                </div>
              </div>

              {nodeCount === 0 && (
                <div className="mb-4 px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-400">
                  ⚠ Canvas is empty. Add blocks before saving.
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">Title *</label>
                  <input
                    value={title}
                    autoFocus
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. BT Forklift Control"
                    className="w-full bg-[#0a0a0d] border border-zinc-800 rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-zinc-600 outline-none focus:border-zinc-600 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">Description</label>
                  <textarea
                    value={desc}
                    onChange={(e) => setDesc(e.target.value)}
                    rows={2}
                    placeholder="What will students learn?"
                    className="w-full bg-[#0a0a0d] border border-zinc-800 rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-zinc-600 outline-none focus:border-zinc-600 transition-colors resize-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">Difficulty</label>
                  <div className="flex gap-2">
                    {(["Easy", "Medium", "Hard"] as const).map((d) => (
                      <button
                        key={d}
                        onClick={() => setDifficulty(d)}
                        className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all ${
                          difficulty === d
                            ? d === "Easy"   ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-400"
                            : d === "Medium" ? "bg-amber-500/20 border-amber-500/40 text-amber-400"
                            :                  "bg-red-500/20 border-red-500/40 text-red-400"
                            : "border-zinc-800 text-zinc-600 hover:border-zinc-700 hover:text-zinc-400"
                        }`}
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {saveError && <p className="text-xs text-red-400 mt-3">{saveError}</p>}

              <div className="flex gap-2 mt-5">
                <button
                  onClick={save}
                  disabled={nodeCount === 0}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-white text-sm font-semibold py-2.5 rounded-xl"
                >
                  Save to Catalog
                </button>
                <button
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl border border-zinc-700 text-zinc-400 hover:text-white text-sm transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
