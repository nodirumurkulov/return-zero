export type BlogPost = {
  slug: string;
  title: string;
  date: string;
  excerpt: string;
  body: string[];
};

export const BLOG_POSTS: BlogPost[] = [
  {
    slug: "why-ecommerce-needs-incident-response",
    title: "Why Ecommerce Needs Incident Response",
    date: "2026-06-03",
    excerpt:
      "Conversion drops and return spikes show up in the P&L before they show up in your weekly review. Commerce needs an incident loop, not another dashboard.",
    body: [
      "Engineering teams have spent a decade building incident response: detect, page, investigate, fix, verify recovery. Ecommerce operators still stitch together spreadsheets, Shopify reports, ad dashboards, and Slack threads when a KPI moves.",
      "The cost shows up in margin. A sizing-driven return spike on a hero SKU is not a merchandising ticket — it is a P&L event. Cold Meta traffic can amplify misfit buys. Stockouts on downstream sizes follow returns back into the warehouse loop.",
      "Hugo treats commerce KPIs like production incidents: deterministic detection, parallel AI investigation, human approval, and recovery monitoring until the metric closes. That is how you act before the quarter closes — not after.",
      "We are opening early access through the waitlist. If you run unit economics for a catalog, you already know why this matters.",
    ],
  },
];

export function getPost(slug: string): BlogPost | undefined {
  return BLOG_POSTS.find((post) => post.slug === slug);
}
