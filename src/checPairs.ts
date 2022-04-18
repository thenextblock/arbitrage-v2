require("dotenv").config();
import { utils, ethers, BigNumber, Signer } from "ethers";
import { formatUnits, parseUnits, poll } from "ethers/lib/utils";
import { UniswapV3FactoryAbi__factory, UniswapV2FactoryAbi__factory, ERC20Abi__factory } from "./types";
import { getPairsByExchange, updateUniswapPairInfo, updateSushiswapPairInfo } from "./db";
import * as _ from "lodash";
import Queue from "bull";
import args from "args";
import "colors";

args
  .option("from", "Starting Block")
  .option("size", "paging size", 500000)
  .option("page", "page", 0)
  .option("concurency", "how many paralelt Procces you need", 488);

const CHECK_PAIRS_QUEE = new Queue("checkpairs");
const RPC_HOST = process.env.RPC_HTTP || "";
const EXCHNAGE_NAME = "Uniswap_V3";
const provider = new ethers.providers.JsonRpcProvider(RPC_HOST);

let QUEE_CONCURRENCY = 400;

(async () => {
  console.log("RPC: ", RPC_HOST);
  CHECK_PAIRS_QUEE.empty();
  await getAllPairs();
})();

async function getAllPairs() {
  let pairs = await getPairsByExchange(EXCHNAGE_NAME);

  //   {
  //     id: '4175',
  //     exchange_name: 'Uniswap_V3',
  //     token0: '0x8A732BC91c33c167F868E0af7e6f31e0776d0f71',
  //     token1: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
  //     token0_symbol: 'LTK',
  //     token1_symbol: 'WETH',
  //     pair: '0x09Aa844C57278a2A53821f90a4CBEFfCC540e7E3',
  //     fee: 10000
  //   },

  pairs.map(pair => {
    CHECK_PAIRS_QUEE.add({ _pair: pair });
  });
}

export async function checkPair(token0: string, token1: string, pair: string) {
  console.log("Check Pair: ");
  const UNISWAP_V2_FACTORY_ADDRESS = "0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f";
  const uniswap_V2 = UniswapV2FactoryAbi__factory.connect(UNISWAP_V2_FACTORY_ADDRESS, provider);

  const SUSHISWAP_FACTORY_ADDRESS = "0xc0aee478e3658e2610c5f7a4a2e1777ce9e4f2ac";
  const sushiswap = UniswapV2FactoryAbi__factory.connect(SUSHISWAP_FACTORY_ADDRESS, provider);

  let uniswap_v2_pool = await uniswap_V2.getPair(token0, token1);
  let sushiswap_v2_pool = await sushiswap.getPair(token0, token1);

  const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";
  if (uniswap_v2_pool !== ZERO_ADDRESS && sushiswap_v2_pool !== ZERO_ADDRESS) {
    console.log(`uniswap_v2_pool: ${uniswap_v2_pool},  sushiswap_v2_pool: ${sushiswap_v2_pool}`);
  }

  if (uniswap_v2_pool !== ZERO_ADDRESS) {
    await updateUniswapPairInfo(uniswap_v2_pool, pair);
  }
  if (sushiswap_v2_pool !== ZERO_ADDRESS) {
    await updateSushiswapPairInfo(sushiswap_v2_pool, pair);
  }
}

CHECK_PAIRS_QUEE.process(QUEE_CONCURRENCY, async (job: any, done: any) => {
  let { _pair } = job.data;
  //   console.log(_pair);
  let { token0, token1, pair } = _pair;
  await checkPair(token0, token1, pair);
  done(null, job);
});

CHECK_PAIRS_QUEE.on("completed", async (job, result) => {
  if (result) {
    console.log("Finished ... ", job.data);
  }
  job.remove();
});

async function queeMonitor(QUEE: Queue.Queue<any>) {
  let counter = 0;
  setInterval(function () {
    CHECK_PAIRS_QUEE.getJobCounts()
      .then(function (result) {
        console.log("\r" + "Queue status: ", result);
        console.log("\r" + "Counter: ", counter, "Running Time : ", (counter * 10) / 60, "Minutes");
        counter++;

        console.log("----------");
        if (result.active === 0 && counter > 10) {
          console.log("Process Finished !!! FLUSH REDIS DATABASE !!!");
          CHECK_PAIRS_QUEE.empty();
          return true;
        }
      })
      .catch(function () {
        console.log("Error in finding out the status of the queue");
      });
  }, 5000);
}
