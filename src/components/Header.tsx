import Link from "next/link";

export default function Header() {
  return (
    <header className="border-b border-gray-200 dark:border-gray-800">
      <div className="max-w-2xl mx-auto px-4 py-4 sm:px-4 sm:py-5">
        <Link
          href="/"
          className="text-lg font-semibold text-gray-900 dark:text-white hover:opacity-80 transition-opacity"
        >
          My Tech Memoir
        </Link>
      </div>
    </header>
  );
}
