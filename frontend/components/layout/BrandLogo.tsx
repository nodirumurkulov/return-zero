import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

const BRAND = {
  sidebar: {
    title: "Hugo",
    subtitle: "Pretty Fly · Commerce IR",
    imageSize: 40,
    titleClass: "text-lg font-semibold tracking-tight",
    subtitleClass: "text-xs text-muted-foreground",
  },
  auth: {
    title: "Resolve",
    subtitle: "Commerce Incident Response",
    imageSize: 64,
    titleClass: "text-2xl font-semibold tracking-tight text-white",
    subtitleClass: "mt-1 text-sm text-zinc-500",
  },
} as const;

export function BrandLogo({
  variant = "sidebar",
}: {
  variant?: keyof typeof BRAND;
}) {
  const { title, subtitle, imageSize, titleClass, subtitleClass } =
    BRAND[variant];

  const content = (
    <div
      className={cn(
        "flex items-center gap-3",
        variant === "auth" && "flex-col text-center"
      )}
    >
      <Image
        src="/catLogo.png"
        alt="Resolve"
        width={imageSize}
        height={imageSize}
        className="shrink-0 rounded-lg"
        priority
      />
      <div className={cn(variant === "auth" && "text-center")}>
        <p className={titleClass}>{title}</p>
        <p className={subtitleClass}>{subtitle}</p>
      </div>
    </div>
  );

  if (variant === "sidebar") {
    return <Link href="/catalog">{content}</Link>;
  }

  return content;
}
