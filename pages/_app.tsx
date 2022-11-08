import '../styles/globals.css';
import 'antd/dist/antd.css';
import 'react-toastify/dist/ReactToastify.css';
import type { AppProps } from 'next/app';
import { WagmiConfig, createClient, chain  } from "wagmi";
import { ConnectKitProvider, ConnectKitButton, getDefaultClient } from "connectkit";
import { ToastContainer } from 'react-toastify';
import { ExampleButton } from '../components/ExampleButton';

const alchemyId = process.env.ALCHEMY_API_KEY;

const client = createClient(
  getDefaultClient({
    appName: "Money Streamer",
    alchemyId,
    chains: [chain.mainnet, chain.polygon, chain.optimism, chain.goerli, chain.hardhat],
  }),
);

export default function App({ Component, pageProps }: AppProps) {
  return (
    <WagmiConfig client={client}>
      <ConnectKitProvider theme="auto" mode="dark">
      <div
      style={{
        display: 'flex',
        alignItems: 'right',
        justifyContent: 'right',
        margin: '10px'
      }}
    >
      <ConnectKitButton showBalance={true} />
      </div>
        
        <Component {...pageProps} />
      </ConnectKitProvider>
      <ToastContainer />
    </WagmiConfig>
  );
}
