'use client'

import { useCallback, useEffect, useState } from 'react'

interface UseClipboardReturn {
	copy: (text: string) => Promise<boolean>
	copied: boolean
	error: string | null
}

export const useClipboard = (): UseClipboardReturn => {
	const [copied, setCopied] = useState(false)
	const [error, setError] = useState<string | null>(null)

	const copy = useCallback(async (text: string): Promise<boolean> => {
		if (!navigator?.clipboard) {
			const errorMsg = 'Clipboard API is not supported in this browser.'
			setError(errorMsg)
			return false
		}

		try {
			await navigator.clipboard.writeText(text)
			setCopied(true)
			setError(null)
			return true
		} catch (err) {
			const errorMsg =
				err instanceof Error ? err.message : 'Failed to copy to clipboard'
			setError(errorMsg)
			setCopied(false)
			return false
		}
	}, [])

	useEffect(() => {
		if (copied) {
			const timer = setTimeout(() => {
				setCopied(false)
			}, 2000)
			return () => clearTimeout(timer)
		}
	}, [copied])

	return {
		copy,
		copied,
		error,
	}
}

export default useClipboard
