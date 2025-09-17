import mongoose from "mongoose";

const foodRecipeCacheSchema = new mongoose.Schema({
  foodId: { type: mongoose.Schema.Types.ObjectId, ref: 'Food', index: true },
  name: { type: String, index: true },
  category: { type: String },
  // 이미지 관련 필드
  imageUrl: { type: String },
  imageUrls: [{ type: String }],
  imageIds: [{ type: String }],
  overrideUrl: { type: String },
  blacklistIds: [{ type: String }],
  // 레시피 관련 필드
  recipe: {
    id: { type: String }, // Spoonacular recipe ID
    title: { type: String },
    instructions: [{ type: String }],
    ingredients: [{ type: String }],
    nutrition: {
      calories: { type: Number },
      protein: { type: Number },
      carbs: { type: Number },
      fat: { type: Number }
    },
    readyInMinutes: { type: Number },
    servings: { type: Number },
    difficulty: { type: String },
    summary: { type: String }
  },
  provider: { type: String, default: 'spoonacular' },
  query: { type: String },
  cuisine: { type: String },
  expiresAt: { type: Date, default: () => new Date(Date.now() + 24 * 60 * 60 * 1000) }, // 24시간 후 만료
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

foodRecipeCacheSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const FoodRecipeCache = mongoose.model('FoodRecipeCache', foodRecipeCacheSchema);
export default FoodRecipeCache;


