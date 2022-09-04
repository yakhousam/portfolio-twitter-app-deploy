/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "./libs/server/app/src/index.ts":
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
const tslib_1 = __webpack_require__("tslib");
tslib_1.__exportStar(__webpack_require__("./libs/server/app/src/lib/server-app.ts"), exports);


/***/ }),

/***/ "./libs/server/app/src/lib/server-app.ts":
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.app = void 0;
const path = __webpack_require__("path");
const express = __webpack_require__("express");
const dotenv = __webpack_require__("dotenv");
dotenv.config();
const passport = __webpack_require__("passport");
__webpack_require__("./libs/server/passport/src/index.ts");
const MongoDBStore = __webpack_require__("connect-mongodb-session");
const session = __webpack_require__("express-session");
const server_routes_search_hashtag_1 = __webpack_require__("./libs/server/routes/search/hashtag/src/index.ts");
const auth_1 = __webpack_require__("./libs/server/routes/auth/src/index.ts");
const server_middlewares_error_1 = __webpack_require__("./libs/server/middlewares/error/src/index.ts");
const app = express();
exports.app = app;
const mongoDbStore = MongoDBStore(session);
const store =  true
    ? new mongoDbStore({
        uri: process.env.DB_URI,
        collection: 'session',
    })
    : 0;
app.use(session({
    secret: 'thisIsASecret',
    cookie: {
        maxAge: 1000 * 60 * 60 * 24, //one day
    },
    resave: false,
    saveUninitialized: true,
    store,
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(auth_1.authRoute);
function isLoggedInMiddleware(req, res, next) {
    if (false)
        {}
    if (!req.isAuthenticated()) {
        return res.status(403).end();
    }
    next();
}
app.use('/api/search/hashtag', isLoggedInMiddleware, server_routes_search_hashtag_1.searchHashtagRoute);
app.use(express.static(path.resolve(__dirname, 'assets', 'public')));
app.get('/', (req, res) => {
    if (req.isAuthenticated()) {
        return res.redirect('/dashboard');
    }
    res.sendFile(path.resolve(__dirname, 'assets', 'index.html'));
});
app.use(express.static(path.resolve(__dirname, '..', 'dashboard')));
app.get('/dashboard', (req, res) => {
    var _a, _b;
    if (!req.isAuthenticated()) {
        return res.redirect('/');
    }
    const user = req.user;
    res.cookie('user_avatar_url', (_b = (_a = user.profile) === null || _a === void 0 ? void 0 : _a.photos) === null || _b === void 0 ? void 0 : _b[0].value);
    res.sendFile(path.resolve(__dirname, '..', 'dashboard', 'index.html'));
});
app.use(server_middlewares_error_1.errorMiddleware);


/***/ }),

/***/ "./libs/server/controllers/twitter-search/src/index.ts":
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
const tslib_1 = __webpack_require__("tslib");
tslib_1.__exportStar(__webpack_require__("./libs/server/controllers/twitter-search/src/lib/controllers-twitter-search.ts"), exports);
tslib_1.__exportStar(__webpack_require__("./libs/server/controllers/twitter-search/src/lib/twitter_client.ts"), exports);


/***/ }),

/***/ "./libs/server/controllers/twitter-search/src/lib/controllers-twitter-search.ts":
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.searchByHashtag = void 0;
const tslib_1 = __webpack_require__("tslib");
const tweets_1 = __webpack_require__("./libs/utility/tweets/src/index.ts");
const twitter_client_1 = __webpack_require__("./libs/server/controllers/twitter-search/src/lib/twitter_client.ts");
const helpers_1 = __webpack_require__("./libs/utility/helpers/src/index.ts");
function searchByHashtag(req, res, next) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const { hashtag } = req.params;
        const { startTime, endTime } = req.query;
        const maxResultsPerPage = 100; // between 10 and 100
        // handle client cancle request
        let cancelRequest = false;
        req.on('close', () => {
            if (req.aborted) {
                cancelRequest = true;
                console.log('request aborted by the client');
            }
        });
        const user = (req.user || {});
        try {
            const client = (0, twitter_client_1.getTwitterApiClient)(user.token, user.tokenSecret);
            let result = yield client.v2.search(`#${hashtag} lang:en`, {
                max_results: maxResultsPerPage,
                start_time: startTime,
                end_time: endTime,
                expansions: ['author_id', 'referenced_tweets.id'],
                'tweet.fields': [
                    'id',
                    'author_id',
                    'in_reply_to_user_id',
                    'created_at',
                    'public_metrics',
                ],
                'user.fields': ['username', 'public_metrics'],
            });
            do {
                const response = Object.assign(Object.assign({}, (0, tweets_1.getTweetsStats)(result.tweets)), { rateLimit: Object.assign(Object.assign({}, result.rateLimit), { reset: result.rateLimit.reset * 1000 }), rankedAccounts: (0, tweets_1.getRankedAccounts)(result.includes.users), mostEngagedTweets: (0, tweets_1.getMostEngagedTweets)(result.tweets), chartData: result.tweets.map((tweet) => tweet.created_at) });
                res.write(JSON.stringify(response));
                // if rate limit exceeded, wait untill time reset
                if (result.rateLimit.remaining === 0) {
                    const sleeptime = result.rateLimit.reset * 1000 - Date.now();
                    yield (0, helpers_1.sleep)(sleeptime);
                }
                if (!result.done) {
                    result = yield result.next(); // fetch the next page
                }
            } while (!result.done && !cancelRequest);
            // call res.end to close the connection
            return res.end();
        }
        catch (error) {
            // console.error(error);
            return next(error);
        }
    });
}
exports.searchByHashtag = searchByHashtag;


/***/ }),

/***/ "./libs/server/controllers/twitter-search/src/lib/twitter_client.ts":
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.getTwitterApiClient = void 0;
const twitter_api_v2_1 = __webpack_require__("twitter-api-v2");
function getTwitterApiClient(accessToken, accessSecret) {
    let twitterApiClient;
    if (false) {}
    else {
        twitterApiClient = new twitter_api_v2_1.TwitterApi({
            appKey: process.env.TWITTER_CONSUMER_KEY,
            appSecret: process.env.TWITTER_CONSUMER_SECRET,
            accessToken,
            accessSecret,
        });
    }
    return twitterApiClient;
}
exports.getTwitterApiClient = getTwitterApiClient;


/***/ }),

/***/ "./libs/server/db/src/index.ts":
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
const tslib_1 = __webpack_require__("tslib");
tslib_1.__exportStar(__webpack_require__("./libs/server/db/src/lib/server-db.ts"), exports);


/***/ }),

/***/ "./libs/server/db/src/lib/server-db.ts":
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
const mongoose_1 = __webpack_require__("mongoose");
(0, mongoose_1.connect)(process.env.DB_URI, (err) => {
    if (err) {
        return console.error(err);
    }
    console.log('mongoose is connected to: ', process.env.DB_URI);
});


/***/ }),

/***/ "./libs/server/middlewares/error/src/index.ts":
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
const tslib_1 = __webpack_require__("tslib");
tslib_1.__exportStar(__webpack_require__("./libs/server/middlewares/error/src/lib/middlewares-error.ts"), exports);


/***/ }),

/***/ "./libs/server/middlewares/error/src/lib/middlewares-error.ts":
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.errorMiddleware = void 0;
const twitter_api_v2_1 = __webpack_require__("twitter-api-v2");
const headersSentErrorMessaage = {
    error_streaming: true,
};
function errorMiddleware(error, req, res, 
// eslint-disable-next-line @typescript-eslint/no-unused-vars
next) {
    if (res.headersSent) {
        return res.end(JSON.stringify(headersSentErrorMessaage));
    }
    if (error instanceof twitter_api_v2_1.ApiRequestError) {
        // console.log('api request error');
        // console.log(error.toJSON());
        return res.sendStatus(400);
    }
    if (error instanceof twitter_api_v2_1.ApiResponseError) {
        // console.log('api response error');
        // console.log(error.data, error.code);
        return res.status(error.code).json(error.data);
    }
    return res.sendStatus(500);
}
exports.errorMiddleware = errorMiddleware;


/***/ }),

/***/ "./libs/server/models/user/src/index.ts":
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
const tslib_1 = __webpack_require__("tslib");
tslib_1.__exportStar(__webpack_require__("./libs/server/models/user/src/lib/server-models-user.ts"), exports);


/***/ }),

/***/ "./libs/server/models/user/src/lib/server-models-user.ts":
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.User = void 0;
const mongoose_1 = __webpack_require__("mongoose");
const userSchema = new mongoose_1.Schema({
    twitterId: String,
    profile: {},
    token: String,
    tokenSecret: String,
});
exports.User = (0, mongoose_1.model)('User', userSchema);


/***/ }),

/***/ "./libs/server/passport/src/index.ts":
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
const tslib_1 = __webpack_require__("tslib");
tslib_1.__exportStar(__webpack_require__("./libs/server/passport/src/lib/server-passport.ts"), exports);


/***/ }),

/***/ "./libs/server/passport/src/lib/server-passport.ts":
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
const passport = __webpack_require__("passport");
const TwitterStrategy = __webpack_require__("passport-twitter");
const user_1 = __webpack_require__("./libs/server/models/user/src/index.ts");
// twitter strategy
passport.use(new TwitterStrategy.Strategy({
    consumerKey: process.env.TWITTER_CONSUMER_KEY,
    consumerSecret: process.env.TWITTER_CONSUMER_SECRET,
    callbackURL: 'http://localhost:3333/auth/twitter/callback',
}, function (token, tokenSecret, profile, cb) {
    // console.log('twitter profile =', profile)
    // console.log('token *=', token);
    // console.log('secret =', tokenSecret);
    const update = {
        twitterId: profile.id,
        profile,
        token,
        tokenSecret,
    };
    user_1.User.findOneAndUpdate({ twitterId: profile.id }, update, { upsert: true, new: true, useFindAndModify: false }, function (err, user) {
        return cb(err, user);
    });
}));
// export default function () {
passport.serializeUser((user, done) => {
    done(null, user.twitterId);
});
passport.deserializeUser((id, done) => {
    user_1.User.findOne({ twitterId: id }, (err, user) => {
        if (err)
            return done(err);
        done(null, user);
    });
});
// }


/***/ }),

/***/ "./libs/server/routes/auth/src/index.ts":
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.authRoute = void 0;
var server_routes_auth_1 = __webpack_require__("./libs/server/routes/auth/src/lib/server-routes-auth.ts");
Object.defineProperty(exports, "authRoute", ({ enumerable: true, get: function () { return server_routes_auth_1.default; } }));


/***/ }),

/***/ "./libs/server/routes/auth/src/lib/server-routes-auth.ts":
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
const express = __webpack_require__("express");
const passport = __webpack_require__("passport");
const router = express.Router();
router.get('/auth/twitter', passport.authenticate('twitter'));
router.get('/auth/twitter/callback', passport.authenticate('twitter', {
    failureRedirect: '/',
    successRedirect: '/',
}));
router.get('/auth/logout', (req, res, next) => {
    req.logout(function (err) {
        if (err) {
            return next(err);
        }
        res.redirect('/');
    });
});
exports["default"] = router;


/***/ }),

/***/ "./libs/server/routes/search/hashtag/src/index.ts":
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.searchHashtagRoute = void 0;
var routes_search_hashtag_1 = __webpack_require__("./libs/server/routes/search/hashtag/src/lib/routes-search-hashtag.ts");
Object.defineProperty(exports, "searchHashtagRoute", ({ enumerable: true, get: function () { return routes_search_hashtag_1.default; } }));


/***/ }),

/***/ "./libs/server/routes/search/hashtag/src/lib/routes-search-hashtag.ts":
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
const express_1 = __webpack_require__("express");
const server_controllers_twitter_search_1 = __webpack_require__("./libs/server/controllers/twitter-search/src/index.ts");
const route = (0, express_1.Router)();
route.get('/:hashtag', (req, res, next) => {
    (0, server_controllers_twitter_search_1.searchByHashtag)(req, res, next);
});
exports["default"] = route;


/***/ }),

/***/ "./libs/utility/helpers/src/index.ts":
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
const tslib_1 = __webpack_require__("tslib");
tslib_1.__exportStar(__webpack_require__("./libs/utility/helpers/src/lib/utility-helpers.ts"), exports);


/***/ }),

/***/ "./libs/utility/helpers/src/lib/utility-helpers.ts":
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.getCookieValue = exports.isValidJSON = exports.sleep = exports.clsx = void 0;
// this function is for combining css classes
function clsx(...args) {
    return args.join(' ').trim();
}
exports.clsx = clsx;
function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
exports.sleep = sleep;
function isValidJSON(json) {
    try {
        JSON.parse(json);
        return true;
    }
    catch (error) {
        return false;
    }
}
exports.isValidJSON = isValidJSON;
function getCookieValue(cookie) {
    var _a;
    // from MDN
    return (_a = window.document.cookie
        .split('; ')
        .find((row) => row.startsWith(`${cookie}=`))) === null || _a === void 0 ? void 0 : _a.split('=')[1];
}
exports.getCookieValue = getCookieValue;


/***/ }),

/***/ "./libs/utility/tweets/src/index.ts":
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
const tslib_1 = __webpack_require__("tslib");
tslib_1.__exportStar(__webpack_require__("./libs/utility/tweets/src/lib/utility-tweets.ts"), exports);


/***/ }),

/***/ "./libs/utility/tweets/src/lib/utility-tweets.ts":
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.getMostEngagedTweets = exports.getRankedAccounts = exports.getTweetsStats = void 0;
function getTweetsStats(tweets) {
    return tweets.reduce((acc, tweet) => {
        if (tweet.in_reply_to_user_id) {
            acc.replay += 1;
        }
        else if (tweet.text.startsWith('RT')) {
            acc.retweet += 1;
        }
        else {
            acc.original += 1;
        }
        return acc;
    }, {
        original: 0,
        replay: 0,
        retweet: 0,
    });
}
exports.getTweetsStats = getTweetsStats;
function getRankedAccounts(users, maxResult = 6) {
    return users
        .filter((user, i, arr) => i === arr.findIndex((el) => el.id === user.id))
        .sort((a, b) => {
        var _a, _b;
        if (!((_a = a.public_metrics) === null || _a === void 0 ? void 0 : _a.followers_count)) {
            return 1;
        }
        if (!((_b = b.public_metrics) === null || _b === void 0 ? void 0 : _b.followers_count)) {
            return -1;
        }
        return (b.public_metrics.followers_count - a.public_metrics.followers_count);
    })
        .slice(0, maxResult);
}
exports.getRankedAccounts = getRankedAccounts;
function getMostEngagedTweets(tweets, maxResult = 6) {
    var _a, _b, _c;
    // console.log('get most engaged tweets', { tweets });
    const hashSet = new Set();
    const result = [];
    for (const tweet of tweets) {
        const tweetId = tweet.referenced_tweets
            ? tweet.referenced_tweets[0].id
            : tweet.id;
        if (!hashSet.has(tweetId)) {
            hashSet.add(tweetId);
            const count = (((_a = tweet.public_metrics) === null || _a === void 0 ? void 0 : _a.like_count) || 0) +
                (((_b = tweet.public_metrics) === null || _b === void 0 ? void 0 : _b.reply_count) || 0) +
                (((_c = tweet.public_metrics) === null || _c === void 0 ? void 0 : _c.retweet_count) || 0);
            result.push({
                tweet: tweet.referenced_tweets
                    ? Object.assign(Object.assign({}, tweet), { id: tweetId, in_reply_to_user_id: undefined, referenced_tweets: undefined }) : tweet,
                count,
            });
        }
    }
    result.sort((a, b) => b.count - a.count);
    return result.map(({ tweet }) => tweet).slice(0, maxResult);
}
exports.getMostEngagedTweets = getMostEngagedTweets;


/***/ }),

/***/ "connect-mongodb-session":
/***/ ((module) => {

module.exports = require("connect-mongodb-session");

/***/ }),

/***/ "dotenv":
/***/ ((module) => {

module.exports = require("dotenv");

/***/ }),

/***/ "express":
/***/ ((module) => {

module.exports = require("express");

/***/ }),

/***/ "express-session":
/***/ ((module) => {

module.exports = require("express-session");

/***/ }),

/***/ "mongoose":
/***/ ((module) => {

module.exports = require("mongoose");

/***/ }),

/***/ "passport":
/***/ ((module) => {

module.exports = require("passport");

/***/ }),

/***/ "passport-twitter":
/***/ ((module) => {

module.exports = require("passport-twitter");

/***/ }),

/***/ "tslib":
/***/ ((module) => {

module.exports = require("tslib");

/***/ }),

/***/ "twitter-api-v2":
/***/ ((module) => {

module.exports = require("twitter-api-v2");

/***/ }),

/***/ "path":
/***/ ((module) => {

module.exports = require("path");

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry need to be wrapped in an IIFE because it need to be isolated against other modules in the chunk.
(() => {
var exports = __webpack_exports__;

Object.defineProperty(exports, "__esModule", ({ value: true }));
const dotenv = __webpack_require__("dotenv");
dotenv.config();
__webpack_require__("./libs/server/db/src/index.ts");
const app_1 = __webpack_require__("./libs/server/app/src/index.ts");
const port = process.env.PORT || 3333;
const server = app_1.app.listen(port, () => console.log(`server is running on http://localhost:${port}/api`));
server.on('error', console.error);

})();

var __webpack_export_target__ = exports;
for(var i in __webpack_exports__) __webpack_export_target__[i] = __webpack_exports__[i];
if(__webpack_exports__.__esModule) Object.defineProperty(__webpack_export_target__, "__esModule", { value: true });
/******/ })()
;
//# sourceMappingURL=main.js.map