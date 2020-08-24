var assert = require('assert');

const retrieveSecret = async function (secretOCID) {
    console.log("MOck Retrieve Secret is invoked")
    assert(secretOCID !=null) 
    assert(process.env.REGION !=null)
    assert(process.env.COMPARTMENT_OCID !=null) 
    return new Promise((resolve, reject) => {
        resolve(
            JSON.stringify({ 'consumer_key': 'Z', 'consumer_secret': 's', 'access_token': '1', 'access_token_secret': 'L' })
        )
    })
}

const mockRetrieveSecret = jest.fn(retrieveSecret)

module.exports = {
    retrieveSecret: mockRetrieveSecret
}