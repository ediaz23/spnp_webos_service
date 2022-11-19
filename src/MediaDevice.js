
const logger = require('./logger')
const utils = require('./utils')
const { URL } = require('url')
const MP4Box = require('mp4box')
const fetch = require('node-fetch')


class MediaDevice {

    /**
     * @param {String} schema
     * @param {import('node-ssdp').SsdpHeaders} headers
     * @param {import('dgram').RemoteInfo} rinfo
     */
    constructor(schema, headers, rinfo) {
        if (headers) {
            this.id = headers.USN ? headers.USN : null
            this.location = headers.LOCATION ? new URL(headers.LOCATION) : null
        } else {
            this.id = null
            this.location = null
        }
        if (schema) {
            this.name = this.computeName(schema)
            this.services = this.computeServices(schema)
        } else {
            this.name = ''
            this.services = []
        }
        this.rinfo = rinfo
    }

    /**
     * @param {Object} data
     */
    updateFromJSON(data) {
        this.name = data.name
        this.id = data.id
        this.location = new URL(data.location)
        this.services = data.services
        this.rinfo = data.rinfo
    }

    /**
     * @param {Object} schema
     * @returns {String}
     */
    computeName(schema) {
        let out = null
        if (schema && schema.root && schema.root.device) {
            out = schema.root.device.friendlyName || schema.root.device.modelName
        }
        return out
    }

    /**
     * @param {Object} schema
     * @returns {Array<String>}
     */
    computeServices(schema) {
        let out = []
        if (schema && schema.root && schema.root.device &&
            schema.root.device.serviceList && schema.root.device.serviceList.service) {
            out = utils.toArray(schema.root.device.serviceList.service)
        }
        return out
    }

    /**
     * @returns {String}
     */
    getName() {
        return this.name
    }

    /**
     * @returns {array}
     */
    getServices() {
        return this.services
    }

    /**
     * @returns {string}
     */
    getContentDirectoryControlUrl() {
        const service = this.getServices()
            .find(service => /ContentDirectory:[0-4]$/.test(service.serviceType));
        const path = (service || {}).controlURL;
        return `${this.location.origin}${path}`;
    }

    /**
     * Make a request
     * @param {String} fnName function name to log
     * @param {String} action
     * @param {String} body
     * @returns {Promise<Object>}
     */
    async makeRequest(fnName, action, body) {
        return utils.makeRequest(fnName, this.getContentDirectoryControlUrl(), {
            method: 'post',
            headers: {
                'CONTENT-TYPE': 'text/xml; charset="utf-8"',
                SOAPAction: `"urn:schemas-upnp-org:service:ContentDirectory:1#${action}"`
            },
            body: body,
            parseOption: { ignoreAttributes: false, removeNSPrefix: true, trimValues: true }
        })
    }

    /**
     * @param {Object} obj
     * @param {String} obj.id
     * @param {Number} obj.start
     * @param {Number} obj.count
     * @returns {Promise<Array<Object>>}
     */
    async browse({ id, start, count }) {
        const req = `<?xml version="1.0" encoding="utf-8"?>
<s:Envelope xmlns:s="http://schemas.xmlsoap.org/soap/envelope/" s:encodingStyle="http://schemas.xmlsoap.org/soap/encoding/">
    <s:Body>
        <u:Browse xmlns:u="urn:schemas-upnp-org:service:ContentDirectory:1">
            <ObjectID>${id || 0}</ObjectID>
            <BrowseFlag>BrowseDirectChildren</BrowseFlag>
            <Filter>*</Filter>
            <StartingIndex>${start || 0}</StartingIndex>
            <RequestedCount>${count || 0}</RequestedCount>
            <SortCriteria></SortCriteria>
        </u:Browse>
    </s:Body>
</s:Envelope>`;
        /** @type {String} */
        const data = await this.makeRequest('browse', 'Browse', req)
        return this.parseResponse(data, 'BrowseResponse')
    }

    /**
     * @returns {Promise<String>}
     */
    async getSearchCapabilities() {
        const body = `<?xml version="1.0" encoding="utf-8"?>
<s:Envelope xmlns:s="http://schemas.xmlsoap.org/soap/envelope/" s:encodingStyle="http://schemas.xmlsoap.org/soap/encoding/">
    <s:Body>
        <u:GetSearchCapabilities xmlns:u="urn:schemas-upnp-org:service:ContentDirectory:1">
        </u:GetSearchCapabilities>
    </s:Body>
</s:Envelope>`;
        const data = await this.makeRequest('getSearchCapabilities', 'GetSearchCapabilities', body)
        let out = null
        if (data && data.Envelope && data.Envelope.Body && data.Envelope.Body.GetSearchCapabilitiesResponse &&
            data.Envelope.Body.GetSearchCapabilitiesResponse.SearchCaps) {
            out = data.Envelope.Body.GetSearchCapabilitiesResponse.SearchCaps
        }
        return out
    }

    /**
     * @param {Object} obj
     * @param {String} obj.id
     * @param {Number} obj.start
     * @param {Number} obj.count
     * @param {String} obj.search
     * @returns {Promise<Array<Object>>}
     */
    async search({ id, start, count, search }) {
        search = `dc:title contains "${search}" or upnp:album contains "${search}" or upnp:artist contains "${search}"`
        const req = `<?xml version="1.0" encoding="utf-8"?>
<s:Envelope xmlns:s="http://schemas.xmlsoap.org/soap/envelope/" s:encodingStyle="http://schemas.xmlsoap.org/soap/encoding/">
    <s:Body>
        <u:Search xmlns:u="urn:schemas-upnp-org:service:ContentDirectory:1">
            <ContainerID>${id || 0}</ContainerID>
            <SearchCriteria>${search}</SearchCriteria>
            <Filter>*</Filter>
            <StartingIndex>${start || 0}</StartingIndex>
            <RequestedCount>${count || 0}</RequestedCount>
            <SortCriteria></SortCriteria>
        </u:Search>
    </s:Body>
</s:Envelope>`;
        /** @type {String} */
        const data = await this.makeRequest('search', 'Search', req)
        return this.parseResponse(data, 'SearchResponse')
    }

    /**
     * @param {{id: String}}
     * @returns {Promise<Object>}
     */
    async getMetadata({ id }) {
        const req = `<?xml version="1.0" encoding="utf-8"?>
<s:Envelope xmlns:s="http://schemas.xmlsoap.org/soap/envelope/" s:encodingStyle="http://schemas.xmlsoap.org/soap/encoding/">
    <s:Body>
        <u:Browse xmlns:u="urn:schemas-upnp-org:service:ContentDirectory:1">
            <ObjectID>${id}</ObjectID>
            <BrowseFlag>BrowseMetadata</BrowseFlag>
            <Filter>*</Filter>
            <StartingIndex>0</StartingIndex>
            <RequestedCount>0</RequestedCount>
            <SortCriteria></SortCriteria>
        </u:Browse>
    </s:Body>
</s:Envelope>`;
        /** @type {String} */
        const data = await this.makeRequest('getMetadata', 'Browse', req)
        const out = this.parseResponse(data, 'BrowseResponse')
        return out && out.length ? out[0] : null
    }

    /**
     * @param {Object} data
     * @param {String} responseName
     * @returns {Array<Object>}
     */
    parseResponse(data, responseName) {
        logger.debug('in parseResponse')
        const out = []
        if (data && data.Envelope && data.Envelope.Body) {
            let response = data.Envelope.Body
            response = response && response[responseName]
            if (response && response.Result) {
                const res = utils.xmlParse(response.Result, { ignoreAttributes: false, removeNSPrefix: true, trimValues: true })
                const items = utils.toArray(res['DIDL-Lite'].container)
                items.push(... (utils.toArray(res['DIDL-Lite'].item)))
                const keys = new Set()
                for (const item of items) {
                    const key = `${item.class}-${item.title}`
                    if (!keys.has(key)) {
                        out.push(this.normalizeObj(item))
                        keys.add(key)
                    }
                }
            }
        }
        logger.debug('out parseResponse')
        return out
    }

    /**
     * Change problematic keys of object
     * @param {Object} item
     * @returns {Object}
     */
    normalizeObj(item) {
        logger.debug('in normalizeObj')

        const normalizeRes = res => {
            res = this.normalizeObj(res)
            if (res['#text']) {
                res.url = res['#text']
                delete res['#text']
            }
            return res
        }

        for (const key of Object.keys(item)) {
            if (key.startsWith('@_')) {
                const newKey = key.replace('@_', '')
                item[newKey] = item[key]
                delete item[key]
            } else if (key === 'albumArtURI') {
                item[key] = item[key]['#text']
            }
            if (item.res) {
                if (Array.isArray(item.res)) {
                    item.res = item.res.map(res => normalizeRes(res))
                } else {
                    item.res = normalizeRes(item.res)
                }
            }
        }
        logger.debug('out normalizeObj')
        return item
    }

    toBuffer(ab) {
        const buffer = Buffer.alloc(ab.byteLength)
        const view = new Uint8Array(ab)
        for (let i = 0; i < buffer.length; ++i) {
            buffer[i] = view[i]
        }
        return buffer
    }

    /**
     * Extrar subtitles from url
     * @param {{url: String}}
     * @return {Promise}
     */
    async extracMp4Subtitles({ url }) {
        logger.debug('in extracMp4Subtitles')
        const mp4boxfile = MP4Box.createFile(false)
        const subtitles = [], control = new Set()
        let bufferSize = (1 << 10) * 500 // 500 kb

        let filePos = 0, loop = true

        mp4boxfile.onReady = (info) => {
            logger.info('extracMp4Subtitles.ready')
            if (info.subtitleTracks) {
                loop = info.subtitleTracks.length > 0
                for (const track of info.subtitleTracks) {
                    track.cueList = []
                    track.addCue = function(cue) { this.cueList.push(cue) }
                    subtitles.push(track)
                    mp4boxfile.setExtractionOptions(track.id, track, { nbSamples: 500 })
                }
                mp4boxfile.start()
                bufferSize = (1 << 20) * 23  // 23 megabytes
            } else {
                loop = false
            }
        }

        mp4boxfile.onSamples = (id, textTrack, samples) => {
            logger.info('extracMp4Subtitles.onSamples')
            control.add(id)
            for (const sample of samples) {
                const text = this.toBuffer(sample.data).toString('utf-8').substring(2)
                textTrack.addCue({
                    start: sample.dts / sample.timescale,
                    end: (sample.dts + sample.duration) / sample.timescale,
                    text: text,
                })
            }
            loop = control.size < subtitles.length || textTrack.cueList.length < textTrack.nb_samples
            mp4boxfile.releaseUsedSamples(id, textTrack.cueList.length)
        }
        mp4boxfile.onError = (res) => {
            logger.error('extracMp4Subtitles mp4boxfile.Error')
            logger.error(res)
            loop = false
        }
        const resSize = await fetch(url, { method: 'HEAD' })
        const maxSize = parseInt(resSize.headers.get('Content-Length'))
        while (loop) {  // up function are executed inside loop mp4boxfile.onReady mp4boxfile.onSamples
            try {
                const nextChunk = filePos + bufferSize < maxSize ? filePos + bufferSize : maxSize
                logger.info(`loop ${filePos}-${nextChunk} max:${maxSize} size:${bufferSize}`)
                const res = await fetch(url, { headers: { Range: `bytes=${filePos}-${nextChunk}` } })
                if ([200, 206].includes(res.status)) {
                    const arrayBuffer = await res.arrayBuffer()
                    arrayBuffer.fileStart = filePos
                    filePos += arrayBuffer.byteLength
                    mp4boxfile.appendBuffer(arrayBuffer)
                } else {
                    loop = false
                }
            } catch (err) {
                logger.error('extracMp4Subtitles loop.Error')
                logger.error(err)
                loop = false
            }
        }
        logger.debug('out extracMp4Subtitles')
        return subtitles
    }
}

module.exports = MediaDevice
