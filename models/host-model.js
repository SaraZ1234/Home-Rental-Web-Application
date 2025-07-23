//Core Module
const path = require('path');
const fs = require('fs');
const rootDir = require('../utils/pathUtil');
const homeDataPath = path.join(rootDir, 'data', 'homes-list.json');



module.exports = class Home {
  constructor(title, location, type, rooms, price, imageUrl, description, clean_fees, service_fees) {
    this.title = title,
      this.location = location,
      this.type = type,
      this.rooms = rooms,
      this.price = price,
      this.imageUrl = imageUrl,
      this.description = description,
      this.clean_fees = clean_fees,
      this.service_fees = service_fees
  }

  save() {
    Home.fetchAll((homes) => {
      this.id = Math.random().toString();
      homes.push(this);
      fs.writeFile(homeDataPath, JSON.stringify(homes), err => {
        if (err) {
          console.error("❌ Failed to write file:", err.message);
        } else {
          console.log("✅ File written successfully to", homeDataPath);
        }
      });

    })
  }

  save1() {

  }

  static fetchAll(callback) {
    fs.readFile(homeDataPath, (err, data) => {
      if (err || !data.length) {
        return callback([]);
      }

      try {
        const parsed = JSON.parse(data);
        callback(parsed);
      } catch (e) {
        callback([]);
      }

    })
  }
}
