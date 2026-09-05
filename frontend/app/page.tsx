import Link from "next/link";
import { copy } from "@/lib/copy";

export default function HomePage() {
  return (
    <section className="px-6 py-20 max-w-2xl mx-auto text-center">
      <h1 className="font-display text-4xl sm:text-5xl text-ink mb-4">
        {copy.home.heading}
      </h1>
      <p className="text-ink/70 mb-8">{copy.home.body}</p>
      <div className="flex items-center justify-center gap-4">
        <Link
          href="/mint"
          className="rounded-full bg-ink px-5 py-3 text-paper font-medium hover:bg-moss transition-colors"
        >
          Go to mint
        </Link>
        <Link
          href="/presale"
          className="rounded-full border border-line px-5 py-3 text-ink font-medium hover:border-moss hover:text-moss transition-colors"
        >
          Token access
        </Link>
      </div>
    </section>
  );
}
