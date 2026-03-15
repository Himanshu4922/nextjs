# Next.js Metadata API — Deep Dive Notes

## Table of Contents

1. [Introduction](#introduction)
2. [Two Ways to Define Metadata](#two-ways-to-define-metadata)
3. [Static Metadata](#static-metadata)
4. [Dynamic Metadata with `generateMetadata`](#dynamic-metadata-with-generatemetadata)
5. [The Metadata Object — All Fields](#the-metadata-object--all-fields)
   - [Basic Fields](#basic-fields)
   - [Open Graph](#open-graph)
   - [Twitter Cards](#twitter-cards)
   - [Icons](#icons)
   - [Robots](#robots)
   - [Canonical URL & Alternates](#canonical-url--alternates)
   - [Verification](#verification)
   - [App Links](#app-links)
   - [Archives, Assets, Bookmarks](#archives-assets-bookmarks)
   - [Category & Classification](#category--classification)
   - [Other Meta Tags](#other-meta-tags)
6. [Title Templates & Inheritance](#title-templates--inheritance)
7. [Metadata Merging & Inheritance Rules](#metadata-merging--inheritance-rules)
8. [File-Based Metadata](#file-based-metadata)
9. [Viewport, ThemeColor, ColorScheme (Special Fields)](#viewport-themecolor-colorscheme-special-fields)
10. [generateMetadata — Advanced Patterns](#generatemetadata--advanced-patterns)
11. [Metadata in Server vs Client Components](#metadata-in-server-vs-client-components)
12. [Streaming & Metadata Timing](#streaming--metadata-timing)
13. [Absolute vs Relative URLs in Metadata](#absolute-vs-relative-urls-in-metadata)
14. [metadataBase](#metadatabase)
15. [Structured Data (JSON-LD)](#structured-data-json-ld)
16. [Caching Metadata Fetches](#caching-metadata-fetches)
17. [Common Patterns & Recipes](#common-patterns--recipes)
18. [Gotchas & Edge Cases](#gotchas--edge-cases)
19. [TypeScript Types Reference](#typescript-types-reference)

---

## Introduction

Next.js 13+ (App Router) introduced a **first-class Metadata API** that replaces the old pattern of manually adding `<Head>` tags via `next/head`. The goal is to:

- Generate `<head>` tags automatically and correctly.
- Support SEO, social sharing, PWA, and app-link metadata declaratively.
- Enable per-route, dynamic, and inherited metadata with minimal boilerplate.
- Avoid hydration mismatches (metadata is rendered only on the server).

Metadata only works in **Server Components** inside the `app/` directory.

---

## Two Ways to Define Metadata

### 1. Static Export

Export a `metadata` object directly from `page.tsx` or `layout.tsx`.

```ts
// app/about/page.tsx
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About Us',
  description: 'Learn about our team and mission.',
};
```

### 2. Dynamic Function

Export an async `generateMetadata` function when you need to fetch data or use route params.

```ts
// app/blog/[slug]/page.tsx
import type { Metadata, ResolvingMetadata } from 'next';

type Props = {
  params: { slug: string };
  searchParams: { [key: string]: string | string[] | undefined };
};

export async function generateMetadata(
  { params, searchParams }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const post = await fetchPost(params.slug);

  // Access and extend parent metadata
  const previousImages = (await parent).openGraph?.images || [];

  return {
    title: post.title,
    openGraph: {
      images: [post.coverImage, ...previousImages],
    },
  };
}
```

---

## Static Metadata

Simple key-value export. Next.js deep-merges it with parent layouts automatically.

```ts
export const metadata: Metadata = {
  title: 'Home',
  description: 'Welcome to our site.',
  keywords: ['nextjs', 'react', 'web'],
  authors: [{ name: 'Jane Doe', url: 'https://janedoe.com' }],
  creator: 'Jane Doe',
  publisher: 'Acme Corp',
};
```

---

## Dynamic Metadata with `generateMetadata`

```ts
export async function generateMetadata(
  { params }: { params: { id: string } },
  parent: ResolvingMetadata
): Promise<Metadata> {
  const product = await getProduct(params.id);

  return {
    title: product.name,
    description: product.description,
    openGraph: {
      title: product.name,
      description: product.description,
      images: [{ url: product.imageUrl }],
    },
  };
}
```

**Key points:**
- `parent` is a `Promise<ResolvedMetadata>` — must be awaited to access.
- `generateMetadata` runs **server-side only**.
- It can coexist with `generateStaticParams` for static site generation.
- Fetch calls inside `generateMetadata` are **automatically deduplicated** with fetches in the page component if the same URL/options are used.

---

## The Metadata Object — All Fields

### Basic Fields

```ts
export const metadata: Metadata = {
  title: 'Page Title',
  description: 'Page description.',
  keywords: ['keyword1', 'keyword2'],
  authors: [{ name: 'Alice', url: 'https://alice.dev' }],
  creator: 'Alice',       // <meta name="author">
  publisher: 'Acme Inc',
  generator: 'Next.js',   // <meta name="generator">
  applicationName: 'My App',
  referrer: 'origin-when-cross-origin',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
};
```

`formatDetection` prevents iOS from auto-linking phone numbers, addresses, and emails.

---

### Open Graph

```ts
openGraph: {
  title: 'Open Graph Title',
  description: 'Open Graph description.',
  url: 'https://example.com/page',
  siteName: 'My Site',
  images: [
    {
      url: 'https://example.com/og-image.png',
      width: 1200,
      height: 630,
      alt: 'Description of image',
    },
    // Multiple images allowed
    { url: 'https://example.com/og-image-small.png', width: 800, height: 600 },
  ],
  locale: 'en_US',
  type: 'website', // 'article' | 'book' | 'profile' | 'music.song' | ...
},
```

**For articles specifically:**
```ts
openGraph: {
  type: 'article',
  publishedTime: '2024-01-01T00:00:00.000Z',
  modifiedTime: '2024-06-01T00:00:00.000Z',
  expirationTime: '2025-01-01T00:00:00.000Z',
  authors: ['https://example.com/authors/jane'],
  section: 'Technology',
  tags: ['nextjs', 'metadata'],
},
```

---

### Twitter Cards

```ts
twitter: {
  card: 'summary_large_image', // 'summary' | 'summary_large_image' | 'app' | 'player'
  site: '@yourtwitterhandle',
  creator: '@authorhandle',
  title: 'Twitter Card Title',
  description: 'Twitter card description.',
  images: ['https://example.com/twitter-image.png'],
},
```

**App Card:**
```ts
twitter: {
  card: 'app',
  app: {
    name: {
      iphone: 'My App',
      ipad: 'My App',
      googleplay: 'My App',
    },
    id: {
      iphone: '123456789',
      ipad: '123456789',
      googleplay: 'com.example.app',
    },
    url: {
      iphone: 'https://example.com/download/ios',
      ipad: 'https://example.com/download/ios',
    },
  },
},
```

---

### Icons

```ts
icons: {
  icon: '/favicon.ico',                          // simplest form
  shortcut: '/shortcut-icon.png',
  apple: '/apple-touch-icon.png',
  other: [
    {
      rel: 'apple-touch-icon-precomposed',
      url: '/apple-touch-icon-precomposed.png',
    },
  ],
},
```

**With sizes:**
```ts
icons: {
  icon: [
    { url: '/icon-16.png', sizes: '16x16', type: 'image/png' },
    { url: '/icon-32.png', sizes: '32x32', type: 'image/png' },
    { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
  ],
  apple: [
    { url: '/apple-180.png', sizes: '180x180', type: 'image/png' },
  ],
},
```

---

### Robots

```ts
robots: {
  index: true,
  follow: true,
  nocache: false,
  googleBot: {
    index: true,
    follow: true,
    noimageindex: false,
    'max-video-preview': -1,
    'max-image-preview': 'large',
    'max-snippet': -1,
  },
},
```

This generates:
```html
<meta name="robots" content="index, follow" />
<meta name="googlebot" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
```

To **block** a page:
```ts
robots: {
  index: false,
  follow: false,
},
```

---

### Canonical URL & Alternates

```ts
alternates: {
  canonical: 'https://example.com/page',
  languages: {
    'en-US': 'https://example.com/en-US/page',
    'de-DE': 'https://example.com/de-DE/page',
    'x-default': 'https://example.com/page',
  },
  media: {
    'only screen and (max-width: 600px)': 'https://m.example.com/page',
  },
  types: {
    'application/rss+xml': 'https://example.com/rss',
  },
},
```

---

### Verification

```ts
verification: {
  google: 'your-google-site-verification-token',
  yandex: 'your-yandex-token',
  yahoo: 'your-yahoo-token',
  other: {
    me: ['my@email.com', 'https://mywebsite.com'],
  },
},
```

---

### App Links

Deep-link metadata for Facebook App Links protocol:

```ts
appLinks: {
  ios: {
    url: 'https://example.com/ios',
    app_store_id: '123456789',
  },
  android: {
    package: 'com.example.android',
    app_name: 'My App',
  },
  web: {
    url: 'https://example.com/web',
    should_fallback: true,
  },
},
```

---

### Archives, Assets, Bookmarks

```ts
archives: ['https://example.com/archive/2023'],
assets: ['https://example.com/assets/main.css'],
bookmarks: ['https://example.com/profile'],
```

---

### Category & Classification

```ts
category: 'technology',
classification: 'Business',
```

---

### Other Meta Tags

```ts
other: {
  'msapplication-TileColor': '#da532c',
  'msapplication-config': '/browserconfig.xml',
  'theme-color': '#ffffff',
  'custom-meta': 'custom-value',
},
```

---

## Title Templates & Inheritance

The `title` field can be a **string** or an **object**:

```ts
// Root layout — app/layout.tsx
export const metadata: Metadata = {
  title: {
    default: 'My App',        // Used when a page doesn't set a title
    template: '%s | My App',  // %s is replaced by child page titles
    absolute: 'Override',     // Ignores parent template entirely
  },
};
```

```ts
// app/about/page.tsx
export const metadata: Metadata = {
  title: 'About',
  // Rendered as: "About | My App"
};
```

```ts
// app/special/page.tsx
export const metadata: Metadata = {
  title: {
    absolute: 'Special Page', // Rendered as: "Special Page" (no template)
  },
};
```

**Template inheritance chain:**

```
app/layout.tsx       → template: '%s | My App'
  app/blog/layout.tsx  → template: '%s | Blog'
    app/blog/[slug]/page.tsx → title: 'Post Title'
    // Result: "Post Title | Blog"
```

Child templates **override** parent templates — the nearest template wins.

---

## Metadata Merging & Inheritance Rules

- Next.js **shallow-merges** metadata from parent layouts → current page.
- Arrays are **replaced**, not concatenated (e.g., `openGraph.images`).
- Nested objects (like `openGraph`, `twitter`) are **replaced entirely**, not deep-merged.
- To extend parent OG images, manually await the parent and spread:

```ts
export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const parentImages = (await parent).openGraph?.images || [];

  return {
    openGraph: {
      images: ['/new-image.png', ...parentImages],
    },
  };
}
```

---

## File-Based Metadata

Place special files in `app/` or route segments — Next.js handles them automatically.

| File | Output |
|------|--------|
| `favicon.ico` | `<link rel="icon">` |
| `icon.png` / `icon.svg` / `icon.ico` | `<link rel="icon">` |
| `apple-icon.png` | `<link rel="apple-touch-icon">` |
| `opengraph-image.png` | `<meta property="og:image">` |
| `twitter-image.png` | `<meta name="twitter:image">` |
| `robots.txt` | Robots instructions |
| `sitemap.xml` | Sitemap |

**Dynamic file-based metadata** — generate images programmatically:

```ts
// app/opengraph-image.tsx
import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'About Acme';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 128,
          background: 'white',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        About Acme
      </div>
    ),
    { ...size }
  );
}
```

For **route-level** dynamic OG images:

```ts
// app/blog/[slug]/opengraph-image.tsx
export default async function Image({ params }: { params: { slug: string } }) {
  const post = await fetchPost(params.slug);
  return new ImageResponse(<div>{post.title}</div>);
}
```

---

## Viewport, ThemeColor, ColorScheme (Special Fields)

These fields were moved out of `metadata` in Next.js 14+. Use `generateViewport` or the `viewport` export instead:

```ts
// app/layout.tsx
import type { Viewport } from 'next';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#000000' },
  ],
  colorScheme: 'dark light',
};
```

For dynamic viewport:
```ts
export async function generateViewport({ params }: Props): Promise<Viewport> {
  return {
    themeColor: await getThemeColor(params.id),
  };
}
```

> **Note:** Putting `themeColor` or `viewport` inside the `metadata` export still works in Next.js 13 but is deprecated in Next.js 14+.

---

## generateMetadata — Advanced Patterns

### Parallel Data Fetching

```ts
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const [product, category] = await Promise.all([
    fetchProduct(params.id),
    fetchCategory(params.categoryId),
  ]);

  return {
    title: `${product.name} — ${category.name}`,
    description: product.description,
  };
}
```

### With Search Params

```ts
export async function generateMetadata({
  searchParams,
}: {
  searchParams: { q?: string };
}): Promise<Metadata> {
  const query = searchParams.q ?? '';

  return {
    title: query ? `Results for "${query}"` : 'Search',
    robots: query ? { index: false } : { index: true },
  };
}
```

### Conditional Metadata

```ts
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const post = await fetchPost(params.slug);

  if (!post) {
    return {
      title: 'Not Found',
      robots: { index: false },
    };
  }

  return {
    title: post.title,
    description: post.excerpt,
  };
}
```

### Extending & Overriding Parent Metadata

```ts
export async function generateMetadata(
  _: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const parentMeta = await parent;

  return {
    ...parentMeta,    // spread is NOT recommended for complex types; use selectively
    title: 'Override Title',
    openGraph: {
      ...parentMeta.openGraph,
      title: 'OG Override Title',
    },
  };
}
```

---

## Metadata in Server vs Client Components

| Context | Can export `metadata`? |
|---------|------------------------|
| `page.tsx` (Server Component) | ✅ Yes |
| `layout.tsx` (Server Component) | ✅ Yes |
| `page.tsx` (Client Component `'use client'`) | ❌ No |
| `layout.tsx` (Client Component) | ❌ No |
| `template.tsx` | ❌ No |
| `error.tsx` | ❌ No |
| `loading.tsx` | ❌ No |

**Workaround for Client-rendered pages:**

Create a wrapper server component that exports metadata, then import your client component into it.

```ts
// app/dashboard/page.tsx  ← Server Component, exports metadata
import DashboardClient from './DashboardClient';

export const metadata: Metadata = { title: 'Dashboard' };

export default function Page() {
  return <DashboardClient />;
}
```

---

## Streaming & Metadata Timing

Next.js ensures metadata is **resolved before the response is streamed** to the client. This means:

- Even if your page component uses `<Suspense>`, metadata is not delayed by it.
- `generateMetadata` is awaited before streaming starts.
- Metadata is included in the initial HTML shell (important for crawlers and social bots).

If `generateMetadata` is slow (e.g., DB query), it delays the **Time to First Byte (TTFB)**. Optimize with:

1. **Caching** fetch calls (`fetch(url, { next: { revalidate: 3600 } })`).
2. **Deduplication** — Next.js deduplicates identical `fetch` calls across metadata and page.
3. **`unstable_cache`** for non-fetch data sources (ORM queries, etc.).

---

## Absolute vs Relative URLs in Metadata

By default, relative URLs in metadata fields are **not automatically resolved** to absolute URLs — which can break OG images, canonical URLs, etc.

Always use absolute URLs OR set `metadataBase`.

```ts
// BAD — relative URL won't work in og:image
openGraph: { images: ['/og.png'] }

// GOOD — absolute URL
openGraph: { images: ['https://example.com/og.png'] }

// BEST — use metadataBase + relative URL
```

---

## metadataBase

Set a base URL to resolve relative metadata URLs automatically.

```ts
// app/layout.tsx
export const metadata: Metadata = {
  metadataBase: new URL('https://example.com'),

  // These relative paths get resolved to https://example.com/...
  openGraph: {
    images: ['/og-image.png'],    // → https://example.com/og-image.png
  },
  alternates: {
    canonical: '/about',           // → https://example.com/about
  },
};
```

**Dynamic `metadataBase` based on environment:**

```ts
export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'
  ),
};
```

> Next.js will log a warning during build if `metadataBase` is not set and relative URLs are found in metadata.

---

## Structured Data (JSON-LD)

Not part of the Metadata API, but commonly needed. Inject `<script>` tags manually inside your component:

```tsx
// app/blog/[slug]/page.tsx
export default async function Page({ params }: Props) {
  const post = await fetchPost(params.slug);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    datePublished: post.publishedAt,
    dateModified: post.updatedAt,
    author: [{ '@type': 'Person', name: post.author.name }],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <article>{/* ... */}</article>
    </>
  );
}
```

---

## Caching Metadata Fetches

### Using `fetch` with caching

```ts
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const product = await fetch(`https://api.example.com/products/${params.id}`, {
    next: { revalidate: 3600 }, // Cache for 1 hour (ISR)
    // or: cache: 'force-cache'  (static, never revalidate)
    // or: cache: 'no-store'     (always fresh)
  }).then((r) => r.json());

  return { title: product.name };
}
```

### Using `unstable_cache` for ORM/DB queries

```ts
import { unstable_cache } from 'next/cache';

const getCachedProduct = unstable_cache(
  async (id: string) => db.product.findUnique({ where: { id } }),
  ['product'],
  { revalidate: 3600, tags: ['products'] }
);

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const product = await getCachedProduct(params.id);
  return { title: product?.name ?? 'Product' };
}
```

---

## Common Patterns & Recipes

### Global SEO Defaults in Root Layout

```ts
// app/layout.tsx
export const metadata: Metadata = {
  metadataBase: new URL('https://mysite.com'),
  title: {
    default: 'My Site',
    template: '%s — My Site',
  },
  description: 'Default site description.',
  openGraph: {
    type: 'website',
    siteName: 'My Site',
    images: [{ url: '/default-og.png', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@myhandle',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large' },
  },
};
```

### Blocking Entire Sections from Indexing

```ts
// app/admin/layout.tsx
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};
```

### Localized Metadata

```ts
// app/[lang]/layout.tsx
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const dict = await getDictionary(params.lang);

  return {
    title: { default: dict.siteName, template: `%s | ${dict.siteName}` },
    description: dict.siteDescription,
    alternates: {
      canonical: `https://example.com/${params.lang}`,
      languages: {
        'en': 'https://example.com/en',
        'fr': 'https://example.com/fr',
        'x-default': 'https://example.com/en',
      },
    },
  };
}
```

### eCommerce Product Metadata

```ts
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const product = await fetchProduct(params.slug);

  return {
    title: product.name,
    description: product.seoDescription ?? product.description.slice(0, 155),
    openGraph: {
      type: 'website',
      title: product.name,
      description: product.description,
      images: product.images.map((img) => ({
        url: img.url,
        width: img.width,
        height: img.height,
        alt: img.altText,
      })),
    },
    alternates: {
      canonical: `/products/${product.slug}`,
    },
  };
}
```

---

## Gotchas & Edge Cases

### 1. `metadata` export is ignored in Client Components

If you add `'use client'` to a `page.tsx` or `layout.tsx`, the `metadata` export is silently ignored. No error is thrown. Move metadata to a server wrapper.

### 2. Nested object fields are NOT deep-merged

```ts
// layout.tsx
export const metadata: Metadata = {
  openGraph: { siteName: 'My Site', images: ['/default-og.png'] },
};

// page.tsx
export const metadata: Metadata = {
  openGraph: { title: 'Page Title' },
  // ❗ siteName and images from parent are LOST
};
```

Fix: use `generateMetadata` and extend parent explicitly.

### 3. `template` only applies to direct children

A template set in `app/layout.tsx` applies to all descendants unless a closer layout defines its own template.

### 4. `absolute` title bypasses all templates

```ts
export const metadata: Metadata = {
  title: { absolute: 'Standalone Title' },
  // No template applied, ever
};
```

### 5. `metadataBase` is required for correct OG/Twitter images in production

Without it, relative image paths produce broken `<meta>` tags. Always set it in root layout.

### 6. `generateMetadata` and page component share fetch cache

If `generateMetadata` and `Page` both call `fetch('https://api.example.com/post/1')`, Next.js deduplicates it — only **one** actual HTTP request is made. This only works with native `fetch`, not axios or other libraries.

### 7. `searchParams` type in `generateMetadata`

In Next.js 15+, `searchParams` is a **Promise** and must be awaited:

```ts
// Next.js 15+
export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}): Promise<Metadata> {
  const { q } = await searchParams;
  return { title: q ? `Results: ${q}` : 'Search' };
}
```

### 8. Metadata is not available in `error.tsx` or `loading.tsx`

These special files cannot export metadata. Use a wrapping layout if needed.

---

## TypeScript Types Reference

```ts
import type {
  Metadata,
  ResolvedMetadata,
  ResolvingMetadata,
  Viewport,
  ResolvingViewport,
} from 'next';

// Full signature of generateMetadata
export async function generateMetadata(
  props: {
    params: Record<string, string | string[]>;
    searchParams: Record<string, string | string[] | undefined>;
  },
  parent: ResolvingMetadata
): Promise<Metadata> { ... }

// Full signature of generateViewport
export async function generateViewport(
  props: {
    params: Record<string, string | string[]>;
  },
  parent: ResolvingViewport
): Promise<Viewport> { ... }
```

**Useful sub-types:**

```ts
import type {
  OpenGraph,
  Twitter,
  Icons,
  Robots,
  Alternates,
} from 'next/dist/lib/metadata/types/metadata-types';
```

---

## Summary

| Feature | API |
|---|---|
| Static metadata | `export const metadata: Metadata = {...}` |
| Dynamic metadata | `export async function generateMetadata(...)` |
| Title inheritance | `title: { template: '%s \| Site', default: 'Site' }` |
| Bypass template | `title: { absolute: 'Title' }` |
| Resolve relative URLs | `metadataBase: new URL('https://...')` |
| OG / Twitter | `openGraph: {...}`, `twitter: {...}` |
| Viewport / Theme Color | `export const viewport: Viewport = {...}` |
| Dynamic OG image | `opengraph-image.tsx` using `ImageResponse` |
| JSON-LD | Manual `<script type="application/ld+json">` in component |
| Cache metadata fetches | `fetch(..., { next: { revalidate } })` or `unstable_cache` |

---

*These notes target Next.js 13 App Router and above (including Next.js 14 and 15). Always check the [official Next.js Metadata docs](https://nextjs.org/docs/app/building-your-application/optimizing/metadata) for the latest updates.*