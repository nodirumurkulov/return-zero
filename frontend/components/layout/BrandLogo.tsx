import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

export function HugoMark({
  size = 28,
  className,
  priority = false,
}: {
  size?: number;
  className?: string;
  priority?: boolean;
}) {
  return (
    <Image
      src="/catLogo.png"
      alt="Hugo"
      width={size}
      height={size}
      priority={priority}
      className={cn("shrink-0 rounded-lg shadow-card", className)}
    />
  );
}

const BRAND = {
  sidebar: {
    title: "Hugo",
    imageSize: 28,
    titleClass: "text-[15px] font-semibold leading-tight tracking-tight",
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
  const brand = BRAND[variant];
  const Title = brand.titleTag;

  const content = (
    <div
      className={cn(
        "flex items-center",
        variant === "sidebar"
          ? "gap-2.5 group-data-[collapsible=icon]:w-full group-data-[collapsible=icon]:justify-center"
          : "flex-col gap-4 text-center",
      )}
    >
      <HugoMark
        size={brand.imageSize}
        priority
        className={
          variant === "sidebar"
            ? "group-data-[collapsible=icon]:size-7 group-data-[collapsible=icon]:h-7 group-data-[collapsible=icon]:w-7"
            : undefined
        }
      />
      <div
        className={cn(
          "min-w-0",
          variant === "auth" && "text-center",
          variant === "sidebar" && "group-data-[collapsible=icon]:hidden",
        )}
      >
        <Title className={brand.titleClass}>{brand.title}</Title>
        {variant === "auth" ? (
          <p className={brand.subtitleClass}>{brand.subtitle}</p>
        ) : null}
      </div>
    </div>
  );

  if (variant === "sidebar") {
    return (
      <Link
        href="/catalog"
        className="block rounded-md outline-hidden transition-colors group-data-[collapsible=icon]:mx-auto focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        {content}
      </Link>
    );
  }

  return content;
}
