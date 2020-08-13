const assert = require('assert');
const fs = require('fs');
const https = require('https');

var httpSignature = require('http-signature');
var jsSHA = require("jssha");

//const configs = require('./oci-configuration').configs;

const executeOCIAPIRequest = async function (requestOptions, body) {
    assert(process.env.PRIVATE_KEY_FILE != null || process.env.OCI_RESOURCE_PRINCIPAL_PRIVATE_PEM != null)
    assert(process.env.KEY_FINGERPRINT != null || process.env.OCI_RESOURCE_PRINCIPAL_PRIVATE_PEM != null)
    assert(process.env.TENANCY_ID != null || process.env.OCI_RESOURCE_PRINCIPAL_PRIVATE_PEM != null)
    assert(process.env.USER_ID != null || process.env.OCI_RESOURCE_PRINCIPAL_PRIVATE_PEM != null)


    return new Promise((resolve, reject) => {
        // construct request and the handling of the response by resolving the promise
        const request = https.request(requestOptions, (res) => {
            let data = ''
            res.on('data', (chunk) => {
                data += chunk
            });
            res.on('end', () => {
                console.info(`OCI API Request complete  ${data}`)
                resolve(data)
            });
            res.on('error', (e) => {
                console.warn(`exception in OCI API Request ${e}`)
                reject(JSON.parse(e))
            });
        })

        signRequest(request, body)
        // for PUT request:
        if (requestOptions.method == "PUT" || requestOptions.method == "POST") {
            request.write(body)
            delete requestOptions.body;
        }

        request.end()
    })
}


function signRequest(request, body = "") {


    const privateKeyPath = process.env.PRIVATE_KEY_FILE || process.env.OCI_RESOURCE_PRINCIPAL_PRIVATE_PEM  // the last one is set by OCI for resource principal enabled functions
    const privateKey = fs.readFileSync(privateKeyPath, 'ascii');

    const options = {}
    options['privateKey'] = privateKey



    options.passphrase = null


    let resourcePrincipalEnabled = process.env.OCI_RESOURCE_PRINCIPAL_RPST != null
    console.info(`Resource Principal Enabled = ${resourcePrincipalEnabled}`)
    if (resourcePrincipalEnabled) {
        const sessionTokenFilePath = process.env.OCI_RESOURCE_PRINCIPAL_RPST
        const rpst = fs.readFileSync(sessionTokenFilePath, { encoding: 'utf8' })
        const payload = rpst.split('.')[1]
        const buff = Buffer.from(payload, 'base64')
        const payloadDecoded = buff.toString('ascii')
        const claims = JSON.parse(payloadDecoded)

        /* get tenancy id from claims */
        options['tenancyId'] = claims.res_tenant
        /*  set the keyId used to sign the request; the format here is the literal string 'ST$', followed by the entire contents of the RPST */
        options["keyId"] = `ST$${rpst}`
    } else {
        options['tenancyId'] = process.env.TENANCY_ID
        options["keyId"] = options.tenancyId + "/" + options.userId + "/" + options.keyFingerprint;
        options['keyFingerprint'] = process.env.KEY_FINGERPRINT
        options['userId'] = process.env.USER_ID
    }




    sign(request, options, body);
}


// signing function as described at https://docs.cloud.oracle.com/Content/API/Concepts/signingrequests.htm
function sign(request, options, body) {



    var headersToSign = [
        "host",
        "date",
        "(request-target)"
    ];

    var methodsThatRequireExtraHeaders = ["POST", "PUT"];

    if (methodsThatRequireExtraHeaders.indexOf(request.method.toUpperCase()) !== -1) {
        options.body = body || "";

        var shaObj = new jsSHA("SHA-256", "TEXT");
        shaObj.update(options.body);
        request.setHeader("Content-Length", options.body.length);
        request.setHeader("x-content-sha256", shaObj.getHash('B64'));
        headersToSign = headersToSign.concat([
            "content-type",
            "content-length",
            "x-content-sha256"
        ]);
    }

    httpSignature.sign(request, {
        key: options.privateKey,
        keyId: options.keyId,
        headers: headersToSign,
        passphrase: options.passphrase // only required if the Private Key file is passphrase protected; note: 
    });

    var newAuthHeaderValue = request.getHeader("Authorization").replace("Signature ", "Signature version=\"1\",");
    request.setHeader("Authorization", newAuthHeaderValue);
}


module.exports = {
    executeOCIAPIRequest: executeOCIAPIRequest

}