
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const Product = require('./models/Product');

dotenv.config();

const seedData = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/electratrade');
        console.log('MongoDB Connected for Seeding...');

        // Clear existing data
        await User.deleteMany();
        await Product.deleteMany();

        // Create Users
        const salt = await bcrypt.genSalt(10);
        const password = await bcrypt.hash('password_is_demo', salt);

        const users = await User.insertMany([
            {
                name: 'Global Admin',
                email: 'admin@electratrade.com',
                password: password,
                role: 'ADMIN',
                isApproved: true,
                companyName: 'ElectraTrade HQ',
                address: '1201 Tech Park, CA 94103',
                gstNumber: '27AAAAA0000A1Z5'
            },
            {
                name: 'Dr. Aris Chen',
                email: 'info@siliconmicro.com',
                password: password,
                role: 'MANUFACTURER',
                isApproved: true,
                companyName: 'Silicon Microchips Inc.',
                address: '45 Silicon Valley Way, CA 94025',
                gstNumber: '27MMMMM1111M1Z1'
            },
            {
                name: 'Mark Thompson',
                email: 'buyer@elitegear.com',
                password: password,
                role: 'SHOP_OWNER',
                isApproved: true,
                companyName: 'Elite Gaming Gear',
                address: '88 Commerce Blvd, NY 10001',
                gstNumber: '27SSSSS2222S1Z2',
                creditLimit: 150000,
                creditUsed: 0
            }
        ]);

        const manufacturer = users.find(u => u.role === 'MANUFACTURER');

        // Create Products
        await Product.insertMany([
            {
                name: 'Intel Core i9-14900K',
                category: 'Processors',
                brand: 'Intel',
                hsnCode: '84733020',
                price: 556,
                stock: 450,
                moq: 10,
                imageUrl: 'https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?auto=format&fit=crop&q=80&w=400',
                manufacturer: manufacturer._id,
                specifications: { cores: '24', threads: '32', baseClock: '3.2GHz' },
                pricingTiers: [
                    { minQuantity: 10, price: 556 },
                    { minQuantity: 50, price: 530 },
                    { minQuantity: 100, price: 500 }
                ]
            },
            {
                name: 'NVIDIA RTX 4090 Founders',
                category: 'Graphics Cards',
                brand: 'NVIDIA',
                hsnCode: '84733030',
                price: 1599,
                stock: 25,
                moq: 2,
                imageUrl: 'https://images.unsplash.com/photo-1624701928517-44c8ac49d93c?auto=format&fit=crop&q=80&w=400',
                manufacturer: manufacturer._id,
                pricingTiers: [
                    { minQuantity: 2, price: 1599 },
                    { minQuantity: 5, price: 1550 }
                ]
            }
        ]);

        console.log('Database Seeded Successfully!');
        process.exit();
    } catch (error) {
        console.error('Error seeding database:', error);
        process.exit(1);
    }
};

seedData();
