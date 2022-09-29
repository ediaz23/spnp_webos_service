
const cmsService = require('./src/CmsService')
const MediaDevice = require('./src/MediaDevice')
const spnpUtil = require('./src/utils')


let Service = null


try {
    Service = require('webos-service')
} catch (_e) {
    // nada
}
if (Service) {
    /** @type {import('webos-service').default} */
    const service = new Service('com.spnp.webos.player.service')

    service.register('startSsdp', message => {
        cmsService.startSsdp()
        .then(() => message.respond({status: true}))
        .catch(error => message.respond({status: true, error: error}))
    })
}

module.exports = {
    cmsService,
    MediaDevice,
    spnpUtil,
}
