import { Framework, Stream_OrderBy, SuperToken } from '@superfluid-finance/sdk-core';
import { BigNumber, ethers } from 'ethers';
import Head from 'next/head';
import Image from 'next/image';
import { useCallback, useState } from 'react';
import { useEffect } from 'react';
import { useAccount, useConnect, useDisconnect, useEnsAvatar, useEnsName, useProvider, useSigner } from 'wagmi';
import styles from '../styles/Home.module.css';
import { Alert, Button, Divider, Input, InputNumber, Space, Table } from 'antd';
import { UserOutlined } from '@ant-design/icons';
import { toast } from 'react-toastify';
import { ColumnsType, ColumnType } from 'antd/lib/table';
import Column from 'antd/lib/table/Column';


export default function Home() {
  const { address, isConnecting, isDisconnected, isConnected } = useAccount();
  const { data: signer, isError, isLoading } = useSigner();
  const [sf, setSf] = useState<Framework>();
  const [recipient, setRecipient] = useState("0xf2dE657241260fc67662F042f7858A619630504c");
  const [daixContract, setDaixContract] = useState<SuperToken>();
  const [amountWeiPerSec, setAmountWeiPerSec] = useState(1);
  const [streams, setStreams] = useState([]);

  const provider = useProvider();

  const fetchData = useCallback(async () => {
    let framework = await Framework.create({
      chainId: provider.network.chainId, //i.e. 137 for matic
      provider: provider
    });
    setSf(framework);
    const DAIxContract = await framework.loadSuperToken("fDAIx");
    setDaixContract(DAIxContract);
  }, []);

  const fetchfDaixBalance = async (): Promise<string | undefined> => {
    const balance = await daixContract?.balanceOf({ account: address!, providerOrSigner: provider });
    console.log('fetched balance', balance);
    return balance;
  };

  useEffect(() => {
    Promise.all([fetchData(), fetchStreams()]).catch(console.error);
  }, [fetchData, provider]);

  const fetchStreams = async () => {
    const streams = await sf?.query.listStreams({ sender: address });
    console.log('streams', streams);
    if (streams && streams.items.length > 0) {
      setStreams(streams.items);
    }
  };

  const updateFlow = async () => {
    console.log('delete');
    const sender = await signer!.getAddress();
    if (!ethers.utils.isAddress(recipient) || !ethers.utils.isAddress(sender)) {
      toast("Sender or recipient address not valid");
      return;
    }

    const updateFlowOperation = sf!.cfaV1.updateFlow({
      sender: sender,
      receiver: recipient,
      superToken: daixContract!.address,
      flowRate: amountWeiPerSec.toString(),
      overrides: { gasLimit: ethers.BigNumber.from("800000") }
    });
    try {
      console.log('entered try');
      const result = await updateFlowOperation.exec(signer!);
      console.log(result);
      fetchStreams();
    }
    catch (error: any) {
      console.error(error);
      toast.error(((error.message) as string).slice(0, 20));
    }
  }

  const deleteFlow = async () => {
    
    console.log('delete');
    const sender = await signer!.getAddress();
    if (!ethers.utils.isAddress(recipient) || !ethers.utils.isAddress(sender)) {
      toast("Sender or recipient address not valid");
      return;
    }

    const deleteFlowOperation = sf!.cfaV1.deleteFlow({
      sender: sender,
      receiver: recipient,
      superToken: daixContract!.address,
      flowRate: amountWeiPerSec.toString(),
      overrides: { gasLimit: ethers.BigNumber.from("800000") }
    });
    try {
      console.log('entered try');
      const result = await deleteFlowOperation.exec(signer!);
      console.log(result);
    }
    catch (error: any) {
      console.error(error);
      toast.error(((error.message) as string).slice(0, 20));
    }
  };

  const checkIfSenderAndRecipientAreValid = (sender: string, recipient: string) => {
    if (!ethers.utils.isAddress(recipient) || !ethers.utils.isAddress(sender)) {
      toast("Sender or recipient address not valid");
      return false;
    }
    return true;
  };

  const createFlow = async () => {
    console.log('createFlow', sf);
    const sender = await signer!.getAddress();

    const balance = await fetchfDaixBalance();

    if (!checkIfSenderAndRecipientAreValid(sender, recipient)) {
      return;
    }

    const createFlowOperation = sf!.cfaV1.createFlow({
      sender: sender,
      receiver: recipient,
      superToken: daixContract!.address,
      flowRate: amountWeiPerSec.toString(),
      overrides: { gasLimit: ethers.BigNumber.from("800000") }
    });
    try {
      console.log('entered try');
      const result = await createFlowOperation.exec(signer!);
      console.log(result);
      await fetchStreams();
    }
    catch (error: any) {
      console.error(error);
      toast.error(((error.message) as string).slice(0, 20));
    }
  };

  interface StreamItem {
    title: string;
    dataIndex: string;
    key: string;
  }

  // columns
  let columns = [];
  for (let entry of ["id", "sender", "receiver", "currentFlowRate"]) {
    columns.push(
      {
        title: entry,
        dataIndex: entry,
        key: entry,
      });
  }

  return (
    <div className={styles.container}>
      <Head>
        <title>Money streamer</title>
        <meta name="description" content="Generated by create next app" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      {isConnected &&

        <>
          <Input placeholder="default size" prefix={<UserOutlined />} value={recipient} onChange={(e) => setRecipient(e.target.value)} />
          <InputNumber addonBefore="Wei per sec" min={1} value={amountWeiPerSec} onChange={(value) => setAmountWeiPerSec(value ?? 0)} />
          <Divider />

          <Button shape='round' type="primary" onClick={createFlow}>Create flow</Button>
          <Button shape='round' type="primary" onClick={deleteFlow}>Delete flow</Button>
          <Button shape='round' type="primary" onClick={updateFlow}>Update flow</Button>
          <Button shape='round' type="primary" onClick={fetchStreams}>Update streams</Button>

          <Table columns={columns} dataSource={streams} />

        </>}

    </div>
  )
}
