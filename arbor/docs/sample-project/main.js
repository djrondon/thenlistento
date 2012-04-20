

$.ajax({
	url: 'parser.py',
	type: 'POST',
	data: {artist: "The Beatles"},
	success: function(result)
	{
	    $("#content").html("");
        var Renderer = function(canvas){
        var canvas = $(canvas).get(0)
        var ctx = canvas.getContext("2d");
        var particleSystem

        var that = {
          init:function(system){
            particleSystem = system
            particleSystem.screenSize(canvas.width, canvas.height) 
            particleSystem.screenPadding(80)
            that.initMouseHandling()
          },

          redraw:function(){
            ctx.fillStyle = "white"
            ctx.fillRect(0,0, canvas.width, canvas.height)

            particleSystem.eachEdge(function(edge, pt1, pt2){
              ctx.strokeStyle = "rgba(0,0,0, .333)"
              ctx.lineWidth = 1
              ctx.beginPath()
              ctx.moveTo(pt1.x, pt1.y)
              ctx.lineTo(pt2.x, pt2.y)
              ctx.stroke()
            })

            particleSystem.eachNode(function(node, pt){
              var w = 10
              ctx.fillStyle = (node.data.alone) ? "orange" : "#666"
              ctx.beginPath()
              ctx.arc(pt.x, pt.y, (node.data.weight)/4.0, 0, Math.PI*2, true)
              ctx.closePath()
              ctx.fill()
              ctx.fillStyle = "#000"
              ctx.fillText(node.data.name, pt.x - (node.data.name.length * 2.66), pt.y + (node.data.weight)/4.0 + 15)
            })    			
          },

          initMouseHandling:function(){
            var dragged = null;
            var handler = {
              clicked:function(e){
                console.log($(canvas))
                var pos = $(canvas).offset();
                _mouseP = arbor.Point(e.pageX-pos.left, e.pageY-pos.top)
                dragged = particleSystem.nearest(_mouseP);

                if (dragged && dragged.node !== null){
                  // while we're dragging, don't let physics move the node
                  dragged.node.fixed = true
                }
                
                newSearch(dragged.node, particleSystem)
                
                $(canvas).bind('mousemove', handler.dragged)
                $(window).bind('mouseup', handler.dropped)

                return false
              },
              dragged:function(e){
                var pos = $(canvas).offset();
                var s = arbor.Point(e.pageX-pos.left, e.pageY-pos.top)

                if (dragged && dragged.node !== null){
                  var p = particleSystem.fromScreen(s)
                  dragged.node.p = p
                }

                return false
              },

              dropped:function(e){
                if (dragged===null || dragged.node===undefined) return
                if (dragged.node !== null) dragged.node.fixed = false
                dragged.node.tempMass = 1000
                dragged = null
                $(canvas).unbind('mousemove', handler.dragged)
                $(window).unbind('mouseup', handler.dropped)
                _mouseP = null
                return false
              }
            }

            $(canvas).mousedown(handler.clicked);

          },

        }
        return that
      }    

        var sys = arbor.ParticleSystem(1000, 600, 0.5)
        sys.parameters({gravity:true, precision: 1.0})
        sys.renderer = Renderer("#viewport") 
                        
        var json = jQuery.parseJSON(result)
        
        //console.log(json)
        var canvas = $("#viewport").get(0)
        var ctx = canvas.getContext("2d");
        
        for(var i = 0; i<json.nodes.length; i++)
        {
          sys.addNode(json.nodes[i].name, {name:json.nodes[i].name, weight: json.nodes[i].rating})
          if(i>0)
          {
            sys.addEdge(json.nodes[0].name, json.nodes[i].name)
          }
        }
        
        var index = 0
        sys.eachNode(function(node,pt){
          console.log(json.nodes[index])
          index++
        })
                        
	},
	
	error: function(xhr, ajaxOptions, thrownError)
	{
		alert(thrownError);
	}
});

function newSearch(node, sys)
{
  $.ajax({
    url: 'parser.py',
    type: 'POST',
    data: {artist: node.data.name},
    success: function(result)
    {
      console.log(result)
      var json = jQuery.parseJSON(result)
      
      for(var i = 0; i<json.nodes.length; i++)
      {
        sys.addNode(json.nodes[i].name, {name:json.nodes[i].name, weight: json.nodes[i].rating})
        if(i>0)
        {
          sys.addEdge(node.name, json.nodes[i].name)
        }
      }
    },
    error: function(request, status, error)
    {
      console.log("oops")
    }
  })
}

