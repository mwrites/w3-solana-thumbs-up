import { PublicKey, clusterApiUrl } from "@solana/web3.js";


export const programAddress = new PublicKey(
    'EGWf3mBuwhvjmR134QfzKGMo8EgtsC4ieMP3D6mxWFXq'
);
  
export const pdaSeed = 'base_account3';
  
export const network = clusterApiUrl('devnet');
  
export const connectionsOptions = {
    preflightCommitment: 'processed',
};