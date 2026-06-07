import { useState, useCallback, useEffect } from "react";
import {
  BaseNode,
  NodeField,
  TextInput,
  SelectInput,
  ToggleInput,
  useNodeField,
  AdvancedSection,
  COLORS,
} from "./BaseNode";
import { DisplayIcon, ROTATE_OPTIONS } from "./_shared";
import { OLED } from "@/entities/board";
import { type AnimEntry, loadAnimRegistry } from "@/shared/lib/animRegistry";
import { useNodeActions } from "@/shared/context/NodeActionsContext";

// ─── Board hardware constants ──────────────────────────────────────────────────
const OLED_PINS = { scl: OLED.scl, sda: OLED.sda };

// ─── OLED Display Node ────────────────────────────────────────────────────────
export function OLEDDisplayNode() {
  const [mode, setMode]     = useNodeField<"text" | "anim">("mode", "text");
  const [line1, setLine1]   = useNodeField<string>("line1", "Hello");
  const [line2, setLine2]   = useNodeField<string>("line2", "World!");
  const [animFile, setAnimFile] = useNodeField<string>("animFile", "");
  const [driver, setDriver] = useNodeField<boolean>("driver", false);

  const { deleteOLEDAnim } = useNodeActions();

  const [animList, setAnimList] = useState<AnimEntry[]>([]);
  const [search, setSearch] = useState("");

  // Reload registry whenever the component mounts or re-focuses
  const refreshList = useCallback(() => {
    setAnimList(loadAnimRegistry());
  }, []);

  useEffect(() => { refreshList(); }, [refreshList]);

  const filtered = search.trim()
    ? animList.filter(a => a.name.toLowerCase().includes(search.toLowerCase()))
    : animList;

  const selected = animList.find(a => a.name === animFile);

  return (
    <>
      <BaseNode title="OLED Display" color={COLORS.purple} icon={<DisplayIcon />} width="250px">
        <AdvancedSection>
          {/* Fixed port info */}
          <div className="mx-3 mb-2 px-2.5 py-1.5 rounded-lg border border-[var(--k-border)] bg-[var(--k-base-200)]">
            <div className="flex items-center justify-between">
              <span className="text-[9px] uppercase tracking-wider text-zinc-500 font-bold">Dedicated I2C Port</span>
              <span className="text-[9px] font-mono text-purple-400">fixed</span>
            </div>
            <div className="flex gap-3 mt-0.5">
              <span className="text-[10px] text-zinc-500">SCL <span className="text-zinc-300 font-mono">{OLED_PINS.scl}</span></span>
              <span className="text-[10px] text-zinc-500">SDA <span className="text-zinc-300 font-mono">{OLED_PINS.sda}</span></span>
            </div>
          </div>
        </AdvancedSection>

        {/* Mode toggle */}
        <NodeField label="Mode">
          <div className="flex gap-1 w-full">
            <button onClick={() => setMode("text")}
              className={`nodrag flex-1 py-1 rounded-lg text-[10px] font-bold border transition-all ${
                mode === "text"
                  ? "bg-purple-500/20 text-purple-300 border-purple-500/40"
                  : "text-zinc-500 border-[#2a2a35] hover:text-zinc-300"
              }`}>
              📝 Text
            </button>
            <button onClick={() => setMode("anim")}
              className={`nodrag flex-1 py-1 rounded-lg text-[10px] font-bold border transition-all ${
                mode === "anim"
                  ? "bg-blue-500/20 text-blue-300 border-blue-500/40"
                  : "text-zinc-500 border-[#2a2a35] hover:text-zinc-300"
              }`}>
              🎬 Animation
            </button>
          </div>
        </NodeField>

        {mode === "text" ? (
          <>
            <NodeField label="Line 1"><TextInput value={line1} onChange={setLine1} /></NodeField>
            <NodeField label="Line 2"><TextInput value={line2} onChange={setLine2} /></NodeField>
          </>
        ) : (
          <div className="px-3 pb-1.5">
            {/* Search */}
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="🔍 Search animations..."
              className="nodrag w-full text-[10px] bg-[var(--k-base-200)] border border-[var(--k-border)] rounded-lg px-2 py-1.5 text-zinc-300 placeholder-zinc-600 outline-none focus:border-purple-500/50 mb-1.5"
            />

            {animList.length === 0 ? (
              <div className="rounded-lg border border-dashed border-[var(--k-border)] p-3 text-center">
                <p className="text-[10px] text-zinc-600 leading-relaxed">
                  No animations saved yet.<br />
                  <span className="text-purple-500">OLED Designer → Save to Library</span>
                </p>
              </div>
            ) : filtered.length === 0 ? (
              <p className="text-[10px] text-zinc-600 py-2 text-center">No matches for "{search}"</p>
            ) : (
              <div className="flex flex-col gap-0.5 max-h-40 overflow-y-auto">
                {filtered.map(anim => (
                  <div key={anim.name}
                    className={`flex items-center gap-1 px-2 py-1.5 rounded-lg border text-[10px] transition-all ${
                      animFile === anim.name
                        ? "bg-purple-500/20 border-purple-500/40"
                        : "border-transparent hover:bg-white/5"
                    }`}>
                    <button className="nodrag flex-1 text-left min-w-0" onClick={() => setAnimFile(anim.name)}>
                      <span className={`font-semibold truncate block ${animFile === anim.name ? "text-purple-300" : "text-zinc-300"}`}>
                        {anim.name}
                      </span>
                      <span className="text-zinc-600 text-[9px]">
                        {anim.frameCount}f · {anim.fps}fps
                        {anim.onDevice && <span className="text-emerald-500 ml-1">● on device</span>}
                      </span>
                    </button>
                    <button
                      onClick={async () => {
                        if (animFile === anim.name) setAnimFile("");
                        await deleteOLEDAnim(anim.name);
                        refreshList();
                      }}
                      className="nodrag p-1 rounded text-zinc-700 hover:text-red-400 transition-colors flex-shrink-0"
                      title="Remove from library and device"
                    >✕</button>
                  </div>
                ))}
              </div>
            )}

            {selected && (
              <div className="mt-1.5 px-2 py-1 rounded-lg bg-purple-500/10 border border-purple-500/20">
                <p className="text-[9px] text-purple-400 font-mono">/anim/{selected.name}.bin</p>
              </div>
            )}
          </div>
        )}

        <AdvancedSection>
          <NodeField label="Driver">
            <ToggleInput value={driver} onChange={setDriver} leftLabel="SH1106" rightLabel="SSD1306" />
          </NodeField>
        </AdvancedSection>
      </BaseNode>
    </>
  );
}

// ─── Play Animation ───────────────────────────────────────────────────────────
export function PlayAnimationNode() {
  const [driver, setDriver] = useNodeField<boolean>("driver", false);
  const [rotate, setRotate] = useNodeField<string>("rotate", "0");
  const [folder, setFolder] = useNodeField<string>("folder", "animation");
  return (
    <BaseNode title="Play Animation" color={COLORS.purple} icon={<DisplayIcon />} width="230px">
      <AdvancedSection>
        {/* Uses dedicated OLED port — pins fixed */}
        <div className="mx-3 mb-1 px-2.5 py-1.5 rounded-lg border border-[var(--k-border)] bg-[var(--k-base-200)]">
          <span className="text-[9px] uppercase tracking-wider text-zinc-500 font-bold">OLED Dedicated Port</span>
          <div className="flex gap-3 mt-0.5">
            <span className="text-[10px] text-zinc-500">SCL <span className="text-zinc-300 font-mono">{OLED_PINS.scl}</span></span>
            <span className="text-[10px] text-zinc-500">SDA <span className="text-zinc-300 font-mono">{OLED_PINS.sda}</span></span>
          </div>
        </div>
        <NodeField label="Driver"><ToggleInput value={driver} onChange={setDriver} leftLabel="SH1106" rightLabel="SSD1306" /></NodeField>
      </AdvancedSection>
      <NodeField label="Rotate"><SelectInput value={rotate} onChange={setRotate} options={ROTATE_OPTIONS} compact /></NodeField>
      <NodeField label="Folder name"><TextInput value={folder} onChange={setFolder} /></NodeField>
    </BaseNode>
  );
}

// ─── Show Image ───────────────────────────────────────────────────────────────
export function ShowImageNode() {
  const [driver, setDriver] = useNodeField<boolean>("driver", false);
  const [rotate, setRotate] = useNodeField<string>("rotate", "0");
  const [imageFile, setImageFile] = useNodeField<string>("imageFile", "image.pbm");
  return (
    <BaseNode title="Show Image" color={COLORS.purple} icon={<DisplayIcon />} width="220px">
      <AdvancedSection>
        <div className="mx-3 mb-1 px-2.5 py-1.5 rounded-lg border border-[var(--k-border)] bg-[var(--k-base-200)]">
          <span className="text-[9px] uppercase tracking-wider text-zinc-500 font-bold">OLED Dedicated Port</span>
          <div className="flex gap-3 mt-0.5">
            <span className="text-[10px] text-zinc-500">SCL <span className="text-zinc-300 font-mono">{OLED_PINS.scl}</span></span>
            <span className="text-[10px] text-zinc-500">SDA <span className="text-zinc-300 font-mono">{OLED_PINS.sda}</span></span>
          </div>
        </div>
        <NodeField label="Driver"><ToggleInput value={driver} onChange={setDriver} leftLabel="SH1106" rightLabel="SSD1306" /></NodeField>
      </AdvancedSection>
      <NodeField label="Rotate"><SelectInput value={rotate} onChange={setRotate} options={ROTATE_OPTIONS} compact /></NodeField>
      <NodeField label="Image file"><TextInput value={imageFile} onChange={setImageFile} /></NodeField>
    </BaseNode>
  );
}
