#!/usr/bin/env node
import lnservice from 'ln-service'
import lightning from 'lightning'
import fs from 'fs'
import R from 'ramda'

let tlsCert = fs.readFileSync('[CHANGEME]').toString('base64')
let macaroon = fs.readFileSync('[CHANGEME]').toString('base64')
let lndAddr = '127.0.0.1:10001'

async function main() {
    const { lnd } = lightning.authenticatedLndGrpc({
        cert: tlsCert,
        macaroon,
        socket: lndAddr
    })

    let info = await lnservice.getWalletInfo({ lnd })
    console.log(JSON.stringify(info))

    let channelAcceptor = lnservice.subscribeToOpenRequests({ lnd })
    channelAcceptor.on('channel_request', channelAcceptorPolicy)

    let forwards = lnservice.subscribeToForwards({ lnd })
    forwards.on('forward', R.compose(console.log, JSON.stringify)) // TODO

    let forwardRequests = lnservice.subscribeToForwardRequests({ lnd })
    forwardRequests.on('forward_request', forwardingPolicy)

    let graphUpdates = lnservice.subscribeToGraph({ lnd })
    graphUpdates.on('channel_updated', R.compose(console.log, JSON.stringify)) // TODO
    graphUpdates.on('channel_closed', R.compose(console.log, JSON.stringify)) // TODO
    graphUpdates.on('node_updated', R.compose(console.log, JSON.stringify)) // TODO

    // because main method will exit without this.
    while (true) {
        await sleep(1000)
    }
}

async function channelAcceptorPolicy(channel) {
    console.log(JSON.stringify(channel))
    channel.accept()
}

async function forwardingPolicy(forward_request) {
    // TODO
    console.log(JSON.stringify(forward_request))
    forward_request.accept()
}

async function sleep(n) {
    await new Promise(res => {
        setTimeout(res, n)
    })
}

main()
    .then(res => {
        console.log(`main exited cleanly with ${res}`)
    })
    .catch(err => {
        console.log(`main exited with error ${err}`)
    })