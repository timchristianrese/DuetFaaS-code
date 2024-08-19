# DuetFaaS-code
## Research
If you use this paper in your research, please cite it as the following:

### Text
T. C. Rese, N. Japke, S. Koch, T. Pfandzelter, and D. Bermbach, **Increasing Efficiency and Result Reliability of Continuous Benchmarking for FaaS Applications**, 2024.
### BibTex
```bibtex
@article{rese2024duetfaas,
  title={Increasing Efficiency and Result Reliability of Continuous Benchmarking for FaaS Applications},
  author={Rese, Tim Christian and Japke, Nils and Koch, Sebastian and Pfandzelter, Tobias and Bermbach, David},
  year={2024}
}
```
## Paper 
https://arxiv.org/abs/2405.15610
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
