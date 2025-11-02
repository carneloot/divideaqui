import { useState } from 'react';
import { useMaskito } from '@maskito/react';
import { maskitoNumberOptionsGenerator } from '@maskito/kit';
import type { Item, Person, ItemType } from '../types';

interface ItemFormProps {
  people: Person[];
  onAddItem: (item: Item) => void;
}
const maskOptions = maskitoNumberOptionsGenerator({
  min: 0,
  max: 999999.99,
  decimalSeparator: '.',
  thousandSeparator: ',',
  prefix: '$',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function ItemForm({ people, onAddItem }: ItemFormProps) {
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [appliesToEveryone, setAppliesToEveryone] = useState(true);
  const [selectedPeople, setSelectedPeople] = useState<string[]>([]);

  const amountInputRef = useMaskito({ options: maskOptions });
  
  const handleTogglePerson = (personId: string) => {
    setSelectedPeople(prev =>
      prev.includes(personId)
        ? prev.filter(id => id !== personId)
        : [...prev, personId]
    );
  };

  const handleAddItem = (itemType: ItemType) => {
    const numAmount = parseFloat(amount.replace(/[^0-9.]/g, '')) || parseFloat(amount.slice(1));
    if (name.trim() && !isNaN(numAmount) && numAmount > 0) {
      if (!appliesToEveryone && selectedPeople.length === 0) {
        alert('Please select at least one person when using custom selection.');
        return;
      }
      onAddItem({
        id: crypto.randomUUID(),
        name: name.trim(),
        amount: numAmount,
        type: itemType,
        appliesToEveryone,
        selectedPeople: appliesToEveryone ? [] : selectedPeople,
      });
      // Reset form
      setName('');
      setAmount('');
      setAppliesToEveryone(true);
      setSelectedPeople([]);
    }
  };

  return (
    <form className="item-form">
      <h2>Add Item</h2>
      <div className="form-row">
        <input
          type="text"
          placeholder="Item name (e.g., 'Pizza', '10% discount')"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </div>
      <div className="form-row">
        <input
          ref={amountInputRef}
          type="text"
          placeholder="Amount"
          inputMode="numeric"
          required
          value={amount}
          onInput={(e) => setAmount(e.currentTarget.value)}
        />
      </div>
      <div className="form-row">
        <label>
          <input
            type="radio"
            checked={appliesToEveryone}
            onChange={() => setAppliesToEveryone(true)}
          />
          Everyone
        </label>
        <label>
          <input
            type="radio"
            checked={!appliesToEveryone}
            onChange={() => setAppliesToEveryone(false)}
          />
          Custom
        </label>
      </div>
      {!appliesToEveryone && (
        <div className="people-checkboxes">
          {people.length === 0 ? (
            <p className="warning">Add people first before selecting custom</p>
          ) : (
            [...people].sort((a, b) => a.name.localeCompare(b.name)).map(person => (
              <label key={person.id} className="checkbox-label">
                <input
                  type="checkbox"
                  checked={selectedPeople.includes(person.id)}
                  onChange={() => handleTogglePerson(person.id)}
                />
                {person.name}
              </label>
            ))
          )}
        </div>
      )}
      <div className="form-buttons">
        <button
          type="button"
          onClick={() => handleAddItem('expense')}
          className="add-expense-btn"
        >
          Add Expense
        </button>
        <button
          type="button"
          onClick={() => handleAddItem('discount')}
          className="add-discount-btn"
        >
          Add Discount
        </button>
      </div>
    </form>
  );
}
