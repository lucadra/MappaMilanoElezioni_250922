function draw_map() {
d3.select("#info").selectAll("*").remove();
d3.select("#map").selectAll("*").remove();

  d3.json("data/mappa_elezioni2022.geojson").then((data) => {
    const url = (x, y, z) =>
      `https://api.mapbox.com/styles/v1/mapbox/light-v10/tiles/${z}/${x}/${y}${
        devicePixelRatio > 1 ? "@2x" : ""
      }?access_token=pk.eyJ1IjoiZHJhZHJhZHJhIiwiYSI6ImNqbnFoNndrdjIyZ2Izd3BrOXFzcjNpOTEifQ.6T-J06AkCQGngUHwpRvpoA`;

    data = rewind(data);

    const affluenza_max = d3.max(data.features, (d) =>
      d.properties[`Votanti_${chamber}`] /
        d.properties[`Elettori_${chamber}`] ==
      Infinity
        ? 0
        : d.properties[`Votanti_${chamber}`] /
            d.properties[`Elettori_${chamber}`] >
          1
        ? 0
        : d.properties[`Votanti_${chamber}`] /
          d.properties[`Elettori_${chamber}`]
    );

    const affluenza_min = d3.min(
      data.features,
      (d) =>
        d.properties[`Votanti_${chamber}`] / d.properties[`Elettori_${chamber}`]
    );

    let affluenza_color = d3
      .scaleDiverging()
      .domain([.2, 0.6, .8])
      .interpolator(d3.interpolateInferno);

    const voti_max = d3.max(data.features, (d) =>
      d.properties[`${party_ext}_${chamber}`] /
        d.properties[`Validi_${chamber}`] ==
      Infinity
        ? 0
        : d.properties[`${party_ext}_${chamber}`] /
            d.properties[`Validi_${chamber}`] >
          1
        ? 0
        : d.properties[`${party_ext}_${chamber}`] /
          d.properties[`Validi_${chamber}`]
    );

    const voti_min = d3.min(
      data.features,
      (d) =>
        d.properties[`${party_ext}_${chamber}`] /
        d.properties[`Validi_${chamber}`]
    );

    //let voti_color = d3
    //  .scaleSequential()
    //  .domain([voti_min, voti_max])
    //  .range(["rgba(255,255,255,0)", party_color_dict[party]]);

    
    //let voti_color = d3
    //  .scaleSequential()
    //  .domain([0, 0.35])
    //  .range(["rgba(255,255,255,0)", party_color_dict[party]]);

    let voti_color = d3
      .scaleSequential()
      .domain([0,0.35])
      .interpolator(d3.interpolateInferno)

    const svg = d3
      .select("#map")
      .append("svg")
      .attr("width", width)
      .attr("height", height)
      .attr("viewBox", [0, 0, width, height]);

    const projection = d3
      .geoMercator()
      .scale(1 / (2 * Math.PI))
      .translate([0, 0]);

    const render = d3.geoPath(projection);

    const tile = d3
      .tile()
      .extent([
        [0, 0],
        [width, height],
      ])
      .tileSize(512);

    const zoom = d3
      .zoom()
      .scaleExtent([1 << 10, 1 << 30])
      .extent([
        [0, 0],
        [width, height],
      ])
      .on("zoom", ({ transform }) => zoomed(transform));

    let image = svg.append("g").selectAll("image");

    let path = svg
      .append("g")
      .selectAll("path")
      .data(data.features)
      .enter()
      .append("path")
      .attr("fill", (d) => assignColor(d, affluenza_color, voti_color))
      .attr("fill-opacity", 0.6)
      .attr("id", (d) => d.properties.Sezione)
      .attr("stroke", "white")
      .attr("stroke-width", 0.2)
      .attr("stroke-linecap", "round")
      .attr("stroke-linejoin", "round")
      .on("click", function (e, d) {
        path.attr("fill-opacity", 0.6);
        path.attr("stroke-width", 0.2);
        d3.select(this).raise();
        d3.select(this).attr("fill-opacity", 1);
        d3.select(this).attr("stroke-width", 1);
        appendInfo(d);
      });

    if (view == "aff") {
      //append div as first child of #map
      d3.select("#map").selectAll(".legend-wrapper").remove();

      let legend_wrapper = d3
        .select("#map")
        .insert("div", ":first-child")
        .attr("class", "legend-wrapper")
        .style("position", "absolute")
        .style("background-color", "white")
        .style("right", "10px")
        .style("bottom", "10px")

        legend_wrapper.append("h3").text("Affluenza");

        // make height fit content
        legend_wrapper = legend_wrapper.append("svg")
        .attr("width", 80)
        .attr("height", 120)

      let legend = d3
        .legendColor()
        .scale(affluenza_color)
        .ascending(true)
        .shape("circle")
        .labelFormat(d3.format(".0%"))
        .shapePadding(4)

      legend_wrapper
        .append("g")
        .attr("class", "legend")
        .attr("transform", "translate(10, 10)")
        .call(legend);

    } else if (view == "par") {
      
        d3.select("#map").selectAll(".legend-wrapper").remove();

      let legend_wrapper = d3
        .select("#map")
        .insert("div", ":first-child")
        .attr("class", "legend-wrapper")
        .style("position", "absolute")
        .style("background-color", "white")
        .style("right", "10px")
        .style("bottom", "10px")

    legend_wrapper.append("h3").text("Voti");

    legend_wrapper = legend_wrapper.append("svg")
        .attr("width", 80)
        .attr("height", 120);

      // write ticks as percentages instead of decimals
      let legend = d3
        .legendColor()
        .scale(voti_color)
        .ascending(true)
        .shape("circle")
        .labelFormat(d3.format(".0%"))
        .shapePadding(4)


      legend_wrapper
        .append("g")
        .attr("class", "legend")
        .attr("transform", "translate(10, 10)")
        .call(legend);
    }

    svg.call(zoom).call(
      zoom.transform,
      d3.zoomIdentity
        .translate(width / 2, height / 2)
        .scale(-initialScale)
        .translate(...projection(initialCenter))
        .scale(-1)
    );

    function zoomed(transform) {
      const tiles = tile(transform);

      image = image
        .data(tiles, (d) => d)
        .join("image")
        .attr("xlink:href", (d) => url(...d))
        .attr("x", ([x]) => (x + tiles.translate[0]) * tiles.scale)
        .attr("y", ([, y]) => (y + tiles.translate[1]) * tiles.scale)
        .attr("width", tiles.scale)
        .attr("height", tiles.scale)
        .on("click", function (e, d) {
          d3.select("#info").selectAll("*").remove();
          path.attr("fill-opacity", 0.6);
          path.attr("stroke-width", 0.2);
        });

      projection
        .scale(transform.k / (2 * Math.PI))
        .translate([transform.x, transform.y]);

      path = path.attr("d", (d) => render(d));
    }
  });
}
