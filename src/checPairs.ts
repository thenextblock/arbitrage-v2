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
const provider = new ethers.providers.JsonRpcProvider(RPC_HOST);

let QUEE_CONCURRENCY = 400;

(async () => {
  console.log("RPC: ", RPC_HOST);
  // CHECK_PAIRS_QUEE.empty();
  // await getAllPairs();
})();

export async function getAllPairsAndCheck(factoryAddress: string, rowName: string) {
  let pairs = await getPairsByExchange(); // TODO: remove exchange Name
  pairs.map(pair => {
    CHECK_PAIRS_QUEE.add({ _pair: pair, factoryAddress: factoryAddress, rowName: rowName });
  });
}

async function checkPair(token0: string, token1: string, pair: string, factoryAddress: string, rowName: string) {
  // console.log("Check Pair: ", factoryAddress, token0, token1, pair);
  try {
    const uniswap_V2 = UniswapV2FactoryAbi__factory.connect(factoryAddress, provider);
    let uniswap_v2_pool = await uniswap_V2.getPair(token0, token1);
    const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

    if (uniswap_v2_pool !== ZERO_ADDRESS) {
      console.log(`uniswap_v2_pool: ${uniswap_v2_pool} `);
    }

    if (uniswap_v2_pool !== ZERO_ADDRESS) {
      await updateUniswapPairInfo(uniswap_v2_pool, pair, rowName);
    }
  } catch (err: any) {
    console.log(`ERROR ON PAIR : ${pair}`);
  }
}

CHECK_PAIRS_QUEE.process(QUEE_CONCURRENCY, async (job: any, done: any) => {
  let { _pair } = job.data;
  let { token0, token1, pair } = _pair;
  let { factoryAddress, rowName } = job.data;
  await checkPair(token0, token1, pair, factoryAddress, rowName);
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
