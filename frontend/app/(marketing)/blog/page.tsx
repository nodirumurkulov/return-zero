import type { Metadata } from "next";
import Link from "next/link";
import { SectionLabel } from "@/components/ui/section-label";
import { BLOG_POSTS } from "@/content/blog/posts";

export const metadata: Metadata = {
  title: "Blog — Hugo",
  description: "Notes on commerce incident response and ecommerce operations.",
};

export default function BlogIndexPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <SectionLabel>Blog</SectionLabel>
      <h1 className="mt-2 font-display text-3xl font-medium tracking-tight">Updates</h1>
      <p className="mt-3 text-sm text-muted-foreground">Notes from the Hugo team.</p>

      <ul className="mt-10 space-y-8">
        {BLOG_POSTS.map((post) => (
          <li key={post.slug} className="border-b border-border pb-8">
            <p className="font-mono text-xs text-muted-foreground tabnum">
              {new Intl.DateTimeFormat("en-GB", { dateStyle: "long" }).format(new Date(post.date))}
            </p>
            <h2 className="mt-2 text-lg font-semibold">
              <Link href={`/blog/${post.slug}`} className="hover:text-primary">
                {post.title}
              </Link>
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">{post.excerpt}</p>
            <Link
              href={`/blog/${post.slug}`}
              className="mt-3 inline-block text-sm font-medium text-primary hover:underline"
            >
              Read more
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
