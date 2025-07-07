const express = require('express');
const { getAllSkills, getSkillsByUserId, addSkill, updateSkill, deleteSkill } = require('../controllers/skillController');
const router = express.Router();

router.get('', getAllSkills);
router.get('/:id', getSkillsByUserId);
router.post('', addSkill);
router.put('/:id', updateSkill);
router.delete('/:id', deleteSkill);

module.exports = router;
