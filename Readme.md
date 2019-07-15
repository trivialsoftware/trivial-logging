# Trivial Logging

This is a simple wrapper around [pino][], which provides some very basic convenience. It's designed to be a near
drop-in replacement to [omega-logger][1], which in turn is based off of python's logging module.

When I say a simple wrapper, I mean it's ~150 lines of code in my very verbose coding style. Mostly, it adds a simple way to configure [pino][], as well as the ability to trivially create loggers for modules.

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

// This is just a pino logger instance
logger.info('Hello, World!');
```

By default, this logs JSON messages out to `stdout`, at either `'debug'`, or whatever you've set the `LOG_LEVEL` environment variable to.

## Advanced Usage

We support passing in a configuration object to setup your logger. This config supports several properties, including an `options` property that is passed directly to pino. All calls to `getLogger()` and/or `loggerFor()` will use the passed in configuration.

```javascript
const logging = require('trivial-logging');

const config = {
    debug: true,
    options: {
        level: 'warn'
    }
};

// This stores the configuration
logging.init(config);

// This gets a basic logger
const basicLogger = logging.getLogger('basic');

// This gets a logger that has some options overridden
const overriddenLogger = logging.getLogger('overridden', { level: 'debug' });
```

### Usage with Unit Tests

Generally, when you're running unit tests, you don't want most logging. The easiest way to achieve this is by setting
the `LOG_LEVEL` environment variable to `'ERROR'`. You can do this at the top of your unit test:

```javascript
// Set `LOG_LEVEL` before importing your code that imports `trivial-logging`
process.env.LOG_LEVEL = 'ERROR';

const { expect } = require('chai');

// ... rest of unit test
```

Make sure that you set `process.env.LOG_LEVEL` _before_ importing any code that imports `trivial-logging`.

### Null Logger (Disabling all logging)

Trivial Logging has a `NullLogger` implementation. This turns all logging operations into a noop. This means that there
will be no output, and very little overhead from logging calls. This is helpful with debugging, or for unit tests.

This can be enabled by setting `LOG_NULL` to any value. For example:

```bash
$ env LOG_NULL="true" node ./example.js
```

This can also be enabled via the config file, with the `nullLogger` property being set to true:

```javascript
const logging = require('trivial-logging');

const config = {
    nullLogger: true
};

// This stores the configuration
logging.init(config);

// This gets a null logger
const logger = logging.getLogger('some logger');

// All calls to this logger are noops
logger.info("Some logging.");
logger.error("Some other logging.");
```

## API

### `init(config)`

* `config` - a configuration object with the keys `debug`, `nullLogger` and/or `options`.

This sets up all future loggers with a default set of options, as passed by the configuration. If `config.debug` is `true` then we turn on pino [pretty printing][pretty]. This allows for beautiful debug logging, without much hassle, while still letting you shut off the pretty output when you deploy.

_Note: the `LOG_LEVEL` environment variable **always** overrides what's set in the config._

[pretty]: https://getpino.io/#/docs/pretty

### `setRootLogger(name)`

* `name` - the name of the root logger (default: 'root').

This creates a root logger that all other loggers are children of. This is called for you if `init()` had not been
called previously, and you call either `getLogger` or `loggerFor`. It will be initialized with defaults.

### `getLogger(name, options)`

* `name` - the name of the logger.
* `options` - a configuration object to pass to [pino][]. (default: `config.options` as passed to `init`)

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

[pino]: https://getpino.io/
