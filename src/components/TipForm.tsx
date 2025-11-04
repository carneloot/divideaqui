import { useAtomSet, useAtomValue } from '@effect-atom/atom-react'
import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
	currencyAtom,
	selectedGroupAtom,
	updateGroupTipPercentageAtom,
} from '../store/atoms'

export function TipForm() {
	const { t, i18n } = useTranslation()
	const group = useAtomValue(selectedGroupAtom)
	const updateGroupTipPercentage = useAtomSet(updateGroupTipPercentageAtom)
	const currency = useAtomValue(currencyAtom)

	const [tipPercentage, setTipPercentage] = useState(
		group?.tipPercentage && group.tipPercentage > 0
			? group.tipPercentage.toString()
			: ''
	)

	const currencyFormatter = useMemo(
		() =>
			new Intl.NumberFormat(i18n.language === 'en' ? 'en-US' : i18n.language, {
				style: 'currency',
				currency,
			}),
		[currency, i18n.language]
	)

	// Calculate tip stats
	const tipStats = useMemo(() => {
		if (!group) return null

		const totalExpenses = group.items
			.filter((item) => item.type === 'expense')
			.reduce((sum, item) => sum + item.amount * item.price, 0)
		const totalDiscounts = group.items
			.filter((item) => item.type === 'discount')
			.reduce((sum, item) => sum + item.amount * item.price, 0)
		const netTotal = totalExpenses - totalDiscounts
		const activeTipPercentage = group.tipPercentage
		const tipIsEnabled =
			activeTipPercentage !== undefined &&
			activeTipPercentage !== null &&
			activeTipPercentage > 0
		const totalTipAmount =
			tipIsEnabled && netTotal > 0 && activeTipPercentage !== undefined
				? (netTotal * activeTipPercentage) / 100
				: 0

		return {
			tipIsEnabled,
			totalTipAmount,
		}
	}, [group])

	// Sync local state with group when it changes
	useEffect(() => {
		if (group) {
			setTipPercentage(
				group.tipPercentage && group.tipPercentage > 0
					? group.tipPercentage.toString()
					: ''
			)
		}
	}, [group])

	if (!group || !tipStats) {
		return null
	}

	const { tipIsEnabled, totalTipAmount } = tipStats

	const handleUpdateTipPercentage = () => {
		const trimmedValue = tipPercentage.trim()
		if (trimmedValue === '') {
			updateGroupTipPercentage({
				id: group.id,
				tipPercentage: undefined,
			})
			return
		}
		const tipValue = parseFloat(trimmedValue)
		updateGroupTipPercentage({
			id: group.id,
			tipPercentage:
				tipValue !== undefined && !Number.isNaN(tipValue) && tipValue > 0
					? tipValue
					: undefined,
		})
	}

	return (
		<Card className="border-none bg-card shadow-md ring-1 ring-ring">
			<CardHeader className="space-y-1">
				<CardTitle className="font-semibold text-foreground text-xl">
					{t('tip.title')}
				</CardTitle>
				<p className="text-muted-foreground text-sm">{t('tip.subtitle')}</p>
			</CardHeader>
			<CardContent className="space-y-4">
				<div className="space-y-2">
					<Label
						htmlFor="tip-percentage"
						className="font-medium text-foreground text-sm"
					>
						{t('tip.percentage')}
					</Label>
					<div className="flex flex-col gap-3 sm:flex-row">
						<Input
							id="tip-percentage"
							type="number"
							placeholder={t('tip.placeholder')}
							value={tipPercentage}
							onChange={(e) => setTipPercentage(e.target.value)}
							onBlur={handleUpdateTipPercentage}
							onKeyDown={(e) => {
								if (e.key === 'Enter') {
									handleUpdateTipPercentage()
								}
							}}
							min="0"
							max="100"
							step="0.1"
							className="flex-1 rounded-xl"
						/>
						{tipIsEnabled && (
							<div className="flex items-center text-muted-foreground text-sm">
								{totalTipAmount > 0 ? (
									<span>
										{t('tip.adds', {
											amount: currencyFormatter.format(totalTipAmount),
										})}
									</span>
								) : (
									<span>{t('tip.notAdded')}</span>
								)}
							</div>
						)}
					</div>
					<p className="text-muted-foreground text-xs leading-relaxed">
						{t('tip.calculationHint')}
					</p>
				</div>
			</CardContent>
		</Card>
	)
}
