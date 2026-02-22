import { ethers } from 'ethers';
import dotenv from 'dotenv';
dotenv.config();

/**
 * Blockchain Integration Pathway
 * This module defines the connection to the Ethereum/Polygon mainnet/testnet.
 */

const RPC_URL = process.env.BLOCKCHAIN_RPC_URL || 'https://rpc-mumbai.maticvigil.com';
const PRIVATE_KEY = process.env.BLOCKCHAIN_PRIVATE_KEY;
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;

// ABI Fragment for the ChemTrackLedger contract
export const CONTRACT_ABI = [
    "function logEvent(bytes32 _shipmentId, uint8 _eventType, bytes32 _dataHash) external",
    "function getHistory(bytes32 _shipmentId) external view returns (tuple(bytes32, uint8, bytes32, uint256, address)[])",
    "event EventLogged(bytes32 indexed shipmentId, uint8 eventType, bytes32 dataHash, uint256 timestamp)"
];

let provider;
let wallet;
let contract;

if (PRIVATE_KEY && CONTRACT_ADDRESS) {
    provider = new ethers.JsonRpcProvider(RPC_URL);
    wallet = new ethers.Wallet(PRIVATE_KEY, provider);
    contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, wallet);
}

export const getBlockchainState = () => ({
    provider,
    wallet,
    contract,
    isMock: !contract
});
