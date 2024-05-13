export function sieveOfEratosthenes(trials: number) {
  // Create an array where each element starts as true
  const numsArr = Array.from({ length: trials + 1 }, () => true);

  // Loop through numsArr starting from numsArr[2]
  // keep running the loop until i is greater than the input's square root
  for (let i = 2; i <= Math.floor(Math.sqrt(trials)); i++) {
    // Check if numsArr[i] === true
    if (numsArr[i]) {
      /* 
            convert all elements in the numsArr 
            whose indexes are multiples of i 
            to false
            */
      for (let j = i + i; j <= trials; j += i) {
        numsArr[j] = false;
      }
    }
  }

  const primeNumbers = numsArr.reduce(
    (result, element, index) =>
      element ? (result.push(index), result) : result,
    [] as number[]
  );

  return primeNumbers;
}
