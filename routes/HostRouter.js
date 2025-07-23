const path = require('path');
const express = require('express');
const hostRouter = express.Router();
const Controllers = require('../controllers/host');

// local Module
const rootDir = require('../utils/pathUtil');

// General
hostRouter.get('/', Controllers.firstpage);
hostRouter.post('/add-home', Controllers.postHome);
hostRouter.get('/all-homes', Controllers.showAllHomes);

// ❗ Specific routes must come before /home/:homeId
hostRouter.get('/home/remove-reservation', Controllers.removeReservations);
hostRouter.get('/home/reserve/:resId', Controllers.getReserved);
hostRouter.post('/home/reserve/:resId', Controllers.getReserved);
hostRouter.get('/home/favourite/:favId', Controllers.getFavouriteDetails);
hostRouter.post('/home/favourite/:favId', Controllers.getFavouriteDetails);

hostRouter.get('/home/edit-home/:editId', Controllers.getEditHome);
hostRouter.post('/home/edit-home', Controllers.postEditHome);
hostRouter.get('/home/delete/:delId', Controllers.delete);
hostRouter.get('/home/deletedhomes', Controllers.viewDeleted);
hostRouter.post('/all-homes/:id', Controllers.removeFromFavorites);
hostRouter.post('/trips/remove/:tripId', Controllers.removedFav);

// ❗ Most generic route goes last
hostRouter.get('/home/:homeId', Controllers.getHomeDetails);

module.exports = hostRouter;
