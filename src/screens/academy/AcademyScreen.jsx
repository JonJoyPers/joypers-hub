import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Linking,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  BookOpen, CheckCircle, XCircle, RotateCcw, Trophy,
  ChevronDown, ChevronUp, Play, ExternalLink,
} from "lucide-react-native";
import { COLORS } from "../../theme/colors";
import { useAppStore } from "../../store/appStore";
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

function QuizView({ session, onAnswer, onReset }) {
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

export default function AcademyScreen() {
  const insets = useSafeAreaInsets();
  const { triviaSession, startTriviaSession, answerTrivia, resetTriviaSession } = useAppStore();
  const [pendingAnswer, setPendingAnswer] = useState(null);
  const [activeTab, setActiveTab] = useState("quizzes"); // "quizzes" | "learn" | "videos"
  const [expandedId, setExpandedId] = useState(null);

  const startQuiz = (count = 10) => {
    startTriviaSession(getRandomQuestions(count));
    setPendingAnswer(null);
  };

  const handleAnswer = (selectedIndex) => {
    if (selectedIndex === -1) {
      answerTrivia(triviaSession.questions[triviaSession.currentIndex].correct);
    } else {
      answerTrivia(selectedIndex);
    }
  };

  const toggleExpand = (id) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  // Quiz active — show quiz only
  if (triviaSession) {
    return (
      <View style={styles.root}>
        <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
          <Text style={styles.eyebrow}>ACADEMY</Text>
          <Text style={styles.title}>Trivia Quiz</Text>
        </View>
        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <QuizView
            session={triviaSession}
            onAnswer={handleAnswer}
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

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Text style={styles.eyebrow}>JOY-PER'S</Text>
        <Text style={styles.title}>Academy</Text>
      </View>

      {/* Section Toggle */}
      <View style={styles.toggleRow}>
        {["quizzes", "learn", "videos"].map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.toggleBtn, activeTab === tab && styles.toggleBtnActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.toggleText, activeTab === tab && styles.toggleTextActive]}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* === QUIZZES TAB === */}
      {activeTab === "quizzes" && (
        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.heroCard}>
            <BookOpen size={32} color={COLORS.teal} strokeWidth={1.5} />
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
              onPress={() => startQuiz(opt.count)}
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

      {/* === LEARN TAB === */}
      {activeTab === "learn" && (
        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Brand Knowledge */}
          <Text style={styles.sectionLabel}>BRAND KNOWLEDGE</Text>
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
                    {!isOpen && <Text style={styles.learnCardSub} numberOfLines={1}>{brand.overview}</Text>}
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
                      <Text key={i} style={styles.tipText}>• {tip}</Text>
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
                        <Text style={styles.learnSubhead}>{sec.subtitle.toUpperCase()}</Text>
                        <Text style={styles.fitBody}>{sec.body}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
          <View style={{ height: 32 }} />
        </ScrollView>
      )}

      {/* === VIDEOS TAB === */}
      {activeTab === "videos" && (
        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {VIDEO_RESOURCES.map((cat) => (
            <View key={cat.category}>
              <Text style={styles.sectionLabel}>{cat.category.toUpperCase()}</Text>
              {cat.videos.map((video) => (
                <TouchableOpacity
                  key={video.id}
                  style={styles.videoCard}
                  onPress={() => {
                    const match = video.url.match(/[?&]v=([^&]+)/);
                    const id = match ? match[1] : video.url.split('/').pop();
                    Linking.openURL(`https://youtu.be/${id}`);
                  }}
                  activeOpacity={0.8}
                >
                  <View style={styles.videoThumb}>
                    <Play size={24} color={COLORS.teal} strokeWidth={2} fill={COLORS.teal} />
                  </View>
                  <View style={styles.videoInfo}>
                    <Text style={styles.videoTitle}>{video.title}</Text>
                    <Text style={styles.videoMeta}>{video.source}  ·  {video.duration}</Text>
                  </View>
                  <ExternalLink size={16} color={COLORS.creamMuted} strokeWidth={2} />
                </TouchableOpacity>
              ))}
            </View>
          ))}
          <View style={{ height: 32 }} />
        </ScrollView>
      )}
    </View>
  );
}

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
  toggleText: { fontSize: 12, fontWeight: "700", color: COLORS.creamMuted },
  toggleTextActive: { color: COLORS.teal },

  heroCard: {
    backgroundColor: COLORS.charcoalMid, borderRadius: 16, padding: 20,
    alignItems: "center", gap: 12, borderWidth: 1, borderColor: COLORS.charcoalLight,
  },
  heroTitle: { fontSize: 18, fontWeight: "800", color: COLORS.cream, textAlign: "center" },
  heroBody: { fontSize: 13, color: COLORS.creamMuted, textAlign: "center", lineHeight: 19 },

  quizOption: {
    backgroundColor: COLORS.charcoalMid, borderRadius: 12, padding: 16,
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    borderLeftWidth: 4,
  },
  quizOptionLabel: { fontSize: 15, fontWeight: "700", color: COLORS.cream },
  quizOptionDesc: { fontSize: 12, color: COLORS.creamMuted, marginTop: 2 },
  quizOptionArrow: { fontSize: 20, fontWeight: "700" },

  categoryRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 6 },
  categoryDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.teal },
  categoryLabel: { fontSize: 14, color: COLORS.cream, fontWeight: "500" },

  // Quiz
  quizContainer: { gap: 16 },
  quizProgress: { gap: 8 },
  quizProgressText: { fontSize: 11, fontWeight: "600", color: COLORS.creamMuted, textAlign: "right" },
  progressBar: { height: 4, backgroundColor: COLORS.charcoalLight, borderRadius: 2 },
  progressFill: { height: 4, backgroundColor: COLORS.teal, borderRadius: 2 },
  diffBadge: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20, alignSelf: "flex-start" },
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
  resetBtn: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: COLORS.teal, paddingHorizontal: 24, paddingVertical: 14, borderRadius: 12, marginTop: 8,
  },
  resetBtnText: { fontSize: 12, fontWeight: "800", color: COLORS.charcoal, letterSpacing: 1.5 },

  exitBtn: {
    alignItems: "center", paddingVertical: 14, borderRadius: 12,
    borderWidth: 1, borderColor: COLORS.charcoalLight, marginTop: 8,
  },
  exitBtnText: { fontSize: 11, fontWeight: "700", color: COLORS.creamMuted, letterSpacing: 1.5 },

  // Learn Tab
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

  // Videos Tab
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
