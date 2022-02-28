const anchor = require('@project-serum/anchor');

const solana = require('@solana/web3.js');

// Need the system program, will talk about this soon.
const { SystemProgram } = anchor.web3;
const { PublicKey } = solana;


const pdaSeed = 'base_account22';


const getProgramDerivedAddress = async () => {
  const [pda, bump] = await PublicKey.findProgramAddress(
    // eslint-disable-next-line no-undef
    [Buffer.from(pdaSeed)],
    anchor.workspace.Moon.programId
  );
  console.log(`bump: ${bump}, pubkey: ${pda.toBase58()}`);
  return { pda, bump };
};


const main = async() => {
  console.log("🚀 Starting test...")

  // Create and set the provider. We set it before but we needed to update it, so that it can communicate with our frontend!
  const provider = anchor.Provider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.Moon;
	

  const { pda, bump } = await getProgramDerivedAddress();

  let tx = await program.rpc.initialize(new anchor.BN(bump), {
    accounts: {
      baseAccount: pda,
      user: provider.wallet.publicKey,
      systemProgram: SystemProgram.programId,
    },
  });
  console.log("📝 Your transaction signature", tx);

  // Fetch data from the account.
  let account = await program.account.baseAccount.fetch(pda);
  console.log('👀 account', account);

  // You'll need to now pass a GIF link to the function! You'll also need to pass in the user submitting the GIF!
  await program.rpc.addGif("insert_a_giphy_link_here", {
    accounts: {
      baseAccount: pda,
      user: provider.wallet.publicKey,
    },
  });
  
  // Get the account again to see what changed.
  account = await program.account.baseAccount.fetch(pda);
  console.log('👀 GIF Count', account.totalGifs.toString())
  // Access gif_list on the account!
  console.log('👀 GIF List', account.gifList)

  let id = account.gifList[0].id;

  await program.rpc.upvoteGif(id, {
    accounts: {
      baseAccount: pda,
      user: provider.wallet.publicKey,
    },
  });
 
    // Get the account again to see what changed.
  account = await program.account.baseAccount.fetch(baseAccount.publicKey);
  console.log('👀 GIF Vote', id, account.gifList[0].votes);
}

// boiler plate code
const runMain = async () => {
    try {
        await main();
        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

runMain();