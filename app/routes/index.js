var express = require('express');
var router = express.Router();
var neo4j = require('neo4j');
var url = require('url')
var path = require('path');
var db = new neo4j.GraphDatabase('http://neo4j:Aa123456@localhost:7474');
var filepath = path.join(__dirname, '../assets/images/1px.png');
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

router.get('/captureEvents', function(req, res, next) {
  console.log("---------------------------------------------------------------------------" + filepath);
  console.log(req.query);
  console.log("5");
  var type = req.query.action;
  if (type) {
	  console.log("5");
	  var source = JSON.parse(req.query.source);
	  source.uid = source.id;
	  delete source.id;
	  
	  console.log("5 source: " + source);
	  
      var target = JSON.parse(req.query.target);
      target.uid = target.id;
      delete target.id;
      
      console.log("5 target: "+ target);
		
	  var relationShip = req.query.action;
	  console.log("5 relationShip: "+ relationShip);
		
	  checkAndCreateNode('UserTF', source).then((source1) => {
		console.log("target ;" + target);
		checkAndCreateNode('ProductTF', target).then((product1) => {
		  console.log("target ;;" + target);
		  createRelationShip({source, target, relationShip}).then((results2) => {
			res.sendFile(filepath);
		  });
		});
	  })
		
  } else {
	  res.sendFile(filepath);
  }
});

router.get('/:nodeType', function(req, res, next) {
	console.log("1" + req.params.nodeType);
	var typename = req.params.nodeType;
	var query = `MATCH (n:${typename}) RETURN (n) LIMIT 15`;
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
	var nodeid = req.params.nodeid;
	var nodeType = req.params.nodeType;
	var level = req.params.level;
	var nodeType = req.params.nodeType;
	var query = `MATCH (a:${nodeType})-[r]-(m) where id(a) = ${nodeid} RETURN distinct type(r)`;
	console.log('---------------------------------------');
	console.log('\n query: ' + query);
	console.log('---------------------------------------');
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

router.get('/connectednodes/id/:nodeid/nodeType/:nodeType/relation/:relation/level/:level', function(req, res, next) {
	var nodeid = req.params.nodeid;
	var nodeType = req.params.nodeType;
	var level = req.params.level;
	var relation = req.params.relation;
	var query = `MATCH (a:${nodeType})-[r:${relation}]-(b) where id(a)=${nodeid} and (id(startnode(r)) = id(a) or id(endnode(r))=id(a)) return distinct b`;
	console.log('---------------------------------------');
	console.log('\n query: ' + query);
	console.log('---------------------------------------');
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

function checkAndCreateNode(nodeType, node) {
  console.log(node.uid);
  var query = `MATCH (a:${nodeType}) WHERE a.uid = '${node.uid}' RETURN a`;
  console.log(query);
  
  var p = new Promise((resolve, reject) => {
	  console.log("-------------");
	  db.cypher({ query: query }, (err, results)=> {
	  	console.log("In checkAndCreateNode callback");
		if (err) throw err;
		if (!results || !results.length) {
		  console.log("In checkAndCreateNode callback error");
		  let str = '{';
		  for (let i in node) {
			  str = str + i + " : '"+ node[i] +"', ";
		  }
		  if(str.indexOf(':') !== -1) {
    		str = str.substr(0, str.length-2) + '}';
		  }
		  
		  console.log('str: '+ str);
		  let q1 = `create (a:${nodeType} ${str}) return a`;
		  console.log('q1: '+ q1);
		  db.cypher({ query: q1 }, (err1, results1)=> {
		  	console.log("Results" + JSON.stringify(results1));
			if (err1) throw err;
			if (!results1) {
			  console.log('No User found');
			  reject(err1);
			} else {
			  resolve(results1);
			}	    	
		  });
		} else {
		  console.log("In checkAndCreateNode callback success : " + JSON.stringify(results));
		  resolve(results);
		}	    	
	  });
  });
  
  
  return p; 
}

function createRelationShip({source, target, relationShip}) {
	console.log("In createRelationShip" + JSON.stringify(target));
	var query = `MATCH (a:UserTF), (b:ProductTF) where a.uid = '${source.uid}' and b.uid = '${target.uid}' CREATE (a)-[r:${relationShip}]->(b) return r`;
	  console.log(query);
	  
	  var p = new Promise((resolve, reject) => {
		  db.cypher({ query: query }, (err, results)=> {
		  	console.log("Results" + JSON.stringify(results));
			if (err) throw err;
			if (!results) {
			  console.log('No User found');
			  reject(err);
			} else {
			  resolve(results);
			}	    	
		  });
	  });
		
	  return p;
}

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
