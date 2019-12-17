// ---------------------------------------------------------------------------------------------------------------------
// TrivialLogging Config
// ---------------------------------------------------------------------------------------------------------------------

interface ConfigOptions
{
	level ?: string;
	prettyPrint ?: boolean | object;
} // end ConfigOptions

export interface LoggingConfig
{
	debug ?: boolean;
	nullLogger ?: boolean;
	level ?: string;
	options ?: ConfigOptions;
} // end LoggingConfig

// ---------------------------------------------------------------------------------------------------------------------
