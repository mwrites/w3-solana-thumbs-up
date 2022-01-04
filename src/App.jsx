import React, { useEffect, useState } from 'react';
import {
  Card,
  Row,
  Col,
  Button,
  Image,
  Form,
  InputGroup,
  FormControl,
} from 'react-bootstrap';

import solanaLogo from './logo-solana-white.svg';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';

import {
  connectWallet,
  getGifList,
  initialize,
  uploadGif,
  upVoteGif,
} from './chainClient';

const App = function () {
  const [userWalletAddress, setUserWalletAddress] = useState(null);
  const [inputValue, setInputValue] = useState('');
  const [gifList, setGifList] = useState([]);

  const updateGifList = async (gifList) => {
    if (gifList === undefined) {
      console.log('gifList is undefined');
      return;
    }

    try {
      setGifList(
        gifList
          .filter((item) => item.gifLink.includes('media'))
          .sort((a, b) => (b.votes > a.votes ? 1 : -1))
      );
    } catch (error) {
      console.log('Error in getGifList: ', error);
    }
  };

  const sendGif = async () => {
    if (inputValue.length === 0) {
      console.log('No gif link given!');
      return;
    }
    console.log('Gif link:', inputValue);
    await uploadGif(inputValue);
    // REFACTOR with useEffect and avoid repeating same code
    const gifList = await getGifList();
    updateGifList(gifList);
  };

  const onInputChange = (event) => {
    const { value } = event.target;
    setInputValue(value);
  };

  const connectToUserWallet = async () => {
    const { publicKey } = await connectWallet();
    setUserWalletAddress(publicKey);
  };

  const initializePDA = async () => {
    await initialize();
  }

  const renderNotConnectedContainer = () => (
    <Button
      className="wallet-connect"
      variant="primary"
      onClick={connectToUserWallet}
    >
      Connect Your DevNet Wallet
    </Button>
  );

  const renderConnectedContainer = () => {
    // If we hit this, it means the program account hasn't be initialized.
    if (gifList === null) {
      return (
        <div className="connected-container">
          <Button className="" onClick={initializePDA}>
            Do One-Time Initialization For GIF Program Account
          </Button>
        </div>
      );
    }
    // Otherwise, we're good! Account exists. User can submit GIFs.

    return (
      <div className="connected-container">
        <Row xs={1} md={1} className="g-4">
          <Form
            noValidate
            onSubmit={(event) => {
              event.preventDefault();
              sendGif();
            }}
          >
            <InputGroup className="mx-auto w-50 mt-3 mb-5">
              <FormControl
                aria-label="Enter gif link!"
                aria-describedby="basic-addon1"
                placeholder="Enter gif link!"
                value={inputValue}
                onChange={onInputChange}
              />
              <Button type="submit" variant="primary" id="button-addon1">
                Submit
              </Button>
            </InputGroup>
          </Form>
        </Row>

        <Row xs={1} md={4} className="g-4">
          {gifList.map((item, idx) => (
            <Col key={item.id}>
              <Card>
                <Card.Header>Rank #{idx.toString()}</Card.Header>
                <Card.Img variant="top" src={item.gifLink} />
                <Card.Body>
                  <Card.Title>Votes: {item.votes.toString()}</Card.Title>
                  <div className="d-grid gap-2">
                    <Button
                      variant="secondary"
                      size="lg"
                      data={item.id}
                      onClick={upVote.bind(this, item.id)}
                    >
                      Up Vote 👍
                    </Button>
                  </div>
                </Card.Body>
                <Card.Footer>
                  <Button
                    className="btn-money"
                    size="lg"
                    data={item.id}
                    onClick={sendTip.bind(this, item.id)}
                  >
                    Send a Tip to {item.userAddress.toString().substring(0, 6)}{' '}
                    💰
                  </Button>
                </Card.Footer>
              </Card>
            </Col>
          ))}
        </Row>
      </div>
    );
  };

  const sendTip = async (id) => {
    console.log('Tipping:', id);

    const fromWallet = userWalletAddress;
    // could use a hashmap
    const toWallet = gifList
      .filter((x) => x.id === id)
      .map((x) => x.userAddress);
    const amount = 1;
    await await transferSolana(fromWallet, toWallet, amount);
  };

  /* Votes */
  const upVote = async (id) => {
    console.log('UpVoting GifID:', id);
    upVoteGif(id);
  };

  useEffect(() => {
    const onLoad = async () => {
      connectToUserWallet();
    };

    window.addEventListener('load', onLoad);
    return () => window.removeEventListener('load', onLoad);
  }, []);

  useEffect(() => {
    async function initChainClient() {
      const gifList = await getGifList();
      updateGifList(gifList);
    }
    initChainClient();
  }, [userWalletAddress]);

  return (
    <div className="App">
        <div id="page-content">
          <div className="container text-center">
            <Row className="row justify-content-center">
              <div className="container">
                <h1 className="mb-5 mt-5 fw-bold mt-4 text-white">
                  🦄 Enter The Solana Thumbs Up Competition 🙌
                </h1>
                <p className="mb-0 lead text-white">
                  Send your favorite
                  <a href="https://giphy.com/">gif</a>
                  and see what the community thinks about it!
                </p>
                <p className="lead text-white">
                  You might even earn some tips 💰 if you get enough love!
                </p>
                {/* Add the condition to show this only if we don't have a wallet address */}
                {!userWalletAddress && renderNotConnectedContainer()}
                {/* We just need to add the inverse here! */}
                {userWalletAddress && renderConnectedContainer()}
              </div>
            </Row>
          </div>
        </div>
        <div id="sticky-footer" className="footer flex-shrink-0 py-0 bg-dark">
          <span>Built on </span>
          <a href="https://solana.com">
            <Image
              alt="Solana Logo"
              className="logo-solana"
              src={solanaLogo}
              fluid
            />
          </a>
        </div>
      </div>
  );
};

export default App;
