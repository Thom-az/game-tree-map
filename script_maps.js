window.onload = () => {
  fetch('http://localhost:3000/api/multiquery')
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    })
    .then(data => {
      console.log('Parsed data:', data);
      createTreeMap(data);
    })
    .catch(err => {
      console.error('Error fetching data:', err);
    });
};

let currentData = [];
let svg;
let width, height;

function createTreeMap(data) {
  width = document.querySelector("#treeMap").clientWidth;
  height = 500; 

  svg = d3.select("#treeMap")
    .append("svg")
    .attr("width", "100%")
    .attr("height", height);

  const totalCount = d3.sum(data, d => d.count);
  currentData = data;

  const root = d3.hierarchy({ values: data }, d => d.values)
    .sum(d => d.count)
    .sort((a, b) => b.count - a.count);

  d3.treemap()
    .size([width, height])
    .padding(1)
    (root);

  const colorScale = d3.scaleLinear()
    .domain([0, d3.max(data, d => d.count)])
    .range(["#d3d3d3", "#9146FF"]); 

  const cell = svg.selectAll("g")
    .data(root.leaves())
    .enter().append("g")
    .attr("transform", d => `translate(${d.x0},${d.y0})`)
    .on("click", handleClick)
    .on("mouseover", handleMouseOver)
    .on("mouseout", handleMouseOut);

  cell.append("rect")
    .attr("width", d => d.x1 - d.x0)
    .attr("height", d => d.y1 - d.y0)
    .attr("fill", d => colorScale(d.data.count))
    .attr("rx", 5) 
    .attr("ry", 5); 

  cell.append("text")
    .attr("x", 3)
    .attr("y", 13)
    .text(d => {
      const percent = ((d.data.count / totalCount) * 100).toFixed(1);
      return `${d.data.name}\n${percent}%`;
    })
    .attr("font-size", "10px")
    .attr("fill", "white");

  function handleMouseOver(event, d) {
    const tooltip = d3.select("#tooltip");
    const percent = ((d.data.count / totalCount) * 100).toFixed(1);
    tooltip
      .style("left", (event.pageX + 10) + "px")
      .style("top", (event.pageY - 28) + "px")
      .html(`<strong>${d.data.name}</strong><br>Number of games: ${d.data.count}<br>Percentage: ${percent}%`)
      .classed("visible", true);
  }

  function handleMouseOut() {
    d3.select("#tooltip").classed("visible", false);
  }

  function handleClick(event, d) {
    const platformId = d.data.id;
    if (platformId) {
      fetchGamesByPlatform(platformId);
    } else {
      console.error('Platform ID is undefined');
    }
  }

  function fetchGamesByPlatform(platformId) {
    fetch(`http://localhost:3000/api/games/platform/${platformId}`)
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then(data => {
        console.log('Games for platform:', data);
        d3.select("#backButton").style("display", "block");
        updateGameDetails(data);
      })
      .catch(err => {
        console.error('Error fetching game details:', err);
      });
  }

  function updateGameDetails(games) {
    d3.select("#details").html("");

    const topGames = games.slice(0, 10);

    const ul = d3.select("#details").append("ul");
    ul.selectAll("li")
      .data(topGames)
      .enter()
      .append("li")
      .text(d => `${d.name} (${d.platforms.map(p => p.name).join(", ")})`);
  }

  d3.select("#backButton").on("click", () => {
    d3.select("#details").html("");
    d3.select("#backButton").style("display", "none");
    createTreeMap(currentData);
  });
}
