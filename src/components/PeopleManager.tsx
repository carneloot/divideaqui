import { useState } from 'react';
import type { Person } from '../types';

interface PeopleManagerProps {
  people: Person[];
  onAddPerson: (person: Person) => void;
  onRemovePerson: (id: string) => void;
}

export function PeopleManager({ people, onAddPerson, onRemovePerson }: PeopleManagerProps) {
  const [name, setName] = useState('');

  const handleAdd = () => {
    if (name.trim()) {
      onAddPerson({
        id: crypto.randomUUID(),
        name: name.trim(),
      });
      setName('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAdd();
    }
  };

  return (
    <div className="people-manager">
      <h2>People</h2>
      <div className="add-person-form">
        <input
          type="text"
          placeholder="Enter person's name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyPress={handleKeyPress}
        />
        <button onClick={handleAdd}>Add Person</button>
      </div>
      <div className="people-list">
        {people.length === 0 ? (
          <p className="empty-state">No people added yet. Add someone to get started!</p>
        ) : (
          [...people].sort((a, b) => a.name.localeCompare(b.name)).map(person => (
            <div key={person.id} className="person-item">
              <span>{person.name}</span>
              <button
                onClick={() => onRemovePerson(person.id)}
                className="remove-btn"
                aria-label={`Remove ${person.name}`}
              >
                ×
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
