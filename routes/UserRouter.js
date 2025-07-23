const path = require('path');
const express = require('express');
const userRouter = express.Router();

// Controllers
const Controllers = require('../controllers/host');
const Controller1 = require('../controllers/user');

// ==================== ROUTES ==================== //

// Home Page
userRouter.get('/', Controllers.firstpage);

// Show all homes
userRouter.get('/all-homes', Controllers.showAllHomes);

// REMOVE RESERVATION (must be above dynamic routes)
userRouter.get('/home/remove-reservation', Controllers.removeReservations);

// RESERVE A HOME
userRouter.get('/home/reserve/:resId', Controllers.getReserved);
userRouter.post('/home/reserve/:resId', Controllers.getReserved);

// ✅ FAVORITES — specific route MUST come before /home/:homeId
userRouter.get('/favorites', Controller1.showFavorites);

// FAVORITE DETAILS
userRouter.get('/home/favorite/:favId', Controllers.getFavouriteDetails);
userRouter.post('/home/favorite/:favId', Controllers.getFavouriteDetails);

// Remove from favorites
userRouter.post('/all-homes/:id', Controllers.removeFromFavorites);

// Remove from trips
userRouter.post('/trips/remove/:tripId', Controllers.removedFav);

// ✅ HOME DETAILS — KEEP LAST
userRouter.get('/home/:homeId', Controllers.getHomeDetails);

userRouter.get('/home', Controller1.HomeInterface);

// Optional (can uncomment later)
// userRouter.get('/my-listing', Controllers.getMyListings);
// userRouter.get('/trips', Controllers.getTrips);

module.exports = userRouter;
