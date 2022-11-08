
const cmsService = require('./src/CmsService')
const MediaDevice = require('./src/MediaDevice')
const spnpUtil = require('./src/utils')
const logger = require('./src/logger')


logger.info('init service')

/** @type {import('webos-service').default} */
let service = null

try {
    const Service = require('webos-service')
    service = new Service('com.spnp.webos.player.service')
} catch (_e) {
    service = {
        register: function(name, fn) {
            this[name] = fn
        }
    }
}

/**
 * @param {import('webos-service').Message} message
 * @param {Error} error
 * @param {String} name
 */
const errorHandler = (message, error, name) => {
    if (error instanceof Error) {
        message.respond({ returnValue: false, error: `${error.name} - ${error.message}`, stack: error.stack })
    } else {
        message.respond({ returnValue: false, error: JSON.stringify(error) })
    }
    logger.error(name)
    logger.error(error)
}

service.register('startSsdp', async message => {
    try {
        await cmsService.startSsdp()
        message.respond({ status: true });
    } catch (error) {
        errorHandler(message, error, 'startSsdp')
    }
})

service.register('stopSsdp', async message => {
    try {
        await cmsService.stopSsdp()
        message.respond({ status: false });
    } catch (error) {
        errorHandler(message, error, 'stopSsdp')
    }
})

service.register('searchSsdp', async message => {
    try {
        const { search } = message.payload
        const devices = await cmsService.searchSsdp(search)
        message.respond({ devices })
    } catch (error) {
        errorHandler(message, error, 'searchSsdp')
    }
})

service.register('browse', async message => {
    try {
        const { deviceData } = message.payload
        const device = new MediaDevice()
        device.updateFromJSON(deviceData)
        const files = await device.browse(message.payload)
        message.respond({ files })
    } catch (error) {
        errorHandler(message, error, 'browse')
    }
})

service.register('searchCapabilities', async message => {
    try {
        const { deviceData } = message.payload
        const device = new MediaDevice()
        device.updateFromJSON(deviceData)
        const capabilities = await device.getSearchCapabilities()
        message.respond({ capabilities })
    } catch (error) {
        errorHandler(message, error, 'searchCapabilities')
    }
})

service.register('search', async message => {
    try {
        const { deviceData } = message.payload
        const device = new MediaDevice()
        device.updateFromJSON(deviceData)
        const files = await device.search(message.payload)
        message.respond({ files })
    } catch (error) {
        errorHandler(message, error, 'search')
    }
})

service.register('metadata', async message => {
    try {
        const { itemId, deviceData } = message.payload
        const device = new MediaDevice()
        device.updateFromJSON(deviceData)
        const file = await device.getMetadata({ id: itemId })
        message.respond({ file })
    } catch (error) {
        errorHandler(message, error, 'metadata')
    }
})

module.exports = {
    cmsService,
    MediaDevice,
    spnpUtil,
    webosService: service
}
