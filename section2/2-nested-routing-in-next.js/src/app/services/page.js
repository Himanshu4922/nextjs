import Link from "next/link";

export default function services() {
  return (
    <>
      <h1>Services Page</h1>
      <p>
        <Link href="services/web-development">Web Development</Link>
      </p>
      <p>
        <Link href="services/app-development">App Development</Link>
      </p>
    </>
  );
}
