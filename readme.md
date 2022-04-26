### AVALANCE DEXES

- Avalanche DEXes:

- https://traderjoexyz.com/
  Factory: https://snowtrace.io/address/0x9ad6c38be94206ca50bb0d90783181662f0cfa10#code
  StartBlock: 2486392

  https://app.pangolin.exchange/
  PangolinFactory: https://snowtrace.io/address/0xefa94DE7a4656D787667C749f7E1223D71E9FD88#code

  https://exchange.yetiswap.app/
  https://app.elk.finance/
  https://avax.olive.cash/
  https://app.baguette.exchange/
  https://app.partyswap.io/
  https://app.canary.exchange/

### Uniswap

- RIUN CLI
- V2

```bash

   //-- TraderJo DEX
  ./build/pairCreatedEvents.js --from 2486392 --size 100000 --page 1 --concurency 300
  ./src/pairCreatedEvents.ts --from 10000835 --size 1000000 --page 1 --concurency 300

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

**##** **Working With Redis CLient**

**install**

```
npm install --global rdcli
```

_Connecting Redis viaCLI_

```
  rdcli -h localhost
```

**Redis CLI Commands**

_List all keys_

```
KEYS *
```

_search keys_

```
KEYS keys bull:cronjobs:*
```

_Clear FLUSH Database_

```
FLUSHHALL
```
