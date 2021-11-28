import solana_logo from "./logo-solana-white.svg"
import "bootstrap/dist/css/bootstrap.min.css";
import "./App.css";
import { Card, Row, Col, Button, Image, Form, Container, InputGroup, FormControl } from "react-bootstrap";

import React, { useEffect, useState } from "react";
import { Connection, PublicKey, clusterApiUrl } from "@solana/web3.js";
import { Program, Provider, web3 } from "@project-serum/anchor";
import idl from "./idl.json";
import filekp from "./keypair.json";

// SystemProgram is a reference to the Solana runtime!
const { SystemProgram, Keypair } = web3;


var envkp;
if (process.env.REACT_APP_KEYPAIR !== undefined) {
  envkp = JSON.parse(process.env.REACT_APP_KEYPAIR);
}
const kp = envkp || filekp

const arr = Object.values(kp._keypair.secretKey);
const secret = new Uint8Array(arr)
const baseAccount = web3.Keypair.fromSecretKey(secret);

// Remember our program id in Part 1? We can get it from the target IDL file
const programID = new PublicKey(idl.metadata.address);

// Set our network to devnet.
const endpoint = clusterApiUrl("devnet");

// Options for confirming transactions
const connectionsOptions = {
  preflightCommitment: "processed",
};

function App() {
  const [inputValue, setInputValue] = useState("");
  const [gifList, setGifList] = useState([]);

  const getConnectionProvider = () => {
    const connection = new Connection(
      endpoint,
      connectionsOptions.preflightCommitment
    );
    const provider = new Provider(
      connection,
      window.solana,
      connectionsOptions.preflightCommitment
    );
    return provider;
  };

  const [walletAddress, setWalletAddress] = useState(null);

  const connectWallet = async () => {
    window.solana
      .connect()
      .then(({ publicKey }) => {
        setWalletAddress(publicKey);
        console.log("Wallet detected, address:", publicKey.toString());
        getGifList();
      })
      .catch(({ error }) => {
        console.error(error);
      });
  };

  const getGifList = async () => {
    try {
      const provider = getConnectionProvider();
      const program = new Program(idl, programID, provider);
      const account = await program.account.baseAccount.fetch(
        baseAccount.publicKey
      );

      console.log("Got the account", account);
      setGifList(
        account.gifList
        .filter((item) => item.gifLink.includes("media"))
        .sort((a, b) => (b.votes > a.votes ? 1 : -1))
      );
    } catch (error) {
      console.log("Error in getGifList: ", error);
      setGifList(null);
    }
  };

  const sendGif = async () => {
    if (inputValue.length === 0) {
      console.log("No gif link given!");
      return;
    }
    console.log("Gif link:", inputValue);
    try {
      const provider = getConnectionProvider();
      const program = new Program(idl, programID, provider);

      await program.rpc.addGif(inputValue, {
        accounts: {
          baseAccount: baseAccount.publicKey,
          user: provider.wallet.publicKey,
        },
      });
      console.log("GIF successfully sent to program", inputValue);

      await getGifList();
    } catch (error) {
      console.log("Error sending GIF:", error);
    }
  };
  const onInputChange = (event) => {
    const { value } = event.target;
    setInputValue(value);
  };

  const createGifAccount = async () => {
    try {
      const provider = getConnectionProvider();
      const program = new Program(idl, programID, provider);
      console.log("creating baseAccount");
      await program.rpc.initialize({
        accounts: {
          baseAccount: baseAccount.publicKey,
          user: provider.wallet.publicKey,
          systemProgram: SystemProgram.programId,
        },
        signers: [baseAccount],
      });
      console.log(
        "Created a new BaseAccount w/ address:",
        baseAccount.publicKey.toString()
      );
      await getGifList();
    } catch (error) {
      console.log("Error creating BaseAccount account:", error);
    }
  };

  const renderNotConnectedContainer = () => (
    <Button className="wallet-connect" variant="primary" onClick={connectWallet}>
      Connect Your DevNet Wallet
    </Button>
  );

  const renderConnectedContainer = () => {
    // If we hit this, it means the program account hasn't be initialized.
    if (gifList === null) {
      return (
        <div className="connected-container">
          <Button
            className=""
            onClick={createGifAccount}
          >
            Do One-Time Initialization For GIF Program Account
          </Button>
        </div>
      );
    }
    // Otherwise, we're good! Account exists. User can submit GIFs.
    else {
      return (
        <div className="connected-container">
          <Row xs={1} md={1} className="g-4">
          <Form noValidate onSubmit={(event) => {
                event.preventDefault();
                sendGif();
              }}>
            <InputGroup className="mx-auto w-50 mt-3 mb-5">
              <FormControl
                aria-label="Enter gif link!"
                aria-describedby="basic-addon1"
                placeholder="Enter gif link!"
                value={inputValue}
                onChange={onInputChange}
              />
              <Button type="submit" variant="primary" id="button-addon1" >
                Submit
              </Button>
            </InputGroup>
          </Form>
            {/* <Form
              onSubmit={(event) => {
                event.preventDefault();
                sendGif();
              }}
            >
              <input
                type="text"
                placeholder="Enter gif link!"
                value={inputValue}
                onChange={onInputChange}
              />
              <Button type="submit" variant="primary"> Submit </Button>
            </Form> */}
          </Row>

          <Row xs={1} md={4} className="g-4">
            {gifList.map((item, idx) => (
              <Col key={idx}>
                <Card>
                  <Card.Header>
                      Rank #{ idx.toString() }
                    </Card.Header>
                    <Card.Img variant="top" src={item.gifLink} />
                    <Card.Body>
                      <Card.Title>
                        Votes: {item.votes.toString()}
                      </Card.Title>
                      <div className="d-grid gap-2">
                      <Button variant="secondary" size="lg" data={item.id} onClick={incrementVote.bind(this, item.id)}>Up Vote 👍</Button>
                      </div>
                    </Card.Body>
                  <Card.Footer>
                    <Button className="btn-money" size="lg" data={item.id} onClick={sendTip.bind(this, item.id)}>
                    Send a Tip to {item.userAddress.toString().substring(0, 6)} 💰
                    </Button>
                  </Card.Footer>
                </Card>
              </Col>
            ))}
          </Row>
        </div>
      );
    }
  };


  const createTransaction = async(instructions) => {
    const anyTransaction = new web3.Transaction().add(instructions);
    anyTransaction.feePayer = getConnectionProvider().wallet.publicKey;
    console.log("Getting Recent Blockhash");
    anyTransaction.recentBlockhash = (
      await getConnectionProvider().connection.getRecentBlockhash()
    ).blockhash;
    return anyTransaction;
  }

  const createTransferTransaction = async (from, to, amount) => {
    return createTransaction(
      web3.SystemProgram.transfer({
        fromPubkey: from,
        toPubkey: to,
        lamports: 100000 * amount,
    }));
  }

  const sendTransaction = async(from, to, amount) => {
    try {
      console.log(`sending ${amount} from: ${from}, to: ${to}`);
      let { signature } = await getConnectionProvider().wallet.signAndSendTransaction(await createTransferTransaction(from, to, amount));
      console.log("Submitted transaction " + signature + ", awaiting confirmation");
      await getConnectionProvider().connection.confirmTransaction(signature);
      console.log("Transaction " + signature + " confirmed");
    } catch (err) {
      console.warn(err);
      console.error("Error: " + JSON.stringify(err));
    }
  }

  const sendTip = async(id) => {
    console.log("Tipping:", id);

    const fromWallet = walletAddress;
    // could use a hashmap
    const toWallet = gifList.filter(x => x.id === id).map(x => x.userAddress);
    const amount = 1;
    await sendTransaction(fromWallet, toWallet, amount);

    sendTransaction(from, to, amount)    
  }


  /* Votes */
  const incrementVote = async (id) => {
    console.log("UpVoting GifID:", id);
    const provider = await getConnectionProvider();
    const program = new Program(idl, programID, provider);
    try {
      await program.rpc.upvoteGif(id, {
        accounts: {
          baseAccount: baseAccount.publicKey,
          user: provider.wallet.publicKey
        }
      });
      await getGifList();
    } catch (error) {
      console.log("Error UpVoting GifID:", id, error);
    }
  }


  useEffect(() => {
    const onLoad = async () => {
      await connectWallet();
    };
    window.addEventListener("load", onLoad);
    return () => window.removeEventListener("load", onLoad);
  }, []);

  return (
    <div className="App">
      <div className="d-flex flex-column">
        <div id="page-content">
          <div class="container text-center">
            <Row class="row justify-content-center">
              <div class="container">
                <h1 class="mb-5 mt-5 fw-bold mt-4 text-white">🦄  Enter The Solana Thumbs Up Competition 🙌  </h1>
                <p class="mb-0 lead text-white">
                   Send your favorite <a href="https://giphy.com/">gif</a> and see what the community thinks about it!
                </p>
                <p class="lead text-white">
                You might even earn some tips 💰 if you get enough love!
                </p>
                {/* Add the condition to show this only if we don't have a wallet address */}
                {!walletAddress && renderNotConnectedContainer()}
                {/* We just need to add the inverse here! */}
                {walletAddress && renderConnectedContainer()}
              </div>
            </Row>
          </div>
        </div>
      </div>
      <div id="sticky-footer" class="footer flex-shrink-0 py-0 bg-dark">
        <span>Built on </span><a href="https://solana.com"><Image alt="Solana Logo" className="logo-solana" src={solana_logo} fluid /></a>
      </div>
    </div>
  );
}

export default App;
