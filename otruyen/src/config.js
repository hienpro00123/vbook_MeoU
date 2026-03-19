const BASE_URL = "https://otruyenapi.com/v1/api";
const CDN_IMAGE = "https://img.otruyenapi.com";
const HOST = "https://otruyen.cc";

function extractSlug(url) {
  var slug = url;
  var idx = url.indexOf("/truyen-tranh/");
  if (idx >= 0) slug = url.substring(idx + 14);
  slug = slug.replace(/^\/|\/$/g, "");
  if (slug.indexOf("http") === 0) {
    slug = slug.substring(slug.lastIndexOf("/") + 1);
  }
  return slug;
}

function resolveThumb(thumb, cdnImage) {
  if (!thumb) return "";
  return thumb.indexOf("http") === 0 ? thumb : cdnImage + "/uploads/comics/" + thumb;
}

function joinArray(val) {
  if (!val || !val.length) return "";
  return Array.isArray(val) ? val.join(", ") : val;
}

function parseItems(items, cdnImage) {
  var data = [];
  if (!items) return data;
  for (var i = 0; i < items.length; i++) {
    var item = items[i];
    if (!item || !item.slug) continue;
    var on = item.origin_name;
    data.push({
      name: item.name || "(Không tên)",
      link: "/truyen-tranh/" + item.slug,
      host: HOST,
      cover: resolveThumb(item.thumb_url, cdnImage),
      description: (!on || !on.length) ? "" : Array.isArray(on) ? on.join(", ") : on,
    });
  }
  return data;
}

function calcNextPage(pagination) {
  if (!pagination) return null;
  var current = pagination.currentPage;
  var total = Math.ceil(pagination.totalItems / pagination.totalItemsPerPage);
  return current < total ? String(current + 1) : null;
}

function parseGenres(items) {
  var genres = [];
  if (!items) return genres;
  for (var i = 0; i < items.length; i++) {
    genres.push({ title: items[i].name, input: items[i].slug, script: "genrecontent.js" });
  }
  return genres;
}

var _ENTITY = { amp: "&", lt: "<", gt: ">", quot: '"', "#039": "'", nbsp: " " };

function stripHtml(html) {
  if (!html) return "";
  return html.replace(/<[^>]*>/g, "")
             .replace(/&([^;]+);/g, function(m, e) { return _ENTITY[e] || m; })
             .trim();
}

var STATUS_MAP = { "ongoing": "Đang phát hành", "completed": "Hoàn thành" };

var _SLG_A = /[àáạảãâầấậẩẫăằắặẳẵ]/g;
var _SLG_E = /[èéẹẻẽêềếệểễ]/g;
var _SLG_I = /[ìíịỉĩ]/g;
var _SLG_O = /[òóọỏõôồốộổỗơờớợởỡ]/g;
var _SLG_U = /[ùúụủũưừứựửữ]/g;
var _SLG_Y = /[ỳýỵỷỹ]/g;
var _SLG_D = /đ/g;
var _SLG_NON = /[^a-z0-9\s]/g;
var _SLG_SPC = /\s+/g;
var _SLG_DASH = /-+/g;
var _SLG_TRIM = /^-|-$/g;

function slugifyVN(str) {
  if (!str) return "";
  return str.toLowerCase()
    .replace(_SLG_A, "a").replace(_SLG_E, "e").replace(_SLG_I, "i")
    .replace(_SLG_O, "o").replace(_SLG_U, "u").replace(_SLG_Y, "y")
    .replace(_SLG_D, "d").replace(_SLG_NON, "").replace(_SLG_SPC, "-")
    .replace(_SLG_DASH, "-").replace(_SLG_TRIM, "");
}

function fetchRetry(url, options) {
  var r = options ? fetch(url, options) : fetch(url);
  if (r.ok) return r;
  // Không retry lỗi client (4xx) — chỉ retry lỗi mạng / server
  if (r.status >= 400 && r.status < 500) return r;
  return options ? fetch(url, options) : fetch(url);
}
