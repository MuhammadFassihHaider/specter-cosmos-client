import Head from "next/head";
import { ChangeEventHandler, useState } from "react";
import toast from "react-hot-toast";
import { Spinner } from "../components/Spinner";
import styles from "../styles/Home.module.css";
import { ACCOUNTS, BASE_URL } from "../utils/constants";

type TSendCoinsApiArguments = {
  mnemonic: string;
  recipient: string;
  amount: string;
};

const areValuesValid: (valueToValidate: TSendCoinsApiArguments) => boolean = (
  valueToValidate
) => {
  if (valueToValidate.mnemonic.split(" ").length !== 24) {
    toast.error("Mnemonic needs to have length of 24!");
    return true;
  } else if (
    !valueToValidate.mnemonic &&
    !valueToValidate.recipient &&
    !valueToValidate.amount
  ) {
    toast.error("All values are required!");
    return true;
  }

  return false;
};

const makeShortMnemonic = (mnemonic: string) => {
  const splitMn = mnemonic.split(" ");

  if (splitMn.length !== 24) return "";

  const leftMn = [splitMn[0], splitMn[1], splitMn[3]];
  const rightMn = [splitMn[21], splitMn[22], splitMn[23]];

  return `${leftMn.join(" ")} ... ${rightMn.join(" ")}`;
};

const sendCoins = async (body: TSendCoinsApiArguments) => {
  const response = await fetch(`${BASE_URL}:3000/api/send-coins`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      ...body,
    }),
  });
  return response.json();
};

const handleEdgeCasesForErrors = (error: string) => {
  /**
   * https://github.com/cosmos/cosmos-sdk/issues/11997
   * The issue for length arises because of library issue (dependency mismatch)
   */
  if (error.includes("Not Allowed") || error.includes("panic")) {
    toast.error("Not Allowed!");
  } else if (error.includes("Length")) {
    toast.success("Success");
  } else {
    toast.error(error);
  }
};

export default function Home() {
  const [formValues, setFormValues] = useState<TSendCoinsApiArguments>({
    amount: "",
    mnemonic: "",
    recipient: "",
  });
  const [showSpinner, setShowSpinner] = useState(false);
  const [balance, setBalance] = useState("");
  const [selectedMnemonicAddress, setSelectedMnemonicAddress] = useState("");

  const onSubmit = async () => {
    setShowSpinner(true);
    try {
      const response =
        !areValuesValid(formValues) && (await sendCoins(formValues));

      if (response?.error) {
        if (response?.error?.log) {
          toast.error(response?.error?.log);
        } else {
          handleEdgeCasesForErrors(response.error);
        }
      }

      await getBalance(formValues.mnemonic);
    } catch (error: any) {
      error?.log ? toast.error(error.log) : toast.error("An error occured");
    } finally {
      setShowSpinner(false);
    }
  };

  const getBalance = async (mnemonic: string) => {
    setShowSpinner(true);
    try {
      const response = await fetch(`${BASE_URL}:3000/api/get-balance`, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          mnemonic,
        }),
      });
      const data = await response.json();
      setBalance(`${data.data.amount} ${data.data.denom}`);
    } catch (error) {
      toast.error("Unable to fetch balance");
    } finally {
      setShowSpinner(false);
    }
  };

  const onChangeInput: ChangeEventHandler<
    HTMLInputElement | HTMLSelectElement
  > = async (e) => {
    if (e.target.name === "mnemonic") {
      getBalance(e.target.value);
      setSelectedMnemonicAddress(
        ACCOUNTS.find((account) => account.mnemonic === e.target.value)
          ?.address ?? ""
      );
    }

    setFormValues({
      ...formValues,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className={styles.container}>
      <Head>
        <title>Cosmos Client</title>
      </Head>
      {showSpinner && <Spinner />}
      <div className={styles.card}>
        <p>Balance: {balance ? balance : ""}</p>
        <p>Selected Mnemonic Address: {selectedMnemonicAddress}</p>
        <div className={styles.inputContainer}>
          <select
            onChange={onChangeInput}
            value={formValues.mnemonic}
            className={styles.input}
            name="mnemonic"
          >
            <option>Select Mnemonic</option>
            {ACCOUNTS.map((account) => (
              <option key={account.mnemonic} value={account.mnemonic}>
                {account.label} ({makeShortMnemonic(account.mnemonic)})
              </option>
            ))}
          </select>
          <input
            type="text"
            name="recipient"
            className={styles.input}
            placeholder="Recipient Address"
            onChange={onChangeInput}
          />
          <input
            type="text"
            name="amount"
            className={styles.input}
            placeholder="Amount to Send"
            onChange={onChangeInput}
          />
        </div>
        <button className={styles.button} onClick={onSubmit}>
          Send coins
        </button>
      </div>
    </div>
  );
}
