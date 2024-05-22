# DuetFaaS-code
## Install the required dependencies
```sh
pnpm install
```
## Build
```sh
pnpm build
```
## Run the build
```sh
node build/index.js
```
## Create Cloud infrastructure and experiments
```sh
cd infrastructure/aws-lambda
```

```sh
terraform apply
```

```sh
cd ../..
```

```sh
artillery run ./loadtest.yml --output report.json
```
