import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SectionLabel } from "@/components/ui/section-label";
import { BLOG_POSTS, getPost } from "@/content/blog/posts";

export function generateStaticParams() {
  return BLOG_POSTS.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) {
    return { title: "Post not found — Hugo" };
  }
  return {
    title: `${post.title} — Hugo`,
    description: post.excerpt,
  };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) {
    notFound();
  }

  return (
    <article className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <Link href="/blog" className="text-sm text-primary hover:underline">
        ← Blog
      </Link>
      <SectionLabel className="mt-6">Post</SectionLabel>
      <p className="mt-2 font-mono text-xs text-muted-foreground tabnum">
        {new Intl.DateTimeFormat("en-GB", { dateStyle: "long" }).format(new Date(post.date))}
      </p>
      <h1 className="mt-2 font-display text-3xl font-medium tracking-tight sm:text-4xl">
        {post.title}
      </h1>
      <div className="mt-8 space-y-4 text-sm leading-relaxed text-muted-foreground">
        {post.body.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
      </div>
    </article>
  );
}
