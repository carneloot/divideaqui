import { useAtomValue } from '@effect-atom/atom-react'
import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { languageAtom } from '../store/atoms'

export function LanguageSync() {
	const language = useAtomValue(languageAtom)
	const { i18n } = useTranslation()

	useEffect(() => {
		void i18n.changeLanguage(language)
	}, [language, i18n])

	// Update HTML lang attribute
	useEffect(() => {
		document.documentElement.lang = language
	}, [language])

	return null
}

