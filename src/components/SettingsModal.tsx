import { useAtom } from '@effect-atom/atom-react'
import { Settings as SettingsIcon } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select'
import { currencyAtom } from '../store/atoms'

const CURRENCIES = [
	{ code: 'USD', name: 'US Dollar (USD)' },
	{ code: 'BRL', name: 'Brazilian Real (BRL)' },
	{ code: 'EUR', name: 'Euro (EUR)' },
	{ code: 'GBP', name: 'British Pound (GBP)' },
	{ code: 'JPY', name: 'Japanese Yen (JPY)' },
	{ code: 'CAD', name: 'Canadian Dollar (CAD)' },
	{ code: 'AUD', name: 'Australian Dollar (AUD)' },
	{ code: 'CHF', name: 'Swiss Franc (CHF)' },
	{ code: 'CNY', name: 'Chinese Yuan (CNY)' },
	{ code: 'INR', name: 'Indian Rupee (INR)' },
	{ code: 'MXN', name: 'Mexican Peso (MXN)' },
	{ code: 'SGD', name: 'Singapore Dollar (SGD)' },
]

export function SettingsModal() {
	const [currency, setCurrency] = useAtom(currencyAtom)
	const [open, setOpen] = useState(false)

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				<Button
					variant="ghost"
					size="icon"
					className="h-10 w-10 rounded-xl text-white hover:bg-white/10"
					aria-label="Settings"
				>
					<SettingsIcon className="h-5 w-5" />
				</Button>
			</DialogTrigger>
			<DialogContent className="sm:max-w-md rounded-xl border-none bg-white/95 shadow-xl ring-1 ring-slate-200/70 backdrop-blur">
				<DialogHeader>
					<DialogTitle className="text-xl font-semibold text-slate-900">
						Settings
					</DialogTitle>
					<DialogDescription className="text-sm text-slate-500">
						Customize your app preferences
					</DialogDescription>
				</DialogHeader>
				<div className="space-y-4 py-4">
					<div className="space-y-2">
						<Label htmlFor="currency" className="text-sm font-medium text-slate-700">
							Currency
						</Label>
						<Select value={currency} onValueChange={setCurrency}>
							<SelectTrigger
								id="currency"
								className="h-12 rounded-xl border border-slate-200 bg-white text-left text-base font-medium text-slate-800 shadow-sm hover:border-slate-300"
							>
								<SelectValue placeholder="Select currency" />
							</SelectTrigger>
							<SelectContent className="rounded-xl border border-slate-200/80 bg-white/95 shadow-lg">
								{CURRENCIES.map((curr) => (
									<SelectItem key={curr.code} value={curr.code}>
										{curr.name}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
						<p className="text-xs text-slate-500">
							This will update all currency displays throughout the app
						</p>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	)
}

