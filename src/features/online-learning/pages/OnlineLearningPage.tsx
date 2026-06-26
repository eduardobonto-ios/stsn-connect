/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useMemo } from "react";
import { useSTSNStore } from "../../../services/store";
import { LearningMaterial } from "../../../types";
import { getAcademicScopedData } from "../../../services/academicUnitScopeService";
import {
  BookOpen,
  Video,
  FileText,
  Upload,
  Plus,
  Search,
  Filter,
  Eye,
  Download,
  Edit2,
  Trash2,
  Globe,
  Lock,
  Play,
  X,
  CheckCircle,
  AlertCircle,
  Sparkles,
  ChevronDown,
  Monitor,
  FileIcon
} from "lucide-react";
import ModulePageHeader from "../../../components/common/ModulePageHeader";
import AppFilterChip from "../../../components/common/AppFilterChip";

type LMSTab = "browse" | "manage" | "upload";

const TYPE_COLORS: Record<string, string> = {
  Video: "bg-blue-100 text-blue-700 border-blue-200",
  Module: "bg-emerald-100 text-emerald-700 border-emerald-200",
  Document: "bg-amber-100 text-amber-700 border-amber-200"
};

const TYPE_ICONS: Record<string, React.ReactNode> = {
  Video: <Video className="w-4 h-4" />,
  Module: <BookOpen className="w-4 h-4" />,
  Document: <FileText className="w-4 h-4" />
};

function VideoPlayerModal({ material, onClose }: { material: LearningMaterial; onClose: () => void }) {
  return (
    <div className="app-modal-backdrop z-50 animate-fade-in" onClick={onClose}>
      <div
        className="bg-stone-900 rounded-2xl shadow-2xl w-full max-w-3xl mx-4 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-3 border-b border-white/10">
          <div>
            <p className="text-[9px] uppercase font-mono tracking-widest text-stone-400 mb-0.5">Now Playing</p>
            <h3 className="text-sm font-bold text-white leading-tight">{material.title}</h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 text-stone-400 hover:text-white transition-all cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>
        {material.videoUrl ? (
          <div className="aspect-video w-full bg-black">
            <iframe
              src={material.videoUrl}
              title={material.title}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        ) : (
          <div className="aspect-video flex items-center justify-center bg-stone-800 text-stone-400">
            <p className="text-sm">No video URL available</p>
          </div>
        )}
        <div className="px-5 py-3 border-t border-white/10">
          <p className="text-xs text-stone-400">{material.description}</p>
          <div className="flex items-center gap-3 mt-2 text-[10px] font-mono text-stone-500">
            <span>{material.subjectName}</span>
            <span>•</span>
            <span>{material.section}</span>
            <span>•</span>
            <span>{material.teacherName}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function MaterialCard({
  material,
  isTeacher,
  onEdit,
  onDelete,
  onTogglePublish,
  onView
}: {
  key?: React.Key;
  material: LearningMaterial;
  isTeacher: boolean;
  onEdit?: (m: LearningMaterial) => void;
  onDelete?: (id: string) => void;
  onTogglePublish?: (id: string) => void;
  onView: (m: LearningMaterial) => void;
}) {
  const isVideo = material.learningType === "Video";
  const isPublished = material.publishStatus === "Published";

  const thumb = material.thumbnailUrl
    ? `url("${material.thumbnailUrl}")`
    : undefined;

  return (
    <div className="bg-white rounded-2xl border border-stone-200/70 shadow-sm hover:shadow-lg transition-all duration-200 overflow-hidden group flex flex-col">
      {/* Thumbnail */}
      <div
        className="h-36 bg-gradient-to-br from-stsn-brown/10 to-stsn-gold/5 relative flex-shrink-0 cursor-pointer overflow-hidden"
        style={thumb ? { backgroundImage: thumb, backgroundSize: "cover", backgroundPosition: "center" } : {}}
        onClick={() => onView(material)}
      >
        {!thumb && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-12 h-12 rounded-2xl bg-stsn-brown/10 flex items-center justify-center">
              {isVideo ? <Play className="w-6 h-6 text-stsn-brown/50" /> : <FileIcon className="w-6 h-6 text-stsn-brown/50" />}
            </div>
          </div>
        )}
        {isVideo && thumb && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-all">
            <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center shadow-lg">
              <Play className="w-5 h-5 text-stsn-brown ml-0.5" />
            </div>
          </div>
        )}
        {/* Status badge */}
        <div className={`absolute top-2 right-2 px-2 py-0.5 rounded-full text-[9px] font-bold font-mono flex items-center gap-1 ${
          isPublished ? "bg-emerald-500/90 text-white" : "bg-stone-600/90 text-stone-100"
        }`}>
          {isPublished ? <Globe className="w-2.5 h-2.5" /> : <Lock className="w-2.5 h-2.5" />}
          {material.publishStatus}
        </div>
        {/* Type badge */}
        <div className={`absolute top-2 left-2 px-2 py-0.5 rounded-full text-[9px] font-bold border flex items-center gap-1 ${TYPE_COLORS[material.learningType]}`}>
          {TYPE_ICONS[material.learningType]}
          {material.learningType}
        </div>
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col flex-1">
        <h3
          className="text-sm font-bold text-stone-800 leading-snug line-clamp-2 cursor-pointer hover:text-stsn-brown transition-colors"
          onClick={() => onView(material)}
        >
          {material.title}
        </h3>
        <p className="text-[10px] text-stone-500 mt-1.5 line-clamp-2 leading-relaxed flex-1">{material.description}</p>

        <div className="mt-3 space-y-1">
          <div className="flex items-center gap-1 text-[10px] text-stone-500">
            <BookOpen className="w-3 h-3 flex-shrink-0 text-stsn-gold" />
            <span className="truncate font-medium">{material.subjectName}</span>
          </div>
          <div className="flex items-center gap-1 text-[10px] text-stone-500">
            <Monitor className="w-3 h-3 flex-shrink-0 text-stsn-gold" />
            <span className="truncate">{material.section} • {material.teacherName}</span>
          </div>
          <div className="flex items-center gap-1 text-[10px] text-stone-400">
            <span>Uploaded {material.uploadDate}</span>
            {material.fileSize && <><span>•</span><span>{material.fileSize}</span></>}
          </div>
        </div>

        {/* Actions */}
        <div className="mt-3 pt-3 border-t border-stone-100 flex items-center gap-2">
          <button
            onClick={() => onView(material)}
            className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 rounded-lg bg-stsn-brown hover:bg-stsn-brown-dark text-white text-[11px] font-semibold transition-all cursor-pointer"
          >
            {isVideo ? <Play className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
            {isVideo ? "Watch" : "Open"}
          </button>
          {!isVideo && (
            <button className="flex items-center justify-center gap-1 px-3 py-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 text-[11px] font-semibold transition-all cursor-pointer">
              <Download className="w-3 h-3" />
              Save
            </button>
          )}
          {isTeacher && (
            <>
              <button
                onClick={() => onTogglePublish?.(material.id)}
                className={`p-1.5 rounded-lg transition-all cursor-pointer ${isPublished ? "text-amber-500 hover:bg-amber-50" : "text-emerald-500 hover:bg-emerald-50"}`}
                title={isPublished ? "Unpublish" : "Publish"}
              >
                {isPublished ? <Lock className="w-3.5 h-3.5" /> : <Globe className="w-3.5 h-3.5" />}
              </button>
              <button
                onClick={() => onEdit?.(material)}
                className="p-1.5 rounded-lg text-blue-500 hover:bg-blue-50 transition-all cursor-pointer"
                title="Edit"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => onDelete?.(material.id)}
                className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 transition-all cursor-pointer"
                title="Delete"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

const emptyForm = (): Omit<LearningMaterial, "id"> => ({
  schoolId: "STSN",
  title: "",
  description: "",
  subjectCode: "",
  subjectName: "",
  section: "",
  teacherId: "",
  teacherName: "",
  learningType: "Video",
  videoUrl: "",
  fileName: "",
  fileSize: "",
  thumbnailUrl: "",
  publishStatus: "Draft",
  uploadDate: new Date().toISOString().split("T")[0],
  department: "Basic Education",
  yearLevel: "",
  trackOrCourse: ""
});

export default function OnlineLearning() {
  const {
    currentUser,
    learningMaterials,
    teachers,
    subjects,
    students,
    activeSchool,
    academicUnit,
    addLearningMaterial,
    updateLearningMaterial,
    deleteLearningMaterial,
    toggleLearningMaterialPublish
  } = useSTSNStore();

  const isTeacher = currentUser?.role === "TEACHER" || currentUser?.role === "SUPER_ADMIN" || currentUser?.role === "ADMIN";
  const isStudent = currentUser?.role === "STUDENT";
  const scopedData = useMemo(
    () =>
      getAcademicScopedData({
        currentUser,
        activeSchool,
        academicUnit,
        students,
        teachers,
        subjects,
        learningMaterials,
      }),
    [currentUser, activeSchool, academicUnit, students, teachers, subjects, learningMaterials],
  );
  const scopedMaterials = scopedData.learningMaterials ?? [];
  const scopedTeachers = scopedData.teachers ?? [];
  const userSchool = scopedData.scope.schoolId || "STSN";

  const [activeTab, setActiveTab] = useState<LMSTab>(isTeacher ? "browse" : "browse");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"All" | "Video" | "Module" | "Document">("All");
  const [filterSubject, setFilterSubject] = useState("All");
  const [viewingMaterial, setViewingMaterial] = useState<LearningMaterial | null>(null);
  const [editingMaterial, setEditingMaterial] = useState<LearningMaterial | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [form, setForm] = useState<Omit<LearningMaterial, "id">>(emptyForm());
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  // For students only show published
  const visibleMaterials = isStudent
    ? scopedMaterials.filter((m) => m.publishStatus === "Published")
    : scopedMaterials;

  // Search and filter
  const filteredMaterials = visibleMaterials.filter((m) => {
    const q = searchQuery.toLowerCase();
    const matchSearch =
      !q ||
      m.title.toLowerCase().includes(q) ||
      m.subjectName.toLowerCase().includes(q) ||
      m.teacherName.toLowerCase().includes(q) ||
      m.description.toLowerCase().includes(q);
    const matchType = filterType === "All" || m.learningType === filterType;
    const matchSubject = filterSubject === "All" || m.subjectName === filterSubject;
    return matchSearch && matchType && matchSubject;
  });

  const uniqueSubjects = Array.from(new Set(visibleMaterials.map((m) => m.subjectName)));

  const currentTeacher = scopedTeachers.find((t) => t.email === currentUser?.email) || scopedTeachers[0];

  // Stats
  const totalPublished = visibleMaterials.filter((m) => m.publishStatus === "Published").length;
  const totalDrafts = visibleMaterials.filter((m) => m.publishStatus === "Draft").length;
  const totalVideos = visibleMaterials.filter((m) => m.learningType === "Video").length;
  const totalDocs = visibleMaterials.filter((m) => m.learningType !== "Video").length;

  const handleOpenUpload = (material?: LearningMaterial) => {
    if (material) {
      setEditingMaterial(material);
      setForm({ ...material });
    } else {
      setEditingMaterial(null);
      setForm({
        ...emptyForm(),
        schoolId: userSchool as any,
        teacherId: currentTeacher?.id || "",
        teacherName: `${currentTeacher?.firstName || ""} ${currentTeacher?.lastName || ""}`.trim() || currentUser?.name || ""
      });
    }
    setIsFormOpen(true);
  };

  const handleSave = () => {
    if (!form.title || !form.subjectName || !form.section) {
      showToast("Please fill in all required fields.", "error");
      return;
    }
    if (editingMaterial) {
      updateLearningMaterial(editingMaterial.id, form);
      showToast("Learning material updated successfully.");
    } else {
      addLearningMaterial(form);
      showToast("Learning material added successfully.");
    }
    setIsFormOpen(false);
    setEditingMaterial(null);
  };

  const handleDelete = (id: string) => {
    deleteLearningMaterial(id);
    setDeleteConfirm(null);
    showToast("Material deleted.");
  };

  const manageMaterials = isTeacher
    ? scopedMaterials.filter((m) => m.teacherId === currentTeacher?.id || currentUser?.role === "SUPER_ADMIN" || currentUser?.role === "ADMIN")
    : [];

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-5 right-5 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-xl text-sm font-semibold animate-fade-in ${
          toast.type === "success" ? "bg-emerald-600 text-white" : "bg-red-600 text-white"
        }`}>
          {toast.type === "success" ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {toast.msg}
        </div>
      )}

      {/* Video Player Modal */}
      {viewingMaterial && viewingMaterial.learningType === "Video" && (
        <VideoPlayerModal material={viewingMaterial} onClose={() => setViewingMaterial(null)} />
      )}

      {/* Delete Confirm Modal */}
      {deleteConfirm && (
        <div className="app-modal-backdrop z-50 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm mx-4 text-center">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-3">
              <Trash2 className="w-6 h-6 text-red-500" />
            </div>
            <h3 className="text-base font-bold text-stone-800 mb-1">Delete Material?</h3>
            <p className="text-xs text-stone-500 mb-4">This action cannot be undone.</p>
            <div className="flex gap-2">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 py-2 rounded-lg border border-stone-200 text-stone-600 text-sm font-medium hover:bg-stone-50 cursor-pointer">Cancel</button>
              <button onClick={() => handleDelete(deleteConfirm)} className="flex-1 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-medium cursor-pointer">Delete</button>
            </div>
          </div>
        </div>
      )}

      <ModulePageHeader
        badge="LMS"
        badgeIcon={Monitor}
        title="Online Learning"
        subtitle="Digital classroom — browse, manage, and upload course materials"
        meta="Digital Classroom"
        actions={
          isTeacher ? (
            <button
              onClick={() => handleOpenUpload()}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#C5A059] hover:bg-[#d4af68] text-[#1C1512] rounded-xl text-sm font-bold shadow-lg transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Upload Material
            </button>
          ) : undefined
        }
      />

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Published", value: totalPublished, color: "from-emerald-500 to-emerald-600", icon: <Globe className="w-4 h-4" /> },
          { label: "Drafts", value: totalDrafts, color: "from-stone-400 to-stone-500", icon: <Lock className="w-4 h-4" /> },
          { label: "Videos", value: totalVideos, color: "from-blue-500 to-blue-600", icon: <Video className="w-4 h-4" /> },
          { label: "Docs / Modules", value: totalDocs, color: "from-stsn-brown to-stsn-gold", icon: <FileText className="w-4 h-4" /> }
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl border border-stone-200/60 p-3 shadow-sm flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center text-white flex-shrink-0`}>
              {s.icon}
            </div>
            <div>
              <p className="text-xl font-display font-black text-stone-800 leading-none">{s.value}</p>
              <p className="text-[10px] text-stone-400 font-mono uppercase tracking-wide mt-0.5">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-stone-100 rounded-xl p-1 w-fit">
        {([
          { id: "browse", label: "Browse All", icon: <BookOpen className="w-3.5 h-3.5" /> },
          ...(isTeacher ? [{ id: "manage", label: "My Materials", icon: <Edit2 className="w-3.5 h-3.5" /> }] : [])
        ] as { id: LMSTab; label: string; icon: React.ReactNode }[]).map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === tab.id
                ? "bg-stsn-brown text-white shadow-sm"
                : "text-stone-600 hover:text-stone-800"
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search & Filter Row */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-stone-400" />
          <input
            type="text"
            placeholder="Search lessons, subjects, teachers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-stone-200 rounded-xl py-2 pl-9 pr-4 text-sm font-medium text-stone-800 focus:outline-none focus:ring-2 focus:ring-stsn-brown/20 focus:border-stsn-brown transition-all"
          />
        </div>
        <div className="flex items-center gap-2">
          {(["All", "Video", "Module", "Document"] as const).map((t) => (
            <AppFilterChip
              key={t}
              label={t}
              active={filterType === t}
              onClick={() => setFilterType(t)}
            />
          ))}
        </div>
        {uniqueSubjects.length > 0 && (
          <select
            value={filterSubject}
            onChange={(e) => setFilterSubject(e.target.value)}
            className="bg-white border border-stone-200 rounded-xl py-2 px-3 text-xs font-medium text-stone-700 focus:outline-none cursor-pointer"
          >
            <option value="All">All Subjects</option>
            {uniqueSubjects.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        )}
      </div>

      {/* Content */}
      {activeTab === "browse" && (
        <>
          {filteredMaterials.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 rounded-2xl bg-stone-100 flex items-center justify-center mx-auto mb-3">
                <BookOpen className="w-7 h-7 text-stone-300" />
              </div>
              <p className="text-sm font-semibold text-stone-500">No learning materials found</p>
              <p className="text-xs text-stone-400 mt-1">Try adjusting your search or filters</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredMaterials.map((m) => (
                <MaterialCard
                  key={m.id}
                  material={m}
                  isTeacher={isTeacher}
                  onView={(mat) => setViewingMaterial(mat)}
                  onEdit={handleOpenUpload}
                  onDelete={(id) => setDeleteConfirm(id)}
                  onTogglePublish={toggleLearningMaterialPublish}
                />
              ))}
            </div>
          )}
        </>
      )}

      {activeTab === "manage" && isTeacher && (
        <div className="bg-white rounded-2xl border border-stone-200/70 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-stone-100 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-stone-800">My Uploaded Materials</h3>
              <p className="text-[10px] text-stone-400 font-mono mt-0.5">{manageMaterials.length} total items</p>
            </div>
            <button
              onClick={() => handleOpenUpload()}
              className="flex items-center gap-1.5 px-3 py-2 bg-stsn-brown hover:bg-stsn-brown-dark text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Add New
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="stsn-plain-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th style={{ textAlign: "left" }}>Type</th>
                  <th style={{ textAlign: "left" }}>Subject</th>
                  <th style={{ textAlign: "left" }}>Section</th>
                  <th style={{ textAlign: "left" }}>Status</th>
                  <th style={{ textAlign: "left" }}>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {manageMaterials.map((m) => (
                  <tr key={m.id}>
                    <td>
                      <p className="font-semibold text-stone-800 max-w-[200px] truncate">{m.title}</p>
                    </td>
                    <td>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${TYPE_COLORS[m.learningType]}`}>
                        {m.learningType}
                      </span>
                    </td>
                    <td className="text-stone-600 max-w-[160px] truncate">{m.subjectName}</td>
                    <td className="text-stone-500">{m.section}</td>
                    <td>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                        m.publishStatus === "Published"
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-stone-100 text-stone-500"
                      }`}>
                        {m.publishStatus}
                      </span>
                    </td>
                    <td className="text-stone-400">{m.uploadDate}</td>
                    <td>
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setViewingMaterial(m)}
                          className="p-1.5 rounded-lg text-stone-400 hover:text-stsn-brown hover:bg-stsn-cream transition-all cursor-pointer"
                          title="Preview"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => toggleLearningMaterialPublish(m.id)}
                          className="p-1.5 rounded-lg text-stone-400 hover:text-emerald-600 hover:bg-emerald-50 transition-all cursor-pointer"
                          title={m.publishStatus === "Published" ? "Unpublish" : "Publish"}
                        >
                          {m.publishStatus === "Published" ? <Lock className="w-3.5 h-3.5" /> : <Globe className="w-3.5 h-3.5" />}
                        </button>
                        <button
                          onClick={() => handleOpenUpload(m)}
                          className="p-1.5 rounded-lg text-stone-400 hover:text-blue-600 hover:bg-blue-50 transition-all cursor-pointer"
                          title="Edit"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(m.id)}
                          className="p-1.5 rounded-lg text-stone-400 hover:text-red-500 hover:bg-red-50 transition-all cursor-pointer"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {manageMaterials.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-stone-400 text-xs">
                      No materials uploaded yet. Click "Add New" to get started.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Upload / Edit Form Modal */}
      {isFormOpen && (
        <div className="app-modal-backdrop z-50 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            {/* Form Header */}
            <div className="sticky top-0 bg-white px-6 py-4 border-b border-stone-100 flex items-center justify-between z-10">
              <div>
                <h3 className="text-base font-bold text-stone-800">
                  {editingMaterial ? "Edit Learning Material" : "Upload Learning Material"}
                </h3>
                <p className="text-[10px] text-stone-400 font-mono mt-0.5">Fill in the fields below</p>
              </div>
              <button onClick={() => setIsFormOpen(false)} className="p-1.5 rounded-lg hover:bg-stone-100 text-stone-400 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Title */}
              <div>
                <label className="block text-xs font-semibold text-stone-600 mb-1">Learning Title <span className="text-red-400">*</span></label>
                <input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full border border-stone-200 rounded-xl py-2.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-stsn-brown/20"
                  placeholder="e.g. Algebra Basics: Linear Equations"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-stone-600 mb-1">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={3}
                  className="w-full border border-stone-200 rounded-xl py-2.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-stsn-brown/20 resize-none"
                  placeholder="Brief description of the learning material..."
                />
              </div>

              {/* 2-col grid */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-600 mb-1">Subject Name <span className="text-red-400">*</span></label>
                  <input
                    value={form.subjectName}
                    onChange={(e) => setForm({ ...form, subjectName: e.target.value })}
                    className="w-full border border-stone-200 rounded-xl py-2.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-stsn-brown/20"
                    placeholder="e.g. General Mathematics"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-600 mb-1">Subject Code</label>
                  <input
                    value={form.subjectCode}
                    onChange={(e) => setForm({ ...form, subjectCode: e.target.value })}
                    className="w-full border border-stone-200 rounded-xl py-2.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-stsn-brown/20"
                    placeholder="e.g. SHS-GEN-MATH"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-600 mb-1">Section / Class <span className="text-red-400">*</span></label>
                  <input
                    value={form.section}
                    onChange={(e) => setForm({ ...form, section: e.target.value })}
                    className="w-full border border-stone-200 rounded-xl py-2.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-stsn-brown/20"
                    placeholder="e.g. St. Thomas"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-600 mb-1">Year Level</label>
                  <input
                    value={form.yearLevel || ""}
                    onChange={(e) => setForm({ ...form, yearLevel: e.target.value })}
                    className="w-full border border-stone-200 rounded-xl py-2.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-stsn-brown/20"
                    placeholder="e.g. Grade 11 / 1st Year"
                  />
                </div>
              </div>

              {/* Learning Type */}
              <div>
                <label className="block text-xs font-semibold text-stone-600 mb-2">Learning Type</label>
                <div className="flex gap-2">
                  {(["Video", "Module", "Document"] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setForm({ ...form, learningType: t })}
                      className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                        form.learningType === t
                          ? "bg-stsn-brown text-white border-stsn-brown"
                          : "bg-stone-50 text-stone-600 border-stone-200 hover:border-stsn-brown/40"
                      }`}
                    >
                      {TYPE_ICONS[t]}
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* Video URL or File */}
              {form.learningType === "Video" ? (
                <div>
                  <label className="block text-xs font-semibold text-stone-600 mb-1">Video URL (YouTube / Vimeo embed)</label>
                  <input
                    value={form.videoUrl || ""}
                    onChange={(e) => setForm({ ...form, videoUrl: e.target.value })}
                    className="w-full border border-stone-200 rounded-xl py-2.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-stsn-brown/20"
                    placeholder="https://www.youtube.com/embed/..."
                  />
                  <div>
                    <label className="block text-xs font-semibold text-stone-600 mb-1 mt-3">Thumbnail URL (optional)</label>
                    <input
                      value={form.thumbnailUrl || ""}
                      onChange={(e) => setForm({ ...form, thumbnailUrl: e.target.value })}
                      className="w-full border border-stone-200 rounded-xl py-2.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-stsn-brown/20"
                      placeholder="https://img.youtube.com/vi/VIDEO_ID/hqdefault.jpg"
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-semibold text-stone-600 mb-1">Upload File (PDF, DOCX, PPTX)</label>
                  <div
                    className="border-2 border-dashed border-stone-200 rounded-xl p-5 text-center cursor-pointer hover:border-stsn-brown/40 transition-all group"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="w-8 h-8 text-stone-300 group-hover:text-stsn-brown mx-auto mb-2 transition-colors" />
                    <p className="text-xs font-semibold text-stone-500">Click to upload or drag & drop</p>
                    <p className="text-[10px] text-stone-400 mt-0.5">Supports: PDF, DOC, DOCX, PPT, PPTX, JPG, PNG (max 50MB)</p>
                    {form.fileName && (
                      <div className="mt-2 px-3 py-1.5 bg-stsn-cream rounded-lg text-xs font-semibold text-stsn-brown inline-block">
                        {form.fileName}
                      </div>
                    )}
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.doc,.docx,.ppt,.pptx,.jpg,.png,.mp4"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setForm({
                          ...form,
                          fileName: file.name,
                          fileSize: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
                          fileUrl: "#uploaded-file"
                        });
                      }
                    }}
                  />
                </div>
              )}

              {/* Publish Status */}
              <div>
                <label className="block text-xs font-semibold text-stone-600 mb-2">Publish Status</label>
                <div className="flex gap-2">
                  {(["Published", "Draft"] as const).map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setForm({ ...form, publishStatus: s })}
                      className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                        form.publishStatus === s
                          ? s === "Published"
                            ? "bg-emerald-600 text-white border-emerald-600"
                            : "bg-stone-600 text-white border-stone-600"
                          : "bg-stone-50 text-stone-600 border-stone-200"
                      }`}
                    >
                      {s === "Published" ? <Globe className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Save Button */}
              <div className="pt-2 flex gap-2">
                <button
                  onClick={() => setIsFormOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-stone-200 text-stone-600 text-sm font-medium hover:bg-stone-50 cursor-pointer transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="flex-1 py-2.5 rounded-xl bg-stsn-brown hover:bg-stsn-brown-dark text-white text-sm font-bold cursor-pointer transition-all flex items-center justify-center gap-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  {editingMaterial ? "Save Changes" : "Upload Material"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Document viewer notice for non-video */}
      {viewingMaterial && viewingMaterial.learningType !== "Video" && (
        <div className="app-modal-backdrop z-50 animate-fade-in" onClick={() => setViewingMaterial(null)}>
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md mx-4 text-center" onClick={(e) => e.stopPropagation()}>
            <div className="w-14 h-14 rounded-2xl bg-stsn-cream flex items-center justify-center mx-auto mb-4">
              <FileText className="w-7 h-7 text-stsn-brown" />
            </div>
            <h3 className="text-base font-bold text-stone-800 mb-1">{viewingMaterial.title}</h3>
            <p className="text-xs text-stone-500 mb-2">{viewingMaterial.subjectName} • {viewingMaterial.section}</p>
            <p className="text-xs text-stone-400 mb-4">{viewingMaterial.description}</p>
            {viewingMaterial.fileName && (
              <p className="text-[10px] font-mono text-stone-400 mb-4 bg-stone-50 rounded-lg px-3 py-2">
                {viewingMaterial.fileName} {viewingMaterial.fileSize && `• ${viewingMaterial.fileSize}`}
              </p>
            )}
            <div className="flex gap-2">
              <button onClick={() => setViewingMaterial(null)} className="flex-1 py-2 rounded-lg border border-stone-200 text-xs font-medium cursor-pointer">
                Close
              </button>
              <button className="flex-1 py-2 rounded-lg bg-stsn-brown text-white text-xs font-bold flex items-center justify-center gap-1 cursor-pointer">
                <Download className="w-3.5 h-3.5" />
                Download
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
