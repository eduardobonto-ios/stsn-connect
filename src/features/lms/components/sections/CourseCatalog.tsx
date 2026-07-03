/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useMemo, useState } from "react";
import {
  BookOpen,
  Clock,
  Layers,
  Play,
  Plus,
  UserCircle,
  CheckCircle2,
} from "lucide-react";
import AppCard from "../../../../components/common/AppCard";
import AppButton from "../../../../components/common/AppButton";
import AppEmptyState from "../../../../components/common/AppEmptyState";
import AppSearchInput from "../../../../components/common/AppSearchInput";
import AppFilterChip from "../../../../components/common/AppFilterChip";
import type { SecurityAction } from "../../../../types/security-permissions.types";
import type { LmsData } from "../../data/useLmsData";
import type { LmsCourse, LmsDifficulty } from "../../types";
import { DIFFICULTY_BADGE, ProgressBar, formatDuration } from "../shared";
import CourseDetails from "./CourseDetails";
import CourseForm from "./CourseForm";

const DIFFICULTIES: (LmsDifficulty | "All")[] = ["All", "Beginner", "Intermediate", "Advanced"];

function CourseCard({
  course,
  lms,
  onOpen,
  onEnroll,
}: {
  course: LmsCourse;
  lms: LmsData;
  onOpen: (course: LmsCourse) => void;
  onEnroll: (course: LmsCourse) => void;
}) {
  const category = lms.categoryById(course.categoryId);
  const enrollment = lms.enrollmentFor(course.id);
  const lessonCount = lms.lessonsByCourse(course.id).length;
  const isEnrolled = !!enrollment;
  const isDone = enrollment?.enrollmentStatus === "Completed";

  return (
    <div className="bg-white rounded-2xl border border-stone-200/70 shadow-sm hover:shadow-lg transition-all duration-200 overflow-hidden group flex flex-col">
      {/* Thumbnail */}
      <div
        className="h-32 bg-gradient-to-br from-stsn-brown/10 to-stsn-gold/5 relative flex-shrink-0 cursor-pointer overflow-hidden"
        style={
          course.thumbnailUrl
            ? { backgroundImage: `url("${course.thumbnailUrl}")`, backgroundSize: "cover", backgroundPosition: "center" }
            : {}
        }
        onClick={() => onOpen(course)}
      >
        {!course.thumbnailUrl && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-12 h-12 rounded-2xl bg-stsn-brown/10 flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-stsn-brown/50" />
            </div>
          </div>
        )}
        <div className={`absolute top-2 left-2 px-2 py-0.5 rounded-full text-[9px] font-bold border ${DIFFICULTY_BADGE[course.difficulty]}`}>
          {course.difficulty}
        </div>
        {course.status !== "Published" && (
          <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full text-[9px] font-bold bg-stone-600/90 text-stone-100">
            {course.status}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col flex-1">
        {category && (
          <p className="text-[9px] font-mono uppercase tracking-widest text-stsn-gold mb-1">{category.name}</p>
        )}
        <h3
          className="text-sm font-bold text-stone-800 leading-snug line-clamp-2 cursor-pointer hover:text-stsn-brown transition-colors"
          onClick={() => onOpen(course)}
        >
          {course.title}
        </h3>
        <p className="text-[10px] text-stone-500 mt-1.5 line-clamp-2 leading-relaxed flex-1">{course.description}</p>

        <div className="mt-3 space-y-1.5">
          <div className="flex items-center gap-3 text-[10px] text-stone-500">
            <span className="flex items-center gap-1"><Layers className="w-3 h-3 text-stsn-gold" />{lessonCount} lessons</span>
            <span className="flex items-center gap-1"><Clock className="w-3 h-3 text-stsn-gold" />{formatDuration(course.durationMinutes)}</span>
          </div>
          {course.instructorName && (
            <div className="flex items-center gap-1 text-[10px] text-stone-500">
              <UserCircle className="w-3 h-3 text-stsn-gold" />
              <span className="truncate">{course.instructorName}</span>
            </div>
          )}
        </div>

        {isEnrolled && (
          <div className="mt-3">
            <div className="flex items-center justify-between text-[9px] font-mono text-stone-500 mb-1">
              <span>Progress</span>
              <span>{Math.round(enrollment?.progressPercentage ?? 0)}%</span>
            </div>
            <ProgressBar value={enrollment?.progressPercentage ?? 0} />
          </div>
        )}

        {/* CTA */}
        <div className="mt-3 pt-3 border-t border-stone-100">
          {isEnrolled ? (
            <AppButton
              variant={isDone ? "secondary" : "primary"}
              size="sm"
              className="w-full"
              leftIcon={isDone ? CheckCircle2 : Play}
              onClick={() => onOpen(course)}
            >
              {isDone ? "Review Course" : "Continue"}
            </AppButton>
          ) : (
            <AppButton
              variant="primary"
              size="sm"
              className="w-full"
              leftIcon={Plus}
              onClick={() => onEnroll(course)}
            >
              Enroll
            </AppButton>
          )}
        </div>
      </div>
    </div>
  );
}

export default function CourseCatalog({
  lms,
  canPage,
  initialCourseId,
  onCourseChange,
  onToast,
}: {
  lms: LmsData;
  canPage: (page: string, action: SecurityAction) => boolean;
  initialCourseId?: string;
  onCourseChange?: (courseId?: string) => void;
  onToast: (msg: string, type?: "success" | "error") => void;
}) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string>("All");
  const [difficulty, setDifficulty] = useState<LmsDifficulty | "All">("All");
  const [selectedId, setSelectedId] = useState<string | undefined>(initialCourseId);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<LmsCourse | null>(null);

  const canCreate = canPage("courses", "create");
  const canEdit = canPage("courses", "edit");
  const canEnroll = canPage("courses", "enroll");

  useEffect(() => {
    setSelectedId(initialCourseId);
  }, [initialCourseId]);

  const openCourse = (course: LmsCourse) => {
    setSelectedId(course.id);
    onCourseChange?.(course.id);
  };
  const closeCourse = () => {
    setSelectedId(undefined);
    onCourseChange?.(undefined);
  };

  const handleEnroll = (course: LmsCourse) => {
    if (!lms.currentStudent) {
      onToast("No student record is linked to this account to enroll.", "error");
      return;
    }
    lms.enroll(course.id);
    onToast(`Enrolled in “${course.title}”.`);
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return lms.courses
      .filter((c) => (canEdit ? true : c.status === "Published"))
      .filter((c) => {
        const matchSearch =
          !q ||
          c.title.toLowerCase().includes(q) ||
          (c.description ?? "").toLowerCase().includes(q) ||
          (c.instructorName ?? "").toLowerCase().includes(q);
        const matchCat = category === "All" || c.categoryId === category;
        const matchDiff = difficulty === "All" || c.difficulty === difficulty;
        return matchSearch && matchCat && matchDiff;
      })
      .sort((a, b) => a.title.localeCompare(b.title));
  }, [lms.courses, search, category, difficulty, canEdit]);

  const selectedCourse = selectedId ? lms.courseById(selectedId) : undefined;
  if (selectedId && selectedCourse) {
    return (
      <CourseDetails
        course={selectedCourse}
        lms={lms}
        canEdit={canEdit}
        onBack={closeCourse}
        onToast={onToast}
      />
    );
  }

  const publishedCount = lms.courses.filter((c) => c.status === "Published").length;
  const myEnrolledCount = lms.enrollments.filter((e) => e.studentId === lms.currentStudent?.id).length;
  const categoryCount = lms.categories.length;

  return (
    <div className="space-y-4">
      {/* Catalog hero */}
      <AppCard tone="brand" className="p-5 bg-gradient-to-br from-stsn-brown/[0.06] to-stsn-gold/[0.04]">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[10px] font-mono uppercase tracking-widest text-stsn-gold">Digital Classroom</p>
            <h2 className="text-xl font-display font-black text-stsn-brown-dark mt-1">Course Catalog</h2>
            <p className="text-xs text-stone-600 mt-1 max-w-xl">
              Browse premium academic resources, pre-recorded lectures, and interactive modules designed for the modern learner.
            </p>
          </div>
          <div className="flex items-center gap-3">
            {[
              { label: "Published", value: publishedCount, icon: BookOpen },
              { label: "My Courses", value: myEnrolledCount, icon: Play },
              { label: "Subjects", value: categoryCount, icon: Layers },
            ].map(({ label, value, icon: Icon }) => (
              <div key={label} className="rounded-xl border border-stsn-beige/70 bg-white/70 px-4 py-2.5 text-center min-w-[84px]">
                <div className="flex items-center justify-center gap-1.5">
                  <Icon className="w-3.5 h-3.5 text-stsn-gold" />
                  <span className="text-lg font-black text-stsn-brown-dark leading-none">{value}</span>
                </div>
                <p className="text-[9px] font-mono uppercase tracking-widest text-stone-400 mt-1">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </AppCard>

      {/* Filters */}
      <AppCard className="flex flex-wrap items-center gap-3 p-4" tone="brand">
        <AppSearchInput
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search courses, instructors…"
          wrapperClassName="min-w-[220px] flex-1"
        />
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="bg-white border border-stone-200 rounded-xl py-2 px-3 text-xs font-medium text-stone-700 focus:outline-none cursor-pointer"
        >
          <option value="All">All Categories</option>
          {lms.categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <div className="flex items-center gap-2">
          {DIFFICULTIES.map((d) => (
            <AppFilterChip key={d} label={d} active={difficulty === d} onClick={() => setDifficulty(d)} />
          ))}
        </div>
        {canCreate && (
          <AppButton
            variant="primary"
            size="sm"
            leftIcon={Plus}
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          >
            New Course
          </AppButton>
        )}
      </AppCard>

      {/* Grid */}
      {filtered.length === 0 ? (
        <AppEmptyState
          icon={BookOpen}
          title="No courses found"
          description="Try adjusting your search or filters."
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((c) => (
            <CourseCard key={c.id} course={c} lms={lms} onOpen={openCourse} onEnroll={canEnroll ? handleEnroll : openCourse} />
          ))}
        </div>
      )}

      {formOpen && (
        <CourseForm
          lms={lms}
          course={editing}
          onClose={() => setFormOpen(false)}
          onToast={onToast}
        />
      )}
    </div>
  );
}
