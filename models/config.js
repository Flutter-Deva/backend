const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const configSchema = new Schema({
  archiveDays: { type: Number, required: true }
});

const Config = mongoose.model('Config', configSchema);

let defaultArchiveDays = 120;

const getArchiveDays = async () => {
  try {
    let config = await Config.findOne();

    if (!config) {
      // If no configuration exists, set default
      await setArchiveDays(defaultArchiveDays);
      return defaultArchiveDays;
    }

    return config.archiveDays;  
  } catch (error) {
    console.error('Error fetching archiveDays:', error);
    // Return default value in case of an error
    return defaultArchiveDays;
  }
};

const setArchiveDays = async (days) => {
  if (typeof days !== 'number' || days <= 0) {
    console.error('Invalid archive days value:', days);
    return;
  }

  try {
    const config = await Config.findOne();

    if (!config) {
      // If no config document exists, create it
      await new Config({ archiveDays: days }).save();
    } else {
      // If config exists, update it with the new value
      await Config.findOneAndUpdate(
        {},
        { archiveDays: days },
        { upsert: true }  // This will create the document if it doesn't exist
      );
    }
    console.log(`Archive days set to ${days}`);
  } catch (error) {
    console.error('Error saving archiveDays:', error);
  }
};

module.exports = { setArchiveDays, getArchiveDays };