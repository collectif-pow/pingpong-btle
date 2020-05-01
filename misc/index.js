const noble = require('@abandonware/noble')
const osc = require('node-osc')

const client = new osc.Client('127.0.0.1', 12345)

const ids = {
  raquettes: [
    { name: 'r1', uuid: 'fac33bfdf38f498da2eaf83aaa340aa4' },
    { name: 'r2', uuid: 'c6e22bfb9c7a' },
  ],
  serviceUUID: '6e400001b5a3f393e0a9e50e24dcca9e',
  rxCharacteristic: '6e400003b5a3f393e0a9e50e24dcca9e',
  txCharacteristic: '6e400002b5a3f393e0a9e50e24dcca9e',
}

let i = 0

const sendMessage = (raquette, value) => {
  client.send(`/${raquette}`, value)
}

noble.on('stateChange', state => {
  if (state === 'poweredOn') noble.startScanning()
  else noble.stopScanning()
})

noble.on('discover', peripheral => {
  if (
    ids.raquettes.find(raquette => {
      return raquette.uuid === peripheral.uuid
    })
  ) {
    noble.stopScanning()
    peripheral.connect(() => {
      console.log(`${peripheral.advertisement.localName} connecté`)
      i++
      if (i === 2) noble.stopScanning()
      else noble.startScanning()
      peripheral.discoverServices([], (error, services) => {
        const uartService = services.filter(service => {
          return service.uuid === ids.serviceUUID
        })[0]
        uartService.discoverCharacteristics([], (error, chars) => {
          const rxCharacteristic = chars.filter(char => {
            return char.uuid === ids.rxCharacteristic
          })[0]
          console.log(rxCharacteristic)
          rxCharacteristic.on('read', state => {
            const value = parseInt(state.toString())
            console.log(`${peripheral.advertisement.localName} : ${value}`)
            if (value > 500) {
              sendMessage(peripheral.advertisement.localName, value)
            }
          })
          rxCharacteristic.notify(true)
        })
      })
    })
  }
})
