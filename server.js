var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var path = require('path');
var crypto = require('crypto');

var cors = require('cors');

app.use(cors())
app.use(bodyParser.urlencoded({
	extended: true
}));
app.use(express.static(__dirname + '/'));
app.engine('html', require('ejs').renderFile);
app.set('view engine', 'html');
app.set('views', __dirname);

const MERCHANT_KEY = "n4wc4WrA"
const MERCHANT_SALT = "1cKbR7s0cz"


app.get('/payment', function (req, res) {
	var ord = JSON.stringify(Math.random() * 1000);
	var i = ord.indexOf('.');
	ord = 'ORD' + ord.substr(0, i);
	res.render(__dirname + '/checkout.html', {
		orderid: ord
	});


});


app.post('/', function (req, res) {
	var strdat = '';

	req.on('data', function (chunk) {
		// console.log(chunk)
		strdat += chunk;
	});

	req.on('end', function () {
		var data = JSON.parse(strdat);
		var cryp = crypto.createHash('sha512');
		var text = MERCHANT_KEY + '|' + data.txnid + '|' + data.amount + '|' + data.pinfo + '|' + data.fname + '|' + data.email + '|||||' + data.udf5 + '||||||' + MERCHANT_SALT;
		cryp.update(text);
		var hash = cryp.digest('hex');
		res.setHeader("Content-Type", "text/json");
		res.setHeader("Access-Control-Allow-Origin", "*");
		res.end(JSON.stringify(hash));
	});


});

app.post('/saveToBackend', function (req, res) {
	// var key = req.body.key;
	// var salt = req.body.salt;
	var txnid = req.body.txnid;
	var amount = req.body.amount;
	var productinfo = req.body.productinfo;
	var firstname = req.body.firstname;
	var email = req.body.email;
	var udf5 = req.body.udf5;
	var mihpayid = req.body.mihpayid;
	var status = req.body.status;
	var resphash = req.body.hash;

	var keyString = MERCHANT_KEY + '|' + txnid + '|' + amount + '|' + productinfo + '|' + firstname + '|' + email + '|||||' + udf5 + '|||||';
	var keyArray = keyString.split('|');
	var reverseKeyArray = keyArray.reverse();
	var reverseKeyString = MERCHANT_SALT + '|' + status + '|' + reverseKeyArray.join('|');

	var cryp = crypto.createHash('sha512');
	cryp.update(reverseKeyString);
	var calchash = cryp.digest('hex');

	var msg = 'Payment failed for Hash not verified...';
	if (calchash == resphash)
		msg = 'Transaction Successful and Hash Verified...';

	res.send({
		txnid: txnid,
		amount: amount,
		productinfo: productinfo,
		firstname: firstname,
		email: email,
		mihpayid: mihpayid,
		status: status,
		resphash: resphash,
		msg: msg
	});
});
app.listen(3000);