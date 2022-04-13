import { Pool } from "pg";
import config from "./config";

const pool = new Pool(config.db);

/**
 * Add Pair
 * @param Accont Address
 */

export const storePair = async (
  exchangeName: string,
  token0: string,
  token1: string,
  token0Symbol: string,
  token1Symbol: string,
  pair: string
) => {
  const sql = `
        insert into pairs (exchange_name,token0,token1,token0_symbol,token1_symbol, pair)
                values ($1,$2,$3,$4,$5,$6);
  `;
  const data = [exchangeName, token0, token1, token0Symbol, token1Symbol, pair];

  try {
    await pool.query(sql, data);
  } catch (err) {
    console.log(err);
  }
};

/**
 *
 * @param blockNumber
 * @param exchangeRate
 */

// export const storeExchangeRates = async (blockNumber: number, exchangeRate: string) => {
//   const sql = `insert into exchange_rates ("blockNumber", price) values ($1,$2);`;
//   const data = [blockNumber, exchangeRate];
//   try {
//     await pool.query(sql, data);
//   } catch (err) {
//     console.log(err);
//   }
// };
