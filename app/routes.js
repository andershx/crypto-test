// app/routes.js
module.exports = function(app, passport) {
	app.use(function(req, res, next){

		next();
	});

	// =====================================
	// HOME PAGE (with login links) ========
	// =====================================
	app.get('/', function(req, res) {
		res.render('index.ejs'); // load the index.ejs file
	});

	// =====================================
	// LOGIN ===============================
	// =====================================
	// show the login form
	app.get('/login', function(req, res) {

		// render the page and pass in any flash data if it exists
		res.render('login.ejs', { message: req.flash('loginMessage') });
	});

	// process the login form
	app.post('/login', passport.authenticate('local-login', {
            successRedirect : '/profile', // redirect to the secure profile section
            failureRedirect : '/login', // redirect back to the signup page if there is an error
            failureFlash : true // allow flash messages
		}),
        function(req, res) {
            console.log("hello");

            if (req.body.remember) {
              req.session.cookie.maxAge = 1000 * 60 * 3;
            } else {
              req.session.cookie.expires = false;
            }
        res.redirect('/');
    });

	// =====================================
	// SIGNUP ==============================
	// =====================================
	// show the signup form
	app.get('/signup', function(req, res) {
		// render the page and pass in any flash data if it exists
		res.render('signup.ejs', { message: req.flash('signupMessage') });
	});

	// process the signup form
	app.post('/signup', passport.authenticate('local-signup', {
		successRedirect : '/profile', // redirect to the secure profile section
		failureRedirect : '/signup', // redirect back to the signup page if there is an error
		failureFlash : true // allow flash messages
	}));

	// =====================================
	// PROFILE SECTION =========================
	// =====================================
	// we will want this protected so you have to be logged in to visit
	// we will use route middleware to verify this (the isLoggedIn function)
	app.get('/profile', isLoggedIn, function(req, res) {
		console.log(req.session.id)
        let user = req.user;
        let DBService = require('./../service/db_service');
		let ETHTransaction = require('./eth_transactions');
        let BCHTransaction = require('./bch_transactions');

        DBService.getUserByUsername(user.username,function (err,data) {
            if(err) {
                console.log(err);
                user.eth_value = -1;
            }
            else
                ETHTransaction.getETHBalanceByUserId(data[0].id,function (err,ethData) {
                    if(!err){
                        user.eth_value = ethData;
                        BCHTransaction.getBCHBalanceByUserId(this.userId,function (err,bchData) {
                            if(!err){
                                user.bch_value = bchData;
                            }
                            res.render('profile.ejs', {user : user});
                        })
                    }
                    else
                    res.render('profile.ejs', {
                        user : user // get the user out of session and pass to template
                    });
                }.bind({userId:data[0].id}))
        })
	});

	// =====================================
	// LOGOUT ==============================
	// =====================================
	app.get('/logout', function(req, res) {
		req.logout();
		res.redirect('/');
	});


	//Leo 绘制eth转账二维码界面
	app.get('/deposit', isLoggedIn,function(req, res) {
		// render the page and pass in any flash data if it exist
		var QRCode = require('qrcode');
		const DBService =require('./../service/db_service');
        let ETHTransaction = require('./eth_transactions');
        let BCHTransaction = require('./bch_transactions');
		DBService.getUserByUsername(req.user.username,function (err, rows) {
            if (err){
                console.log(err);
                //	return done(false);
            }
            if (rows.length==0){
                console.log("Cannot find this user name in DB!");
                //	return done(false);
            }
            QRCode.toDataURL(rows[0].eth_address, function (err, url) {
            	let eth_url = url;
            	QRCode.toDataURL(this.row.bch_address,function (err1,url1) {
                    let bch_url = url1;
                    let user = this.req.user;
                    user.eth_address = this.row.eth_address;
                    user.bch_address = this.row.bch_address;
                    ETHTransaction.getETHBalanceByUserId(this.row.id,function (err,ethData) {
                        user.eth_amount=ethData;
                        BCHTransaction.getBCHBalanceByUserId(this.row.id,function (err,bchData) {
                            user.bch_amount=bchData;
                            this.res.render('deposit.ejs', { user: user, imgUrlEth: eth_url,imgUrlBCH:bch_url});
                        }.bind({row:this.row,res:res,req:req,user:user}))
                    }.bind({row:this.row,res:res,req:req,user:user}));
                }.bind({row: rows[0],res:res,req:req}))
            }.bind({row: rows[0],res:res,req:req}))
        });
	});

	//Leo  eth转出接口
	app.post('/ethwithdraw',isLoggedIn,function(req, res){
		let Eth = require('./eth_transactions');
        Eth.withdrawETH(req.user.username,req.body.ethAddress,req.body.ethAmount,function (err,data) {
			if(err) console.log(err);
			else{
 //               res.render('withdraw.ejs', { user: req.user,msg: "Coin was withdrawn as Ethereum. The transaction ID is "+data});
                  res.redirect('/withdraw?eth_tx='+data,);

            }
        });

	});
    app.post('/bchwithdraw',isLoggedIn,function(req, res){
    	console.log(req.user);
        let Bch = require('./bch_transactions');
        Bch.withdrawBCH(req.user.username,req.body.bchAddress,req.body.bchAmount,function (err,data) {
            if(err) console.log(err);
            else{
//                res.render('withdraw.ejs', { user: req.user,msg: "Coin was withdrawn as Bitcoin Cash. The transaction ID is "+data});
                res.redirect('/withdraw?bch_tx='+data,);
            }
        });

    });
    app.get('/withdraw',isLoggedIn,function(req, res){
        const DBService =require('./../service/db_service');
        let ETHTransaction = require('./eth_transactions');
        let BCHTransaction = require('./bch_transactions');
        console.log(req.body);
        ETHTransaction.getETHBalanceByUserId(req.user.id,function (err,ethData) {
            this.req.user.eth_amount=ethData;
            BCHTransaction.getBCHBalanceByUserId(this.req.user.id,function (err,bchData) {
                this.req.user.bch_amount=bchData;
                res.render('withdraw.ejs', { user: req.user});
            }.bind({res:res,req:req}))
        }.bind({res:res,req:req}));

    });

    app.get('/ajaxdeposit',isLoggedIn,function (req,res) {
        const ETHTX= require('./eth_transactions');
        ETHTX.getUnconfirmedDepositTxByUsername(req.user.username,function (err,data) {
            if(err) console.log(err);
            res.send(data);
        })
    });

    app.get('/ajaxbchdeposit',isLoggedIn,function (req,res) {
        const BCHTX= require('./bch_transactions');
        BCHTX.getUnconfirmedDepositTxByUsername(req.user.username,function (err,data) {
            if(err) console.log(err);
            res.send(data);
        })
    });

    app.get('/ajaxethbalance',isLoggedIn,function (req,res) {
        const ETHTX= require('./eth_transactions');
        ETHTX.getETHBalanceByUsername(req.user.username,function (err,data) {
            if(err) console.log(err);
            res.send({'ethBalance':data});
        })
    });

    app.get('/ajaxbchbalance',isLoggedIn,function (req,res) {
        const BCHTX= require('./bch_transactions');
        BCHTX.getBCHBalanceByUserId(req.user.id,function (err,data) {
            if(err) console.log(err);
            res.send({'bchBalance':data});
        })
    });

    app.get('/ajaxcoinbalance',isLoggedIn,function (req,res) {
        const DBService = require('./../service/db_service');
        DBService.getUserByUsername(req.user.username,function (err,data) {
            if(err) console.log(err);
            res.send({'coinBalance':data[0].coin});
        })
    });

    app.get('/ajaxethtx',isLoggedIn,function (req,res) {
        const ETHTX= require('./eth_transactions');
        let returnTx=ETHTX.getETHTransactionByTxHash(req.query.eth_tx);
        res.send(returnTx);
    });

    app.get('/ajaxbchtx',isLoggedIn,function (req,res) {
        const BCHTX= require('./bch_transactions');
        BCHTX.getBCHTransactionByTxHash(req.query.bch_tx,function (err,data) {
            res.send(data);
        });
    });
};

// route middleware to make sure
function isLoggedIn(req, res, next) {

	// if user is authenticated in the session, carry on
	if (req.isAuthenticated())
		return next();

	// if they aren't redirect them to the home page
	res.redirect('/');
}
