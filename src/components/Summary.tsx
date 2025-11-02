import { useMemo } from 'react';
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
    <div className="summary">
      <h2>Summary</h2>
      {group.people.length === 0 ? (
        <p className="empty-state">Add people to see the summary</p>
      ) : group.items.length === 0 ? (
        <p className="empty-state">Add items to see the summary</p>
      ) : (
        <>
          <div className="summary-table">
            <div className="summary-header">
              <span>Person</span>
              <span>Amount Owed</span>
            </div>
            {[...group.people].sort((a, b) => a.name.localeCompare(b.name)).map(person => (
              <div key={person.id} className="summary-row">
                <span>{person.name}</span>
                <span className={calculations.totals[person.id] >= 0 ? 'positive' : 'negative'}>
                  ${Math.abs(calculations.totals[person.id]).toFixed(2)}
                  {calculations.totals[person.id] < 0 && ' (credit)'}
                </span>
              </div>
            ))}
          </div>
          <div className="summary-totals">
            <div className="total-row">
              <span>Total Expenses:</span>
              <span>${calculations.totalExpenses.toFixed(2)}</span>
            </div>
            <div className="total-row">
              <span>Total Discounts:</span>
              <span>${calculations.totalDiscounts.toFixed(2)}</span>
            </div>
            <div className="total-row net-total">
              <span>Net Total:</span>
              <span>${calculations.netTotal.toFixed(2)}</span>
            </div>
          </div>
          {!calculations.isValid && (
            <div className="validation-error">
              ⚠️ Warning: Calculation mismatch detected. Please check your items.
            </div>
          )}
        </>
      )}
    </div>
  );
}
