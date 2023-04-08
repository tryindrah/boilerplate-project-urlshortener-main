require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const dns = require("dns")
const bodyParser = require("body-parser")
const urlParser = require("url");
const mongoose = require("mongoose")
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
app.use(bodyParser.urlencoded({ extended: true }))

// Basic Configuration
const port = process.env.PORT || 3000;

const urlSchema = new mongoose.Schema({
  original_url : String,
  short_url : Number
});

const Url = new mongoose.model("Url",urlSchema);

app.use(cors());

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.post('/api/shorturl', async function(req, res) {
  const url = req.body.url;
  console.log(url)
  const regex = /(http:\/\/|https:\/\/)/
  if(!regex.test(url)){
    return res.json({
      error: "invalid url"
    });
  }
  try {
    const address = await checkUrl(url);
    
    
    const data = await Url.findOne({ original_url: address });
    
    if (data) {
      res.json({
        original_url: data.original_url,
        short_url: data.short_url
      });
    } else {
      const count = await Url.countDocuments({});
      const newUrl = await Url.create({
        original_url: address,
        short_url: count
      });

      res.json({
        original_url: address,
        short_url: newUrl.short_url
      });
    }
  } catch (err) {
    console.log(err);
    res.json({
      error: "invalid url"
    });
  }
});

app.get('/api/shorturl/:short_url', async function(req, res) {
  try {
    const data = await Url.findOne({ short_url: req.params.short_url });

    if (data) {
      res.redirect(data.original_url);
    } else {
      res.json({
        error: "URL Not Found"
      });
    }
  } catch (err) {
    console.log(err);
  }
});

function checkUrl(url) {
  return new Promise((resolve, reject) => {
    dns.lookup(urlParser.parse(url).hostname, (err, address) => {
      if (err) {
        reject(err)
      } else {
        resolve(url)
      }
    })
  })
}

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
