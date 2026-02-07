'use client';

import { useState, useEffect } from 'react';
import { 
  Star, 
  MessageSquare, 
  Send, 
  Loader2,
  Lock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar } from '@/components/ui/avatar';
import { useAuth } from '@/hooks/use-auth';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  user: {
    name: string | null;
    avatarUrl: string | null;
  };
}

interface CourseReviewsProps {
  courseId: string;
  readOnly?: boolean;
}

export function CourseReviews({ courseId, readOnly = false }: CourseReviewsProps) {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [avgRating, setAvgRating] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isEnrolled, setIsEnrolled] = useState(false);
  
  // Submission Form State (only used if not readOnly)
  const [userRating, setUserRating] = useState(0);
  const [userComment, setUserComment] = useState('');

  useEffect(() => {
    fetchReviews();
  }, [courseId]);

  const fetchReviews = async () => {
    try {
      setIsLoading(true);
      const [reviewsRes, courseRes] = await Promise.all([
        fetch(`/api/courses/${courseId}/reviews`),
        fetch(`/api/courses/${courseId}`)
      ]);

      if (reviewsRes.ok) {
        const data = await reviewsRes.json();
        setReviews(data.reviews || []);
        setAvgRating(data.averageRating || 0);
      }

      if (courseRes.ok) {
        const courseData = await courseRes.json();
        setIsEnrolled(!!courseData.userStatus);
        setIsCompleted(courseData.userStatus === 'COMPLETED');
      }
    } catch (error) {
      console.error('Failed to fetch reviews and course data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitReview = async () => {
    if (!userRating) {
      toast.error('Please select a star rating');
      return;
    }

    if (!user?.id) {
      toast.error('You must be logged in to submit a review');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/courses/${courseId}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          rating: userRating,
          comment: userComment,
        }),
      });

      if (res.ok) {
        toast.success('Review submitted successfully');
        setUserRating(0);
        setUserComment('');
        fetchReviews();
      } else {
        const data = await res.json();
        toast.error(data.error || 'Failed to submit review');
      }
    } catch (error) {
      toast.error('Failed to submit review');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-surface-200" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-slate-50">
      {/* Header Stats */}
      <div className="p-6 bg-white border-b border-border shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div className="space-y-1">
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-extrabold text-surface-900 tracking-tight">{avgRating > 0 ? avgRating : '0.0'}</span>
              <span className="text-sm font-bold text-surface-400">/ 5.0</span>
            </div>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star 
                  key={star} 
                  className={cn(
                    "w-5 h-5",
                    star <= Math.round(avgRating) ? "text-amber-400 fill-amber-400" : "text-surface-100"
                  )} 
                />
              ))}
            </div>
            <p className="text-xs font-bold text-surface-400 uppercase tracking-widest pt-2">{reviews.length} learner reviews</p>
          </div>
          
          {readOnly && (
            <div className="hidden md:flex flex-col items-end gap-1">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border bg-primary-50 text-primary-700 border-primary-100">Read Only View</span>
              <p className="text-[10px] text-surface-400 font-bold uppercase tracking-tighter text-right">Feedback channel (External View)</p>
            </div>
          )}
        </div>

        {/* Submission Form (Hidden if readOnly or not completed) */}
        {!readOnly && (
          <div className="p-4 rounded-xl border border-border bg-slate-50/50 space-y-4 shadow-inner">
            {!isCompleted ? (
              <div className="py-4 text-center space-y-2">
                <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center mx-auto mb-2 border border-amber-100">
                  <Lock className="w-5 h-5 text-amber-500" />
                </div>
                <p className="text-xs font-bold text-surface-900 tracking-tight">Reviews are Restricted</p>
                <p className="text-[10px] text-surface-500 max-w-[200px] mx-auto leading-normal">
                  You must achieve 100% curriculum completion to share your experience with this resource.
                </p>
                {!isEnrolled && (
                  <p className="text-[10px] font-bold text-primary pt-1">Enroll now to start learning!</p>
                )}
              </div>
            ) : (
              <>
                <div className="flex flex-col items-center gap-2">
                  <p className="text-xs font-bold text-surface-500 uppercase tracking-widest">Rate this Course</p>
                  <div className="flex justify-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setUserRating(star)}
                        className="transition-all hover:scale-125 hover:rotate-6 focus:outline-none"
                      >
                        <Star 
                          className={cn(
                            "w-8 h-8 transition-colors",
                            star <= userRating ? "text-amber-400 fill-amber-400 drop-shadow-sm" : "text-surface-200 hover:text-amber-200"
                          )}
                        />
                      </button>
                    ))}
                  </div>
                </div>
                <Textarea 
                  placeholder="Tell other learners about your experience with this resource..." 
                  value={userComment}
                  onChange={(e) => setUserComment(e.target.value)}
                  className="min-h-[100px] text-xs bg-white border-border focus:ring-primary/20"
                />
                <Button 
                  size="sm" 
                  className="w-full font-bold shadow-md" 
                  disabled={!userRating || isSubmitting}
                  onClick={handleSubmitReview}
                  leftIcon={isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                >
                  Submit Feedback
                </Button>
              </>
            )}
          </div>
        )}
      </div>

      {/* Review List */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {reviews.length === 0 ? (
          <div className="text-center py-12 rounded-xl border-2 border-dashed border-border bg-white">
            <MessageSquare className="w-12 h-12 text-surface-100 mx-auto mb-4" />
            <p className="text-sm font-bold text-surface-400 capitalize">No learner feedback recorded yet</p>
            {!readOnly && <p className="text-xs text-surface-300 mt-1">Be the catalyst by leaving the first review!</p>}
          </div>
        ) : (
          reviews.map((review) => (
            <div key={review.id} className="bg-white p-4 rounded-xl border border-border shadow-sm hover:border-primary/20 transition-all duration-300 group">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <Avatar 
                    src={review.user.avatarUrl} 
                    name={review.user.name} 
                    size="sm" 
                    className="w-8 h-8 ring-2 ring-white" 
                  />
                  <div>
                    <span className="block text-xs font-extrabold text-surface-900 group-hover:text-primary transition-colors">{review.user.name || 'Anonymous Learner'}</span>
                    <span className="text-[10px] font-bold text-surface-400 tabular-nums">
                      {new Date(review.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-0.5 bg-amber-50/50 px-2 py-1 rounded-full border border-amber-100/50">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star 
                      key={star} 
                      className={cn(
                        "w-2.5 h-2.5",
                        star <= review.rating ? "text-amber-400 fill-amber-400" : "text-surface-100"
                      )} 
                    />
                  ))}
                </div>
              </div>
              <p className="text-xs text-surface-600 leading-relaxed font-medium pl-11">{review.comment || (
                <span className="italic text-surface-400 font-normal">Learner provided a rating without additional commentary.</span>
              )}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
