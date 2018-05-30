//----------------------------------------------------------------------------------------------------------------------
// Trivial Logging
//
// @module
//----------------------------------------------------------------------------------------------------------------------

const { inspect } = require('util');
const path = require('path');

const _ = require('lodash');
const bunyanDebugStream = require('bunyan-debug-stream');
const colors = require('colors');

let logging = require('bunyan');

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

        // Setup default streams
        this.streams = [
            {
                stream: process.stdout,
                level: process.env.LOG_LEVEL || "debug"
            }
        ];
    } // end constructor

    _modLogger(logger)
    {
        if(!logger.dump)
        {
            logger.dump = this.dump;
        } // end if

        return logger;
    } // end _modLogger

    init(config={})
    {
        // Pull out the streams config, with sane defaults.
        const streams = ((config.logging || config).streams) || this.streams;

        if(config.nullLogger)
        {
            logging = require('./lib/nullLogger');
        } // end if

        this.streams = _.map(streams, (stream) =>
        {
            // We only _ever_ override the process.stdout steam.
            if(stream.stream === process.stdout)
            {
                if(process.env.LOG_LEVEL)
                {
                    // Override the level if `LOG_LEVEL` is set
                    stream.level = process.env.LOG_LEVEL;
                } // end if

                // If 'debug' is true, we do some fancy stuff.
                if(config.debug)
                {
                    // Override the logging level if `config.debug` is set and we are not already at a lower logging
                    // level.
                    if(stream.level.toLowerCase() !== 'trace')
                    {
                        stream.level = config.debug ? 'debug' : stream.level;
                    } // end if

                    // If you have turned on the `debugStream` option, we replace your standard stream with a pretty
                    // debug stream, so you don't have to pipe through the bunyan cli tool.
                    const debugStream = _.get(config, 'debugStream', config.debug);
                    if(debugStream)
                    {
                        stream.type = 'raw';
                        stream.serializers = bunyanDebugStream.serializers;
                        stream.stream = bunyanDebugStream({
                            basepath: this.mainDir,
                            forceColor: true,
                            showPid: false,
                            colors: {
                                'debug': 'white',
                                'info': 'cyan',
                            },
                            prefixers: {
                                module: (moduleName, options) => options.useColor ? colors.white(moduleName) : moduleName
                            }
                        });
                    } // end if
                } // end if
            } // end if

            return stream;
        });

        // Store a generic root logger.
        this.setRootLogger();
    } // end init

    setRootLogger(name='root', options)
    {
        this.root = this._modLogger(this.getLogger(name, options));
    } // end setRootLogger

    getLogger(name, options)
    {
        options = _.assign({
            name,
            streams: this.streams
        }, options);

        return this._modLogger(logging.createLogger(options));
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
        return this._modLogger(this.root.child({ module: moduleName }));
    } // end loggerFor

    dump(obj, colors=true, depth=null, showHidden=false)
    {
        return inspect(obj, { colors, depth, showHidden });
    } // end dump
} // end LoggingService

//----------------------------------------------------------------------------------------------------------------------

module.exports = new LoggingService();

//----------------------------------------------------------------------------------------------------------------------
