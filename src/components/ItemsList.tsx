import { useAtomSet, useAtomValue } from '@effect-atom/atom-react'
import { X } from 'lucide-react'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import {
	currencyAtom,
	removeItemFromGroupAtom,
	selectedGroupAtom,
} from '../store/atoms'
import type { Item, Person } from '../types'

interface ItemsListProps {
	items: readonly Item[]
	people: readonly Person[]
}

export function ItemsList({ items, people }: ItemsListProps) {
	const { t, i18n } = useTranslation()
	const group = useAtomValue(selectedGroupAtom)
	const currency = useAtomValue(currencyAtom)
	const removeItem = useAtomSet(removeItemFromGroupAtom)
	const currencyFormatter = useMemo(
		() =>
			new Intl.NumberFormat(i18n.language === 'en' ? 'en-US' : i18n.language, {
				style: 'currency',
				currency,
			}),
		[currency, i18n.language]
	)

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
				<CardTitle className="font-semibold text-slate-900 text-xl">
					{t('itemsList.title')}
				</CardTitle>
				<p className="text-slate-500 text-sm">{t('itemsList.subtitle')}</p>
			</CardHeader>
			<CardContent>
				{items.length === 0 ? (
					<p className="rounded-2xl border border-slate-300 border-dashed bg-slate-50/80 py-6 text-center font-medium text-slate-500 text-sm">
						{t('itemsList.empty')}
					</p>
				) : (
					<div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
						{items.map((item) => {
							const totalValue = item.amount * item.price
							return (
								<div
									key={item.id}
									className={cn(
										'hover:-translate-y-1 relative overflow-hidden rounded-2xl border p-5 shadow-sm transition hover:shadow-xl',
										item.type === 'expense'
											? 'border-indigo-200/80 bg-linear-to-br from-white via-indigo-50 to-indigo-100/60'
											: 'border-emerald-200/80 bg-linear-to-br from-white via-emerald-50 to-emerald-100/60'
									)}
								>
									<div className="absolute top-0 right-0 h-24 w-24 rounded-full bg-white/40 blur-3xl" />
									<div className="relative z-10 flex items-start justify-between gap-3">
										<div>
											<p className="font-semibold text-slate-500 text-xs uppercase tracking-[0.35em]">
												{item.type === 'expense'
													? t('itemsList.expense')
													: t('itemsList.discount')}
											</p>
											<h3 className="mt-2 font-semibold text-lg text-slate-900">
												{item.name}
											</h3>
										</div>
										<Button
											variant="ghost"
											size="icon"
											onClick={() => handleRemove(item.id)}
											aria-label={t('itemsList.remove', { name: item.name })}
											className="h-8 w-8 text-slate-400 transition hover:bg-white/60 hover:text-rose-500"
										>
											<X className="h-4 w-4" />
										</Button>
									</div>
									<div className="relative z-10 mt-4 flex items-baseline gap-2">
										<span className="font-semibold text-3xl text-slate-900">
											{currencyFormatter.format(totalValue)}
										</span>
										<span className="text-slate-500 text-sm">
											{item.amount} × {currencyFormatter.format(item.price)}
										</span>
									</div>
									<div className="relative z-10 mt-4 text-slate-600 text-sm">
										{item.appliesToEveryone ? (
											<span>{t('itemsList.splitsEvenly')}</span>
										) : (
											<span>
												{item.selectedPeople.length > 0
													? t('itemsList.sharedWith', {
															people: item.selectedPeople
																.map(getPersonName)
																.sort((a, b) => a.localeCompare(b))
																.join(', '),
														})
													: t('itemsList.sharedWithNoOne')}
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
