var assert = require('assert');
const ociAPIRequestor = require('../oci-api-requestor/oci-api-requestor.js');




const persistRecord = async function (tableOCID, record) {
    assert(process.env.REGION != null)
    assert(process.env.OCI_NAMESPACE != null)
    assert(tableOCID != null)
    var nosqlPersistRecordOptions = {
        host: `nosql.${process.env.REGION}.oci.oraclecloud.com`,
        path: "/20190828/tables/" + encodeURIComponent(tableOCID) + "/rows",
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' }
    };

    const body = { "value": record }

    const persistRecordResponse = await ociAPIRequestor.executeOCIAPIRequest(nosqlPersistRecordOptions, JSON.stringify(body))
    console.log(`persist response ${JSON.stringify(persistRecordResponse)}`)
    return persistRecordResponse
}


const retrieveRecord = async function (tableOCID, key) {
    assert(process.env.REGION != null)
    assert(process.env.OCI_NAMESPACE != null)
    assert(tableOCID != null)
    var nosqlGetRecordOptions = {
        host: `nosql.${process.env.REGION}.oci.oraclecloud.com`,
        path: "/20190828/tables/" + encodeURIComponent(tableOCID) + "/rows",
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
    };

    const getRecordResponse = await ociAPIRequestor.executeOCIAPIRequest(nosqlGetRecordOptions)
    return getRecordResponse
}

module.exports = {
    persistRecord: persistRecord
    , retrieveRecord:retrieveRecord
}