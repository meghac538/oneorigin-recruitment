export default function CandidateThanks() {
  return (
    <div className="min-h-screen bg-[#ffffff] text-[#0a0a0a]">
      <main className="mx-auto flex w-full max-w-4xl flex-col items-center justify-center px-6 py-24 text-center">
        <div className="rounded-[32px] border border-[#e5e7eb] bg-white px-8 py-12 shadow-[var(--shadow)]">
          <p className="text-xs uppercase tracking-[0.4em] text-[#4b5563]">
            OneOrigin Interview
          </p>
          <h1 className="mt-4 text-3xl font-semibold md:text-4xl">
            Thanks for submitting!
          </h1>
          <p className="mt-4 text-lg text-[#4b5563]">
            Your response has been saved. The hiring team will review your
            work and follow up with next steps.
          </p>
        </div>
      </main>
    </div>
  );
}
