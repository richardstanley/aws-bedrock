# Switchblade Athena API

A serverless API for querying data using Amazon Athena with natural language processing.

## Features

- Natural language to SQL query conversion
- CSV file upload to S3
- Automatic Athena table creation
- Real-time query results
- User authentication and authorization
- Chat history and context management

## Prerequisites

- Node.js 18+
- AWS CLI configured with appropriate credentials
- AWS CDK CLI installed globally (`npm install -g aws-cdk`)

## Project Structure

```
.
├── bin/
│   └── app.ts              # CDK app entry point
├── lib/
│   ├── stacks/
│   │   └── main-stack.ts   # Main infrastructure stack
│   ├── constructs/         # Custom CDK constructs
│   └── utils/              # Utility functions
├── test/
│   └── main-stack.test.ts  # Infrastructure tests
├── package.json
├── tsconfig.json
└── README.md
```

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Build the project:
   ```bash
   npm run build
   ```

3. Run tests:
   ```bash
   npm test
   ```

4. Deploy to AWS:
   ```bash
   npm run deploy
   ```

## Infrastructure

- **S3 Buckets**
  - Query results bucket
  - CSV upload bucket

- **DynamoDB Tables**
  - Chat history
  - User preferences
  - CSV metadata

- **Cognito**
  - User authentication
  - Authorization

- **Athena**
  - Query execution
  - Table management

- **CloudWatch**
  - Application logs
  - Metrics

## Development

1. Make changes to the infrastructure code in `lib/stacks/`
2. Run tests: `npm test`
3. Deploy changes: `npm run deploy`
4. Destroy stack: `npm run destroy`

## Testing

- Unit tests: `npm test`
- Integration tests: Coming soon
- E2E tests: Coming soon

## Security

- S3 bucket encryption
- DynamoDB encryption
- Cognito user authentication
- IAM role-based access
- CloudWatch logging

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests
5. Submit a pull request

## License

MIT