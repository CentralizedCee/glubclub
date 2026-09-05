import Link from "next/link";
import { ConnectButton } from "./ConnectButton";
import { copy } from "@/lib/copy";

const navItems = [
  { href: "/mint", label: "Mint" },
  { href: "/presale", label: "Token" },
  { href: "/dashboard", label: "Reserves" },
];

export function Header() {
  return (
    <header className="flex items-center justify-between px-6 py-5 border-b border-line">
      <Link href="/" className="font-display text-xl text-ink">
        {copy.siteName}
      </Link>
      <nav className="hidden sm:flex items-center gap-6 text-sm text-ink/80">
        {navItems.map((item) => (
          <Link key={item.href} href={item.href} className="hover:text-ink">
            {item.label}
          </Link>
        ))}
      </nav>
      <ConnectButton />
    </header>
  );
}
