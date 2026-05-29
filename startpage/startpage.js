const banner = document.getElementById("banner");

const konachanReq = await fetch("https://antix1.transaero.space/api/", {
    method: "GET",
    headers: {
        "x-api-key": "my_super_duper_mega_ultra_secure_API_key",
    },
});

const bannerSrc = await konachanReq.json();

async function resolveImage(url) {
    const r = await fetch(url, { redirect: "follow" });

    if (!r.ok) {
        throw new Error(`HTTP ${r.status}`);
    }

    return r.url;
}

banner.src = await resolveImage(bannerSrc);
