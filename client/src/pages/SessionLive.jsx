import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { apiClient } from '../lib/apiClient.js';
import { speak, isSpeechSynthesisSupported } from '../lib/speech.js';
import PanelFeedbackCard from '../components/PanelFeedbackCard.jsx';
import CrossExamPrompt from '../components/CrossExamPrompt.jsx';
import VoiceCapture from '../components/VoiceCapture.jsx';
import Spinner from '../components/Spinner.jsx';
import TypingDots from '../components/TypingDots.jsx';
import { Volume2 } from 'lucide-react';

const PERSONA_LABELS = { hr: 'HR Panelist', technical: 'Technical Lead', skeptical: 'Skeptical Hiring Manager' };

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

const TOTAL_QUESTIONS = 5;

export default function SessionLive() {
  const { sessionId } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [question, setQuestion] = useState(null);
  const [phase, setPhase] = useState('answering'); // answering | reviewing | cross_exam
  const [answerText, setAnswerText] = useState('');
  const [selfConfidence, setSelfConfidence] = useState(3);
  const [panelFeedback, setPanelFeedback] = useState([]);
  const [crossExam, setCrossExam] = useState(null);
  const [pendingNextQuestion, setPendingNextQuestion] = useState(null);
  const [readyToComplete, setReadyToComplete] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [voiceMode, setVoiceMode] = useState(false);
  const [error, setError] = useState('');

  const loadCurrentState = useCallback(async () => {
    const { data } = await apiClient.get(`/sessions/${sessionId}`);

    if (data.session.status === 'completed') {
      navigate(`/sessions/${sessionId}/summary`);
      return;
    }

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
    } else if (answer?.panel_feedback?.length) {
      // Answer already scored and no open cross-exam — this question is done;
      // wait for the next one (handles a mid-flow refresh gracefully).
      setPhase('reviewing');
      setPanelFeedback(answer.panel_feedback);
    } else {
      setPhase('answering');
      setAnswerText('');
      setPanelFeedback([]);
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

  async function handleSubmitAnswer() {
    setSubmitting(true);
    setError('');
    try {
      const { data } = await apiClient.post(`/sessions/${sessionId}/questions/${question.id}/answers`, {
        answerText,
        selfConfidence,
      });

      setPanelFeedback(data.panelFeedback);

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
        await apiClient.post(`/sessions/${sessionId}/complete`);
        navigate(`/sessions/${sessionId}/summary`);
        return;
      }
      if (pendingNextQuestion) {
        setQuestion(pendingNextQuestion);
        setPendingNextQuestion(null);
        setPhase('answering');
        setAnswerText('');
        setSelfConfidence(3);
        setPanelFeedback([]);
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <Spinner label="Loading session…" />;

  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <div className="mb-6">
        <div className="mb-1 flex justify-between text-xs text-slate-500">
          <span>
            Question {question?.order_index} of {TOTAL_QUESTIONS}
          </span>
          <label className="flex items-center gap-1.5">
            <input type="checkbox" checked={voiceMode} onChange={(e) => setVoiceMode(e.target.checked)} />
            Voice mode
          </label>
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
          <p className="text-lg text-slate-100">{question?.text}</p>
          {isSpeechSynthesisSupported() && (
            <button
              onClick={() => speak(question.text, 'narrator')}
              className="shrink-0 text-slate-400 hover:text-amber-400"
            >
              <Volume2 size={18} />
            </button>
          )}
        </div>
        <span className="mt-2 inline-block rounded-full bg-charcoal-800 px-2.5 py-0.5 text-xs text-slate-500">
          {question?.skill_tag}
        </span>
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

          <textarea
            rows={6}
            className="input-field resize-none"
            placeholder="Type your answer, or use the mic…"
            value={answerText}
            onChange={(e) => setAnswerText(e.target.value)}
          />

          <div className="flex items-center justify-between">
            <VoiceCapture onTranscript={(text) => setAnswerText((prev) => `${prev} ${text}`.trim())} />
            <button disabled={!answerText.trim() || submitting} onClick={handleSubmitAnswer} className="btn-primary">
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

      {phase === 'answering' && submitting && <PanelSkeleton />}

      <AnimatePresence>
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
