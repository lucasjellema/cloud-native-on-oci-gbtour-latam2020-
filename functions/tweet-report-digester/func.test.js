const ociRegion = "us-ashburn-1"
const configs = require('./oci-api-requestor/oci-configuration').configs;

describe('Func', () => {
    const OLD_ENV = process.env;

    beforeEach(() => {
        jest.resetModules() // clears the cache
        process.env = { ...OLD_ENV }; // sets the original set of environment variable values

        process.env['PRIVATE_KEY_FILE'] = `${__dirname}/oci-api-requestor/oci_api_key.pem`
        process.env.KEY_FINGERPRINT = configs.keyFingerprint
        process.env.TENANCY_ID = configs.tenancyId
        process.env.USER_ID = configs.authUserId
        process.env.REGION = ociRegion
        process.env.COMPARTMENT_OCID = configs.compartmentId
        process.env.OCI_NAMESPACE = configs.namespaceName
    });

    afterAll(() => {
        process.env = OLD_ENV; // restore old env
    });


    // simply require func.js registers the function (input, context) with mock fdk
    const func = require('./func.js');
    const fdk = require('@fnproject/fdk');
    const input ={ "filename" : "somefile"}
    const context = {
        "headers": {
            "Host": "localhost", "Content-Type": "application/json"
        }
    }
    const theFunction = fdk.functionCache() // get the function that was registered in func.js with the (mock) fdk handler
    test(`Test of func.js `, async () => {

        const result = await theFunction(input, context)
        expect(result.queryData).toHaveProperty("filename")


    })
})