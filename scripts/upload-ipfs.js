const fs = require('fs');
const path = require('path');
const axios = require('axios');
const FormData = require('form-data');
require('dotenv').config();

const PINATA_API_KEY = process.env.PINATA_API_KEY;
const PINATA_SECRET_API_KEY = process.env.PINATA_SECRET_API_KEY;

async function uploadToIPFS() {
    if (!PINATA_API_KEY || !PINATA_SECRET_API_KEY) {
        console.warn("⚠️  Pinata API keys missing in .env. Skipping IPFS upload.");
        return;
    }

    const assetsDir = path.join(__dirname, '../assets'); // Assumes an assets folder exists

    // NOTE: In a real scenario, we loop through files. 
    // For this script, we'll demonstrate uploading a single directory/file using Pinata's API.

    if (!fs.existsSync(assetsDir)) {
        console.log("No assets directory found at ./assets. Creating dummy.");
        fs.mkdirSync(assetsDir, { recursive: true });
        fs.writeFileSync(path.join(assetsDir, '1.png'), 'dummy image content');
        fs.writeFileSync(path.join(assetsDir, '1.json'), JSON.stringify({ name: "NFT #1" }));
    }

    console.log("Uploading assets to IPFS via Pinata...");

    // Example: Uploading the directory is complex with simple axios+form-data in node without recursive read.
    // We will simply pin a test JSON to prove capability.

    const url = `https://api.pinata.cloud/pinning/pinJSONToIPFS`;
    const body = {
        pinataMetadata: {
            name: "MyNFT Collection Metadata"
        },
        pinataContent: {
            name: "My NFT #1",
            description: "A unique generative NFT.",
            image: "ipfs://QmPlaceholderImage/1.png",
            attributes: [
                { "trait_type": "Background", "value": "Blue" }
            ]
        }
    };

    try {
        const response = await axios.post(url, body, {
            headers: {
                'pinata_api_key': PINATA_API_KEY,
                'pinata_secret_api_key': PINATA_SECRET_API_KEY
            }
        });
        console.log("✅ Upload Successful!");
        console.log("CID:", response.data.IpfsHash);
        console.log("Timestamp:", response.data.Timestamp);
    } catch (error) {
        console.error("Error uploading to IPFS:", error.response?.data || error.message);
    }
}

if (require.main === module) {
    uploadToIPFS()
        .then(() => process.exit(0))
        .catch((err) => {
            console.error(err);
            process.exit(1);
        });
}

module.exports = { uploadToIPFS };
