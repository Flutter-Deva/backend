const DynamicPlan = require('../models/dynamicPlanModel');


const getAllDynamicPlans = async (req, res) => {
    try {
      const plans = await DynamicPlan.find();
      res.status(200).json(plans);
    } catch (error) {
      console.error('Error fetching plans:', error);
      res.status(500).json({ message: "Server error" });
    }
};

module.exports = {
   getAllDynamicPlans
};