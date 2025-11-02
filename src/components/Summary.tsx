import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { ExpenseGroup } from '../types';

interface SummaryProps {
  group: ExpenseGroup;
}

export function Summary({ group }: SummaryProps) {
  const calculations = useMemo(() => {
    const totals: Record<string, number> = {};

    // Initialize all people with 0
    group.people.forEach(person => {
      totals[person.id] = 0;
    });

    // Calculate each person's share
    group.items.forEach(item => {
      const amount = item.type === 'expense' ? item.amount : -item.amount;
      const applicablePeople = item.appliesToEveryone
        ? group.people
        : group.people.filter(p => item.selectedPeople.includes(p.id));

      if (applicablePeople.length === 0) return;

      const perPerson = amount / applicablePeople.length;
      applicablePeople.forEach(person => {
        totals[person.id] = (totals[person.id] || 0) + perPerson;
      });
    });

    // Calculate totals for validation
    const totalExpenses = group.items
      .filter(item => item.type === 'expense')
      .reduce((sum, item) => sum + item.amount, 0);
    const totalDiscounts = group.items
      .filter(item => item.type === 'discount')
      .reduce((sum, item) => sum + item.amount, 0);
    const netTotal = totalExpenses - totalDiscounts;
    const sumOfShares = Object.values(totals).reduce((sum, val) => sum + val, 0);

    return {
      totals,
      totalExpenses,
      totalDiscounts,
      netTotal,
      sumOfShares,
      isValid: Math.abs(netTotal - sumOfShares) < 0.01, // Allow small floating point differences
    };
  }, [group]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Summary</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {group.people.length === 0 ? (
          <p className="text-muted-foreground text-center py-4 italic">
            Add people to see the summary
          </p>
        ) : group.items.length === 0 ? (
          <p className="text-muted-foreground text-center py-4 italic">
            Add items to see the summary
          </p>
        ) : (
          <>
            <div className="border rounded-md overflow-hidden">
              <div className="grid grid-cols-2 bg-primary text-primary-foreground p-2 font-semibold">
                <span>Person</span>
                <span className="text-right">Amount Owed</span>
              </div>
              {[...group.people].sort((a, b) => a.name.localeCompare(b.name)).map(person => (
                <div key={person.id} className="grid grid-cols-2 p-2 border-t">
                  <span>{person.name}</span>
                  <span className={`text-right font-semibold ${
                    calculations.totals[person.id] >= 0 ? 'text-blue-600' : 'text-green-600'
                  }`}>
                    ${Math.abs(calculations.totals[person.id]).toFixed(2)}
                    {calculations.totals[person.id] < 0 && ' (credit)'}
                  </span>
                </div>
              ))}
            </div>
            <div className="space-y-2 p-4 bg-muted rounded-md">
              <div className="flex justify-between">
                <span>Total Expenses:</span>
                <span className="font-semibold">${calculations.totalExpenses.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Total Discounts:</span>
                <span className="font-semibold">${calculations.totalDiscounts.toFixed(2)}</span>
              </div>
              <div className="flex justify-between pt-2 border-t font-bold text-lg">
                <span>Net Total:</span>
                <span>${calculations.netTotal.toFixed(2)}</span>
              </div>
            </div>
            {!calculations.isValid && (
              <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-3 rounded-md font-medium">
                ⚠️ Warning: Calculation mismatch detected. Please check your items.
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
