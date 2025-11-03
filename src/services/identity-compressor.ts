import { Effect, Layer } from 'effect'
import { Compressor } from './compressor'

export const IdentityCompressorLive = Layer.effect(
	Compressor,
	Effect.gen(function* () {
		return Compressor.of({
			compress: (data) => Effect.succeed(data),
			decompress: (data) => Effect.succeed(data),
		})
	})
)
