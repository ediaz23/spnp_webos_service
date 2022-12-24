
const logger = require('./logger')
const { Client } = require('node-ssdp')
const EventEmitter = require('events')
const MediaDevice = require('./MediaDevice')
const utils = require('./utils')


class CmsService extends EventEmitter {

    constructor() {
        super()
        /** @type {Object.<string, MediaDevice>} */
        this.devices = {}
        this.client = new Client({
            customLogger: (message, ...extra) => {
                logger.debug(message)
                logger.debug(extra)
            }
        })
        this.client.on('response', this.messageSsdp.bind(this))
        this.client.on('notify', this.notifySsdp.bind(this))
        this.started = false
    }

    /**
     * @returns {Promise}
     */
    async startSsdp() {
        logger.debug('startSsdp')
        if (!this.started) {
            await this.client.start()
            this.started = true
        }
    }

    /**
     * @returns {Promise}
     */
    async stopSsdp() {
        logger.debug('stopSsdp')
        if (this.started) {
            this.client.stop()
            this.started = false
        }

    }

    /**
     * @param {String} st
     * @returns {Promise<Array<MediaDevice>>}
     */
    async searchSsdp(st) {
        logger.debug('searchSsdp')
        return new Promise((res, rej) => {
            try {
                if (!this.started) {
                    throw new Error('Service not started')
                }
                st = st || 'ssdp:all'
                this.client.search(st)
                setTimeout(() => {
                    this.stopSsdp().then(() => res(Object.values(this.devices)))
                }, 800)
            } catch (error) {
                rej(error)
            }
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
        logger.debug('messageSsdp')
        if (statusCode === 200) {
            await this.addDevices(headers, rinfo)
        }
    }

    /**
     * @param {import('node-ssdp').SsdpHeaders} headers
     * @param {import('dgram').RemoteInfo} rinfo
     */
    async addDevices(headers, rinfo) {
        logger.debug('addDevices')
        if (headers.LOCATION && headers.USN &&
            this.devices[headers.USN] === undefined &&
            /MediaServer:[0-5]$/.test(headers.USN)) {
            try {
                const schema = await utils.makeRequest('addDevices', headers.LOCATION, { method: 'get' })
                if (schema && schema.root && schema.root.device) {
                    const deviceType = schema.root.device.deviceType;
                    if (deviceType) {
                        const device = new MediaDevice(schema, headers, rinfo)
                        this.devices[headers.USN] = device
                        logger.info(`Device found ${device.getName()} ${headers.USN} - ${deviceType}`)
                    }
                }
            } catch (err) {
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
