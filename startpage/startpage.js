const banner = document.getElementById("banner");

const konachanReq = await fetch("https://antix1.transaero.space/api/", {
    method: "GET",
    headers: {
        "x-api-key": "my_super_duper_mega_ultra_secure_API_key",
    },
});
const bannerSrc = await konachanReq.json();
banner.crossOrigin = "anonymous";
banner.referrerPolicy = "no-referrer";
banner.src = bannerSrc;

banner.onerror = () => {
    console.error("Failed to load image");
};
