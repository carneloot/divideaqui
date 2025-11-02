import { useState } from 'react';
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
    <div className="group-manager">
      <div className="group-header">
        <input
          type="text"
          value={groupName}
          onChange={(e) => setGroupName(e.target.value)}
          onBlur={handleUpdateName}
          onKeyPress={(e) => e.key === 'Enter' && handleUpdateName()}
          className="group-name-input"
        />
        <button
          onClick={() => onDeleteGroup(group.id)}
          className="delete-group-btn"
          aria-label="Delete group"
        >
          Delete Group
        </button>
      </div>
      <div className="group-content">
        <div className="left-column">
          <PeopleManager
            people={group.people}
            onAddPerson={handleAddPerson}
            onRemovePerson={handleRemovePerson}
          />
          <ItemForm people={group.people} onAddItem={handleAddItem} />
        </div>
        <div className="right-column">
          <ItemsList
            items={group.items}
            people={group.people}
            onRemoveItem={handleRemoveItem}
          />
          <Summary group={group} />
        </div>
      </div>
    </div>
  );
}
