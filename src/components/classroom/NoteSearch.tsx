import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/Input'
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline'
import { formatDistanceToNow } from 'date-fns'

interface Author {
  id: string
  name: string
  email: string
}

interface Subject {
  id: string
  name: string
  code: string
}

interface Note {
  id: string
  title: string
  content: string
  attachments: string[]
  author: Author
  subject: Subject
  createdAt: string
  _count: {
    comments: number
  }
}

interface NoteSearchProps {
  subjectId?: string
}

export function NoteSearch({ subjectId }: NoteSearchProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Note[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const router = useRouter()

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim() || isSearching) return

    setIsSearching(true)

    try {
      const params = new URLSearchParams({
        q: query,
        ...(subjectId && { subjectId }),
      })

      const response = await fetch(`/api/notes/search?${params}`)
      if (!response.ok) {
        throw new Error('Failed to search notes')
      }

      const notes = await response.json()
      setResults(notes)
    } catch (error) {
      console.error('Error searching notes:', error)
    } finally {
      setIsSearching(false)
    }
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSearch} className="relative">
        <Input
          type="search"
          placeholder="Search notes..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-10"
        />
        <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
      </form>

      {results.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-gray-900">Search Results</h3>
          {results.map((note) => (
            <div
              key={note.id}
              className="cursor-pointer rounded-lg border p-4 transition-colors hover:bg-gray-50"
              onClick={() => router.push(`/classroom/notes/${note.id}`)}
            >
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-medium">{note.title}</h4>
                  <p className="mt-1 text-sm text-gray-500">
                    by {note.author.name} • {formatDistanceToNow(new Date(note.createdAt))} ago
                  </p>
                  <p className="mt-1 text-sm text-gray-500">
                    in {note.subject.name} ({note.subject.code})
                  </p>
                </div>
                <div className="text-sm text-gray-500">
                  {note._count.comments} {note._count.comments === 1 ? 'comment' : 'comments'}
                </div>
              </div>
              <p className="mt-2 line-clamp-2 text-sm text-gray-600">{note.content}</p>
              {note.attachments.length > 0 && (
                <div className="mt-2 text-sm text-gray-500">
                  {note.attachments.length} {note.attachments.length === 1 ? 'attachment' : 'attachments'}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
} 