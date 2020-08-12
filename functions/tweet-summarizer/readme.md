# Tweet Summarizer

this module reads tweets for a specified hashtag from Twitter over the last X minutes
and creates a JSON report with all tweets retrieved
and writes this report to OCI Object Storage


## technical notes
the module is to be wrapped in an Fn Function to be deployed on OCI Functions platform
when deployed as Function, the Function will benefit from a dynamic group policy on OCI to become Resource enabled (and get a generated private key and configuration file injected); when running stand alone, the module needs a stand alone OCI private key file and configuration file.

the module assumes it retrieves Twitter Client Credentials from an OCI Vault in the form of a secret. the module could also be allowed to use locally defined credentials.

            OCI Private Key & Config
             |  
             v
Fn func =>  Tweet Summarizer  =>  OCI Object Storage
             |           |
             v           v
             Twitter     OCI Vault

Note: environment details are not passed to the module as (functional) parameter, but instead through environment variables. Variables can be set for:
- vault & secret: compartment, vault (name/OCID), secret (name/OCID)
- OCI authentication: OCI config & private key
- OCI Object Storage: bucket, namespace (, compartment?)            

### technical design

module is implemented using Node
the module has a side-effect - creation of a file on OCI Object Storage; the module has a composed result object, that contains { "request" {startdate, enddate, hashtag}; "result" {number of tweets, filename, file OCID}}

* tweet-summarizer
  * retrieve tweets (given number of minutes and hashtags, retrieve tweets and return as JSON document) - this module needs Twitter credentials; it uses npm module twit
  * prepare tweet report (given result from retrieve tweets, produce JSON document)
  * write file to OCI object storage bucket - this module needs target compartment, namespace, bucket

  * oci-secret-retriever (to retrieve a secret from an OCI Vault) - takes secret OCID (or name?), vault OCID (or name) and compartment OCID (or name); returns the plain text (not base64 encoded) contents of the secret
  * oci-api-requestor (to make requests of OCI REST API - such as get secret from vault and write file to object storage) - this module need to use private key and config (either from local files or inject ); it uses npm modules http-signature and jssha

tweet-summarizer.js ( => oci-secret-retriever -> oci-api-requestor)
|- tweet-retriever (input: twitter credential provider, hashtag, number of minutes of history from now)  -> twit
|- tweet-report-processor (input: twitter search result)
|- oci-object-storage-writer (input: print-ready JSON object, compartment, bucket)
   |- oci-api-requestor
|- oci-secret-retriever (input: secret (name or ocid), compartment, vault)
   |- oci-api-requestor   

testing is done through Jest

deployment as Function to OCI is done using OCI CLI

test cases