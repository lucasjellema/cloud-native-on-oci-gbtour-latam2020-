const ociRegion = "us-ashburn-1"
const configs = require('../oci-api-requestor/oci-configuration').configs;

describe('OCI Object Reader', () => {
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
        process.env.OCI_NAMESPACE = configs.namespaceName
    });

    afterAll(() => {
        process.env = OLD_ENV; // restore old env
    });

    const objectReader = require('./oci-object-reader.js');

    const objectName = `tweets-Biden-2020-08-13T10:58:16.json`
    const bucketName = "twitter-reports"
    

    test(`Test that result exists and contains property object ocid`, async () => {
        const result = await objectReader.readObject(objectName, bucketName)
        expect(result).toBeDefined() 
        expect(result.response.length).toBeGreaterThan(10)    
    
    })
    test(`Test that Namespace must be set`, async () => {
        process.env.OCI_NAMESPACE = null
        expect.hasAssertions()
        await expect(objectReader.readObject(objectName, bucketName)).rejects.toThrowError()
    })   
     test(`Test that region must be set`, async () => {
        process.env.REGION = null
        expect.hasAssertions()
        await expect(objectReader.readObject(objectName, bucketName)).rejects.toThrowError()
    })

})