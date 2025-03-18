import { useState, useEffect } from 'react';
import { Resource, User } from '@prisma/client';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { FileIcon, LinkIcon, VideoIcon, FileTextIcon } from 'lucide-react';
import CreateResource from './CreateResource';

type ResourceWithAuthor = Resource & {
  author: Pick<User, 'id' | 'name'>;
};

interface ResourceListProps {
  subjectId: string;
  isTeacher: boolean;
}

export default function ResourceList({ subjectId, isTeacher }: ResourceListProps) {
  const { data: session } = useSession();
  const [resources, setResources] = useState<ResourceWithAuthor[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);

  const fetchResources = async () => {
    try {
      const response = await fetch(`/api/resources?subjectId=${subjectId}`);
      const data = await response.json();
      if (response.ok) {
        setResources(data);
      }
    } catch (error) {
      console.error('Error fetching resources:', error);
    }
  };

  useEffect(() => {
    fetchResources();
  }, [subjectId]);

  const handleCreateSuccess = () => {
    setShowCreateForm(false);
    fetchResources();
  };

  const getResourceIcon = (type: string) => {
    switch (type) {
      case 'DOCUMENT':
        return <FileTextIcon className="w-5 h-5" />;
      case 'VIDEO':
        return <VideoIcon className="w-5 h-5" />;
      case 'LINK':
        return <LinkIcon className="w-5 h-5" />;
      default:
        return <FileIcon className="w-5 h-5" />;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Resources</h2>
        {isTeacher && (
          <Button onClick={() => setShowCreateForm(true)}>
            Add Resource
          </Button>
        )}
      </div>

      {showCreateForm && (
        <CreateResource
          subjectId={subjectId}
          onSuccess={handleCreateSuccess}
          onCancel={() => setShowCreateForm(false)}
        />
      )}

      <div className="grid gap-4">
        {resources.map((resource) => (
          <Card key={resource.id} className="p-4">
            <div className="flex items-start gap-4">
              <div className="text-gray-500">
                {getResourceIcon(resource.type)}
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-semibold">{resource.title}</h3>
                    <p className="text-gray-600">{resource.description}</p>
                  </div>
                  {resource.url && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(resource.url, '_blank')}
                    >
                      Open
                    </Button>
                  )}
                </div>
                <div className="mt-2 text-sm text-gray-500">
                  Added by {resource.author.name}
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
} 