var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var logger = require('morgan');
var mongoose = require('mongoose');
var request = require('request');
var cheerio = require('cheerio');

app.use(logger('dev'));
app.use(bodyParser.urlencoded({
  extended: false
}));

app.use(express.static('public'));

mongoose.connect('mongodb://localhost/week18mongoose');
var db = mongoose.connection;

db.on('error', function(err) {
  console.log('Mongoose Error: ', err);
});

db.once('open', function() {
  console.log('Mongoose connection successful.');
});

var Note = require('./models/Note.js');
var Article = require('./models/Article.js');


// Routes

app.get('/', function(req, res) {
  res.send(index.html);
});

// A GET request to scrape the echojs website.
app.get('/scrape', function(req, res) {
  request('http://www.echojs.com/', function(error, response, html) {
    var $ = cheerio.load(html);
    $('article h2').each(function(i, element) {
				var result = {};
				result.title = $(this).children('a').text();
				result.link = $(this).children('a').attr('href');
				var entry = new Article (result);
				entry.save(function(err, doc) {
				  if (err) {
				    console.log(err);
				  } else {
				    console.log(doc);
				  }
				});
    });
  });
  res.send("Scrape Complete");
});

app.get('/articles', function(req, res){
	Article.find({}, function(err, found) {
	    if (err) {
	      console.log(err);
	    } else {
	      res.json(found);
	    }
	});
});

app.get('/articles/:id', function(req, res){
	Article.findOne({'_id': req.params.id}).populate('note').exec(function(err, doc) {
		if(err) {
			console.log(err);
		} else {
			res.json(doc);
		}
	});
});

app.post('/articles/:id', function(req, res){
	var newNote = new Note(req.body);
	newNote.save(function(err, doc) {
		if(err) {
			console.log(err);
		} else {
			Article.findOneAndUpdate({"_id": req.params.id}, {'note':doc._id})
			.exec(function(err, doc) {
				if(err) {
					console.log(err);
				} else {
					res.send(doc);
				}
			})
		}
	});
});

app.listen(8080, function() {
  console.log('Port 8080');
});
