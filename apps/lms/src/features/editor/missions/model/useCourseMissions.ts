import { useCallback, useEffect, useRef, useState } from "react";
import {
  fetchCourse, setProgress, type Course, type Check,
} from "@/shared/api/courses";

/** Does the node graph satisfy a completion rule? */
export function checkPasses(check: Check | undefined, types: Set<string>, totalNodes: number): boolean {
  if (!check) return false;
  const hasConstraint = !!(check.allOf?.length || check.anyOf?.length || check.min);
  if (!hasConstraint) return false;
  if (check.allOf?.length && !check.allOf.every((t) => types.has(t))) return false;
  if (check.anyOf?.length && !check.anyOf.some((t) => types.has(t))) return false;
  if (check.min && totalNodes < check.min) return false;
  return true;
}

export interface MissionsState {
  course: Course | null;
  completedLevels: Set<string>;
  completedChallenges: Set<string>;
  progress: number;
  justCompleted: { kind: "level" | "challenge"; title: string } | null;
}

/**
 * Loads a course's levels/challenges and auto-completes them as the learner
 * builds. Call `evaluate(nodeTypes, totalNodes)` whenever the graph changes.
 */
export function useCourseMissions(courseSlug?: string) {
  const [state, setState] = useState<MissionsState>({
    course: null,
    completedLevels: new Set(),
    completedChallenges: new Set(),
    progress: 0,
    justCompleted: null,
  });
  const ref = useRef(state);
  ref.current = state;
  const inFlight = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!courseSlug) return;
    let cancelled = false;
    fetchCourse(courseSlug)
      .then((c) => {
        if (cancelled) return;
        setState({
          course: c,
          completedLevels: new Set(c.completedLevels ?? []),
          completedChallenges: new Set(c.completedChallenges ?? []),
          progress: c.progress ?? 0,
          justCompleted: null,
        });
      })
      .catch(() => {
        /* offline / not enrolled — missions panel simply won't show */
      });
    return () => {
      cancelled = true;
    };
  }, [courseSlug]);

  const evaluate = useCallback(
    (nodeTypes: string[], totalNodes: number) => {
      const s = ref.current;
      const course = s.course;
      if (!course || !courseSlug) return;

      const types = new Set(nodeTypes.filter(Boolean));

      const newLevels = course.levels.filter(
        (l) => !s.completedLevels.has(l.key) && checkPasses(l.check, types, totalNodes)
      );
      const newChallenges = course.challenges.filter(
        (c) => !s.completedChallenges.has(c.key) && checkPasses(c.check, types, totalNodes)
      );
      if (newLevels.length === 0 && newChallenges.length === 0) return;

      const cl = new Set(s.completedLevels);
      newLevels.forEach((l) => cl.add(l.key));
      const cc = new Set(s.completedChallenges);
      newChallenges.forEach((c) => cc.add(c.key));

      const total = course.levels.length + course.challenges.length;
      const progress = total > 0 ? Math.round(((cl.size + cc.size) / total) * 100) : 0;

      const last =
        newChallenges.length > 0
          ? { kind: "challenge" as const, title: newChallenges[newChallenges.length - 1].title }
          : { kind: "level" as const, title: newLevels[newLevels.length - 1].label };

      setState((prev) => ({ ...prev, completedLevels: cl, completedChallenges: cc, progress, justCompleted: last }));

      // Persist each newly completed item (deduped).
      const calls: Array<["level" | "challenge", string]> = [
        ...newLevels.map((l) => ["level", l.key] as ["level", string]),
        ...newChallenges.map((c) => ["challenge", c.key] as ["challenge", string]),
      ];
      for (const [kind, key] of calls) {
        const id = `${kind}:${key}`;
        if (inFlight.current.has(id)) continue;
        inFlight.current.add(id);
        setProgress(courseSlug, kind, key, true)
          .catch(() => {})
          .finally(() => inFlight.current.delete(id));
      }
    },
    [courseSlug]
  );

  const clearJustCompleted = useCallback(
    () => setState((p) => ({ ...p, justCompleted: null })),
    []
  );

  return { ...state, evaluate, clearJustCompleted, enabled: !!courseSlug };
}
