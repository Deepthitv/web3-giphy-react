import { Connection, PublicKey, ClusterApiUrl } from '@solana/web3.js';
import { Program, Provider, web3 } from '@project-serum/anchor';
import React, { useEffect, useState } from 'react';
import { Buffer } from 'buffer';
import twitterLogo from './assets/twitter-logo.svg';
import './App.css';
import idl from './idl.json';
import kp from './keypair.json';

const { SystemProgram, Keypair } = web3;
window.Buffer = Buffer;
const baseAccount = web3.Keypair.fromSecretKey(secret);

const programID = new PublicKey(idl.metadata.address);
const network = clusterApiUrl('devnet');

const opts = {
  preflightCommitment: 'processed'
};

// Constants
const TWITTER_HANDLE = '_buildspace';
const TWITTER_LINK = `https://twitter.com/${TWITTER_HANDLE}`;

const TEST_GIFS = [
  'https://giphy.com/gifs/post-tag-posts-ZciYhNqc9iFtC0yUTS',
  'https://gifer.com/en/S5Jh',
  'https://tenor.com/view/colin-gif-25472274'
];

const App = () => {
  const [walletAddress, setWalletAddress] = useState(null);
  const [inputValue, setInputValue] = useState('');
  const [gifList, setGifList] = useState([]);
  const [walletAddress, setWalletAddress] = useState(null);
  const checkIfWalletIsConnected = async () => {
    try {
      const { solana } = window;
      if (solana) {
        if (solana.isPhantom) {
          console.log('Phantom Wallet Is Found');
          const response = await solana.connect({
            onlyIfTrusted: true
          });
          console.log(
            'Connected with Public Key:',
            response.publicKey.toString()
          );
          setWalletAddress(response.publicKey.toString());
        }
      } else {
        alert('Solana object not found! Get a phantom wallet');
      }
    } catch (error) {
      console.error(error);
    }
  };

  const connectWallet = async () => {
    const { solana } = window;
    if (solana) {
      const response = await solana.connect();
      console.log('Connected with Public Key:', response.publicKey.toString());
      setWalletAddress(response.publicKey.toString());
    }
  };

  const sendGif = async () => {
    if (inputValue.length > 0) {
      console.log("Gif Link: ", inputValue)
      sendGifList([...gifList, inputValue])
      setInputValue('')
    } else {
      console.log("Empty input try again")
    }
  }

  const onInputChange = event => {
    const value = event.target;
    setInputValue(value)
  }

  const getProvider = () => {
    const connection = new Connection(network, opts.preflightCommitment);
    const provider = new Provider(
      connection,
      window.solana,
      opts.preflightCommitment
    );
    return provider;
  };

  const createGifAccount = async () => {
    try {
      const provider = getProvider();
      const program = new Program(idl, programID, provider);
      await program.rpc.startStuffOff({
        accounts: {
          baseAccount: baseAccount.publicKey,
          user: provider.wallet.publicKey,
          systemProgram: SystemProgram.programId
        },
        signers: [baseAccount]
      });
      console.log('Created new baseaccount address:', baseAccount.publicKey.toString());
      await getGifList()
    } catch (error) {
      console.log('Error creating baseaccount:', error);
    }
  };

  const renderNotConnectedContainer = () => (
    <button
      className="cta-button connect-wallet-button"
      onClick={connectWallet}
    >
      Connect To Wallet
		</button>
  );

  const renderConnectedContainer = () => {
    if (gifList == null) {
      return <div className="connected-container">
        <button className="cta-button submit-gif-button" onClick={createGifAccount}>
          Do One Time Initialization on Gif Program Account
      </button>
      </div>

    } else {
      (<div className="connected-container">
        <form onSubmit={event => {
          event.preventDefault()
          sendGif()
        }}>
          <input type="text" placeholder="Enter Gif Link!" value={inputValue}
            onChange={onInputChange} />
          <button type="submit" className="cta-button submit-gif-button">
            Submit </button>
        </form>
        <div className="gif-grid">
          {TEST_GIFS.map((item, index) => (
            <div className='gif-item' key={index}>
              <img src={item.gifLink} alt={item.gifLink} />
            </div>
          ))}
        </div>
      </div>
      )
    }
  }

  useEffect(() => {
    const onLoad = async () => {
      await checkIfWalletIsConnected();
    };
    window.addEventListener('load', onLoad);
    return () => window.removeEventListener('load', onLoad);
  }, []);


  const getGifList = async () => {
    try {
      const provider = getProvider();
      const program = new Program(idl, programID, provider)
      const account = await program.account.baseAccount.fetch(baseAccount.publicKey)
      console.log("Got the account", account)
      setGifList(account.gifList)
    } catch (error) {
      console.error("Error in getGifList", error)
      setGifList(null)
    }
  }

  useEffect(() => {
    if (walletAddress) {
      console.log("Fetching Gif List")
      getGifList()
    }
  }, [walletAddress])

  return (
    <div className="App">
      <div className={walletAddress ? 'authed-container' : 'container'}>
        <div className="header-container">
          <p className="header">🖼 GIF Portal</p>
          <p className="sub-text">
            View your GIF collection in the metaverse ✨
					</p>
          {!walletAddress && renderNotConnectedContainer()}
          {walletAddress && renderConnectedContainer()}
        </div>
        <div className="footer-container">
          <img alt="Twitter Logo" className="twitter-logo" src={twitterLogo} />
          <a
            className="footer-text"
            href={TWITTER_LINK}
            target="_blank"
            rel="noreferrer"
          >{`Adapted from @${TWITTER_HANDLE}`}</a>
        </div>
      </div>
    </div>
  );
};

export default App;
