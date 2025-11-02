export type ItemType = 'expense' | 'discount';

export type Person = {
  id: string;
  name: string;
};

export type Item = {
  id: string;
  name: string;
  amount: number; // Quantity
  price: number; // Unit price
  type: ItemType;
  appliesToEveryone: boolean;
  selectedPeople: string[]; // Person IDs
};

export type ExpenseGroup = {
  id: string;
  name: string;
  people: Person[];
  items: Item[];
};
