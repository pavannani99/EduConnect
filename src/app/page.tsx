import Link from 'next/link'

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="max-w-5xl w-full text-center">
        <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
          Welcome to EduConnect
        </h1>
        <p className="mt-6 text-lg leading-8 text-gray-600">
          A modern platform for student collaboration, note sharing, and classroom management.
        </p>
        <div className="mt-10 flex items-center justify-center gap-x-6">
          <Link
            href="/auth/register"
            className="rounded-md bg-blue-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
          >
            Get started
          </Link>
          <Link href="/about" className="text-sm font-semibold leading-6 text-gray-900">
            Learn more <span aria-hidden="true">→</span>
          </Link>
        </div>
      </div>
    </main>
  )
} 