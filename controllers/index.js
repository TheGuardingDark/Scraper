var express = require("express");
var router = express.Router();
var axios = require("axios");
var cheerio = require("cheerio");

var db = require("../models");


// Routes

// Homepage
router.get("/", function(req, res) {
    res.render("index")
})


// A GET route for scraping the website
router.get("/scrape", function(req, res) {
    // grab the body of the html with axios
    axios.get("https://www.cracked.com/").then(function(response) {
      // load that into cheerio and save it to $ for a shorthand selector
      var $ = cheerio.load(response.data);
  
      // grab every h3 within a div, and do the following:
      $("div h3").each(function(i, element) {
        // Save an empty result object
        var result = {};
  
        // Add the text and href of every link, and save them as properties of the result object
        result.title = $(this)
          .children("a")
          .text();
        result.link = $(this)
          .children("a")
          .attr("href");
  
        // Create a new Article using the `result` object built from scraping
        db.Article.create(result)
          .then(function(dbArticle) {
            // View the added result in the console
            console.log(dbArticle);
          })
          .catch(function(err) {
            // If an error occurred, log it
            console.log(err);
          });
      });
  
      // Send a message to the client
      res.send("Scrape Complete");
    });
  });
  
  // Route for getting all Articles from the db
  router.get("/articles", function(req, res) {
    db.Article.find({})
    .then(function(dbArticle) {
      var hbsObject = {
        articles: dbArticle,
        url: db.Article.link
      };
      console.log(hbsObject);
      res.render("index", hbsObject);
    })
    .catch(function(err) {
      res.json(err)
    });
  });

  //Route for getting all saved articles
  router.get("/saved", function(req, res) {
      db.Article.find({saved: true})
        .populate("note")
        .then(function(dbArticle) {
            res.json(dbArticle)
        })
        .catch(function(err) {
            res.json(err)
        });
  });
  
  // Route for grabbing a specific Article by id, populate it with it's note
  router.get("/articles/:id", function(req, res) {
    db.Article.findById({_id: req.params.id})
    .populate("note")
    .then(function(dbArticle) {
      res.json(dbArticle)
    })
    .catch(function(err) {
      res.json(err)
    });
  });
  
  // Route for saving/updating an Article's associated Note
  router.post("/articles/:id", function(req, res) {
    db.Note.create(req.body) 
    .then(function(dbNote) {
      return db.Article.findOneAndUpdate({_id: req.params.id}, {note: dbNote._id}, {new: true});
    })
    .then(function(dbArticle) {
      res.json(dbArticle)
    })
    .catch(function(err) {
      res.json(err)
    })
  });

//   route to delete articles
  router.delete("/articles/:id", function(req, res) {
      db.Article.remove({_id: req.params.id})
      .then(function(dbArticle) {
          res.json(dbArticle)
      })
      .catch(function(err) {
          res.json(err)
      })
  });

// export for server to use
module.exports = router;
