const CWS_URL =
  "https://chromewebstore.google.com/detail/tts-reader-text-to-speech/PLACEHOLDER_CWS_ID";

function HeroSection() {
  return (
    <section className="px-6 py-24 text-center">
      <h1 className="mx-auto max-w-3xl text-4xl font-bold tracking-tight text-zinc-900 sm:text-5xl">
        Text to Speech for Any Webpage
      </h1>
      <p className="mx-auto mt-6 max-w-2xl text-lg text-zinc-600">
        Turn articles, docs, and emails into audio with one click. Adjustable
        speed, voice selection, and highlight-as-you-read &mdash; all powered
        by your browser, no data sent anywhere.
      </p>
      <div className="mt-10 flex justify-center gap-4">
        <a
          href={CWS_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-lg bg-zinc-900 px-6 py-3 text-sm font-semibold text-white shadow hover:bg-zinc-700 transition-colors"
        >
          Add to Chrome &mdash; Free
        </a>
      </div>
    </section>
  );
}

const features = [
  {
    title: "Highlight to Read",
    description:
      "Select any text on a page and have it read aloud instantly. No menus, no setup \u2014 just highlight and listen.",
  },
  {
    title: "Full Page Reading",
    description:
      "Read an entire webpage from top to bottom with one click. Great for long articles, documentation, and research.",
  },
  {
    title: "Speed Control",
    description:
      "Adjust playback from 0.5x to 2x. Slow down for complex material or speed up for casual listening.",
  },
  {
    title: "Voice Selection",
    description:
      "Choose from all voices available on your system. Pick the voice that sounds best to you.",
  },
  {
    title: "Reading Progress",
    description:
      "Highlight-as-you-read tracking so you never lose your place. Follow along visually while you listen.",
  },
  {
    title: "Keyboard Shortcut",
    description:
      "Press Alt+R to start or stop reading instantly. No need to reach for the mouse.",
  },
];

function FeaturesSection() {
  return (
    <section className="bg-zinc-50 px-6 py-24">
      <div className="mx-auto max-w-5xl">
        <h2 className="text-center text-3xl font-bold tracking-tight text-zinc-900">
          Everything You Need to Listen to the Web
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-center text-zinc-600">
          Built for students, researchers, multitaskers, and anyone who prefers
          listening to reading.
        </p>
        <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <div key={feature.title} className="rounded-xl bg-white p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-zinc-900">{feature.title}</h3>
              <p className="mt-2 text-sm text-zinc-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function PricingSection() {
  return (
    <section className="px-6 py-24">
      <div className="mx-auto max-w-4xl">
        <h2 className="text-center text-3xl font-bold tracking-tight text-zinc-900">
          Simple, Affordable Pricing
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-center text-zinc-600">
          Core features are free. Pro unlocks power-user controls at a fraction
          of what Speechify charges.
        </p>
        <div className="mt-16 grid gap-8 sm:grid-cols-2">
          {/* Free tier */}
          <div className="rounded-xl border border-zinc-200 p-8">
            <h3 className="text-lg font-semibold text-zinc-900">Free</h3>
            <p className="mt-1 text-3xl font-bold text-zinc-900">$0</p>
            <p className="text-sm text-zinc-500">forever</p>
            <ul className="mt-8 space-y-3 text-sm text-zinc-700">
              <li className="flex items-start gap-2">
                <span className="mt-0.5 text-green-600">&#10003;</span>
                Highlight-to-read and full page reading
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 text-green-600">&#10003;</span>
                Speed control (0.5x &ndash; 2x)
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 text-green-600">&#10003;</span>
                Voice selection
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 text-green-600">&#10003;</span>
                Highlight-as-you-read progress
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 text-green-600">&#10003;</span>
                Keyboard shortcut (Alt+R)
              </li>
            </ul>
            <a
              href={CWS_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-8 block rounded-lg border border-zinc-300 py-2.5 text-center text-sm font-semibold text-zinc-900 hover:bg-zinc-50 transition-colors"
            >
              Add to Chrome
            </a>
          </div>
          {/* Pro tier */}
          <div className="rounded-xl border-2 border-zinc-900 p-8">
            <h3 className="text-lg font-semibold text-zinc-900">Pro</h3>
            <p className="mt-1 text-3xl font-bold text-zinc-900">
              $2<span className="text-base font-normal text-zinc-500">/mo</span>
            </p>
            <p className="text-sm text-zinc-500">cancel anytime</p>
            <ul className="mt-8 space-y-3 text-sm text-zinc-700">
              <li className="flex items-start gap-2">
                <span className="mt-0.5 text-green-600">&#10003;</span>
                Everything in Free
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 text-green-600">&#10003;</span>
                Custom keyboard shortcuts
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 text-green-600">&#10003;</span>
                Priority voice engine selection
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 text-green-600">&#10003;</span>
                Advanced reading controls
              </li>
            </ul>
            <a
              href={CWS_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-8 block rounded-lg bg-zinc-900 py-2.5 text-center text-sm font-semibold text-white hover:bg-zinc-700 transition-colors"
            >
              Get Pro
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

function PrivacySection() {
  return (
    <section className="bg-zinc-50 px-6 py-24">
      <div className="mx-auto max-w-3xl text-center">
        <h2 className="text-3xl font-bold tracking-tight text-zinc-900">
          Your Words Stay on Your Device
        </h2>
        <p className="mx-auto mt-6 max-w-xl text-zinc-600">
          TTS Reader uses your browser&apos;s built-in Web Speech API. No audio
          is generated on external servers. No text is sent anywhere. No
          tracking, no analytics, no account required. Everything happens
          locally in your browser.
        </p>
      </div>
    </section>
  );
}

function CtaSection() {
  return (
    <section className="px-6 py-24 text-center">
      <h2 className="text-3xl font-bold tracking-tight text-zinc-900">
        Start Listening Instead of Reading
      </h2>
      <p className="mx-auto mt-4 max-w-lg text-zinc-600">
        Join millions of users who prefer having the web read to them.
        Free, private, and works on every website.
      </p>
      <a
        href={CWS_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-8 inline-block rounded-lg bg-zinc-900 px-8 py-3 text-sm font-semibold text-white shadow hover:bg-zinc-700 transition-colors"
      >
        Add to Chrome &mdash; Free
      </a>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-zinc-200 px-6 py-8 text-center text-sm text-zinc-500">
      <p>
        Built by{" "}
        <a
          href="https://moltcorporation.com"
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-zinc-700 hover:text-zinc-900"
        >
          Moltcorp
        </a>
      </p>
    </footer>
  );
}

export default function Home() {
  return (
    <div className="min-h-screen bg-white font-sans">
      <HeroSection />
      <FeaturesSection />
      <PricingSection />
      <PrivacySection />
      <CtaSection />
      <Footer />
    </div>
  );
}
