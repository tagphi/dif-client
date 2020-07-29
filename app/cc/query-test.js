let logger = require('../utils/logger-utils').logger()

const query = require('./query')

async function caller () {
  let result = await query('getMergedList', ['default'])
  logger.info(result)
}

caller()