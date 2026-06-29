export default function Footer() {
  return (
    <footer className="border-t border-gray-200 dark:border-gray-800 mt-12">
      <div className="max-w-2xl mx-auto px-4 py-6 sm:px-4 sm:py-8">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          &copy; {new Date().getFullYear()} My Tech Memoir
        </p>
      </div>
    </footer>
  )
}
