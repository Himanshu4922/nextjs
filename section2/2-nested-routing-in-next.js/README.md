# Next.js Routing — Notes

---

## 1. How Routing Works in Next.js (App Router)

Next.js uses a **file-system based router**. This means the folder and file structure inside the `app/` directory directly maps to URL routes in your application. You don't need to configure a router manually like you do in React with `react-router-dom`.

```
app/
├── layout.js       → Root layout (wraps all pages)
├── page.js         → Home route "/"
├── about/
│   └── page.js     → "/about"
└── dashboard/
    ├── layout.js   → Nested layout for dashboard
    └── page.js     → "/dashboard"
```

---

## 2. `layout.js` — The Root Layout

### What it is
`layout.js` is a **required file** in the `app/` directory. It acts as the **shell of your application** — similar in purpose to `index.html` in a traditional React (CRA) setup.

### Why it's required
- It defines the `<html>` and `<body>` tags for your entire app.
- Every page rendered by Next.js is wrapped inside the root `layout.js`.
- Without it, Next.js has no base HTML structure to render into.

### Comparison with `index.html` in React (CRA)

| React (CRA)         | Next.js (App Router)       |
|---------------------|----------------------------|
| `public/index.html` | `app/layout.js`            |
| Static HTML shell   | Dynamic React component    |
| Cannot use JSX      | Full JSX + server component support |

### Basic `layout.js` example

```jsx
// app/layout.js
export const metadata = {
  title: 'My App',
  description: 'Built with Next.js',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
```

> `children` here represents whichever `page.js` is currently being visited.

---

## 3. Custom / Nested `layout.js`

You can create **segment-specific layouts** by adding a `layout.js` inside any route folder. This layout will only wrap pages within that folder, while still being nested inside the root layout.

### Example

```
app/
├── layout.js           → Root layout (wraps everything)
└── dashboard/
    ├── layout.js       → Dashboard-specific layout
    └── page.js         → "/dashboard"
```

```jsx
// app/dashboard/layout.js
export default function DashboardLayout({ children }) {
  return (
    <section>
      <nav>Dashboard Sidebar</nav>
      <main>{children}</main>
    </section>
  );
}
```

### Key behaviours
- Nested layouts **persist across route changes** within their segment — they don't remount when you navigate between child pages. This is great for things like sidebars or tab bars.
- You can nest layouts as deeply as you need.
- The root `layout.js` always renders at the top of the tree.

---

## 4. `page.js` — The Home Route

`page.js` inside the `app/` directory is automatically mapped to the **root route `/`** of your application.

```jsx
// app/page.js
export default function HomePage() {
  return <h1>Welcome to the Home Page</h1>;
}
```

- Every route segment needs its own `page.js` to be publicly accessible.
- A folder without a `page.js` is **not** a route — it can be used for components, utilities, etc. without being exposed as a URL.

---

## 5. `Link` from `next/link` — Client-Side Navigation

### Usage

```jsx
import Link from 'next/link';

export default function Navbar() {
  return (
    <nav>
      <Link href="/">Home</Link>
      <Link href="/about">About</Link>
      <Link href="/dashboard">Dashboard</Link>
    </nav>
  );
}
```

---

## 6. Why `<Link>` instead of `<a>`?

This is one of the most important distinctions when moving from plain HTML or React to Next.js.

### The problem with `<a>` tags

```html
<!-- Don't do this for internal navigation -->
<a href="/about">About</a>
```

When you use a raw `<a>` tag:
- The browser does a **full page reload** — the entire HTML document is re-fetched from the server.
- All JavaScript is re-parsed and re-executed.
- All React state is lost.
- It is **slow** — you lose all the benefits of a Single Page Application (SPA).

### What `<Link>` does differently

| Feature | `<a>` tag | `<Link>` from Next.js |
|---|---|---|
| Navigation type | Full page reload | Client-side (SPA-style) |
| State preserved | ❌ Lost on navigation | ✅ Preserved |
| Speed | Slow (full reload) | Fast (only fetches new data) |
| Prefetching | ❌ None | ✅ Automatic in viewport |
| JS re-execution | ✅ Every time | ❌ Only what's needed |

### Prefetching
Next.js `<Link>` **automatically prefetches** the linked page's data when the link enters the viewport (in production). This means by the time the user clicks the link, the page is already loaded , resulting in near-instant navigation.

### `next/link` vs `react-router-dom` Link

Both provide client-side navigation without a full page reload, but they differ significantly under the hood.

| Feature | `react-router-dom` `<Link>` | `next/link` `<Link>` |
|---|---|---|
| Setup required | Must wrap app in `<BrowserRouter>` | Works out of the box, no provider needed |
| Prefetching | ❌ No automatic prefetching | ✅ Automatically prefetches in viewport (production) |
| Rendering | Client-side only | Supports Server Components |
| `href` prop | Uses `to` prop | Uses `href` prop |
| Navigation type | Client-side SPA | Client-side + server-aware |
| Scroll behaviour | Manual control | ✅ Automatically scrolls to top on navigation |
| Active link styling | Via `<NavLink>` component | Manual — check `usePathname()` hook |
| Data fetching on nav | Not built-in | Triggers server component re-fetch automatically |

### Syntax difference

```jsx
// react-router-dom
import { Link } from 'react-router-dom';
<Link to="/about">About</Link>

// next/link
import Link from 'next/link';
<Link href="/about">About</Link>
```

The key difference is `to` vs `href`. This trips up most developers coming from React + React Router.

### Prefetching difference (important)

`react-router-dom` has **zero prefetching** — it only loads the next page when the user actually clicks.

`next/link` **prefetches the linked page in the background** as soon as the link enters the viewport. By the time the user clicks, the page is already ready. You can opt out with:

```jsx
<Link href="/about" prefetch={false}>About</Link>
```

### Active link styling

In React Router you'd use `<NavLink>` which automatically applies an active class. In Next.js you do it manually:

```jsx
// next/link — manual active styling
'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Navbar() {
  const pathname = usePathname();

  return (
    <nav>
      <Link
        href="/about"
        className={pathname === '/about' ? 'text-white' : 'text-gray-400'}
      >
        About
      </Link>
    </nav>
  );
}
```

---

### When to still use `<a>`
- Navigating to **external URLs** (outside your app):
```jsx
<a href="https://google.com" target="_blank" rel="noopener noreferrer">
  Visit Google
</a>
```
- Linking to files for download (PDFs, etc.)

---

---

## 7. Nested Routing

Since Next.js routing is file-system based, **nested routes are just nested folders**.

### Basic Nested Route

```
app/
├── page.js               → "/"
└── blog/
    ├── page.js           → "/blog"
    └── first-post/
        └── page.js       → "/blog/first-post"
```

Each folder level = one URL segment. There's no router config needed — just create the folder and add a `page.js`.

---

### Dynamic Segments — `[folder]`

When you don't know the route segment in advance (like a post ID or username), use **square brackets** to create a dynamic segment.

```
app/
└── blog/
    ├── page.js           → "/blog"
    └── [slug]/
        └── page.js       → "/blog/anything"
```

```jsx
// app/blog/[slug]/page.js
export default function BlogPost({ params }) {
  return <h1>Post: {params.slug}</h1>;
}
```

Visiting `/blog/hello-world` → `params.slug` = `"hello-world"`  
Visiting `/blog/my-post` → `params.slug` = `"my-post"`

---

### Catch-all Segments — `[...folder]`

Catches **one or more** segments into an array.

```
app/
└── docs/
    └── [...slug]/
        └── page.js       → "/docs/a", "/docs/a/b", "/docs/a/b/c"
```

```jsx
// app/docs/[...slug]/page.js
export default function DocsPage({ params }) {
  // params.slug = ['a', 'b', 'c'] for /docs/a/b/c
  return <p>{params.slug.join(' / ')}</p>;
}
```

### Optional Catch-all — `[[...folder]]`

Double brackets make the segment **optional** — also matches the root of that path.

```
app/
└── docs/
    └── [[...slug]]/
        └── page.js       → "/docs", "/docs/a", "/docs/a/b"
```

---

### Route Groups — `(folder)`

Wrapping a folder name in **parentheses** creates a route group. The folder name is **excluded from the URL** — it's just for organisation.

```
app/
└── (marketing)/
    ├── about/
    │   └── page.js       → "/about"  (not "/marketing/about")
    └── blog/
        └── page.js       → "/blog"
```

This is useful for:
- Grouping related routes without affecting the URL
- Applying a shared layout to a subset of routes without a URL prefix

```
app/
├── (auth)/
│   ├── layout.js         → shared layout for login/signup only
│   ├── login/
│   │   └── page.js       → "/login"
│   └── signup/
│       └── page.js       → "/signup"
└── dashboard/
    └── page.js           → "/dashboard"
```

---

### Private Folders — `_folder`

Prefixing a folder with `_` **opts it out of routing entirely**. Useful for colocating components, hooks, or utilities alongside your routes without accidentally creating a URL.

```
app/
├── _components/          → NOT a route, just internal components
│   └── Navbar.jsx
└── dashboard/
    └── page.js           → "/dashboard"
```

---

### Nested Layouts Recap (in context of nested routing)

Each nested route folder can have its own `layout.js`. The layouts **stack** — child layouts render inside parent layouts.

```
app/
├── layout.js             → Root layout
└── dashboard/
    ├── layout.js         → Dashboard layout (inside root)
    ├── page.js           → "/dashboard"
    └── settings/
        └── page.js       → "/dashboard/settings" (uses dashboard layout)
```

The render tree for `/dashboard/settings` looks like:

```
RootLayout
  └── DashboardLayout
        └── SettingsPage
```

---

## Summary

| Concept | Key Point |
|---|---|
| `layout.js` | Required root shell — equivalent to `index.html`. Wraps all pages. |
| Custom `layout.js` | Nested layouts for specific route segments. Persist across child navigations. |
| `page.js` | Defines a publicly accessible route. `app/page.js` = `/`. |
| `<Link>` | Client-side navigation. Fast, preserves state, auto-prefetches. |
| `<a>` tag | Full page reload. Only use for external links. |
| Nested routes | Just nested folders — `app/blog/post/page.js` = `/blog/post`. |
| `[folder]` | Dynamic segment — matches any single value, accessible via `params`. |
| `[...folder]` | Catch-all — matches one or more segments as an array. |
| `[[...folder]]` | Optional catch-all — also matches the root of that path. |
| `(folder)` | Route group — organises routes without affecting the URL. |
| `_folder` | Private folder — completely excluded from routing. |