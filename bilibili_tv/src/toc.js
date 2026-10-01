load("config.js");
function execute(url) {
  var r=fetch(url,FETCH_OPTIONS); if(!r||!r.ok)return Response.error("Không tải được danh sách tập");
  var html=r.text(), season=extractSeasonId(url), ids=[], m, p=/episode_id\s*:\s*"?(\d+)"?/g;
  while((m=p.exec(html))!==null){if(ids.indexOf(m[1])<0)ids.push(m[1]);}
  var out=[]; for(var i=0;i<ids.length;i++)out.push({name:"Tập "+(i+1),url:BASE_URL+"/vi/play/"+season+"/"+ids[i],host:BASE_URL});
  return Response.success(out);
}
