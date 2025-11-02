import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import type { ExpenseGroup, Person, Item } from '../types';
import { PeopleManager } from './PeopleManager';
import { ItemForm } from './ItemForm';
import { ItemsList } from './ItemsList';
import { Summary } from './Summary';

interface GroupManagerProps {
  group: ExpenseGroup;
  onUpdateGroup: (id: string, updates: Partial<ExpenseGroup>) => void;
  onDeleteGroup: (id: string) => void;
}

export function GroupManager({ group, onUpdateGroup, onDeleteGroup }: GroupManagerProps) {
  const [groupName, setGroupName] = useState(group.name);

  const handleUpdateName = () => {
    if (groupName.trim()) {
      onUpdateGroup(group.id, { name: groupName.trim() });
    }
  };

  const handleAddPerson = (person: Person) => {
    onUpdateGroup(group.id, {
      people: [...group.people, person],
    });
  };

  const handleRemovePerson = (personId: string) => {
    // Remove person from people list
    const updatedPeople = group.people.filter(p => p.id !== personId);
    // Remove person from all items that reference them
    const updatedItems = group.items.map(item => ({
      ...item,
      selectedPeople: item.selectedPeople.filter(id => id !== personId),
    }));
    onUpdateGroup(group.id, {
      people: updatedPeople,
      items: updatedItems,
    });
  };

  const handleAddItem = (item: Item) => {
    onUpdateGroup(group.id, {
      items: [...group.items, item],
    });
  };

  const handleRemoveItem = (itemId: string) => {
    onUpdateGroup(group.id, {
      items: group.items.filter(item => item.id !== itemId),
    });
  };

  return (
    <Card>
      <div className="flex items-center justify-between p-6 border-b bg-muted/50">
        <Input
          type="text"
          value={groupName}
          onChange={(e) => setGroupName(e.target.value)}
          onBlur={handleUpdateName}
          onKeyDown={(e) => e.key === 'Enter' && handleUpdateName()}
          className="text-2xl font-semibold border-0 bg-transparent p-0 focus-visible:ring-0 focus-visible:ring-offset-0 max-w-md"
        />
        <Button
          variant="destructive"
          onClick={() => onDeleteGroup(group.id)}
          aria-label="Delete group"
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Delete Group
        </Button>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
        <div className="space-y-6">
          <PeopleManager
            people={group.people}
            onAddPerson={handleAddPerson}
            onRemovePerson={handleRemovePerson}
          />
          <ItemForm people={group.people} onAddItem={handleAddItem} />
        </div>
        <div className="space-y-6">
          <ItemsList
            items={group.items}
            people={group.people}
            onRemoveItem={handleRemoveItem}
          />
          <Summary group={group} />
        </div>
      </div>
    </Card>
  );
}
