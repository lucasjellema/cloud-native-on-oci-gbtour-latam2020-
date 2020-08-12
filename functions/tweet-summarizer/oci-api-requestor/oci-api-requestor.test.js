const configs = require('./oci-configuration').configs;

const ociAPIRequestor = require('./oci-api-requestor.js');
const ociRegion = "us-ashburn-1"

describe('OCI API Requestor Test', () => {
    const OLD_ENV = process.env;

    beforeEach(() => {
        jest.resetModules() // clears the cache
        process.env = { ...OLD_ENV }; // sets the original set of environment variable values
        process.env['PRIVATE_KEY_FILE'] = `${__dirname}/../oci-api-requestor/oci_api_key.pem`
        process.env.KEY_FINGERPRINT = configs.keyFingerprint
        process.env.TENANCY_ID = configs.tenancyId
        process.env.USER_ID = configs.authUserId
        process.env.REGION = ociRegion
    });

    afterAll(() => {
        process.env = OLD_ENV; // restore old env
    });
   

    test(`Test that result of retrieving a list of regions is defined`, async () => {
        const requestOptions = {
            host: `identity.${ociRegion}.oraclecloud.com`,
            path: `/20160918/regions`,
            method: 'GET',
            headers: {
            }
        };
        const response = await ociAPIRequestor.executeOCIAPIRequest(requestOptions, null)
        const regions = JSON.parse(response)
        expect(response).toBeDefined()
        expect(regions[0]).toHaveProperty("key")
        expect(regions[0]).toHaveProperty("name")
    })

})