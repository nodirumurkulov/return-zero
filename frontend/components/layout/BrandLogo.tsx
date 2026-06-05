import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

const BRAND = {
  sidebar: {
    title: "Hugo",
    subtitle: "Commerce IR",
    imageSize: 28,
    titleClass: "text-[15px] font-semibold leading-tight tracking-tight",
    subtitleClass: "text-[11px] text-muted-foreground",
    titleTag: "p" as const,
  },
  auth: {
    title: "Hugo",
    subtitle: "Commerce Incident Response",
    imageSize: 64,
    titleClass: "text-2xl font-semibold tracking-tight text-foreground",
    subtitleClass: "mt-1 text-sm text-muted-foreground",
    titleTag: "h1" as const,
  },
} as const;

export function BrandLogo({
  variant = "sidebar",
}: {
  variant?: keyof typeof BRAND;
}) {
  const { title, subtitle, imageSize, titleClass, subtitleClass, titleTag } =
    BRAND[variant];
  const Title = titleTag;

  const content = (
    <div
      className={cn(
        "flex items-center",
        variant === "sidebar" ? "gap-2.5" : "flex-col gap-4 text-center",
      )}
    >
      <Image
        src="/catLogo.png"
        alt="Hugo"
        width={imageSize}
        height={imageSize}
        className="shrink-0 rounded-lg shadow-card"
        priority
      />
      <div className={cn("min-w-0", variant === "auth" && "text-center")}>
        <Title className={titleClass}>{title}</Title>
        <p className={subtitleClass}>{subtitle}</p>
      </div>
    </div>
  );

  if (variant === "sidebar") {
    return (
      <Link
        href="/catalog"
        className="block rounded-md outline-hidden transition-colors focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        {content}
      </Link>
    );
  }

  return content;
}
