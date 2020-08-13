    var assert = require('assert');
    const ociAPIRequestor = require('../oci-api-requestor/oci-api-requestor.js');


const readObject = async function ( objectName, bucketName) {
    assert(process.env.REGION !=null)
    assert(process.env.OCI_NAMESPACE !=null) 
    console.info(`oci-object-reader.readObject ${objectName} from bucket ${bucketName} in namespace ${process.env.OCI_NAMESPACE}`)
    var readObjectOptions = {
        host: `objectstorage.${process.env.REGION}.oraclecloud.com`,
        path: "/n/" + encodeURIComponent(process.env.OCI_NAMESPACE) + "/b/" + encodeURIComponent(bucketName) + "/o/" + encodeURIComponent(objectName),
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        }
    };

    const getResponse = await ociAPIRequestor.executeOCIAPIRequest(readObjectOptions, null)
    
    
    return {"fileName": objectName, "bucketName":bucketName, "response": getResponse}  
}


module.exports = {
    readObject: readObject
}