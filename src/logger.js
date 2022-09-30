
const winston = require('winston');

const config = winston.config;

/** @type {winston.LoggerInstance} */
const logger = new (winston.Logger)({
    level: process.env.LOG_LEVEL || 'info',
    transports: [
        new (winston.transports.Console)({
            timestamp: () => Date.now(),
            formatter: (options) => {
                let extra = ''
                
                if (options.meta) {
                    const keys = Object.keys(options.meta)
                    if (keys.length) {
                        if (keys.length === 2 && keys.includes('message') && keys.includes('stack')) {
                            /** @type {Error} */
                            const err = options.meta
                            extra = `\n  message:${err.name}\n  stack:${err.stack}`
                        } else {
                            extra = '\n'+ JSON.stringify(options.meta, null, '  ')
                        }
                    }
                }
                
                return options.timestamp() + ' ' +
                      config.colorize(options.level, options.level.toUpperCase()) + ' ' +
                      (options.message ? options.message : '') + extra;
            }
        })
    ]
})


process.on('uncaughtException', err => {
    logger.error('uncaughtException')
    logger.error(err)
    if (err.stack) {
        logger.error(err.stack)
    }
    process.exit(1)
})

process.on('unhandledRejection', err => {
    logger.error('unhandledRejection')
    logger.error(err)
    if (err.stack) {
        logger.error(err.stack)
    }
    process.exit(1)
})

module.exports = logger
