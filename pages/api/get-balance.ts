// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from "next";
import { coins, DirectSecp256k1HdWallet } from "@cosmjs/proto-signing";
import {
  assertIsDeliverTxSuccess,
  calculateFee,
  GasPrice,
  SigningStargateClient,
  StdFee,
} from "@cosmjs/stargate";
import { getAddressNWalletFromMnemonic } from "../../utils/getAddressNWalletFromMnemonic";
import { rpcEndpoint } from "../../utils/constants";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<string | Object>
) {
  try {
    if (req.method === "POST") {
      const balance = await getBalanceGET(req.body.mnemonic);
      if (balance.denom) res.status(200).send({ data: balance });
      else res.status(400).send({ error: "An error occured!" });
    } else res.status(400).send({ error: "Invalid HTTP method" });
  } catch (error) {
    res.status(400).send({ error: "An error occured!" });
  }
}

const getBalanceGET = async (mnemonic: string) => {
  const { senderAddress, wallet } = await getAddressNWalletFromMnemonic(
    mnemonic
  );

  const client = await SigningStargateClient.connectWithSigner(
    rpcEndpoint,
    wallet
  );

  return await client.getBalance(senderAddress, "stake");
};
