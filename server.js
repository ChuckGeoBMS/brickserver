// TODO: need an 

const axios = require('axios');

const express = require("express");
const bodyParser = require('body-parser')
const app = express();
// const multer = require('multer');
// const fs = require('fs');
// const csv = require('fast-csv');
const { v4: uuidv4 } = require('uuid');
const N3 = require('n3');
const inverseRelationships = {
	"isAssociatedWith": "hasAssociatedTag",
	"isControlledBy": "controls",
	"isFedBy": "feeds",
	"isLocationOf": "hasLocation",
	"isMeasuredBy": "measures",
	"isPartOf": "hasPart",
	"isPointOf": "hasPoint",
	"isRegulatedBy": "regulates",
	"isTagOf": "hasTag",
}

// const upload = multer({ dest: './uploads/' });

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
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }))
app.use(bodyParser.text({ type: 'text/*', inflate: true, defaultCharset: 'utf-8', limit: '50mb' }));
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

async function asyncGet(url, config) {
  	return axios.get(url, config);
}

async function asyncPost(url, data, config) {
	return axios.post(url, data, config);
}

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
/*
// A POST to the root of a resource should create a new object
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
	let namespace = (req.query.namespace && req.query.namespace != "") ? ("'" + req.query.namespace + "'") : "null"

	console.log("timeseriesRouter.post(): namespace = " + namespace);
	 
	try {
		let prediction = null;
		let insert = "INSERT INTO timeseries (namespace, entity_id, time, value, prediction) VALUES ";

		if (req.query.prediction && req.query.prediction != "") {
			prediction = req.query.prediction;
		}

		let predictionString = prediction == null ? "null" : "'" + prediction + "'";
	    req.body.data.forEach(row => {
	    	insert += "(" + namespace + ", '" + row[0] + "', '" + row[1] + "', " + row[2] + ", " + predictionString + "), ";
	    })

	    insert = insert.substring(0, insert.length - 2) + " ON CONFLICT ON CONSTRAINT timeseries_namespace_entity_id_time_prediction_key DO UPDATE SET value = EXCLUDED.value"
	    console.log(insert);

		pool.query(insert, (error, results) => {
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
	let namespace = (req.query.namespace && req.query.namespace != "") ? ("'" + req.query.namespace + "'") : "null"

	console.log("namespace = " + namespace);
	 
	try {
		let start = "2000-01-01";
		let end = "2050-01-01";
		let prediction = null;
		let date;

		if (req.query.start_time && req.query.start_time != "") {
			start = new Date(parseInt(req.query.start_time) * 1000).toISOString();

		}
		if (req.query.end_time && req.query.end_time != "") {
			end = new Date(parseInt(req.query.end_time) * 1000).toISOString();
		}
		if (req.query.prediction && req.query.prediction != "") {
			prediction = req.query.prediction;
		}

		let predictionString = prediction == null ? "IS null" : "= '" + prediction + "'";
		let queryString = "SELECT * FROM timeseries WHERE namespace = " + namespace + " AND entity_id = '" + req.params.id + "' AND time >= '" + start + "' AND time < '" + end + "' AND prediction " + predictionString + " ORDER BY time";

		console.log(queryString);

		pool.query(queryString, (error, results) => {
			if (error) {
				return res.status(500).json(validationError);
			}
/*
			if (results.rowCount == 0) {
				return res.status(404).json(validationError);
			}
*/			
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
		        returnJson.data.push([row.entity_id, row.time, row.value]);
		    })
			return res.status(200).json(returnJson)
		})
	} catch (e) {
		return res.status(500).json(validationError);
	}
});

// Delete all timeseries data
// NOTE: not part of the Brick API!
timeseriesRouter.delete('/', function(req, res) {
	let namespace = ((req.query.namespace && req.query.namespace != "") ? ("'" + req.query.namespace + "'") : "null")

	try {
		// TODO: simplify, range...
	 	let deleteString = 
	 		"DELETE FROM timeseries WHERE entity_id IN (SELECT entity_id FROM entities WHERE namespace = " + namespace + ")"

		console.log(deleteString);	 

		pool.query(deleteString, (error, results) => {
			if (error) {
				return res.status(500).json(validationError);
			}
			return res.status(200).json({ "is_success": true, "reason": results.rowCount !== undefined ? results.rowCount + " records deleted" : "TBD" })
		})
	} catch (e) {
		return res.status(500).json(validationError);		
	}
});

// Delete time series data for a specific entity
timeseriesRouter.delete('/:id', function(req, res) { 
	let namespace = ((req.query.namespace && req.query.namespace != "") ? ("'" + req.query.namespace + "'") : "null")
	
	try {
		// TODO: range...
		pool.query("DELETE FROM timeseries WHERE namespace = " + namespace + "AND entity_id = '" + req.params.id + "'", (error, results) => {
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
	let namespace = ((req.query.namespace && req.query.namespace != "") ? ("'" + req.query.namespace + "'") : "null")

	console.log("entitiesRouter.get(): namespace = " + namespace);
	 
	try {
		pool.query("SELECT entity_id FROM entities WHERE namespace=" + namespace, (error, results) => {
			if (error) {
				return res.status(500).json(validationError);
			}

			let returnJson = { "data": [] }
		    results.rows.forEach(row => {
		        console.log("entity_id: " +  row.entity_id);
		        returnJson.data.push(row.entity_id);
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
	let namespace = ((req.query.namespace && req.query.namespace != "") ? ("'" + req.query.namespace + "'") : "null")

	console.log("entitiesRouter.post(): namespace = " + namespace);
	console.log("body = " + JSON.stringify(req.body))
	 
	try {
		// let insert = "INSERT INTO entities (entity_id, name, type, relationships) VALUES ";
		let insertEntities = "INSERT INTO entities (namespace, entity_id, name, type) VALUES ";
		let insertRelationships = "INSERT INTO relationships (namespace, source_entity_id, relationship, target_entity_id) VALUES "
		let relationshipsCount = 0
		let row = req.body.data

	    // req.body.entities.forEach(row => {
	    	insertEntities += "(" + namespace + ", '" + row.entity_id + "', '" + row.name + "', '" + row.type + "'), ";
	    	row.relationships.forEach(function(item) {
	    		relationshipsCount++
  				if (item.length < 2) {
  					return res.status(400).json(validationError);
  				}

  				let relationshipParts = item[0].split("#");

  				if (relationshipParts.length != 2) {
  					console.log("not a Brick Schema relationship")

  					return res.status(500).json(validationError);	 						
  				}

  				let relationship = item[0];
  				let inverseRelationship = typeof(inverseRelationships[relationshipParts[1]]) === "undefined" ? null : relationshipParts[0] + "#" + inverseRelationships[relationshipParts[1]]

  				for (let i = 1; i < item.length; i++) {
  					if (inverseRelationship === null)
  						insertRelationships += "(" + namespace + ", '" + row.entity_id + "', '" + relationship + "', '" + item[i] + "'), ";
  					else						
  						insertRelationships += "(" + namespace + ", '" + item[i] + "', '" + inverseRelationship + "', '" + row.entity_id + "'), ";
  				}
			});
	    // })

	    console.log(insertEntities.substring(0, insertEntities.length - 2));
		console.log(relationshipsCount ? insertRelationships.substring(0, insertRelationships.length - 2) : "no relationships");

		pool.connect((err, client, done) => {
		  const shouldAbort = err => {
		    if (err) {
		      console.error('Error in transaction', err.stack)
		      client.query('ROLLBACK', err => {
		        if (err) {
		          console.error('Error rolling back client', err.stack)
		        }
		        // release the client back to the pool
		        done()
		      })
		    }
		    return !!err
		  }
		  client.query('BEGIN', err => {
		    if (shouldAbort(err)) 
		    	return res.status(500).json(validationError);
		    
		    client.query((insertEntities.substring(0, insertEntities.length - 2)), (err, res2) => {
		      if (shouldAbort(err)) 
		      	return res.status(500).json(validationError);
		      client.query(relationshipsCount ? (insertRelationships.substring(0, insertRelationships.length - 2)) : "", (err, res2) => {
		        if (shouldAbort(err)) 
		        	return res.status(500).json(validationError);
		        client.query('COMMIT', err => {
		          if (err) {
		            console.error('Error committing transaction', err.stack)
		          }
		          done()
		          return res.status(200).json({ "is_success": true, "reason": "transaction committed" });
		        })
		      })
		    })
		  })
		})
	} catch (e) {

		console.log("catch(e): " + e);

		return res.status(500).json(validationError);		
	}
});


// We specify a param in our path for the GET of a specific object
entitiesRouter.get('/:id', async function(req, res) {
	let namespace = ((req.query.namespace && req.query.namespace != "") ? ("'" + req.query.namespace + "'") : "null")

	console.log("entitiesRouter.get(id): namespace = " + namespace);
	 
	try {
		pool.connect((err, client, done) => {
		  let entity;
		  let relationshipName;
		  let relationshipArray;

		  const shouldAbort = err => {
		    if (err) {
		      console.error('Error in transaction', err.stack)
		      client.query('ROLLBACK', err => {
		        if (err) {
		          console.error('Error rolling back client', err.stack)
		        }
		        // release the client back to the pool
		        done()
		      })
		    }
		    return !!err
		  }
		  client.query('BEGIN', err => {
		    if (shouldAbort(err)) 
		    	return res.status(500).json(validationError);		    
		    client.query("SELECT entity_id, type, name FROM entities WHERE namespace = " + namespace + " AND entity_id = '" + req.params.id + "'", (err, res2) => {
				if (shouldAbort(err)) 
					return res.status(500).json(validationError);

				console.log(JSON.stringify(res2.rows));

				if (res2.rows.length == 0) {
					return res.status(404).json(validationError);
				}
				entity = {
							"entity_id": res2.rows[0].entity_id,
							"type": res2.rows[0].type,
							"name": res2.rows[0].name,
							"relationships": []
				}
				client.query("SELECT * FROM relationships WHERE namespace = " + namespace + " AND source_entity_id='" + req.params.id + "' ORDER BY relationship", (err, res2) => {
					if (shouldAbort(err)) 
						return res.status(500).json(validationError);

					console.log(JSON.stringify(res2.rows));

		  			relationshipName = "";
		  			relationshipArray = [];
					res2.rows.forEach(function(item) {
						let newRelationshipName = item.relationship;

						if (relationshipName != newRelationshipName) {
							if (relationshipArray.length != 0) {
								entity.relationships.push(relationshipArray);
							}
							relationshipName = newRelationshipName;
							relationshipArray = [ relationshipName ];
						}
						relationshipArray.push(item.target_entity_id);
					});
					if (relationshipArray.length != 0) {
						entity.relationships.push(relationshipArray);
					}
					client.query("SELECT * FROM relationships WHERE target_entity_id='" + req.params.id + "' ORDER BY relationship", (err, res2) => {
						if (shouldAbort(err)) 
							return res.status(500).json(validationError);

						console.log(JSON.stringify(res2.rows));

			  			relationshipName = "";
			  			relationshipArray = [];
						res2.rows.forEach(function(item) {
							let relationship = item.relationship.split("#");						
							let newRelationshipName = "~" + relationship[1];

							// TODO: parse "#" in relationship...

							for(var key in inverseRelationships)
							{
							    if (inverseRelationships[key] == relationship[1]) {
							         newRelationshipName = key;
							         break;
							     }
							}
							if (relationshipName != newRelationshipName) {
								if (relationshipArray.length != 0) {
									entity.relationships.push(relationshipArray);
								}
								relationshipName = newRelationshipName;
								relationshipArray = [ relationship[0] + "#" + relationshipName ];
							}
							relationshipArray.push(item.source_entity_id);
						});
						if (relationshipArray.length != 0) {
							entity.relationships.push(relationshipArray);
						}
						client.query('COMMIT', err => {
							if (err) {
								console.error('Error committing transaction', err.stack)
							}
							done()
							// TODO...
							return res.status(200).json({ data: entity});
						})
					})
				})
		  	})
		  })
		})

	} catch (e) {
		return res.status(500).json(validationError);		
	}
});

// A PUT to the root of a resource should modify an object
entitiesRouter.put('/:id', function(req, res) {
	let namespace = ((typeof(req.query.namespace) !== "undefined" && req.query.namespace != "") ? ("'" + req.query.namespace + "'") : "null")
	let replaceRelationships = ((typeof(req.query.replaceRelationships) !== "undefined" && req.query.replaceRelationships === "false") ? false : true)

	console.log("entitiesRouter.put(" + req.params.id + "): namespace = " + namespace + ", replaceRelationships = " + replaceRelationships);
	 
	try {
		let set = "";
		let insertRelationships = ""
		let deleteRelationships = ""

		// check existence of columns...
		if (req.body.data.type != null) {
			set = "type='" + req.body.data.type + "'";
		}
		if (req.body.data.name != null) {
			set += (set.length == 0 ? "" : ", ") + "name='" + req.body.data.name + "'";
		}

		pool.connect((err, client, done) => {
		  const shouldAbort = err => {
		    if (err) {
		      console.error('Error in transaction', err.stack)
		      client.query('ROLLBACK', err => {
		        if (err) {
		          console.error('Error rolling back client', err.stack)
		        }
		        // release the client back to the pool
		        done()
		      })
		    }
		    return !!err
		  }
		  client.query('BEGIN', err => {
		    if (shouldAbort(err)) 
		    	return res.status(500).json(validationError);

			console.log("executing UPDATE: " + (set == "" ? "SELECT" : "UPDATE entities SET " + set + " WHERE namespace = " + namespace + " AND entity_id = '" + req.params.id + "'"))

		    client.query(set == "" ? "SELECT" : "UPDATE entities SET " + set + " WHERE namespace = " + namespace + " AND entity_id = '" + req.params.id + "'", (err, res2) => {
				if (shouldAbort(err)) 
					return res.status(500).json(validationError);

				if (req.body.data.relationships != null) {
					deleteRelationships = (replaceRelationships ? "DELETE FROM relationships WHERE namespace = " + namespace + " AND (source_entity_id='" + req.params.id + "' OR target_entity_id='" + req.params.id + "')" : "SELECT")
					insertRelationships = "INSERT INTO relationships (namespace, source_entity_id, relationship, target_entity_id) VALUES ";
			    	req.body.data.relationships.forEach(function(item) {
						if (item.length < 2) {
							return res.status(400).json(validationError);
						}

		  				let relationshipParts = item[0].split("#");

		  				if (relationshipParts.length != 2) {
		  					console.log("not a Brick Schema relationship")

		  					return res.status(500).json(validationError);	 						
		  				}

		  				let relationship = item[0];
		  				let inverseRelationship = typeof(inverseRelationships[relationshipParts[1]]) === "undefined" ? null : relationshipParts[0] + "#" + inverseRelationships[relationshipParts[1]]

		  				for (let i = 1; i < item.length; i++) {
		  					if (inverseRelationship === null)
		  						insertRelationships += "(" + namespace + ", '" + req.params.id + "', '" + relationship + "', '" + item[i] + "'), ";
		  					else						
		  						insertRelationships += "(" + namespace + ", '" + item[i] + "', '" + inverseRelationship + "', '" + req.params.id + "'), ";
		  				}
					})
			    	if (req.body.data.relationships.length > 0) {
			    		insertRelationships = insertRelationships.substring(0, insertRelationships.length - 2);
			    	} else {
			    		insertRelationships = "SELECT";
			    	}
			    	deleteId = req.params.id;

					console.log(insertRelationships);
				} else {
					insertRelationships = "SELECT"
					deleteRelationships = "SELECT"
				}

				console.log("executing DELETE: " + deleteRelationships)
				client.query(deleteRelationships, (err, res2) => {
					if (shouldAbort(err)) 
						return res.status(500).json(validationError);

					console.log("executing INSERT: " + insertRelationships);

					client.query(insertRelationships, (err, res2) => {
						if (shouldAbort(err)) 
							return res.status(500).json(validationError);
						client.query('COMMIT', err => {
							if (err) {
								console.error('Error committing transaction', err.stack)
							}
							done()
							// TODO...
							return res.status(200).json({ "is_success": true, "reason": "transaction committed" });
						})
					})
				})
		  	})
		  })
		})
	} catch (e) {
		console.log(e);

		return res.status(500).json(validationError);		
	}
});

// Delete all entities
// NOTE: not part of the Brick API!
entitiesRouter.delete('/', function(req, res) { 
	try {
		let whereNamespaceString = "WHERE namespace = " + ((req.query.namespace && req.query.namespace != "") ? ("'" + req.query.namespace + "'") : "null")

		// TODO: simplify time series and relationship deletion
	 	let timeSeriesDeleteString = "DELETE FROM timeseries WHERE entity_id IN (SELECT entity_id FROM entities " + whereNamespaceString + ")"
	 	let relationshipsDeleteString = 
	 		"DELETE from relationships WHERE " +
	 		"source_entity_id IN (SELECT entity_id FROM entities " + whereNamespaceString + ") OR " +
	 		"target_entity_id IN (SELECT entity_id FROM entities " + whereNamespaceString + ")"
	 	let entitiesDeleteString = "DELETE FROM entities " + whereNamespaceString

	 	console.log(timeSeriesDeleteString)
	 	console.log(relationshipsDeleteString)
	 	console.log(entitiesDeleteString);

		pool.connect((err, client, done) => {
		  const shouldAbort = err => {
		    if (err) {
		      console.error('Error in transaction', err.stack)
		      client.query('ROLLBACK', err => {
		        if (err) {
		          console.error('Error rolling back client', err.stack)
		        }
		        // release the client back to the pool
		        done()
		      })
		    }
		    return !!err
		  }
		  client.query('BEGIN', err => {
		    if (shouldAbort(err)) {
		    	return res.status(422).json(validationError);
		    }

			// delete everything...
			client.query(timeSeriesDeleteString, (err, res2) => {
				if (shouldAbort(err)) {
				  return res.status(422).json(validationError);
				}
				client.query(relationshipsDeleteString, (err, res2) => {
					if (shouldAbort(err)) {
				  		return res.status(422).json(validationError);
					}
					client.query(entitiesDeleteString, (err, res2) => {
						if (shouldAbort(err)) {
				  			return res.status(422).json(validationError);
						}
				        client.query('COMMIT', err => {
				          if (err) {
				            return res.status(422).json(validationError);
				          }
				          done()
				          return res.status(200).json({ "is_success": true, "reason": { "status": "transaction committed" } });
				        })
					})
				})
			})
		  })
		})
	} catch (e) {
		console.log("catch(e): " + e);

		return res.status(500).json(validationError);		
	}
});

// Delete a specific entity
entitiesRouter.delete('/:id', function(req, res) { 
	try {
		let whereNamespaceString = "WHERE namespace = " + ((req.query.namespace && req.query.namespace != "") ? ("'" + req.query.namespace + "'") : "null")

		// TODO: simplify time series and relationship deletion
	 	let timeSeriesDeleteString = "DELETE FROM timeseries WHERE entity_id ='" + req.params.id + "'"
	 	let relationshipsDeleteString = 
	 		"DELETE from relationships WHERE " +
	 		"source_entity_id ='" + req.params.id + "'" +  " OR " +
	 		"target_entity_id ='" + req.params.id + "'"
	 	let entitiesDeleteString = "DELETE FROM entities " + whereNamespaceString + " AND entity_id = '" + req.params.id + "'"

	 	console.log(timeSeriesDeleteString)
	 	console.log(relationshipsDeleteString)
	 	console.log(entitiesDeleteString);

		pool.connect((err, client, done) => {
		  const shouldAbort = err => {
		    if (err) {
		      console.error('Error in transaction', err.stack)
		      client.query('ROLLBACK', err => {
		        if (err) {
		          console.error('Error rolling back client', err.stack)
		        }
		        // release the client back to the pool
		        done()
		      })
		    }
		    return !!err
		  }
		  client.query('BEGIN', err => {
		    if (shouldAbort(err)) {
		    	return res.status(422).json(validationError);
		    }

			// delete everything...
			client.query(timeSeriesDeleteString, (err, res2) => {
				if (shouldAbort(err)) {
				  return res.status(422).json(validationError);
				}
				client.query(relationshipsDeleteString, (err, res2) => {
					if (shouldAbort(err)) {
				  		return res.status(422).json(validationError);
					}
					client.query(entitiesDeleteString, (err, res2) => {
						if (shouldAbort(err)) {
				  			return res.status(422).json(validationError);
						}
				        client.query('COMMIT', err => {
				          if (err) {
				            return res.status(422).json(validationError);
				          }
				          done()
				          return res.status(200).json({ "is_success": true, "reason": { "status": "transaction committed" } });
				        })
					})
				})
			})
		  })
		})
	} catch (e) {
		return res.status(500).json(validationError);		
	}
});

// Attach the routers for their respective paths
app.use('/brickapi/v1/entities', entitiesRouter);

// Create the express router object for load
var uploadRouter = express.Router();

uploadRouter.post('/', async function(req, res) {
	try {
		let namespace = ((req.query.namespace && req.query.namespace != "") ? ("'" + req.query.namespace + "'") : "null")
		let whereNamespaceString = "WHERE namespace = " + namespace
	 	let timeSeriesDeleteString = "DELETE FROM timeseries WHERE entity_id IN (SELECT entity_id FROM entities " + whereNamespaceString + ")"
	 	let relationshipsDeleteString = 
	 		"DELETE from relationships WHERE " +
	 		"source_entity_id IN (SELECT entity_id FROM entities " + whereNamespaceString + ") OR " +
	 		"target_entity_id IN (SELECT entity_id FROM entities " + whereNamespaceString + ")"
	 	let entitiesDeleteString = "DELETE FROM entities " + whereNamespaceString

	 	console.log(timeSeriesDeleteString)
	 	console.log(relationshipsDeleteString)
	 	console.log(entitiesDeleteString);

		const parser = new N3.Parser();
		const store = new N3.Store();

		let insertEntities = "INSERT INTO entities (namespace, entity_id, name, type) VALUES ";
		let insertRelationships = "INSERT INTO relationships (namespace, source_entity_id, relationship, target_entity_id) VALUES "
		let name2uuid = {};
		let uuid;

		await parser.parse(req.body,(error, quad, prefixes) => {
	    	if (quad) {
	      		// console.log(quad);
	      		console.log("#Adding quad...");
	      		
	      		store.addQuad(quad);
	    	} else {
	      		console.log("#That's all, folks!");

	      		// 1. instantiate the entities
	      		(store.getQuads(null, "http://www.w3.org/1999/02/22-rdf-syntax-ns#type", null, null, null)).forEach(function(quad) {

	      			// console.log(JSON.stringify(quad));
	      			uuid = uuidv4();
					insertEntities += "(" + namespace + ", '" + uuid + "', '" + quad.subject.value + "', '" + quad.object.value + "'), ";
	      			name2uuid[quad.subject.value] = uuid;
	      		});

	      		// 2. relationships...
	      		(store.getQuads(null, null, null, null, null)).forEach(function(quad) {

	      			// console.log(JSON.stringify(quad));
	      			if (quad.predicate.value.includes("Brick")) {
	      				let relationship = quad.predicate.value.split('#');

	  					if (inverseRelationships[relationship[1]] == null) {
	  						insertRelationships += "(" + namespace + ", '" + name2uuid[quad.subject.value] + "', '" + quad.predicate.value + "', '" + name2uuid[quad.object.value] + "'), "; 						
	  					} else {
	  						insertRelationships += "(" + namespace + ", '" + name2uuid[quad.object.value] + "', '" + relationship[0] + "#" + inverseRelationships[relationship[1]] + "', '" + name2uuid[quad.subject.value] + "'), ";		
	  					}	      				
	      			}
	      		});
	    	}
		});

  		console.log(insertEntities);
  		console.log(insertRelationships);

  		// 3. send...
		pool.connect((err, client, done) => {
		  const shouldAbort = err => {
		    if (err) {
		      console.error('Error in transaction', err.stack)
		      client.query('ROLLBACK', err => {
		        if (err) {
		          console.error('Error rolling back client', err.stack)
		        }
		        // release the client back to the pool
		        done()
		      })
		    }
		    return !!err
		  }
		  client.query('BEGIN', err => {
		    if (shouldAbort(err)) {
		    	return res.status(422).json(validationError);
		    }

			// delete everything first...
			client.query(timeSeriesDeleteString, (err, res2) => {
				if (shouldAbort(err)) {
				  return res.status(422).json(validationError);
				}
				client.query(relationshipsDeleteString, (err, res2) => {
					if (shouldAbort(err)) {
				  		return res.status(422).json(validationError);
					}
					client.query(entitiesDeleteString, (err, res2) => {
						if (shouldAbort(err)) {
				  			return res.status(422).json(validationError);
						}

						// TODO: will need to reconcile existing entities...
					    client.query((insertEntities.substring(0, insertEntities.length - 2)), (err, res2) => {
					      if (shouldAbort(err)) {
					      	return res.status(422).json(validationError);
					      }
					      client.query((insertRelationships.substring(0, insertRelationships.length - 2)), (err, res2) => {
					        if (shouldAbort(err)) 
					        	return res.status(422).json(validationError);
					        client.query('COMMIT', err => {
					          if (err) {
					            return res.status(422).json(validationError);
					          }
					          done()
					          return res.status(200).json({ "is_success": true, "reason": { "status": "transaction committed", "mapping": name2uuid } });
					        })
					      })
					    })
				    })
			    })
			})
		  })
		})
		// return res.status(200).json({ "is_success": true, "reason": "transaction committed" });	
	} catch (e) {
		console.log("catch(e): " + e);

		return res.status(422).json(validationError);		
	}
});


// Attach the routers for their respective paths
app.use('/brickapi/v1/entities/upload', uploadRouter);
