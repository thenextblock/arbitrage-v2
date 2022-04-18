### Uniswap

- RIUN CLI
- V2

```bash

   //-- uniswap_v2
  ./build/pairCreatedEvents.js --from 10000835 --size 1000000 --page 1 --concurency 300
  ./src/pairCreatedEvents.ts --from 10000835 --size 1000000 --page 1 --concurency 300

  //-- uniswap_v3
  ./build/poolCreateEventV3.js --from 12369621  --size 1000000 --page 1 --concurency 300
  ./src/poolCreateEventV3.ts --from 12369621  --size 1000000 --page 1 --concurency 300

  //-- sushiswap
  ./build/pairCreateEventSushi.js --from 10794229  --size 1000000 --page 1 --concurency 300
  ./src/pairCreateEventSushi.ts --from 10794229  --size 1000000 --page 1 --concurency 300

```

- V3
- Factory Addresses:

  uniswapV2: 0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f | Block Number: 10000835
  uniswapV3: 0x1F98431c8aD98523631AE4a59f267346ea31F984 | Block Number: 12369621
  sushiswap: 0xc0aee478e3658e2610c5f7a4a2e1777ce9e4f2ac | Block Number: 10794229

-- How to get volumes

1. getPairAddress

https://docs.uniswap.org/protocol/V2/guides/smart-contract-integration/getting-pair-addresses
CREATE2
Thanks to some fancy footwork in the factory, we can also compute pair addresses without any on-chain lookups because of CREATE2. The following values are required for this technique:

2.

-- Subgraphs
https://github.com/Uniswap/v2-subgraph
https://github.com/Uniswap/v3-subgraph
