import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
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
  const [tipPercentage, setTipPercentage] = useState(group.tipPercentage?.toString() || '');

  // Sync local state with group prop changes
  useEffect(() => {
    setGroupName(group.name);
    setTipPercentage(group.tipPercentage?.toString() || '');
  }, [group.name, group.tipPercentage]);

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

  const handleUpdateTipPercentage = () => {
    const tipValue = tipPercentage.trim() === '' ? undefined : parseFloat(tipPercentage);
    onUpdateGroup(group.id, {
      tipPercentage: tipValue !== undefined && !isNaN(tipValue) && tipValue >= 0 ? tipValue : undefined,
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
          <Card>
            <CardHeader>
              <CardTitle>Tip Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="tip-percentage">Tip Percentage</Label>
                <div className="flex gap-2">
                  <Input
                    id="tip-percentage"
                    type="number"
                    placeholder="Enter tip % (optional)"
                    value={tipPercentage}
                    onChange={(e) => setTipPercentage(e.target.value)}
                    onBlur={handleUpdateTipPercentage}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleUpdateTipPercentage();
                      }
                    }}
                    min="0"
                    max="100"
                    step="0.1"
                    className="flex-1"
                  />
                </div>
                <p className="text-sm text-muted-foreground">
                  The tip will be calculated on the total bill and split equally among all people.
                </p>
              </div>
            </CardContent>
          </Card>
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
