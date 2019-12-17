//----------------------------------------------------------------------------------------------------------------------
// Trivial Logging
//----------------------------------------------------------------------------------------------------------------------

import { inspect } from 'util';
import path from 'path';

// Pino
import pino from 'pino';

// Interfaces
import { TrivialLogger } from './lib/interfaces/logger';
import { LoggingConfig } from './lib/interfaces/config';
import { LoggableError } from './lib/interfaces/error.js';

// Null TrivialLogger
import { NullLogger } from './lib/nullLogger';

//----------------------------------------------------------------------------------------------------------------------

// Try to import pino-pretty, and if we fail, we disable that functionality.
let havePinoPretty = true;
try { require('pino-pretty'); }
catch (_) { havePinoPretty = false; }

//----------------------------------------------------------------------------------------------------------------------

/**
 * The main Trivial Logging api.
 *
 * This is a simple wrapper around [pino](https://getpino.io), which provides some very basic convenience. It's designed
 * to be a near drop-in replacement to [omega-logger][1], which in turn is based off of python's logging module.
 *
 * When I say a simple wrapper, I mean it's ~150 lines of code in my very verbose coding style. Mostly, it adds a
 * simple way to configure [pino](https://getpino.io), as well as the ability to trivially create loggers for modules.
 *
 * [1]: https://github.com/Morgul/omega-logger "gh:morgul/omega-logger"
 */
export class TrivialLogging
{
    constructor()
    {
        try
        {
            this.mainDir = path.dirname((require.main || {}).filename || '');
        }
        catch (err)
        {
            // If you're requiring this from an interactive session, use the current working directory instead.
            this.mainDir = process.cwd();
        } // end try

        this._config = {
            nullLogger: !!process.env.LOG_NULL,
            options: {
                level: (process.env.LOG_LEVEL || 'debug').toLowerCase()
            }
        };

        // Set a root logger
        this.root = this.setRootLogger();
    } // end constructor

    //------------------------------------------------------------------------------------------------------------------
    // Properties
    //------------------------------------------------------------------------------------------------------------------

    /**
     * Internal config.
     */
    private _config : LoggingConfig;

    /**
     * The root directory of the project, as detected by Trivial Logging.
     */
    public mainDir : string;

    /**
     * The root logger.
     */
    public root : TrivialLogger;

    //------------------------------------------------------------------------------------------------------------------

    /**
     * Gets a reference to the root logger.
     *
     * @returns A reference to the root logger.
     */
    public get logger() : TrivialLogger { return this.root; }

    //------------------------------------------------------------------------------------------------------------------

    private _modLogger(logger : TrivialLogger) : TrivialLogger
    {
        if(!logger.dump)
        {
            logger.dump = this.dump;
        } // end if

        // Modify logger functions to handle errors correctly.
        this._modLogFunc('warn', logger);
        this._modLogFunc('error', logger);

        return logger;
    } // end _modLogger

    private _modLogFunc(funcName, logger) : void
    {
        const origFunc = logger[funcName];
        logger[funcName] = function(...args)
        {
            args = args.map((arg : LoggableError | object | string | number | boolean | null) =>
            {
                if(arg instanceof Error)
                {
                    if(arg.toJSON)
                    {
                        return arg.toJSON();
                    }
                    else
                    {
                        return {
                            code: arg.code,
                            message: arg.message,
                            stack: arg.stack
                        };
                    } // end if
                } // end if

                return arg;
            }); // end map

            // call the original
            origFunc.apply(this, args);
        };
    } // end _modLogFunc

    //------------------------------------------------------------------------------------------------------------------

    /**
     * This sets up all future loggers with a default set of options, as passed by the configuration. If `config.debug`
     * is `true` then we turn on pino [pretty printing][pretty]. (`pino-pretty` must be installed, or this will have no
     * effect!) This allows for beautiful debug logging, without much hassle, while still letting you shut off the
     * pretty output when you deploy.
     *
     * _Note: the `LOG_LEVEL` environment variable **always** overrides what's set in the config._
     *
     * [pretty]: https://getpino.io/#/docs/pretty
     *
     * @param config - a configuration object with the keys `debug`, `nullLogger` and/or `options`.
     */
    public init(config : LoggingConfig = { options: { level: 'debug' } }) : void
    {
        // Build logging config
        config.options = config.options || {};

        // Environment variables need to override config
        this._config = { ...config };
        this._config.nullLogger = !!process.env.LOG_NULL || config.nullLogger || false;
        this._config.options = { ...config.options };
        this._config.options.level = (process.env.LOG_LEVEL || config.level || (config.debug ? 'debug' : 'info')).toLowerCase();

        if(havePinoPretty)
        {
            this._config.options.prettyPrint = config.options.prettyPrint
                || (config.debug ? {
                    errorProps: '*',
                    levelFirst: false,
                    messageKey: 'msg',
                    timestampKey: 'time',
                    translateTime: 'h:MM:ss TT',
                    ignore: 'pid,hostname,moduleName'
                } : false);
        } // end if

        // Store a generic root logger.
        this.setRootLogger();
    } // end init

    /**
     * This creates a root logger that all other loggers are children of. This is called for you if `init()` had not
     * been called previously, and you call either `getLogger` or `loggerFor`. It will be initialized with defaults.
     *
     * @param name - the name of the root logger (default: 'root').
     * @param options - a configuration object to pass to [pino](https://getpino.io/). (default: `config.options` as
     * passed to `init`)
     *
     * @returns A logger instance.
     */
    public setRootLogger(name = 'root', options ?: object) : TrivialLogger
    {
        this.root = this.getLogger(name, options);
        return this.root;
    } // end setRootLogger

    /**
     * This gets a new logger, overriding default configuration options with `options`.
     *
     * @param name - the name of the logger.
     * @param options - a configuration object to pass to [pino](https://getpino.io/). (default: `config.options` as
     * passed to `init`)
     *
     * @returns A logger instance.
     */
    public getLogger(name = 'logger', options ?: object) : TrivialLogger
    {
        options = { ...this._config.options, ...options, name };
        const logger = this._config.nullLogger ? new NullLogger() : pino(options);
        return this._modLogger(logger);
    } // end getLogger

    /**
     * This gets a new child logger of the root logger, appending the metadata to all calls.
     *
     * @param metadata - Additional metadata for the child logger.
     *
     * @returns A logger instance.
     */
    public child(metadata : object | string = {}) : TrivialLogger
    {
        if(typeof metadata === 'string')
        {
            metadata = { metadata };
        } // end if

        const logger = this.root.child(metadata);
        return this._modLogger(logger);
    } // end getLogger

    /**
     * Creates a child logger, appending a `moduleName` object with either the name of the object, or a path to it. (It
     * will attempt to get the filename of the object if the object has a `filename` property.) This makes it most
     * useful for making loggers for module objects, but can be used on any arbitrary object.
     *
     * @param obj - an object to get a logger for, most commonly `module`, but supports any object, or a string.
     *
     * @returns A logger instance.
     */
    public loggerFor(obj : any) : TrivialLogger
    {
        let filename;
        if(typeof obj === 'object' && obj.constructor.name === 'Module')
        {
            filename = obj.filename;
        }
        else if(typeof obj === 'string')
        {
            filename = obj;
        } // end if

        // Create a child logger, specifying the module we're logging for.
        const moduleName = path.relative(this.mainDir, filename);

        return !this.root ? this.setRootLogger(moduleName) : this.root.child({ moduleName });
    } // end loggerFor

    /**
     * This is basically just a wrapper around
     * [util.inspect](https://nodejs.org/api/util.html#util_util_inspect_object_options). It's here for convenience,
     * but doesn't have the same flexibility as `util.inspect`, so should only be used sparingly. \
     *
     * _Note: This is added to all logging instances for your convenience._
     *
     * @param obj - the object you wish to print
     * @param colors - should the object be printed with color escapes (default: `true`)
     * @param depth - how deeply nested should we print the properties of the object (default: `null`)
     * @param showHidden - should we print hidden properties (default: `false`)
     *
     * @returns A formatted string version of the object.
     */
    public dump(obj : object, colors = true, depth : number | null = null, showHidden = false) : string
    {
        return inspect(obj, { colors, depth, showHidden });
    } // end dump
} // end TrivialLogger

//----------------------------------------------------------------------------------------------------------------------

const logging = new TrivialLogging();

export { TrivialLogger, LoggingConfig, NullLogger };
export default logging;
module.exports = logging;

//----------------------------------------------------------------------------------------------------------------------
