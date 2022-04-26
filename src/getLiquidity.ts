require("dotenv").config();
import { utils, ethers, BigNumber, Signer } from "ethers";
import { formatUnits, parseUnits, poll } from "ethers/lib/utils";
import { UniswapV2PairAbi__factory } from "./types";
import { getPairsByExchange, updateUniswapPairInfo, updateDecimalsInDatabase } from "./db";
import * as _ from "lodash";
import Queue from "bull";
import "colors";

const RPC_HOST = process.env.RPC_HTTP || "";
const provider = new ethers.providers.JsonRpcProvider(RPC_HOST);
let QUEE_CONCURRENCY = 200;

interface IRESERVEDATAITEM {
  _reserve0: BigNumber;
  _reserve1: BigNumber;
  _blocTimestamp: number;
}

interface IPOOL {
  TokenId1: string;
  TokenId2: string;
  Reserves1: string;
  Reserves2: string;
}

interface IPOOLITEM {
  [pool: string]: IPOOL;
}

let GET_LIQUDITY: Queue.Queue<any> = new Queue(`GET_LIQUDITY`);

(async () => {
  console.log("RPC: ", RPC_HOST);
})();

let allPairs: IPOOLITEM[] = [];

export async function getLiquidity(pairs: any[], id: number): Promise<any> {
  console.log("... Start get data !!!  ");
  let promise = new Promise((resolve, reject) => {
    pairs.map(pair => {
      GET_LIQUDITY.add({ _pair: pair, total: pairs.length });
    });

    let interval = setInterval(() => {
      console.log("Allpairs : ", allPairs.length);
      GET_LIQUDITY.getJobCounts().then(function (result) {
        console.log("\r" + "Active Jobs : ", result.active);
        if (result.active === 0) {
          clearInterval(interval);
          resolve(allPairs);
        }
      });
      // if (allPairs.length === pairs.length) {
      //   console.log("Async is done!");
      //   console.log("Now All paits ar ready ... ");
      //   resolve(allPairs);
      // }
    }, 1000);
  });

  return promise;
}

async function getPairLiquidty(token0: string, token1: string, pair: string): Promise<IRESERVEDATAITEM> {
  let response: IRESERVEDATAITEM = {
    _reserve0: parseUnits("0"),
    _reserve1: parseUnits("0"),
    _blocTimestamp: 0,
  };
  try {
    const uniswap_V2_pair = UniswapV2PairAbi__factory.connect(pair, provider);
    let { _reserve0, _reserve1, _blockTimestampLast } = await uniswap_V2_pair.getReserves();
    response._reserve0 = _reserve0;
    response._reserve1 = _reserve1;
    response._blocTimestamp = _blockTimestampLast;
  } catch (err: any) {
    console.log(`ERROR ON PAIR : ${pair}`);
    console.log(err);
  } finally {
    return response;
  }
}

GET_LIQUDITY.process(QUEE_CONCURRENCY, async (job: any, done: any) => {
  let { _pair, total } = job.data;
  let {
    token0,
    token1,
    pair: pair1,
    token0_symbol,
    token1_symbol,
    token0_decimals,
    token1_decimals,
    pangolin: pair2,
  } = _pair;
  let pair1_result = await getPairLiquidty(token0, token1, pair1);
  let pair2_result = await getPairLiquidty(token0, token1, pair2);

  // console.log(_pair);
  // console.log("-");
  // console.log(pair1_result);
  // console.log("----------");

  let t = {};

  let poolitem = {
    [pair1]: {
      tokenAddress1: token0,
      tokenAddress2: token1,
      tokenName1: token0_symbol,
      tokenName2: token1_symbol,
      Reserves1: formatUnits(pair1_result._reserve0, token0_decimals),
      Reserves2: formatUnits(pair1_result._reserve1, token1_decimals),
    },
    [pair2]: {
      tokenAddress1: token0,
      tokenAddress2: token1,
      tokenName1: token0_symbol,
      tokenName2: token1_symbol,
      Reserves1: formatUnits(pair2_result._reserve0, token0_decimals),
      Reserves2: formatUnits(pair2_result._reserve1, token1_decimals),
    },
  };

  // console.log("-----------------------------------------");
  // console.log(poolitem);
  // console.log("-----------------------------------------");
  done(null, poolitem);
});

GET_LIQUDITY.on("completed", async (job, result) => {
  // console.log(`Job completed Pairs ... ${allPairs.length}`);
  // console.log(result);
  allPairs.push(result);
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
          // GET_LIQUDITY.empty();
          return true;
        }
      })
      .catch(function () {
        console.log("Error in finding out the status of the queue");
      });
  }, 2000);
}
