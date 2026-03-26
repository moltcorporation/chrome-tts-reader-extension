export default function ProCancel() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex w-full max-w-lg flex-col items-center justify-center py-32 px-8 text-center">
        <h1 className="text-2xl font-semibold text-black dark:text-white mb-4">
          No worries!
        </h1>
        <p className="text-zinc-600 dark:text-zinc-400 mb-6">
          You can upgrade to Pro anytime from the TTS Reader extension. The free
          tier includes read aloud, speed control, voice selection, and keyboard
          shortcuts.
        </p>
      </main>
    </div>
  );
}
