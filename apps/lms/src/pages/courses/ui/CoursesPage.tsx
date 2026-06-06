import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Check, Clock } from "lucide-react";
import { fetchCourses, type Course } from "@/shared/api/courses";
import { apiErrorMessage } from "@/shared/api/client";
import { DashboardHeader, DifficultyBadge } from "./DashboardHeader";

function CourseCard({ course, onOpen }: { course: Course; onOpen: () => void }) {
  return (
    <button
      onClick={onOpen}
      className="group flex flex-col overflow-hidden rounded-2xl border border-subtle bg-raised text-left transition-all duration-150 hover:-translate-y-1 hover:border-primary/40 hover:shadow-xl hover:shadow-black/30"
    >
      <div className={`relative bg-gradient-to-br ${course.accent} px-5 pt-5 pb-6`}>
        <div className="flex items-start justify-between">
          <span className="text-4xl drop-shadow">{course.coverEmoji}</span>
          {course.enrolled && (
            <span className="flex items-center gap-1 rounded-full bg-white/25 px-2.5 py-1 text-[11px] font-bold text-white">
              <Check className="h-3 w-3" /> Enrolled
            </span>
          )}
        </div>
        <h3 className="mt-3 text-lg font-black leading-tight text-white">{course.title}</h3>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-5">
        <p className="text-[14px] leading-relaxed text-sub">{course.summary}</p>
        <div className="mt-auto flex items-center justify-between pt-2">
          <div className="flex items-center gap-2">
            <DifficultyBadge difficulty={course.difficulty} />
            <span className="flex items-center gap-1 text-[12px] text-hint">
              <Clock className="h-3.5 w-3.5" /> ~{course.estimatedHours}h
            </span>
          </div>
          <span className="flex items-center gap-1 text-sm font-bold text-primary-c">
            {course.enrolled ? "Open" : "View"}
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </span>
        </div>
      </div>
    </button>
  );
}

export function CoursesPage() {
  const navigate = useNavigate();
  const [courses, setCourses] = useState<Course[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchCourses()
      .then((c) => !cancelled && setCourses(c))
      .catch((e) => !cancelled && setError(apiErrorMessage(e, "Could not load courses")));
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="min-h-screen bg-page">
      <DashboardHeader />

      <main className="mx-auto max-w-6xl px-5 py-8">
        <div className="mb-7">
          <h1 className="text-3xl font-black tracking-tight text-body">Robot Courses</h1>
          <p className="mt-1.5 text-[15px] text-sub">
            Pick a robot to build. Enroll for free and jump straight into the block editor.
          </p>
        </div>

        {error && (
          <div className="rounded-xl border border-error-tint bg-error-tint px-4 py-3 text-sm font-medium text-error-c">
            {error} — is the API running on <code className="font-mono">localhost:4000</code>?
          </div>
        )}

        {!courses && !error && (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-64 animate-pulse rounded-2xl border border-subtle bg-raised" />
            ))}
          </div>
        )}

        {courses && (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {courses.map((course) => (
              <CourseCard
                key={course._id}
                course={course}
                onOpen={() => navigate(`/courses/${course.slug}`)}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
