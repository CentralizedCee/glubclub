import { copy } from "@/lib/copy";

export function TestnetBanner() {
  return (
    <div className="w-full bg-clay/15 border-b border-clay/30 px-4 py-2 text-center text-sm text-ink">
      {copy.testnetBanner}
    </div>
  );
}
