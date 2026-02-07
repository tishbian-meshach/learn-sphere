"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
import { Award, ArrowLeft, FileText, ImageIcon, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import * as htmlToImage from "html-to-image";
import { jsPDF } from "jspdf";
import certificateBg from "@/assets/Certificate-bg.jpg";

interface CertificateProps {
  userName: string;
  courseTitle: string;
  completionDate: string;
  certificateId: string;
  onClose?: () => void;
  autoPrint?: boolean;
}

function triggerDownload(url: string, filename: string) {
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

function slugify(str: string) {
  return str.toLowerCase().replace(/\s+/g, "-");
}

/* 
  The actual certificate content component.
  This is rendered twice: once for preview (scaled) and once hidden (full size) for generation.
*/
const CertificateContent = React.forwardRef<HTMLDivElement, { data: CertificateProps }>(
  ({ data }, ref) => {
    // Format date nicely
    const formattedDate = new Date(data.completionDate).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    return (
      <div
        ref={ref}
        className="w-[1587px] h-[1123px] bg-white text-surface-900 relative overflow-hidden shadow-2xl"
        style={{
          fontFamily: "'Plus Jakarta Sans', sans-serif",
        }}
      >
        {/* Google Font Import for the generated image */}
        <style>
          {`@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@200;300;400;500;600;700;800&display=swap');`}
        </style>

        {/* Background Image Layer */}
        <div className="absolute inset-0 z-0">
            <img 
            src={certificateBg.src} 
            alt="Certificate Background" 
            className="w-full h-full object-cover "
            />
        </div>
        
        {/* Decorative Gradient Overlay (Subtle) */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-transparent to-purple-50/30 z-0 mix-blend-overlay pointer-events-none" />

        {/* Watermark */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.03] z-0">
          <div className="text-[12rem] font-black text-surface-900 -rotate-45 select-none tracking-widest">
            LearnSphere
          </div>
        </div>

        {/* Header Section */}
        <div className="relative z-10 pt-20 px-24 flex flex-col items-center text-center">
            <div className="flex items-center gap-5 mb-8">
                <div className="p-4 bg-primary/10 rounded-full border border-primary/20">
                    <Award className="w-14 h-14 text-primary" />
                </div>
                <div className="text-left">
                     <h1 className="text-5xl font-black text-surface-900 tracking-tight ">LearnSphere</h1>
                     <p className="text-xl font-bold text-surface-500 uppercase tracking-widest">Global Learning Academy</p>
                </div>
            </div>
            
            <div className="h-1.5 w-full max-w-5xl  mt-4 mb-14 rounded-full" />

            <h2 className="text-6xl font-black text-surface-900 tracking-wide uppercase mb-8 drop-shadow-sm whitespace-nowrap">
                Certificate of Completion
            </h2>
            
            <p className="text-2xl font-semibold text-surface-500 uppercase tracking-widest mb-14">
                This professional credential is hereby awarded to
            </p>

            {/* Student Name */}
            <div className="relative mb-14 mx-52">
                <h3 className="text-7xl font-black text-transparent bg-clip-text bg-primary-700  py-4 px-16 inline-block">
                    {data.userName}
                </h3>
            </div>

            <p className="text-2xl font-semibold text-surface-600 max-w-6xl leading-relaxed mb-6 mx-52">
                For the innovative mastery and successful completion of the comprehensive professional curriculum in
            </p>

            {/* Course Title */}
            <h4 className="text-3xl font-black text-surface-900 uppercase  mb-20 text-balance max-w-6xl">
                {data.courseTitle}
            </h4>
        </div>

        {/* Footer Section */}
        <div className="absolute bottom-0 left-0 right-0 px-28 pb-20 z-10">
            <div className="grid grid-cols-3 items-end border-t-2 border-surface-100 pt-10 mx-48">
                {/* Date */}
                <div className="text-left">
                    <p className="text-xl font-bold text-surface-400 uppercase tracking-widest mb-3">Issued On</p>
                    <p className="text-3xl font-black text-surface-900">{formattedDate}</p>
                </div>

                {/* Center Seal/Signature Placeholder */}
                <div className="flex flex-col items-center justify-end -mb-8">
                    <div className="w-32 h-32 mb-4 opacity-90 relative">
                         <div className="absolute inset-0 border-[6px] border-primary/20 rounded-full animate-[spin_10s_linear_infinite]" />
                         <div className="absolute inset-2 border-[2px] border-dashed border-primary/40 rounded-full" />
                         <div className="w-full h-full rounded-full flex items-center justify-center bg-white shadow-xl">
                             <Award className="w-14 h-14 text-primary" />
                         </div>
                    </div>
                    <p className="text-sm font-bold text-primary uppercase tracking-[0.3em] bg-white px-2 relative z-10">Official Verified Seal</p>
                </div>

                {/* Certificate ID */}
                <div className="text-right">
                    <p className="text-xl font-bold text-surface-400 uppercase tracking-widest mb-3">Certificate ID</p>
                    <p className="text-2xl font-mono font-bold text-surface-900 tracking-wider text-primary">{data.certificateId}</p>
                    <p className="text-base text-surface-400 mt-2 font-medium tracking-wide">verify.learnsphere.io</p>
                </div>
            </div>
        </div>
      </div>
    );
  }
);
CertificateContent.displayName = "CertificateContent";

export function Certificate({
  userName,
  courseTitle,
  completionDate,
  certificateId,
  onClose,
  autoPrint = false,
}: CertificateProps) {
  const [pending, setPending] = useState(false);
  const [scale, setScale] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);
  const downloadRef = useRef<HTMLDivElement>(null);

  // Dynamic Scale Logic
  const updateScale = useCallback(() => {
    if (!containerRef.current) return;
    const { clientWidth, clientHeight } = containerRef.current;
    
    // Target dimensions
    const targetW = 1587;
    const targetH = 1123;
    
    // Add some padding (40px)
    const availableW = clientWidth - 40;
    const availableH = clientHeight - 40;
    
    // Calculate scale to fit
    const scaleW = availableW / targetW;
    const scaleH = availableH / targetH;
    
    // Use the smaller scale to ensure it fits both dimensions
    setScale(Math.min(scaleW, scaleH));
  }, []);

  useEffect(() => {
    updateScale();
    window.addEventListener("resize", updateScale);
    return () => window.removeEventListener("resize", updateScale);
  }, [updateScale]);


  const saveAsPdf = async () => {
    if (!downloadRef.current) return;
    setPending(true);
    try {
      // Wait for fonts to be ready
      await document.fonts.ready;

      const pngDataUrl = await htmlToImage.toPng(downloadRef.current, {
        cacheBust: true,
        pixelRatio: 2,
        backgroundColor: '#ffffff',
        width: 1587,
        height: 1123,
        style: {
           transform: 'none',
        },
        fontEmbedCSS: `@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@200;300;400;500;600;700;800&display=swap');`
      });

      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4",
      });

      const pdfWidth = 297;
      const pdfHeight = 210;

      pdf.addImage(pngDataUrl, "PNG", 0, 0, pdfWidth, pdfHeight, undefined, "FAST");
      pdf.save(`certificate-${slugify(userName)}.pdf`);
    } catch (err) {
      console.error("PDF generation failed", err);
    } finally {
      setPending(false);
    }
  };

      
  const saveAsImage = async () => {
    if (!downloadRef.current) return;
    setPending(true);
    try {
      // Wait for fonts to be ready
      await document.fonts.ready;
      
      const blobUrl = await htmlToImage.toPng(downloadRef.current, {
        cacheBust: true,
        pixelRatio: 2,
        backgroundColor: '#ffffff',
        width: 1587,
        height: 1123,
        style: {
           transform: 'none',
        },
        fontEmbedCSS: `@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@200;300;400;500;600;700;800&display=swap');`
      });
      triggerDownload(blobUrl, `certificate-${slugify(userName)}.png`);
    } catch (err) {
      console.error("Image generation failed", err);
    } finally {
        setPending(false);
    }
  };

  // Auto-download logic if requested
  useEffect(() => {
    if (autoPrint) {
       // Small delay to ensure rendering
       const timer = setTimeout(() => {
         saveAsPdf();
       }, 1000);
       return () => clearTimeout(timer);
    }
  }, [autoPrint]);

  return (
    <div className="fixed inset-0 z-[150] flex flex-col bg-surface-950/95 backdrop-blur-md animate-in fade-in duration-300">
        <style>
          {`@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@200;300;400;500;600;700;800&display=swap');`}
        </style>
        
        {/* Actions Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-surface-950/50">
            <Button 
                variant="ghost" 
                className="text-white hover:bg-white/10 gap-2"
                onClick={onClose}
            >
                <ArrowLeft className="w-4 h-4" />
                Back
            </Button>
            
            <div className="flex items-center gap-3">
                <Button 
                variant="outline" 
                className="bg-white/5 border-white/20 text-white hover:bg-white/10 gap-2"
                onClick={saveAsImage}
                disabled={pending}
                >
                {pending ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImageIcon className="w-4 h-4" />}
                Save Image
                </Button>
                
                <Button 
                variant="primary" 
                className="gap-2 shadow-lg shadow-primary/20"
                onClick={saveAsPdf}
                disabled={pending}
                >
                {pending ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
                Download PDF
                </Button>
            </div>
        </div>

        {/* Certificate Preview Area */}
        <div 
            className="flex-1 w-full flex items-center justify-center p-8 overflow-hidden relative bg-black/20"
            ref={containerRef}
        >
            <div 
                className="shadow-2xl transition-transform duration-300 origin-center will-change-transform"
                style={{
                   transform: `scale(${scale})`,
                   width: '1587px', // Fixed extraction size
                   height: '1123px',
                }}
            >
                <CertificateContent 
                    ref={downloadRef}
                    data={{ userName, courseTitle, completionDate, certificateId }} 
                />
            </div>
        </div>


    </div>
  );
}
