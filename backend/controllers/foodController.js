import Food from "../models/Food.js";

// 모든 음식 리스트 가져오기
export const getAllFoods = async (req, res) => {
  try {
    const { category, search, available } = req.query;
    
    let query = {};
    
    // 카테고리 필터
    if (category) {
      query.category = category;
    }
    
    // 검색어 필터 (이름 또는 설명에서 검색)
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }
    
    // 사용 가능 여부 필터
    if (available !== undefined) {
      query.isAvailable = available === 'true';
    }
    
    const foods = await Food.find(query).sort({ createdAt: -1 });
    console.log(`[foodController] getAllFoods query=${JSON.stringify(query)} count=${foods.length}`);
    
    res.status(200).json({
      success: true,
      data: foods,
      count: foods.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "음식 리스트를 가져오는데 실패했습니다.",
      error: error.message
    });
  }
};

// 특정 음식 가져오기
export const getFoodById = async (req, res) => {
  try {
    const { id } = req.params;
    const food = await Food.findById(id);
    
    if (!food) {
      return res.status(404).json({
        success: false,
        message: "음식을 찾을 수 없습니다."
      });
    }
    
    res.status(200).json({
      success: true,
      data: food
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "음식 정보를 가져오는데 실패했습니다.",
      error: error.message
    });
  }
};

// 새 음식 추가
export const createFood = async (req, res) => {
  try {
    const foodData = req.body;
    const newFood = new Food(foodData);
    const savedFood = await newFood.save();
    
    res.status(201).json({
      success: true,
      message: "음식이 성공적으로 추가되었습니다.",
      data: savedFood
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "음식 추가에 실패했습니다.",
      error: error.message
    });
  }
};

// 음식 정보 수정
export const updateFood = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    const updatedFood = await Food.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );
    
    if (!updatedFood) {
      return res.status(404).json({
        success: false,
        message: "음식을 찾을 수 없습니다."
      });
    }
    
    res.status(200).json({
      success: true,
      message: "음식 정보가 성공적으로 수정되었습니다.",
      data: updatedFood
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "음식 정보 수정에 실패했습니다.",
      error: error.message
    });
  }
};

// 음식 삭제
export const deleteFood = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedFood = await Food.findByIdAndDelete(id);
    
    if (!deletedFood) {
      return res.status(404).json({
        success: false,
        message: "음식을 찾을 수 없습니다."
      });
    }
    
    res.status(200).json({
      success: true,
      message: "음식이 성공적으로 삭제되었습니다."
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "음식 삭제에 실패했습니다.",
      error: error.message
    });
  }
};

// 카테고리별 음식 리스트
export const getFoodsByCategory = async (req, res) => {
  try {
    const { category } = req.params;
    const foods = await Food.find({ category, isAvailable: true }).sort({ name: 1 });
    
    res.status(200).json({
      success: true,
      data: foods,
      count: foods.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "카테고리별 음식 리스트를 가져오는데 실패했습니다.",
      error: error.message
    });
  }
};
