# Trivial Logging

This is a simple wrapper around bunyan, which provides some very basic convenience. It's designed to be a near
drop-in replacement to [omega-logger][1], which in turn is based off of python's logging module.

When I say a simple wrapper, I mean it's ~80 lines of code in my very verbose coding style. Mostly, it adds a simple way
to configure bunyan, as well as the ability to trivially create loggers for modules.

[1]: https://github.com/Morgul/omega-logger "gh:morgul/omega-logger"

## Installation

```bash
npm install trivial-logging
```

## Basic Usage

In order to get basic logging going, you don't have to do anything:

```javascript
const logging = require('trivial-logging');
const logger = logging.loggerFor(module);

// This is just a bunyan logger instance
logger.info('Hello, World!');
```

By default, this sets up a single `stdout` stream, logging at either `'debug'`, or whatever you've set the `LOG_LEVEL`
environment variable to.

## Advanced Usage

We support passing in a configuration object to setup your logging streams. Then, all calls to `getLogger()` and/or
`loggerFor()` will use that configuration.

```javascript
const logging = require('trivial-logging');

const config = {
    debug: true,
    logging: {
        streams: [
            {
                stream: process.stdout,
                level: "info"
            }
        ]
    }
};

// This stores the configuration
logging.init(config);

// This gets a basic logger
const basicLogger = logging.getLogger('basic');

// This gets a logger that has some options overridden
const overriddenLogger = logging.getLogger('overridden', { streams: [ /* ... */ ] });
```

#### Usage with Unit Tests

Generally, when you're running unit tests, you don't want most logging. The easiest way to achieve this is by setting the `LOG_LEVEL` environment variable to `'ERROR'`. You can do this at the top of your unit test:

```javascript
// Set `LOG_LEVEL` before importing your code that imports `trivial-logging`
process.env.LOG_LEVEL = 'ERROR';

const { expect } = require('chai');

// ... rest of unit test
```

Make sure that you set `process.env.LOG_LEVEL` _before_ importing any code that imports `trivial-logging`.

## API

### `init(config)`

* `config` - a configuration object with the keys `debug` and/or `streams`.

This sets up all future loggers with a default set of streams, as passed by the configuration. If `debug` is true, it
will force the `stdout` stream to log at _at least_ `DEBUG`, regardless of it's configuration. (This is useful for
debugging.)

In addition, if `debug` is true and `debugStream` is either `true` or `undefined` then we use [bunyan-debug-stream][]
in place of `stdout`. The reason for this is simple: it's a pain (and sometimes not possible) to do `| bunyan`
everywhere. This allows for beautiful debug logging, without much hassle, while still letting you shut off the pretty
output when you deploy.

[bunyan-debug-stream]: https://github.com/benbria/bunyan-debug-stream

### `setRootLogger(name)`

* `name` - the name of the root logger (default: 'root').

This creates a root logger that all other loggers are children of. This is called for you if `init()` had not been
called previously, and you call either `getLogger` or `loggerFor`. It will be initialized with an `stdout` stream
logging at debug.

### `getLogger(name, options)`

* `name` - the name of the logger.
* `options` - a configuration object to pass to bunyan. (default: `{ streams }` as passed to `init`)

This gets a new child logger of the root logger, passing in the streams we've been configured with.

### `loggerFor(object)`

* `object` - an object to get a logger for, most commonly `module`, but supports any object, or a string.

Creates a logger, appending a `module` object with either the name of the object, or a path to it. (It will attempt to
get the filename of the object if the object has a `filename` property.) This makes it most useful for making loggers
for module objects, but can be used on any arbitrary object.

## `dump(object, color, depth)`

* `object` - the object you wish to print
* `colors` - should the object be printed with color escapes (default: `true`)
* `depth` - how deeply nested should we print the properties of the object (default: `null`)
* `showHidden` - should we print hidden properties (default: `false`)

This is basically just a wrapper around [util.inspect](https://nodejs.org/api/util.html#util_util_inspect_object_options).
It's here for convenience, but doesn't have the same flexibility as `util.inspect`, so should only be used sparingly.

_Note: This is added to all logging instances for your convenience._

