//----------------------------------------------------------------------------------------------------------------------
// An empty logger.
//----------------------------------------------------------------------------------------------------------------------

import { inspect } from 'util';
import { TrivialLogger } from './interfaces/logger';
import { EventEmitter } from 'events';

//----------------------------------------------------------------------------------------------------------------------

/**
 * The null logger.
 *
 * This logger is, in essence, an 'empty' logger, which should be compliant with the logging interface, but also be, in
 * essence, a no-op for everything.
 */
export class NullLogger extends EventEmitter implements TrivialLogger
{
    customLevels = {};
    level = 'info';
    LOG_VERSION = 1;
    version = '1.0.0'

    bindings() : Record<string, unknown> { return {}; }

    child() : any { return new NullLogger() as any; }

    flush() : void { return undefined; }

    isLevelEnabled() : boolean { return false; }

    levelVal = 30;

    levels = { values: {}, labels: {} };

    pino = '5.13.1';

    useLevelLabels = false;

    useOnlyCustomLevels = false;

    // Logging API
    silent() : void { return undefined; }
    trace() : void { return undefined; }
    debug() : void { return undefined; }
    info() : void { return undefined; }
    warn() : void { return undefined; }
    error() : void { return undefined; }
    fatal() : void { return undefined; }

    addLevel() : boolean
    {
        return false;
    }

    dump(obj : Record<string, unknown>, colors = true, depth : number | null = null, showHidden = false) : string
    {
        return inspect(obj, { colors, depth, showHidden });
    } // end dump
} // end NullLogger

//----------------------------------------------------------------------------------------------------------------------
