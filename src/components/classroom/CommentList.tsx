import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/Button'
import { Textarea } from '@/components/ui/Textarea'
import { formatDistanceToNow } from 'date-fns'

interface Author {
  id: string
  name: string
  email: string
}

interface Comment {
  id: string
  content: string
  author: Author
  createdAt: string
}

interface CommentListProps {
  noteId: string
  initialComments: Comment[]
}

export function CommentList({ noteId, initialComments }: CommentListProps) {
  const { data: session } = useSession()
  const [comments, setComments] = useState<Comment[]>(initialComments)
  const [newComment, setNewComment] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newComment.trim() || isSubmitting) return

    setIsSubmitting(true)

    try {
      const response = await fetch(`/api/notes/${noteId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: newComment }),
      })

      if (!response.ok) {
        throw new Error('Failed to add comment')
      }

      const comment = await response.json()
      setComments([comment, ...comments])
      setNewComment('')
    } catch (error) {
      console.error('Error adding comment:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">Comments</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="comment" className="sr-only">
            Add a comment
          </label>
          <Textarea
            id="comment"
            placeholder="Add a comment..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            required
            className="h-24"
          />
        </div>
        <div className="flex justify-end">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Adding...' : 'Add Comment'}
          </Button>
        </div>
      </form>

      <div className="space-y-6">
        {comments.map((comment) => (
          <div key={comment.id} className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <span className="font-medium">{comment.author.name}</span>
              <span className="text-gray-500">•</span>
              <span className="text-gray-500">
                {formatDistanceToNow(new Date(comment.createdAt))} ago
              </span>
            </div>
            <p className="text-gray-600">{comment.content}</p>
          </div>
        ))}
      </div>
    </div>
  )
} 