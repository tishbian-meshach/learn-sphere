'use client';

import React, { useEffect, useState } from 'react';
import { Trophy, CheckCircle, ArrowRight, Star, GraduationCap,Download, X, Award } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Certificate } from './Certificate';

interface CourseCompletionModalProps {
  isOpen: boolean;
  onClose: () => void;
  courseTitle: string;
  pointsEarned?: number;
  userName: string;
  completionDate: string;
  certificateId: string;
}

export function CourseCompletionModal({
  isOpen,
  onClose,
  courseTitle,
  pointsEarned = 100,
  userName,
  completionDate,
  certificateId
}: CourseCompletionModalProps) {
  const [showContent, setShowContent] = useState(false);
  const [isCertificateOpen, setIsCertificateOpen] = useState(false);
  const [autoPrint, setAutoPrint] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => setShowContent(true), 100);
      return () => clearTimeout(timer);
    } else {
      setShowContent(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Dynamic Backdrop */}
      <div 
        className={cn(
          "absolute inset-0 bg-surface-900/60 backdrop-blur-md transition-opacity duration-700",
          showContent ? "opacity-100" : "opacity-0"
        )}
        onClick={onClose}
      />

      {/* Main Carrier */}
      <div 
        className={cn(
          "relative w-full max-w-lg bg-white rounded-3xl overflow-hidden shadow-2xl border border-white/20 transition-all duration-700 transform",
          showContent ? "scale-100 opacity-100 translate-y-0" : "scale-90 opacity-0 translate-y-12"
        )}
      >
        {/* Decorative Background Elements */}
        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-br from-primary/10 via-amber-50 to-transparent" />
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-primary/5 rounded-full blur-3xl animate-pulse" />
        
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-100 transition-colors z-10"
        >
          <X className="w-4 h-4 text-surface-400" />
        </button>

        <div className="relative p-8 flex flex-col items-center text-center">
          {/* Animated Badge */}
          <div className="relative mb-8">
            <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl opacity-20" />
            <div className="relative w-24 h-24 bg-gradient-to-b from-primary to-primary-600 rounded-full flex items-center justify-center shadow-lg border-4 border-white">
              <Trophy className="w-12 h-12 text-white " />
            </div>
            <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-amber-400 rounded-full border-4 border-white flex items-center justify-center shadow-md">
              <CheckCircle className="w-5 h-5 text-white" />
            </div>
          </div>

          <div className="space-y-2 mb-8">
            <h2 className="text-[10px] font-black text-primary uppercase tracking-[0.3em]">Achievement Unlocked</h2>
            <h1 className="text-3xl font-black text-surface-900 leading-tight">Professional Certification Finalized</h1>
            <p className="text-surface-500 text-sm font-medium px-4">
              Curriculum requirements for <span className="font-bold text-surface-900 italic underline decoration-primary/30">"{courseTitle}"</span> have been certified with precision.
            </p>
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-2 gap-4 w-full mb-8">
            <div className="p-4 rounded-2xl bg-slate-50 border border-border flex flex-col items-center gap-1">
              <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
              <p className="text-[10px] font-bold text-surface-400 uppercase tracking-widest">Reward Credits</p>
              <p className="text-lg font-black text-surface-900">+{pointsEarned} XP</p>
            </div>
            <div className="p-4 rounded-2xl bg-primary/5 border border-primary/10 flex flex-col items-center gap-1">
              <GraduationCap className="w-4 h-4 text-primary" />
              <p className="text-[10px] font-bold text-primary uppercase tracking-widest">Growth Tier</p>
              <p className="text-lg font-black text-primary">Certified</p>
            </div>
          </div>

          <div className="flex flex-col w-full gap-3">
            <Button 
               size="lg" 
               className="w-full shadow-lg shadow-primary/20 h-14 rounded-2xl text-base font-bold"
               onClick={onClose}
               rightIcon={<ArrowRight className="w-5 h-5" />}
            >
              Continue My Journey
            </Button>
            
            <div className="flex gap-3">
              <Button
                variant="outline"
                size="lg"
                className="flex-1 h-14 rounded-2xl text-base font-bold group"
                onClick={() => { setAutoPrint(false); setIsCertificateOpen(true); }}
                leftIcon={<Award className="w-5 h-5 text-primary group-hover:scale-110 transition-transform" />}
              >
                View
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="flex-1 h-14 rounded-2xl text-base font-bold group"
                onClick={() => { setAutoPrint(true); setIsCertificateOpen(true); }}
                leftIcon={<Download className="w-5 h-5 text-primary group-hover:scale-110 transition-transform" />}
              >
                Download
              </Button>
            </div>

            <p className="text-[10px] font-bold text-surface-400 uppercase tracking-widest mt-2">
              Digital certificate issued via LearnSphere Registry
            </p>
          </div>
        </div>

        {/* Bottom Shimmer Bar */}
        <div className="h-1.5 w-full bg-gradient-to-r from-transparent via-primary/30 to-transparent animate-shimmer" />

        {/* Certificate Preview Overlay */}
        {isCertificateOpen && (
          <Certificate 
            userName={userName}
            courseTitle={courseTitle}
            completionDate={completionDate}
            certificateId={certificateId}
            onClose={() => setIsCertificateOpen(false)}
            autoPrint={autoPrint}
          />
        )}
      </div>

      <style jsx>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .animate-shimmer {
          animation: shimmer 3s infinite;
        }
      `}</style>
    </div>
  );
}
