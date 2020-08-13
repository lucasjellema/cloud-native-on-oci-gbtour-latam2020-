var assert = require('assert');
const ociAPIRequestor = require('../oci-api-requestor/oci-api-requestor.js');


function encodeString(txt) {
    return Buffer.from(txt ? txt : "(empty)").toString('base64')
}

// messages is any array of objects with a key and a body property
// for example {"key":"42", "body":"string with meaningful contents"}
const publishMessageToStream = async function (messages) {
    assert(process.env.REGION != null)
    assert(process.env.OCI_NAMESPACE != null)
    assert(process.env.STREAM_OCID != null)
    let streamMessage = { "messages": [] };
    for (let i = 0; i < messages.length; i++) {
        streamMessage.messages.push({ "key": encodeString(messages[i].key), "value": encodeString(messages[i].body) })
    }
    let body = JSON.stringify(streamMessage)
    var streamPublishingOptions = {
        host: `streaming.${process.env.REGION}.oci.oraclecloud.com`,
        path: "/20180418/streams/" + encodeURIComponent(process.env.STREAM_OCID) + "/messages",
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }

    };
    const publishResponse = await ociAPIRequestor.executeOCIAPIRequest(streamPublishingOptions, body)
    return publishResponse
}

const publishTweetsOnStream = async function (tweetsReport) {
    const streamingReport = []
    for (let i = 0; i < tweetsReport.tweets.length; i++) {
        tweet = tweetsReport.tweets[i]
        messages = [{ "key": tweet.id, "body": JSON.stringify({ tweet }) }]
        const pubResult = await publishMessageToStream( messages)
        streamingReport.push(JSON.stringify(pubResult))
    }// loop   
    return streamingReport
}//publishTweetsOnStream

module.exports = {
    publishTweetsOnStream: publishTweetsOnStream
}