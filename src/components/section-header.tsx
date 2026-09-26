import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export function SectionHeader({
  eyebrow,
  title,
  link,
  dark = false,
}: {
  eyebrow: string;
  title: string;
  link?: { href: string; label: string };
  dark?: boolean;
}) {
  return (
    <div className="mb-10 flex items-end justify-between gap-6">
      <div>
        <p className={`eyebrow ${dark ? "text-silver" : ""}`}>{eyebrow}</p>
        <h2
          className={`mt-3 text-2xl font-semibold tracking-tight sm:text-3xl ${
            dark ? "text-white" : "text-ink"
          }`}
        >
          {title}
        </h2>
      </div>
      {link && (
        <Link
          href={link.href}
          className={`mb-1 inline-flex shrink-0 items-center gap-1.5 text-sm transition-colors ${
            dark ? "text-silver hover:text-white" : "text-steel hover:text-ink"
          }`}
        >
          {link.label}
          <ArrowLeft size={15} strokeWidth={1.75} />
        </Link>
      )}
    </div>
  );
}
