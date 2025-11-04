'use client'

import { useCallback } from 'react'
import { toast } from 'sonner'
import { useClipboard } from './useClipboard'
import { useIsMobile } from './useIsMobile'
import { useWebShare } from './useWebShare'

interface UseMultiShareOptions {
	/**
	 * Translation keys or message strings for toast notifications
	 */
	messages: {
		shareSuccess: string
		shareSuccessDescription: string
		shareCopied: string
		shareCopiedDescription: string
		shareError: string
		shareErrorDescription: string
	}
}

interface ShareOptions {
	text: string
	title?: string
}

export const useMultiShare = (options: UseMultiShareOptions) => {
	const { isMobile } = useIsMobile()
	const { share, canShare, isSupported: isWebShareSupported } = useWebShare()
	const { copy: copyToClipboard } = useClipboard()

	const shareContent = useCallback(
		async ({ text, title }: ShareOptions) => {
			try {
				// Use Web Share API on mobile if supported
				if (isMobile && isWebShareSupported) {
					if (canShare({ text })) {
						await share({
							title,
							text,
						})
						toast.success(options.messages.shareSuccess, {
							description: options.messages.shareSuccessDescription,
						})
						return
					}
				}

				// Fallback to clipboard (desktop or if Web Share not supported)
				const success = await copyToClipboard(text)
				if (success) {
					toast.success(options.messages.shareCopied, {
						description: options.messages.shareCopiedDescription,
					})
				}
			} catch (error) {
				// If user cancels share dialog, don't show error
				if (error instanceof Error && error.name === 'AbortError') {
					return
				}
				// Try clipboard as fallback
				const success = await copyToClipboard(text)
				if (success) {
					toast.success(options.messages.shareCopied, {
						description: options.messages.shareCopiedDescription,
					})
				} else {
					toast.error(options.messages.shareError, {
						description: options.messages.shareErrorDescription,
					})
				}
			}
		},
		[
			isMobile,
			isWebShareSupported,
			share,
			canShare,
			copyToClipboard,
			options.messages,
		]
	)

	return {
		share: shareContent,
	}
}

export default useMultiShare
