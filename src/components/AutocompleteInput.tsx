import { useRef, useState } from 'react'
import { Input } from '@/components/ui/input'

interface AutocompleteInputProps
	extends Omit<
		React.ComponentProps<'input'>,
		'onChange' | 'value' | 'onSelect' | 'onKeyDown'
	> {
	value: string
	onChange: (value: string) => void
	suggestions: string[]
	onSelect?: (suggestion: string) => void
	onEnter?: () => void
	filterSuggestions?: (suggestions: string[], inputValue: string) => string[]
}

export function AutocompleteInput({
	value,
	onChange,
	suggestions,
	onSelect,
	onEnter,
	filterSuggestions,
	className,
	...inputProps
}: AutocompleteInputProps) {
	const [showSuggestions, setShowSuggestions] = useState(false)
	const [selectedIndex, setSelectedIndex] = useState(-1)
	const inputRef = useRef<HTMLInputElement>(null)
	const suggestionsRef = useRef<HTMLDivElement>(null)

	// Filter suggestions based on input
	const filteredSuggestions = filterSuggestions
		? filterSuggestions(suggestions, value)
		: value.trim()
			? suggestions.filter((suggestion) =>
					suggestion.toLowerCase().includes(value.toLowerCase())
				)
			: suggestions

	const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
		if (e.key === 'Enter') {
			if (selectedIndex >= 0 && selectedIndex < filteredSuggestions.length) {
				const selected = filteredSuggestions[selectedIndex]
				onChange(selected)
				onSelect?.(selected)
				setShowSuggestions(false)
				setSelectedIndex(-1)
				inputRef.current?.focus()
			} else {
				onEnter?.()
			}
		} else if (e.key === 'ArrowDown') {
			e.preventDefault()
			setSelectedIndex((prev) =>
				prev < filteredSuggestions.length - 1 ? prev + 1 : prev
			)
			if (!showSuggestions && filteredSuggestions.length > 0) {
				setShowSuggestions(true)
			}
		} else if (e.key === 'ArrowUp') {
			e.preventDefault()
			setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1))
		} else if (e.key === 'Escape') {
			setShowSuggestions(false)
			setSelectedIndex(-1)
		}
	}

	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		onChange(e.target.value)
		setShowSuggestions(true)
		setSelectedIndex(-1)
	}

	const handleSuggestionClick = (suggestion: string) => {
		onChange(suggestion)
		onSelect?.(suggestion)
		setShowSuggestions(false)
		setSelectedIndex(-1)
		inputRef.current?.focus()
	}

	// Close suggestions when clicking outside
	const handleBlur = () => {
		// Delay to allow suggestion click to fire
		setTimeout(() => {
			if (!suggestionsRef.current?.contains(document.activeElement)) {
				setShowSuggestions(false)
				setSelectedIndex(-1)
			}
		}, 200)
	}

	const handleFocus = () => {
		if (filteredSuggestions.length > 0) {
			setShowSuggestions(true)
		}
	}

	return (
		<div className="relative flex-1">
			<Input
				{...inputProps}
				ref={inputRef}
				type="text"
				value={value}
				onChange={handleChange}
				onKeyDown={handleKeyPress}
				onFocus={handleFocus}
				onBlur={handleBlur}
				className={className}
			/>
			{showSuggestions && filteredSuggestions.length > 0 && (
				<div
					ref={suggestionsRef}
					className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-xl border border-border bg-background shadow-lg"
					role="listbox"
					aria-label="Suggestions"
				>
					{filteredSuggestions.map((suggestion, index) => (
						<button
							key={suggestion}
							type="button"
							onMouseDown={(e) => {
								// Prevent input blur when clicking suggestion
								e.preventDefault()
							}}
							onClick={() => handleSuggestionClick(suggestion)}
							className={`w-full px-4 py-2 text-left text-sm transition hover:bg-accent ${
								index === selectedIndex
									? 'bg-accent font-medium'
									: 'text-foreground'
							}`}
						>
							{suggestion}
						</button>
					))}
				</div>
			)}
		</div>
	)
}
