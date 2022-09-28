//    "renderer-finder": "^0.1.3",
//    "upnp-device-client": "^1.0.2"

process.env.LOG_LEVEL = 'debug'
const cmsService = require('./src/CmsService')

cmsService.startSsdp().then(() => {
    cmsService.searchSsdp().then(async devices => {
        return devices[0].browse({id: '64$5', start: 0, count: 0}).then(console.log)
//        return devices[0].getSearchCapabilities().then(console.log)
//'dc:title contains "abism" or upnp:album contains "abism" or upnp:artist contains "abism"'
//        return devices[0].search({id: 0, start: 0, count: 0, search: 'dc:title contains "Dance"'}).then(console.log)

    })
})
console.log('hola')

