import { lazy, Suspense } from "react";
const EditorPage = lazy(() => import("./pages/editor/EditorPage"));

export default function App() {
  return (
    <Suspense
      fallback={
        <div style={{ position: "fixed", inset: 0, background: "#09090b", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ width: 32, height: 32, border: "3px solid #3f3f46", borderTopColor: "#7c3aed", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      }
    >
      <EditorPage />
    </Suspense>
  );
}
