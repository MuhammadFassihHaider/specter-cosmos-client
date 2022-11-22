import Head from "next/head";
import { ChangeEventHandler, useState } from "react";
import toast from "react-hot-toast";
import { Spinner } from "../components/Spinner";
import styles from "../styles/Home.module.css";

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

const sendCoins = async (body: TSendCoinsApiArguments) => {
  const response = await fetch("http://localhost:3000/api/sendCoins", {
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

export default function Home() {
  const [formValues, setFormValues] = useState<TSendCoinsApiArguments>({
    amount: "",
    mnemonic: "",
    recipient: "",
  });
  const [showSpinner, setShowSpinner] = useState(false);

  const onSubmit = async () => {
    setShowSpinner(true);
    try {
      const response =
        !areValuesValid(formValues) && (await sendCoins(formValues));

      if (response?.error) {
        response?.error?.log
          ? toast.error(response?.error?.log)
          : toast.error(response?.error);
      }
    } catch (error: any) {
      error?.log ? toast.error(error.log) : toast.error("An error occured");
    } finally {
      setShowSpinner(false);
    }
  };

  const onChangeInput: ChangeEventHandler<HTMLInputElement> = (e) => {
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
        <div className={styles.inputContainer}>
          <input
            type="text"
            name="mnemonic"
            className={styles.input}
            placeholder="Sender Mnemonic"
            onChange={onChangeInput}
          />
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
