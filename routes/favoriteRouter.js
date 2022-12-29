const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const cors = require('./cors');

const Favorites = require('../models/favorite');
const Dishes = require('../models/dishes');
const {verifyUser, verifyAdmin} = require('../authenticate');

const favoriteRouter = express.Router();

favoriteRouter.use(bodyParser.json());

favoriteRouter.route('/')
.options(cors.corsWithOptions, (req, res) => res.sendStatus(200))
.get( cors.corsWithOptions, verifyUser, function (req, res, next) {
    Favorites.findOne({user: req.user._id})
            .populate('dishes')
            .populate('user')
            .then((favorites) => {
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.json(favorites);
            }, (err) => next(err))
            .catch((err) => next(err));
})
.post(cors.corsWithOptions, verifyUser,(req, res, next) =>{
    const dishes = req.body;
    Favorites.findOne({user: req.user._id})
    .then((user) => {
        if(!user){
            const createdUser = new Favorites({user: req.user._id});
            dishes.forEach((dish) => {
                createdUser.dishes.push(dish.id);
            })
            createdUser.save((err ,res) => {
                if (err) return console.log(err);
                else return console.log("Result: ", res)
            })
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.json(createdUser)
        } else {
            Favorites.findByIdAndUpdate({_id: user._id})
            .then(user => {
                console.log(user);
                for(let i=0; i<dishes.length; i++){
                    console.log(dishes[i].id);
                    if(!user.dishes.includes(dishes[i].id)){
                        user.dishes.push(dishes[i].id);
                    }
                }
                user.save();
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.json(user);
            })
            .catch(err => console.log(err));
        }
    })
    .catch(err => console.log(err));
})
.put(cors.corsWithOptions, verifyUser, async (req, res, next) =>{
    res.statusCode = 403;
    res.end('PUT operation not supported on /favorites');
})
.delete(cors.corsWithOptions, verifyUser, async (req, res, next) =>{
    try{
        console.log(req.user._id);
        const favorite = await Favorites.findOne({user: req.user._id});
        if(favorite == null){
            res.statusCode = 403;
            res.end(`Delete operation not supported on for empty list of favorites`);
        } else {
            favorite.dishes = [];
            favorite.save();
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.json(favorite);
        }
    } catch(err){
        next(err);
    }
    
});

favoriteRouter.route('/:dishId')
.options(cors.corsWithOptions, (req, res) => { res.sendStatus(200); })
.get(cors.corsWithOptions, verifyUser,(req, res, next) =>{
    Favorites.findOne({user: req.user._id})
    .then(favorites => {
        if(!favorites){
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            return res.json({"exists": false, "favorites": favorites});
        } else {
            if(favorites.dishes.indexOf(req.params.dishId) < 0){
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                return res.json({"exists": false, "favorites": favorites});
            } else {
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                return res.json({"exists": true, "favorites": favorites});
            }
        }
    }, err => next(err))
    .catch(err => next(err));
})
.post(cors.corsWithOptions, verifyUser,(req, res, next) =>{
    Favorites.findOne({user: req.user._id})
    .then((user) => {
        if(!user){
            const createdUser = new Favorites({user: req.user._id, dishes: req.params.dishId});
            createdUser.save((err ,res) => {
                if (err) return console.log(err);
                else return console.log("Result: ", res)
            })
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.json(createdUser);
        } else {
            console.log("User exists");
            Favorites.findByIdAndUpdate({_id: user._id})
            .then((user) => {
                console.log("userID", user);
                // console.log("Body", req.body.id);
                const existDish = (user.dishes.indexOf(req.params.dishId));
                if(existDish === -1){
                    user.dishes.push(req.params.dishId);
                    user.save();
                    res.statusCode = 200;
                    res.setHeader('Content-Type', 'application/json');
                    res.json(user);
                } else {
                    res.send("Dish is already in list of favourite dishes");
                }
            })
            .catch(err => next(err));
        }
    })
    .catch(err => next(err));
})
.put(cors.corsWithOptions, verifyUser,(req, res, next) =>{
    res.statusCode = 403;
    res.end(`PUT operation not supported on /favorites/${req.body.id}`);
})
.delete(cors.corsWithOptions, verifyUser,async (req, res, next) =>{
    const user = await Favorites.findOne({user: req.user._id});
    try {
        let findIndex = user.dishes.indexOf(req.params.dishId);
        if(findIndex !== -1){
            user.dishes.splice(findIndex, 1);
            user.save();
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.json(user);
        } else {
            res.statusCode = 403;
            res.send("Dish is not in list");
        }

    } catch (error) {
        res.statusCode = 400;
        next(error);
    }
})

// .post(cors.corsWithOptions, verifyUser,(req, res, next) =>{
//     // console.log(req.user._id);
//     Favorites.findOne({user: req.user._id})
//     .then((user) => {
//         if(!user){
//             const createdUser = new Favorites({user: req.user._id, dishes: req.body.id});
//             createdUser.save((err ,res) => {
//                 if (err) return console.log(err);
//                 else return console.log("Result: ", res)
//             })
//             res.statusCode = 200;
//             res.setHeader('Content-Type', 'application/json');
//             res.json(createdUser)
//         } else {
//             console.log("User exists");
//             console.log(user);
//             Favorites.findByIdAndUpdate({_id: user._id})
//             .then((user) => {
//                 console.log("userID", user);
//                 // console.log("Body", req.body.id);
//                 const existDish = (user.dishes.indexOf(req.body.id));
//                 console.log(existDish);
//                 if(user.dishes.indexOf(req.body.id) === -1){
//                     console.log(user);
//                     console.log("Dish isnot htere");
//                     user.dishes.push(req.body.id);
//                     user.save();
//                     res.statusCode = 200;
//                     res.setHeader('Content-Type', 'application/json');
//                     res.json(user);
//                 } else {
//                     console.log("Dish is already in list of favourite dishes");
//                     res.send("Dish is already in list of favourite dishes");
//                 }
//             })
//             .catch(err => console.log(err));
//         }
//     })
//     .catch(err => console.log(err));
// })  


module.exports = favoriteRouter;

//   Favorites.find({'postedBy': req.decoded._doc._id})
//             .exec(function (err, favorites) {
//                 if (err) throw err;
//                 req.body.postedBy = req.decoded._doc._id;

//                 if (favorites.length) {
//                     var favoriteAlreadyExist = false;
//                     if (favorites[0].dishes.length) {
//                         for (var i = (favorites[0].dishes.length - 1); i >= 0; i--) {
//                             favoriteAlreadyExist = favorites[0].dishes[i] == req.body._id;
//                             if (favoriteAlreadyExist) break;
//                         }
//                     }
//                     if (!favoriteAlreadyExist) {
//                         favorites[0].dishes.push(req.body._id);
//                         favorites[0].save(function (err, favorite) {
//                             if (err) throw err;
//                             console.log('Um somethings up!');
//                             res.json(favorite);
//                         });
//                     } else {
//                         console.log('Setup!');
//                         res.json(favorites);
//                     }

//                 } else {

//                     Favorites.create({postedBy: req.body.postedBy}, function (err, favorite) {
//                         if (err) throw err;
//                         favorite.dishes.push(req.body._id);
//                         favorite.save(function (err, favorite) {
//                             if (err) throw err;
//                             console.log('Something is up!');
//                             res.json(favorite);
//                         });
//                     })
//                 }
//             });