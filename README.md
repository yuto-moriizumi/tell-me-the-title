# Tell me the title

Know the YouTube deleted video title!
This browser extension adds a button to each deleted YouTube video, allowing users to retrieve the title of the video.

## Installation for devs

1. Clone this repository or download the source code.
1. `npm run build -w front` to emit the zip file
1. Open your browser's extension management page.
1. Click on "Load unpacked" and select the folder containing the extension's source code.

## Deployment (API)

The API is deployed to AWS Lambda (ap-northeast-1) with the [Serverless Framework](https://www.serverless.com/).

Every push to `main` triggers the [`Deploy API`](.github/workflows/deploy-api.yml) workflow, which installs dependencies, typechecks the `api` workspace and runs `serverless deploy`. You can also start it manually from the Actions tab (`workflow_dispatch`).

The workflow authenticates with GitHub's OIDC provider and assumes an IAM role, so no long-lived AWS access keys are stored in the repository.

#### One-time AWS setup

1. In IAM, create an OpenID Connect identity provider for `https://token.actions.githubusercontent.com` with the audience `sts.amazonaws.com`. Skip this step if the account already has GitHub's provider.
1. Create an IAM role that the workflow assumes. Restrict its trust policy to the `main` branch of this repository and replace `<ACCOUNT_ID>`:

   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Effect": "Allow",
         "Principal": {
           "Federated": "arn:aws:iam::<ACCOUNT_ID>:oidc-provider/token.actions.githubusercontent.com"
         },
         "Action": "sts:AssumeRoleWithWebIdentity",
         "Condition": {
           "StringEquals": {
             "token.actions.githubusercontent.com:aud": "sts.amazonaws.com",
             "token.actions.githubusercontent.com:sub": "repo:yuto-moriizumi/tell-me-the-title:ref:refs/heads/main"
           }
         }
       }
     ]
   }
   ```

1. Attach a policy that allows CloudFormation, S3, Lambda, API Gateway, IAM (to manage the function's execution role), CloudWatch Logs, CloudWatch (alarms) and SNS.
1. In the repository, add an Actions variable named `AWS_ROLE_ARN` (Settings → Secrets and variables → Actions → Variables) with the ARN of the role.

| Variable       | Description                                          |
| -------------- | ---------------------------------------------------- |
| `AWS_ROLE_ARN` | ARN of the IAM role that the deploy workflow assumes |

The `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` repository secrets are no longer used and can be deleted.

### 5xx error notifications

The stack creates a CloudWatch alarm (`<service>-<stage>-api-5xx`) that watches API Gateway's `5XXError` metric and publishes to an SNS topic with an email subscription to `Ysiki.Shokurin@gmail.com`. This covers both 5xx responses returned by the app (e.g. `500` / `502` from `/snapshot`) and Lambda failures such as timeouts.

The alarm fires when 3 or more 5xx responses occur within 5 minutes, and also notifies again when it recovers. **The email subscription must be confirmed once**: after the first deploy, click the confirmation link in the "AWS Notification - Subscription Confirmation" email. Until then the subscription stays in `PendingConfirmation` and no notifications are delivered.

To deploy from your machine, use the same CLI version as CI:

```sh
cd api
npx --yes serverless@3.40.0 deploy
```

## Usage

1. Navigate to any YouTube playlist page.
2. Buttons will appear next to videos.
3. Click on the button to retrieve the title of the deleted video.

## Contributing

Contributions are welcome! If you have any ideas, suggestions, or bug reports, please open an issue or submit a pull request.

## License

This project is licensed under the [MIT License](LICENSE).
