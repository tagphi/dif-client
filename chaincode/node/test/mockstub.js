class MockStateQueryIterator {
  constructor (records) {
    this.records = records
    this.pointer = -1
  }

  next () {
    this.pointer++

    if (this.pointer > this.records.length - 1) {
      return null
    }

    return this.records[this.pointer]
  }
}

class MockStub {
  constructor () {
    this.stateStore = {}
  }

  getFunctionAndParameters () {
    return null
  }

  createCompositeKey (objectType, attributes) {
    let compositeKey = objectType

    if (attributes && attributes.length > 0) {
      attributes.forEach((attribute) => {
        compositeKey = compositeKey + '-' + attribute
      })
    }

    return compositeKey
  }

  async putState (key, state) {
    this.stateStore[key] = state
  }

  async getState (key) {
    return this.stateStore[key]
  }

  getTxID () {
    return 'fakeTxID'
  }

  getCreator () {
    return null
  }

  splitCompositeKey (key) {
    let result = {objectType: null, attributes: []}
    let parts = key.split('-')

    result.objectType = parts[0]

    parts.shift()

    result.attributes = parts

    return result
  }

  async getStateByRange (startKey, endKey) {
    let results = []

    for (let key in this.stateStore) {
      if (key >= startKey && key <= endKey) {
        results.push({
          value: {
            key: key,
            value: this.stateStore[key]
          }
        })
      }
    }

    return new MockStateQueryIterator(results)
  }

  async getStateByPartialCompositeKey (objectType, attributes) {
    let partialKey = this.createCompositeKey(objectType, attributes)
    let matchedState = []

    for (let key in this.stateStore) {
      if (key.indexOf(partialKey) != -1) {
        matchedState.push({
          value: {
            key: key,
            value: this.stateStore[key]
          }
        })
      }
    }

    return new MockStateQueryIterator(matchedState)
  }
}

module.exports = MockStub
