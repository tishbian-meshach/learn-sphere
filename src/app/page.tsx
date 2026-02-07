import Link from 'next/link';
import { GraduationCap, ArrowRight, BookOpen, Users, Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Simple Header */}
      <header className="h-14 border-b border-border bg-white sticky top-0 z-50">
        <div className="max-w-screen-xl mx-auto px-6 h-full flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-primary flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold text-surface-900">LearnSphere</span>
          </div>
          <nav className="flex items-center gap-6">
            <Link href="/learner/courses" className="text-sm font-medium text-surface-600 hover:text-surface-900">
              Browse Courses
            </Link>
            <div className="h-4 w-[1px] bg-border" />
            <Link href="/sign-in" className="text-sm font-medium text-surface-600 hover:text-surface-900">
              Sign In
            </Link>
            <Button size="sm" asChild>
              <Link href="/sign-up">Get Started</Link>
            </Button>
          </nav>
        </div>
      </header>

      {/* Professional Product Entry */}
      <main className="flex-1 flex flex-col">
        <section className="py-24 bg-white border-b border-border">
          <div className="max-w-screen-xl mx-auto px-6 grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded border border-primary/20 bg-primary/5 text-primary text-xs font-bold uppercase tracking-wider mb-6">
                Platform Update v1.0
              </div>
              <h1 className="text-4xl md:text-5xl font-extrabold text-surface-900 leading-[1.1] mb-6 tracking-tight">
                Professional learning <br />
                <span className="text-primary">infrastructure</span> for teams.
              </h1>
              <p className="text-lg text-surface-600 mb-8 max-w-lg leading-relaxed">
                A clean, restrained platform for corporate training, academic excellence, and skill development at scale. Built for clarity and performance.
              </p>
              <div className="flex items-center gap-4">
                <Button size="md" className="px-6" asChild>
                  <Link href="/sign-up">Create Provider Account</Link>
                </Button>
                <Button variant="outline" size="md" className="px-6" asChild>
                  <Link href="/learner/courses">View Course Catalog</Link>
                </Button>
              </div>
            </div>
            <div className="hidden lg:block">
              <div className="rounded border border-border bg-slate-50 p-4 aspect-[4/3] flex items-center justify-center relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent" />
                <div className="z-10 text-center space-y-4">
                  <div className="w-16 h-16 bg-white border border-border rounded flex items-center justify-center mx-auto shadow-sm transition-transform group-hover:scale-105 duration-500">
                    <BookOpen className="w-8 h-8 text-primary" />
                  </div>
                  <div className="space-y-1">
                    <div className="h-2 w-32 bg-surface-200 rounded mx-auto" />
                    <div className="h-2 w-24 bg-surface-100 rounded mx-auto" />
                  </div>
                </div>
                {/* Decorative UI elements */}
                <div className="absolute top-8 left-8 w-32 h-20 bg-white border border-border rounded shadow-sm p-3 space-y-2">
                  <div className="h-1.5 w-full bg-surface-100 rounded" />
                  <div className="h-1.5 w-2/3 bg-surface-100 rounded" />
                </div>
                <div className="absolute bottom-8 right-8 w-24 h-24 bg-white border border-border rounded shadow-sm p-4 flex flex-col justify-end gap-2">
                  <div className="h-4 w-4 bg-emerald-500 rounded-full" />
                  <div className="h-1.5 w-full bg-surface-100 rounded" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Feature Grid - Minimal */}
        <section className="py-24 bg-slate-50">
          <div className="max-w-screen-xl mx-auto px-6">
            <div className="grid md:grid-cols-3 gap-16">
              <div className="space-y-4">
                <div className="w-10 h-10 rounded border border-border bg-white flex items-center justify-center shadow-sm">
                  <GraduationCap className="w-5 h-5 text-surface-600" />
                </div>
                <h3 className="text-base font-bold text-surface-900 uppercase tracking-wider">Expert Instruction</h3>
                <p className="text-sm text-surface-600 leading-relaxed font-medium">
                  Curated courses from industry professionals, focused on practical results rather than academic theory.
                </p>
              </div>
              <div className="space-y-4">
                <div className="w-10 h-10 rounded border border-border bg-white flex items-center justify-center shadow-sm">
                  <Trophy className="w-5 h-5 text-surface-600" />
                </div>
                <h3 className="text-base font-bold text-surface-900 uppercase tracking-wider">Skills Validation</h3>
                <p className="text-sm text-surface-600 leading-relaxed font-medium">
                  Integrated assessment tools and gamified points system to track and reward real-world progress.
                </p>
              </div>
              <div className="space-y-4">
                <div className="w-10 h-10 rounded border border-border bg-white flex items-center justify-center shadow-sm">
                  <Users className="w-5 h-5 text-surface-600" />
                </div>
                <h3 className="text-base font-bold text-surface-900 uppercase tracking-wider">User Management</h3>
                <p className="text-sm text-surface-600 leading-relaxed font-medium">
                  Robust role-based access control for administrators, instructors, and learners within your organization.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Dense Product Callout */}
        <section className="py-24">
          <div className="max-w-screen-xl mx-auto px-6">
            <div className="bg-surface-900 rounded p-12 text-white flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="max-w-xl">
                <h2 className="text-2xl font-extrabold uppercase tracking-tight mb-4">Implementation Ready</h2>
                <p className="text-surface-400 text-sm font-medium leading-relaxed">
                  Join hundreds of organizations using our infrastructure to deliver high-quality learning experiences. Scalable, secure, and fully managed.
                </p>
              </div>
              <div className="flex gap-4">
                <Button variant="secondary" className="px-6 font-bold" asChild>
                  <Link href="/sign-up">Start Repository Free</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Boring Footer */}
      <footer className="border-t border-border bg-white py-12">
        <div className="max-w-screen-xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2 saturate-0 opacity-40">
            <GraduationCap className="w-5 h-5" />
            <span className="text-sm font-bold tracking-tight">LearnSphere</span>
          </div>
          <p className="text-[10px] text-surface-400 font-bold uppercase tracking-widest">
            &copy; {new Date().getFullYear()} LearnSphere Platform. Infrastructure for Teams.
          </p>
          <div className="flex gap-6">
            <Link href="#" className="text-[10px] font-bold uppercase tracking-widest text-surface-500 hover:text-surface-900">Legal</Link>
            <Link href="#" className="text-[10px] font-bold uppercase tracking-widest text-surface-500 hover:text-surface-900">Privacy</Link>
            <Link href="#" className="text-[10px] font-bold uppercase tracking-widest text-surface-500 hover:text-surface-900">Inventory</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
