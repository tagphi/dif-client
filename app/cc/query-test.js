let logger = require('../utils/logger-utils').logger()

const query = require('./query')

async function caller () {
  let result = await query('version', ['device'])
  logger.info(result)
}

caller()