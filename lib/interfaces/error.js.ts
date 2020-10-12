// ---------------------------------------------------------------------------------------------------------------------
// TrivialLogging Error
// ---------------------------------------------------------------------------------------------------------------------

export interface Loggable
{
	code ?: string;
	toJSON ?: () => Record<string, unknown>;
}

export type LoggableError = Error & Loggable;

// ---------------------------------------------------------------------------------------------------------------------
