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
var logging = require('trivial-logging');
var logger = logging.loggerFor(module);

// This is just a bunyan logger instance
logger.info('Hello, World!');
```

## Advanced Usage

We support passing in a configuration object to setup your logging streams. Then, all calls to `getLogger()` and/or
`loggerFor()` will use that configuration.

```javascript
var logging = require('trivial-logging');

var config = {
    debug: true,
    streams: [
        {
            stream: process.stdout,
            level: "info"
        }
    ]
};

// This stores the configuration
logging.init(config);

// This gets a basic logger
var basicLogger = logging.getLogger('basic');

// This gets a logger that has some options overridden
var overriddenLogger = logging.getLogger('overridden', { streams: [ /* ... */ ] });
```

## API

### `init(config)`

* `config` - a configuration object with the keys `debug` or `streams`.

This sets up all future loggers with a default set of streams, as passed by the configuration. If `debug` is true, it
will force the `stdout` stream to log at debug, regardless of it's configuration. This is useful for debugging.

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
for module objects, but can be usedon any arbitrary object.
