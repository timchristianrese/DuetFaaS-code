# Analysis

## Aggregate Results
Move all files from the experiments folders into the respective top level (aws being traditional/RMIT results, duet being duet benchmarking top level), and then run the `analysis_aggregate`scripts.
## Calculate CI Size Development
The scripts in `analysis_calc` can be used to calculate the confidence interval size development. We calculate the bootstrap percentile intervals from a sample size of 50 all the way up to 1500 results.
## Calculate