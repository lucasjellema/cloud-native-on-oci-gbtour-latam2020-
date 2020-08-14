const ociRegion = "us-ashburn-1"
const configs = require('./oci-api-requestor/oci-configuration').configs;

describe('Tweet Report Digester', () => {
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
        process.env.STREAM_OCID = "ocid1.stream.oc1.iad.amaaaaaa6sde7caa2z74vlzm7ssoqd3q6qixbrineq7xxl2luffnvbpffxfa"
        process.env.TABLE_OCID = "ocid1.nosqltable.oc1.iad.amaaaaaa6sde7caa5pkd3yrfwfkigw4n7iwyn2avng4wbdi6nyw7cxnqm7fq"
    });

    afterAll(() => {
        process.env = OLD_ENV; // restore old env
    });

    const tweetReportDigester = require('./tweet-report-digester.js');

    test(`Test that request is returned in result`, async () => {
        const objectName = `tweets-Biden-2020-08-13T10:58:16.json`
        const bucketName = "twitter-reports"
        
        const tweetReportDigestionReport = await tweetReportDigester.digestTweetReport(objectName, bucketName)
        expect(tweetReportDigestionReport.request.filename).toBe(objectName)
        expect(tweetReportDigestionReport.request).toHaveProperty("tweets")
        expect(tweetReportDigestionReport.result).toHaveProperty("streamPublicationResult")
        expect(tweetReportDigestionReport.result).toHaveProperty("persistenceResult")
    })
    test(`Test that stream OCID is mandatory`, async () => {
        process.env.STREAM_OCID = null;
        expect.hasAssertions();
        // testing for exceptions thrown in asynchronous functions: https://www.valentinog.com/blog/throw-async/
        await expect(tweetReportDigester.digestTweetReport(null, null)).rejects.toThrowError()
    })

    test(`Test that table OCID is mandatory`, async () => {
        process.env.TABLE_OCID = null;
        expect.hasAssertions();
        // testing for exceptions thrown in asynchronous functions: https://www.valentinog.com/blog/throw-async/
        await expect(tweetReportDigester.digestTweetReport(null, null)).rejects.toThrowError()
    })

})