var assert = require('assert');
const ociAPIRequestor = require('../oci-api-requestor/oci-api-requestor.js');


const writeObject = async function (content, objectName, bucketName) {
    assert(process.env.REGION !=null)
    assert(process.env.OCI_NAMESPACE !=null) 
    
    const putRequestOptions = {
        host: `objectstorage.${process.env.REGION}.oraclecloud.com`,
        path: "/n/" + encodeURIComponent(process.env.OCI_NAMESPACE) + "/b/" + encodeURIComponent(bucketName) + "/o/" + encodeURIComponent(objectName),
        method: 'PUT',
        headers: {
            'Content-Type': 'text/plain',
        }
    };
    let body = content
    const putResponse = await ociAPIRequestor.executeOCIAPIRequest(putRequestOptions, body)
    // response is empty when PUT is successful; you can then request file object details with a GET call
    // const getRequestOptions = {
    //     host: `objectstorage.${process.env.REGION}.oraclecloud.com`,
    //     path: "/n/" + encodeURIComponent(process.env.OCI_NAMESPACE) + "/b/" + encodeURIComponent(bucketName) + "/o/" + encodeURIComponent(objectName),
    //     method: 'GET',
    //     headers: {
    //         'Content-Type': 'text/plain',
    //     }
    // };
    // const response = await ociAPIRequestor.executeOCIAPIRequest(getRequestOptions, null)
    // console.log(response)
    
    return {"fileName": objectName, "fileSize": content.length, "bucketName":bucketName}  
}


module.exports = {
    writeObject: writeObject
}