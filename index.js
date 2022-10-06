
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

service.register('startSsdp', async message => {
    try {
        await cmsService.startSsdp()
        message.respond({status: true});
    } catch (error) {
        message.respond({ returnValue: false, error })
    }
})

service.register('stopSsdp', async message => {
    try {
        await cmsService.stopSsdp()
        message.respond({status: false});
    } catch (error) {
        message.respond({ returnValue: false, error })
    }
})

service.register('searchSsdp', async message => {
    try {
        const { search } = message.payload
        const devices = await cmsService.searchSsdp(search)
        message.respond({ devices })
    } catch(error) {
        message.respond({ returnValue: false, error })
    }
})

service.register('browse', async message => {
    try {
        const { deviceId } = message.payload
        const device = cmsService.getDevice(deviceId)
        const files = device.browse(message.payload)
        message.respond({ files })
    } catch(error) {
        message.respond({ returnValue: false, error })
    }
})

service.register('searchCapabilities', async message => {
    try {
        const { deviceId } = message.payload
        const device = cmsService.getDevice(deviceId)
        const capabilities = device.getSearchCapabilities()
        message.respond({ capabilities })
    } catch(error) {
        message.respond({ returnValue: false, error })
    }
})

service.register('search', async message => {
    try {
        const { deviceId } = message.payload
        const device = cmsService.getDevice(deviceId)
        const files = device.search(message.payload)
        message.respond({ files })
    } catch(error) {
        message.respond({ returnValue: false, error })
    }
})

service.register('metadata', async message => {
    try {
        const { deviceId, itemId } = message.payload
        const device = cmsService.getDevice(deviceId)
        const file = device.getMetadata({id: itemId})
        message.respond({ file })
    } catch(error) {
        message.respond({ returnValue: false, error })
    }
})

module.exports = {
    cmsService,
    MediaDevice,
    spnpUtil,
    webosService: service
}
