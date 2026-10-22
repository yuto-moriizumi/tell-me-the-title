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

Set these repository secrets before the first run:

| Secret                  | Description                                  |
| ----------------------- | -------------------------------------------- |
| `AWS_ACCESS_KEY_ID`     | Access key ID of the deployment IAM user     |
| `AWS_SECRET_ACCESS_KEY` | Secret access key of the deployment IAM user |

The IAM user needs permissions for CloudFormation, S3, Lambda, API Gateway, IAM (to manage the function's execution role) and CloudWatch Logs.

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
