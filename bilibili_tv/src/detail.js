load("config.js");
function execute(url) {
  var r=fetch(url,FETCH_OPTIONS); if(!r||!r.ok)return Response.error("Không tải được video");
  var d=Html.parse(r.text()), title=d.select("meta[property='og:title']").attr("content"), cover=d.select("meta[property='og:image']").attr("content"), desc=d.select("meta[name='description']").attr("content");
  return Response.success({name:title||"BiliBili Anime",cover:cover||"",host:BASE_URL,type:"video",format:"series",author:"BiliBili",description:desc||"",detail:"Anime",ongoing:true});
}
