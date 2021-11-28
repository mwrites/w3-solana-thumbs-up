import solana_logo from "./logo-solana-white.svg"
import "bootstrap/dist/css/bootstrap.min.css";
import "./App.css";
import { Card, Row, Col, Button, Image, Form, Container } from "react-bootstrap";

import React, { useEffect, useState } from "react";
import { Connection, PublicKey, clusterApiUrl } from "@solana/web3.js";
import { Program, Provider, web3 } from "@project-serum/anchor";
import idl from "./idl.json";
import filekp from "./keypair.json";

// SystemProgram is a reference to the Solana runtime!
const { SystemProgram, Keypair } = web3;


const envkp = JSON.parse(process.env.REACT_APP_KEYPAIR);
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
        setWalletAddress(publicKey.toString());
        console.log("Wallet detected, address:", publicKey.toString());
        // callMySolanaProgramAPI();
        getGifList();
      })
      .catch(({ error }) => {
        console.error(error);
      });
  };

  // ?????
  const callMySolanaProgramAPI = async () => {
    const provider = getConnectionProvider();
    const program = new Program(idl, programID, provider);

    console.log("calling our freaking Solana Program");
    // the interesting part
    var resp = await program.rpc.initialize({
      accounts: {
        baseAccount: baseAccount.publicKey,
        user: provider.wallet.publicKey,
        systemProgram: SystemProgram.programId,
      },
      signers: [baseAccount],
    });

    console.log(resp);

    const account = await program.account.baseAccount.fetch(
      baseAccount.publicKey
    );
    console.log("Got the account", account);
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
        account.gifList.filter((item) => item.gifLink.includes("media"))
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
      Connect to Wallet
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
            <Form
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
            </Form>
          </Row>

          <Row xs={1} md={4} className="g-4">
            {gifList.map((item, idx) => (
              <Col key={idx}>
                <Card>
                  <Card.Img variant="top" src={item.gifLink} />
                  <Card.Body>
                    <Card.Title>
                      Up Votes: {item.votes.toString()}
                    </Card.Title>
                    <div className="d-grid gap-2">
                    <Button variant="secondary" size="lg" data={item.id} onClick={incrementVote.bind(this, item.id)}>Up Vote 👍</Button>
                    </div>
                  </Card.Body>
                  <Card.Footer>
                    <small className="text-muted">
                      Submitted by {item.userAddress.toString().substring(0, 6)}
                    </small>
                  </Card.Footer>
                </Card>
              </Col>
            ))}
          </Row>
        </div>
      );
    }
  };





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

    // const account = await program.account.baseAccount.fetch(baseAccount.publicKey);
    // console.log('account: ', account);
    // setValue(account.count.toString());
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
                <h1 class="fw-light mt-4 text-white">Sticky Footer using Flexbox</h1>
                <p class="lead text-white-50">Use just two Bootstrap utility classes and three custom CSS rules and you will have a flexbox enabled sticky footer for your website!</p>
                  {/* Add the condition to show this only if we don't have a wallet address */}
                  {!walletAddress && renderNotConnectedContainer()}
                  {/* We just need to add the inverse here! */}
                  {walletAddress && renderConnectedContainer()}
              </div>
            </Row>
          </div>
        </div>
      </div>
      <div class="footer fixed-bottom">
        <span>Built on </span><a href="https://solana.com"><Image alt="Solana Logo" className="logo-solana" src={solana_logo} fluid /></a>
      </div>
    </div>
  );
}

export default App;
