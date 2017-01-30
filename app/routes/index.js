var express = require('express');
var router = express.Router();
var neo4j = require('neo4j');
var db = new neo4j.GraphDatabase('http://neo4j:Aa123456@localhost:7474');
/* GET home page. */
router.get('/', function(req, res, next) {
	res.send('Neo4j Server');
});

router.get('/nodetypes', function(req, res, next) {
	console.log("1" +  db);
	db.cypher({
	    query: 'MATCH (n) RETURN distinct labels(n)'
	}, getNodesCallback);
	
	function getNodesCallback(err, results) {
		console.log("2");
		if (err) throw err;
		console.log("3");
	    if (!results) {
	        console.log('No labels found.');
	    } else {
	    	console.log("5");
	        var labels = results.map((res)=>{
	        	  return res['labels(n)'];
	        });
	        labels = flatten(labels);
	        labels = unique(labels);
	        console.log('labels'+ labels);
	        res.send({nodeTypes: labels});
	    }
	}
});

router.post('/user', function(req, res, next) {
	console.log('req: ' + JSON.stringify(req.body));
	res.send(true);
});

router.post('/comment', function(req, res, next) {
	console.log('req: ' + JSON.stringify(req.body));
	res.send(true);
});

router.post('/post', function(req, res, next) {
	console.log('req: ' + JSON.stringify(req.body));
	res.send(true);
});

router.get('/:nodeType', function(req, res, next) {
	console.log("1" + req.params.nodeType);
	var typename = req.params.nodeType;
	var query = `MATCH (n:${typename}) RETURN (n) LIMIT 5`;
	console.log('query: ' + query);
	db.cypher({
	    query: query
	}, getNodesCallback);
	
	function getNodesCallback(err, results) {
		console.log("2" + JSON.stringify(results));
		if (err) throw err;
		console.log("3");
	    if (!results) {
	        console.log('No labels found.');
	    } else {
	    	console.log("5");
	    	var data = {};
	    	data[typename] = results.map((res) => res['n']); 
	        res.send(data);
	    }
	}
});

router.get('/connectednodesrelationships/id/:nodeid/nodeType/:nodeType/level/:level', function(req, res, next) {
	console.log("1" + req.params.nodeType);
	var nodeid = req.params.nodeid;
	var level = req.params.level;
	var nodeType = req.params.nodeType;
	var query = `MATCH (a)-[r]-(m) where a.id = '${nodeid}' RETURN distinct type(r)`;
	console.log('query: ' + query);
	db.cypher({
	    query: query
	}, getRelationshipsCallback);
	var data = {};
	
	function getRelationshipsCallback(err, results) {
		console.log("2" + JSON.stringify(results));
		if (err) throw err;
		console.log("3");
	    if (!results) {
	        console.log('No labels found.');
	    } else {
	    	console.log("5");
	    	var result = results.map((res) => res['type(r)']); 
	        res.send(result);
	    }
	}
});

router.get('/connectednodes/id/:nodeid/relation/:relation/level/:level', function(req, res, next) {
	console.log("1" + req.params.nodeType);
	var nodeid = req.params.nodeid;
	var level = req.params.level;
	var relation = req.params.relation;
	var query = `MATCH (a)-[r]->(b) where a.id='${nodeid}' and (startnode(r).id = a.id or endnode(r).id=a.id) return distinct b`;
	console.log('query: ' + query);
	db.cypher({
	    query: query
	}, getRelationshipsCallback);
	var data = {};
	
	function getRelationshipsCallback(err, results) {
		console.log("2" + JSON.stringify(results));
		if (err) throw err;
		console.log("3");
	    if (!results) {
	        console.log('No labels found.');
	    } else {
	    	console.log("5");
	    	var result = results.map((res) => res['b']); 
	        res.send(result);
	    }
	}
});

const flatten = (arr) => arr.reduce((a, b) => a.concat(Array.isArray(b) ? flatten(b) : b), []);
const unique = (arr) => { 
	let temp = []; 
	arr.forEach((ele) => {
	  if (temp.indexOf(ele) === -1) {
		temp.push(ele);
	  }
	});
  return temp;	
};
module.exports = router;
