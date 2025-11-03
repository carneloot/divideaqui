import { useAtomSet, useAtomValue } from '@effect-atom/atom-react'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import {
	removeItemFromGroupAtom,
	selectedGroupAtom,
} from '../store/atoms'
import type { Item, Person } from '../types'

interface ItemsListProps {
	items: readonly Item[]
	people: readonly Person[]
}

export function ItemsList({ items, people }: ItemsListProps) {
	const group = useAtomValue(selectedGroupAtom)
	const removeItem = useAtomSet(removeItemFromGroupAtom)
	const currencyFormatter = new Intl.NumberFormat('en-US', {
		style: 'currency',
		currency: 'USD',
	})

	const handleRemove = (id: string) => {
		if (group) {
			removeItem({ groupId: group.id, itemId: id })
		}
	}
	const getPersonName = (id: string) => {
		return people.find((p) => p.id === id)?.name || 'Unknown'
	}

	return (
		<Card className="border-none bg-white/90 shadow-md ring-1 ring-slate-200/60 backdrop-blur">
			<CardHeader className="space-y-1">
				<CardTitle className="text-xl font-semibold text-slate-900">
					Items
				</CardTitle>
				<p className="text-sm text-slate-500">
					Track every shared cost and see where the money is going.
				</p>
			</CardHeader>
			<CardContent>
				{items.length === 0 ? (
					<p className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/80 py-6 text-center text-sm font-medium text-slate-500">
						No items yet. Add expenses or discounts to see the breakdown here.
					</p>
				) : (
					<div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
						{items.map((item) => {
							const totalValue = item.amount * item.price
							return (
								<div
									key={item.id}
									className={cn(
										'relative overflow-hidden rounded-2xl border p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-xl',
										item.type === 'expense'
											? 'border-indigo-200/80 bg-gradient-to-br from-white via-indigo-50 to-indigo-100/60'
											: 'border-emerald-200/80 bg-gradient-to-br from-white via-emerald-50 to-emerald-100/60'
									)}
								>
									<div className="absolute right-0 top-0 h-24 w-24 rounded-full bg-white/40 blur-3xl" />
									<div className="relative z-10 flex items-start justify-between gap-3">
										<div>
											<p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-500">
												{item.type === 'expense' ? 'Expense' : 'Discount'}
											</p>
											<h3 className="mt-2 text-lg font-semibold text-slate-900">
												{item.name}
											</h3>
										</div>
										<Button
											variant="ghost"
											size="icon"
											onClick={() => handleRemove(item.id)}
											aria-label={`Remove ${item.name}`}
											className="h-8 w-8 text-slate-400 transition hover:bg-white/60 hover:text-rose-500"
										>
											<X className="h-4 w-4" />
										</Button>
									</div>
									<div className="relative z-10 mt-4 flex items-baseline gap-2">
										<span className="text-3xl font-semibold text-slate-900">
											{currencyFormatter.format(totalValue)}
										</span>
										<span className="text-sm text-slate-500">
											{item.amount} × {currencyFormatter.format(item.price)}
										</span>
									</div>
									<div className="relative z-10 mt-4 text-sm text-slate-600">
										{item.appliesToEveryone ? (
											<span>Splits evenly across everyone</span>
										) : (
											<span>
												Shared with{' '}
												{item.selectedPeople
													.map(getPersonName)
													.sort((a, b) => a.localeCompare(b))
													.join(', ') || 'no one'}
											</span>
										)}
									</div>
								</div>
							)
						})}
					</div>
				)}
			</CardContent>
		</Card>
	)
}
