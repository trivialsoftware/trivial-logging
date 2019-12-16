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

    private _config : LoggingConfig;
    public mainDir : string;
    public root : TrivialLogger;

    //------------------------------------------------------------------------------------------------------------------

    get logger() : TrivialLogger { return this.root; }

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

    public setRootLogger(name = 'root', options ?: object) : TrivialLogger
    {
        this.root = this.getLogger(name, options);
        return this.root;
    } // end setRootLogger

    public getLogger(name = 'logger', options ?: object) : TrivialLogger
    {
        options = { ...this._config.options, ...options, name };
        const logger = this._config.nullLogger ? new NullLogger() : pino(options);
        return this._modLogger(logger);
    } // end getLogger

    public child(metadata : object | string = {}) : TrivialLogger
    {
        if(typeof metadata === 'string')
        {
            metadata = { metadata };
        } // end if

        const logger = this.root.child(metadata);
        return this._modLogger(logger);
    } // end getLogger

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
