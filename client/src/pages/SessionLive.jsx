import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { apiClient } from '../lib/apiClient.js';
import { speak, isSpeechSynthesisSupported, stopSpeaking } from '../lib/speech.js';
import PanelFeedbackCard from '../components/PanelFeedbackCard.jsx';
import CrossExamPrompt from '../components/CrossExamPrompt.jsx';
import VoiceCapture from '../components/VoiceCapture.jsx';
import Spinner from '../components/Spinner.jsx';
import TypingDots from '../components/TypingDots.jsx';
import McqOptions from '../components/McqOptions.jsx';
import McqResultCard from '../components/McqResultCard.jsx';
import CodeEditor from '../components/CodeEditor.jsx';
import ProctoringGate from '../components/ProctoringGate.jsx';
import ViolationWarningModal from '../components/ViolationWarningModal.jsx';
import SessionTerminated from '../components/SessionTerminated.jsx';
import { Volume2, ShieldAlert, SkipForward } from 'lucide-react';

const PERSONA_LABELS = { hr: 'HR Panelist', technical: 'Technical Lead', skeptical: 'Skeptical Hiring Manager' };
const PERSONA_BADGE_CLASS = {
  hr: 'bg-panel-hr/10 text-panel-hr',
  technical: 'bg-panel-technical/10 text-panel-technical',
  skeptical: 'bg-panel-skeptical/10 text-panel-skeptical',
};
const TOTAL_QUESTIONS = 14;
const VIOLATION_DEBOUNCE_MS = 1500;

function PanelSkeleton() {
  return (
    <div className="mt-6 grid gap-4">
      {Object.entries(PERSONA_LABELS).map(([key, label], i) => (
        <motion.div
          key={key}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: i * 0.1 }}
          className="card animate-pulse"
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-500">{label} is deliberating…</span>
            <TypingDots dotClassName="bg-slate-500" />
          </div>
          <div className="mt-3 h-3 w-5/6 rounded bg-charcoal-800" />
          <div className="mt-2 h-3 w-2/3 rounded bg-charcoal-800" />
        </motion.div>
      ))}
    </div>
  );
}

export default function SessionLive() {
  const { sessionId } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [question, setQuestion] = useState(null);
  const [phase, setPhase] = useState('answering'); // answering | reviewing | cross_exam
  const [answerText, setAnswerText] = useState('');
  const [selectedOptionIndex, setSelectedOptionIndex] = useState(null);
  const [selfConfidence, setSelfConfidence] = useState(3);
  const [panelFeedback, setPanelFeedback] = useState([]);
  const [mcqResult, setMcqResult] = useState(null);
  const [skipped, setSkipped] = useState(false);
  const [codeLanguage, setCodeLanguage] = useState('javascript');
  const [crossExam, setCrossExam] = useState(null);
  const [pendingNextQuestion, setPendingNextQuestion] = useState(null);
  const [readyToComplete, setReadyToComplete] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [skipInFlight, setSkipInFlight] = useState(false);
  const [voiceMode, setVoiceMode] = useState(false);
  const [error, setError] = useState('');

  // Proctoring
  const [gatePassed, setGatePassed] = useState(false);
  const [terminated, setTerminated] = useState(false);
  const [violationCount, setViolationCount] = useState(0);
  const [showWarning, setShowWarning] = useState(false);
  const lastViolationAtRef = useRef(0);

  const isMcq = question?.question_type === 'mcq';

  const loadCurrentState = useCallback(async () => {
    const { data } = await apiClient.get(`/sessions/${sessionId}`);

    if (data.session.status === 'completed') {
      navigate(`/sessions/${sessionId}/summary`);
      return;
    }

    if (data.session.status === 'terminated') {
      setTerminated(true);
      setViolationCount(data.session.violation_count);
      setLoading(false);
      return;
    }

    setViolationCount(data.session.violation_count || 0);

    const questions = data.questions || [];
    const current = questions[questions.length - 1];
    setQuestion(current);

    // `answers.question_id` is a unique FK, so Supabase embeds it as a single
    // object here, not an array.
    const answer = current?.answers;
    const openCrossExam = answer?.cross_exams?.find((c) => !c.resolved);

    if (openCrossExam) {
      setPhase('cross_exam');
      setCrossExam(openCrossExam);
      setPanelFeedback(answer.panel_feedback || []);
    } else if (answer) {
      // Already answered (handles a mid-flow refresh gracefully) — show the
      // result and wait for the candidate to continue.
      setPhase('reviewing');
      if (answer.skipped) {
        setSkipped(true);
        setMcqResult(null);
        setPanelFeedback([]);
      } else if (current.question_type === 'mcq') {
        setSkipped(false);
        setMcqResult({
          correct: answer.selected_option_index === current.correct_option_index,
          correctOptionIndex: current.correct_option_index,
          explanation: current.explanation,
          selectedOptionIndex: answer.selected_option_index,
        });
      } else {
        setSkipped(false);
        setPanelFeedback(answer.panel_feedback || []);
      }
    } else {
      setPhase('answering');
      setAnswerText('');
      setSelectedOptionIndex(null);
      setPanelFeedback([]);
      setMcqResult(null);
      setSkipped(false);
      setCrossExam(null);
    }

    setLoading(false);
  }, [sessionId, navigate]);

  useEffect(() => {
    loadCurrentState();
  }, [loadCurrentState]);

  useEffect(() => {
    if (voiceMode && phase === 'answering' && question && isSpeechSynthesisSupported()) {
      speak(question.text, 'narrator');
    }
  }, [voiceMode, phase, question]);

  // The narrator's speechSynthesis utterance is a global browser API, not
  // tied to this component's lifecycle — without this, navigating away
  // (finishing the session, going back to the dashboard) leaves it talking
  // into an unmounted page.
  useEffect(() => stopSpeaking, []);

  // Tab-switch / fullscreen-exit detection — only armed once the candidate
  // has passed the proctoring gate and the session isn't already over.
  useEffect(() => {
    if (!gatePassed || terminated) return;

    async function triggerViolation() {
      const now = Date.now();
      // visibilitychange and fullscreenchange can both fire for the same
      // real switch (e.g. alt-tabbing out of a fullscreen tab) — debounce
      // so that counts as one violation, not two.
      if (now - lastViolationAtRef.current < VIOLATION_DEBOUNCE_MS) return;
      lastViolationAtRef.current = now;
      stopSpeaking();

      try {
        const { data } = await apiClient.post(`/sessions/${sessionId}/violation`);
        setViolationCount(data.violationCount);
        if (data.terminated) {
          setTerminated(true);
          setShowWarning(false);
        } else {
          setShowWarning(true);
        }
      } catch {
        // If the violation call itself fails (network blip), fail open —
        // don't strand the candidate mid-session over a lost request.
      }
    }

    function handleVisibilityChange() {
      if (document.hidden) triggerViolation();
    }
    function handleFullscreenChange() {
      if (!document.fullscreenElement) triggerViolation();
    }

    document.addEventListener('visibilitychange', handleVisibilityChange);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, [gatePassed, terminated, sessionId]);

  // Copy/paste/cut and the right-click menu are disabled for the whole
  // session — same lifecycle as the violation listeners above. This can't
  // stop a determined candidate with devtools open, but it closes off the
  // casual "copy the question into ChatGPT" / "paste in a generated answer"
  // path, same as most real proctored assessments.
  useEffect(() => {
    if (!gatePassed || terminated) return;

    function blockClipboardEvent(e) {
      e.preventDefault();
    }

    document.addEventListener('copy', blockClipboardEvent);
    document.addEventListener('cut', blockClipboardEvent);
    document.addEventListener('paste', blockClipboardEvent);
    document.addEventListener('contextmenu', blockClipboardEvent);
    return () => {
      document.removeEventListener('copy', blockClipboardEvent);
      document.removeEventListener('cut', blockClipboardEvent);
      document.removeEventListener('paste', blockClipboardEvent);
      document.removeEventListener('contextmenu', blockClipboardEvent);
    };
  }, [gatePassed, terminated]);

  async function handleSubmitAnswer() {
    setSubmitting(true);
    setError('');
    try {
      const body = isMcq ? { selectedOptionIndex, selfConfidence } : { answerText, selfConfidence };
      const { data } = await apiClient.post(`/sessions/${sessionId}/questions/${question.id}/answers`, body);

      setSkipped(false);
      if (isMcq) {
        setMcqResult(data.mcqResult);
      } else {
        setPanelFeedback(data.panelFeedback);
      }

      if (data.status === 'cross_exam') {
        setPhase('cross_exam');
        setCrossExam(data.crossExam);
      } else {
        setPhase('reviewing');
        if (data.status === 'ready_to_complete') setReadyToComplete(true);
        else setPendingNextQuestion(data.nextQuestion);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSkip() {
    setSubmitting(true);
    setSkipInFlight(true);
    setError('');
    try {
      const { data } = await apiClient.post(`/sessions/${sessionId}/questions/${question.id}/skip`);
      setSkipped(true);
      setMcqResult(null);
      setPanelFeedback([]);
      setPhase('reviewing');
      if (data.status === 'ready_to_complete') setReadyToComplete(true);
      else setPendingNextQuestion(data.nextQuestion);
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong');
    } finally {
      setSubmitting(false);
      setSkipInFlight(false);
    }
  }

  async function handleRebuttal(rebuttalText) {
    setSubmitting(true);
    setError('');
    try {
      const { data } = await apiClient.post(`/sessions/${sessionId}/cross-exams/${crossExam.id}/rebuttal`, {
        userRebuttal: rebuttalText,
      });
      setPhase('reviewing');
      setCrossExam(null);
      if (data.status === 'ready_to_complete') setReadyToComplete(true);
      else setPendingNextQuestion(data.nextQuestion);
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleContinue() {
    setSubmitting(true);
    try {
      if (readyToComplete) {
        stopSpeaking();
        await apiClient.post(`/sessions/${sessionId}/complete`);
        navigate(`/sessions/${sessionId}/summary`);
        return;
      }
      if (pendingNextQuestion) {
        setQuestion(pendingNextQuestion);
        setPendingNextQuestion(null);
        setPhase('answering');
        setAnswerText('');
        setSelectedOptionIndex(null);
        setSelfConfidence(3);
        setPanelFeedback([]);
        setMcqResult(null);
        setSkipped(false);
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <Spinner label="Loading session…" />;
  if (terminated) {
    return (
      <main className="mx-auto max-w-2xl px-6 py-12">
        <SessionTerminated />
      </main>
    );
  }
  if (!gatePassed) {
    return (
      <main className="mx-auto max-w-2xl px-6 py-12">
        <ProctoringGate onBegin={() => setGatePassed(true)} />
      </main>
    );
  }

  const canSubmit = isMcq ? selectedOptionIndex !== null : answerText.trim().length > 0;

  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      {showWarning && (
        <ViolationWarningModal
          violationCount={violationCount}
          onAcknowledge={() => setShowWarning(false)}
        />
      )}

      <div className="mb-6">
        {question?.round_label && (
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-amber-400">
            {question.round_label}
          </p>
        )}
        <div className="mb-1 flex items-center justify-between text-xs text-slate-500">
          <span>
            Question {question?.order_index} of {TOTAL_QUESTIONS}
          </span>
          <div className="flex items-center gap-3">
            {violationCount > 0 && (
              <span className="flex items-center gap-1 text-panel-skeptical">
                <ShieldAlert size={14} /> {violationCount}/2 violations
              </span>
            )}
            {!isMcq && (
              <label className="flex items-center gap-1.5">
                <input type="checkbox" checked={voiceMode} onChange={(e) => setVoiceMode(e.target.checked)} />
                Voice mode
              </label>
            )}
          </div>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-charcoal-800">
          <div
            className="h-full bg-amber-500 transition-all"
            style={{ width: `${((question?.order_index || 1) / TOTAL_QUESTIONS) * 100}%` }}
          />
        </div>
      </div>

      <div className="card">
        <div className="flex items-start justify-between gap-3">
          <p className="whitespace-pre-wrap text-lg text-slate-100">{question?.text}</p>
          {isSpeechSynthesisSupported() && (
            <button
              onClick={() => speak(question.text, 'narrator')}
              className="shrink-0 text-slate-400 hover:text-amber-400"
            >
              <Volume2 size={18} />
            </button>
          )}
        </div>
        <div className="mt-2 flex gap-1.5">
          <span className="inline-block rounded-full bg-charcoal-800 px-2.5 py-0.5 text-xs text-slate-500">
            {question?.skill_tag}
          </span>
          <span
            className={`inline-block rounded-full px-2.5 py-0.5 text-xs ${
              isMcq ? 'bg-panel-technical/10 text-panel-technical' : 'bg-amber-500/10 text-amber-400'
            }`}
          >
            {isMcq ? 'Multiple choice' : 'Coding challenge'}
          </span>
          {question?.authored_by_persona && (
            <span
              className={`inline-block rounded-full px-2.5 py-0.5 text-xs ${PERSONA_BADGE_CLASS[question.authored_by_persona]}`}
            >
              Asked by {PERSONA_LABELS[question.authored_by_persona]}
            </span>
          )}
        </div>
      </div>

      {phase === 'answering' && (
        <div className="mt-6 flex flex-col gap-4">
          <div>
            <label className="mb-1.5 block text-sm text-slate-300">
              How confident are you in your answer? ({selfConfidence}/5)
            </label>
            <input
              type="range"
              min={1}
              max={5}
              value={selfConfidence}
              onChange={(e) => setSelfConfidence(Number(e.target.value))}
              className="w-full accent-amber-500"
            />
          </div>

          {isMcq ? (
            <McqOptions
              options={question.options}
              selectedIndex={selectedOptionIndex}
              onSelect={setSelectedOptionIndex}
              disabled={submitting}
            />
          ) : (
            <>
              <CodeEditor
                value={answerText}
                onChange={setAnswerText}
                language={codeLanguage}
                onLanguageChange={setCodeLanguage}
                disabled={submitting}
              />
              <VoiceCapture onTranscript={(text) => setAnswerText((prev) => `${prev} ${text}`.trim())} />
            </>
          )}

          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={handleSkip}
              disabled={submitting}
              className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-300 disabled:opacity-50"
            >
              <SkipForward size={14} /> Skip this question
            </button>
            <button disabled={!canSubmit || submitting} onClick={handleSubmitAnswer} className="btn-primary">
              {submitting ? (
                <span className="flex items-center gap-1.5">
                  Submitting <TypingDots />
                </span>
              ) : (
                'Submit answer'
              )}
            </button>
          </div>
        </div>
      )}

      {error && <p className="mt-4 animate-shake text-sm font-medium text-red-600">{error}</p>}

      {phase === 'answering' && submitting && !isMcq && !skipInFlight && <PanelSkeleton />}

      <AnimatePresence>
        {skipped && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="card mt-6 flex items-center gap-2 border-l-4 border-slate-600 text-slate-400"
          >
            <SkipForward size={18} className="shrink-0" />
            <span className="text-sm">You skipped this question — it's scored as unanswered.</span>
          </motion.div>
        )}
        {mcqResult && (
          <div className="mt-6">
            <McqResultCard
              options={question.options}
              correct={mcqResult.correct}
              correctOptionIndex={mcqResult.correctOptionIndex}
              explanation={mcqResult.explanation}
              selectedIndex={mcqResult.selectedOptionIndex}
            />
          </div>
        )}
        {panelFeedback.length > 0 && (
          <div className="mt-6 grid gap-4">
            {panelFeedback.map((f, i) => (
              <PanelFeedbackCard
                key={f.persona}
                delay={i * 0.12}
                persona={f.persona}
                score={f.score}
                comment={f.comment}
                flaggedIssues={f.flagged_issues || f.flaggedIssues}
              />
            ))}
          </div>
        )}
      </AnimatePresence>

      {phase === 'cross_exam' && crossExam && (
        <div className="mt-6">
          <CrossExamPrompt
            challengeQuestion={crossExam.challenge_question}
            onSubmit={handleRebuttal}
            submitting={submitting}
          />
        </div>
      )}

      {phase === 'reviewing' && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 flex justify-end"
        >
          <button onClick={handleContinue} disabled={submitting} className="btn-primary">
            {submitting ? (
              <span className="flex items-center gap-1.5">
                {readyToComplete ? 'Wrapping up' : 'Loading next question'} <TypingDots />
              </span>
            ) : readyToComplete ? (
              'Finish session'
            ) : (
              'Next question'
            )}
          </button>
        </motion.div>
      )}
    </main>
  );
}
