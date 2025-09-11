import mongoose from "mongoose";

const foodImageCacheSchema = new mongoose.Schema({
  foodId: { type: mongoose.Schema.Types.ObjectId, ref: 'Food', index: true },
  name: { type: String, index: true },
  category: { type: String },
  imageUrl: { type: String },
  imageUrls: [{ type: String }],
  imageIds: [{ type: String }],
  overrideUrl: { type: String },
  blacklistIds: [{ type: String }],
  provider: { type: String, default: 'unsplash' },
  query: { type: String },
  topics: [{ type: String }],
  orientation: { type: String },
  orderBy: { type: String },
  contentFilter: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

foodImageCacheSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const FoodImageCache = mongoose.model('FoodImageCache', foodImageCacheSchema);
export default FoodImageCache;


