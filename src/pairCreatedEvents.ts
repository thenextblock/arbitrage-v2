require("dotenv").config();
import { utils, ethers, BigNumber, Signer } from "ethers";
// import { formatUnits, parseUnits } from "ethers/lib/utils";
import { UniswapV2FactoryAbi__factory, ERC20Abi__factory } from "./types";
import { storePair } from "./db";
import * as _ from "lodash";
import Queue from "bull";
import args from "args";
import "colors";

const DB_QUEE = new Queue("db");
const RPC_HOST = process.env.RPC_HTTP || "";
const provider = new ethers.providers.JsonRpcProvider(RPC_HOST);

const EXCHNAGE_NAME = "traderjoexyz";
let QUEE_CONCURRENCY = 500;

(async () => {
  console.log("RPC: ", RPC_HOST);
})();

export async function pairCreatedEvents(factoryAddress: string, _startBlock: number, _size: number, _page: number) {
  console.log("PAIR CREATED EVENTS ... ");
  const uniswapFactory = UniswapV2FactoryAbi__factory.connect(factoryAddress, provider);
  let eventFilter = uniswapFactory.filters.PairCreated();

  //TODO : Optimize this shitty Code here
  let startBlock = _startBlock;
  let paging = _size;
  let page = _page;

  console.log(`Events From: ${startBlock + paging * page} To: ${startBlock + paging * page + paging}`.yellow);

  let events = await uniswapFactory.queryFilter(
    eventFilter,
    startBlock + paging * page,
    startBlock + paging * page + paging
  );

  let accounts: any = [];
  console.log("All Events : ", events.length);

  events.map((event: any) => {
    let { token0, token1, pair } = event.args;
    DB_QUEE.add({ token0, token1, pair });
  });
}

async function getTokenSymbol(_token: string): Promise<string> {
  let contract = ERC20Abi__factory.connect(_token, provider);
  let symbol = "ERROR";
  try {
    symbol = await contract.symbol();
  } catch (err: any) {
    console.log("Error Get Symbol :", _token);
  }
  return symbol;
}

DB_QUEE.process(QUEE_CONCURRENCY, async (job: any, done: any) => {
  const { token0, token1, pair } = job.data;
  console.log(token0, token1, pair);
  console.log("---------------------");

  let token0Symbol = await getTokenSymbol(token0);
  let token1Symbol = await getTokenSymbol(token1);
  await storePair(EXCHNAGE_NAME, token0, token1, token0Symbol, token1Symbol, pair, 3000);

  done(null, job);
});

DB_QUEE.on("completed", async (job, result) => {
  if (result) {
    console.log("Finished ... ", job.data);
  }
  job.remove();
});

async function queeMonitor(QUEE: Queue.Queue<any>) {
  let counter = 0;
  setInterval(function () {
    DB_QUEE.getJobCounts()
      .then(function (result) {
        console.log("\r" + "Queue status: ", result);
        console.log("\r" + "Counter: ", counter, "Running Time : ", (counter * 10) / 60, "Minutes");
        counter++;

        console.log("----------");
        if (result.active === 0 && counter > 10) {
          console.log("Process Finished !!! FLUSH REDIS DATABASE !!!");
          DB_QUEE.empty();
          return true;
        }
      })
      .catch(function () {
        console.log("Error in finding out the status of the queue");
      });
  }, 5000);
}
