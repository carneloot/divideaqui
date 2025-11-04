import { useAtom, useAtomSet, useAtomValue } from '@effect-atom/atom-react'
import { X } from 'lucide-react'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from '@/components/ui/accordion'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { itemsAccordionStateAtom } from '../store/accordion'
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
	const [isAccordionOpen, setIsAccordionOpen] = useAtom(itemsAccordionStateAtom)
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
		<Card className="border-none bg-card shadow-md ring-1 ring-ring backdrop-blur">
			<Accordion
				type="single"
				collapsible
				value={isAccordionOpen}
				onValueChange={setIsAccordionOpen}
				className="w-full"
			>
				<AccordionItem value="items" className="border-none">
					<CardHeader className="space-y-1">
						<AccordionTrigger className="py-0 hover:no-underline">
							<div className="flex-1 text-left">
								<CardTitle className="font-semibold text-foreground text-xl">
									{t('itemsList.title')}
								</CardTitle>
								<p className="text-muted-foreground text-sm">
									{t('itemsList.subtitle')}
								</p>
							</div>
						</AccordionTrigger>
					</CardHeader>
					<AccordionContent className="px-6 pb-6">
						<CardContent className="p-0">
							{items.length === 0 ? (
								<p className="rounded-2xl border border-border border-dashed bg-muted py-6 text-center font-medium text-muted-foreground text-sm">
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
														? 'border-primary/30 bg-linear-to-br from-primary/10 to-primary/20'
														: 'border-accent/30 bg-linear-to-br from-accent/50 to-accent/60'
												)}
											>
												<div className="absolute top-0 right-0 h-24 w-24 rounded-full bg-background/40 blur-3xl" />
												<div className="relative z-10 flex items-start justify-between gap-3">
													<div>
														<p className="font-semibold text-muted-foreground text-xs uppercase tracking-[0.35em]">
															{item.type === 'expense'
																? t('itemsList.expense')
																: t('itemsList.discount')}
														</p>
														<h3 className="mt-1 font-semibold text-foreground text-lg">
															{item.name}
														</h3>
													</div>
													<Button
														variant="ghost"
														size="icon"
														onClick={() => handleRemove(item.id)}
														aria-label={t('itemsList.remove', {
															name: item.name,
														})}
														className="h-8 w-8 text-muted-foreground transition hover:bg-background/60 hover:text-destructive"
													>
														<X className="h-4 w-4" />
													</Button>
												</div>
												<div className="relative z-10 mt-2 flex items-baseline gap-2">
													<span
														className={cn(
															'font-semibold text-3xl text-foreground',
															item.type === 'expense'
																? 'text-primary'
																: 'text-accent-foreground'
														)}
													>
														{currencyFormatter.format(totalValue)}
													</span>
													<span className="text-muted-foreground text-sm">
														{item.amount} ×{' '}
														{currencyFormatter.format(item.price)}
													</span>
												</div>
												<div className="relative z-10 mt-2 text-muted-foreground text-sm">
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
					</AccordionContent>
				</AccordionItem>
			</Accordion>
		</Card>
	)
}
