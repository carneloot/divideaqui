'use client'

import { useCallback } from 'react'

interface ShareData {
	title?: string
	text?: string
	url?: string
}

interface UseWebShareReturn {
	share: (data: ShareData) => Promise<void>
	canShare: (data: ShareData) => boolean
	isSupported: boolean
}

export const useWebShare = (): UseWebShareReturn => {
	const isSupported =
		typeof navigator !== 'undefined' &&
		'navigator' in window &&
		'share' in navigator

	const share = useCallback(
		async (data: ShareData) => {
			if (!isSupported) {
				throw new Error('Web Share API is not supported in this browser.')
			}

			await navigator.share(data)
		},
		[isSupported]
	)

	const canShare = useCallback(
		(data: ShareData) => {
			if (!isSupported) {
				return false
			}

			if (!('canShare' in navigator)) {
				return false
			}

			return navigator.canShare(data)
		},
		[isSupported]
	)

	return {
		share,
		canShare,
		isSupported,
	}
}

export default useWebShare
