import { Atom } from '@effect-atom/atom'
import { Result, useAtom } from '@effect-atom/atom-react'
import {
	AlertTriangle,
	Check,
	Copy,
	Settings as SettingsIcon,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select'
import {
	currencyAtom,
	exportDataAtom,
	importDataAtom,
	languageAtom,
	pixKeyAtom,
} from '../store/atoms'

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

const LANGUAGES = [
	{ code: 'pt-BR', name: 'Português' },
	{ code: 'en', name: 'English' },
]

export function SettingsModal() {
	const { t } = useTranslation()
	const [currency, setCurrency] = useAtom(currencyAtom)
	const [language, setLanguage] = useAtom(languageAtom)
	const [pixKey, setPixKey] = useAtom(pixKeyAtom)
	const [open, setOpen] = useState(false)
	const [importText, setImportText] = useState<string>('')
	const [copied, setCopied] = useState(false)

	const [exportDataResult, exportData] = useAtom(exportDataAtom)
	const [importDataResult, importData] = useAtom(importDataAtom)

	const [showErrorDialog, setShowErrorDialog] = useState(false)
	const [errorMessage, setErrorMessage] = useState('')
	const [showImportConfirmDialog, setShowImportConfirmDialog] = useState(false)

	const prevCurrencyRef = useRef(currency)
	const prevPixKeyRef = useRef(pixKey)

	// Track changes to currency and pixKey and show toast
	useEffect(() => {
		if (
			prevCurrencyRef.current !== currency &&
			prevCurrencyRef.current !== ''
		) {
			toast.success(t('settings.currencyUpdated'), {
				description: t('settings.currencyChangedTo', { currency }),
				id: 'settings:currency-updated',
			})
		}
		prevCurrencyRef.current = currency
	}, [currency, t])

	useEffect(() => {
		if (prevPixKeyRef.current !== pixKey && prevPixKeyRef.current !== null) {
			toast.success(t('settings.pixKeyUpdated'), {
				description: pixKey
					? t('settings.pixKeySaved')
					: t('settings.pixKeyCleared'),
				id: 'settings:pix-key-updated',
			})
		}
		prevPixKeyRef.current = pixKey
	}, [pixKey, t])

	const handleExport = () => {
		try {
			exportData(undefined)
			toast.success(t('settings.dataGenerated'), {
				description: t('settings.readyToCopy'),
				id: 'settings:export-data-generated',
			})
		} catch (error) {
			setErrorMessage(
				t('settings.failedToExport') +
					': ' +
					(error instanceof Error ? error.message : 'Unknown error')
			)
			setShowErrorDialog(true)
		}
	}

	const handleImport = () => {
		if (!importText.trim()) {
			setErrorMessage(t('settings.pasteExportText'))
			setShowErrorDialog(true)
			return
		}

		setShowImportConfirmDialog(true)
	}

	const confirmImport = () => {
		try {
			importData({ dataString: importText.trim() })
			toast.success(t('settings.dataImported'), {
				description: t('settings.importSuccess'),
				id: 'settings:data-imported',
			})
			setImportText('')
			setOpen(false)
			setShowImportConfirmDialog(false)
		} catch (error) {
			setErrorMessage(
				t('settings.failedToImport') +
					': ' +
					(error instanceof Error ? error.message : 'Unknown error')
			)
			setShowErrorDialog(true)
			setShowImportConfirmDialog(false)
		}
	}

	const copyToClipboard = async () => {
		if (!Result.isSuccess(exportDataResult)) return
		try {
			await navigator.clipboard.writeText(exportDataResult.value)
			setCopied(true)
			setTimeout(() => setCopied(false), 2000)
			toast.success(t('settings.copiedToClipboard'), {
				description: t('settings.exportTextCopied'),
			})
		} catch {
			console.error('Failed to copy export text to clipboard')
		}
	}

	return (
		<>
			<Dialog
				open={open}
				onOpenChange={(isOpen) => {
					setOpen(isOpen)
					if (!isOpen) {
						exportData(Atom.Reset)
					}
				}}
			>
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
				<DialogContent className="sm:max-w-md max-h-[90vh] flex flex-col rounded-xl border-none bg-white/95 shadow-xl ring-1 ring-slate-200/70 backdrop-blur">
					<DialogHeader className="shrink-0">
						<DialogTitle className="text-xl font-semibold text-slate-900">
							{t('settings.title')}
						</DialogTitle>
						<DialogDescription className="text-sm text-slate-500">
							{t('settings.subtitle')}
						</DialogDescription>
					</DialogHeader>
					<div className="space-y-6 py-4 overflow-y-auto flex-1 min-h-0">
						<div className="space-y-2">
							<Label
								htmlFor="language"
								className="text-sm font-medium text-slate-700"
							>
								{t('app.language')}
							</Label>
							<Select value={language} onValueChange={setLanguage}>
								<SelectTrigger
									id="language"
									className="h-12 rounded-xl border border-slate-200 bg-white text-left text-base font-medium text-slate-800 shadow-sm hover:border-slate-300"
								>
									<SelectValue />
								</SelectTrigger>
								<SelectContent className="rounded-xl border border-slate-200/80 bg-white/95 shadow-lg">
									{LANGUAGES.map((lang) => (
										<SelectItem key={lang.code} value={lang.code}>
											{lang.name}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
						<div className="space-y-2">
							<Label
								htmlFor="currency"
								className="text-sm font-medium text-slate-700"
							>
								{t('settings.currency')}
							</Label>
							<Select value={currency} onValueChange={setCurrency}>
								<SelectTrigger
									id="currency"
									className="h-12 rounded-xl border border-slate-200 bg-white text-left text-base font-medium text-slate-800 shadow-sm hover:border-slate-300"
								>
									<SelectValue placeholder={t('settings.selectCurrency')} />
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
								{t('settings.currencyHint')}
							</p>
						</div>

						<div className="space-y-2">
							<Label
								htmlFor="pixKey"
								className="text-sm font-medium text-slate-700"
							>
								{t('settings.pixKey')}
							</Label>
							<Input
								id="pixKey"
								type="text"
								value={pixKey || ''}
								onChange={(e) => setPixKey(e.target.value || null)}
								placeholder={t('settings.pixKeyPlaceholder')}
								className="h-12 rounded-xl border-slate-200"
							/>
							<p className="text-xs text-slate-500">
								{t('settings.pixKeyHint')}
							</p>
						</div>

						<div className="border-t border-slate-200 pt-4">
							<Label className="text-sm font-medium text-slate-700">
								{t('settings.dataManagement')}
							</Label>
							<p className="text-xs text-slate-500 mb-4">
								{t('settings.dataManagementHint')}
							</p>

							{/* Export Section */}
							<div className="space-y-2 mb-4">
								<Button
									onClick={handleExport}
									disabled={exportDataResult.waiting}
									className="w-full h-10 rounded-xl bg-slate-900 text-white hover:bg-slate-800"
								>
									{t('settings.generateExport')}
								</Button>
								{Result.isSuccess(exportDataResult) && (
									<div className="space-y-2">
										<div className="flex items-center justify-between">
											<Label className="text-xs font-medium text-slate-700">
												{t('settings.exportText')}
											</Label>
											<Button
												onClick={copyToClipboard}
												size="sm"
												variant="ghost"
												className="h-8 text-xs"
											>
												{copied ? (
													<>
														<Check className="mr-1 h-3 w-3" />
														{t('pix.copied')}
													</>
												) : (
													<>
														<Copy className="mr-1 h-3 w-3" />
														{t('pix.copy')}
													</>
												)}
											</Button>
										</div>
										<textarea
											readOnly
											value={exportDataResult.value}
											className="w-full h-32 rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs font-mono text-slate-800 resize-none focus:outline-none focus:ring-2 focus:ring-slate-300"
											onClick={(e) =>
												(e.target as HTMLTextAreaElement).select()
											}
										/>
									</div>
								)}
							</div>

							{/* Import Section */}
							<div className="space-y-2">
								<Label className="text-xs font-medium text-slate-700">
									{t('settings.importText')}
								</Label>
								<textarea
									value={importText}
									onChange={(e) => setImportText(e.target.value)}
									placeholder={t('settings.importTextPlaceholder')}
									className="w-full h-32 rounded-lg border border-slate-200 bg-white p-3 text-xs font-mono text-slate-800 resize-none focus:outline-none focus:ring-2 focus:ring-slate-300"
								/>
								<Button
									onClick={handleImport}
									disabled={!importText.trim() || importDataResult.waiting}
									variant="outline"
									className="w-full h-10 rounded-xl border border-slate-200 bg-white text-slate-800 hover:bg-slate-50"
								>
									{t('settings.importData')}
								</Button>
							</div>
						</div>
					</div>
				</DialogContent>
			</Dialog>
			{/* Error Dialog */}
			<Dialog open={showErrorDialog} onOpenChange={setShowErrorDialog}>
				<DialogContent className="sm:max-w-md rounded-xl border-none bg-white/95 shadow-xl ring-1 ring-slate-200/70 backdrop-blur">
					<DialogHeader>
						<DialogTitle className="flex items-center gap-2 text-xl font-semibold text-slate-900">
							<AlertTriangle className="h-5 w-5 text-red-500" />
							{t('settings.error')}
						</DialogTitle>
						<DialogDescription className="text-sm text-slate-500">
							{errorMessage}
						</DialogDescription>
					</DialogHeader>
					<DialogFooter>
						<Button
							onClick={() => setShowErrorDialog(false)}
							className="rounded-xl bg-slate-900 text-white hover:bg-slate-800"
						>
							{t('item.ok')}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Import Confirmation Dialog */}
			<Dialog
				open={showImportConfirmDialog}
				onOpenChange={setShowImportConfirmDialog}
			>
				<DialogContent className="sm:max-w-md rounded-xl border-none bg-white/95 shadow-xl ring-1 ring-slate-200/70 backdrop-blur">
					<DialogHeader>
						<DialogTitle className="text-xl font-semibold text-slate-900">
							{t('settings.confirmImport')}
						</DialogTitle>
						<DialogDescription className="text-sm text-slate-500">
							{t('settings.confirmImportMessage')}
						</DialogDescription>
					</DialogHeader>
					<DialogFooter className="flex gap-2">
						<Button
							onClick={() => setShowImportConfirmDialog(false)}
							variant="outline"
							className="rounded-xl"
						>
							{t('group.cancel')}
						</Button>
						<Button
							onClick={confirmImport}
							disabled={importDataResult.waiting}
							className="rounded-xl bg-red-600 text-white hover:bg-red-700"
						>
							{importDataResult.waiting ? t('settings.importing') : t('settings.import')}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	)
}
