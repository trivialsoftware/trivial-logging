//----------------------------------------------------------------------------------------------------------------------
// logging-example.js - Brief description for logging-example.js module.
//
// @module
//----------------------------------------------------------------------------------------------------------------------

const logging  = require('../logging');

//----------------------------------------------------------------------------------------------------------------------

logging.init({ debug: true });
logging.setRootLogger('example');

//----------------------------------------------------------------------------------------------------------------------

const logger = logging.loggerFor(module);

logger.info('This is a test.', logger.dump({ msg: 'with an object' }));
logger.warn('This is a warning. No object this time.');
logger.error('This is an error.', new Error('TESTING!!!!! And stuff.'));

const logger2 = logging.getLogger('other logger');

logger2.info('This is a test.', logger.dump({ msg: 'with an object' }));
logger2.warn('This is a warning. No object this time.');
logger2.error('This is an error.', new Error('TESTING!!!!! And stuff.'));

//----------------------------------------------------------------------------------------------------------------------
