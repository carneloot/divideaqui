import { Data, Effect } from 'effect'

export class CompressionError extends Data.TaggedError('CompressionError')<{
	message: string
	cause: unknown
}> {}

export class Compressor extends Effect.Tag('Compressor')<
	Compressor,
	{
		compress: (data: string) => Effect.Effect<string, CompressionError>
		decompress: (
			compressedData: string
		) => Effect.Effect<string, CompressionError>
	}
>() {}
