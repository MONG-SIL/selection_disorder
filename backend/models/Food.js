import mongoose from "mongoose";

const foodSchema = new mongoose.Schema({
  name: { type: String, required: true },
  category: { type: String, required: true }, // 한식, 중식, 일식, 양식, 기타 등
  description: { type: String },
  price: { type: Number },
  image: { type: String }, // 이미지 URL
  tags: [{ type: String }], // 태그 배열 (예: 매운맛, 해산물, 채식 등)
  rating: { type: Number, min: 0, max: 5, default: 0 },
  isAvailable: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// 업데이트 시 updatedAt 자동 갱신
foodSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const Food = mongoose.model("Food", foodSchema);

export default Food;
