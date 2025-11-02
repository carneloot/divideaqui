import { useState, useEffect } from 'react';
import type { ExpenseGroup } from '../types';

const STORAGE_KEY = 'expense-groups';

export function useLocalStorage() {
  const [groups, setGroups] = useState<ExpenseGroup[]>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(groups));
  }, [groups]);

  const addGroup = (group: ExpenseGroup) => {
    setGroups(prev => [...prev, group]);
  };

  const updateGroup = (id: string, updates: Partial<ExpenseGroup>) => {
    setGroups(prev =>
      prev.map(group => (group.id === id ? { ...group, ...updates } : group))
    );
  };

  const deleteGroup = (id: string) => {
    setGroups(prev => prev.filter(group => group.id !== id));
  };

  return {
    groups,
    addGroup,
    updateGroup,
    deleteGroup,
  };
}
