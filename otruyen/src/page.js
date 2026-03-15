load("config.js");

function execute(url) {
  return Response.success([BASE_URL + "/truyen-tranh/" + extractSlug(url)]);
}
