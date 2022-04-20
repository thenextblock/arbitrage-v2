console.log("___A___");
import _ from "lodash";
import { pairCreatedEvents } from "./pairCreatedEvents";
import { getAllPairsAndCheck } from "./checPairs";
import { getAllPairsAndUpdateDecimals } from "./updateDecimals";
import { getLiquidity } from "./getLiquidity";

(async () => {
  console.log("Start !!! ");

  await getLiquidity();

  // await getAllPairsAndUpdateDecimals();

  // Check Pair
  // const EXCHNAGE_NAME = "traderjoexyz";
  // const FACTORY_ADDRESS = "0xefa94DE7a4656D787667C749f7E1223D71E9FD88";
  // const rowName = "pangolin";
  // await getAllPairsAndCheck(FACTORY_ADDRESS, rowName);

  //  Fetch Pairs
  //   const FACTORY_ADDRESS = "";
  //   let startBlock = 2486392;
  //   const currentBlock = 13633435;
  //   const pageSize = 100000;
  //   let totalPages = (currentBlock - startBlock) / pageSize;
  //   let _page = 1;

  //   while (_page < totalPages) {
  //     console.log("Page : ", _page);
  //     await pairCreatedEvents(FACTORY_ADDRESS, startBlock, pageSize, _page);
  //     _page++;
  //     await new Promise(f => setTimeout(f, 1000));
  //   }
})();
