const path = require('path');
const fs = require('fs');
const rootDir = require('../utils/pathUtil');
const Homes = require('../models/host-model');

const favourites = path.join(rootDir, 'data', 'favorites.json');
const homesList = path.join(rootDir, 'data', 'homes-list.json');

// GET USER'S OWN LISTINGS
exports.getMyListings = (req, res, next) => {
  const currentUserId = req.session.userId;

  Homes.fetchAll((homes) => {
    const userHomes = homes.filter(home => home.id === currentUserId);
    res.render('my-listing', { homes: userHomes });
  });
};

// SHOW FAVORITES — WITH DELETED HOME CLEANUP
exports.showFavorites = (req, res, next) => {
  // Step 1: Read homes-list.json
  fs.readFile(homesList, 'utf-8', (homeErr, homesData) => {
    if (homeErr) {
      console.error("❌ Error reading homes list:", homeErr);
      return res.status(500).send("Error reading homes list");
    }

    let allHomes = [];
    try {
      allHomes = homesData.length ? JSON.parse(homesData) : [];
    } catch (parseHomesErr) {
      console.error("❌ Error parsing homes list:", parseHomesErr);
      return res.status(500).send("Error parsing homes list");
    }

    // Extract all valid home IDs (adjust if ID key is different)
    const validHomeIds = allHomes.map(home => home.id);

    // Step 2: Read favorites.json
    fs.readFile(favourites, 'utf-8', (favErr, favData) => {
      if (favErr) {
        console.error("❌ Error reading favorites file:", favErr);
        return res.status(404).send("Error reading favorites content");
      }

      let favorites = [];
      try {
        favorites = favData.length ? JSON.parse(favData) : [];
      } catch (parsedErr) {
        console.error("❌ Error parsing favorites file:", parsedErr);
        return res.status(404).send("Error parsing favorites content");
      }

      // Step 3: Filter out deleted homes from favorites
      const updatedFavorites = favorites.filter(fav => validHomeIds.includes(fav.id));

      // Step 4: If any change, overwrite favorites.json
      if (updatedFavorites.length !== favorites.length) {
        fs.writeFile(favourites, JSON.stringify(updatedFavorites, null, 2), (writeErr) => {
          if (writeErr) {
            console.error("❌ Error updating favorites file:", writeErr);
            return res.status(500).send("Error updating favorites");
          }

          console.log("🧹 Cleaned favorites: removed deleted homes.");
          res.render('user/favorite', { homes: updatedFavorites });
        });
      } else {
        console.log("✅ Favorites already clean. No update needed.");
        res.render('user/favorite', { homes: favorites });
      }
    });
  });
};

// HOME PAGE INTERFACE
exports.HomeInterface = (req, res, next) => {
  res.sendFile(path.join(rootDir, 'views', 'user', 'home.html'));
};
