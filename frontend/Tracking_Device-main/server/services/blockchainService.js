import { getBlockchainState } from '../config/blockchain.js';
import { ethers } from 'ethers';

class BlockchainService {
    /**
     * Logs a chemical shipment event to the blockchain.
     * PATHWAY: In a real environment, this triggers a smart contract transaction.
     */
    async logToBlockchain(shipmentId, eventType, eventData) {
        const { contract, isMock } = getBlockchainState();

        // Create a deterministic hash of the event data for the ledger
        const dataHash = ethers.keccak256(ethers.toUtf8Bytes(JSON.stringify(eventData)));
        const shipmentIdBytes32 = ethers.id(shipmentId);

        if (isMock) {
            console.log(`[BLOCKCHAIN-MOCK] Logging event ${eventType} for ${shipmentId}`);
            // Return a realistic mock transaction hash
            return {
                txHash: `0x${Math.random().toString(16).slice(2, 66)}`,
                blockNumber: Math.floor(Math.random() * 10000000),
                dataHash
            };
        }

        try {
            const tx = await contract.logEvent(shipmentIdBytes32, eventType, dataHash);
            const receipt = await tx.wait();
            return {
                txHash: receipt.hash,
                blockNumber: receipt.blockNumber,
                dataHash
            };
        } catch (error) {
            console.error('Blockchain Tx Failed:', error);
            throw new Error('Ledger synchronization failed');
        }
    }

    async verifyTransaction(txHash) {
        const { provider, isMock } = getBlockchainState();
        if (isMock) return { verified: true, timestamp: new Date() };

        const receipt = await provider.getTransactionReceipt(txHash);
        return receipt ? { verified: true, receipt } : { verified: false };
    }
}

export const blockchainService = new BlockchainService();
