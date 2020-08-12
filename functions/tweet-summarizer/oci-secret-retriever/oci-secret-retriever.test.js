const ociRegion = "us-ashburn-1"
const configs = require('../oci-api-requestor/oci-configuration').configs;

describe('OCI Secret Retriever', () => {
    const OLD_ENV = process.env;

    beforeEach(() => {
        jest.resetModules() // clears the cache
        process.env = { ...OLD_ENV }; // sets the original set of environment variable values
        process.env['PRIVATE_KEY_FILE'] = `${__dirname}/../oci-api-requestor/oci_api_key.pem`
        process.env.KEY_FINGERPRINT = configs.keyFingerprint
        process.env.TENANCY_ID = configs.tenancyId
        process.env.USER_ID = configs.authUserId
        process.env.REGION = ociRegion
        process.env.COMPARTMENT_OCID = configs.compartmentId
    });

    afterAll(() => {
        process.env = OLD_ENV; // restore old env
    });

    const secretRetriever = require('./oci-secret-retriever.js');
    const secretOCID = "ocid1.vaultsecret.oc1.iad.amaaaaaa6sde7caapotgnzrzq6lehyeeef3wprzwcyejk3gvh6prqxvicqxa"

    test(`Test that result exists and contains property consumer_key`, async () => {
        const secretValue = await secretRetriever.retrieveSecret(secretOCID)
        expect(secretValue).toBeDefined()
        const twitterCredentials = JSON.parse(secretValue.replace(/'/g, '"')) // secret is defined with single quotation marks, which is not processed correctly
        expect(twitterCredentials).toHaveProperty('consumer_key') // property expected in Twitter credentials
    })
    test(`Test that compartment OCID must be set`, async () => {
        process.env.COMPARTMENT_OCID = null
        expect.hasAssertions()
        await expect(secretRetriever.retrieveSecret(secretOCID)).rejects.toThrowError()
    })   
     test(`Test that region must be set`, async () => {
        process.env.REGION = null
        expect.hasAssertions()
        await expect(secretRetriever.retrieveSecret(secretOCID)).rejects.toThrowError()
    })

})