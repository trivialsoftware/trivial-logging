//----------------------------------------------------------------------------------------------------------------------
// Trivial Logging
//
// @module
//----------------------------------------------------------------------------------------------------------------------

var path = require('path');

var _ = require('lodash');
var logging = require('bunyan');

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

    init(config={})
    {
        // Pull out the streams config, with sane defaults.
        var streams = ((config.logging || config).streams) || this.streams;

        this.streams = _.map(streams, (stream) =>
        {
            // We only _ever_ override the process.stdout steam.
            if(stream.stream == process.stdout)
            {
                // Override the level if `LOG_LEVEL` is set
                var level = process.env.LOG_LEVEL || stream.level;

                // Override the logging level if `config.debug` is set
                stream.level = config.debug ? 'debug' : level;
            } // end if

            return stream;
        });

        // Store a generic root logger.
        this.setRootLogger();
    } // end init

    setRootLogger(name='root', options)
    {
        this.root = this.getLogger(name, options);
    } // end setRootLogger

    getLogger(name, options)
    {
        options = _.assign({
            name,
            streams: this.streams
        }, options);

        return logging.createLogger(options);
    } // end getLogger

    loggerFor(obj)
    {
        var filename;
        if(typeof obj == 'object' && obj.constructor.name == 'Module')
        {
            filename = obj.filename;
        }
        else if(typeof obj == 'string')
        {
            filename = obj;
        } // end if

        var moduleName = path.relative(this.mainDir, filename);

        if(!this.root)
        {
            this.setRootLogger();
        } //end if

        // Create a child logger, specifying the module we're logging for.
        return this.root.child({ module: moduleName })
    } // end loggerFor
} // end LoggingService

//----------------------------------------------------------------------------------------------------------------------

module.exports = new LoggingService();

//----------------------------------------------------------------------------------------------------------------------
