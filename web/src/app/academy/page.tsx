"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";

/* ─── Types ─── */

interface AcademyModule {
  id: number;
  title: string;
  description: string;
  category: string;
  created_at: string;
}

interface AcademyVideo {
  id: number;
  module_id: number;
  title: string;
  url: string;
  duration: string;
  source: string;
  sort_order: number;
}

interface AcademyQuiz {
  id: number;
  title: string;
  category: string;
  created_at: string;
}

interface AcademyQuestion {
  id: number;
  quiz_id: number;
  question: string;
  options: string[];
  correct_index: number;
}

interface AcademyScore {
  id: number;
  employee_id: string;
  quiz_id: number;
  score: number;
  max_score: number;
  completed_at: string;
  employee_name?: string;
  quiz_title?: string;
}

interface ModuleForm {
  title: string;
  description: string;
  category: string;
}

interface VideoForm {
  title: string;
  url: string;
  duration: string;
  source: string;
}

interface QuizForm {
  title: string;
  category: string;
}

interface QuestionForm {
  question: string;
  options: string[];
  correct_index: number;
}

type Tab = "modules" | "quizzes" | "scores";

/* ─── Constants ─── */

const CATEGORIES = [
  "Brand Knowledge",
  "Product Knowledge",
  "Sales Technique",
  "Foot Health & Fitting",
  "Gait & Biomechanics",
  "Shoe Technology",
  "Culture",
  "History",
  "General",
];

const inputClass =
  "w-full px-3 py-2 bg-charcoal-light border border-charcoal-light rounded-lg text-cream text-sm focus:outline-none focus:border-teal";

const emptyModuleForm: ModuleForm = { title: "", description: "", category: "General" };
const emptyVideoForm: VideoForm = { title: "", url: "", duration: "", source: "" };
const emptyQuizForm: QuizForm = { title: "", category: "General" };
const emptyQuestionForm: QuestionForm = {
  question: "",
  options: ["", "", "", ""],
  correct_index: 0,
};

/* ─── Helpers ─── */

function formatDate(d: string | null): string {
  if (!d) return "-";
  return new Date(d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatDateTime(d: string | null): string {
  if (!d) return "-";
  return new Date(d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

/* ─── Main Component ─── */

export default function AcademyPage() {
  const supabase = createClient();

  // Tab state
  const [activeTab, setActiveTab] = useState<Tab>("modules");

  // Modules state
  const [modules, setModules] = useState<AcademyModule[]>([]);
  const [videos, setVideos] = useState<AcademyVideo[]>([]);
  const [selectedModule, setSelectedModule] = useState<AcademyModule | null>(null);
  const [showModuleModal, setShowModuleModal] = useState(false);
  const [editingModule, setEditingModule] = useState<AcademyModule | null>(null);
  const [moduleForm, setModuleForm] = useState<ModuleForm>(emptyModuleForm);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [editingVideo, setEditingVideo] = useState<AcademyVideo | null>(null);
  const [videoForm, setVideoForm] = useState<VideoForm>(emptyVideoForm);

  // Quizzes state
  const [quizzes, setQuizzes] = useState<AcademyQuiz[]>([]);
  const [questions, setQuestions] = useState<AcademyQuestion[]>([]);
  const [selectedQuiz, setSelectedQuiz] = useState<AcademyQuiz | null>(null);
  const [showQuizModal, setShowQuizModal] = useState(false);
  const [editingQuiz, setEditingQuiz] = useState<AcademyQuiz | null>(null);
  const [quizForm, setQuizForm] = useState<QuizForm>(emptyQuizForm);
  const [showQuestionModal, setShowQuestionModal] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<AcademyQuestion | null>(null);
  const [questionForm, setQuestionForm] = useState<QuestionForm>(emptyQuestionForm);

  // Scores state
  const [scores, setScores] = useState<AcademyScore[]>([]);
  const [scoreFilterQuiz, setScoreFilterQuiz] = useState<string>("");
  const [scoreFilterEmployee, setScoreFilterEmployee] = useState<string>("");
  const [scoreFilterDateFrom, setScoreFilterDateFrom] = useState<string>("");
  const [scoreFilterDateTo, setScoreFilterDateTo] = useState<string>("");

  // Common state
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [moduleSearch, setModuleSearch] = useState("");
  const [quizSearch, setQuizSearch] = useState("");

  /* ─── Data Loading ─── */

  const loadModules = useCallback(async () => {
    const { data } = await supabase
      .from("academy_modules")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) setModules(data);
  }, [supabase]);

  const loadVideos = useCallback(
    async (moduleId: number) => {
      const { data } = await supabase
        .from("academy_videos")
        .select("*")
        .eq("module_id", moduleId)
        .order("sort_order", { ascending: true });
      if (data) setVideos(data);
    },
    [supabase]
  );

  const loadQuizzes = useCallback(async () => {
    const { data } = await supabase
      .from("academy_quizzes")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) setQuizzes(data);
  }, [supabase]);

  const loadQuestions = useCallback(
    async (quizId: number) => {
      const { data } = await supabase
        .from("academy_questions")
        .select("*")
        .eq("quiz_id", quizId)
        .order("id", { ascending: true });
      if (data) setQuestions(data);
    },
    [supabase]
  );

  const loadScores = useCallback(async () => {
    const { data } = await supabase
      .from("academy_scores")
      .select("*, employees:employee_id(name), quiz:quiz_id(title)")
      .order("completed_at", { ascending: false });
    if (data) {
      const mapped: AcademyScore[] = data.map(
        (s: Record<string, unknown>) => ({
          id: s.id as number,
          employee_id: s.employee_id as string,
          quiz_id: s.quiz_id as number,
          score: s.score as number,
          max_score: s.max_score as number,
          completed_at: s.completed_at as string,
          employee_name:
            (s.employees as Record<string, string> | null)?.name ?? "Unknown",
          quiz_title:
            (s.quiz as Record<string, string> | null)?.title ?? "Unknown",
        })
      );
      setScores(mapped);
    }
  }, [supabase]);

  useEffect(() => {
    async function init() {
      setLoading(true);
      await Promise.all([loadModules(), loadQuizzes(), loadScores()]);
      setLoading(false);
    }
    init();
  }, [loadModules, loadQuizzes, loadScores]);

  useEffect(() => {
    if (selectedModule) loadVideos(selectedModule.id);
  }, [selectedModule, loadVideos]);

  useEffect(() => {
    if (selectedQuiz) loadQuestions(selectedQuiz.id);
  }, [selectedQuiz, loadQuestions]);

  /* ─── Module CRUD ─── */

  function openAddModule() {
    setEditingModule(null);
    setModuleForm(emptyModuleForm);
    setShowModuleModal(true);
    setError("");
  }

  function openEditModule(m: AcademyModule) {
    setEditingModule(m);
    setModuleForm({ title: m.title, description: m.description, category: m.category });
    setShowModuleModal(true);
    setError("");
  }

  async function saveModule() {
    if (!moduleForm.title.trim()) {
      setError("Module title is required.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      if (editingModule) {
        const { error: err } = await supabase
          .from("academy_modules")
          .update({
            title: moduleForm.title.trim(),
            description: moduleForm.description.trim(),
            category: moduleForm.category,
          })
          .eq("id", editingModule.id);
        if (err) throw err;
      } else {
        const { error: err } = await supabase.from("academy_modules").insert({
          title: moduleForm.title.trim(),
          description: moduleForm.description.trim(),
          category: moduleForm.category,
        });
        if (err) throw err;
      }
      setShowModuleModal(false);
      await loadModules();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to save module.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteModule(id: number) {
    if (!confirm("Delete this module and all its videos?")) return;
    setSaving(true);
    try {
      await supabase.from("academy_videos").delete().eq("module_id", id);
      const { error: err } = await supabase.from("academy_modules").delete().eq("id", id);
      if (err) throw err;
      if (selectedModule?.id === id) {
        setSelectedModule(null);
        setVideos([]);
      }
      await loadModules();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to delete module.");
    } finally {
      setSaving(false);
    }
  }

  /* ─── Video CRUD ─── */

  function openAddVideo() {
    if (!selectedModule) return;
    setEditingVideo(null);
    setVideoForm(emptyVideoForm);
    setShowVideoModal(true);
    setError("");
  }

  function openEditVideo(v: AcademyVideo) {
    setEditingVideo(v);
    setVideoForm({
      title: v.title,
      url: v.url,
      duration: v.duration,
      source: v.source,
    });
    setShowVideoModal(true);
    setError("");
  }

  async function saveVideo() {
    if (!videoForm.title.trim() || !videoForm.url.trim()) {
      setError("Video title and URL are required.");
      return;
    }
    if (!selectedModule) return;
    setSaving(true);
    setError("");
    try {
      if (editingVideo) {
        const { error: err } = await supabase
          .from("academy_videos")
          .update({
            title: videoForm.title.trim(),
            url: videoForm.url.trim(),
            duration: videoForm.duration.trim(),
            source: videoForm.source.trim(),
          })
          .eq("id", editingVideo.id);
        if (err) throw err;
      } else {
        const maxOrder = videos.reduce((max, v) => Math.max(max, v.sort_order), 0);
        const { error: err } = await supabase.from("academy_videos").insert({
          module_id: selectedModule.id,
          title: videoForm.title.trim(),
          url: videoForm.url.trim(),
          duration: videoForm.duration.trim(),
          source: videoForm.source.trim(),
          sort_order: maxOrder + 1,
        });
        if (err) throw err;
      }
      setShowVideoModal(false);
      await loadVideos(selectedModule.id);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to save video.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteVideo(id: number) {
    if (!confirm("Delete this video?")) return;
    if (!selectedModule) return;
    setSaving(true);
    try {
      const { error: err } = await supabase.from("academy_videos").delete().eq("id", id);
      if (err) throw err;
      await loadVideos(selectedModule.id);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to delete video.");
    } finally {
      setSaving(false);
    }
  }

  /* ─── Quiz CRUD ─── */

  function openAddQuiz() {
    setEditingQuiz(null);
    setQuizForm(emptyQuizForm);
    setShowQuizModal(true);
    setError("");
  }

  function openEditQuiz(q: AcademyQuiz) {
    setEditingQuiz(q);
    setQuizForm({ title: q.title, category: q.category });
    setShowQuizModal(true);
    setError("");
  }

  async function saveQuiz() {
    if (!quizForm.title.trim()) {
      setError("Quiz title is required.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      if (editingQuiz) {
        const { error: err } = await supabase
          .from("academy_quizzes")
          .update({
            title: quizForm.title.trim(),
            category: quizForm.category,
          })
          .eq("id", editingQuiz.id);
        if (err) throw err;
      } else {
        const { error: err } = await supabase.from("academy_quizzes").insert({
          title: quizForm.title.trim(),
          category: quizForm.category,
        });
        if (err) throw err;
      }
      setShowQuizModal(false);
      await loadQuizzes();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to save quiz.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteQuiz(id: number) {
    if (!confirm("Delete this quiz and all its questions?")) return;
    setSaving(true);
    try {
      await supabase.from("academy_questions").delete().eq("quiz_id", id);
      await supabase.from("academy_scores").delete().eq("quiz_id", id);
      const { error: err } = await supabase.from("academy_quizzes").delete().eq("id", id);
      if (err) throw err;
      if (selectedQuiz?.id === id) {
        setSelectedQuiz(null);
        setQuestions([]);
      }
      await Promise.all([loadQuizzes(), loadScores()]);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to delete quiz.");
    } finally {
      setSaving(false);
    }
  }

  /* ─── Question CRUD ─── */

  function openAddQuestion() {
    if (!selectedQuiz) return;
    setEditingQuestion(null);
    setQuestionForm({ ...emptyQuestionForm, options: ["", "", "", ""] });
    setShowQuestionModal(true);
    setError("");
  }

  function openEditQuestion(q: AcademyQuestion) {
    setEditingQuestion(q);
    setQuestionForm({
      question: q.question,
      options: [...q.options],
      correct_index: q.correct_index,
    });
    setShowQuestionModal(true);
    setError("");
  }

  async function saveQuestion() {
    if (!questionForm.question.trim()) {
      setError("Question text is required.");
      return;
    }
    if (questionForm.options.some((o) => !o.trim())) {
      setError("All 4 answer options are required.");
      return;
    }
    if (!selectedQuiz) return;
    setSaving(true);
    setError("");
    try {
      const payload = {
        question: questionForm.question.trim(),
        options: questionForm.options.map((o) => o.trim()),
        correct_index: questionForm.correct_index,
      };
      if (editingQuestion) {
        const { error: err } = await supabase
          .from("academy_questions")
          .update(payload)
          .eq("id", editingQuestion.id);
        if (err) throw err;
      } else {
        const { error: err } = await supabase
          .from("academy_questions")
          .insert({ ...payload, quiz_id: selectedQuiz.id });
        if (err) throw err;
      }
      setShowQuestionModal(false);
      await loadQuestions(selectedQuiz.id);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to save question.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteQuestion(id: number) {
    if (!confirm("Delete this question?")) return;
    if (!selectedQuiz) return;
    setSaving(true);
    try {
      const { error: err } = await supabase
        .from("academy_questions")
        .delete()
        .eq("id", id);
      if (err) throw err;
      await loadQuestions(selectedQuiz.id);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to delete question.");
    } finally {
      setSaving(false);
    }
  }

  /* ─── Filtered Data ─── */

  const filteredModules = modules.filter(
    (m) =>
      m.title.toLowerCase().includes(moduleSearch.toLowerCase()) ||
      m.category.toLowerCase().includes(moduleSearch.toLowerCase())
  );

  const filteredQuizzes = quizzes.filter(
    (q) =>
      q.title.toLowerCase().includes(quizSearch.toLowerCase()) ||
      q.category.toLowerCase().includes(quizSearch.toLowerCase())
  );

  const filteredScores = scores.filter((s) => {
    if (scoreFilterQuiz && s.quiz_id.toString() !== scoreFilterQuiz) return false;
    if (
      scoreFilterEmployee &&
      !(s.employee_name ?? "").toLowerCase().includes(scoreFilterEmployee.toLowerCase())
    )
      return false;
    if (scoreFilterDateFrom && s.completed_at < scoreFilterDateFrom) return false;
    if (scoreFilterDateTo && s.completed_at > scoreFilterDateTo + "T23:59:59") return false;
    return true;
  });

  // Average scores per quiz
  const quizAverages: Record<number, { title: string; avg: number; count: number }> = {};
  for (const s of filteredScores) {
    if (!quizAverages[s.quiz_id]) {
      quizAverages[s.quiz_id] = { title: s.quiz_title ?? "Unknown", avg: 0, count: 0 };
    }
    quizAverages[s.quiz_id].count++;
    quizAverages[s.quiz_id].avg += s.max_score > 0 ? (s.score / s.max_score) * 100 : 0;
  }
  for (const key of Object.keys(quizAverages)) {
    const k = Number(key);
    quizAverages[k].avg = Math.round(quizAverages[k].avg / quizAverages[k].count);
  }

  /* ─── Render ─── */

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <p className="text-xs font-bold text-teal-light tracking-widest mb-1">
            MANAGEMENT
          </p>
          <h1 className="text-3xl font-extrabold text-cream tracking-tight">Academy</h1>
          <p className="text-sm text-cream-muted mt-1">
            Manage learning modules, quizzes, and view employee quiz scores.
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-1 bg-charcoal-mid rounded-xl p-1 mb-6 w-fit">
          {(
            [
              { key: "modules", label: "Learn Modules" },
              { key: "quizzes", label: "Quizzes" },
              { key: "scores", label: "Quiz Scores" },
            ] as { key: Tab; label: string }[]
          ).map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-5 py-2 rounded-lg text-sm font-semibold transition-colors ${
                activeTab === tab.key
                  ? "bg-teal/20 text-teal-light"
                  : "text-cream-muted hover:text-cream hover:bg-charcoal-light"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Error Banner */}
        {error && (
          <div className="mb-4 px-4 py-3 bg-red/10 border border-red/30 rounded-lg text-red text-sm">
            {error}
            <button
              onClick={() => setError("")}
              className="ml-3 text-red/70 hover:text-red font-bold"
            >
              x
            </button>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="w-8 h-8 border-2 border-teal border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* ═══════════════════════ MODULES TAB ═══════════════════════ */}
            {activeTab === "modules" && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Module List Panel */}
                <div className="lg:col-span-1">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-bold text-cream">Modules</h2>
                    <button
                      onClick={openAddModule}
                      className="px-3 py-1.5 bg-teal text-charcoal text-xs font-bold rounded-lg hover:bg-teal-light transition-colors"
                    >
                      + Add Module
                    </button>
                  </div>
                  <input
                    type="text"
                    placeholder="Search modules..."
                    value={moduleSearch}
                    onChange={(e) => setModuleSearch(e.target.value)}
                    className={`${inputClass} mb-3`}
                  />
                  <div className="space-y-2 max-h-[calc(100vh-320px)] overflow-y-auto pr-1">
                    {filteredModules.length === 0 ? (
                      <p className="text-cream-muted text-sm py-8 text-center">
                        No modules yet. Click &quot;+ Add Module&quot; to create one.
                      </p>
                    ) : (
                      filteredModules.map((m) => (
                        <button
                          key={m.id}
                          onClick={() => setSelectedModule(m)}
                          className={`w-full text-left p-3 rounded-lg border transition-colors ${
                            selectedModule?.id === m.id
                              ? "bg-teal/10 border-teal/40 text-cream"
                              : "bg-charcoal-mid border-charcoal-light text-cream hover:border-teal/20"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-bold truncate">{m.title}</p>
                              <p className="text-xs text-cream-muted mt-0.5 truncate">
                                {m.description || "No description"}
                              </p>
                            </div>
                            <span className="text-[10px] font-semibold text-teal-light bg-teal/15 px-2 py-0.5 rounded-full whitespace-nowrap">
                              {m.category}
                            </span>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </div>

                {/* Module Detail Panel */}
                <div className="lg:col-span-2">
                  {selectedModule ? (
                    <div className="bg-charcoal-mid border border-charcoal-light rounded-xl p-6">
                      <div className="flex items-start justify-between mb-6">
                        <div>
                          <h2 className="text-xl font-bold text-cream">
                            {selectedModule.title}
                          </h2>
                          <p className="text-sm text-cream-muted mt-1">
                            {selectedModule.description || "No description"}
                          </p>
                          <div className="flex items-center gap-3 mt-2">
                            <span className="text-[10px] font-semibold text-teal-light bg-teal/15 px-2 py-0.5 rounded-full">
                              {selectedModule.category}
                            </span>
                            <span className="text-xs text-cream-muted">
                              Created {formatDate(selectedModule.created_at)}
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => openEditModule(selectedModule)}
                            className="px-3 py-1.5 text-xs font-semibold text-cream border border-charcoal-light rounded-lg hover:bg-charcoal-light transition-colors"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => deleteModule(selectedModule.id)}
                            className="px-3 py-1.5 text-xs font-semibold text-red border border-red/30 rounded-lg hover:bg-red/10 transition-colors"
                          >
                            Delete
                          </button>
                        </div>
                      </div>

                      {/* Videos Section */}
                      <div className="border-t border-charcoal-light pt-4">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-sm font-bold text-cream tracking-wide">
                            VIDEOS ({videos.length})
                          </h3>
                          <button
                            onClick={openAddVideo}
                            className="px-3 py-1.5 bg-teal/20 text-teal-light text-xs font-bold rounded-lg hover:bg-teal/30 transition-colors"
                          >
                            + Add Video
                          </button>
                        </div>
                        {videos.length === 0 ? (
                          <p className="text-cream-muted text-sm py-4 text-center">
                            No videos in this module yet.
                          </p>
                        ) : (
                          <div className="space-y-2">
                            {videos.map((v) => (
                              <div
                                key={v.id}
                                className="flex items-center gap-3 p-3 bg-charcoal rounded-lg border border-charcoal-light"
                              >
                                <div className="w-10 h-10 rounded-lg bg-teal/15 flex items-center justify-center flex-shrink-0">
                                  <span className="text-teal-light text-lg">&#9654;</span>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-semibold text-cream truncate">
                                    {v.title}
                                  </p>
                                  <p className="text-xs text-cream-muted">
                                    {v.source} &middot; {v.duration}
                                  </p>
                                </div>
                                <a
                                  href={v.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs text-teal-light hover:text-teal underline"
                                >
                                  Open
                                </a>
                                <button
                                  onClick={() => openEditVideo(v)}
                                  className="text-xs text-cream-muted hover:text-cream"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => deleteVideo(v.id)}
                                  className="text-xs text-red/70 hover:text-red"
                                >
                                  Delete
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-64 bg-charcoal-mid border border-charcoal-light rounded-xl">
                      <p className="text-cream-muted text-sm">
                        Select a module to view its details and videos.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ═══════════════════════ QUIZZES TAB ═══════════════════════ */}
            {activeTab === "quizzes" && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Quiz List Panel */}
                <div className="lg:col-span-1">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-bold text-cream">Quizzes</h2>
                    <button
                      onClick={openAddQuiz}
                      className="px-3 py-1.5 bg-teal text-charcoal text-xs font-bold rounded-lg hover:bg-teal-light transition-colors"
                    >
                      + Add Quiz
                    </button>
                  </div>
                  <input
                    type="text"
                    placeholder="Search quizzes..."
                    value={quizSearch}
                    onChange={(e) => setQuizSearch(e.target.value)}
                    className={`${inputClass} mb-3`}
                  />
                  <div className="space-y-2 max-h-[calc(100vh-320px)] overflow-y-auto pr-1">
                    {filteredQuizzes.length === 0 ? (
                      <p className="text-cream-muted text-sm py-8 text-center">
                        No quizzes yet. Click &quot;+ Add Quiz&quot; to create one.
                      </p>
                    ) : (
                      filteredQuizzes.map((q) => {
                        const qCount = questions.length;
                        return (
                          <button
                            key={q.id}
                            onClick={() => setSelectedQuiz(q)}
                            className={`w-full text-left p-3 rounded-lg border transition-colors ${
                              selectedQuiz?.id === q.id
                                ? "bg-teal/10 border-teal/40 text-cream"
                                : "bg-charcoal-mid border-charcoal-light text-cream hover:border-teal/20"
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-bold truncate">{q.title}</p>
                                <p className="text-xs text-cream-muted mt-0.5">
                                  {selectedQuiz?.id === q.id
                                    ? `${qCount} question${qCount !== 1 ? "s" : ""}`
                                    : formatDate(q.created_at)}
                                </p>
                              </div>
                              <span className="text-[10px] font-semibold text-teal-light bg-teal/15 px-2 py-0.5 rounded-full whitespace-nowrap">
                                {q.category}
                              </span>
                            </div>
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Quiz Detail Panel */}
                <div className="lg:col-span-2">
                  {selectedQuiz ? (
                    <div className="bg-charcoal-mid border border-charcoal-light rounded-xl p-6">
                      <div className="flex items-start justify-between mb-6">
                        <div>
                          <h2 className="text-xl font-bold text-cream">
                            {selectedQuiz.title}
                          </h2>
                          <div className="flex items-center gap-3 mt-2">
                            <span className="text-[10px] font-semibold text-teal-light bg-teal/15 px-2 py-0.5 rounded-full">
                              {selectedQuiz.category}
                            </span>
                            <span className="text-xs text-cream-muted">
                              {questions.length} question
                              {questions.length !== 1 ? "s" : ""}
                            </span>
                            <span className="text-xs text-cream-muted">
                              Created {formatDate(selectedQuiz.created_at)}
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => openEditQuiz(selectedQuiz)}
                            className="px-3 py-1.5 text-xs font-semibold text-cream border border-charcoal-light rounded-lg hover:bg-charcoal-light transition-colors"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => deleteQuiz(selectedQuiz.id)}
                            className="px-3 py-1.5 text-xs font-semibold text-red border border-red/30 rounded-lg hover:bg-red/10 transition-colors"
                          >
                            Delete
                          </button>
                        </div>
                      </div>

                      {/* Questions Section */}
                      <div className="border-t border-charcoal-light pt-4">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-sm font-bold text-cream tracking-wide">
                            QUESTIONS ({questions.length})
                          </h3>
                          <button
                            onClick={openAddQuestion}
                            className="px-3 py-1.5 bg-teal/20 text-teal-light text-xs font-bold rounded-lg hover:bg-teal/30 transition-colors"
                          >
                            + Add Question
                          </button>
                        </div>
                        {questions.length === 0 ? (
                          <p className="text-cream-muted text-sm py-4 text-center">
                            No questions in this quiz yet.
                          </p>
                        ) : (
                          <div className="space-y-3">
                            {questions.map((q, idx) => (
                              <div
                                key={q.id}
                                className="p-4 bg-charcoal rounded-lg border border-charcoal-light"
                              >
                                <div className="flex items-start justify-between gap-3 mb-3">
                                  <div className="flex-1">
                                    <p className="text-sm font-semibold text-cream">
                                      <span className="text-teal-light mr-2">
                                        Q{idx + 1}.
                                      </span>
                                      {q.question}
                                    </p>
                                  </div>
                                  <div className="flex gap-2 flex-shrink-0">
                                    <button
                                      onClick={() => openEditQuestion(q)}
                                      className="text-xs text-cream-muted hover:text-cream"
                                    >
                                      Edit
                                    </button>
                                    <button
                                      onClick={() => deleteQuestion(q.id)}
                                      className="text-xs text-red/70 hover:text-red"
                                    >
                                      Delete
                                    </button>
                                  </div>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                  {q.options.map((opt, i) => (
                                    <div
                                      key={i}
                                      className={`px-3 py-2 rounded-lg text-xs ${
                                        i === q.correct_index
                                          ? "bg-green/15 text-green border border-green/30 font-semibold"
                                          : "bg-charcoal-mid text-cream-muted border border-charcoal-light"
                                      }`}
                                    >
                                      <span className="font-bold mr-1.5">
                                        {String.fromCharCode(65 + i)}.
                                      </span>
                                      {opt}
                                      {i === q.correct_index && (
                                        <span className="ml-1.5 text-green">&#10003;</span>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-64 bg-charcoal-mid border border-charcoal-light rounded-xl">
                      <p className="text-cream-muted text-sm">
                        Select a quiz to view and manage its questions.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ═══════════════════════ SCORES TAB ═══════════════════════ */}
            {activeTab === "scores" && (
              <div className="space-y-6">
                {/* Average Scores Summary */}
                {Object.keys(quizAverages).length > 0 && (
                  <div>
                    <h2 className="text-sm font-bold text-cream tracking-wide mb-3">
                      AVERAGE SCORES BY QUIZ
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                      {Object.values(quizAverages).map((qa) => (
                        <div
                          key={qa.title}
                          className="bg-charcoal-mid border border-charcoal-light rounded-xl p-4"
                        >
                          <p className="text-xs text-cream-muted font-semibold truncate">
                            {qa.title}
                          </p>
                          <p className="text-2xl font-extrabold text-cream mt-1">
                            {qa.avg}%
                          </p>
                          <p className="text-xs text-cream-muted mt-0.5">
                            {qa.count} attempt{qa.count !== 1 ? "s" : ""}
                          </p>
                          <div className="mt-2 h-1.5 bg-charcoal-light rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                qa.avg >= 80
                                  ? "bg-green"
                                  : qa.avg >= 60
                                  ? "bg-amber"
                                  : "bg-red"
                              }`}
                              style={{ width: `${qa.avg}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Filters */}
                <div className="flex flex-wrap gap-3 items-end">
                  <div>
                    <label className="block text-xs text-cream-muted font-semibold mb-1">
                      Quiz
                    </label>
                    <select
                      value={scoreFilterQuiz}
                      onChange={(e) => setScoreFilterQuiz(e.target.value)}
                      className={`${inputClass} w-48`}
                    >
                      <option value="">All Quizzes</option>
                      {quizzes.map((q) => (
                        <option key={q.id} value={q.id.toString()}>
                          {q.title}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-cream-muted font-semibold mb-1">
                      Employee
                    </label>
                    <input
                      type="text"
                      placeholder="Search by name..."
                      value={scoreFilterEmployee}
                      onChange={(e) => setScoreFilterEmployee(e.target.value)}
                      className={`${inputClass} w-48`}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-cream-muted font-semibold mb-1">
                      From
                    </label>
                    <input
                      type="date"
                      value={scoreFilterDateFrom}
                      onChange={(e) => setScoreFilterDateFrom(e.target.value)}
                      className={`${inputClass} w-40`}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-cream-muted font-semibold mb-1">
                      To
                    </label>
                    <input
                      type="date"
                      value={scoreFilterDateTo}
                      onChange={(e) => setScoreFilterDateTo(e.target.value)}
                      className={`${inputClass} w-40`}
                    />
                  </div>
                  {(scoreFilterQuiz ||
                    scoreFilterEmployee ||
                    scoreFilterDateFrom ||
                    scoreFilterDateTo) && (
                    <button
                      onClick={() => {
                        setScoreFilterQuiz("");
                        setScoreFilterEmployee("");
                        setScoreFilterDateFrom("");
                        setScoreFilterDateTo("");
                      }}
                      className="px-3 py-2 text-xs font-semibold text-cream-muted hover:text-cream border border-charcoal-light rounded-lg hover:bg-charcoal-light transition-colors"
                    >
                      Clear Filters
                    </button>
                  )}
                </div>

                {/* Scores Table */}
                <div className="bg-charcoal-mid border border-charcoal-light rounded-xl overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-charcoal-light">
                          <th className="text-left px-4 py-3 text-xs font-bold text-cream-muted tracking-wider">
                            EMPLOYEE
                          </th>
                          <th className="text-left px-4 py-3 text-xs font-bold text-cream-muted tracking-wider">
                            QUIZ
                          </th>
                          <th className="text-center px-4 py-3 text-xs font-bold text-cream-muted tracking-wider">
                            SCORE
                          </th>
                          <th className="text-center px-4 py-3 text-xs font-bold text-cream-muted tracking-wider">
                            PERCENTAGE
                          </th>
                          <th className="text-left px-4 py-3 text-xs font-bold text-cream-muted tracking-wider">
                            DATE
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredScores.length === 0 ? (
                          <tr>
                            <td
                              colSpan={5}
                              className="text-center py-12 text-cream-muted"
                            >
                              No quiz scores found.
                            </td>
                          </tr>
                        ) : (
                          filteredScores.map((s) => {
                            const pct =
                              s.max_score > 0
                                ? Math.round((s.score / s.max_score) * 100)
                                : 0;
                            return (
                              <tr
                                key={s.id}
                                className="border-b border-charcoal-light/50 hover:bg-charcoal-light/30 transition-colors"
                              >
                                <td className="px-4 py-3 text-cream font-medium">
                                  {s.employee_name}
                                </td>
                                <td className="px-4 py-3 text-cream-muted">
                                  {s.quiz_title}
                                </td>
                                <td className="px-4 py-3 text-center text-cream">
                                  {s.score}/{s.max_score}
                                </td>
                                <td className="px-4 py-3 text-center">
                                  <span
                                    className={`inline-block px-2 py-0.5 rounded-full text-xs font-bold ${
                                      pct >= 80
                                        ? "bg-green/15 text-green"
                                        : pct >= 60
                                        ? "bg-amber/15 text-amber"
                                        : "bg-red/15 text-red"
                                    }`}
                                  >
                                    {pct}%
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-cream-muted text-xs">
                                  {formatDateTime(s.completed_at)}
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* ═══════════════════════ MODALS ═══════════════════════ */}

        {/* Module Modal */}
        {showModuleModal && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="bg-charcoal-mid border border-charcoal-light rounded-xl w-full max-w-lg p-6">
              <h3 className="text-lg font-bold text-cream mb-4">
                {editingModule ? "Edit Module" : "Add Module"}
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs text-cream-muted font-semibold mb-1">
                    Title *
                  </label>
                  <input
                    type="text"
                    value={moduleForm.title}
                    onChange={(e) =>
                      setModuleForm({ ...moduleForm, title: e.target.value })
                    }
                    className={inputClass}
                    placeholder="e.g. Hoka Brand Training"
                  />
                </div>
                <div>
                  <label className="block text-xs text-cream-muted font-semibold mb-1">
                    Description
                  </label>
                  <textarea
                    value={moduleForm.description}
                    onChange={(e) =>
                      setModuleForm({ ...moduleForm, description: e.target.value })
                    }
                    className={`${inputClass} h-24 resize-none`}
                    placeholder="Brief description of what this module covers..."
                  />
                </div>
                <div>
                  <label className="block text-xs text-cream-muted font-semibold mb-1">
                    Category
                  </label>
                  <select
                    value={moduleForm.category}
                    onChange={(e) =>
                      setModuleForm({ ...moduleForm, category: e.target.value })
                    }
                    className={inputClass}
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              {error && (
                <p className="text-red text-xs mt-3">{error}</p>
              )}
              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowModuleModal(false);
                    setError("");
                  }}
                  className="px-4 py-2 text-sm text-cream-muted hover:text-cream border border-charcoal-light rounded-lg hover:bg-charcoal-light transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={saveModule}
                  disabled={saving}
                  className="px-4 py-2 text-sm font-bold bg-teal text-charcoal rounded-lg hover:bg-teal-light transition-colors disabled:opacity-50"
                >
                  {saving ? "Saving..." : editingModule ? "Save Changes" : "Create Module"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Video Modal */}
        {showVideoModal && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="bg-charcoal-mid border border-charcoal-light rounded-xl w-full max-w-lg p-6">
              <h3 className="text-lg font-bold text-cream mb-4">
                {editingVideo ? "Edit Video" : "Add Video"}
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs text-cream-muted font-semibold mb-1">
                    Title *
                  </label>
                  <input
                    type="text"
                    value={videoForm.title}
                    onChange={(e) =>
                      setVideoForm({ ...videoForm, title: e.target.value })
                    }
                    className={inputClass}
                    placeholder="e.g. Hoka Technology Overview"
                  />
                </div>
                <div>
                  <label className="block text-xs text-cream-muted font-semibold mb-1">
                    YouTube URL *
                  </label>
                  <input
                    type="url"
                    value={videoForm.url}
                    onChange={(e) =>
                      setVideoForm({ ...videoForm, url: e.target.value })
                    }
                    className={inputClass}
                    placeholder="https://www.youtube.com/watch?v=..."
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-cream-muted font-semibold mb-1">
                      Duration
                    </label>
                    <input
                      type="text"
                      value={videoForm.duration}
                      onChange={(e) =>
                        setVideoForm({ ...videoForm, duration: e.target.value })
                      }
                      className={inputClass}
                      placeholder="e.g. 3:45"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-cream-muted font-semibold mb-1">
                      Source
                    </label>
                    <input
                      type="text"
                      value={videoForm.source}
                      onChange={(e) =>
                        setVideoForm({ ...videoForm, source: e.target.value })
                      }
                      className={inputClass}
                      placeholder="e.g. Hoka"
                    />
                  </div>
                </div>
              </div>
              {error && (
                <p className="text-red text-xs mt-3">{error}</p>
              )}
              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowVideoModal(false);
                    setError("");
                  }}
                  className="px-4 py-2 text-sm text-cream-muted hover:text-cream border border-charcoal-light rounded-lg hover:bg-charcoal-light transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={saveVideo}
                  disabled={saving}
                  className="px-4 py-2 text-sm font-bold bg-teal text-charcoal rounded-lg hover:bg-teal-light transition-colors disabled:opacity-50"
                >
                  {saving ? "Saving..." : editingVideo ? "Save Changes" : "Add Video"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Quiz Modal */}
        {showQuizModal && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="bg-charcoal-mid border border-charcoal-light rounded-xl w-full max-w-lg p-6">
              <h3 className="text-lg font-bold text-cream mb-4">
                {editingQuiz ? "Edit Quiz" : "Add Quiz"}
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs text-cream-muted font-semibold mb-1">
                    Title *
                  </label>
                  <input
                    type="text"
                    value={quizForm.title}
                    onChange={(e) =>
                      setQuizForm({ ...quizForm, title: e.target.value })
                    }
                    className={inputClass}
                    placeholder="e.g. Brand Knowledge Quiz"
                  />
                </div>
                <div>
                  <label className="block text-xs text-cream-muted font-semibold mb-1">
                    Category
                  </label>
                  <select
                    value={quizForm.category}
                    onChange={(e) =>
                      setQuizForm({ ...quizForm, category: e.target.value })
                    }
                    className={inputClass}
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              {error && (
                <p className="text-red text-xs mt-3">{error}</p>
              )}
              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowQuizModal(false);
                    setError("");
                  }}
                  className="px-4 py-2 text-sm text-cream-muted hover:text-cream border border-charcoal-light rounded-lg hover:bg-charcoal-light transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={saveQuiz}
                  disabled={saving}
                  className="px-4 py-2 text-sm font-bold bg-teal text-charcoal rounded-lg hover:bg-teal-light transition-colors disabled:opacity-50"
                >
                  {saving ? "Saving..." : editingQuiz ? "Save Changes" : "Create Quiz"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Question Modal */}
        {showQuestionModal && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="bg-charcoal-mid border border-charcoal-light rounded-xl w-full max-w-lg p-6">
              <h3 className="text-lg font-bold text-cream mb-4">
                {editingQuestion ? "Edit Question" : "Add Question"}
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs text-cream-muted font-semibold mb-1">
                    Question *
                  </label>
                  <textarea
                    value={questionForm.question}
                    onChange={(e) =>
                      setQuestionForm({ ...questionForm, question: e.target.value })
                    }
                    className={`${inputClass} h-20 resize-none`}
                    placeholder="Enter the question text..."
                  />
                </div>
                <div>
                  <label className="block text-xs text-cream-muted font-semibold mb-2">
                    Answer Options *
                  </label>
                  <div className="space-y-2">
                    {questionForm.options.map((opt, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            setQuestionForm({ ...questionForm, correct_index: i })
                          }
                          className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 border transition-colors ${
                            questionForm.correct_index === i
                              ? "bg-green/20 border-green/50 text-green"
                              : "border-charcoal-light text-cream-muted hover:border-cream-muted"
                          }`}
                          title={
                            questionForm.correct_index === i
                              ? "Correct answer"
                              : "Click to mark as correct"
                          }
                        >
                          {String.fromCharCode(65 + i)}
                        </button>
                        <input
                          type="text"
                          value={opt}
                          onChange={(e) => {
                            const newOpts = [...questionForm.options];
                            newOpts[i] = e.target.value;
                            setQuestionForm({ ...questionForm, options: newOpts });
                          }}
                          className={`${inputClass} flex-1`}
                          placeholder={`Option ${String.fromCharCode(65 + i)}...`}
                        />
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-cream-muted mt-2">
                    Click a letter to mark it as the correct answer. Currently correct:{" "}
                    <span className="text-green font-bold">
                      {String.fromCharCode(65 + questionForm.correct_index)}
                    </span>
                  </p>
                </div>
              </div>
              {error && (
                <p className="text-red text-xs mt-3">{error}</p>
              )}
              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowQuestionModal(false);
                    setError("");
                  }}
                  className="px-4 py-2 text-sm text-cream-muted hover:text-cream border border-charcoal-light rounded-lg hover:bg-charcoal-light transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={saveQuestion}
                  disabled={saving}
                  className="px-4 py-2 text-sm font-bold bg-teal text-charcoal rounded-lg hover:bg-teal-light transition-colors disabled:opacity-50"
                >
                  {saving
                    ? "Saving..."
                    : editingQuestion
                    ? "Save Changes"
                    : "Add Question"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
