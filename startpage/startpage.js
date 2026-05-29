const banner = document.getElementById("banner");

const konachanReq = await fetch("https://antix1.transaero.space/api/", {
    method: "GET",
    headers: {
        "x-api-key": "my_super_duper_mega_ultra_secure_API_key",
    },
});
//const bannerSrc = await konachanReq.json();

const bannerSrc =
    "https://konachan.com/image/ebea2d81b61b1ddbb8faaeb73c4513da/Konachan.com%20-%20366929%20armor%20blonde_hair%20blue_eyes%20car%20chii%20chobits%20choker%20corset%20cross%20dress%20gloves%20goth-loli%20headdress%20long_hair%20necklace%20thighhighs%20vinne%20white.png";
banner.crossOrigin = "anonymous";
banner.referrerPolicy = "no-referrer";
banner.src = bannerSrc;

banner.onerror = () => {
    console.error("Failed to load image");
};
