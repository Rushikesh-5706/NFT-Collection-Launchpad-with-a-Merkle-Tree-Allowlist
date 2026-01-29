const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
require('dotenv').config();

const PINATA_API_KEY = process.env.PINATA_API_KEY;
const PINATA_SECRET_API_KEY = process.env.PINATA_SECRET_API_KEY;

if (!PINATA_API_KEY || !PINATA_SECRET_API_KEY) {
    console.error("❌ Missing Pinata API keys in .env");
    process.exit(1);
}

const uploadWithRetry = async (data, name, retries = 3) => {
    for (let i = 0; i < retries; i++) {
        try {
            const formData = new FormData();
            if (Buffer.isBuffer(data) || typeof data === 'string') {
                formData.append('file', data, name); // File path or Buffer
            } else {
                formData.append('file', JSON.stringify(data), name); // JSON object
            }

            const res = await axios.post("https://api.pinata.cloud/pinning/pinFileToIPFS", formData, {
                maxBodyLength: "Infinity",
                headers: {
                    ...formData.getHeaders(),
                    'pinata_api_key': PINATA_API_KEY,
                    'pinata_secret_api_key': PINATA_SECRET_API_KEY
                }
            });

            if (!res.data.IpfsHash) throw new Error("No IPFS Hash returned");
            return res.data.IpfsHash;
        } catch (err) {
            console.error(`⚠️ Attempt ${i + 1} failed: ${err.message}. Retrying...`);
            if (i === retries - 1) throw err;
            await new Promise(r => setTimeout(r, 1000));
        }
    }
};

async function main() {
    try {
        console.log("🚀 Starting robust IPFS upload...");

        // 1. Upload Image (Placeholder)
        // In a real scenario, you'd read a file: fs.createReadStream('./image.png')
        // Here we simulate checking/uploading
        const imageCid = "QmPlaceholderImageHash";
        console.log(`✅ Image uploaded (simulated): ipfs://${imageCid}`);

        // 2. Upload Metadata
        const metadata = {
            name: "Genesis Legend #1",
            description: "A hardened NFT from the Genesis Collection.",
            image: `ipfs://${imageCid}`,
            attributes: [
                { trait_type: "Rarity", value: "Legendary" }
            ]
        };

        const metadataCid = await uploadWithRetry(metadata, "metadata.json");
        console.log(`✅ Metadata uploaded: ipfs://${metadataCid}`);
        console.log(`\n🎉 Final Token URI Base: ipfs://${metadataCid}/`);

    } catch (error) {
        console.error("❌ Upload Failed:", error.message);
        process.exit(1);
    }
}

main();
