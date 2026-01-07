
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Product = require('../models/Product');

dotenv.config();

const seedTiers = async () => {
    try {
        const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/electratrade';
        console.log(`Connecting to ${uri}...`);
        await mongoose.connect(uri);
        console.log('Connected to MongoDB');

        const products = await Product.find({});
        console.log(`Found ${products.length} products.`);

        let product = products.find(p => p.name.includes('Intel'));
        if (!product && products.length > 0) product = products[0];

        if (!product) {
            console.log('No products found. Creating seed product.');
            product = new Product({
                name: 'Intel Core i9-14900K',
                category: 'Processors',
                brand: 'Intel',
                hsnCode: '84733020',
                price: 556,
                stock: 450,
                moq: 1,
                imageUrl: 'https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?auto=format&fit=crop&q=80&w=400',
                manufacturer: new mongoose.Types.ObjectId(),
                specifications: { cores: "24", threads: "32" }
            });
            await product.save();
        }

        console.log(`Updating product: ${product.name}`);

        product.pricingTiers = [
            { minQuantity: 5, price: 540 },
            { minQuantity: 10, price: 500 },
            { minQuantity: 50, price: 450 }
        ];

        await product.save();
        console.log('Updated product with pricing tiers!');
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

seedTiers();
