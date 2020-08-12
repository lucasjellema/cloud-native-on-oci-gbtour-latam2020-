const ociRegion = "us-ashburn-1"
const configs = require('../oci-api-requestor/oci-configuration').configs;

describe('OCI Object Writer', () => {
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

    const objectWriter = require('./oci-object-writer.js');
    const content= `{"myContent":"Hello World and Beyond"}`
    const objectName = `unit-test-oci-object-writer-myFile-${new Date().getTime()}.json`
    const bucketName = "tweet-reports"
    

    test(`Test that result exists and contains property object ocid`, async () => {
        const result = await objectWriter.writeObject(content,objectName, bucketName)
        expect(result).toBeDefined()
       
        expect(result).toHaveProperty('fileName') 
    })
    test(`Test that Namespace must be set`, async () => {
        process.env.OCI_NAMESPACE = null
        expect.hasAssertions()
        await expect(objectWriter.writeObject(content,objectName, bucketName)).rejects.toThrowError()
    })   
     test(`Test that region must be set`, async () => {
        process.env.REGION = null
        expect.hasAssertions()
        await expect(objectWriter.writeObject(content,objectName, bucketName)).rejects.toThrowError()
    })

})