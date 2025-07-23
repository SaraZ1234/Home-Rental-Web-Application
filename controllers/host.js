// controllers/hostController.js
const path = require('path');
const rootDir = require('../utils/pathUtil');

const fs = require('fs');

const ReserveDataPath = path.join(rootDir, 'data', 'reserve-list.json');
const Reservation_list_data = path.join(rootDir, 'data', 'reservation-list.json');

const favourites = path.join(rootDir, 'data', 'favorites.json');

const HomeDataPath = path.join(rootDir, 'data', 'homes-list.json');

const DeldataContent = path.join(rootDir, 'data', 'deleted-content.json');


const Homes = require('../models/host-model');
const { log, error } = require('console');
let lasthome = null;

exports.firstpage = (req, res, next) => {
  // res.sendFile(path.join(rootDir, 'views', 'first.html'));

  Homes.fetchAll((home) => {
    console.log("All movies found are:", home);
    res.render('user/first', { home: home });
  })
};

exports.postHome = (req, res, next) => {
  const { title, location, type, rooms, price, imageUrl, description, clean_fees, service_fees } = req.body;

  // const userId = req.session.userId;

  // console.log("The userId of the session is:", user);


  const homes = new Homes(title, location, type, rooms, price, imageUrl, description, clean_fees, service_fees);
  homes.save();
  lasthome = homes;
  console.log("New Home details", lasthome);
  res.redirect('/host/all-homes'); //for redirecting to new page
}

exports.showAllHomes = (req, res, next) => {
  Homes.fetchAll((homes) => {
    res.render('user/all-homes', { homes: homes })
  })
}

exports.getHomeDetails = (req, res, next) => {
  const homeId = req.params.homeId;
  console.log("At each home details:", homeId);
  Homes.fetchAll((home) => {
    const homeFound = home.find(h => h.id == homeId);
    console.log("The Homefound is:", homeFound);

    if (homeFound) {
      res.render('user/home-detaile', { home: homeFound });
    }
    else {
      res.send('404 error');
    }
  })

}

exports.getFavouriteDetails = (req, res, next) => {
  const favouriteId = req.params.favId;
  console.log("The favourite home id is:", favouriteId);

  Homes.fetchAll((home) => {
    const favFound = home.find(f => f.id == favouriteId);
    console.log("The favourite home found is:", favFound);

    if (favFound) {
      res.render('user/favourite-home', { home: favFound });

      fs.readFile(favourites, 'utf-8', (err, data) => {
        let listFav = [];

        // If file exists and has data, parse it
        if (!err && data.length) {
          try {
            listFav = JSON.parse(data);
            console.log("Parsed existing favorites:", listFav);
          } catch {
            console.log("Error parsing favorites file. Starting fresh.");
          }
        }

        //  Avoid adding duplicate favorites
        const alreadyExists = listFav.some(item => item.id == favouriteId);
        if (!alreadyExists) {
          listFav.push(favFound);
        }

        //  Write updated list to file
        fs.writeFile(favourites, JSON.stringify(listFav, null, 2), err => {
          if (err) {
            console.log("Failed to write favorites to file", err);
          } else {
            console.log("Favorite saved successfully:", favFound);
          }
        });
      });
    } else {
      res.status(404).send('404 Error: Home not found');
    }
  });
};


function calculateNights(checkin, checkout) {
  const inDate = new Date(checkin);
  const outDate = new Date(checkout);
  const diffTime = Math.abs(outDate - inDate);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24)); // Days
}

// GET and POST handler for reservation
exports.getReserved = (req, res, next) => {
  const reserveId = req.params.resId;

  // Step 1: Read homes list
  fs.readFile(HomeDataPath, 'utf-8', (err, data) => {
    if (err) {
      console.error("❌ Error reading homes-list.json:", err);
      return res.status(500).send("Internal Server Error");
    }

    let homes;
    try {
      homes = JSON.parse(data);
    } catch (parseErr) {
      console.error("❌ Error parsing homes JSON:", parseErr);
      return res.status(500).send("Data Error");
    }

    const reserveFound = homes.find(home => String(home.id) === String(reserveId));

    if (!reserveFound) {
      return res.status(404).send('404 Error: Home not found');
    }

    // Parse pricing fields
    const pricePerNight = parseInt(reserveFound.price);
    const cleanFee = parseInt(reserveFound.clean_fees);
    const serviceFee = parseInt(reserveFound.service_fees);

    // Handle POST (reservation submission)
    if (req.method === 'POST') {
      const { name, contact, checkin, checkout } = req.body;

      const nights = calculateNights(checkin, checkout);
      const totalStayPrice = pricePerNight * nights;
      const totalAmount = totalStayPrice + cleanFee + serviceFee;

      const newReservation = {
        homeId: reserveId,
        name,
        contact,
        checkin,
        checkout,
        nights,
        totalStayPrice,
        totalAmount
      };

      fs.readFile(Reservation_list_data, 'utf-8', (err, existingData) => {
        let reservationList = [];

        if (!err && existingData.length > 0) {
          try {
            reservationList = JSON.parse(existingData);
          } catch (parseErr) {
            console.error("❌ Error parsing reservation list:", parseErr);
          }
        }

        reservationList.push(newReservation);

        fs.writeFile(Reservation_list_data, JSON.stringify(reservationList, null, 2), (writeErr) => {
          if (writeErr) {
            console.error("❌ Failed to write reservation list:", writeErr);
          } else {
            console.log("✅ Reservation added:", newReservation);
          }

          res.render('user/reserve', {
            home: reserveFound,
            success: true,
            name,
            contact,
            checkin,
            checkout,
            nights,
            totalStayPrice,
            totalAmount,
            cleanFee,
            serviceFee
          });
        });
      });
    } else {
      // Default GET view with 2 nights estimation
      const defaultNights = 2;
      const totalStayPrice = pricePerNight * defaultNights;
      const totalAmount = totalStayPrice + cleanFee + serviceFee;

      res.render('user/reserve', {
        home: reserveFound,
        success: false,
        nights: defaultNights,
        totalStayPrice,
        totalAmount,
        cleanFee,
        serviceFee
      });
    }
  });
};


exports.getEditHome = (req, res, next) => {
  const homeId = req.params.editId;
  const editing = req.query.editing === 'true';

  Homes.fetchAll((homes) => {
    const homefound = homes.find(h => h.id == homeId);
    if (!homefound) {
      console.log("Home for editing not found");
      return res.redirect('/host/home');

    }

    console.log('Editing homeId and boolean result:', homeId, editing);
    console.log("For Editing home found entries are:", homefound);

    res.render('host/edit-home', { editing: editing, home: homefound });


  })

}


exports.postEditHome = (req, res, next) => {
  const { homeId, title, location, type, rooms, price, imageUrl, description } = req.body;
  Homes.fetchAll((home) => {
    const homeIndex = home.findIndex(h => h.id == homeId);

    if (homeIndex == -1) {
      console.log("For update index of home not found");
      return res.redirect('/host/all-homes');

    }

    home[homeIndex] = {
      id: homeId,
      title,
      location,
      type,
      rooms,
      price,
      imageUrl,
      description
    };

    fs.writeFile(HomeDataPath, JSON.stringify(home, null, 2), (err) => {
      if (err) {
        console.log("Failed to save updated home");

      } else {
        console.log("Home Updated:", home[homeIndex]);

      }
      res.redirect('/host/all-homes');
    })
  })
}

exports.delete = (req, res, next) => {
  const DelId = req.params.delId;
  Homes.fetchAll((home) => {
    const Delhome = home.find(d => d.id == DelId);
    if (!Delhome) {
      console.log("The Home to Delete not found");
      return res.send('404 Error');
    }

    const delHome = home.filter(h => h.id != DelId);
    const deletedContent = home.find(h => h.id == DelId);

    fs.readFile(DeldataContent, 'utf-8', (err, data) => {
      let existingDeleted = [];

      if (!err && data.length > 0) {
        try {
          existingDeleted = JSON.parse(data);
        } catch (parseErr) {
          console.log("Error parsing deleted content file");
        }
      }

      // Step 2: Append the newly deleted home
      existingDeleted.push(deletedContent);

      // Step 3: Write updated deleted homes back to file
      fs.writeFile(DeldataContent, JSON.stringify(existingDeleted, null, 2), err => {
        if (err) {
          console.log("Error occurred in writing deleting content");
        } else {
          console.log("Deleted content has been written in the file successfully");
        }

        // Step 4: Update the main homes list
        fs.writeFile(HomeDataPath, JSON.stringify(delHome, null, 2), err => {
          if (err) {
            console.log("Error updating homes-list.json");
          } else {
            console.log("Updated homes-list.json after deletion");
          }
          res.render('host/all-homes', { homes: delHome });
        });
      });
    });
  });
};

exports.viewDeleted = (req, res, next) => {
  fs.readFile(DeldataContent, (err, data) => {
    if (err || !data.length) {
      console.log("Error has been occurred in error in reading deleted file");

    }

    try {
      const parsed = JSON.parse(data);
      console.log("The parsed data for deletion is:", parsed);

      res.render('delete', { home: parsed })

    } catch {
      console.log("Error occured while reading deletion (2)");

    }
  })

}

exports.removeFromFavorites = (req, res, next) => {
  const homeId = req.params.id;
  console.log("The ID to remove from favorites:", homeId);

  fs.readFile(favourites, 'utf-8', (err, data) => {
    if (err) {
      console.log("Error reading favorites file:", err);
      return res.status(500).send("Internal Server Error");
    }

    let existingFavorites = [];
    try {
      existingFavorites = data.length > 0 ? JSON.parse(data) : [];
    } catch (parseErr) {
      console.log("Error parsing favorites:", parseErr);
      return res.status(500).send("Error parsing favorites");
    }

    const updatedFavorites = existingFavorites.filter(h => h.id != homeId);
    console.log("Updated favorites after removal:", updatedFavorites);

    fs.writeFile(favourites, JSON.stringify(updatedFavorites, null, 2), err => {
      if (err) {
        console.log("Error writing updated favorites:", err);
        return res.status(500).send("Failed to update favorites");
      }

      console.log("Favorites updated successfully.");
      res.redirect('/host/all-homes');
    });
  });
};

exports.removeReservations = (req, res, next) => {
  const editing = req.query.editing === 'true';
  console.log("✅ /home/remove-reservation route reached");

  fs.readFile(Reservation_list_data, 'utf-8', (err, data) => {
    if (err) {
      console.log("Error in reading file");
      return res.status(404).send("Issue in reading reserved file");

    }
    else {
      try {
        const reservation = JSON.parse(data);
        console.log("The Reservations loaded are:", reservation);
        res.render('user/trips', { homes: reservation, editing: editing })


      } catch (parseError) {
        console.log("Error in parsing reservation file is:", parseError);
        return res.status(500).send('Issue in parsing reserved file');

      }

    }
  })

  // res.sendFile(path.join(rootDir, 'views', 'trips.html'));
};

exports.removedFav = (req, res, next) => {
  const removedId = req.params.tripId;
  const editing = req.query.editing === 'true';

  console.log("The Id to remove is:", removedId);

  fs.readFile(Reservation_list_data, 'utf-8', (err, data) => {
    if (err) {
      console.log("Home to remove from reservation not found");
      return res.status(404).send("Error in removing from favorites");
    }

    let existingReserved = [];
    try {
      existingReserved = data.length > 0 ? JSON.parse(data) : [];
    } catch (parsedErr) {
      console.log("Error parsing favorites:", parsedErr);
      return res.status(500).send("Error parsing favorites");
    }

    const UpdatedReserved = existingReserved.filter(
      h => String(h.homeId).trim() !== String(removedId).trim()
    );
    console.log("Updated reserved from removal are:", UpdatedReserved);

    fs.writeFile(Reservation_list_data, JSON.stringify(UpdatedReserved, null, 2), err => {
      if (err) {
        console.log('❌ Error in rewriting reservation list');
        return res.status(500).send("Failed to update reservation list");
      }

      console.log("✅ Reservation list updated successfully");

      res.render('user/trips', {
        homes: UpdatedReserved,
        editing: editing
      });
    });
  });
};

