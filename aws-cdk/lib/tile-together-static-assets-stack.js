const { Stack } = require('aws-cdk-lib');
const { Bucket } = require('aws-cdk-lib/aws-s3');
const { BucketDeployment, Source } = require('aws-cdk-lib/aws-s3-deployment');
const { OriginAccessIdentity, Distribution } = require('aws-cdk-lib/aws-cloudfront');
const { S3Origin } = require('aws-cdk-lib/aws-cloudfront-origins');

class TileTogetherStaticAssetsStack extends Stack {
  constructor (scope, id, props) {
    super(scope, id, props);

    const staticAssetsBucket = new Bucket(this, 'tiletogether-static-assets-bucket', {
      bucketName: 'tiletogether-static-assets-bucket',
      publicReadAccess: true,
      websiteIndexDocument: 'index.html',
    });

    // eslint-disable-next-line no-unused-vars
    const bucketDeployment = new BucketDeployment(this, 'tiletogether-static-assets-deployment', {
      sources: [Source.asset('./website/')],
      destinationBucket: staticAssetsBucket,
    });

    // create origin access identity
    const originAccessIdentity = new OriginAccessIdentity(this, 'tiletogether-static-assets-origin-access-identity');
    staticAssetsBucket.grantRead(originAccessIdentity.grantPrincipal);

    // create cloudfront distribution
    // make sure index.html is error page so that spa react app can handle routing
    // eslint-disable-next-line no-unused-vars
    const distribution = new Distribution(this, 'tiletogether-static-assets-distribution', {
      defaultRootObject: 'index.html',
      errorResponses: [
        {
          httpStatus: 404,
          responsePagePath: '/index.html',
        },
      ],
      defaultBehavior: {
        origin: new S3Origin(staticAssetsBucket, { originAccessIdentity }),
      },
    });
  }
}

module.exports = { TileTogetherStaticAssetsStack };
