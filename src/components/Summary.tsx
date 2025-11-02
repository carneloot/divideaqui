import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { ExpenseGroup } from '../types';

interface SummaryProps {
  group: ExpenseGroup;
}

export function Summary({ group }: SummaryProps) {
  const calculations = useMemo(() => {
    const totals: Record<string, number> = {};
    const tips: Record<string, number> = {};
    const totalsWithTips: Record<string, number> = {};

    // Initialize all people with 0
    group.people.forEach(person => {
      totals[person.id] = 0;
      tips[person.id] = 0;
      totalsWithTips[person.id] = 0;
    });

    // Calculate each person's share
    group.items.forEach(item => {
      const totalValue = item.amount * item.price;
      const amount = item.type === 'expense' ? totalValue : -totalValue;
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
      .reduce((sum, item) => sum + (item.amount * item.price), 0);
    const totalDiscounts = group.items
      .filter(item => item.type === 'discount')
      .reduce((sum, item) => sum + (item.amount * item.price), 0);
    const netTotal = totalExpenses - totalDiscounts;

    // Calculate global tip on net total and split equally among all people
    let totalTipAmount = 0;
    let tipPerPerson = 0;
    if (group.tipPercentage !== undefined && group.tipPercentage !== null && netTotal > 0 && group.people.length > 0) {
      totalTipAmount = netTotal * (group.tipPercentage / 100);
      tipPerPerson = totalTipAmount / group.people.length;
      
      // Assign tip to each person
      group.people.forEach(person => {
        tips[person.id] = tipPerPerson;
        totalsWithTips[person.id] = (totals[person.id] || 0) + tipPerPerson;
      });
    } else {
      // No tip, so totalsWithTips equals totals
      group.people.forEach(person => {
        totalsWithTips[person.id] = totals[person.id] || 0;
      });
    }

    const sumOfShares = Object.values(totals).reduce((sum, val) => sum + val, 0);
    const sumOfSharesWithTips = Object.values(totalsWithTips).reduce((sum, val) => sum + val, 0);

    return {
      totals,
      tips,
      totalsWithTips,
      totalExpenses,
      totalDiscounts,
      netTotal,
      sumOfShares,
      totalTips: totalTipAmount,
      sumOfSharesWithTips,
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
              {[...group.people].sort((a, b) => a.name.localeCompare(b.name)).map(person => {
                const baseTotal = calculations.totals[person.id] || 0;
                const tip = calculations.tips[person.id] || 0;
                const totalWithTip = calculations.totalsWithTips[person.id] || 0;
                const hasTip = tip > 0 && group.tipPercentage !== undefined && group.tipPercentage !== null;

                return (
                  <div key={person.id} className="grid grid-cols-2 p-2 border-t">
                    <div>
                      <div className="font-medium">{person.name}</div>
                      {hasTip && (
                        <div className="text-xs text-muted-foreground mt-1">
                          Base: ${Math.abs(baseTotal).toFixed(2)} + Tip (${group.tipPercentage}%): ${tip.toFixed(2)}
                        </div>
                      )}
                    </div>
                    <span className={`text-right font-semibold ${
                      totalWithTip >= 0 ? 'text-blue-600' : 'text-green-600'
                    }`}>
                      ${Math.abs(totalWithTip).toFixed(2)}
                      {totalWithTip < 0 && ' (credit)'}
                    </span>
                  </div>
                );
              })}
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
              <div className="flex justify-between">
                <span>Net Total (before tips):</span>
                <span className="font-semibold">${calculations.netTotal.toFixed(2)}</span>
              </div>
              {calculations.totalTips > 0 && (
                <div className="flex justify-between">
                  <span>Total Tips:</span>
                  <span className="font-semibold">${calculations.totalTips.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between pt-2 border-t font-bold text-lg">
                <span>Grand Total:</span>
                <span>${calculations.sumOfSharesWithTips.toFixed(2)}</span>
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
