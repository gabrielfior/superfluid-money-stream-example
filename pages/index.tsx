import { Framework } from '@superfluid-finance/sdk-core';
import { ethers } from 'ethers';
import Head from 'next/head';
import Image from 'next/image';
import { useCallback, useState } from 'react';
import { useEffect } from 'react';
import { useAccount, useConnect, useDisconnect, useEnsAvatar, useEnsName, useProvider, useSigner } from 'wagmi';
import styles from '../styles/Home.module.css';
import { Alert, Button, Input } from 'antd';
import { UserOutlined } from '@ant-design/icons';
import { toast } from 'react-toastify';


export default function Home() {
  const { address, isConnecting, isDisconnected, isConnected } = useAccount();
  const { data: signer, isError, isLoading } = useSigner();
  const [sf, setSf] = useState<Framework>();
  const [recipient, setRecipient] = useState("0xa3Ec5B9E71CeAE19765c6033220BFB70Fc647FB8");

  const provider = useProvider();

  const fetchData = useCallback(async () => {
    let framework = await Framework.create({
      chainId: provider.network.chainId, //i.e. 137 for matic
      provider: provider
    });
    console.log('fm', framework);
    setSf(framework);
  }, []);

  useEffect(() => {
    fetchData().catch(console.error);
  }, [fetchData, provider]);



  const sendLumpSum = async () => {
    console.log('sendLumpSum', sf);

    const sender = await signer!.getAddress();
    if (!ethers.utils.isAddress(recipient) || !ethers.utils.isAddress(sender)) {
      toast("Sender or recipient address not valid");
      return;
    }

    const DAIxContract = await sf!.loadSuperToken("fDAIx");
    console.log('dai cont', DAIxContract);
    const createFlowOperation = sf!.cfaV1.createFlow({
      sender: sender,
      receiver: recipient,
      superToken: DAIxContract.address,
      flowRate: "1",
    });
    try {
      console.log('entered try');
      const tx = await createFlowOperation.getSignedTransaction(signer!);
      const result = await provider.sendTransaction(tx);
      //const result = await createFlowOperation.exec(signer!,{gas: 800000});
      console.log(result);
    }
    catch (error: any) {
      console.error(error);
      toast.error(((error.message) as string).slice(0, 20));
    }
  };

  return (
    <div className={styles.container}>
      <Head>
        <title>Money streamer</title>
        <meta name="description" content="Generated by create next app" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      {isConnected &&

        <div>
          <Input placeholder="default size" prefix={<UserOutlined />} value={recipient} onChange={(e) => setRecipient(e.target.value)} />

          <Button shape='round' type="primary" onClick={sendLumpSum}>Send lump sum</Button>
        </div>}

    </div>
  )
}
