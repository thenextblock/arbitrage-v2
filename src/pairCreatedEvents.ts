require("dotenv").config();
import { utils, ethers, BigNumber, Signer } from "ethers";
import { formatUnits, parseUnits } from "ethers/lib/utils";
import { UniswapV2FactoryAbi__factory, ERC20Abi__factory } from "./types";
import { getV2Pairs } from "./graph/uniswapv2grap";
import { storePair } from "./db";
import * as _ from "lodash";
import Queue from "bull";
const DB_QUEE = new Queue("db");

const RPC_HOST = process.env.RPC_HTTP || "";
const RPC_WS = process.env.RPC_WS || "";

const EXCHNAGE_NAME = "Uniswap_V2";
const UNISWAP_V2_FACTORY_ADDRESS = "0x5c69bee701ef814a2b6a3edd4b1652cb9cc5aa6f";

const provider = new ethers.providers.JsonRpcProvider(RPC_HOST);
// const wsProvider = new ethers.providers.WebSocketProvider(RPC_WS);

(async () => {
  console.log("RPC : ", RPC_HOST);
  // console.log("Ethers: ", utils.toUtf8String("0x4156540000000000000000000000000000000000000000000000000000000000"));
  await pairCreatedEvents();
  // await getpairsViaGraph();
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

export async function pairCreatedEvents() {
  console.log("PAIR CREATED EVENTS ... ");
  const comptroller = UniswapV2FactoryAbi__factory.connect(UNISWAP_V2_FACTORY_ADDRESS, provider);
  let eventFilter = comptroller.filters.PairCreated();

  let startBlock = 10000835;
  let paging = 500000;
  let page = 4;

  let events = await comptroller.queryFilter(
    eventFilter,
    startBlock + paging * page,
    startBlock + paging * page + paging
  );

  let accounts: any = [];
  console.log("All Events : ", events.length);

  events.map((event: any) => {
    // token0: '0x2D80f5F5328FdcB6ECeb7Cacf5DD8AEDaEC94e20',
    // token1: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
    // pair: '0xAb360Cad76140B1D2bfee8BB2797d8424de52063'

    let { token0, token1, pair } = event.args;

    DB_QUEE.add({ token0, token1, pair });
    console.log("Pair : ", pair);
    console.log("----");
  });

  // events.map(event => {
  //   let { cToken, account } = event.args;
  //   accounts.push(account);
  // });

  // let _accounts: string[] = _.uniq(accounts);
  // console.log("Unique Accounts : ", _accounts.length);
  // return _accounts;
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

DB_QUEE.process(450, async (job: any, done: any) => {
  //   console.log(job.data);
  //   console.log("------------------------");
  // let { pair } = job.data;
  // let { id: pairAddress } = pair;
  // let { token0, token1 } = pair;
  // await storePair(EXCHNAGE_NAME, token0.id, token1.id, token0.symbol, token1.symbol, pairAddress);

  const { token0, token1, pair } = job.data;
  let token0Symbol = await getTokenSymbol(token0);
  let token1Symbol = await getTokenSymbol(token1);
  await storePair(EXCHNAGE_NAME, token0, token1, token0Symbol, token1Symbol, pair);

  done(null, job);
});

DB_QUEE.on("completed", async (job, result) => {
  if (result) {
    console.log("Finished ... ", job.data);
  }
  job.remove();
});
