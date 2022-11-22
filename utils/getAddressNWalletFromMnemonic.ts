import { DirectSecp256k1HdWallet } from "@cosmjs/proto-signing";

export const getAddressNWalletFromMnemonic = async (mnemonic: string) => {
    const wallet = await DirectSecp256k1HdWallet.fromMnemonic(mnemonic);
    const [firstAccount] = await wallet.getAccounts();
  
    return { senderAddress: firstAccount.address, wallet };
  };