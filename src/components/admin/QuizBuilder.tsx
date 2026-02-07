'use client';

import { useState, useEffect } from 'react';
import { 
  Plus, 
  Trash2, 
  GripVertical, 
  CheckCircle, 
  ChevronRight, 
  AlertCircle,
  Trophy,
  ListRestart,
  Settings,
  HelpCircle,
  Save,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

interface Option {
  id?: string;
  text: string;
  isCorrect: boolean;
}

interface Question {
  id?: string;
  text: string;
  options: Option[];
}

interface Quiz {
  id: string;
  firstAttemptPoints: number;
  secondAttemptPoints: number;
  thirdAttemptPoints: number;
  fourthPlusPoints: number;
  questions: Question[];
}

interface QuizBuilderProps {
  quizId: string;
  onClose?: () => void;
}

export function QuizBuilder({ quizId, onClose }: QuizBuilderProps) {
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [activeView, setActiveView] = useState<'question' | 'rewards'>('question');
  const [selectedQuestionIndex, setSelectedQuestionIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchQuiz();
  }, [quizId]);

  const fetchQuiz = async () => {
    try {
      const res = await fetch(`/api/quizzes/${quizId}`);
      if (res.ok) {
        const data = await res.json();
        setQuiz(data);
      }
    } catch (error) {
      toast.error('Failed to load assessment data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!quiz) return;
    setIsSaving(true);
    try {
      const res = await fetch(`/api/quizzes/${quizId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(quiz),
      });
      if (res.ok) {
        toast.success('Assessment logic synchronized');
        if (onClose) onClose();
      }
    } catch (error) {
      toast.error('Failed to save assessment');
    } finally {
      setIsSaving(false);
    }
  };

  const addQuestion = () => {
    if (!quiz) return;
    const newQuestion: Question = {
      text: 'New Question',
      options: [
        { text: 'Option 1', isCorrect: true },
        { text: 'Option 2', isCorrect: false }
      ]
    };
    setQuiz({ ...quiz, questions: [...quiz.questions, newQuestion] });
    setSelectedQuestionIndex(quiz.questions.length);
    setActiveView('question');
  };

  const deleteQuestion = (e: React.MouseEvent, index: number) => {
    e.stopPropagation();
    if (!quiz) return;
    const nextQuestions = quiz.questions.filter((_, i) => i !== index);
    setQuiz({ ...quiz, questions: nextQuestions });
    if (selectedQuestionIndex >= nextQuestions.length) {
      setSelectedQuestionIndex(Math.max(0, nextQuestions.length - 1));
    }
  };

  const updateQuestion = (updates: Partial<Question>) => {
    if (!quiz) return;
    const nextQuestions = [...quiz.questions];
    nextQuestions[selectedQuestionIndex] = { ...nextQuestions[selectedQuestionIndex], ...updates };
    setQuiz({ ...quiz, questions: nextQuestions });
  };

  const addOption = () => {
    if (!quiz) return;
    const question = quiz.questions[selectedQuestionIndex];
    if (!question) return;
    const nextOptions = [...question.options, { text: '', isCorrect: false }];
    updateQuestion({ options: nextOptions });
  };

  const updateOption = (optIndex: number, updates: Partial<Option>) => {
    if (!quiz) return;
    const question = quiz.questions[selectedQuestionIndex];
    if (!question) return;
    const nextOptions = [...question.options];
    nextOptions[optIndex] = { ...nextOptions[optIndex], ...updates };
    updateQuestion({ options: nextOptions });
  };

  const removeOption = (optIndex: number) => {
    if (!quiz) return;
    const question = quiz.questions[selectedQuestionIndex];
    if (!question || question.options.length <= 2) {
      toast.error('Minimum 2 options required');
      return;
    }
    const nextOptions = question.options.filter((_, i) => i !== optIndex);
    updateQuestion({ options: nextOptions });
  };

  if (isLoading) {
    return (
      <div className="h-[500px] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!quiz) return null;

  const currentQuestion = quiz.questions[selectedQuestionIndex];

  return (
    <div className="flex h-[600px] -mx-6 -mb-6 bg-slate-50 border-t border-border">
      {/* Sidebar: Question List */}
      <div className="w-64 border-r border-border bg-white flex flex-col">
        <div className="p-4 border-b border-border bg-slate-50/50 flex items-center justify-between">
          <span className="text-[10px] font-extrabold text-surface-400 uppercase tracking-widest">Inventory</span>
          <Button variant="ghost" size="icon-sm" onClick={addQuestion}>
            <Plus className="w-3.5 h-3.5" />
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto">
          {quiz.questions.map((q, i) => (
            <button
              key={i}
              onClick={() => {
                setSelectedQuestionIndex(i);
                setActiveView('question');
              }}
              className={cn(
                "w-full text-left p-3 border-b border-border transition-all flex items-center gap-3 group",
                activeView === 'question' && selectedQuestionIndex === i 
                  ? "bg-primary/5 border-l-2 border-l-primary" 
                  : "hover:bg-slate-50 border-l-2 border-l-transparent"
              )}
            >
              <span className="text-[10px] font-bold text-surface-400 shrink-0">#{i + 1}</span>
              <span className="text-xs font-semibold text-surface-700 truncate flex-1">{q.text}</span>
              <Trash2 
                className="w-3.5 h-3.5 text-surface-300 opacity-0 group-hover:opacity-100 hover:text-red-500 transition-all" 
                onClick={(e) => deleteQuestion(e, i)}
              />
            </button>
          ))}
          
          <button
            onClick={() => setActiveView('rewards')}
            className={cn(
              "w-full text-left p-4 mt-4 transition-all flex items-center gap-3",
              activeView === 'rewards' 
                ? "bg-amber-50 border-l-2 border-l-amber-500 text-amber-700" 
                : "hover:bg-slate-50 text-surface-500 border-l-2 border-l-transparent"
            )}
          >
            <Trophy className="w-4 h-4 shrink-0" />
            <span className="text-xs font-bold uppercase tracking-wider">Rewards Engine</span>
          </button>
        </div>
        <div className="p-4 border-t border-border mt-auto">
          <Button className="w-full" size="sm" onClick={handleSave} isLoading={isSaving} leftIcon={<Save className="w-4 h-4" />}>
            Persist Registry
          </Button>
        </div>
      </div>

      {/* Main Panel: Editor */}
      <div className="flex-1 overflow-y-auto p-8">
        {activeView === 'rewards' ? (
          <div className="max-w-xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-2">
            <div className="space-y-1">
              <h3 className="text-lg font-extrabold text-surface-900 tracking-tight">Gamification Rules</h3>
              <p className="text-sm text-surface-500">Define point multipliers based on stakeholder performance and attempts.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <RewardCard 
                label="Primary Pass" 
                desc="1st Successive attempt" 
                icon={<Trophy className="w-4 h-4" />}
                value={quiz.firstAttemptPoints}
                onChange={(v) => setQuiz({...quiz, firstAttemptPoints: v})}
              />
              <RewardCard 
                label="Secondary Sync" 
                desc="2nd Successive attempt" 
                icon={<ListRestart className="w-4 h-4 text-surface-400" />}
                value={quiz.secondAttemptPoints}
                onChange={(v) => setQuiz({...quiz, secondAttemptPoints: v})}
              />
              <RewardCard 
                label="Tertiary Phase" 
                desc="3rd Successive attempt" 
                icon={<AlertCircle className="w-4 h-4 text-surface-400" />}
                value={quiz.thirdAttemptPoints}
                onChange={(v) => setQuiz({...quiz, thirdAttemptPoints: v})}
              />
              <RewardCard 
                label="Legacy Baseline" 
                desc="4th+ Successive attempts" 
                icon={<Settings className="w-4 h-4 text-surface-400" />}
                value={quiz.fourthPlusPoints}
                onChange={(v) => setQuiz({...quiz, fourthPlusPoints: v})}
              />
            </div>
            
            <div className="p-4 border border-blue-100 bg-blue-50/50 rounded-md flex gap-3">
               <HelpCircle className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
               <div className="text-xs text-blue-700 leading-relaxed">
                  <p className="font-bold mb-1">Point Calibration Guide</p>
                  High rewards for the first attempt encourage thorough study before starting. We recommend a 100-75-50-25 gradient for professional certifications.
               </div>
            </div>
          </div>
        ) : currentQuestion ? (
          <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-2">
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-extrabold text-surface-400 uppercase tracking-widest">Question Exposition</label>
                <Textarea 
                  value={currentQuestion.text}
                  onChange={(e) => updateQuestion({ text: e.target.value })}
                  placeholder="The query for the stakeholder to resolve..."
                  className="min-h-[100px] text-lg font-semibold leading-relaxed"
                />
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-extrabold text-surface-400 uppercase tracking-widest">Registry Options</label>
                  <Button variant="ghost" size="sm" onClick={addOption} leftIcon={<Plus className="w-3.5 h-3.5" />}>
                     Append Entry
                  </Button>
                </div>
                
                <div className="space-y-3">
                  {currentQuestion.options.map((opt, oi) => (
                    <div key={oi} className="flex gap-3 group animate-in zoom-in-95 duration-200">
                      <button
                        onClick={() => {
                          const nextOptions = currentQuestion.options.map((o, idx) => ({
                            ...o,
                            isCorrect: idx === oi
                          }));
                          updateQuestion({ options: nextOptions });
                        }}
                        className={cn(
                          "w-10 h-10 rounded border flex items-center justify-center transition-all",
                          opt.isCorrect 
                            ? "bg-emerald-500 border-emerald-600 shadow-sm" 
                            : "bg-white border-border hover:border-emerald-300"
                        )}
                      >
                        <CheckCircle className={cn("w-5 h-5", opt.isCorrect ? "text-white" : "text-surface-100")} />
                      </button>
                      <Input 
                        value={opt.text}
                        onChange={(e) => updateOption(oi, { text: e.target.value })}
                        placeholder={`Response Variant ${oi + 1}`}
                        className={cn("flex-1", opt.isCorrect && "border-emerald-200 bg-emerald-50/20")}
                      />
                      <Button 
                        variant="ghost" 
                        size="icon-sm" 
                        className="text-surface-300 hover:text-red-500 transition-colors"
                        onClick={() => removeOption(oi)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center gap-4">
            <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center">
              <Plus className="w-8 h-8 text-surface-300" />
            </div>
            <div className="space-y-1">
              <h4 className="font-bold text-surface-900">Module Empty</h4>
              <p className="text-sm text-surface-500 max-w-xs">Initialize your assessment logic by appending your first query entry.</p>
            </div>
            <Button size="sm" onClick={addQuestion}>Start Builder</Button>
          </div>
        )}
      </div>
    </div>
  );
}

function RewardCard({ label, desc, icon, value, onChange }: { label: string; desc: string; icon: React.ReactNode; value: number; onChange: (v: number) => void }) {
  return (
    <div className="p-4 rounded-md border border-border bg-white shadow-sm hover:border-primary/20 transition-all group">
      <div className="flex items-start justify-between mb-4">
        <div className="p-2 rounded bg-slate-50 border border-border group-hover:bg-primary/5 group-hover:border-primary/20 transition-colors">
          {icon}
        </div>
        <div className="text-right">
          <Input 
            type="number" 
            value={value} 
            onChange={(e) => onChange(Number(e.target.value))}
            className="w-20 text-right font-extrabold h-8"
          />
          <span className="text-[10px] font-extrabold text-surface-400 uppercase tracking-widest mt-1 block">pts</span>
        </div>
      </div>
      <div className="space-y-0.5">
        <p className="text-xs font-bold text-surface-900 uppercase tracking-wider">{label}</p>
        <p className="text-[10px] text-surface-500">{desc}</p>
      </div>
    </div>
  );
}
