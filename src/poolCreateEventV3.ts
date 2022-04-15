require("dotenv").config();
import { utils, ethers, BigNumber, Signer } from "ethers";
import { formatUnits, parseUnits, poll } from "ethers/lib/utils";
import { UniswapV3FactoryAbi__factory, ERC20Abi__factory } from "./types";
import { getV2Pairs } from "./graph/uniswapv2grap";
import { storePair } from "./db";
import * as _ from "lodash";
import Queue from "bull";
import args from "args";
import "colors";

args
  .option("from", "Starting Block")
  .option("size", "paging size", 500000)
  .option("page", "page", 0)
  .option("concurency", "how many paralelt Procces you need", 488);

const DB_QUEE = new Queue("db");
const RPC_HOST = process.env.RPC_HTTP || "";
// const RPC_WS = process.env.RPC_WS || "";

const EXCHNAGE_NAME = "Uniswap_V3";
const UNISWAP_V2_FACTORY_ADDRESS = "0x1f98431c8ad98523631ae4a59f267346ea31f984"; // uniswap v3 factory address

const provider = new ethers.providers.JsonRpcProvider(RPC_HOST);
// const wsProvider = new ethers.providers.WebSocketProvider(RPC_WS);

let QUEE_CONCURRENCY = 500;

(async () => {
  console.log("RPC: ", RPC_HOST);
  DB_QUEE.empty();
  const flags = args.parse(process.argv);
  const { from, size, page, concurency } = flags;
  QUEE_CONCURRENCY = concurency;

  if (!from) {
    console.log(`Please provide Starting Block`.red);
    return;
  }

  if (!page) {
    console.log(`Please provide  Page Number -P`.red);
    return;
  }

  console.log("-".repeat(80).gray);
  console.log(`PROCESS -> From ${from}, Size: ${size} Page: ${page}, Concurency: ${concurency} `.green);
  console.log("-".repeat(80).gray);

  await queeMonitor(DB_QUEE);
  await pairCreatedEvents(from, size, page - 1);
})();

export async function getpairsViaGraph() {
  let pairsCount = 1;
  let page = 0;
  let pageSize = 500;

  while (pairsCount !== 0) {
    let { data } = await getV2Pairs(pageSize, page * pageSize);
    console.log("Page: ", page, "Fetched : ", data.pairs.length);
    pairsCount = data.pairs.length;

    if (pairsCount !== 0) {
      console.log(`PAGE: ${page}  ADD JOBS IN QUEE`);
      data.pairs.map((pair: any) => {
        DB_QUEE.add({ pair });
      });
    }
    // pairsCount = 0; // using for stop
    page += 1;
  }
}

export async function pairCreatedEvents(_startBlock: number, _size: number, _page: number) {
  console.log("POOL CREATED EVENTS ... ");
  const uniswapFactory = UniswapV3FactoryAbi__factory.connect(UNISWAP_V2_FACTORY_ADDRESS, provider);
  let eventFilter = uniswapFactory.filters.PoolCreated();

  // TODO : Optimize this shitty Code here
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
    let { token0, token1, fee, tickSpacing, pool } = event.args;
    DB_QUEE.add({ token0: token0, token1: token1, fee: fee, tickSpacing: tickSpacing, pool: pool });
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
  // emit PoolCreated(token0, token1, fee, tickSpacing, pool);
  let { token0, token1, fee, tickSpacing, pool } = job.data;

  let token0Symbol = await getTokenSymbol(token0);
  let token1Symbol = await getTokenSymbol(token1);
  await storePair(EXCHNAGE_NAME, token0, token1, token0Symbol, token1Symbol, pool);

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
