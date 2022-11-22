// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from "next";
import { DirectSecp256k1HdWallet } from "@cosmjs/proto-signing";
import { SigningStargateClient } from "@cosmjs/stargate";

const rpcEndpoint = "http://65.109.38.98:26657/";
// const recipient = "cosmos1dgm29huv8unqxnngm6hrwsmuy5w0qgpa4pz4fk";
// const mnemonic =
//   "anger sound wisdom mind swarm tip cruel come wife couple flame sadness mule kid impose silly strong fall this dance fancy rate junk slot";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<string | Object>
) {
  console.log("new request =>>>>>>>>>>>>");
  if (req.method === "POST") {
    try {
      validateValues(req.body)
        ? await sendCoinsPOST(
            req.body.mnemonic,
            req.body.recipient,
            req.body.amount,
            res
          )
        : res.status(400).send({ error: "Invalid values" });
    } catch (error) {
      res.status(400).json({ error });
    }
  } else res.status(400).send({ error: "Invalid HTTP method" });
}

const validateValues = (body: NextApiRequest["body"]) => {
  if (
    !!body.mnemonic &&
    !!body.recipient &&
    !!body.amount &&
    body.mnemonic.split(" ").length === 24
  )
    return true;
  else return false;
};

const getAddressNWalletFromMnemonic = async (mnemonic: string) => {
  const wallet = await DirectSecp256k1HdWallet.fromMnemonic(mnemonic);
  const [firstAccount] = await wallet.getAccounts();

  return { senderAddress: firstAccount.address, wallet };
};

const sendCoinsPOST = async (
  mnemonic: string,
  recipient: string,
  amount: string,
  res: NextApiResponse<string | Object>
) => {
  try {
    const { senderAddress, wallet } = await getAddressNWalletFromMnemonic(
      mnemonic
    );

    const client = await SigningStargateClient.connectWithSigner(
      rpcEndpoint,
      wallet
    );

    const _amount = {
      denom: "stake",
      amount,
    };

    const fee = {
      amount: [
        {
          denom: "stake",
          amount: "2000",
        },
      ],
      gas: "180000", // 180k
    };

    return await client.sendTokens(senderAddress, recipient, [_amount], fee);
  } catch (error: any) {
    console.log({ error: error.message });
    res.status(400).send({error: error.message})
  }
};
