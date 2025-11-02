import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { ExpenseGroup } from './types';
import { useLocalStorage } from './hooks/useLocalStorage';
import { GroupManager } from './components/GroupManager';

function App() {
  const { groups, addGroup, updateGroup, deleteGroup } = useLocalStorage();
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(
    groups.length > 0 ? groups[0].id : null
  );

  const handleCreateGroup = () => {
    const newGroup: ExpenseGroup = {
      id: crypto.randomUUID(),
      name: `Night Out ${groups.length + 1}`,
      people: [],
      items: [],
    };
    addGroup(newGroup);
    setSelectedGroupId(newGroup.id);
  };

  const selectedGroup = groups.find(g => g.id === selectedGroupId);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="container mx-auto px-4 py-8 text-center">
          <h1 className="text-4xl font-bold mb-2">💰 Divide Aqui</h1>
          <p className="text-lg opacity-90">Split expenses with your friends</p>
        </div>
      </header>
      <main className="container mx-auto px-4 py-8 max-w-7xl">
        {groups.length > 0 && (
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <label htmlFor="group-select" className="font-medium">Select Group:</label>
                <Select
                  value={selectedGroupId || ''}
                  onValueChange={(value) => setSelectedGroupId(value)}
                >
                  <SelectTrigger id="group-select" className="flex-1">
                    <SelectValue placeholder="Select a group" />
                  </SelectTrigger>
                  <SelectContent>
                    {groups.map(group => (
                      <SelectItem key={group.id} value={group.id}>
                        {group.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button onClick={handleCreateGroup}>
                  + New Group
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
        {selectedGroup ? (
          <GroupManager
            group={selectedGroup}
            onUpdateGroup={updateGroup}
            onDeleteGroup={(id) => {
              deleteGroup(id);
              if (groups.length > 1) {
                const remainingGroups = groups.filter(g => g.id !== id);
                setSelectedGroupId(remainingGroups[0]?.id || null);
              } else {
                setSelectedGroupId(null);
              }
            }}
          />
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="text-center text-2xl">Welcome! 👋</CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4 py-8">
              <p className="text-muted-foreground text-lg">
                Create your first expense group to get started.
              </p>
              <Button onClick={handleCreateGroup} size="lg">
                Create Your First Group
              </Button>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}

export default App;
