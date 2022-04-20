require("dotenv").config();
import { utils, ethers, BigNumber, Signer } from "ethers";
import { formatUnits, parseUnits, poll } from "ethers/lib/utils";
import { UniswapV2PairAbi__factory } from "./types";
import { getPairsByExchange, updateUniswapPairInfo, updateDecimalsInDatabase } from "./db";
import * as _ from "lodash";
import Queue from "bull";
import "colors";

const GET_LIQUDITY = new Queue("GET_LIQUDITY");
const RPC_HOST = process.env.RPC_HTTP || "";
const provider = new ethers.providers.JsonRpcProvider(RPC_HOST);
let QUEE_CONCURRENCY = 200;

(async () => {
  console.log("RPC: ", RPC_HOST);
})();

export async function getLiquidity() {
  let pairs = await getPairsByExchange();
  pairs.map(pair => {
    GET_LIQUDITY.add({ _pair: pair });
  });

  await queeMonitor(GET_LIQUDITY);
}

async function getPairLiquidty(token0: string, token1: string, pair: string) {
  try {
    const uniswap_V2_pair = UniswapV2PairAbi__factory.connect(pair, provider);
    let { _reserve0, _reserve1, _blockTimestampLast } = await uniswap_V2_pair.getReserves();
    //console.log(`Pair: ${pair}, _reserve0: ${_reserve0} _reserve1: ${_reserve1} `);
  } catch (err: any) {
    console.log(`ERROR ON PAIR : ${pair}`);
  }
}

GET_LIQUDITY.process(QUEE_CONCURRENCY, async (job: any, done: any) => {
  let { _pair } = job.data;
  let { token0, token1, pair, token0_decimals, token1_decimals } = _pair;
  //   console.log(token0, token1);
  await getPairLiquidty(token0, token1, pair);
  done(null, job);
});

GET_LIQUDITY.on("completed", async (job, result) => {
  console.log(result);
  if (result) {
    console.log("Finished ... ", job.data);
  }
  job.remove();
});

async function queeMonitor(QUEE: Queue.Queue<any>) {
  let counter = 0;
  setInterval(function () {
    GET_LIQUDITY.getJobCounts()
      .then(function (result) {
        console.log("\r" + "Queue status: ", result);
        console.log("\r" + "Counter: ", counter, "Running Time : ", (counter * 10) / 60, "Minutes");
        counter++;

        console.log("----------");
        if (result.active === 0 && counter > 10) {
          console.log("Process Finished !!! FLUSH REDIS DATABASE !!!");
          GET_LIQUDITY.empty();
          return true;
        }
      })
      .catch(function () {
        console.log("Error in finding out the status of the queue");
      });
  }, 3000);
}
