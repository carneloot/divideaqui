import { useAtomValue } from '@effect-atom/atom-react'
import { Check, Copy, QrCode } from 'lucide-react'
import { createStaticPix, hasError } from 'pix-utils'
import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { currencyAtom, pixKeyAtom, selectedGroupAtom } from '../store/atoms'
import type { Person } from '../types'

interface PixExportDialogProps {
	person: Person
	amount: number
	open: boolean
	onOpenChange: (open: boolean) => void
}

export function PixExportDialog({
	person,
	amount,
	open,
	onOpenChange,
}: PixExportDialogProps) {
	const { t, i18n } = useTranslation()
	const pixKey = useAtomValue(pixKeyAtom)
	const currency = useAtomValue(currencyAtom)
	const group = useAtomValue(selectedGroupAtom)
	const [copied, setCopied] = useState(false)
	const [qrCodeImage, setQrCodeImage] = useState<string | null>(null)

	const currencyFormatter = useMemo(
		() =>
			new Intl.NumberFormat(i18n.language === 'en' ? 'en-US' : i18n.language, {
				style: 'currency',
				currency,
			}),
		[currency, i18n.language]
	)

	// Generate PIX code
	const pixData = useMemo(() => {
		if (!pixKey) return null

		try {
			const pix = createStaticPix({
				merchantName: group?.name || '',
				merchantCity: 'Sao Paulo', // Default city, user can customize if needed
				pixKey: pixKey,
				transactionAmount: amount,
				infoAdicional: group?.name,
			})

			if (hasError(pix)) {
				return null
			}

			return {
				brCode: pix.toBRCode(),
				pix: pix,
			}
		} catch (error) {
			console.error('Error generating PIX:', error)
			return null
		}
	}, [pixKey, amount, group])

	// Generate QR code image asynchronously
	useEffect(() => {
		if (!pixData?.pix) {
			setQrCodeImage(null)
			return
		}

		const generateImage = async () => {
			try {
				const image = await pixData.pix.toImage()
				setQrCodeImage(image)
			} catch (error) {
				console.error('Error generating QR code image:', error)
				setQrCodeImage(null)
			}
		}

		generateImage()
	}, [pixData])

	const copyBrCode = async () => {
		if (!pixData?.brCode) return
		try {
			await navigator.clipboard.writeText(pixData.brCode)
			setCopied(true)
			setTimeout(() => setCopied(false), 2000)
		} catch {
			console.error('Failed to copy PIX code to clipboard')
		}
	}

	const downloadQrCode = () => {
		if (!qrCodeImage) return
		const link = document.createElement('a')
		link.href = qrCodeImage
		link.download = `pix-${person.name.replace(/\s+/g, '-')}-${amount}.png`
		document.body.appendChild(link)
		link.click()
		document.body.removeChild(link)
	}

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="rounded-xl border-none bg-card shadow-xl ring-1 ring-ring backdrop-blur sm:max-w-md">
				<DialogHeader>
					<DialogTitle className="font-semibold text-foreground text-xl">
						{t('pix.paymentFor', { name: person.name })}
					</DialogTitle>
					<DialogDescription className="text-muted-foreground text-sm">
						{t('pix.amount')}: {currencyFormatter.format(amount)}
					</DialogDescription>
				</DialogHeader>
				<div className="space-y-6 py-4">
					{!pixData ? (
						<p className="text-destructive text-sm">
							{t('pix.errorGenerating')}
						</p>
					) : (
						<>
							{/* Copy and Paste Code */}
							<div className="space-y-2">
								<div className="flex items-center justify-between">
									<Label className="font-medium text-foreground text-sm">
										{t('pix.copyAndPaste')}
									</Label>
									<Button
										onClick={copyBrCode}
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
									value={pixData.brCode}
									className="h-32 w-full resize-none rounded-lg border border-input bg-muted p-3 font-mono text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-ring"
									onClick={(e) => (e.target as HTMLTextAreaElement).select()}
								/>
							</div>

							{/* QR Code */}
							<div className="space-y-2">
								<div className="flex items-center justify-between">
									<Label className="font-medium text-foreground text-sm">
										{t('pix.qrCode')}
									</Label>
									{qrCodeImage && (
										<Button
											onClick={downloadQrCode}
											size="sm"
											variant="ghost"
											className="h-8 text-xs"
										>
											<QrCode className="mr-1 h-3 w-3" />
											{t('pix.download')}
										</Button>
									)}
								</div>
								<div className="flex min-h-[200px] items-center justify-center rounded-lg border border-input bg-muted p-4">
									{qrCodeImage ? (
										<img
											src={qrCodeImage}
											alt="PIX QR Code"
											className="h-auto max-w-full"
										/>
									) : (
										<p className="text-muted-foreground text-sm">
											{t('pix.generatingQrCode')}
										</p>
									)}
								</div>
							</div>
						</>
					)}
				</div>
			</DialogContent>
		</Dialog>
	)
}
