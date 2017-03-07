import { Component, OnInit } from '@angular/core';
import { AppService } from './app.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  providers: [AppService]
})
export class AppComponent implements OnInit{

  constructor(
    private service: AppService
  ){}
  
  isGraphMode: boolean = true;
    
  title = 'Neo4j Client POC!';
  create = false;
  view = true;
  nodeTypes = [];
  selectedCreateNodeType = '';
  selectedViewNodeType = '';
    
  userName = '';
  userAge = '';
  postTitle = '';
  postDesc = '';
  commentDesc = '';
    
  isBaseView = true;
    
  nodeTypeData = {};

  switchModes() {
    this.create = !this.create;
    this.view = !this.view;
    if (this.view && !this.selectedViewNodeType) {
      this.selectedViewNodeType = this.nodeTypes[0];
      this.loadData();
    }
  }

  ngOnInit() {
    console.log("onNgOnInit app");
    this.service.getNodeTypes().subscribe((res) => {
      if (res && res.nodeTypes) {
        this.nodeTypes = res.nodeTypes;
        this.selectedCreateNodeType = this.nodeTypes[0];
        this.selectedViewNodeType  = this.nodeTypes[0];
        this.loadData();
      }
    }, (err) => {
      console.log('Error in connecting');
    });
  }

  isSelected(nodeType) {
    if(this.create) {
      return ((nodeType === this.selectedCreateNodeType)? "selected": "");    
    }
    return ((nodeType === this.selectedViewNodeType)? "selected": "");  
  }

  onChange(event) {
    console.log(event.srcElement.value);
    if (this.create) {
      this.selectedCreateNodeType = event.srcElement.value;
    } else {
      this.selectedViewNodeType = event.srcElement.value;
      this.loadData();
    }
  }

  createData() {
    switch(this.selectedCreateNodeType) {
       case 'User': this.createUser();
        break;
       
       case 'Post': this.createPost();
        break;
       
       case 'Comment': this.createComment();
        break;
       
       default:  
        console.log("Invalid operation!");
    }  
  }
    
  createDataDummy() {
    console.log("createDataDummy - > this.selectedCreateNodeType: " + this.selectedCreateNodeType);
  }

  createUser() {
    let data = {
      userName: this.userName,
      userAge: this.userAge   
    };
    
    this.service.createUser({
      data : data    
    }).subscribe((res) => {
      console.log('createUser: Success in connecting');
    }, (err) => {
      console.log('createUser: Error in connecting');
    }); 
  }

  createPost() {
    let data = {
      postTitle: this.postTitle,
      postDesc: this.postDesc   
    };
    
    this.service.createPost({
      data : data    
    }).subscribe((res) => {
      console.log('createPost: Success in connecting');
    }, (err) => {
      console.log('createPost: Error in connecting');
    }); 
  }

  createComment() {
    let data = {
      commentDesc: this.commentDesc,
      time: new Date().getTime()
    };
    
    this.service.createComment({
      data : data    
    }).subscribe((res) => {
      console.log('createComment: Success in connecting');
    }, (err) => {
      console.log('createComment: Error in connecting');
    }); 
  }

  loadData(){
    console.log('createComment: Error in connecting'+ this.selectedViewNodeType);
    console.log("getUsers app");
    this.service.getResultsForNodeType(this.selectedViewNodeType).subscribe((res) => {
      if (res) {
        this.nodeTypeData[this.selectedViewNodeType] = res[this.selectedViewNodeType];
        this.drawBaseGraph();
      }
    }, (err) => {
      console.log('Error in connecting');
    });
  }
    
  getKeys(node) {
    if(Object.keys(node).length) {
      return Object.keys(node); 
    } else {
      return null;    
    }
  }
    
  toggleExpandCollapse(x) {
     return !x;
  }
    
  selectedNode = null;
  connectedNodes = {};
    
  getConnectNodes({node, level, nodeType }) {
    this.selectedNode = null;
    this.connectedNodes = {};
    
    console.log("node: " + node._id + " level: " + level + " nodeType: " + nodeType);
    this.isBaseView = false;
    this.selectedNode = {
      nodeType: nodeType,
      node: node    
    };

    this.service.getConnectedNodesRelationships({node, level, nodeType}).subscribe((res) => {
      if (res) {
           console.log('Success in connecting');
           for (let rel of res) {
             this.service.getConnectedNodes({node, level, rel, nodeType}).subscribe((resp) => {
               if (resp) {
                   console.log('Success in connecting');
                   this.connectedNodes[rel] = resp;
                   this.drawRelationShipGraph();
               }
             }, (erro) => {
               console.log('Error in connecting');
             });    
           }
      }
    }, (err) => {
      console.log('Error in connecting');
    });
    
  }
  
  graph: any;
  
  getIndex(nodes, node) {
    var indexes = nodes.map((node) => node._id);
    var index = indexes.indexOf(node._id);
    console.log('index: '+ index);
    return index;
  }
    
  getNodesAndLinks(){
    let graph = {
      nodes :[],
      links: []    
    };
    graph = this.concatNodesAndLinks(graph); 
    graph.nodes.push(this.selectedNode.node);
    for(let key in this.connectedNodes) {
      for(let node of this.connectedNodes[key]){
        graph.nodes.push(node);
        graph.nodes = this.getUniq(graph.nodes);
        graph.links.push({ 
          "target": (this.getIndex(graph.nodes, node)), 
          "source":  (this.getIndex(graph.nodes, this.selectedNode.node)), 
          "name": key
        });  
      }   
    }
    graph.nodes = graph.nodes.map((node)=> {
     node.name = node.properties.name || node.properties.title;
     return node;    
    });
     
    return graph;      
  }
  
  padding = 50;
  radius = 80;

  collide(alpha) {
      let radius = this.radius;
      let padding = this.padding;
      let graph = this.graph;
      
      var quadtree = d3.geom.quadtree(graph.nodes);
      return function(d) {
        var rb = 2*radius + padding,
            nx1 = d.x - rb,
            nx2 = d.x + rb,
            ny1 = d.y - rb,
            ny2 = d.y + rb;
        quadtree.visit(function(quad, x1, y1, x2, y2) {
          if (quad.point && (quad.point !== d)) {
            var x = d.x - quad.point.x,
                y = d.y - quad.point.y,
                l = Math.sqrt(x * x + y * y);
              if (l < rb) {
              l = (l - rb) / l * alpha;
              d.x -= x *= l;
              d.y -= y *= l;
              quad.point.x += x;
              quad.point.y += y;
            }
          }
          return x1 > nx2 || x2 < nx1 || y1 > ny2 || y2 < ny1;
        });
      };
    } 
    
  drawRelationShipGraph() {
    var graph: any = this.getNodesAndLinks();
    this.padding = 5;
    graph['selector'] = '.graph';
    this.drawGraph(graph);
  }
    
  concatNodesAndLinks(graph) {
     let nodes = graph.nodes;
     let links = graph.links;
      
     this.graph.links = this.graph.links.map((link) => {
       if (typeof link.source === 'object') {
         link.source = link.source.index;
       }
       if (typeof link.target === 'object') {
         link.target = link.target.index;
       }
       return link;
     });
     nodes = nodes.concat(this.graph.nodes);
     links = links.concat(this.graph.links);
    
     nodes = this.getUniq(nodes);
      
     return {
       nodes,
       links  
     }; 
  }
  
  getUniq(objects) {
    let temp = [];
    objects = objects.filter((object) => {
      if (temp.indexOf(object._id) === -1) {
        temp.push(object._id);
        return true;
      }
      return false;
    });
    return objects;
  }
    
  drawBaseGraph() {
    let graph = {
      nodes :[],
      links: []    
    };
    graph['nodes'] = this.nodeTypeData[this.selectedViewNodeType].map((node)=> {
     node.name = node.properties.name || node.properties.title;
     return node;    
    });
    graph['selector'] = '.base-graph';
    this.padding = 50;
    this.drawGraph(graph);
  }
  
  counter = 1;
  drawGraph(graph) {
    this.graph = Object.create(graph);
    // Define the dimensions of the visualization. We're using
    // a size that's convenient for displaying the graphic on
    // http://jsDataV.is
    
    var width = 1920 * this.counter,
      height = 980 * this.counter;
      
    this.counter = this.counter * 1.2;
    
    // Define the data for the example. In general, a force layout
    // requires two data arrays. The first array, here named `nodes`,
    // contains the object that are the focal point of the visualization.
    // The second array, called `links` below, identifies all the links
    // between the nodes. (The more mathematical term is "edges.")
    
    // For the simplest possible example we only define two nodes. As
    // far as D3 is concerned, nodes are arbitrary objects. Normally the
    // objects wouldn't be initialized with `x` and `y` properties like
    // we're doing below. When those properties are present, they tell
    // D3 where to place the nodes before the force layout starts its
    // magic. More typically, they're left out of the nodes and D3 picks
    // random locations for each node. We're defining them here so we can
    // get a consistent application of the layout which lets us see the
    // effects of different properties.
    
    var nodes = graph.nodes;
    
    
    // The `links` array contains objects with a `source` and a `target`
    // property. The values of those properties are the indices in
    // the `nodes` array of the two endpoints of the link.
    var links = graph.links;  
    
    
    // Here's were the code begins. We start off by creating an SVG
    // container to hold the visualization. We only need to specify
    // the dimensions for this container.
      
    //clear canvas before drawing
    d3.selectAll(graph.selector + " > svg").remove();
    
    var svg = d3.select(graph.selector)
                .append('svg')
                .attr("viewBox", "0 0 " + width + " " + height )
                .call(d3.behavior.zoom().on("zoom", function () {
                   //svg.attr("transform", "translate(" + d3.event.translate + ")" + " scale(" + d3.event.scale + ")")
                    svg.attr("transform", "scale(" + d3.event.scale + ")")
                }))
                .append("g");
      
     //   .attr('width', width)
      //  .attr('height', height);
    
      
    // Now we create a force layout object and define its properties.
    // Those include the dimensions of the visualization and the arrays
    // of nodes and links.
    
    var force = d3.layout.force()
        .size([width, height])
        .nodes(nodes)
        .links(links);
    
    const node_drag = this.handleDrag(force);
    
    // There's one more property of the layout we need to define,
    // its `linkDistance`. That's generally a configurable value and,
    // for a first example, we'd normally leave it at its default.
    // Unfortunately, the default value results in a visualization
    // that's not especially clear. This parameter defines the
    // distance (normally in pixels) that we'd like to have between
    // nodes that are connected. (It is, thus, the length we'd
    // like our links to have.)
    
    force.linkDistance(width/5);
    
    // Next we'll add the nodes and links to the visualization.
    // Note that we're just sticking them into the SVG container
    // at this point. We start with the links. The order here is
    // important because we want the nodes to appear "on top of"
    // the links. SVG doesn't really have a convenient equivalent
    // to HTML's `z-index`; instead it relies on the order of the
    // elements in the markup. By adding the nodes _after_ the
    // links we ensure that nodes appear on top of links.
    
    // Links are pretty simple. They're just SVG lines, and
    // we're not even going to specify their coordinates. (We'll
    // let the force layout take care of that.) Without any
    // coordinates, the lines won't even be visible, but the
    // markup will be sitting inside the SVG container ready
    // and waiting for the force layout.
    
    var link = svg.selectAll('.link')
        .data(links)
        .enter().append('line')
        .attr('class', function(d) { return 'link ' + d.name; });
    
    // Now it's the nodes turn. Each node is drawn as a circle.
    
    var node = svg.selectAll('.node')
        .data(nodes)
        .enter().append('circle')
        .attr("stroke", "black")
        .attr('class',  (d) => { return this.isBaseView? this.selectedViewNodeType : d.labels[0]; })
        .attr("r", (d)=> { return this.radius; })
        .on('click', function(d) {d.fixed = false; })
        .on('dblclick', (d) => { this.getConnectNodes({'node': d, 'level': 1, nodeType: d.labels[0]}); })
        .on("mouseover", function(d) {
          var g = d3.select(this); // The node
          // The class is used to remove the additional text later
          var info = g.append('text')
           .classed('info', true)
           .attr('x', 20)
           .attr('y', 10)
           .text('More info');
        })
        .on("mouseout", function() {
          // Remove the info text on mouse out.
          d3.select(this).select('text.info').remove();
        })
        .call(node_drag);
        //.call(force.drag);
        
         //Added 
      
      /*var node = svg.selectAll("circle.node")
      .data(nodes)
      .enter().append("svg:circle")
      .style("fill", function (d) { return '#1f77b4'; })
      .attr("class", "node")
      .attr("cx", function(d) { return d.x; })
      .attr("cy", function(d) { return d.y; })
      .attr("r", function(d) { return r(d.textContent) || 5; })
      .call(force.drag);*/

       var text = svg.selectAll("text")
                    .data(nodes)
                    .enter()
                    .append("text")
                    .attr("fill", "white")
                    .attr("font-family", "sans-serif")
                    .attr("font-size", "14px")
                    .text(function(d) { return d.name.substr(0,15); });
                   
      
    force.on("tick", ()=> {
        link.attr("x1", function (d) {
            return d.source.x;
        })
            .attr("y1", function (d) {
            return d.source.y;
        })
            .attr("x2", function (d) {
            return d.target.x;
        })
            .attr("y2", function (d) {
            return d.target.y;
        });
        node.attr("cx", function (d) {
            return d.x;
        })
            .attr("cy", function (d) {
            return d.y;
        });
         node.each(this.collide(0.5)); //Added 
   });
      
    // We're about to tell the force layout to start its
    // calculations. We do, however, want to know when those
    // calculations are complete, so before we kick things off
    // we'll define a function that we want the layout to call
    // once the calculations are done.
    
    force.on('end', ()=> {
    
        // When this function executes, the force layout
        // calculations have concluded. The layout will
        // have set various properties in our nodes and
        // links objects that we can use to position them
        // within the SVG container.
    
        // First let's reposition the nodes. As the force
        // layout runs it updates the `x` and `y` properties
        // that define where the node should be centered.
        // To move the node, we set the appropriate SVG
        // attributes to their new values. We also have to
        // give the node a non-zero radius so that it's visible
        // in the container.
    
        node.attr('r', (d)=> { return this.radius; })
            .attr('cx', function(d) { return d.x; })
            .attr('cy', function(d) { return d.y; });
        
    
        // We also need to update positions of the links.
        // For those elements, the force layout sets the
        // `source` and `target` properties, specifying
        // `x` and `y` values in each case.
    
        link.attr('x1', function(d) { return d.source.x; })
            .attr('y1', function(d) { return d.source.y; })
            .attr('x2', function(d) { return d.target.x; })
            .attr('y2', function(d) { return d.target.y; });
        
        text.attr("transform", (d) => {
          return "translate(" + (d.x-(this.radius-2)) + "," + d.y + ")";
        });
    
    });

    force.charge(function(node) {
       return node.graph * -300;
    });  
    
    // Okay, everything is set up now so it's time to turn
    // things over to the force layout. Here we go.
    
    force.start();
    
    // By the time you've read this far in the code, the force
    // layout has undoubtedly finished its work. Unless something
    // went horribly wrong, you should see two light grey circles
    // connected by a single dark grey line. If you have a screen
    // ruler (such as [xScope](http://xscopeapp.com) handy, measure
    // the distance between the centers of the two circles. It
    // should be somewhere close to the `linkDistance` parameter we
    // set way up in the beginning (480 pixels). That, in the most
    // basic of all nutshells, is what a force layout does. We
    // tell it how far apart we want connected nodes to be, and
    // the layout keeps moving the nodes around until they get
    // reasonably close to that value.
    
    // Of course, there's quite a bit more than that going on
    // under the hood. We'll take a closer look starting with
    // the next example.    
  }
    
  handleDrag(force) {
    function dragstart(d, i) {
        force.stop() // stops the force auto positioning before you start dragging
    }
    function dragmove(d, i) {
        d.px += d3.event.dx;
        d.py += d3.event.dy;
        d.x += d3.event.dx;
        d.y += d3.event.dy;
    }
    function dragend(d, i) {
        d.fixed = true; // of course set the node to fixed so the force doesn't include the node in its auto positioning stuff
        force.resume();
    }
    function releasenode(d) {
        d.fixed = false; // of course set the node to fixed so the force doesn't include the node in its auto positioning stuff
        //force.resume();
    } 
   
    return d3.behavior.drag()
        .on("dragstart", dragstart)
        .on("drag", dragmove)
        .on("dragend", dragend);
  }
}
