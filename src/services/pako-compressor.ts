import { Effect, Layer } from 'effect'
import pako from 'pako'
import { CompressionError, Compressor } from './compressor'

/**
 * Pako compressor service layer implementation
 * Provides compress and decompress functions using pako (gzip)
 */
export const PakoCompressorLive = Layer.effect(
	Compressor,
	Effect.gen(function* () {
		const compress = (data: string) =>
			Effect.gen(function* () {
				const compressed = yield* Effect.try({
					try: () => pako.deflate(data),
					catch: (cause) =>
						new CompressionError({
							message: 'Failed to compress data',
							cause,
						}),
				})

				let binaryString = ''
				const chunkSize = 8192
				for (let i = 0; i < compressed.length; i += chunkSize) {
					const chunk = compressed.slice(i, i + chunkSize)
					binaryString += String.fromCharCode(...chunk)
				}
				const base64 = btoa(binaryString)

				return base64
			})

		const decompress = (compressedData: string) =>
			Effect.gen(function* () {
				const binaryString = atob(compressedData)
				const bytes = new Uint8Array(binaryString.length)
				for (let i = 0; i < binaryString.length; i++) {
					bytes[i] = binaryString.charCodeAt(i)
				}

				const decompressedBytes = yield* Effect.try({
					try: () => pako.inflate(bytes),
					catch: (cause) =>
						new CompressionError({
							message: 'Failed to decompress data',
							cause,
						}),
				})

				const decompressed = new TextDecoder().decode(decompressedBytes)

				return decompressed
			})

		return Compressor.of({
			compress,
			decompress,
		})
	})
)
