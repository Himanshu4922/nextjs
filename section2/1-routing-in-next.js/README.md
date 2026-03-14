# Next.js Routing Notes

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
Next.js `<Link>` **automatically prefetches** the linked page's data when the link enters the viewport (in production). This means by the time the user clicks the link, the page is already loaded — resulting in near-instant navigation.

### When to still use `<a>`
- Navigating to **external URLs** (outside your app):
```jsx
<a href="https://google.com" target="_blank" rel="noopener noreferrer">
  Visit Google
</a>
```
- Linking to files for download (PDFs, etc.)

---

## Summary

| Concept | Key Point |
|---|---|
| `layout.js` | Required root shell — equivalent to `index.html`. Wraps all pages. |
| Custom `layout.js` | Nested layouts for specific route segments. Persist across child navigations. |
| `page.js` | Defines a publicly accessible route. `app/page.js` = `/`. |
| `<Link>` | Client-side navigation. Fast, preserves state, auto-prefetches. |
| `<a>` tag | Full page reload. Only use for external links. |