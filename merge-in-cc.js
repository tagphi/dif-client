let invokeCC = require('./app/cc/invoke')

async function main () {
  await invokeCC('merge', ['device'])
  // await invokeCC('merge', ['ip'])
  // await invokeCC('merge', ['default'])
}

main()
