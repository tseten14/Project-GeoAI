
//Route for all contact deletion, addition, and CRUD
var express = require('express');
var router = express.Router();
const https = require('https');
const MongoClient = require('mongodb').MongoClient;
var ObjectID = require('mongodb').ObjectID;
var url = 'mongodb://localhost:27017/cmps369';
var ACCESS_TOKEN = 'pk.eyJ1IjoiYnRoYXBhMyIsImEiOiJja2hqYmtwMjMxd3kwMnF0OW9qbm83eG1iIn0.-cY1kDjXImx1CUySGcGtWA'; 
var latitude, longitude;
var contacts; // set by startup()

// Promise-based https get (Node < 18 has no global fetch). options can include { headers: {} }
function httpsGet(url, options) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, options || {}, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          resolve({ ok: res.statusCode === 200, json: () => Promise.resolve(JSON.parse(data)) });
        } catch (e) {
          reject(e);
        }
      });
    });
    req.on('error', reject);
  });
}

// Geocode a single address; returns { latitude, longitude } or null. Tries Mapbox, then Nominatim (OSM).
async function geocodeAddress(street, city, state) {
  const s = String(street || '').trim();
  const c = String(city || '').trim();
  if (!s || !c) return null;

  // Try Mapbox first
  try {
    const mapboxUrl = 'https://api.mapbox.com/geocoding/v5/mapbox.places/'
      + encodeURIComponent(s + ', ' + c + (state ? ', ' + state : '')) + '.json?access_token=' + ACCESS_TOKEN + '&limit=1';
    const response = await httpsGet(mapboxUrl);
    if (response.ok) {
      const body = await response.json();
      if (body && body.features && body.features.length > 0) {
        return {
          latitude: body.features[0].center[1],
          longitude: body.features[0].center[0]
        };
      }
    }
  } catch (e) {
    // fall through to Nominatim
  }

  // Fallback: OpenStreetMap Nominatim (no API key)
  try {
    const query = encodeURIComponent([s, c, state].filter(Boolean).join(', '));
    const nominatimUrl = 'https://nominatim.openstreetmap.org/search?q=' + query + '&format=json&limit=1';
    const response = await httpsGet(nominatimUrl, {
      headers: { 'User-Agent': 'GeocodedContactList/1.0 (contact list app)' }
    });
    if (response.ok) {
      const body = await response.json();
      if (Array.isArray(body) && body.length > 0 && body[0].lat != null && body[0].lon != null) {
        return {
          latitude: parseFloat(body[0].lat),
          longitude: parseFloat(body[0].lon)
        };
      }
    }
  } catch (e) {
    // ignore
  }
  return null;
}

//Part 5: Securing the Website
var ensureLoggedIn = function(req, res, next) {
	if ( req.user ) {
		next();
	}
	else {
		res.redirect("/login");
	}
}


//setting up a connection with the database
const startup = async () => {
    try {
        const connection = await MongoClient.connect(url, { useUnifiedTopology: true });
        var db = connection.db('cmps369');
        contacts = db.collection('colon1');
        console.log('MongoDB connected');
    } catch (ex) {
        console.error('MongoDB connection failed:', ex);
    }
};
const dbReady = startup();

var start = function(req, res, next) {

    res.render('mailer', { });
}


router.get('/',ensureLoggedIn, start); //directing to a mailerpage
router.get('/mailer', start);//directing to a mailer page

 
var geocodeandinsert = async (post_data, resp, type) => { //resp:response object , type: update or insert
    let latitude = null;
    let longitude = null;

    try {
        // Only geocode if we have Street and City (non-empty)
        const hasAddress = post_data.Street && post_data.City &&
            String(post_data.Street).trim() !== '' && String(post_data.City).trim() !== '';

        if (hasAddress) {
            const geocodeUrl = 'https://api.mapbox.com/geocoding/v5/mapbox.places/'
                + encodeURIComponent(post_data.Street + ',' + post_data.City + ',') + '.json?access_token='
                + ACCESS_TOKEN + '&limit=1';

            try {
                const response = await httpsGet(geocodeUrl);
                if (response.ok) {
                    const body = await response.json();
                    if (body && body.features && body.features.length > 0) {
                        longitude = body.features[0].center[0];
                        latitude = body.features[0].center[1];
                    }
                }
            } catch (geoErr) {
                console.log('Geocode failed (contact will still be saved):', geoErr.message);
            }
        }

        if (post_data.checkall === 'on') {
            post_data.checkemail = 'on';
            post_data.checkmail = 'on';
            post_data.checkphone = 'on';
        }

        if (!contacts) {
            console.error('Database not ready');
            return resp.redirect('/mailer');
        }

        if (type == 'insert') {
            await contacts.insertOne({
                Firstname: post_data.Firstname || '', Lastname: post_data.Lastname || '',
                Street: post_data.Street || '', City: post_data.City || '', State: post_data.State || '', Zip: post_data.Zip || '',
                Phone: post_data.Phone || '', Email: post_data.Email || '', Prefix: post_data.Prefix || '',
                contactbymail: post_data.checkmail || '', Contactbyphone: post_data.checkphone || '',
                Contactbyemail: post_data.checkemail || '', Latitude: latitude, Longitude: longitude
            });
            return resp.redirect('/contacts'); // go straight to contact list so user sees the new contact
        }
        else if (type == 'update') {
            var myquery = { "_id": ObjectID(post_data.mongoID) };
            var newvalues = {
                $set: {
                    Firstname: post_data.Firstname || '', Lastname: post_data.Lastname || '',
                    Street: post_data.Street || '', City: post_data.City || '', State: post_data.State || '', Zip: post_data.Zip || '',
                    Phone: post_data.Phone || '', Email: post_data.Email || '', Prefix: post_data.Prefix || '',
                    contactbymail: post_data.checkmail || '', Contactbyphone: post_data.checkphone || '',
                    Contactbyemail: post_data.checkemail || '', Latitude: latitude, Longitude: longitude
                }
            };
            await contacts.updateOne(myquery, newvalues);
            return resp.redirect('/contacts');
        }
    } catch (err) {
        console.error('geocodeandinsert error:', err);
        return resp.redirect('/mailer');
    }
} 

// handling data posted from the mailer page and inserting to database 
router.post('/mailer', async function(req, res) {
   
    const  post_data = req.body;
    const type='insert';
    await geocodeandinsert(post_data,res,type);

});

/* GET contacts page. Backfill lat/lng for any contact that has address but no coordinates. */
router.get('/contacts', ensureLoggedIn, async function (req, res, next) {
    if (!contacts) {
        console.error('Database not ready');
        return res.redirect('/mailer');
    }
    try {
        const docs = await contacts.find().toArray();
        for (const doc of docs) {
            const hasCoords = doc.Latitude != null && doc.Longitude != null &&
                doc.Latitude !== '' && doc.Longitude !== '';
            const hasAddress = doc.Street && doc.City &&
                String(doc.Street).trim() !== '' && String(doc.City).trim() !== '';
            if (!hasCoords && hasAddress) {
                const coords = await geocodeAddress(doc.Street, doc.City, doc.State);
                if (coords) {
                    await contacts.updateOne(
                        { _id: doc._id },
                        { $set: { Latitude: coords.latitude, Longitude: coords.longitude } }
                    );
                    doc.Latitude = coords.latitude;
                    doc.Longitude = coords.longitude;
                }
            }
        }
        res.render('contacts', { "data": docs });
    } catch (err) {
        console.error(err);
        res.redirect('/mailer');
    }
});

//deletes information from the database using mongoID
//delete works as a post request with mongoID being sent.

router.post('/delete', ensureLoggedIn, function (req, res, next) {
    const post_data = req.body;

    const deletefunc = async (id) => {
        var myquery = { "_id": ObjectID(id) };
        const result = await contacts.deleteOne(myquery);
        console.log(result.deletedCount + " document(s) deleted");
        res.redirect('/contacts'); //redirecting to contacts page after deleting
    };

    deletefunc(post_data.mongoID);
});


//getting update page is a post request with mongoID being send of a contact
//gets a object from a database and renders that on update page to autorefill

router.post('/getupdateform', ensureLoggedIn, async function (req, res) {
    const post_data = req.body;
    try {
        const myquery = { "_id": ObjectID(post_data.mongoID) };
        const obj = await contacts.findOne(myquery); // gets the table row information from database
        res.render('./update', { "object": obj });
    } catch (err) {
        console.error(err);
        res.redirect('/contacts');
    }
});



//Part 2:
//Updating the contacts is again post request
//uses function geocodeandinsert to store the updated values
router.post('/update', ensureLoggedIn, async function (req, res) {//update information at the database
    const post_data = req.body;
    const type='update';// type: either update or insert to the table
    await geocodeandinsert(post_data,res,type); 
});

router.dbReady = dbReady;
module.exports = router;
