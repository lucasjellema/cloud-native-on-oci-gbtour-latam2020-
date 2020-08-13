const ociRegion = "us-ashburn-1"
const configs = require('../oci-api-requestor/oci-configuration').configs;

describe('Tweet Streamer', () => {
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
        process.env.STREAM_OCID = "ocid1.stream.oc1.iad.amaaaaaa6sde7caa2z74vlzm7ssoqd3q6qixbrineq7xxl2luffnvbpffxfa"
    });

    afterAll(() => {
        process.env = OLD_ENV; // restore old env
    });

    const tweetStreamer = require('./tweet-streamer.js');

    test(`Test of tweetStreamer `, async () => {
        const tweets = [{"key":"message1", "value":"value1"}, {"key":"message2", "value":"value2"}]
        const result = await tweetStreamer.publishTweetsOnStream({"tweets": tweets})
        expect(result.size).toBe(tweets.size)
    })
})