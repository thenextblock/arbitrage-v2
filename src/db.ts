import { Pool, QueryResult } from "pg";
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
  pair: string,
  fee: number
) => {
  const sql = `
        insert into pairs_awax (exchange_name,token0,token1,token0_symbol,token1_symbol, pair, fee)
                values ($1,$2,$3,$4,$5,$6,$7);
  `;
  const data = [exchangeName, token0, token1, token0Symbol, token1Symbol, pair, fee];

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

export const getPairsByExchange = async (): Promise<any[]> => {
  const sql = `select * from pairs_awax where pangolin != '0x0000000000000000000000000000000000000000';`;
  // const sql = `select * from pairs_awax where pangolin != '0x0000000000000000000000000000000000000000' limit 10;`;
  try {
    let result = await pool.query(sql, []);
    return result.rows;
  } catch (err) {
    console.log(err);
    return [];
  }
};

export const updateUniswapPairInfo = async (uniswapPairAddress: string, pairAddress: string, rowName: string) => {
  const sql = `update pairs_awax set ${rowName} = $1 where pair = $2;`;
  // console.log("Sql : ", sql);
  const data = [uniswapPairAddress, pairAddress];
  try {
    await pool.query(sql, data);
  } catch (err) {
    console.log(err);
  }
};

export const updateDecimalsInDatabase = async (token0Decimals: string, token1Decimals: string, pairAddress: string) => {
  const sql = `update pairs_awax set 
                    toke0_decimals = $1 , toke1_decimals = $2 
                            where pair  = $3;`;

  const data = [token0Decimals, token1Decimals, pairAddress];
  try {
    await pool.query(sql, data);
  } catch (err) {
    console.log(err);
  }
};
