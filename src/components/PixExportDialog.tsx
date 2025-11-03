import { useAtomValue } from '@effect-atom/atom-react'
import { Check, Copy, QrCode } from 'lucide-react'
import { createStaticPix, hasError } from 'pix-utils'
import { useEffect, useMemo, useState } from 'react'
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
	const pixKey = useAtomValue(pixKeyAtom)
	const currency = useAtomValue(currencyAtom)
	const group = useAtomValue(selectedGroupAtom)
	const [copied, setCopied] = useState(false)
	const [qrCodeImage, setQrCodeImage] = useState<string | null>(null)

	const currencyFormatter = useMemo(
		() => new Intl.NumberFormat('en-US', { style: 'currency', currency }),
		[currency]
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
			<DialogContent className="sm:max-w-md rounded-xl border-none bg-white/95 shadow-xl ring-1 ring-slate-200/70 backdrop-blur">
				<DialogHeader>
					<DialogTitle className="text-xl font-semibold text-slate-900">
						PIX Payment for {person.name}
					</DialogTitle>
					<DialogDescription className="text-sm text-slate-500">
						Amount: {currencyFormatter.format(amount)}
					</DialogDescription>
				</DialogHeader>
				<div className="space-y-6 py-4">
					{!pixData ? (
						<p className="text-sm text-red-600">
							Error generating PIX code. Please check your PIX key in settings.
						</p>
					) : (
						<>
							{/* Copy and Paste Code */}
							<div className="space-y-2">
								<div className="flex items-center justify-between">
									<Label className="text-sm font-medium text-slate-700">
										Copia e Cola (Copy and Paste)
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
												Copied!
											</>
										) : (
											<>
												<Copy className="mr-1 h-3 w-3" />
												Copy
											</>
										)}
									</Button>
								</div>
								<textarea
									readOnly
									value={pixData.brCode}
									className="w-full h-32 rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs font-mono text-slate-800 resize-none focus:outline-none focus:ring-2 focus:ring-slate-300"
									onClick={(e) => (e.target as HTMLTextAreaElement).select()}
								/>
							</div>

							{/* QR Code */}
							<div className="space-y-2">
								<div className="flex items-center justify-between">
									<Label className="text-sm font-medium text-slate-700">
										QR Code
									</Label>
									{qrCodeImage && (
										<Button
											onClick={downloadQrCode}
											size="sm"
											variant="ghost"
											className="h-8 text-xs"
										>
											<QrCode className="mr-1 h-3 w-3" />
											Download
										</Button>
									)}
								</div>
								<div className="flex items-center justify-center rounded-lg border border-slate-200 bg-slate-50 p-4 min-h-[200px]">
									{qrCodeImage ? (
										<img
											src={qrCodeImage}
											alt="PIX QR Code"
											className="max-w-full h-auto"
										/>
									) : (
										<p className="text-sm text-slate-500">
											Generating QR Code...
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
