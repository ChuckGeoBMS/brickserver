const axios = require('axios');


const express = require("express");
const bodyParser = require('body-parser')
const app = express();

let authentication = [
	// just 1 metasys instance for now
	{
		username: "default",
		password: "default",
		url: "https://www.metasys.com/api",
		accessToken: "token",
		expires: new Date(),
		authString: 'Bearer token',
		system: "Metasys"
	}
];
/*
let username = "default", password = "default", url = "https://www.geobms.io/api/v1";
let accessToken = "token";
let expires = new Date();
let authString = 'Bearer ' + accessToken;
*/
// Add headers
app.use(function (req, res, next) {

    // Website you wish to allow to connect
    res.setHeader('Access-Control-Allow-Origin', 'http://' + process.env.WEB_HOST + ':' + process.env.WEB_PORT);

    // Request methods you wish to allow
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

    // Request headers you wish to allow
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');

    // Set to true if you need the website to include cookies in the requests sent
    // to the API (e.g. in case you use sessions)
    res.setHeader('Access-Control-Allow-Credentials', true);

    // Pass to next layer of middleware
    next();
});

app.use(express.json({ limit: '50mb' }));
app.use(bodyParser.json({ limit: '50mb' }))
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' })
)
app.listen(process.env.PORT, () => {
 console.log("Server running on port " + process.env.PORT);
});

const Pool = require('pg').Pool
const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: 'brickserver',
  user: 'jason',
  password: 'koh',
})
/*
function checkAuthentication() {
	console.log("accessToken = " + accessToken);
	console.log("username = " + username);
	console.log("password = " + password);
	console.log("url = " + url);

	if (accessToken == false) {
		return -1;
	} else {
		// todo...
		return true;
	}
}
*/
/*
var interval = "1 hour";
var equipmentIdArray = ["bd838087-6452-4ed4-a2be-91bbd676f8e3", "bd838087-6452-4ed4-a2be-91bbd676f8e4"];
*/
/*
async function getData() {
	// 2019-11-22T20:04:57.786Z
	const date = new Date().toISOString();
	const parts = date.split('T');
	const year = parseInt(parts[0].split('-')[0], 10);
	const month = parseInt(parts[0].split('-')[1], 10);
	const day = parseInt(parts[0].split('-')[2], 10);
	const hour = parseInt(parts[1].split(':')[0], 10);
	const minute = parseInt(parts[1].split(':')[1], 10);
	const value = parseInt(interval.split(' ')[0], 10);
	const unit = interval.split(' ')[1];
	const newDate = year + '-' + month.toString().padStart(2, "0") + '-' + day.toString().padStart(2, "0") + 'T' + hour.toString().padStart(2, "0") + ':' + minute.toString().padStart(2, "0") + ':00.000Z';
	var returnJson;

	console.log('getting data: ' + newDate);
	for (var i = 0 ; i < equipmentIdArray.length; i++) {
		returnJson = {};

		// not sure localhost is always valid here...
		let getUrl = "http://localhost:" + process.env.PORT +"/api/v1/equipment/" + equipmentIdArray[i] + "?date=" + newDate;

		try {
			if (unit.startsWith("minute")) {
				if (minute % value == 0) {
					returnJson = await asyncGet(getUrl);
				}
			} else if (unit.startsWith("hour")) {
				if (minute == 0 && hour % value == 0) {
					returnJson = await asyncGet(getUrl);
				}
			} else if (unit.startsWith("day")) {
				if (hour == 0 && minute == 0 && day % value == 0) {
					returnJson = await asyncGet(getUrl);
				}
			}
		} catch (e) {
			console.log("error: " + e);
		}
		if (typeof returnJson.data === "undefined") {
			const status = reauthenticateIfNecessary();

			console.log(status);
		} else {
			console.log(JSON.stringify(returnJson.data));
		}
	}
}
*/
/*
async function reauthenticateIfNecessary() {
	// reauthenticate if token expires in less than 5 minutes or has already expired...
	let threshold = new Date();

	threshold.setMinutes( threshold.getMinutes() + 5 )

	console.log(threshold.toISOString() + " (threshold) < " + authentication[0].expires.toISOString() + " (expires) ?");

	if (threshold < expires) {
		return "reauthenticateIfNecessary(): don't need to re-authenticate...";
	} else {
		try {
			const body =	{
								"username": authentication[0].username,
								"password": authentication[0].password
							};
			const apiData = await asyncPost(authentication[0].url + "/login", body);

			const responseBody = {
				success: true
			}

			console.log(apiData.data.accessToken)

			authentication[0].accessToken = apiData.data.accessToken;
			authentication[0].expires = new Date(apiData.data.expires);
			authentication[0].authString = "Bearer " + authentication[0].accessToken;

			return "reauthenticateIfNecessary(): successful re-authentication";
		} catch (e) {
			return "reauthenticateIfNecessary(): unsuccessful re-authentication";
		}
	}
}
*/
/*
// should get this from the database...
var timeout = setInterval(getData, 60000);
*/
async function asyncGet(url, config) {
  	return axios.get(url, config);
}

async function asyncPost(url, data) {
	return axios.post(url, data);
}

/*
var loginRouter = express.Router();

loginRouter.post('/', async function(req, res) {
	const body = req.body;

	// TODO: store the username/password

	console.log(body);
	try {
		const apiData = await asyncPost(body.url + "/login", body);

		const responseBody = {
			success: true
		}

		console.log(apiData.data.accessToken)

		authentication[0].accessToken = apiData.data.accessToken;
		authentication[0].expires = new Date(apiData.data.expires);
		authentication[0].username = body.username;
		authentication[0].password = body.password;
		authentication[0].url = body.url;
		authentication[0].authString = "Bearer " + authentication[0].accessToken;

		// TODO: store the accessToken

		res.status(200).json(responseBody);
	} catch (e) {
		console.log(e.message);

		res.status(typeof e.response == "undefined" ? 500 : e.response.status).send({error: e.message})
	}

});

app.use('/api/v1/login', loginRouter);

// Create the express router object for equipment
var equipmentRouter = express.Router();

// A GET to the root of a resource returns a list of that resource
equipmentRouter.get('/', async function(req, res) {
  try {
    // hardcoded to Metasys API
    const apiData = await asyncGet(authentication[0].url + '/equipment', { headers: { "Authorization": authentication[0].authString }});

    // need to operate on this data
    const responseBody = {
      data: apiData.data
    };

    res.status(200).json(responseBody);
  } catch(e) {
    console.log(e.stack)
    res.status(500).send({error: e.message})
  }	
});

// A POST to the root of a resource should create a new object
equipmentRouter.post('/', function(req, res) {
	res.statusCode = 500;
	return res.json({
		errors: ['TBD...']
	}); 
});

// We specify a param in our path for the GET of a specific object
equipmentRouter.get('/:id', async function(req, res) {
	let range = "";

	if (req.query.start) {
		console.log(req.query.start);

		range = " AND created_on >= '" + req.query.start + "'";
		if (req.query.end) {
			console.log(req.query.end);

			range += " AND created_on <= '" + req.query.end + "'";
		}
		pool.query("SELECT * FROM data WHERE equipment_id = '" + req.params.id + "'" + range + " ORDER BY created_on", (error, results) => {
			if (error) {
				throw error
			}
			res.status(200).json(results.rows)
		})
	} else {
		let equipmentJson, pointsJson;
		let hashtable = new Object();

		try {
			// hardcoded to Metasys API, but need more to get values...
			const apiData = await asyncGet(authentication[0].url + '/equipment/' + req.params.id, { headers: { "Authorization": authentication[0].authString }});

			// need to operate on this data
			equipmentJson = apiData.data
		} catch(e) {
			console.log(e.stack)
			res.status(500).send({error: e.message})
		}
		try {
			// hardcoded to Metasys API, but need more to get values...
			const apiData = await asyncGet(authentication[0].url + '/equipment/' + req.params.id + "/points", { headers: { "Authorization": authentication[0].authString }});

			// need to operate on this data
			pointsJson = apiData.data
		} catch(e) {
			console.log(e.stack)
			res.status(500).send({error: e.message})
		}

		// extract objects
		let objectId;
		let objectJsonArray = Array(pointsJson.items.length);

		for (var i = 0; i < pointsJson.items.length; i++) {
			objectId = pointsJson.items[i].objectUrl.split('/').pop();

			try {
				// hardcoded to Metasys API, but need more to get values...
				const apiData = await asyncGet(authentication[0].url + '/objects/' + objectId, { headers: { "Authorization": authentication[0].authString }});

				// need to operate on this data
				objectJsonArray[i] = apiData.data
			} catch(e) {
				console.log(e.stack)
				res.status(500).send({error: e.message})
			}
		}

		// TODO: process all data, but for now, only the first points element...
		let returnJson = {
			"id": equipmentJson.id,
			"name": equipmentJson.name,
			"type": equipmentJson.type,
			"items": []
		};

		for (var i = 0; i < objectJsonArray.length; i++) {
			hashtable[pointsJson.items[i].label] = objectJsonArray[i].item.presentValue.value;
			returnJson.items.push( {
				"label": pointsJson.items[i].label,
				"values": [
					{	
						"date": req.query.date ? req.query.date : new Date().toISOString(),
						"name": objectJsonArray[i].item.name,
						"value": objectJsonArray[i].item.presentValue.value
					}
				]
			});
		}

		// extract values to insert into database...
		// INSERT INTO data (id, equipment_id, name, created_on, supply_temperature, return_temperature, flow_rate) VALUES (uuid_generate_v1(), uuid_generate_v1(), 'foo', '2001-09-28 01:00', 4, 5, 6);

		console.log(hashtable);

		pool.query(
			'INSERT INTO data (id, equipment_id, name, type, created_on, supply_temperature, return_temperature, flow_rate) VALUES (uuid_generate_v1(), $1, $2, $3, $4, $5, $6, $7)', 
			[equipmentJson.id, equipmentJson.name, equipmentJson.type, req.query.date ? req.query.date : new Date().toISOString(), hashtable['Supply Temperature'], hashtable['Return Temperature'], hashtable['Flow Rate']], 
			(error, results) => {
			if (error) {
				throw error
			}
			return res.status(200).json(returnJson);		
		})
	}	
});

// Similar to the GET on an object, to update it we can PATCH
equipmentRouter.patch('/:id', function(req, res) { 
	res.statusCode = 500;
	return res.json({
		errors: ['TBD...']
	}); 
});

// Delete a specific object
equipmentRouter.delete('/:id', function(req, res) { 
	res.statusCode = 500;
	return res.json({
		errors: ['TBD...']
	}); 
});

// Attach the routers for their respective paths
app.use('/api/v1/equipment', equipmentRouter);
*/

let validationError = {
  "detail": [
    {
      "loc": [
        "TBD"
      ],
      "msg": "TBD",
      "type": "TBD"
    }
  ]
};

// Create the express router object for timeseries
var timeseriesRouter = express.Router();

// A POST to the root of a resource should create a new object
/*
{
    "data": [
        [
            "bldg:BLDG_RM100_ZN_T",
            "1970-01-01T03:25:40",
            22.3
        ],
        [
            "bldg:BLDG_RM100_ZN_T",
            "1970-01-01T03:25:41",
            24.5
        ],
        [
            "bldg:BLDG_RM100_ZN_T",
            "1970-01-01T03:25:42",
            32.4
        ],
        [
            "bldg:BLDG_RM100_ZN_T",
            "1970-01-01T03:25:43",
            34.9
        ]
    ],
    "columns": [
        "uuid",
        "timestamp",
        "number"
    ]    
}

INSERT INTO products (product_no, name, price) VALUES
    (1, 'Cheese', 9.99),
    (2, 'Bread', 1.99),
    (3, 'Milk', 2.99);
*/
timeseriesRouter.post('/', function(req, res) {
	try {
		let insert = "INSERT INTO timeseries (entity_id, time, value) VALUES ";

	    req.body.data.forEach(row => {
	    	insert += "('" + row[0] + "', '" + row[1] + "', " + row[2] + "), ";
	    })
	    console.log(insert.substring(0, insert.length - 2));

		pool.query(insert.substring(0, insert.length - 2), (error, results) => {
			if (error) {
				console.log(JSON.stringify(error));
				return res.status(500).json(validationError);
			}
			console.log(JSON.stringify(results));

			return res.status(200).json({ "is_success": true, "reason": results.rowCount !== undefined ? results.rowCount + " records created" : "TBD" })
		})
	} catch (e) {
		return res.status(500).json(validationError);
	}
});


// We specify a param in our path for the GET of a specific object
timeseriesRouter.get('/:id', async function(req, res) {
	try {
		// TODO: range...
		pool.query("SELECT * FROM timeseries WHERE entity_id = '" + req.params.id + "'", (error, results) => {
			if (error) {
				throw error
			}

			let returnJson = {
			    "data": [
			    ],
			    "columns": [
			        "uuid",
			        "timestamp",
			        "number"
			    ]
			}

		    results.rows.forEach(row => {
		        console.log("entity_id: " +  row.entity_id);
		        returnJson.data.push([ row.entity_id, row.time, row.value]);
		    })
		    console.log(returnJson);

			return res.status(200).json(returnJson)
		})
	} catch (e) {
		return res.status(500).json(validationError);
	}
});

// Delete a specific object
timeseriesRouter.delete('/:id', function(req, res) { 
	try {
		// TODO: range...
		pool.query("DELETE FROM timeseries WHERE entity_id = '" + req.params.id + "'", (error, results) => {
			if (error) {
				return res.status(500).json(validationError);
			}
			return res.status(200).json({ "is_success": true, "reason": results.rowCount !== undefined ? results.rowCount + " records deleted" : "TBD" })
		})
	} catch (e) {
		return res.status(500).json(validationError);		
	}
});

// Attach the routers for their respective paths
app.use('/brickapi/v1/data/timeseries', timeseriesRouter);

// Create the express router object for entities
var entitiesRouter = express.Router();

// We specify a param in our path for the GET of all entitites
entitiesRouter.get('/', async function(req, res) {
	try {
		pool.query("SELECT entity_id FROM entities", (error, results) => {
			if (error) {
				return res.status(500).json(validationError);
			}

			let returnJson = { "entity_ids": [] }
		    results.rows.forEach(row => {
		        console.log("entity_id: " +  row.entity_id);
		        returnJson.entity_ids.push(row.entity_id);
		    })
		    console.log(returnJson);

			return res.status(200).json(returnJson);
		})
	} catch (e) {
		return res.status(500).json(validationError);		
	}
});

// A POST to the root of a resource should create new objects
entitiesRouter.post('/', function(req, res) {
	try {
		let insert = "INSERT INTO entities (entity_id, name, type, relationships) VALUES ";

	    req.body.entities.forEach(row => {
	    	insert += "('" + row.entity_id + "', '" + row.name + "', '" + row.type + "', '" + JSON.stringify(row.relationships) + "'), ";
	    })
	    console.log(insert.substring(0, insert.length - 2));

		pool.query(insert.substring(0, insert.length - 2), (error, results) => {
			if (error) {
				return res.status(500).json(validationError);		
			}
			return res.status(200).json({ "is_success": true, "reason": results.rowCount !== undefined ? results.rowCount + " records created" : "TBD" })
		})
	} catch (e) {
		return res.status(500).json(validationError);		
	}

/*
		pool.query(
			'INSERT INTO entities (entity_id, type, name, relationships) VALUES (uuid_generate_v1(), $1, $2, $3) returning entity_id', 
			[req.body.type, req.body.name, JSON.stringify(req.body.relationships)], 
			(error, results) => {
			if (error) {
				throw error
			}
			return res.status(200).json(results.rows[0]);		
		})
*/
});


// We specify a param in our path for the GET of a specific object
entitiesRouter.get('/:id', async function(req, res) {
	try {
		pool.query("SELECT * FROM entities WHERE entity_id = '" + req.params.id + "'", (error, results) => {
			if (error) {
				return res.status(500).json(validationError);
			}
			return res.status(200).json(results.rows[0])
		})
	} catch (e) {
		return res.status(500).json(validationError);		
	}
});

// A POST to the root of a resource should modify an object
entitiesRouter.post('/:id', function(req, res) {
	return res.status(500).json(validationError);
});



// Delete a specific object
entitiesRouter.delete('/:id', function(req, res) { 
	try {
		pool.query("DELETE FROM entities WHERE entity_id = '" + req.params.id + "'", (error, results) => {
			if (error) {
				return res.status(500).json(validationError);
			}
			return res.status(200).json({ "is_success": true, "reason": results.rowCount !== undefined ? results.rowCount + " records deleted" : "TBD" })
		})
	} catch (e) {
		return res.status(500).json(validationError);		
	}
});

// Attach the routers for their respective paths
app.use('/brickapi/v1/entities', entitiesRouter);
