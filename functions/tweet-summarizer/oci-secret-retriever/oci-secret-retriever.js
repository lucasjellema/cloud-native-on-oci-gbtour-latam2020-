var assert = require('assert');
const ociAPIRequestor = require('../oci-api-requestor/oci-api-requestor.js');


const retrieveSecret = async function (secretOCID) {
    assert(secretOCID !=null) 
    assert(process.env.REGION !=null)
    assert(process.env.COMPARTMENT_OCID !=null) 
    
    const requestOptions = {
        host: `secrets.vaults.${process.env.REGION}.oci.oraclecloud.com`,
        path: `/20190301/secretbundles/${secretOCID}`,
        headers: {
            "compartmentId": process.env.COMPARTMENT_OCID,
            "stage": "CURRENT"
        }
    };
    const response = await ociAPIRequestor.executeOCIAPIRequest(requestOptions, null)
    console.log(`SecretRetriever - response from OCI API ${response}`)
    let secretContentBase64 = JSON.parse(response).secretBundleContent.content;
    return Buffer.from(secretContentBase64, 'base64').toString('ascii')  
}


module.exports = {
    retrieveSecret: retrieveSecret
}