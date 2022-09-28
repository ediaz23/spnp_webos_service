
const logger = require('./logger')
const { Client } = require('node-ssdp')
const EventEmitter = require('events')
const MediaDevice = require('./MediaDevice')
const utils = require('./utils')


class CmsService extends EventEmitter {

    constructor() {
        super()
        /** @type {Object.<string, MediaDevice>} */
        this.devices = []
        this.currentDevice = null
        this.client = new Client()
        this.client.on('response', this.messageSsdp.bind(this))
        this.client.on('notify', this.notifySsdp.bind(this))
    }
    
    /**
     * @returns {Promise}
     */
    async startSsdp() {
        return this.client.start()
    }

    /**
     * @returns {Promise}
     */
    async stopSsdp() {
        return this.client.stop()
    }

    /**
     * @param {String} st
     * @returns {Promise<Array<MediaDevice>>}
     */
    async searchSsdp(st) {
        return new Promise( res => {
            st = st || 'ssdp:all'
            this.client.search(st)
            setTimeout(() => {
                this.client.stop()
                res(Object.values(this.devices))
            }, 2000)
        })
    }
    
    notifySsdp(notify) {
        logger.info('notifySsdp')
        logger.info(notify)
    }

    /**
     * @param {import('node-ssdp').SsdpHeaders} headers
     * @param {Number} statusCode
     * @param {import('dgram').RemoteInfo} rinfo
     */
    async messageSsdp(headers, statusCode, rinfo) {
        if (statusCode === 200) {
            await this.addDevices(headers, rinfo)
        }
    }
    
    /**
     * @param {import('node-ssdp').SsdpHeaders} headers
     * @param {import('dgram').RemoteInfo} rinfo
     */
    async addDevices(headers, rinfo) {
        if (headers.LOCATION && headers.USN &&
            this.devices[headers.USN] === undefined &&
            /MediaServer:[0-5]$/.test(headers.USN)) {
            try {
                const schema = await utils.makeRequest('addDevices', headers.LOCATION, {method: 'get'})
                if (schema && schema.root && schema.root.device) {
                    const deviceType = schema.root.device.deviceType;
                    if (deviceType) {
                        const device = new MediaDevice(schema, headers, rinfo)
                        this.devices[headers.USN] = device
                        logger.info(`Device found ${device.getName()} ${headers.USN} - ${deviceType}`)
                    }
                }
            } catch(err) {
                this.devices[headers.USN] = null
                logger.error('Error query location')
                logger.error(err)
                logger.error(headers)
            }
        }
    }

    /**
     * @param {String} key
     * @returns {MediaDevice}
     */
    getDevice(key) {
        return this.devices[key]
    }
}

module.exports = new CmsService()
