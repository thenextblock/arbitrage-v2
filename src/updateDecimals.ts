require("dotenv").config();
import { utils, ethers, BigNumber, Signer } from "ethers";
import { formatUnits, parseUnits, poll } from "ethers/lib/utils";
import { UniswapV3FactoryAbi__factory, UniswapV2FactoryAbi__factory, ERC20Abi__factory } from "./types";
import { getPairsByExchange, updateUniswapPairInfo, updateDecimalsInDatabase } from "./db";
import * as _ from "lodash";
import Queue from "bull";
import args from "args";
import "colors";

const UPDATE_DECIMALS = new Queue("UPDATE_DECIMALS");
const RPC_HOST = process.env.RPC_HTTP || "";
const provider = new ethers.providers.JsonRpcProvider(RPC_HOST);

let QUEE_CONCURRENCY = 400;

(async () => {
  console.log("RPC: ", RPC_HOST);
})();

export async function getAllPairsAndUpdateDecimals() {
  let pairs = await getPairsByExchange();
  pairs.map(pair => {
    UPDATE_DECIMALS.add({ _pair: pair });
  });
}

async function updateDecimals(token0: string, token1: string, pair: string) {
  try {
    const token0Instance = ERC20Abi__factory.connect(token0, provider);
    const token1Instance = ERC20Abi__factory.connect(token1, provider);

    let token0Decimals = await token0Instance.decimals();
    let token1Decimals = await token1Instance.decimals();

    await updateDecimalsInDatabase(token0Decimals.toString(), token1Decimals.toString(), pair);
  } catch (err: any) {
    console.log(`ERROR ON PAIR : ${pair}`);
  }
}

UPDATE_DECIMALS.process(QUEE_CONCURRENCY, async (job: any, done: any) => {
  let { _pair } = job.data;
  let { token0, token1, pair } = _pair;
  console.log(token0, token1);
  await updateDecimals(token0, token1, pair);
  done(null, job);
});

UPDATE_DECIMALS.on("completed", async (job, result) => {
  if (result) {
    console.log("Finished ... ", job.data);
  }
  job.remove();
});
