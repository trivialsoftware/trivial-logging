//----------------------------------------------------------------------------------------------------------------------
// nullLogger.js - Brief description for nullLogger.js module.
//
// @module
//----------------------------------------------------------------------------------------------------------------------

const { EventEmitter } = require('events');

//----------------------------------------------------------------------------------------------------------------------

class NullLogger extends EventEmitter
{
    // Bunyan Properties
    get stdSerializers(){ return {}; }

    // Bunyan API
    child(){ return new NullLogger(); }
    level(){ return 'INFO'; }
    levels(){ return ['INFO']; }
    addSerializers(){}
    addStream(){}
    reopenFileStreams(){}
    close(){}

    // Logging API
    trace(){}
    debug(){}
    info(){}
    warn(){}
    error(){}
    fatal(){}
} // end NullLogger

//----------------------------------------------------------------------------------------------------------------------

module.exports = {
    createLogger(){ return new NullLogger(); }
}; // end exports

//----------------------------------------------------------------------------------------------------------------------
