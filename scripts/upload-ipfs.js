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

        // 2. Validate & Upload Metadata
        const validateMetadata = (meta) => {
            if (!meta.name || typeof meta.name !== 'string') throw new Error("Invalid name");
            if (!meta.description || typeof meta.description !== 'string') throw new Error("Invalid description");
            if (!meta.image || !meta.image.startsWith("ipfs://")) throw new Error("Invalid image URI");
            return true;
        };

        // Note: In a real CLI usage, we would read args for the image path.
        // For this demonstration, we assume a local file 'assets/placeholder.png' or similar exists,
        // Or we create a dummy file on the fly to prove the 'fs' logic works.

        // Create a dummy image for genuine upload test if not exists
        const dummyImagePath = './scripts/test_image.png';
        if (!fs.existsSync(dummyImagePath)) {
            // Ensure the directory exists
            const dir = require('path').dirname(dummyImagePath);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
            fs.writeFileSync(dummyImagePath, "fake image content");
        }

        console.log("📤 Uploading image to IPFS...");
        const imageFormData = new FormData();
        imageFormData.append('file', fs.createReadStream(dummyImagePath), {
            filepath: 'test_image.png'
        });

        const imageRes = await axios.post("https://api.pinata.cloud/pinning/pinFileToIPFS", imageFormData, {
            maxBodyLength: "Infinity",
            headers: {
                ...imageFormData.getHeaders(),
                'pinata_api_key': PINATA_API_KEY,
                'pinata_secret_api_key': PINATA_SECRET_API_KEY
            }
        });

        const imageCid = imageRes.data.IpfsHash;
        console.log(`✅ Image uploaded: ipfs://${imageCid}`);

        const metadata = {
            name: "Genesis Legend #1",
            description: "A hardened NFT from the Genesis Collection.",
            image: `ipfs://${imageCid}`,
            attributes: [
                { trait_type: "Rarity", value: "Legendary" }
            ]
        };

        console.log("🔍 Validating metadata schema...");
        validateMetadata(metadata);

        const metadataCid = await uploadWithRetry(metadata, "metadata.json");
        console.log(`✅ Metadata uploaded: ipfs://${metadataCid}`);
        console.log(`\n🎉 Final Token URI Base: ipfs://${metadataCid}/`);

    } catch (error) {
        console.error("❌ Upload Failed:", error.message);
        process.exit(1);
    }
}

main();
