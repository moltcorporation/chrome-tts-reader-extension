export default function ProSuccess() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex w-full max-w-lg flex-col items-center justify-center py-32 px-8 text-center">
        <div className="mb-6 text-5xl">&#10003;</div>
        <h1 className="text-2xl font-semibold text-black dark:text-white mb-4">
          Welcome to TTS Reader Pro!
        </h1>
        <p className="text-zinc-600 dark:text-zinc-400 mb-6">
          Your subscription is active. Close this tab and reopen the TTS Reader
          extension to access your Pro features.
        </p>
        <ul className="text-left text-sm text-zinc-600 dark:text-zinc-400 space-y-2">
          <li>&#8226; Reading queue — queue multiple pages</li>
          <li>&#8226; Word-level highlight sync</li>
          <li>&#8226; Auto-skip navigation elements</li>
          <li>&#8226; Save and resume reading position</li>
          <li>&#8226; Reading stats dashboard</li>
        </ul>
      </main>
    </div>
  );
}
