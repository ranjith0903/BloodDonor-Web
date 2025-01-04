import { DeleteCampaign,searchCampaign, deleteUser, getUserByEmail, getUsersByBloodType, tCampaigns, tUsers, userAvail, usersNotAvail } from "../controllers/admin.controller.js";
import { adminRoute } from "../middleware/auth.middleware.js";
import User from "../models/user.model.js";
import { protectRoute } from "../middleware/auth.middleware.js";
import express from "express"
const router=express.Router();
router.post("/getUserByEmail",protectRoute,adminRoute,getUserByEmail);
router.get("/userAvail",protectRoute,adminRoute,userAvail);
router.get("/usersNotAvail",protectRoute,adminRoute,usersNotAvail);
router.get("/getUsersByBloodType",protectRoute,adminRoute,getUsersByBloodType);
router.delete("/delete/:id",protectRoute,adminRoute,deleteUser);
router.get("/tusers",protectRoute,adminRoute,tUsers);
router.get("/tcampaigns",protectRoute,adminRoute,tCampaigns);
router.post("/getCampaign",protectRoute,adminRoute,searchCampaign);
router.delete("/deleteCampaign/:id",protectRoute,adminRoute,DeleteCampaign);

router.get("/blood-stats", async (req, res) => {
  try {
    const stats = await User.aggregate([
      {
        $group: {
          _id: "$bloodType",
          totalUsers: { $sum: 1 },
          totalDonors: { $sum: { $cond: [{ $eq: ["$available", true] }, 1, 0] } },
          totalRecipients: { $sum: { $cond: [{ $eq: ["$available", false] }, 1, 0] } },
        },
      },
      { $sort: { _id: 1 } }, // Sort by blood type
    ]);
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});



export default router;
