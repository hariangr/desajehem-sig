const mappa = new Mappa("Leaflet");

const baseSheet = "https://sheets.googleapis.com/v4/spreadsheets/1qM0BKuyzatI_v2LJr4tgo0Nl5cAlVl1850KmoDhnVco/values"
const apiKey = "AIzaSyAA4WB41zB6JjoxoK9cB7qK-rtkbQsqpss"

const defaultColor = "#007bff";
const NUM_POSSIBLE_HUE = 360; // 6digit hexadecimal color

const TANPA_KATEGORI = "Tanpa Kategori"
const TANPA_BANJAR = "Tanpa Wilayah"

let canvas;
let width;
let height;

let regionAreas;
let categoryHierarchy;
let categoryCounter = {};
let banjarCounter = {};
const showAllCategoryDefault = true;
let categoryToShow = [];
let poiAll = [];
let itemsToShow = [];
let colorCategory = {};
let colorJalan = {}
let jalanToShow = [];

let isLoading = true;

/** Color */
// input: h in [0,360] and s,v in [0,1] - output: r,g,b in [0,1]
function hslToHex(h, s, l) {
  l /= 100;
  const a = s * Math.min(l, 1 - l) / 100;
  const f = n => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, '0');   // convert to Hex and prefix "0" if needed
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

function generateEnoughCatColor(allCategory) {
  const diff = NUM_POSSIBLE_HUE / (allCategory.length + 2) // +2 karena ada 'tanpa-kategori' dan just to be safe lagi satu

  for (let i = 0; i < allCategory.length; i++) {
    const it = allCategory[i];
    const colorNumber = Math.floor(diff * (i + 1))
    const color = hslToHex(colorNumber, 50, 50)
    colorCategory[it.Nama] = color
  }
  colorCategory[TANPA_KATEGORI] = hslToHex(0, 50, 50)
  colorCategory[TANPA_BANJAR] = hslToHex(0, 50, 50)  // Just error fix hack
}

function generateEnoughJalanColor(jalanAll) {
  const diff = NUM_POSSIBLE_HUE / jalanAll.length

  for (let i = 0; i < jalanAll.length; i++) {
    const it = jalanAll[i];
    const colorNumber = Math.floor(diff * (jalanAll.length - i))
    const color = hslToHex(colorNumber, 60, 60)
    colorJalan[it.Nama] = color
  }
}
/** End Color */


/** Action */
document.getElementById("btn-check").addEventListener("click", () => {
  let els = document.querySelectorAll(".categoryandbanjar");
  for (it of els) {
    it.checked = true;
    if (it.classList.contains("jalanCb")) {
      jalanToShow.push(it.id)
    } else {
      categoryToShow.push(it.id);
    }
  }
  refreshItemsToShow()
})
document.getElementById("btn-uncheck").addEventListener("click", () => {
  let els = document.querySelectorAll(".categoryandbanjar");
  for (it of els) {
    it.checked = false;
  }
  categoryToShow = []
  jalanToShow = []
  refreshItemsToShow()
})
/** End Action */

const options = {
  lat: -8.4327307,
  lng: 115.3687399,
  zoom: 13,
  style: "http://{s}.tile.osm.org/{z}/{x}/{y}.png",
};

function refreshItemsToShow() {
  itemsToShow = [];
  itemsToShow = poiAll.filter((v, i) => {
    // return true // TODO: HAPUS

    if (
      // v.Kategori &&
      // v.Wilayah &&
      categoryToShow.includes(v.Kategori) &&
      categoryToShow.includes(v.Wilayah)
    ) {
      return true;
    }

    // if (
    //   v.Kategori &&
    //   v.Wilayah == null &&
    //   categoryToShow.includes(v.category.id) &&
    //   categoryToShow.includes(TANPA_BANJAR)
    // ) {
    //   return true;
    // }

    // if (
    //   v.Kategori == null &&
    //   v.Wilayah &&
    //   categoryToShow.includes(TANPA_KATEGORI) &&
    //   categoryToShow.includes(v.Wilayah)
    // ) {
    //   return true;
    // }

    // if (
    //   v.Kategori &&
    //   v.Wilayah &&
    //   categoryToShow.includes(v.Kategori) &&
    //   categoryToShow.includes(v.Wilayah)
    // ) {
    //   return true;
    // }

    return false;
  });
}

function onclickCheckbox(params) {
  const checked = params.target.checked;
  if (checked) {
    // Become checked
    if (params.target.classList.contains("jalanCb")) {
      jalanToShow.push(params.target.id)
    } else {
      categoryToShow.push(params.target.id);
    }
  } else {
    if (params.target.classList.contains("jalanCb")) {
      jalanToShow.splice(jalanToShow.indexOf(params.target.id), 1);
    } else {
      categoryToShow.splice(categoryToShow.indexOf(params.target.id), 1);
    }
  }


  refreshItemsToShow();
}

function mouseClicked() {
  ellipse(mouseX, mouseY, 300, 300);

  for (let i = 0; i < itemsToShow.length; i++) {
    const it = itemsToShow[i];
    if (!it.drawn || !it.drawn.x || !it.drawn.y) {
      continue
    }

    const _d = dist(mouseX, mouseY, it.drawn.x, it.drawn.y);

    if (_d <= it.drawn.hb) {
      var modal = document.getElementById("myModal");
      // Get the <span> element that closes the modal
      var span = document.getElementsByClassName("close")[0];

      // When the user clicks on the button, open the modal
      modal.style.display = "block";

      // When the user clicks on <span> (x), close the modal
      span.onclick = function () {
        modal.style.display = "none";
      };

      // When the user clicks anywhere outside of the modal, close it
      window.onclick = function (event) {
        if (event.target == modal) {
          modal.style.display = "none";
        }
      };

      const modalDetail = document.getElementById("modal-detail");
      if (it.Deskripsi && it.Deskripsi.length > 0) {
        var md = window.markdownit();
        fullContent = md.render(it.Deskripsi);
        // modalDetail.innerHTML = "";
        modalDetail.innerHTML = fullContent;

        var hrEl = document.createElement("hr");
        modalDetail.prepend(hrEl);
      } else {
        modalDetail.innerHTML = "";
      }

      var titleEl = document.createElement("h3");
      titleEl.innerText = it.Nama ?? 'Tanpa Nama';

      var kategoriEl = document.createElement("h6");
      if (it.Kategori) {
        kategoriEl.innerHTML = "<span>Kategori:</span> " + it.Kategori;
      } else {
        kategoriEl.innerHTML = "<span>Kategori:</span> Tanpa Kategori";
      }

      var banjarEl = document.createElement("h6");
      if (it.Wilayah) {
        banjarEl.innerHTML = "<span>Wilayah:</span> " + it.Wilayah;
      } else {
        banjarEl.innerHTML = "<span>Wilayah:</span> -";
      }

      var latlngEl = document.createElement("h6");
      let directionEl = document.createElement("a")
      if (it.Lat && it.Lon) {
        latlngEl.innerHTML = "<span>Lat Lon:</span> " + it.Lat + ", " + it.Lon;
        directionEl.text = "Direction"
        directionEl.href = "https://www.google.com/maps/dir/?api=1&destination=" + it.Lat + "," + it.Lon
      } else {
        latlngEl.innerHTML = "<span>Lat Lon:</span> Belum ditambahkan";
      }

      modalDetail.prepend(directionEl);
      modalDetail.prepend(latlngEl);
      modalDetail.prepend(banjarEl);
      modalDetail.prepend(kategoriEl);
      modalDetail.prepend(titleEl);

      // prevent default
      return true;
    }
  }
}

function appendCheckbox(id, text, level, subs, containerId, color) {
  var _cb = document.createElement("INPUT");
  _cb.setAttribute("type", "checkbox");
  _cb.setAttribute("id", id);
  _cb.classList.add("categoryandbanjar")
  if (showAllCategoryDefault) _cb.defaultChecked = true;
  _cb.addEventListener("click", onclickCheckbox);

  if (containerId == 'jalanCont') {
    _cb.classList.add("jalanCb")
    _cb.defaultChecked = false;
  }

  var _label = document.createElement("label");
  _label.setAttribute("for", id);
  _label.innerText = text;

  var _cont = document.createElement("div");
  _cont.appendChild(_cb);
  _cont.appendChild(_label);
  _cont.classList.add(`level${level}hierarchy`);

  // Counternya
  var _count = document.createElement("span");
  if (id == TANPA_KATEGORI) {
    _count.innerText = " (" + categoryCounter[TANPA_KATEGORI] + ")";
  } else if (id == TANPA_BANJAR) {
    _count.innerText = " (" + banjarCounter[TANPA_BANJAR] + ")";
  } else if (Object.keys(categoryCounter).includes(id)) {
    _count.innerText = " (" + categoryCounter[id] + ")";
  } else if (Object.keys(banjarCounter).includes(id)) {
    _count.innerText = " (" + banjarCounter[id] + ")";
  } else if (containerId == "jalanCont") {

  } else {
    _cont.classList.add("line-through");
    _label.classList.add("line-through");
  }
  _cont.appendChild(_count);

  // Color Indikatornya
  var _colorInd = document.createElement("div");
  _colorInd.classList.add(`colorIndicator`);
  if (color) {
    _colorInd.style["background-color"] = color;
  } else {
    _colorInd.style["background-color"] = defaultColor;
  }
  if (containerId != "banjarHierarchy") {
    _cont.appendChild(_colorInd);
  }

  document.getElementById(containerId).appendChild(_cont);

  if (subs) {
    createCheckboxes(level + 1, subs, "catHierarchy");
  }
}

function createCheckboxes(level, cats, containerId, uncategorized) {
  if (uncategorized) {
    appendCheckbox(
      uncategorized.No,
      uncategorized.Nama,
      level,
      uncategorized.Subs,
      containerId,
      colorCategory[uncategorized.Nama]
    );

    if (showAllCategoryDefault) categoryToShow.push(uncategorized.Nama);
  }
  for (const it of cats) {
    let _color = "#ff0000";
    // if (it.color) _color = it.color;

    if (containerId == 'catHierarchy') {
      _color = colorCategory[it.Nama]
    }
    if (containerId == 'jalanCont') {
      _color = colorJalan[it.Nama]
    }

    appendCheckbox(it.Nama, it.Nama, level, it.Subs, containerId, _color);
    if (showAllCategoryDefault) categoryToShow.push(it.Nama);
  }

  refreshItemsToShow();
}

function transformToObject(data) {
  const [header, ...rest] = data

  const output = []
  for (let i = 0; i < rest.length; i++) {
    const d = {}
    for (let keyI = 0; keyI < header.length; keyI++) {
      const key = header[keyI]
      d[key] = rest[i][keyI]
    }
    output.push(d)
  }
  return output
}

async function authenticatedGet(endpoint) {
  return fetch(`${endpoint}?key=${apiKey}`)
}

async function preload() {
  async function loadRegionArea() {
    const regionRes = (await (await authenticatedGet(baseSheet + "/Wilayah!A:B")).json()).values
    regionAreas = transformToObject(regionRes)
  }

  async function loadBanjars() {
    const getBanjars = await authenticatedGet(baseSheet + "/Wilayah Bagian!A:B")
    banjarAll = transformToObject((await getBanjars.json()).values);
    banjarAll = banjarAll.filter((v) => v.Nama != "-")
  }

  async function loadJalan() {
    const getJalan = await authenticatedGet(baseSheet + "/Jalan!A:D")
    jalanAll = transformToObject((await getJalan.json()).values);
    generateEnoughJalanColor(jalanAll);
  }

  async function loadRelevants() {
    const getRelevants = await authenticatedGet(baseSheet + "/Relevant!A:B")
    relevantAll = transformToObject((await getRelevants.json()).values);

    const cont = document.getElementById("relevanceCont");

    for (const it of relevantAll) {
      try {
        var link = document.createElement("a");
        link.setAttribute("href", it.Link);
        link.classList.add("relevanceLink");
        link.innerText = it.Nama;
        cont.appendChild(link)
      } catch (error) {

      }
    }

  }

  async function loadCategory() {
    const getCategories = await authenticatedGet(baseSheet + "/Kategori!A:B")
    catAll = transformToObject((await getCategories.json()).values);
    catAll = catAll.filter((v) => v.Nama != '-')
    generateEnoughCatColor(catAll)

    // Root level
    const rootLevel = catAll.filter((v) => !v['Parent'])
    // Level 1
    for (const cat in rootLevel) {
      rootLevel[cat]['Subs'] = catAll.filter((v) => v['Parent'] && v['Parent'] === rootLevel[cat]['Nama'])
    }

    const getPoi = await authenticatedGet(baseSheet + "/POI!A:G")
    poiAll = transformToObject((await getPoi.json()).values);
    poiAll = poiAll.filter((v) => {
      return v.Nama && v.Lat && v.Lon
    })
    for (let i = 0; i < poiAll.length; i++) {
      const it = poiAll[i];
      if (it.Kategori == '' || it.Kategori == '-' || !it.Kategori) {
        poiAll[i].Kategori = TANPA_KATEGORI
      }
      if (it.Wilayah == '' || it.Wilayah == '-' || !it.Wilayah) {
        poiAll[i].Wilayah = TANPA_BANJAR
      }

    }

    // categoryHierarchy
    categoryHierarchy = rootLevel


  }

  document
    .getElementById("hamburgerMenu")
    .addEventListener("click", onHamburgerClicked);

  isLoading = true;
  await loadRegionArea()
  await loadBanjars()
  await loadCategory()
  await loadJalan()
  await loadRelevants()


  /** Category counts */
  for (const poi of poiAll) {
    // getHierarchy
    if (Object.keys(categoryCounter).includes(poi["Kategori"])) {
      categoryCounter[poi["Kategori"]]++;
    } else {
      categoryCounter[poi["Kategori"]] = 1;
    }

    if (Object.keys(banjarCounter).includes(poi["Wilayah"])) {
      banjarCounter[poi["Wilayah"]]++;
    } else {
      banjarCounter[poi["Wilayah"]] = 1;
    }
  }


  createCheckboxes(0, banjarAll, "banjarHierarchy", {No: TANPA_BANJAR, Nama: "Tanpa Wilayah"});
  createCheckboxes(0, categoryHierarchy, "catHierarchy", {No: TANPA_KATEGORI, Nama: "Tanpa Kategori"});
  createCheckboxes(0, jalanAll, "jalanCont");

  isLoading = false;
  document.getElementById("loadingIndicator").classList.add("hideLoading");
}

function setup() {
  canvas = createCanvas(window.innerWidth, window.innerHeight);
  canvas.position(0, 0);
  canvas.class("p5canvas");

  trainMap = mappa.tileMap(options);
  trainMap.overlay(canvas);
}

function draw() {
  clear();
  fill(0, 125, 255);
  noStroke();

  if (regionAreas && regionAreas.length > 0) drawRegionAreas();
  if ((itemsToShow && itemsToShow.length > 0) || (jalanToShow && jalanToShow.length > 0)) drawItems();
}

window.onresize = function () {
  var w = window.innerWidth;
  var h = window.innerHeight;
  canvas.size(w, h);
  width = w;
  height = h;
};

function drawItems() {
  stroke(0, 0, 0);
  for (let i = 0; i < itemsToShow.length; i++) {
    const it = itemsToShow[i];
    if (!it.Lat || !it.Lon) {
      continue
    }

    const pix = trainMap.latLngToPixel(it.Lat, it.Lon);
    push();

    if (it.Kategori) {
      fill(colorCategory[it.Kategori]);
    } else {
      // Default category color
      fill(defaultColor);
    }

    ellipse(pix.x, pix.y, 10, 10);
    it.drawn = {
      x: pix.x,
      y: pix.y,
      hb: 15,
    };
    pop();
  }

  push();
  for (const jln of jalanAll) {
    if (jalanToShow.includes(jln.Nama)) {
      try {
        stroke(colorJalan[jln.Nama]);
        strokeWeight(8);
        // stroke(237, 34, 93);

        const polis = jln.Polylines.split('\n')
        for (let i = 1; i < polis.length; i++) {
          const splittedA = polis[i - 1].split(',');
          const splittedB = polis[i].split(',');

          const __latA = splittedA[0]
          const __lonA = splittedA[1]

          const __latB = splittedB[0]
          const __lonB = splittedB[1]

          const pixA = trainMap.latLngToPixel(__latA, __lonA);
          const pixB = trainMap.latLngToPixel(__latB, __lonB);

          line(pixA.x, pixA.y, pixB.x, pixB.y);
        }
      } catch (error) {
        console.warn("Data for jalan " + jln.Nama + " is not valid");
      }
    }
  }
  pop();
}

function drawRegionAreas() {
  push();

  if (regionAreas.hex_color) {
    fill(regionAreas.hex_color);
  } else {
    fill(125, 125, 255, 128);
  }

  beginShape();
  for (const it of regionAreas) {
    const pix = trainMap.latLngToPixel(Number(it.Lat), Number(it.Lon));
    vertex(pix.x, pix.y);
  }
  endShape(p5.CLOSE);

  pop();
}

/* For collapsible tile*/
var coll = document.getElementsByClassName("collapsible");
var i;

for (i = 0; i < coll.length; i++) {
  coll[i].addEventListener("click", function () {
    this.classList.toggle("active");
    var content = this.nextElementSibling;
    if (content.style.display === "none") {
      content.style.display = "block";
    } else {
      content.style.display = "none";
    }
  });
}
