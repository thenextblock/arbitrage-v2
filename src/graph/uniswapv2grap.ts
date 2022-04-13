import axios from "axios";

/**
 * Call Graph Node get only {hasBorrowed} accounts
 *
 * @param {*} pageSize
 * @param {*} skip
 */

export async function getV2Pairs(pageSize: number, skip: number): Promise<any> {
  return axios({
    url: "https://api.thegraph.com/subgraphs/name/uniswap/uniswap-v2",
    method: "post",
    data: {
      query: ` 
                {	
                    pairs(first: ${pageSize}, skip: ${skip}) {
                        id
                        token0 {
                            id
                            symbol
                        }
                        token1 {
                            id
                            symbol
                        }
                    }
                }
      `,
    },
  }).then((result: any) => {
    return result.data;
  });
}
