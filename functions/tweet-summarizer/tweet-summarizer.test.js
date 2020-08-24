const ociRegion = "us-ashburn-1"
const configs = require('./oci-api-requestor/oci-configuration').configs;

describe('Tweet Summarizer', () => {
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

    const tweetSummarizer = require('./tweet-summarizer.js');
    const hashtag = "oracle"
    const minutes = 10
    const twitterClientCredentialsSecretOCID = "ocid1.vaultsecret.oc1.iad.amaaaaaa6sde7caapotgnzrzq6lehyeeef3wprzwcyejk3gvh6prqxvicqxa"

    test(`Test that request is returned in result`, async () => {
        process.env.TWITTER_CREDENTIALS_SECRET_OCID = twitterClientCredentialsSecretOCID
        const tweetSummary = await tweetSummarizer.aggregateTweets(hashtag, minutes)
        expect(tweetSummary.request.hashtag).toBe(hashtag)
        expect(tweetSummary.request.minutes).toBe(minutes)
        expect(tweetSummary.result.numberOfTweets).toBeGreaterThan(5)
    })
    test(`Test that negative number of minutes is not allowed`, async () => {
        const minutes = -10
        expect.hasAssertions();
        // testing for exceptions thrown in asynchronous functions: https://www.valentinog.com/blog/throw-async/
        await expect(tweetSummarizer.aggregateTweets(hashtag, minutes)).rejects.toThrowError()
    })
    test(`Test that the number of minutes is not allowed to surpass 7 days`, async () => {
        const minutes = 7 * 24 * 60 + 5
        expect.hasAssertions();
        await expect(tweetSummarizer.aggregateTweets(hashtag, minutes)).rejects.toThrowError()
    })
})