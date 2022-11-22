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
import { rpcEndpoint } from "../../utils/constants";
import { getAddressNWalletFromMnemonic } from "../../utils/getAddressNWalletFromMnemonic";



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



const sendCoinsPOST = async (
  mnemonic: string,
  recipient: string,
  _amount: string,
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

    const amount = coins(_amount, "stake");

    const defaultGasPrice = GasPrice.fromString("0.025stake");
    const defaultSendFee: StdFee = calculateFee(80_000, defaultGasPrice);

    const balances = await client.getAllBalances(recipient);
    console.log({ balances });

    const transaction = await client.sendTokens(
      senderAddress,
      recipient,
      amount,
      defaultSendFee,
      "Transaction"
    );


    assertIsDeliverTxSuccess(transaction);
  } catch (error: any) {
    console.log({ error: error.message });
    res.status(400).send({ error: error.message });
  }
};
