import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { RichTextEditor } from '@/components/ui/RichTextEditor'
import { PlusIcon, PaperClipIcon } from '@heroicons/react/24/outline'
import { formatDistanceToNow } from 'date-fns'
import { uploadFile } from '@/lib/uploadFile'

interface Author {
  id: string
  name: string
  email: string
}

interface Note {
  id: string
  title: string
  content: string
  attachments: string[]
  author: Author
  createdAt: string
  _count: {
    comments: number
  }
}

interface NoteListProps {
  subjectId: string
  initialNotes: Note[]
}

export function NoteList({ subjectId, initialNotes }: NoteListProps) {
  const [notes, setNotes] = useState<Note[]>(initialNotes)
  const [isAddingNote, setIsAddingNote] = useState(false)
  const [newNote, setNewNote] = useState({ title: '', content: '' })
  const [files, setFiles] = useState<File[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files))
    }
  }

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isSubmitting) return
    
    setIsSubmitting(true)
    
    try {
      // Upload files first
      const uploadedUrls = await Promise.all(
        files.map(file => uploadFile(file))
      )

      const response = await fetch(`/api/subjects/${subjectId}/notes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...newNote,
          attachments: uploadedUrls,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to add note')
      }

      const note = await response.json()
      setNotes([note, ...notes])
      setNewNote({ title: '', content: '' })
      setFiles([])
      setIsAddingNote(false)
    } catch (error) {
      console.error('Error adding note:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Notes</h2>
        <Button
          onClick={() => setIsAddingNote(true)}
          className="flex items-center gap-2"
          variant="outline"
        >
          <PlusIcon className="h-4 w-4" />
          Add Note
        </Button>
      </div>

      {isAddingNote && (
        <form onSubmit={handleAddNote} className="space-y-4 rounded-lg border p-4">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700">
              Title
            </label>
            <Input
              id="title"
              value={newNote.title}
              onChange={(e) => setNewNote({ ...newNote, title: e.target.value })}
              required
              className="mt-1"
            />
          </div>
          <div>
            <label htmlFor="content" className="block text-sm font-medium text-gray-700">
              Content
            </label>
            <RichTextEditor
              content={newNote.content}
              onChange={(content) => setNewNote({ ...newNote, content })}
              className="mt-1"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Attachments
            </label>
            <div className="mt-1 flex items-center gap-4">
              <Input
                type="file"
                onChange={handleFileChange}
                multiple
                className="flex-1"
              />
              <PaperClipIcon className="h-5 w-5 text-gray-400" />
            </div>
            {files.length > 0 && (
              <ul className="mt-2 text-sm text-gray-500">
                {files.map((file, index) => (
                  <li key={index}>{file.name}</li>
                ))}
              </ul>
            )}
          </div>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsAddingNote(false)
                setNewNote({ title: '', content: '' })
                setFiles([])
              }}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Adding...' : 'Add Note'}
            </Button>
          </div>
        </form>
      )}

      <div className="space-y-4">
        {notes.map((note) => (
          <div
            key={note.id}
            className="cursor-pointer rounded-lg border p-4 transition-colors hover:bg-gray-50"
            onClick={() => router.push(`/classroom/notes/${note.id}`)}
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-medium">{note.title}</h3>
                <p className="mt-1 text-sm text-gray-500">
                  by {note.author.name} • {formatDistanceToNow(new Date(note.createdAt))} ago
                </p>
              </div>
              <div className="text-sm text-gray-500">
                {note._count.comments} {note._count.comments === 1 ? 'comment' : 'comments'}
              </div>
            </div>
            <div 
              className="prose prose-sm prose-gray mt-2 line-clamp-2"
              dangerouslySetInnerHTML={{ __html: note.content }}
            />
            {note.attachments.length > 0 && (
              <div className="mt-2 text-sm text-gray-500">
                {note.attachments.length} {note.attachments.length === 1 ? 'attachment' : 'attachments'}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
} 