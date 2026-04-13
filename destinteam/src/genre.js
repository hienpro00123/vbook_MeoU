var GENRES = [
    { title: "Fantasy", input: "fantasy", script: "genrecontent.js" },
    { title: "Cao H", input: "cao-h", script: "genrecontent.js" },
    { title: "Bối cảnh hiện đại", input: "boi-canh-hien-dai", script: "genrecontent.js" },
    { title: "Bối cảnh học đường", input: "boi-canh-hoc-duong", script: "genrecontent.js" },
    { title: "Bối cảnh phương Tây", input: "boi-canh-phuong-tay", script: "genrecontent.js" },
    { title: "Công chiếm hữu", input: "cong-chiem-huu", script: "genrecontent.js" },
    { title: "Công chung tình", input: "cong-chung-tinh", script: "genrecontent.js" },
    { title: "Niên hạ công", input: "nien-ha-cong", script: "genrecontent.js" },
    { title: "Niên thượng thụ", input: "nien-thuong-thu", script: "genrecontent.js" },
    { title: "Omegaverse", input: "omegaverse", script: "genrecontent.js" },
    { title: "Đam Mỹ", input: "dam-my", script: "genrecontent.js" },
    { title: "Hài hước", input: "hai-huoc-comedy", script: "genrecontent.js" }
];

function execute() {
    return Response.success(GENRES);
}