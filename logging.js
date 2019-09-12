//----------------------------------------------------------------------------------------------------------------------
// Trivial Logging
//----------------------------------------------------------------------------------------------------------------------

const { inspect } = require('util');
const path = require('path');

// Pino
const pino = require('pino');

// Null Logger
const NullLogger = require('./lib/nullLogger');

//----------------------------------------------------------------------------------------------------------------------

// Try to import pino-pretty, and if we fail, we disable that functionality.
let havePinoPretty = true;
try { require('pino-pretty'); }
catch(_) { havePinoPretty = false; }

//----------------------------------------------------------------------------------------------------------------------

class LoggingService {
    constructor()
    {
        try
        {
            this.mainDir = path.dirname(require.main.filename);
        }
        catch(err)
        {
            // If you're requiring this from an interactive session, use the current working directory instead.
            this.mainDir = process.cwd();
        } // end try

        this._config = {
            nullLogger: !!process.env.LOG_NULL,
            options: {
                level: (process.env.LOG_LEVEL || 'debug').toLowerCase()
            },
        };
    } // end constructor

    _modLogger(logger)
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

    _modLogFunc(funcName, logger)
    {
        const origFunc = logger[funcName];
        logger[funcName] = function (...args)
        {
            args = args.map((arg) =>
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

    init(config = { options: { level: 'debug' } })
    {
        // Build logging config
        config.options = config.options || {};

        // Environment variables need to override config
        this._config = Object.assign({}, config);
        this._config.nullLogger = !!process.env.LOG_NULL || config.nullLogger || false;
        this._config.options = Object.assign({}, config.options);
        this._config.options.level = (process.env.LOG_LEVEL || config.level || (config.debug ? 'debug' : 'info')).toLowerCase();

        if(havePinoPretty)
        {
            this._config.options.prettyPrint = config.options.prettyPrint
                || (!!config.debug ? {
                    errorProps: '*',
                    levelFirst: false,
                    messageKey: 'msg',
                    timestampKey: 'time',
                    translateTime: 'h:MM:ss TT',
                    ignore: 'pid,hostname'
                } : false);
        } // end if

        // Store a generic root logger.
        this.setRootLogger();
    } // end init

    setRootLogger(name = 'root', options)
    {
        this.root = this._modLogger(this.getLogger(name, options));
    } // end setRootLogger

    getLogger(name, options)
    {
        options = Object.assign({}, this._config.options, options, { name });

        const logger = this._config.nullLogger ? new NullLogger(name, options) : pino(options);
        return this._modLogger(logger);
    } // end getLogger

    loggerFor(obj)
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

        if(!this.root)
        {
            this.setRootLogger();
        } //end if

        // Create a child logger, specifying the module we're logging for.
        const moduleName = path.relative(this.mainDir, filename);
        return this.getLogger(moduleName);
    } // end loggerFor

    dump(obj, colors=true, depth=null, showHidden=false)
    {
        return inspect(obj, { colors, depth, showHidden });
    } // end dump
} // end LoggingService

//----------------------------------------------------------------------------------------------------------------------

module.exports = new LoggingService();

//----------------------------------------------------------------------------------------------------------------------
