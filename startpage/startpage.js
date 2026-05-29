const banner = document.getElementById("banner");

const konachanReq = await fetch("https://antix1.transaero.space/api/", {
    method: "GET",
    headers: {
        "x-api-key": "my_super_duper_mega_ultra_secure_API_key",
    },
});

//Cross-Origin Request Blocked: The Same Origin Policy disallows reading the remote resource at https://konachan.net/post.json?tags=vote%3A3%3AratGirlHeather+limit%3A1+order%3Arandom. (Reason: CORS header ‘Access-Control-Allow-Origin’ missing). Status code: 200.
//Error loading json: TypeError: NetworkError when attempting to fetch resource.

const bannerSrc = konachanReq.json();
banner.src = bannerSrc;
