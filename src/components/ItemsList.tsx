import type { Item, Person } from '../types';

interface ItemsListProps {
  items: Item[];
  people: Person[];
  onRemoveItem: (id: string) => void;
}

export function ItemsList({ items, people, onRemoveItem }: ItemsListProps) {
  const getPersonName = (id: string) => {
    return people.find(p => p.id === id)?.name || 'Unknown';
  };

  return (
    <div className="items-list">
      <h2>Items</h2>
      {items.length === 0 ? (
        <p className="empty-state">No items added yet. Add expenses or discounts above!</p>
      ) : (
        <div className="items-grid">
          {items.map(item => (
            <div key={item.id} className={`item-card ${item.type}`}>
              <div className="item-header">
                <span className="item-name">{item.name}</span>
                <button
                  onClick={() => onRemoveItem(item.id)}
                  className="remove-btn"
                  aria-label={`Remove ${item.name}`}
                >
                  ×
                </button>
              </div>
              <div className="item-amount">
                {item.type === 'discount' ? '-' : '+'}
                ${item.amount.toFixed(2)}
              </div>
              <div className="item-applies-to">
                {item.appliesToEveryone ? (
                  <span>Applies to: Everyone</span>
                ) : (
                  <span>
                    Applies to: {item.selectedPeople
                      .map(getPersonName)
                      .sort((a, b) => a.localeCompare(b))
                      .join(', ') || 'None'}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
