import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
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
    <Card>
      <CardHeader>
        <CardTitle>Items</CardTitle>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="text-muted-foreground text-center py-4 italic">
            No items added yet. Add expenses or discounts above!
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {items.map(item => (
              <Card
                key={item.id}
                className={item.type === 'expense' ? 'border-l-4 border-l-blue-500' : 'border-l-4 border-l-green-500'}
              >
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-lg">{item.name}</h3>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onRemoveItem(item.id)}
                      aria-label={`Remove ${item.name}`}
                      className="h-6 w-6"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="text-2xl font-bold mb-2">
                    {item.type === 'discount' ? '-' : '+'}
                    ${(item.amount * item.price).toFixed(2)}
                  </div>
                  <div className="text-sm text-muted-foreground mb-1">
                    {item.amount} × ${item.price.toFixed(2)} = ${(item.amount * item.price).toFixed(2)}
                  </div>
                  <div className="text-sm text-muted-foreground">
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
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
