const BASE_URL = "https://otruyenapi.com/v1/api";
const CDN_IMAGE = "https://img.otruyenapi.com";
const HOST = "https://otruyen.cc";

function extractSlug(url) {
  var slug = url;
  var idx = url.indexOf("/truyen-tranh/");
  if (idx >= 0) slug = url.substring(idx + 14);
  slug = slug.replace(/^\/|\/$/g, "");
  if (slug.indexOf("http") === 0) {
    var parts = slug.split("/");
    slug = parts[parts.length - 1];
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
    data.push({
      name: item.name,
      link: "/truyen-tranh/" + item.slug,
      host: HOST,
      cover: resolveThumb(item.thumb_url, cdnImage),
      description: joinArray(item.origin_name),
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

function stripHtml(html) {
  if (!html) return "";
  return html.replace(/<[^>]*>/g, "")
             .replace(/&amp;/g, "&")
             .replace(/&lt;/g, "<")
             .replace(/&gt;/g, ">")
             .replace(/&quot;/g, '"')
             .replace(/&#039;/g, "'")
             .replace(/&nbsp;/g, " ")
             .trim();
}

var STATUS_MAP = { "ongoing": "Đang phát hành", "completed": "Hoàn thành" };

function slugifyVN(str) {
  if (!str) return "";
  var result = str.toLowerCase()
    .replace(/[àáạảãâầấậẩẫăằắặẳẵ]/g, "a")
    .replace(/[èéẹẻẽêềếệểễ]/g, "e")
    .replace(/[ìíịỉĩ]/g, "i")
    .replace(/[òóọỏõôồốộổỗơờớợởỡ]/g, "o")
    .replace(/[ùúụủũưừứựửữ]/g, "u")
    .replace(/[ỳýỵỷỹ]/g, "y")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return result;
}
