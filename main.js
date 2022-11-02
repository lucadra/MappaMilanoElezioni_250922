let width = document.body.clientWidth;
let height = document.body.clientHeight;

const initialScale = 1 << 21;
const initialCenter = [9.18, 45.47];

function rewind(geo) {
  {
    const fixedGeoJSON = { ...geo };
    fixedGeoJSON.features = fixedGeoJSON.features.map((f) =>
      turf.rewind(f, { reverse: true })
    );
    return fixedGeoJSON;
  }
}

let inputs = d3.select("#menu").append("div").attr("id", "inputs-wrapper");
let chamber = "camera";

const chamber_input = inputs.append("div").attr("class", "chamber_input");

chamber_input.append("legend").text("Organo");

let option = chamber_input
  .selectAll("input")
  .data(["Camera", "Senato"])
  .enter()
  .append("div");

option
  .append("input")
  .attr("type", "radio")
  .attr("name", "chamber")
  .attr("value", (d) => d)
  .on("click", function () {
    chamber = this.value;
    chamber = chamber.toLowerCase();
    draw_map();
  });

d3.select("input[value='Camera']").property("checked", true);

option
  .append("label")
  .attr("for", (d) => d)
  .text((d) => d);

let view = "all";
const view_input = inputs.append("div").attr("class", "view_input");

view_input.append("legend").text("Visualizza");

let option_view = view_input
  .selectAll("input")
  .data(["Risultati complessivi", "Risultati per partito", "Affluenza"])
  .enter()
  .append("div");

views = {
  "Risultati complessivi": "all",
  "Risultati per partito": "par",
  Affluenza: "aff",
};

option_view
  .append("input")
  .attr("type", "radio")
  .attr("name", "view")
  .attr("value", (d) => d)
  .on("click", function () {
    view = views[this.value];

    if (view === "par" && d3.select(".party_input").empty()) {
      appendPartyOptions();
    } else if (view !== "par") {
      if (view !== "aff") {
        d3.select("#map").selectAll(".legend-wrapper").remove();
      }
      d3.select(".party_input").remove();
      d3.select("#info").selectAll("*").remove();
      draw_map();
    }
  });

option_view
  .append("label")
  .attr("for", (d) => d)
  .text((d) => d);

const parties = [
  "+EUROPA",
  "ALLEANZA VERDI E SINISTRA",
  "AZIONE - ITALIA VIVA - CALENDA",
  "FORZA ITALIA",
  "FRATELLI D'ITALIA CON GIORGIA",
  "IMPEGNO CIVICO LUIGI DI MAIO -",
  "ITALEXIT PER L'ITALIA",
  "ITALIA SOVRANA E POPOLARE",
  "LEGA PER SALVINI PREMIER",
  "MASTELLA NOI DI CENTRO EUROPEI",
  "MOVIMENTO 5 STELLE",
  "NOI MODERATI/LUPI - TOTI - BRU",
  "PARTITO DEMOCRATICO - ITALIA D",
  "UNIONE POPOLARE CON DE MAGISTR",
];

party_dict = {
  "+EUROPA_camera": "+ Europa",
  "+EUROPA_senato": "+ Europa",
  "+EUROPA": "+ Europa",
  "ALLEANZA VERDI E SINISTRA_camera": "Alleanza Verdi e Sinistra",
  "ALLEANZA VERDI E SINISTRA_senato": "Alleanza Verdi e Sinistra",
  "ALLEANZA VERDI E SINISTRA": "Alleanza Verdi e Sinistra",
  "AZIONE - ITALIA VIVA - CALENDA_camera": "Azione - Italia Viva - Calenda",
  "AZIONE - ITALIA VIVA - CALENDA_senato": "Azione - Italia Viva - Calenda",
  "AZIONE - ITALIA VIVA - CALENDA": "Azione - Italia Viva - Calenda",
  "FORZA ITALIA_camera": "Forza Italia",
  "FORZA ITALIA_senato": "Forza Italia",
  "FORZA ITALIA": "Forza Italia",
  "FRATELLI D'ITALIA CON GIORGIA_camera": "Fratelli d'Italia",
  "FRATELLI D'ITALIA CON GIORGIA_senato": "Fratelli d'Italia",
  "FRATELLI D'ITALIA CON GIORGIA": "Fratelli d'Italia",
  "IMPEGNO CIVICO LUIGI DI MAIO -_camera": "Impegno Civico",
  "IMPEGNO CIVICO LUIGI DI MAIO -_senato": "Impegno Civico",
  "IMPEGNO CIVICO LUIGI DI MAIO -": "Impegno Civico",
  "ITALEXIT PER L'ITALIA_camera": "ItalExit",
  "ITALEXIT PER L'ITALIA_senato": "ItalExit",
  "ITALEXIT PER L'ITALIA": "ItalExit",
  "ITALIA SOVRANA E POPOLARE_camera": "Italia Sovrana e Popolare",
  "ITALIA SOVRANA E POPOLARE_senato": "Italia Sovrana e Popolare",
  "ITALIA SOVRANA E POPOLARE": "Italia Sovrana e Popolare",
  "LEGA PER SALVINI PREMIER_camera": "Lega",
  "LEGA PER SALVINI PREMIER_senato": "Lega",
  "LEGA PER SALVINI PREMIER": "Lega",
  "MASTELLA NOI DI CENTRO EUROPEI_camera": "Noi di Centro Europei",
  "MASTELLA NOI DI CENTRO EUROPEI_senato": "Noi di Centro Europei",
  "MASTELLA NOI DI CENTRO EUROPEI": "Noi di Centro Europei",
  "MOVIMENTO 5 STELLE_camera": "Movimento 5 Stelle",
  "MOVIMENTO 5 STELLE_senato": "Movimento 5 Stelle",
  "MOVIMENTO 5 STELLE": "Movimento 5 Stelle",
  "NOI MODERATI/LUPI - TOTI - BRU_camera": "Noi Moderati",
  "NOI MODERATI/LUPI - TOTI - BRU_senato": "Noi Moderati",
  "NOI MODERATI/LUPI - TOTI - BRU": "Noi Moderati",
  "PARTITO DEMOCRATICO - ITALIA D_camera": "Partito Democratico",
  "PARTITO DEMOCRATICO - ITALIA D_senato": "Partito Democratico",
  "PARTITO DEMOCRATICO - ITALIA D": "Partito Democratico",
  "UNIONE POPOLARE CON DE MAGISTR_camera": "Unione Popolare",
  "UNIONE POPOLARE CON DE MAGISTR_senato": "Unione Popolare",
  "UNIONE POPOLARE CON DE MAGISTR": "Unione Popolare",
};

party_color_dict = {
  "+ Europa": "#FFD600",
  "Alleanza Verdi e Sinistra": "#B71C1C",
  "Azione - Italia Viva - Calenda": "#1565C0",
  "Forza Italia": "#303F9F",
  "Fratelli d'Italia": "#303F9F",
  "Impegno Civico": "#009688",
  ItalExit: "#366A9F",
  "Italia Sovrana e Popolare": "#BF360C",
  Lega: "#283593",
  "Noi di Centro Europei": "#880E4F",
  "Movimento 5 Stelle": "#FFAB00",
  "Noi Moderati": "#880E4F",
  "Partito Democratico": "#D50000",
  "Unione Popolare": "#4A148C",
};

function findMostVotedParty(d) {
  let party_votes = Object.entries(d.properties);
  party_votes = parties.map((f) =>
    party_votes.find((e) => e[0] === `${f}_${chamber}`)
  );

  let most_voted_party = party_votes.reduce((a, b) => (a[1] > b[1] ? a : b));
  most_voted_party = party_dict[most_voted_party[0]];
  return most_voted_party;
}

let party,
  party_ext = undefined;
party = party != undefined ? party : party_dict[parties[0]];
party_ext = party_ext != undefined ? party_ext : parties[0];



function appendPartyOptions() {
  let party_input = inputs.append("div").attr("class", "party_input");

  party_input.append("legend").attr("for", "party").text("Partito");
  party_input = party_input
    .append("select")
    .attr("name", "party")
    .text("Partito");

  let option_party = party_input
    .selectAll("option")
    .data(parties)
    .enter()
    .append("option");

  option_party
    .attr("value", (d) => d)

  party_input
    .on("change", function () {
      party_ext = this.value;
      party = party_dict[this.value];
      draw_map();
    });

  option_party
    .append("label")
    .attr("for", (d) => d)
    .text((d) => party_dict[d]);
}

function assignColor(d, affluenza_color, voti_color) {
  if (view === "all") {
    return party_color_dict[findMostVotedParty(d)];
  } else if (view === "par") {
    if (
      d.properties[`${party}_${chamber}`] /
        d.properties[`Votanti_${chamber}`] ==
        Infinity ||
      d.properties[`${party}_${chamber}`] /
        d.properties[`Votanti_${chamber}`] ==
        NaN ||
      d.properties[`${party}_${chamber}`] / d.properties[`Votanti_${chamber}`] >
        1
    ) {
      return "#E2E2E2";
    }
    voti =
      d.properties[`${party_ext}_${chamber}`] /
      d.properties[`Votanti_${chamber}`];

    return voti_color(voti);
  } else if (view === "aff") {
    if (
      d.properties[`Votanti_${chamber}`] /
        d.properties[`Elettori_${chamber}`] ==
        Infinity ||
      d.properties[`Votanti_${chamber}`] / d.properties[`Elettori_${chamber}`] >
        1
    ) {
      return "#E2E2E2";
    }
    affluenza =
      d.properties[`Votanti_${chamber}`] / d.properties[`Elettori_${chamber}`];

    return affluenza_color(affluenza);
  }
}


function appendInfo(d) {
  d3.select("#info").selectAll("*").remove();
  let info = d3.select("#info");
  let general_info = info.append("div").attr("class", "general_info");

  general_info_wrapper = general_info
    .append("div")
    .attr("class", "general_info_wrapper");

  general_info_text = general_info_wrapper
    .append("div")
    .attr("class", "general_info_text");

  general_info_text.append("h3").text(`Sezione ${d.properties["Sezione"]}`);

  general_info_text
    .append("p")
    .text(`Elettori: ${d.properties[`Elettori_${chamber}`]}`);

  general_info_text
    .append("p")
    .text(`Votanti: ${d.properties[`Votanti_${chamber}`]}`);

  affluenza =
    d.properties[`Votanti_${chamber}`] / d.properties[`Elettori_${chamber}`] ==
    Infinity
      ? "n/a"
      : d.properties[`Votanti_${chamber}`] /
          d.properties[`Elettori_${chamber}`] >
        1
      ? "n/a"
      : `${Math.round(
          (d.properties[`Votanti_${chamber}`] /
            d.properties[`Elettori_${chamber}`]) *
            100
        )}%`;

  general_info_text.append("p").text(`Affluenza: ${affluenza}`);

  general_info_text.append("hr");

  affluenza_checkbox = general_info_text
    .append("div")
    .attr("class", "show_affluenza");

  affluenza_checkbox
    .append("label")
    .attr("for", "show_affluenza")
    .text("Includi Astenuti");

  affluenza_checkbox
    .append("input")
    .attr("type", "checkbox")
    .attr("id", "show_affluenza")
    .attr("name", "show_affluenza")
    .attr("value", "show_affluenza")
    .property("checked", include_affluenza)
    .on("click", function () {
      include_affluenza = !include_affluenza;
      draw_donut(d, general_info_wrapper);
    });

    draw_donut(d, general_info_wrapper);
}



  function draw_donut(d, general_info_wrapper) {
    general_info_wrapper.selectAll(".donut_wrapper").remove();

    const donut_height = 175;
    const donut_width = 175;
    const donut_margin = 12;
    const radius = Math.min(donut_width, donut_height) / 2 - donut_margin;

    let donut_svg = general_info_wrapper
      .append("div")
      .attr("class", "donut_wrapper")
      .append("svg")
      .attr("width", donut_width)
      .attr("height", donut_height)
      .append("g")
      .attr(
        "transform",
        "translate(" + donut_width / 2 + "," + donut_height / 2 + ")"
      );

    let pie = d3.pie().value(function (d) {
      return d[1];
    });

    let get_pie_data = function (d, include_affluenza) {
      let pie_data = Object.entries(d.properties).filter((f) => {
        item_party = f[0].split("_")[0];
        item_chamber = f[0].split("_")[1];
        return parties.includes(item_party) && item_chamber === chamber;
      });
      if (include_affluenza) {
        pie_data.push([
          "Astenuti",
          d.properties[`Elettori_${chamber}`] -
            d.properties[`Votanti_${chamber}`] <
          0
            ? 0
            : d.properties[`Elettori_${chamber}`] -
              d.properties[`Votanti_${chamber}`],
        ]);
      }
      return pie_data;
    };

    let data_ready = pie(get_pie_data(d, include_affluenza));


    donut_svg
      .selectAll("path")
      .data(data_ready)
      .enter()
      .append("path")
      .attr(
        "d",
        d3
          .arc()
          .innerRadius(radius * 0.382)
          .outerRadius(radius)
      )
      .attr("fill", function (f) {
        return party_color_dict[party_dict[f.data[0].split("_")[0]]];
      })
      .attr("stroke", "white")
      .attr("stroke-endcap", "round")
      .style("stroke-width", "1px")
      .style("opacity", 0.8)
      .on("mouseover", function (e, f) {
        d3.select(this).style("opacity", 1);

        let tooltip = d3.select("body").append("div").attr("class", "tooltip");

        tooltip
          .style("left", e.pageX + 10 + "px")
          .style("top", e.pageY - 25 + "px")
          .append("div");

        function get_party_name(party) {
          if (party === "Astenuti") {
            return "Astenuti";
          } else {
            return party_dict[party.split("_")[0]];
          }
        }

        tooltip
          .append("div")
          .attr("class", "tooltip_party")
          .text(get_party_name(f.data[0]));

        function formatPercentage(f) {
          if (!include_affluenza) {
            return `${Math.round(
              (f.data[1] / d.properties[`Votanti_${chamber}`]) * 100
            )}%`;
          } else {
            return `${Math.round(
              (f.data[1] / d.properties[`Elettori_${chamber}`]) * 100
            )}%`;
          }
        }

        tooltip
          .append("div")
          .attr("class", "tooltip_percentage")
          .text(formatPercentage(f));
      })
      .on("mouseleave", function (d) {
        d3.select(this).style("opacity", 0.8);
        d3.selectAll(".tooltip").remove();
      });
  }

let include_affluenza = false;
draw_map();

window.addEventListener("resize", () => {
  width = window.innerWidth;
  height = window.innerHeight;
  d3.select('#map').selectAll("svg").remove();
  draw_map();
})

let about_visible = false;
let about = d3.select("body")
  .append("div")
  .attr("id", "about")
  
about.append("h3").text("About")
about.append("a").attr("href", "")
