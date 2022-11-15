const { Stack, CfnOutput } = require('aws-cdk-lib');
const { Bucket } = require('aws-cdk-lib/aws-s3');
const { OriginAccessIdentity, Distribution } = require('aws-cdk-lib/aws-cloudfront');
const { S3Origin } = require('aws-cdk-lib/aws-cloudfront-origins');
const { HostedZone, RecordTarget, ARecord } = require('aws-cdk-lib/aws-route53');
const { CloudFrontTarget } = require('aws-cdk-lib/aws-route53-targets');
const { BucketDeployment, Source } = require('aws-cdk-lib/aws-s3-deployment');
const { Certificate } = require('aws-cdk-lib/aws-certificatemanager');

class TileTogetherStaticAssetsStack extends Stack {
  constructor (scope, id, props) {
    super(scope, id, props);

    const staticAssetsBucket = new Bucket(this, 'tiletogether-static-assets-bucket', {
      bucketName: 'tiletogether-static-assets-bucket',
      // block all public access
      publicReadAccess: false,
    });
    // const staticAssetsBucket = Bucket.fromBucketName(this, 'tiletogether-static-assets-bucket', 'tiletogether-static-assets-bucket');

    // create origin access identity to let cloudfront read the bucket
    const originAccessIdentity = new OriginAccessIdentity(this, 'tiletogether-static-assets-origin-access-identity');
    staticAssetsBucket.grantRead(originAccessIdentity.grantPrincipal);

    // use route 53 hosted zone to manage domain name
    const hostedZone = HostedZone.fromHostedZoneAttributes(this, 'tiletogether-static-assets-hosted-zone', {
      zoneName: 'tiletogether.com',
      hostedZoneId: 'Z05580483QUOQZ38URHS5',
    });

    // const certificate = new DnsValidatedCertificate(this, 'tiletogether-static-assets-certificate', {
    //   domainName,
    //   hostedZone,
    //   region: 'us-east-1',
    // });
    // use existing certificate
    const certificate = Certificate.fromCertificateArn(this, 'tiletogether-static-assets-certificate', 'arn:aws:acm:us-east-1:542773719222:certificate/095b6dc8-ab68-4507-9ea0-59ebc33e3602');

    // create cloudfront distribution
    // make sure index.html is error page so that spa react app can handle routing
    // eslint-disable-next-line no-unused-vars
    const distribution = new Distribution(this, 'tiletogether-static-assets-distribution', {
      defaultRootObject: 'index.html',
      domainNames: ['www.tiletogether.com'],
      certificate,
      errorResponses: [
        {
          httpStatus: 404,
          responsePagePath: '/index.html',
          responseHttpStatus: 200,
        },
        {
          httpStatus: 403,
          responsePagePath: '/index.html',
          responseHttpStatus: 200,
        },
      ],
      // redirect to https
      defaultBehavior: {
        origin: new S3Origin(staticAssetsBucket, { originAccessIdentity }),
        viewerProtocolPolicy: 'redirect-to-https',
      },
    });

    // create route53 record
    // eslint-disable-next-line no-unused-vars
    const record = new ARecord(this, 'tiletogether-static-assets-record', {
      recordName: 'www.tiletogether.com',
      target: RecordTarget.fromAlias(new CloudFrontTarget(distribution)),
      zone: hostedZone,
    });

    // create bucket deployment
    // eslint-disable-next-line no-unused-vars
    const bucketDeployment = new BucketDeployment(this, 'tiletogether-static-assets-deployment', {
      sources: [Source.asset('./website/')],
      destinationBucket: staticAssetsBucket,
      distribution,
      distributionPaths: ['/*'],
    });

    // return cloudfront url as output
    // eslint-disable-next-line no-unused-vars
    const output = new CfnOutput(this, 'tiletogetherstaticassetsCloudFrontURL', {
      value: distribution.distributionDomainName,
    });
  }
}

module.exports = { TileTogetherStaticAssetsStack };
