import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Linking,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  BookOpen, CheckCircle, XCircle, RotateCcw, Trophy,
  ChevronDown, ChevronUp, Play, ExternalLink, Share2,
  FileQuestion, Video, Brain,
} from "lucide-react-native";
import { COLORS } from "../../theme/colors";
import { useAppStore } from "../../store/appStore";
import { useAuthStore } from "../../store/authStore";
import { supabase, isSupabaseConfigured } from "../../services/supabase";
import { getRandomQuestions, CATEGORIES } from "../../data/mockTrivia";
import { BRAND_KNOWLEDGE, FIT_ZONE, VIDEO_RESOURCES } from "../../data/academyContent";

const DIFF_COLORS = { easy: COLORS.green, medium: COLORS.amber, hard: COLORS.rose };
const CAT_LABELS = {
  history: "History",
  product: "Product Knowledge",
  technique: "Sales Technique",
  culture: "Culture",
  brand: "Brand",
};

/* ─────────────────────────────────────────────────────────────────────────────
 * HARDCODED QUIZ FALLBACK DATA
 * Used when Supabase is not configured. Provides two sample quizzes built
 * from the existing mockTrivia question bank.
 * ────────────────────────────────────────────────────────────────────────── */
const FALLBACK_QUIZZES = [
  {
    id: "fallback-quiz-product",
    title: "Product Knowledge Basics",
    category: "product",
    description: "Test your shoe construction and material knowledge.",
    question_count: 5,
  },
  {
    id: "fallback-quiz-technique",
    title: "Sales Technique Essentials",
    category: "technique",
    description: "How well do you know the Joy-Per's sales approach?",
    question_count: 5,
  },
  {
    id: "fallback-quiz-brand",
    title: "Brand & Culture",
    category: "brand",
    description: "Joy-Per's heritage, values, and neuro-retail principles.",
    question_count: 5,
  },
];

/**
 * Build fallback questions for a given quiz from the local trivia bank.
 * Maps them into the same shape as Supabase academy_questions rows.
 */
function getFallbackQuestions(quizId) {
  const catMap = {
    "fallback-quiz-product": "product",
    "fallback-quiz-technique": "technique",
    "fallback-quiz-brand": "brand",
  };
  const cat = catMap[quizId];
  if (!cat) return [];

  const pool = getRandomQuestions(25).filter((q) => q.category === cat);
  return pool.slice(0, 5).map((q, idx) => ({
    id: q.id,
    question_text: q.question,
    option_a: q.options[0],
    option_b: q.options[1],
    option_c: q.options[2],
    option_d: q.options[3],
    correct_option: ["A", "B", "C", "D"][q.correct],
    explanation: q.explanation,
    sort_order: idx,
  }));
}

/* ─────────────────────────────────────────────────────────────────────────────
 * Extract a YouTube video ID from various URL formats
 * ────────────────────────────────────────────────────────────────────────── */
function extractYouTubeId(url) {
  if (!url) return null;
  // Match ?v=ID or &v=ID
  const longMatch = url.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
  if (longMatch) return longMatch[1];
  // Match youtu.be/ID
  const shortMatch = url.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
  if (shortMatch) return shortMatch[1];
  // Match /embed/ID
  const embedMatch = url.match(/\/embed\/([a-zA-Z0-9_-]{11})/);
  if (embedMatch) return embedMatch[1];
  // Fallback: last path segment
  const last = url.split("/").pop()?.split("?")[0];
  return last && last.length === 11 ? last : null;
}

/* ═══════════════════════════════════════════════════════════════════════════
 * SUB-COMPONENT: Supabase Quiz Session
 * Shows one question at a time with A/B/C/D options, score at end.
 * ═══════════════════════════════════════════════════════════════════════ */
function SupabaseQuizSession({ quiz, questions, onExit, onShareScore }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [complete, setComplete] = useState(false);

  const q = questions[currentIndex];
  const options = q
    ? [
        { label: "A", text: q.option_a },
        { label: "B", text: q.option_b },
        { label: "C", text: q.option_c },
        { label: "D", text: q.option_d },
      ]
    : [];

  const handleSelect = (label) => {
    if (selectedOption) return; // already answered
    setSelectedOption(label);
    if (label === q.correct_option) {
      setScore((s) => s + 1);
    }
  };

  const handleNext = () => {
    const nextIdx = currentIndex + 1;
    if (nextIdx >= questions.length) {
      setComplete(true);
    } else {
      setCurrentIndex(nextIdx);
      setSelectedOption(null);
    }
  };

  if (complete) {
    const total = questions.length;
    const pct = Math.round((score / total) * 100);
    return (
      <View style={styles.resultContainer}>
        <Trophy size={48} color={COLORS.amber} strokeWidth={1.5} />
        <Text style={styles.resultScore}>{score}/{total}</Text>
        <Text style={styles.resultPct}>{pct}% Correct</Text>
        <Text style={styles.resultLabel}>
          {pct >= 80
            ? "Excellent! You're ready."
            : pct >= 60
            ? "Good effort. Keep studying!"
            : "Review the material and try again."}
        </Text>
        <View style={styles.resultActions}>
          <TouchableOpacity style={styles.resetBtn} onPress={onExit}>
            <RotateCcw size={16} color={COLORS.charcoal} strokeWidth={2.5} />
            <Text style={styles.resetBtnText}>BACK TO QUIZZES</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.resetBtn, { backgroundColor: COLORS.violet }]}
            onPress={() => onShareScore(quiz.title, score, total)}
          >
            <Share2 size={16} color={COLORS.charcoal} strokeWidth={2.5} />
            <Text style={styles.resetBtnText}>SHARE SCORE</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (!q) return null;

  return (
    <View style={styles.quizContainer}>
      <View style={styles.quizProgress}>
        <Text style={styles.quizProgressText}>
          {currentIndex + 1} / {questions.length}
        </Text>
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              { width: `${(currentIndex / questions.length) * 100}%` },
            ]}
          />
        </View>
      </View>

      {quiz.category && (
        <View style={styles.diffBadge}>
          <Text style={[styles.diffText, { color: COLORS.teal }]}>
            {(CAT_LABELS[quiz.category] || quiz.category).toUpperCase()}
          </Text>
        </View>
      )}

      <Text style={styles.question}>{q.question_text}</Text>

      {options.map((opt) => {
        const isCorrect = opt.label === q.correct_option;
        const isSelected = opt.label === selectedOption;
        return (
          <TouchableOpacity
            key={opt.label}
            style={[
              styles.optionBtn,
              selectedOption && isCorrect && styles.optionCorrect,
              selectedOption && isSelected && !isCorrect && styles.optionWrong,
            ]}
            onPress={() => handleSelect(opt.label)}
            activeOpacity={selectedOption ? 1 : 0.8}
          >
            <Text
              style={[
                styles.optionText,
                selectedOption && isCorrect && { color: COLORS.green, fontWeight: "700" },
                selectedOption && isSelected && !isCorrect && { color: COLORS.red },
              ]}
            >
              {opt.label}. {opt.text}
            </Text>
            {selectedOption && isCorrect && (
              <CheckCircle size={18} color={COLORS.green} strokeWidth={2} />
            )}
            {selectedOption && isSelected && !isCorrect && (
              <XCircle size={18} color={COLORS.red} strokeWidth={2} />
            )}
          </TouchableOpacity>
        );
      })}

      {selectedOption && (
        <View style={styles.explanation}>
          {q.explanation ? (
            <Text style={styles.explanationText}>{q.explanation}</Text>
          ) : null}
          <TouchableOpacity style={styles.nextBtn} onPress={handleNext}>
            <Text style={styles.nextBtnText}>
              {currentIndex + 1 >= questions.length ? "FINISH" : "NEXT"} →
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
 * SUB-COMPONENT: Existing Trivia QuizView (kept from original)
 * ═══════════════════════════════════════════════════════════════════════ */
function TriviaQuizView({ session, onAnswer, onReset }) {
  const { questions, currentIndex, score, complete, answers } = session;

  if (complete) {
    const pct = Math.round((score / questions.length) * 100);
    return (
      <View style={styles.resultContainer}>
        <Trophy size={48} color={COLORS.amber} strokeWidth={1.5} />
        <Text style={styles.resultScore}>{score}/{questions.length}</Text>
        <Text style={styles.resultPct}>{pct}% Correct</Text>
        <Text style={styles.resultLabel}>
          {pct >= 80 ? "Excellent! You're ready." : pct >= 60 ? "Good effort. Keep studying!" : "Review the material and try again."}
        </Text>
        <TouchableOpacity style={styles.resetBtn} onPress={onReset}>
          <RotateCcw size={16} color={COLORS.charcoal} strokeWidth={2.5} />
          <Text style={styles.resetBtnText}>TRY AGAIN</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const q = questions[currentIndex];
  const lastAnswer = answers[answers.length - 1];
  const answered = lastAnswer && lastAnswer.questionId === q.id;

  return (
    <View style={styles.quizContainer}>
      <View style={styles.quizProgress}>
        <Text style={styles.quizProgressText}>{currentIndex + 1} / {questions.length}</Text>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${((currentIndex) / questions.length) * 100}%` }]} />
        </View>
      </View>

      <View style={[styles.diffBadge, { backgroundColor: DIFF_COLORS[q.difficulty] + "22" }]}>
        <Text style={[styles.diffText, { color: DIFF_COLORS[q.difficulty] }]}>
          {q.difficulty.toUpperCase()} · {CAT_LABELS[q.category] || q.category}
        </Text>
      </View>

      <Text style={styles.question}>{q.question}</Text>

      {q.options.map((opt, i) => (
        <TouchableOpacity
          key={i}
          style={[
            styles.optionBtn,
            answered && i === q.correct && styles.optionCorrect,
            answered && i === lastAnswer.selectedIndex && !lastAnswer.correct && styles.optionWrong,
          ]}
          onPress={() => !answered && onAnswer(i)}
          activeOpacity={answered ? 1 : 0.8}
        >
          <Text style={[
            styles.optionText,
            answered && i === q.correct && { color: COLORS.green, fontWeight: "700" },
            answered && i === lastAnswer.selectedIndex && !lastAnswer.correct && { color: COLORS.red },
          ]}>
            {opt}
          </Text>
          {answered && i === q.correct && <CheckCircle size={18} color={COLORS.green} strokeWidth={2} />}
          {answered && i === lastAnswer.selectedIndex && !lastAnswer.correct && <XCircle size={18} color={COLORS.red} strokeWidth={2} />}
        </TouchableOpacity>
      ))}

      {answered && (
        <View style={styles.explanation}>
          <Text style={styles.explanationText}>{q.explanation}</Text>
          <TouchableOpacity style={styles.nextBtn} onPress={() => onAnswer(-1)}>
            <Text style={styles.nextBtnText}>NEXT →</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
 * MAIN SCREEN
 * ═══════════════════════════════════════════════════════════════════════ */
export default function AcademyScreen() {
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);
  const { triviaSession, startTriviaSession, answerTrivia, resetTriviaSession, addSocialPost } =
    useAppStore();

  const [activeTab, setActiveTab] = useState("learn"); // "learn" | "quizzes" | "trivia"
  const [expandedId, setExpandedId] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  // ── Learn tab state ──
  const [modules, setModules] = useState([]);
  const [learnLoading, setLearnLoading] = useState(true);

  // ── Quiz tab state ──
  const [quizzes, setQuizzes] = useState([]);
  const [quizLoading, setQuizLoading] = useState(true);
  const [activeQuiz, setActiveQuiz] = useState(null); // quiz object being taken
  const [activeQuizQuestions, setActiveQuizQuestions] = useState([]); // questions for active quiz
  const [questionsLoading, setQuestionsLoading] = useState(false);

  // ── Fetch learn content ──
  const fetchLearnContent = useCallback(async () => {
    if (!isSupabaseConfigured()) {
      // Build modules from hardcoded data
      const hardcoded = [
        ...VIDEO_RESOURCES.map((cat) => ({
          id: `hc-${cat.category}`,
          title: cat.category,
          category: cat.category,
          videos: cat.videos.map((v) => ({
            id: v.id,
            title: v.title,
            source: v.source,
            duration: v.duration,
            url: v.url,
          })),
        })),
      ];
      setModules(hardcoded);
      setLearnLoading(false);
      return;
    }

    try {
      setLearnLoading(true);
      const { data: modulesData, error: modErr } = await supabase
        .from("academy_modules")
        .select("*")
        .order("sort_order", { ascending: true });

      if (modErr) throw modErr;

      if (!modulesData || modulesData.length === 0) {
        setModules([]);
        setLearnLoading(false);
        return;
      }

      const moduleIds = modulesData.map((m) => m.id);
      const { data: videosData, error: vidErr } = await supabase
        .from("academy_videos")
        .select("*")
        .in("module_id", moduleIds)
        .order("sort_order", { ascending: true });

      if (vidErr) throw vidErr;

      const grouped = modulesData.map((mod) => ({
        id: String(mod.id),
        title: mod.title,
        category: mod.category,
        description: mod.description,
        videos: (videosData || [])
          .filter((v) => v.module_id === mod.id)
          .map((v) => ({
            id: String(v.id),
            title: v.title,
            source: v.source || "",
            duration: v.duration || "",
            url: v.video_url || v.url || "",
          })),
      }));

      setModules(grouped);
    } catch (err) {
      console.error("Failed to fetch academy modules:", err.message);
      // Fall back to hardcoded
      const hardcoded = VIDEO_RESOURCES.map((cat) => ({
        id: `hc-${cat.category}`,
        title: cat.category,
        category: cat.category,
        videos: cat.videos.map((v) => ({
          id: v.id,
          title: v.title,
          source: v.source,
          duration: v.duration,
          url: v.url,
        })),
      }));
      setModules(hardcoded);
    } finally {
      setLearnLoading(false);
    }
  }, []);

  // ── Fetch quizzes ──
  const fetchQuizzes = useCallback(async () => {
    if (!isSupabaseConfigured()) {
      setQuizzes(FALLBACK_QUIZZES);
      setQuizLoading(false);
      return;
    }

    try {
      setQuizLoading(true);
      const { data, error } = await supabase
        .from("academy_quizzes")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      if (!data || data.length === 0) {
        setQuizzes(FALLBACK_QUIZZES);
      } else {
        setQuizzes(
          data.map((q) => ({
            id: String(q.id),
            title: q.title,
            category: q.category,
            description: q.description || "",
            question_count: q.question_count || 0,
          }))
        );
      }
    } catch (err) {
      console.error("Failed to fetch quizzes:", err.message);
      setQuizzes(FALLBACK_QUIZZES);
    } finally {
      setQuizLoading(false);
    }
  }, []);

  // ── Load a single quiz's questions ──
  const loadQuizQuestions = async (quiz) => {
    // Fallback quiz
    if (quiz.id.startsWith("fallback-")) {
      const qs = getFallbackQuestions(quiz.id);
      setActiveQuizQuestions(qs);
      setActiveQuiz(quiz);
      return;
    }

    try {
      setQuestionsLoading(true);
      const { data, error } = await supabase
        .from("academy_questions")
        .select("*")
        .eq("quiz_id", parseInt(quiz.id, 10))
        .order("sort_order", { ascending: true });

      if (error) throw error;

      if (!data || data.length === 0) {
        Alert.alert("No Questions", "This quiz has no questions yet.");
        return;
      }

      // Map DB format (question, options jsonb, correct_index) to component format
      const mapped = data.map((row) => {
        const opts = Array.isArray(row.options) ? row.options : [];
        return {
          id: row.id,
          question_text: row.question_text || row.question || "",
          option_a: row.option_a || opts[0] || "",
          option_b: row.option_b || opts[1] || "",
          option_c: row.option_c || opts[2] || "",
          option_d: row.option_d || opts[3] || "",
          correct_option: row.correct_option || ["A", "B", "C", "D"][row.correct_index ?? 0],
          explanation: row.explanation || "",
          sort_order: row.sort_order ?? 0,
        };
      });

      setActiveQuizQuestions(mapped);
      setActiveQuiz(quiz);
    } catch (err) {
      console.error("Failed to load quiz questions:", err.message);
      Alert.alert("Error", "Could not load quiz questions.");
    } finally {
      setQuestionsLoading(false);
    }
  };

  // ── Save score to Supabase ──
  const saveScore = async (quizId, scoreVal, total) => {
    if (!isSupabaseConfigured() || !user) return;
    if (quizId.startsWith("fallback-")) return;

    try {
      await supabase.from("academy_scores").insert({
        quiz_id: parseInt(quizId, 10),
        employee_id: user.id,
        score: scoreVal,
        max_score: total,
      });
    } catch (err) {
      console.error("Failed to save score:", err.message);
    }
  };

  // ── Share score as social post ──
  const handleShareScore = (quizTitle, scoreVal, total) => {
    const pct = Math.round((scoreVal / total) * 100);
    const content = `Just scored ${scoreVal}/${total} (${pct}%) on the "${quizTitle}" quiz in the Academy! ${
      pct >= 80 ? "Nailed it!" : "Time to study more!"
    }`;

    if (user) {
      addSocialPost(user.id, user.name || "Team Member", user.role || "employee", content);
      Alert.alert("Shared!", "Your score has been posted to the social feed.");
    }
  };

  // ── Exit quiz session and save ──
  const handleExitQuiz = () => {
    setActiveQuiz(null);
    setActiveQuizQuestions([]);
  };

  // ── Initial load ──
  useEffect(() => {
    fetchLearnContent();
    fetchQuizzes();
  }, [fetchLearnContent, fetchQuizzes]);

  // ── Pull to refresh ──
  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchLearnContent(), fetchQuizzes()]);
    setRefreshing(false);
  };

  const toggleExpand = (id) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  // ── Trivia helpers (kept from original) ──
  const startTrivia = (count = 10) => {
    startTriviaSession(getRandomQuestions(count));
  };

  const handleTriviaAnswer = (selectedIndex) => {
    if (selectedIndex === -1) {
      answerTrivia(triviaSession.questions[triviaSession.currentIndex].correct);
    } else {
      answerTrivia(selectedIndex);
    }
  };

  /* ─────────────────────────────────────────────────────────────────────────
   * RENDER: Active trivia session (full screen)
   * ────────────────────────────────────────────────────────────────────── */
  if (triviaSession) {
    return (
      <View style={styles.root}>
        <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
          <Text style={styles.eyebrow}>ACADEMY</Text>
          <Text style={styles.title}>Trivia Quiz</Text>
        </View>
        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <TriviaQuizView
            session={triviaSession}
            onAnswer={handleTriviaAnswer}
            onReset={resetTriviaSession}
          />
          <TouchableOpacity style={styles.exitBtn} onPress={resetTriviaSession}>
            <Text style={styles.exitBtnText}>EXIT QUIZ</Text>
          </TouchableOpacity>
          <View style={{ height: 32 }} />
        </ScrollView>
      </View>
    );
  }

  /* ─────────────────────────────────────────────────────────────────────────
   * RENDER: Active Supabase quiz session (full screen)
   * ────────────────────────────────────────────────────────────────────── */
  if (activeQuiz && activeQuizQuestions.length > 0) {
    return (
      <View style={styles.root}>
        <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
          <Text style={styles.eyebrow}>QUIZ</Text>
          <Text style={styles.title} numberOfLines={1}>{activeQuiz.title}</Text>
        </View>
        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <SupabaseQuizSession
            quiz={activeQuiz}
            questions={activeQuizQuestions}
            onExit={() => {
              handleExitQuiz();
            }}
            onShareScore={(title, scoreVal, total) => {
              saveScore(activeQuiz.id, scoreVal, total);
              handleShareScore(title, scoreVal, total);
            }}
          />
          <TouchableOpacity style={styles.exitBtn} onPress={handleExitQuiz}>
            <Text style={styles.exitBtnText}>EXIT QUIZ</Text>
          </TouchableOpacity>
          <View style={{ height: 32 }} />
        </ScrollView>
      </View>
    );
  }

  /* ─────────────────────────────────────────────────────────────────────────
   * RENDER: Main tabbed view
   * ────────────────────────────────────────────────────────────────────── */
  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Text style={styles.eyebrow}>JOY-PER'S</Text>
        <Text style={styles.title}>Academy</Text>
      </View>

      {/* Tab Selector */}
      <View style={styles.toggleRow}>
        {[
          { key: "learn", label: "Learn", icon: Video },
          { key: "quizzes", label: "Quizzes", icon: FileQuestion },
          { key: "trivia", label: "Trivia", icon: Brain },
        ].map(({ key, label, icon: Icon }) => (
          <TouchableOpacity
            key={key}
            style={[styles.toggleBtn, activeTab === key && styles.toggleBtnActive]}
            onPress={() => setActiveTab(key)}
          >
            <View style={styles.toggleInner}>
              <Icon
                size={14}
                color={activeTab === key ? COLORS.teal : COLORS.creamMuted}
                strokeWidth={2}
              />
              <Text style={[styles.toggleText, activeTab === key && styles.toggleTextActive]}>
                {label}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* ═══════════════════════════ LEARN TAB ═══════════════════════════ */}
      {activeTab === "learn" && (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={COLORS.teal}
              colors={[COLORS.teal]}
            />
          }
        >
          {learnLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={COLORS.teal} />
              <Text style={styles.loadingText}>Loading content...</Text>
            </View>
          ) : modules.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Video size={48} color={COLORS.creamMuted} strokeWidth={1.5} />
              <Text style={styles.emptyTitle}>No learning content yet</Text>
              <Text style={styles.emptyBody}>
                Check back soon for videos and training modules.
              </Text>
            </View>
          ) : (
            <>
              {/* Video modules from Supabase or fallback */}
              {modules.map((mod) => (
                <View key={mod.id}>
                  <Text style={styles.sectionLabel}>
                    {(mod.title || mod.category || "").toUpperCase()}
                  </Text>
                  {mod.description ? (
                    <Text style={styles.moduleDesc}>{mod.description}</Text>
                  ) : null}
                  {mod.videos.map((video) => (
                    <TouchableOpacity
                      key={video.id}
                      style={styles.videoCard}
                      onPress={() => {
                        const vidId = extractYouTubeId(video.url);
                        if (vidId) {
                          Linking.openURL(`https://youtu.be/${vidId}`);
                        } else if (video.url) {
                          Linking.openURL(video.url);
                        }
                      }}
                      activeOpacity={0.8}
                    >
                      <View style={styles.videoThumb}>
                        <Play size={24} color={COLORS.teal} strokeWidth={2} fill={COLORS.teal} />
                      </View>
                      <View style={styles.videoInfo}>
                        <Text style={styles.videoTitle}>{video.title}</Text>
                        <Text style={styles.videoMeta}>
                          {[video.source, video.duration].filter(Boolean).join("  ·  ")}
                        </Text>
                      </View>
                      <ExternalLink size={16} color={COLORS.creamMuted} strokeWidth={2} />
                    </TouchableOpacity>
                  ))}
                </View>
              ))}

              {/* Brand Knowledge (always show hardcoded reference material) */}
              <Text style={[styles.sectionLabel, { marginTop: 8 }]}>BRAND KNOWLEDGE</Text>
              {BRAND_KNOWLEDGE.map((brand) => {
                const isOpen = expandedId === brand.id;
                return (
                  <TouchableOpacity
                    key={brand.id}
                    style={styles.learnCard}
                    onPress={() => toggleExpand(brand.id)}
                    activeOpacity={0.8}
                  >
                    <View style={styles.learnCardHeader}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.learnCardTitle}>{brand.name}</Text>
                        {!isOpen && (
                          <Text style={styles.learnCardSub} numberOfLines={1}>
                            {brand.overview}
                          </Text>
                        )}
                      </View>
                      {isOpen ? (
                        <ChevronUp size={18} color={COLORS.creamMuted} strokeWidth={2} />
                      ) : (
                        <ChevronDown size={18} color={COLORS.creamMuted} strokeWidth={2} />
                      )}
                    </View>
                    {isOpen && (
                      <View style={styles.learnCardBody}>
                        <Text style={styles.learnOverview}>{brand.overview}</Text>
                        <Text style={styles.learnSubhead}>KEY TECHNOLOGIES</Text>
                        {brand.technologies.map((tech) => (
                          <View key={tech.name} style={styles.techRow}>
                            <Text style={styles.techName}>{tech.name}</Text>
                            <Text style={styles.techDesc}>{tech.desc}</Text>
                          </View>
                        ))}
                        <Text style={styles.learnSubhead}>FITTING TIPS</Text>
                        {brand.fittingTips.map((tip, i) => (
                          <Text key={i} style={styles.tipText}>
                            • {tip}
                          </Text>
                        ))}
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}

              {/* Fit Zone */}
              <Text style={[styles.sectionLabel, { marginTop: 8 }]}>FIT ZONE CERTIFICATION</Text>
              {FIT_ZONE.map((topic) => {
                const isOpen = expandedId === topic.id;
                return (
                  <TouchableOpacity
                    key={topic.id}
                    style={styles.learnCard}
                    onPress={() => toggleExpand(topic.id)}
                    activeOpacity={0.8}
                  >
                    <View style={styles.learnCardHeader}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.learnCardTitle}>{topic.title}</Text>
                        {!isOpen && (
                          <Text style={styles.learnCardSub} numberOfLines={1}>
                            {topic.sections[0].subtitle}
                          </Text>
                        )}
                      </View>
                      {isOpen ? (
                        <ChevronUp size={18} color={COLORS.creamMuted} strokeWidth={2} />
                      ) : (
                        <ChevronDown size={18} color={COLORS.creamMuted} strokeWidth={2} />
                      )}
                    </View>
                    {isOpen && (
                      <View style={styles.learnCardBody}>
                        {topic.sections.map((sec, i) => (
                          <View key={i} style={styles.fitSection}>
                            <Text style={styles.learnSubhead}>
                              {sec.subtitle.toUpperCase()}
                            </Text>
                            <Text style={styles.fitBody}>{sec.body}</Text>
                          </View>
                        ))}
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </>
          )}
          <View style={{ height: 32 }} />
        </ScrollView>
      )}

      {/* ═══════════════════════════ QUIZZES TAB ═══════════════════════════ */}
      {activeTab === "quizzes" && (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={COLORS.teal}
              colors={[COLORS.teal]}
            />
          }
        >
          {quizLoading || questionsLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={COLORS.teal} />
              <Text style={styles.loadingText}>Loading quizzes...</Text>
            </View>
          ) : quizzes.length === 0 ? (
            <View style={styles.emptyContainer}>
              <FileQuestion size={48} color={COLORS.creamMuted} strokeWidth={1.5} />
              <Text style={styles.emptyTitle}>No quizzes available</Text>
              <Text style={styles.emptyBody}>
                Quizzes will appear here once they're created by your manager.
              </Text>
            </View>
          ) : (
            <>
              <View style={styles.heroCard}>
                <BookOpen size={32} color={COLORS.teal} strokeWidth={1.5} />
                <Text style={styles.heroTitle}>Academy Quizzes</Text>
                <Text style={styles.heroBody}>
                  Test your knowledge on products, sales techniques, and Joy-Per's culture. Score 80%+ to earn recognition!
                </Text>
              </View>

              <Text style={styles.sectionLabel}>AVAILABLE QUIZZES</Text>
              {quizzes.map((quiz) => {
                const catColor = DIFF_COLORS[quiz.category] || COLORS.teal;
                return (
                  <TouchableOpacity
                    key={quiz.id}
                    style={[styles.quizOption, { borderLeftColor: catColor }]}
                    onPress={() => loadQuizQuestions(quiz)}
                    activeOpacity={0.8}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={styles.quizOptionLabel}>{quiz.title}</Text>
                      <Text style={styles.quizOptionDesc}>
                        {CAT_LABELS[quiz.category] || quiz.category || "General"}
                        {quiz.question_count > 0
                          ? `  ·  ${quiz.question_count} questions`
                          : ""}
                      </Text>
                      {quiz.description ? (
                        <Text style={styles.quizDescription} numberOfLines={2}>
                          {quiz.description}
                        </Text>
                      ) : null}
                    </View>
                    <Text style={[styles.quizOptionArrow, { color: catColor }]}>→</Text>
                  </TouchableOpacity>
                );
              })}
            </>
          )}
          <View style={{ height: 32 }} />
        </ScrollView>
      )}

      {/* ═══════════════════════════ TRIVIA TAB ═══════════════════════════ */}
      {activeTab === "trivia" && (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.heroCard}>
            <Brain size={32} color={COLORS.teal} strokeWidth={1.5} />
            <Text style={styles.heroTitle}>Knowledge Base & Trivia</Text>
            <Text style={styles.heroBody}>
              Test your product knowledge, sales techniques, and Joy-Per's history. Score 80%+ to earn recognition.
            </Text>
          </View>

          <Text style={styles.sectionLabel}>START A QUIZ</Text>
          {[
            { label: "Quick Quiz", count: 5, color: COLORS.green, desc: "5 random questions" },
            { label: "Standard Quiz", count: 10, color: COLORS.teal, desc: "10 mixed questions" },
            { label: "Deep Dive", count: 20, color: COLORS.amber, desc: "20 questions — all categories" },
          ].map((opt) => (
            <TouchableOpacity
              key={opt.label}
              style={[styles.quizOption, { borderLeftColor: opt.color }]}
              onPress={() => startTrivia(opt.count)}
              activeOpacity={0.8}
            >
              <View>
                <Text style={styles.quizOptionLabel}>{opt.label}</Text>
                <Text style={styles.quizOptionDesc}>{opt.desc}</Text>
              </View>
              <Text style={[styles.quizOptionArrow, { color: opt.color }]}>→</Text>
            </TouchableOpacity>
          ))}

          <Text style={[styles.sectionLabel, { marginTop: 8 }]}>KNOWLEDGE AREAS</Text>
          {Object.entries(CAT_LABELS).map(([key, label]) => (
            <View key={key} style={styles.categoryRow}>
              <View style={styles.categoryDot} />
              <Text style={styles.categoryLabel}>{label}</Text>
            </View>
          ))}
          <View style={{ height: 32 }} />
        </ScrollView>
      )}
    </View>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
 * STYLES
 * ═══════════════════════════════════════════════════════════════════════ */
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.charcoal },
  header: {
    paddingHorizontal: 20, paddingTop: 60, paddingBottom: 20,
    backgroundColor: COLORS.charcoalMid,
    borderBottomWidth: 1, borderBottomColor: COLORS.charcoalLight,
  },
  eyebrow: { fontSize: 9, fontWeight: "700", color: COLORS.teal, letterSpacing: 2, marginBottom: 2 },
  title: { fontSize: 28, fontWeight: "800", color: COLORS.cream, letterSpacing: -0.5 },
  scroll: { flex: 1 },
  scrollContent: { padding: 20, gap: 16 },
  sectionLabel: { fontSize: 10, fontWeight: "700", color: COLORS.teal, letterSpacing: 2 },

  // Section Toggle
  toggleRow: {
    flexDirection: "row", marginHorizontal: 20, marginTop: 12, marginBottom: 4,
    backgroundColor: COLORS.charcoalMid, borderRadius: 10, padding: 3,
  },
  toggleBtn: { flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: "center" },
  toggleBtnActive: { backgroundColor: COLORS.teal + "30" },
  toggleInner: { flexDirection: "row", alignItems: "center", gap: 6 },
  toggleText: { fontSize: 12, fontWeight: "700", color: COLORS.creamMuted },
  toggleTextActive: { color: COLORS.teal },

  // Loading & Empty
  loadingContainer: { alignItems: "center", paddingVertical: 60, gap: 16 },
  loadingText: { fontSize: 13, color: COLORS.creamMuted, fontWeight: "600" },
  emptyContainer: { alignItems: "center", paddingVertical: 60, gap: 12 },
  emptyTitle: { fontSize: 18, fontWeight: "800", color: COLORS.cream },
  emptyBody: { fontSize: 13, color: COLORS.creamMuted, textAlign: "center", lineHeight: 19, paddingHorizontal: 20 },

  // Hero Card
  heroCard: {
    backgroundColor: COLORS.charcoalMid, borderRadius: 16, padding: 20,
    alignItems: "center", gap: 12, borderWidth: 1, borderColor: COLORS.charcoalLight,
  },
  heroTitle: { fontSize: 18, fontWeight: "800", color: COLORS.cream, textAlign: "center" },
  heroBody: { fontSize: 13, color: COLORS.creamMuted, textAlign: "center", lineHeight: 19 },

  // Quiz list
  quizOption: {
    backgroundColor: COLORS.charcoalMid, borderRadius: 12, padding: 16,
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    borderLeftWidth: 4,
  },
  quizOptionLabel: { fontSize: 15, fontWeight: "700", color: COLORS.cream },
  quizOptionDesc: { fontSize: 12, color: COLORS.creamMuted, marginTop: 2 },
  quizDescription: { fontSize: 11, color: COLORS.creamMuted, marginTop: 4, lineHeight: 16 },
  quizOptionArrow: { fontSize: 20, fontWeight: "700" },

  // Category list
  categoryRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 6 },
  categoryDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.teal },
  categoryLabel: { fontSize: 14, color: COLORS.cream, fontWeight: "500" },

  // Quiz session
  quizContainer: { gap: 16 },
  quizProgress: { gap: 8 },
  quizProgressText: { fontSize: 11, fontWeight: "600", color: COLORS.creamMuted, textAlign: "right" },
  progressBar: { height: 4, backgroundColor: COLORS.charcoalLight, borderRadius: 2 },
  progressFill: { height: 4, backgroundColor: COLORS.teal, borderRadius: 2 },
  diffBadge: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20, alignSelf: "flex-start", backgroundColor: COLORS.teal + "22" },
  diffText: { fontSize: 10, fontWeight: "700", letterSpacing: 1 },
  question: { fontSize: 17, fontWeight: "700", color: COLORS.cream, lineHeight: 24 },
  optionBtn: {
    backgroundColor: COLORS.charcoalMid, borderRadius: 12, padding: 14,
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    borderWidth: 1, borderColor: COLORS.charcoalLight,
  },
  optionCorrect: { borderColor: COLORS.green, backgroundColor: COLORS.green + "15" },
  optionWrong: { borderColor: COLORS.red, backgroundColor: COLORS.red + "15" },
  optionText: { fontSize: 14, color: COLORS.cream, flex: 1, fontWeight: "500" },
  explanation: {
    backgroundColor: COLORS.teal + "18", borderRadius: 12, padding: 14, gap: 12,
    borderLeftWidth: 3, borderLeftColor: COLORS.teal,
  },
  explanationText: { fontSize: 13, color: COLORS.cream, lineHeight: 19 },
  nextBtn: {
    alignSelf: "flex-end", backgroundColor: COLORS.teal,
    paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10,
  },
  nextBtnText: { fontSize: 12, fontWeight: "800", color: COLORS.charcoal, letterSpacing: 1.5 },

  // Results
  resultContainer: { alignItems: "center", gap: 12, paddingVertical: 32 },
  resultScore: { fontSize: 48, fontWeight: "900", color: COLORS.cream },
  resultPct: { fontSize: 18, fontWeight: "700", color: COLORS.teal },
  resultLabel: { fontSize: 14, color: COLORS.creamMuted, textAlign: "center", lineHeight: 20 },
  resultActions: { flexDirection: "row", gap: 12, flexWrap: "wrap", justifyContent: "center", marginTop: 8 },
  resetBtn: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: COLORS.teal, paddingHorizontal: 24, paddingVertical: 14, borderRadius: 12,
  },
  resetBtnText: { fontSize: 12, fontWeight: "800", color: COLORS.charcoal, letterSpacing: 1.5 },

  exitBtn: {
    alignItems: "center", paddingVertical: 14, borderRadius: 12,
    borderWidth: 1, borderColor: COLORS.charcoalLight, marginTop: 8,
  },
  exitBtnText: { fontSize: 11, fontWeight: "700", color: COLORS.creamMuted, letterSpacing: 1.5 },

  // Learn Tab
  moduleDesc: { fontSize: 12, color: COLORS.creamMuted, lineHeight: 17, marginBottom: 4 },
  learnCard: {
    backgroundColor: COLORS.charcoalMid, borderRadius: 14, padding: 16,
    borderWidth: 1, borderColor: COLORS.charcoalLight,
  },
  learnCardHeader: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
  },
  learnCardTitle: { fontSize: 16, fontWeight: "800", color: COLORS.cream },
  learnCardSub: { fontSize: 12, color: COLORS.creamMuted, marginTop: 2 },
  learnCardBody: { marginTop: 12, gap: 10 },
  learnOverview: { fontSize: 13, color: COLORS.creamMuted, lineHeight: 19 },
  learnSubhead: {
    fontSize: 9, fontWeight: "700", color: COLORS.teal, letterSpacing: 1.5, marginTop: 4,
  },
  techRow: { gap: 2 },
  techName: { fontSize: 14, fontWeight: "700", color: COLORS.cream },
  techDesc: { fontSize: 12, color: COLORS.creamMuted, lineHeight: 17 },
  tipText: { fontSize: 12, color: COLORS.creamMuted, lineHeight: 17 },
  fitSection: { gap: 4 },
  fitBody: { fontSize: 12, color: COLORS.creamMuted, lineHeight: 18 },

  // Videos
  videoCard: {
    flexDirection: "row", alignItems: "center", gap: 12,
    backgroundColor: COLORS.charcoalMid, borderRadius: 12, padding: 12,
    borderWidth: 1, borderColor: COLORS.charcoalLight,
  },
  videoThumb: {
    width: 64, height: 48, borderRadius: 8,
    backgroundColor: COLORS.teal + "18",
    alignItems: "center", justifyContent: "center",
  },
  videoInfo: { flex: 1, gap: 2 },
  videoTitle: { fontSize: 14, fontWeight: "700", color: COLORS.cream },
  videoMeta: { fontSize: 11, color: COLORS.creamMuted, fontWeight: "600" },
});
