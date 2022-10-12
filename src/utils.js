
const logger = require('./logger')
const fetch = require('node-fetch')
const { XMLParser } = require('fast-xml-parser')


/**
 * @param {Object} data
 * @return {Array<Object>}
 */
function toArray(data) {
    return data == null ? [] : Array.isArray(data) ? data : [data]
}


/**
 * @param {String} str
 * @param {Object} options
 * @returns {String}
 */
function xmlParse(str, options) {
    const xmlParser = new XMLParser(options)
    return xmlParser.parse(str)
}

/**
 * log api response
 * @param {String} fnName
 * @param {import('node-fetch').Response} res
 * @returns {Promise}
 */
async function logRes(fnName, res) {
    if (![200, 202, 204].includes(res.status)) {
        logger.error(`Status Code: ${res.status} - ${fnName}`)
        let msg = null
        try {
            const r = await res.json()
            if (r && r.error) {
                msg = r.error
            }
            logger.error(r)
        } catch (_e) {
            // ignore
        }
        if (!msg) {
            msg = res.statusText ? res.statusText : 'Unexpected error.'
        }
        logger.error(msg)
        throw new Error(msg)
    } else {
        logger.debug(`Status Code: ${res.status} - ${fnName}`)
    }
}


/**
 * Make http request
 * @param {String} fnName for loggin
 * @param {String} url
 * @param {import('node-fetch').Request} reqConfig
 * @returns {Promise<Object>}
 */
async function makeRequest(fnName, url, reqConfig) {
    logger.debug(`${reqConfig.method} - ${url}`)
    /** @type {import('node-fetch').Response} */
    const res = await fetch(url, reqConfig)
    await logRes(fnName, res)
    let out = null
    try {
        out = await res.text()
        if (out) {
            out = xmlParse(out, reqConfig.parseOption)
        }
    } catch (_e) {
        // nothing
    }
    return out
}


module.exports = {
    toArray,
    makeRequest,
    xmlParse
}
