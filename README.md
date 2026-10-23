# Deleted Video Title Finder for YouTube™

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

## Deployment (extension)

The extension is published to the Chrome Web Store by the [`Deploy Extension`](.github/workflows/deploy-extension.yml) workflow.

Every push to `main` that changes the `version` in [`front/src/manifest.json`](front/src/manifest.json) builds `front/build/tell-me-the-title.zip`, uploads it with the Chrome Web Store API v2 and submits the new version for review. Pushes that leave the version unchanged skip publication, because the store rejects versions that are equal to or lower than the published one. The workflow can also be started manually from the Actions tab (`workflow_dispatch`) to retry a failed publication; bump the version first if the current one was already published.

Authentication uses a Google Cloud service account linked to the Chrome Web Store publisher, so no long-lived OAuth refresh token is stored. The workflow exchanges the service account key for a short-lived `chromewebstore` access token with [`google-github-actions/auth`](https://github.com/google-github-actions/auth).

### One-time setup

1. The extension must already exist in the [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole). The API cannot create a new item. Complete the Store listing and Privacy tabs before the first automated upload.
1. Create a Google Cloud project (or reuse an existing one; no billing account is required) and enable the [Chrome Web Store API](https://console.cloud.google.com/apis/library/chromewebstore.googleapis.com). This repository uses the `tell-me-the-title-cws` project.
1. Create a service account in that project (no IAM roles are needed):

   ```sh
   gcloud iam service-accounts create cws-publisher \
     --display-name="Chrome Web Store publisher" \
     --project=tell-me-the-title-cws
   ```

1. Create a JSON key for it and store the file contents as the `CHROME_SERVICE_ACCOUNT_JSON` repository secret (Settings → Secrets and variables → Actions). Never commit the key.

   ```sh
   gcloud iam service-accounts keys create cws-key.json \
     --iam-account=cws-publisher@tell-me-the-title-cws.iam.gserviceaccount.com
   gh secret set CHROME_SERVICE_ACCOUNT_JSON --repo OWNER/REPO < cws-key.json
   rm cws-key.json
   ```

1. Link the service account to the publisher. In the Developer Dashboard, open **Account** and add `cws-publisher@tell-me-the-title-cws.iam.gserviceaccount.com` in the service account section. A publisher can link one service account.
1. Find the extension ID (the 32-character ID in the item's dashboard URL) and the publisher ID (**Publisher** → **Settings**) and add them as repository variables:

| Name                  | Kind     | Description                               |
| --------------------- | -------- | ----------------------------------------- |
| `CHROME_EXTENSION_ID` | Variable | 32-character Chrome Web Store item ID     |
| `CHROME_PUBLISHER_ID` | Variable | Publisher ID from the Developer Dashboard |

Publication is not immediate: the submitted version stays in review until Google approves it.

### Firefox (addons.mozilla.org)

The extension is also submitted to [addons.mozilla.org](https://addons.mozilla.org) (AMO) by the [`Deploy Firefox Add-on`](.github/workflows/deploy-firefox.yml) workflow, which runs in addition to the Chrome one.

It shares the Chrome workflow's trigger and version gate: every push to `main` that changes the `version` in the manifest lints `front/build` with `web-ext lint` and submits it with `web-ext sign --channel listed` ([web-ext](https://github.com/mozilla/web-ext), Mozilla's official CLI), which waits for AMO's automated review approval and downloads the signed XPI. A version that was already submitted - published, waiting for review, or left behind by a run that hit the 15-minute approval timeout - is skipped, because AMO rejects duplicate version numbers. The workflow can also be started manually from the Actions tab (`workflow_dispatch`).

The manifest's [`browser_specific_settings.gecko.id`](front/src/manifest.json) identifies the add-on on AMO, so the workflow needs no variables.

### One-time setup (Firefox)

1. The manifest already contains `browser_specific_settings.gecko.id`. Never change it: AMO treats the same version re-uploaded under a different ID as a different add-on.
1. The workflow can only add versions to an add-on that already exists on AMO with complete listing metadata (license, categories, screenshots). Create the listing once by building the zip locally and uploading it through the [Developer Hub](https://addons.mozilla.org/developers/addons/submit/):

   ```sh
   npm run build -w front
   ```

1. Generate API credentials (JWT issuer/secret pair) at [addons.mozilla.org/developers/addon/api/key/](https://addons.mozilla.org/developers/addon/api/key/) and store them as repository secrets (Settings → Secrets and variables → Actions). Never commit them.

| Name             | Kind   | Description                              |
| ---------------- | ------ | ---------------------------------------- |
| `AMO_JWT_KEY`    | Secret | JWT issuer from the AMO API keys page    |
| `AMO_JWT_SECRET` | Secret | JWT secret from the AMO API keys page    |

Submissions are not immediate either: Mozilla's automated review usually approves the version within minutes, but manual review can take longer. A run that fails on the approval timeout still leaves the version submitted; re-running the workflow afterwards skips it.

## Usage

1. Navigate to any YouTube playlist page.
2. Buttons will appear next to videos.
3. Click on the button to retrieve the title of the deleted video.

## Contributing

Contributions are welcome! If you have any ideas, suggestions, or bug reports, please open an issue or submit a pull request.

## License

This project is licensed under the [MIT License](LICENSE).
