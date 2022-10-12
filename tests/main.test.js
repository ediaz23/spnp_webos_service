
const cmsService = require('../src/CmsService')


describe('Main', () => {
    test('Main run', async() => {
        await cmsService.startSsdp()
        const devices = await cmsService.searchSsdp()
        /** @type {import('../src/MediaDevice')} */
        const device = devices[0]
        const files = await device.browse({})
        const _item = files.find(f => f.class === 'object.item.imageItem.photo')
    })
})