# Project NS Assignment

## Setup
### Prerequisites
- Node.js
- AWS CLI (for deployment)
- AWS Toolkit (for development and testing)
- Docker (optional, for containerization)

### Installation
1. Clone the repository:
    ```sh
    git clone https://github.com/yourusername/project-ns.git
    ```
2. Navigate to the project directory:
    ```sh
    cd project-ns
    ```
3. Install dependencies:
    ```sh
    npm install
    ```

## Running the Project Locally
To test and run various functions AWS Toolkit is advised. Please note that without deployment, only lambda functions can be deployed.

### Lambda Functions
- **checkOptimalRoute**:
    - Environment Variables:
        ```env
        NS_API_KEY=your_api_key
        ```
- **sortRouteByComfort**:
    - Environment Variables:
        ```env
        NSPRODUCTCACHE_TABLE_ARN=your_table_arn
        NSPRODUCTCACHE_TABLE_NAME=your_table_name
        NS_API_KEY=your_api_key
        ```

### Testing the API Gateway
To test the API Gateway, read the deployment section.

## Deployment
1. Build the project:
    ```sh
    npm run build
    ```
2. Deploy the project using the AWS Toolkit or AWS CLI with the `template.yaml` file:
```sh
aws cloudformation deploy --template-file template.yaml --stack-name your-stack-name --capabilities CAPABILITY_IAM
```

## Environment Variables
The following environment variables are used in this project:
- `NS_API_KEY`: Your API key for external NS services.
- `NSPRODUCTCACHE_TABLE_ARN`: The ARN of the product cache table.
- `NSPRODUCTCACHE_TABLE_NAME`: The name of the product cache table.

Make sure to set these variables in your environment or in a `.env` file before running the project.

## Contributing
Contributions are not currently being accepted for this project.

## License
This project is licensed under the MIT License.
