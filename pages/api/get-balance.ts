import {
  SigningStargateClient
} from "@cosmjs/stargate";
import type { NextApiRequest, NextApiResponse } from "next";
import { rpcEndpoint } from "../../utils/constants";
import { getAddressNWalletFromMnemonic } from "../../utils/getAddressNWalletFromMnemonic";

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
