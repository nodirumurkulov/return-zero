import type { Metadata } from "next";
import Link from "next/link";
import { BLOG_POSTS } from "@/content/blog/posts";

export const metadata: Metadata = {
  title: "Blog — Hugo",
  description: "Notes on commerce incident response and ecommerce operations.",
};

export default function BlogIndexPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-28 sm:px-6">
      <h1 className="font-display text-4xl font-medium tracking-tight">Blog</h1>
      <p className="mt-4 text-muted-foreground">Updates from the Hugo team.</p>

      <ul className="mt-12 space-y-8">
        {BLOG_POSTS.map((post) => (
          <li key={post.slug} className="border-b border-border pb-8">
            <p className="font-mono text-xs text-muted-foreground tabnum">
              {new Intl.DateTimeFormat("en-GB", { dateStyle: "long" }).format(new Date(post.date))}
            </p>
            <h2 className="mt-2 text-2xl font-semibold">
              <Link href={`/blog/${post.slug}`} className="hover:text-primary">
                {post.title}
              </Link>
            </h2>
            <p className="mt-2 text-muted-foreground">{post.excerpt}</p>
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
