interface LandingProps {
  onUploadClick: () => void;
}

export default function Landing({ onUploadClick }: LandingProps) {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-md p-10 max-w-lg w-full text-center space-y-6">
        <h1 className="text-2xl font-bold text-navy tracking-wide">VERITY ASSESSMENT STUDIO</h1>
        <p className="text-navy/70">AI Marking with the Teacher in Control</p>
        <p className="text-sm text-gray-500">
          Verity proposes the marks. The teacher reviews and signs off.
        </p>
        <button
          onClick={onUploadClick}
          className="bg-navy text-white font-medium px-6 py-3 rounded-xl shadow hover:opacity-90 transition"
        >
          Upload Memorandum
        </button>
      </div>
    </div>
  );
}
