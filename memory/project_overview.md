---
name: project-overview
description: Kokoon LMS — editor sub-module scope, stack, status, and team plans
metadata:
  type: project
---

Kokoon is an LMS for a hardware kit company targeting ~50k users. Currently only the code editor sub-module is being built; the main LMS (courses, lessons, student dashboard) has not started.

The editor lets students write MicroPython and flash it to an ESP32 via Web Serial API (browser → USB → ESP32 REPL). No cloud execution — everything is local.

**Stack**: React 19 + TypeScript + Vite, Tailwind + DaisyUI, @xyflow/react for nodes, Redux Toolkit + Zustand installed but unused in editor (plain useState used instead), Express + MongoDB + Redis backend (skeleton only).

**What's built**: 40+ node types, working Web Serial (USB), code generation, tutorials system, designer hubs (NeoPixel/OLED/Matrix), data viz panels, launch context system with kit/mode presets, firmware flasher, library installer.

**What's incomplete**: WiFi/WebREPL is a stub. Backend is a skeleton. No auth or progress tracking yet. LMS → editor context handoff not designed yet.

**Architecture**: Currently Technical Role Split (components/, hooks/, lib/, pages/). Migrating to Feature-Sliced Design (FSD) — decided because the editor is part of the full LMS (not a standalone app) and a bigger team is coming after launch. FSD layers: app > pages > widgets > features > entities > shared. Key decision: Zustand store at entities layer for serial session state, solving the cross-feature serial dependency problem.

**Team**: Anirudh built the entire editor solo in ~2 days. Will be handed off to a larger team after the product goes live.

**Why:** Fast MVP build to validate the editor before scaling. Team handoff means architecture cleanup and documentation are time-sensitive — should happen before the LMS is built, not after.

**How to apply:** Recommend Feature-based folder organization proactively. Flag anything that will be hard for a new dev to understand without context (especially serial.ts REPL protocol assumptions).
