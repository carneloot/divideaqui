import { useAtomValue } from '@effect-atom/atom-react'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { currencyAtom } from '../store/settings'

export function useCurrencyFormatter() {
	const { i18n } = useTranslation()
	const currency = useAtomValue(currencyAtom)

	return useMemo(
		() =>
			new Intl.NumberFormat(i18n.language === 'en' ? 'en-US' : i18n.language, {
				style: 'currency',
				currency,
			}),
		[currency, i18n.language]
	)
}
