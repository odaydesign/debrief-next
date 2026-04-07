"use client";

export default function Error({ error, reset }) {
  return (
    <div className="min-h-screen bg-[#46423f] flex items-center justify-center p-6">
      <div className="bg-[#2a2726] rounded-3xl p-8 max-w-md w-full text-center">
        <h2 className="text-2xl font-serif text-[#f6f4f1] mb-4">Something went wrong</h2>
        <p className="text-[#f6f4f1]/60 mb-6 text-sm">{error?.message}</p>
        <button
          onClick={reset}
          className="px-6 py-3 bg-[#50c878] text-white rounded-xl font-medium hover:bg-[#45b068] transition-colors"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
