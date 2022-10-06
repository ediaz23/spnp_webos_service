
const cmsService = require('../src/CmsService')

/** @type {import('../src/MediaDevice')} */
let device = null

/** @type {Object} */
let item = null


describe('Service', () => {
    test('empty', () => {})

    test('Service start', async() => {
        await expect(cmsService.startSsdp()).resolves.not.toBeDefined()
    })
    
    test('Service stopSsdp', async() => {
        await expect(cmsService.stopSsdp()).resolves.not.toBeDefined()
    })
    
    test('Service searchSsdp', async() => {
        return cmsService.startSsdp()
        .then(() => cmsService.searchSsdp())
        .then(devices => {
            expect(devices).toBeDefined()
            expect(devices).not.toBeNull()
            expect(Array.isArray(devices)).toBe(true)
            expect(devices.length).toBeGreaterThan(0)
            device = devices[0]
        })
    })
    
    test('Devices exists', async() => {
        expect(device).toBeDefined()
        expect(device).not.toBeNull()
        expect(device.getName()).toBeDefined()
    })
    
    test('Devices name', async() => {
        expect(device.getName()).toBeDefined()
    })
    
    test('Devices getContentDirectoryControlUrl', async() => {
        expect(device.getContentDirectoryControlUrl()).toBeDefined()
    })
    
    test('Service browse', async() => {
        return device.browse({}).then(res => {
            expect(res).toBeDefined()
            expect(res).not.toBeNull()
            expect(Array.isArray(res)).toBe(true)
            expect(res.length).toBeGreaterThan(0)
            item = res[0]
        })
    })
    
    test('Service getSearchCapabilities', async() => {
        return device.getSearchCapabilities().then(res => {
            expect(res).toBeDefined()
            expect(res).not.toBeNull()
        })
    })
    
    test('Service search', async() => {
        return device.search({ search: 'Dance' }).then(res => {
            expect(res).toBeDefined()
            expect(res).not.toBeNull()
            expect(Array.isArray(res)).toBe(true)
            expect(res.length).toBeGreaterThan(0)
        })
    })

    test('Item exists', async() => {
        expect(item).toBeDefined()
        expect(item).not.toBeNull()
    })

    test('Item metadata', async() => {
        return device.getMetadata(item).then(res => {
            expect(res).toBeDefined()
            expect(res).not.toBeNull()
            const fields = ['title', 'class', 'storageUsed', 'id', 'parentID',
                'restricted', 'searchable', 'childCount']
            for(const field of fields) {
                expect(res).toHaveProperty(field)
                expect(res[field]).toBeDefined()
                expect(res[field]).not.toBeNull()
            }
        })
    })
    
})
