interface LandingProps {
  onUploadClick: () => void;
}

export default function Landing({ onUploadClick }: LandingProps) {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="bg-white rounded-3xl shadow-xl shadow-slate-900/5 border border-slate-200/80 p-10 sm:p-14 max-w-xl w-full text-center space-y-6">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-navy/5 border border-navy/15 text-navy text-xs font-semibold tracking-wide">
          <span className="w-2 h-2 rounded-full bg-confirmed" />
          AI Marking Assistant for Teachers
        </div>

        <div className="space-y-3">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-navy tracking-tight">
            Verity Assessment Studio
          </h1>
          <p className="text-lg font-medium text-navy/80">
            AI Marking with the Teacher in Control
          </p>
          <p className="text-sm sm:text-base text-slate-500 max-w-md mx-auto leading-relaxed">
            Verity suggests the marks and explains why. You check each answer, change any mark you want, and approve the final score.
          </p>
        </div>

        <div className="pt-2">
          <button
            onClick={onUploadClick}
            className="inline-flex items-center gap-2.5 bg-navy text-white font-semibold px-8 py-4 rounded-2xl shadow-md hover:opacity-95 transition text-base"
          >
            <span>Upload Memorandum</span>
            <span>→</span>
          </button>
          <p className="text-xs text-slate-400 mt-3">
            Accepts PDF or TXT files
          </p>
        </div>
      </div>
    </div>
  );
}
