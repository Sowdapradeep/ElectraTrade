
const mongoose = require('mongoose');

const productSchema = mongoose.Schema({
  name: { type: String, required: true },
  category: { type: String, required: true },
  brand: { type: String, required: true },
  hsnCode: { type: String, required: true },
  price: { type: Number, required: true },
  stock: { type: Number, required: true },
  moq: { type: Number, required: true, default: 1 },
  imageUrl: { type: String },
  manufacturer: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User'
  },
  specifications: { type: Map, of: String }
}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema);
