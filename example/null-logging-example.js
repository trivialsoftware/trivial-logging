//----------------------------------------------------------------------------------------------------------------------
// null-logging-example.js - A null logger example.
//----------------------------------------------------------------------------------------------------------------------

const logging  = require('../logging');

//----------------------------------------------------------------------------------------------------------------------

logging.init({ debug: true, nullLogger: true });
logging.setRootLogger('example');

//----------------------------------------------------------------------------------------------------------------------

const logger = logging.loggerFor(module);

logger.trace('more tracing!');
logger.debug('testing?');
logger.info('This is a test.', logger.dump({ msg: 'with an object' }), logger.dump({ other: { nested: { object: { of: { doom: true, foo: 23, bar: 'apples', baz: null } } } }}));
logger.warn('This is a warning. No object this time.');
logger.error('This is an error.', new Error('TESTING!!!!! And stuff.'));

const logger2 = logging.getLogger('other logger');

logger2.trace('more tracing!');
logger2.debug('testing?');
logger2.info('This is a test.', logger.dump({ msg: 'with an object' }));
logger2.warn('This is a warning. No object this time.');
logger2.error('This is an error.', new Error('TESTING!!!!! And stuff.'));

//----------------------------------------------------------------------------------------------------------------------
