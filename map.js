//Specify Dimensions
var width = 900,
    height = 600;

// Field refernce to csv column to add color
var field = "score16"

// Create a SVG element in the map container and give it some
// dimensions.
var svg = d3.select('#map').append('svg')
  .attr('width', width)
  .attr('height', height);

// Define a geographical projection and scale the map 
var projection = d3.geo.mercator()
  .scale(1)

// Prepare a path object and apply the projection to it.
var path = d3.geo.path()
  .projection(projection);

// We prepare an object to later have easier access to the data.
var dataById = d3.map();

//Define quantize scale to sort data values into buckets of color
//Colors by Cynthia Brewer (colorbrewer2.org), 9-class YlGnBu

var color = d3.scale.quantize()
          //.range(d3.range(9),map(function(i) { return 'q' + i + '-9';}));
        .range([    
              "#a50026",
              "#d73027",
              "#f46d43",
              "#fdae61",
              "#fee08b",
              "#ffffbf",
              "#d9ef8b",
              "#a6d96a",
              "#66bd63",
              "#1a9850",
              "#006837" ]);

// Load in coverage score data
d3.csv("data/coverage16_v3.csv", function(data) {

  //Set input domain for color scale
  color.domain([
    d3.min(data, function(d) { return +d[field]; }),
    d3.max(data, function(d) { return +d[field]; })

    ]);
  // This maps the data of the CSV so it can be easily accessed by
  // the ID of the district, for example: dataById[2196]
  dataById = d3.nest()
    .key(function(d) { return d.id; })
    .rollup(function(d) { return d[0]; })
    .map(data);

  // Load the features from the GeoJSON.
  d3.json('data/ug_districts2.geojson', function(error, json) {



    // Get the scale and center parameters from the features.
    var scaleCenter = calculateScaleCenter(json);

    // Apply scale, center and translate parameters.
    projection.scale(scaleCenter.scale)
      .center(scaleCenter.center)
      .translate([width/2, height/2]);

    // Merge the coverage data amd GeoJSON into a single array
    // Also loop through once for each coverage score data value

    for (var i=0; i < data.length ; i++ ) {

      // Grab district name
      var dataDistrict = data[i].district;

      //Grab data value, and convert from string to float
      var dataValue = +data[i][field];

      //Find the corresponding district inside GeoJSON
      for (var j=0; j < json.features.length ; j++ ) {

        // Check the district reference in json
        var jsonDistrict = json.features[j].properties.dist;

        if (dataDistrict == jsonDistrict) {

          //Copy the data value into the GeoJSON
          json.features[j].properties.field = dataValue;

          //Stop looking through JSON
          break;
        }
      }
    }
      
    console.log(json)

    svg.append('g') // add a <g> element to the SVG element and give it a class to style later
        .attr('class', 'features')
    svg.selectAll('path')
        .data(json.features)
        .enter()
        .append('path')
        .attr('d', path)
        .style("fill", function(d) {
       
          // Get data value
          
          var value = d.properties.field;

          if (value) {
            // If value exists ...
            return color(value);
          } else {
            // If value is undefines ...
            return "#ccc";
          }
        
        });


  }); //End of d3.json

}); //End of d3.csv



 /* 
 A way to Dynamically scale and position the map
 Thanks to: http://stackoverflow.com/a/17067379/841644
 
 */
function calculateScaleCenter(features) {
  // Get the bounding box of the paths (in pixels!) and calculate a
  // scale factor based on the size of the bounding box and the map
  // size.
  var bbox_path = path.bounds(features),
      scale = 0.95 / Math.max(
        (bbox_path[1][0] - bbox_path[0][0]) / width,
        (bbox_path[1][1] - bbox_path[0][1]) / height
      );

  // Get the bounding box of the features (in map units!) and use it
  // to calculate the center of the features.
  var bbox_feature = d3.geo.bounds(features),
      center = [
        (bbox_feature[1][0] + bbox_feature[0][0]) / 2,
        (bbox_feature[1][1] + bbox_feature[0][1]) / 2];

  return {
    'scale': scale,
    'center': center
  };
}